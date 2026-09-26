// The game's sounds, synthesized with the Web Audio API: no files, downloads or licences.
// Everything here takes any BaseAudioContext, so the same recipes play live (audioService.ts,
// the 3D city's townAtmosphere.ts) and render offline for QA and tests.
//
// Levels are linear peak gains before the master limiter. The UI sounds sit between about
// -34 dBFS (click) and -18 dBFS (victory); the city's beds sit well below them. Melodic sounds
// stay in C major, so two that overlap never clash.

export type SoundOut = { ctx: BaseAudioContext; out: AudioNode; send?: AudioNode | null };
type Opts = { pan?: number; send?: number; attack?: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const jitter = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

const noiseCache = new WeakMap<BaseAudioContext, { white: AudioBuffer; brown: AudioBuffer }>();
/** Two seconds of white and brown noise per context, made once. The brown loop is levelled so its
 *  end meets its start: a mismatch there is a thump every two seconds. */
export function noiseBuffers(ctx: BaseAudioContext) {
  const cached = noiseCache.get(ctx); if (cached) return cached;
  const n = Math.floor(ctx.sampleRate * 2);
  const white = ctx.createBuffer(1, n, ctx.sampleRate), brown = ctx.createBuffer(1, n, ctx.sampleRate);
  const w = white.getChannelData(0), b = brown.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { w[i] = Math.random() * 2 - 1; last = (last + w[i] * .02) / 1.02; b[i] = last * 3.5; }
  const drift = b[n - 1] - b[0];
  for (let i = 0; i < n; i++) b[i] -= drift * i / (n - 1);
  const made = { white, brown }; noiseCache.set(ctx, made); return made;
}

/** A small, warm room: a generated stereo impulse response (no file). Send one-shots to it, not loops. */
export function createReverb(ctx: BaseAudioContext, seconds = 1.3, decay = 3.2): ConvolverNode {
  const len = Math.floor(ctx.sampleRate * seconds), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c); let low = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len, fadeIn = Math.min(1, i / (ctx.sampleRate * .006));
      low += ((Math.random() * 2 - 1) - low) * (.55 - .4 * x); // darker as it decays, like a real room
      d[i] = low * (1 - x) ** decay * fadeIn;
    }
  }
  const convolver = ctx.createConvolver(); convolver.normalize = true; convolver.buffer = ir; return convolver;
}

/** Where a voice goes: the output, panned when asked (StereoPanner is missing on very old Safari),
 *  optionally sweeping to `sweep.to` over `sweep.dur` from `sweep.t`, plus a reverb send. */
export function route(o: SoundOut, node: AudioNode, pan = 0, send = 0, sweep?: { to: number; t: number; dur: number }) {
  if ((pan || sweep) && typeof o.ctx.createStereoPanner === 'function') {
    const p = o.ctx.createStereoPanner();
    if (sweep) { p.pan.setValueAtTime(clamp(pan, -1, 1), sweep.t); p.pan.linearRampToValueAtTime(clamp(sweep.to, -1, 1), sweep.t + sweep.dur); }
    else p.pan.value = clamp(pan, -1, 1);
    node.connect(p); p.connect(o.out);
  } else node.connect(o.out);
  if (send > 0 && o.send) { const s = o.ctx.createGain(); s.gain.value = send; node.connect(s); s.connect(o.send); }
}

/** Exponential attack and decay: no clicks at either end. A new gain starts at 1 until its first
 *  event, so it is zeroed first: a sound starting a hair after a sample boundary would otherwise let
 *  one full-scale sample through (a crack at up to 0 dBFS after a high-pass filter). */
function envelope(param: AudioParam, t: number, attack: number, peak: number, dur: number) {
  param.value = 0;
  param.setValueAtTime(.0001, t);
  param.exponentialRampToValueAtTime(Math.max(.0002, peak), t + attack);
  param.exponentialRampToValueAtTime(.0001, t + Math.max(dur, attack + .005));
}

/** One oscillator with an envelope. Returns the source so a caller can stop it early. */
export function tone(o: SoundOut, t: number, freq: number, dur: number, gain: number,
  { type = 'sine', glideTo, attack = .005, pan = 0, send = 0 }: Opts & { type?: OscillatorType; glideTo?: number } = {}) {
  const osc = o.ctx.createOscillator(), g = o.ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  envelope(g.gain, t, attack, gain, dur);
  osc.connect(g); route(o, g, pan, send);
  osc.start(t); osc.stop(t + dur + .05); return osc;
}

/** An FM bell: bright on the strike and mellowing as it rings. `ratio` sets the metal (3.5 bell,
 *  2 coin, 1.41 glass); `index` how bright the strike is. */
