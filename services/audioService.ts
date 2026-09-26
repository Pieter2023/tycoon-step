// The game's one audio engine: a single AudioContext for the whole app, a safety limiter on the
// master, a small room reverb, and two buses — `ui` for interface sounds and `world` for the 3D
// city's soundscape (townAtmosphere.ts). The sounds themselves are in soundDesign.ts.
//
// Browsers only start audio after a click or key press. The engine is built on the first sound
// after one, or on the first press itself when something (the city) is waiting for it. It pauses
// while the tab is hidden and resumes when the tab is shown.
import { createReverb, playUiSound, type UiSound } from './soundDesign';

export type AudioEngine = { ctx: AudioContext; ui: GainNode; world: GainNode; reverb: AudioNode };

let muted = false;
let engine: AudioEngine | null = null;
let unsupported = false;
let lifecycleInstalled = false;
let masterGain: GainNode | null = null;
// The browser's compressor adds its own make-up gain (about +5.7 dB at these settings); the master
// takes it back out, so quiet sounds pass at unity and only peaks near full scale get limited.
const MASTER = .52;
const waiting = new Set<(engine: AudioEngine) => void>();

const hasUserActivation = () => {
  const activation = typeof navigator !== 'undefined' ? navigator.userActivation : undefined;
  return activation ? activation.hasBeenActive : true; // no API (older browsers): try, as before
};

function build(): AudioEngine | null {
  if (engine || unsupported) return engine;
  if (typeof window === 'undefined') return null;
  const AC = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!AC) { unsupported = true; return null; }
  try {
    const ctx = new AC({ latencyHint: 'interactive' });
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10; limiter.knee.value = 4; limiter.ratio.value = 20; limiter.attack.value = .002; limiter.release.value = .15;
    const master = ctx.createGain(); master.gain.value = muted ? 0 : MASTER;
    master.connect(limiter); limiter.connect(ctx.destination);
    const ui = ctx.createGain(); ui.gain.value = 1.7; ui.connect(master);
    const world = ctx.createGain(); world.gain.value = 1.3; world.connect(master);
    const reverb = createReverb(ctx), wet = ctx.createGain(); wet.gain.value = 1.5; reverb.connect(wet); wet.connect(master);
    engine = { ctx, ui, world, reverb };
    masterGain = master;
    // Dev-only QA handle: tap the final output with an AnalyserNode to measure what the player hears.
    if (import.meta.env.DEV) (window as unknown as { __audio?: unknown }).__audio = { engine, output: limiter };
    return engine;
  } catch {
    unsupported = true; // e.g. the test environment's partial mock
    return null;
  }
}

function resume() {
  if (!engine || muted || (typeof document !== 'undefined' && document.hidden)) return;
  if (engine.ctx.state !== 'running') void engine.ctx.resume().catch(() => {});
}

function flushWaiting() {
  if (!waiting.size || muted || !build()) return;
  const ready = engine!;
  for (const cb of [...waiting]) { waiting.delete(cb); cb(ready); }
}

function installLifecycle() {
  if (lifecycleInstalled || typeof window === 'undefined') return;
  lifecycleInstalled = true;
  // Touch activates on release, not on press, so listen to both.
  const unlock = () => { if (!hasUserActivation()) return; flushWaiting(); resume(); };
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'keydown', 'touchend']) window.addEventListener(type, unlock, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!engine) return;
    if (document.hidden) void engine.ctx.suspend().catch(() => {});
    else resume();
  });
}

export const setMuted = (m: boolean) => {
  muted = !!m; installLifecycle();
  if (engine && masterGain) masterGain.gain.setTargetAtTime(muted ? 0 : MASTER, engine.ctx.currentTime, .03);
  if (!muted) { if (hasUserActivation()) flushWaiting(); resume(); }
  // Muted: fade out, then pause the context so it costs nothing.
  else if (engine) { const paused = engine; setTimeout(() => { if (muted) void paused.ctx.suspend().catch(() => {}); }, 150); }
};

/** Runs `cb` with the engine now if audio may start, or on the player's next click or key press.
 *  Returns a cancel function. The city's soundscape starts through this. */
export function whenAudioReady(cb: (engine: AudioEngine) => void): () => void {
  installLifecycle();
  if (!muted && hasUserActivation()) {
    const ready = build();
    if (ready) { resume(); cb(ready); return () => {}; }
    if (unsupported) return () => {};
  }
  waiting.add(cb);
  return () => { waiting.delete(cb); };
}

// Action sounds outrank the toast chime that reports them: a purchase already said "done".
const PRIORITY: Record<UiSound, number> = { click: 0, tick: 0, notification: 1, warning: 1, error: 2, moneyLoss: 2, sell: 2, purchase: 2, moneyGain: 2, achievement: 3, levelUp: 3, victory: 4 };
const lastPlayed = new Map<UiSound, number>();
let lastAction = -Infinity;

function play(name: UiSound, amount = 0) {
  if (muted) return;
  installLifecycle();
  if (!hasUserActivation()) return; // nothing can sound before the first click anyway
  const ready = build(); if (!ready) return;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const since = now - (lastPlayed.get(name) ?? -Infinity);
  if (since < 90) return; // the same sound twice from one handler (a handler and its toast)
  if (PRIORITY[name] === 1 && now - lastAction < 350) return;
  lastPlayed.set(name, now);
  if (PRIORITY[name] >= 2) lastAction = now;
  // Fast autoplay turns a month every 250 ms: repeats of the month sounds play quieter.
  const level = (name === 'tick' || name === 'moneyGain' || name === 'moneyLoss') && since < 700 ? .55 : 1;
  try {
    resume();
    playUiSound({ ctx: ready.ctx, out: ready.ui, send: ready.reverb }, ready.ctx.currentTime + .005, name, amount, level);
  } catch {
    // audio blocked or unavailable: stay silent
  }
}

export const playClick = () => play('click');
export const playTick = () => play('tick');

export const playPurchase = () => play('purchase');
export const playSell = () => play('sell');

export const playMoneyGain = (amount?: number) => play('moneyGain', amount ?? 0);
export const playMoneyLoss = () => play('moneyLoss');

export const playAchievement = () => play('achievement');
export const playLevelUp = () => play('levelUp');
export const playVictory = () => play('victory');

export const playWarning = () => play('warning');
export const playError = () => play('error');
export const playNotification = () => play('notification');