export function bell(o: SoundOut, t: number, freq: number, dur: number, gain: number,
  { ratio = 3.5, index = 1.2, attack = .002, pan = 0, send = .25 }: Opts & { ratio?: number; index?: number } = {}) {
  const car = o.ctx.createOscillator(), mod = o.ctx.createOscillator(), depth = o.ctx.createGain(), g = o.ctx.createGain();
  car.frequency.setValueAtTime(freq, t); mod.frequency.setValueAtTime(freq * ratio, t);
  depth.gain.setValueAtTime(freq * index, t); depth.gain.exponentialRampToValueAtTime(Math.max(1, freq * index * .04), t + dur * .5);
  envelope(g.gain, t, attack, gain, dur);
  mod.connect(depth); depth.connect(car.frequency); car.connect(g); route(o, g, pan, send);
  car.start(t); mod.start(t); car.stop(t + dur + .05); mod.stop(t + dur + .05); return car;
}

/** A soft mallet: a round fundamental plus a quick, quiet overtone (a marimba's 4th partial). */
export function mallet(o: SoundOut, t: number, freq: number, dur: number, gain: number, opts: Opts = {}) {
  const { pan = 0, send = .12 } = opts;
  tone(o, t, freq * 3.98, Math.min(dur, .05), gain * .22, { attack: .001, pan, send });
  return tone(o, t, freq, dur, gain, { attack: opts.attack ?? .003, pan, send });
}

/** Filtered noise with an envelope and an optional filter sweep (steps, whooshes, drawers, booms). */
export function noise(o: SoundOut, t: number, dur: number, gain: number,
  { type = 'bandpass', from = 1000, to, q = 1, attack = .004, pan = 0, send = 0, brown = false, panTo }:
  Opts & { type?: BiquadFilterType; from?: number; to?: number; q?: number; brown?: boolean; panTo?: number } = {}) {
  const buffers = noiseBuffers(o.ctx), src = o.ctx.createBufferSource(), filter = o.ctx.createBiquadFilter(), g = o.ctx.createGain();
  src.buffer = brown ? buffers.brown : buffers.white; src.loop = true;
  filter.type = type; filter.Q.value = q; filter.frequency.setValueAtTime(from, t);
  if (to) filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  envelope(g.gain, t, attack, gain, dur);
  src.connect(filter); filter.connect(g); route(o, g, pan, send, panTo === undefined ? undefined : { to: panTo, t, dur });
  src.start(t, Math.random() * 1.5); src.stop(t + dur + .05); return src;
}

/** A soft brass voice (two detuned saws through a closing low-pass) for the victory fanfare. */
export function brass(o: SoundOut, t: number, freq: number, dur: number, gain: number, { pan = 0, send = .2 }: Opts = {}) {
  const filter = o.ctx.createBiquadFilter(), g = o.ctx.createGain();
  filter.type = 'lowpass'; filter.Q.value = .7;
  filter.frequency.setValueAtTime(freq * 1.5, t); filter.frequency.exponentialRampToValueAtTime(freq * 6, t + .06);
  filter.frequency.exponentialRampToValueAtTime(freq * 2.5, t + dur);
  g.gain.value = 0; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .04);
  g.gain.setValueAtTime(gain, t + Math.max(.05, dur - .25)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  filter.connect(g); route(o, g, pan, send);
  const oscs = [-7, 7].map(cents => { const osc = o.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, t); osc.detune.value = cents; osc.connect(filter); osc.start(t); osc.stop(t + dur + .05); return osc; });
  return oscs[0];
}

// Notes (Hz).
const N = { G3: 196, C4: 261.63, E4: 329.63, G4: 392, A4: 440, C5: 523.25, Eb5: 622.25, E5: 659.26, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.51, Gs6: 1661.22, G6: 1567.98, B6: 1975.53, A6: 1760, C7: 2093 };
export const NOTES = N;

/** Ka-ching: the drawer, two register bells and a little coin rattle. Shared by purchases and the café till. */
export function cashRegister(o: SoundOut, t: number, level = 1) {
  noise(o, t, .045, .03 * level, { type: 'bandpass', from: 3200, to: 1800, q: 1.4, attack: .002 });
  bell(o, t + .03, N.G6, .7, .026 * level, { ratio: 1.41, index: .9, send: .3 });
  bell(o, t + .085, N.C7, .95, .022 * level, { ratio: 1.41, index: .8, send: .3 });
  [3136, 3520, 2960].forEach((f, i) => mallet(o, t + .15 + i * .045, f * jitter(.02), .05, .006 * level, { pan: (i - 1) * .3 }));
}

export type UiSound = 'click' | 'tick' | 'purchase' | 'sell' | 'moneyGain' | 'moneyLoss' | 'achievement' | 'levelUp' | 'victory' | 'warning' | 'error' | 'notification';

/** Plays one interface sound at time `t`. `amount` sizes the money-gain coin; `level` scales the
 *  whole sound (audioService lowers repeats during fast autoplay). */
export function playUiSound(o: SoundOut, t: number, name: UiSound, amount = 0, level = 1) {
  const L = level;
  switch (name) {
    case 'click': // a soft key tap
      mallet(o, t, N.D6 * jitter(.015), .06, .028 * L, { send: 0 });
      noise(o, t, .012, .008 * L, { type: 'highpass', from: 3500, attack: .001 });
      return;
    case 'tick': // a wooden clock tick as the month turns
      noise(o, t, .03, .035 * L, { type: 'bandpass', from: 2100 * jitter(.03), q: 4, attack: .001 });
      tone(o, t, 820 * jitter(.02), .05, .02 * L, { type: 'triangle', glideTo: 640, attack: .002 });
      return;
    case 'purchase':
      cashRegister(o, t, L);
      return;
    case 'sell': // coins handed over
      noise(o, t, .09, .005 * L, { type: 'bandpass', from: 5200, q: 2, attack: .01 });
      mallet(o, t, N.E6, .18, .03 * L);
      mallet(o, t + .09, N.B5, .32, .03 * L);
      return;
    case 'moneyGain': { // the coin, one note richer as the amount grows
      const notes = amount >= 10000 ? [N.B5, N.E6, N.Gs6, N.B6] : amount >= 2000 ? [N.B5, N.E6, N.Gs6] : [N.B5, N.E6];
      notes.forEach((f, i) => bell(o, t + i * .075, f, i === notes.length - 1 ? .55 : .14, (i === notes.length - 1 ? .03 : .026) * L, { ratio: 2, index: .55, send: .18 }));
      if (amount >= 10000) noise(o, t + .2, .45, .005 * L, { type: 'highpass', from: 7000, attack: .05, send: .3 });
      return;
    }
    case 'moneyLoss': // a gentle "aw": a minor third down over a soft thud
      tone(o, t, 150, .12, .016 * L, { glideTo: 90, attack: .004 });
      mallet(o, t, N.Eb5, .2, .028 * L);
      mallet(o, t + .1, N.C5, .38, .026 * L);
      return;
    case 'achievement':
      [N.C6, N.E6, N.G6].forEach((f, i) => bell(o, t + i * .09, f, .5, .022 * L, { ratio: 3.5, index: .9, send: .3 }));
      bell(o, t + .27, N.C7, 1.2, .022 * L, { ratio: 3.5, index: .9, send: .35 });
      return;
    case 'levelUp':
      [N.G5, N.C6, N.E6, N.G6].forEach((f, i) => mallet(o, t + i * .065, f, .18, .026 * L));
      [N.C6, N.E6, N.G6].forEach((f, i) => bell(o, t + .3, f, 1.3, .016 * L, { ratio: 3.5, index: .7, pan: (i - 1) * .35, send: .35 }));
      noise(o, t + .3, .7, .004 * L, { type: 'highpass', from: 6500, attack: .08, send: .4 });
      return;
    case 'victory': // a short fanfare: three pickups into a held C major chord, bells on top
      [0, .12, .24].forEach(d => brass(o, t + d, N.G4, .11, .022 * L));
      [N.C4, N.E4, N.G4, N.C5].forEach((f, i) => brass(o, t + .38, f, 1.5, .018 * L, { pan: (i - 1.5) * .25 }));
      [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => bell(o, t + .42 + i * .1, f, 1, .014 * L, { send: .4, pan: (i - 1.5) * .3 }));
      return;
    case 'warning': // "uh-oh": down a major third
      mallet(o, t, N.A5, .2, .026 * L);
      mallet(o, t + .13, N.F5, .34, .026 * L);
      return;
    case 'error': // a muted double bonk, no buzz
      tone(o, t, 311, .12, .034 * L, { type: 'triangle', glideTo: 296, attack: .003 });
      tone(o, t + .11, 233, .22, .034 * L, { type: 'triangle', glideTo: 220, attack: .003 });
      return;
    case 'notification': // up a fourth, resolved
      mallet(o, t, N.G5, .16, .024 * L);
      mallet(o, t + .08, N.C6, .36, .026 * L);
      return;
  }
}
