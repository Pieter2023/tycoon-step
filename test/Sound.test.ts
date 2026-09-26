import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playUiSound, type UiSound, type SoundOut } from '../services/soundDesign';
import { createTownAmbience, townSfx, type ChimeKind } from '../components/town/townAtmosphere';

// A recording Web Audio fake. Like real browsers, it throws on an exponential ramp to zero or below.
class FakeParam {
  events: { kind: string; value: number; time: number }[] = [];
  constructor(public owner: FakeNode, public name: string, public value = 0) {}
  private push(kind: string, value: number, time: number) { this.events.push({ kind, value, time }); return this; }
  setValueAtTime(v: number, t: number) { return this.push('set', v, t); }
  linearRampToValueAtTime(v: number, t: number) { return this.push('linear', v, t); }
  exponentialRampToValueAtTime(v: number, t: number) { if (!(v > 0)) throw new RangeError(`exponential ramp to ${v}`); return this.push('exp', v, t); }
  setTargetAtTime(v: number, t: number) { return this.push('target', v, t); }
  cancelScheduledValues() { return this; }
}
class FakeNode {
  connections: (FakeNode | FakeParam)[] = [];
  constructor(public ctx: FakeContext, public kind: string) { ctx.nodes.push(this); }
  connect<T extends FakeNode | FakeParam>(to: T) { this.connections.push(to); return to; }
  disconnect() { this.connections = []; }
}
class FakeSource extends FakeNode {
  started?: number; stopped?: number; onended: null | (() => void) = null;
  start(t = 0) { this.started = t; }
  stop(t = 0) { this.stopped = t; }
}
class FakeBuffer {
  private data: Float32Array[];
  constructor(public numberOfChannels: number, public length: number, public sampleRate: number) { this.data = Array.from({ length: numberOfChannels }, () => new Float32Array(length)); }
  getChannelData(c: number) { return this.data[c]; }
}
class FakeContext {
  nodes: FakeNode[] = []; sampleRate = 8000; currentTime = 0; state = 'running';
  destination = new FakeNode(this, 'destination');
  createGain() { const n = new FakeNode(this, 'gain') as FakeNode & { gain: FakeParam }; n.gain = new FakeParam(n, 'gain', 1); return n; }
  createOscillator() { const n = new FakeSource(this, 'oscillator') as FakeSource & Record<string, unknown>; Object.assign(n, { type: 'sine', frequency: new FakeParam(n, 'frequency', 440), detune: new FakeParam(n, 'detune') }); return n; }
  createBufferSource() { const n = new FakeSource(this, 'bufferSource') as FakeSource & Record<string, unknown>; Object.assign(n, { buffer: null, loop: false }); return n; }
  createBiquadFilter() { const n = new FakeNode(this, 'filter') as FakeNode & Record<string, unknown>; Object.assign(n, { type: 'lowpass', frequency: new FakeParam(n, 'frequency', 350), Q: new FakeParam(n, 'Q', 1) }); return n; }
  createStereoPanner() { const n = new FakeNode(this, 'panner') as FakeNode & Record<string, unknown>; n.pan = new FakeParam(n, 'pan'); return n; }
  createDynamicsCompressor() { const n = new FakeNode(this, 'compressor') as FakeNode & Record<string, unknown>; for (const k of ['threshold', 'knee', 'ratio', 'attack', 'release']) n[k] = new FakeParam(n, k); return n; }
  createConvolver() { const n = new FakeNode(this, 'convolver') as FakeNode & Record<string, unknown>; Object.assign(n, { buffer: null, normalize: true }); return n; }
  createBuffer(ch: number, len: number, sr: number) { return new FakeBuffer(ch, len, sr); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { return Promise.resolve(); }
}
const asCtx = (c: FakeContext) => c as unknown as BaseAudioContext;
const out = (c: FakeContext): SoundOut => ({ ctx: asCtx(c), out: c.createGain() as unknown as AudioNode, send: c.createConvolver() as unknown as AudioNode });
const params = (c: FakeContext) => c.nodes.flatMap(n => Object.values(n).filter((v): v is FakeParam => v instanceof FakeParam));
// Audio gains only: an FM bell's modulation depth is a gain node too, but measured in hertz.
const peakGain = (c: FakeContext) => Math.max(0, ...c.nodes.filter(n => n.kind === 'gain' && !n.connections.some(to => to instanceof FakeParam)).flatMap(n => ((n as unknown as { gain: FakeParam }).gain.events.filter(e => e.kind === 'exp' || e.kind === 'linear').map(e => e.value))));
const sources = (c: FakeContext) => c.nodes.filter((n): n is FakeSource => n instanceof FakeSource);

const UI: UiSound[] = ['click', 'tick', 'purchase', 'sell', 'moneyGain', 'moneyLoss', 'achievement', 'levelUp', 'victory', 'warning', 'error', 'notification'];

describe('interface sounds', () => {
  it.each(UI)('%s schedules a short, soft sound that stops by itself', name => {
    const c = new FakeContext();
    playUiSound(out(c), 1, name, 25000);
    const played = sources(c);
    expect(played.length).toBeGreaterThan(0);
    for (const s of played) { expect(s.started).toBeGreaterThanOrEqual(1); expect(s.stopped).toBeLessThanOrEqual(1 + 2.5); }
    expect(peakGain(c)).toBeLessThanOrEqual(.04); // every voice well under the limiter
  });

  it('starts every envelope from silence, so a late start cannot let a full-scale sample through', () => {
    for (const name of UI) {
      const c = new FakeContext();
      playUiSound(out(c), 1.0000000000000004, name, 25000);
      const enveloped = c.nodes.filter(n => n.kind === 'gain' && (n as unknown as { gain: FakeParam }).gain.events.length && !n.connections.some(to => to instanceof FakeParam));
      expect(enveloped.length).toBeGreaterThan(0);
      for (const n of enveloped) expect((n as unknown as { gain: FakeParam }).gain.value).toBe(0);
    }
  });

  it('adds a note to the coin as the amount grows', () => {
    const notes = (amount: number) => { const c = new FakeContext(); playUiSound(out(c), 0, 'moneyGain', amount); return sources(c).filter(s => s.kind === 'oscillator').length; };
    expect(notes(100)).toBeLessThan(notes(5000));
    expect(notes(5000)).toBeLessThan(notes(50000));
  });
});

describe('the city soundscape', () => {
  it('never lets an oscillator drive a volume control (the build-65 cricket whine)', () => {
    const c = new FakeContext();
    const amb = createTownAmbience(asCtx(c));
    amb.update(false, true, false); amb.night(1); amb.machine(true); amb.step(true, 2);
    amb.update(true, false, false); amb.tick(0); amb.carPass(1, 1); amb.firework(); amb.step(false, 4);
    (['order', 'ready', 'serve', 'sale', 'left', 'celebrate'] as ChimeKind[]).forEach(k => amb.chime(k));
    const intoVolume = c.nodes.flatMap(n => n.connections).filter(to => to instanceof FakeParam && to.name === 'gain');
    expect(intoVolume).toEqual([]);
    amb.dispose();
  });

  it('keeps the beds quiet in every place and weather', () => {
    for (const [rainy, inside] of [[false, false], [true, false], [false, true], [true, true]]) {
      const c = new FakeContext();
      const amb = createTownAmbience(asCtx(c));
      amb.update(rainy, inside, false); amb.night(1); amb.tick(0);
      const loopGains = c.nodes.filter(n => n.kind === 'gain').map(n => (n as unknown as { gain: FakeParam }).gain.events.filter(e => e.kind === 'target').map(e => e.value));
      const total = loopGains.reduce((sum, targets) => sum + (targets.length ? Math.max(...targets) : 0), 0);
      expect(total).toBeLessThan(.25);
      amb.dispose();
    }
  });

  it('plays every one-shot recipe without throwing', () => {
    const c = new FakeContext(), o = out(c);
    townSfx.step(o, 0, false, 4, true, -1); townSfx.step(o, 0, true, 2);
    townSfx.carPass(o, 0, -1, .8, true); townSfx.carPass(o, 0, 1, 0);
    for (const kind of ['whistle', 'trill', 'warble'] as const) townSfx.bird(o, 0, kind, .5);
    townSfx.cricket(o, 0, 4400, 0, .004); townSfx.drop(o, 0, 0, .004); townSfx.firework(o, 0, .2);
    expect(sources(c).every(s => s.stopped !== undefined && s.stopped! <= 3)).toBe(true);
    expect(params(c).length).toBeGreaterThan(0);
  });
});

describe('the audio engine', () => {
  let contexts: FakeContext[];
  let clock: number;
  const activation = { hasBeenActive: true };
  beforeEach(() => {
    vi.resetModules();
    contexts = [];
    clock = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.stubGlobal('AudioContext', class extends FakeContext { constructor() { super(); contexts.push(this); } });
    Object.defineProperty(navigator, 'userActivation', { configurable: true, get: () => activation });
    activation.hasBeenActive = true;
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); delete (navigator as unknown as Record<string, unknown>).userActivation; });

  const oscillators = () => contexts.flatMap(c => sources(c));

  it('shares one context and plays nothing while muted', async () => {
    const audio = await import('../services/audioService');
    audio.setMuted(true); audio.playPurchase();
    expect(oscillators()).toHaveLength(0);
    audio.setMuted(false); audio.playPurchase(); clock += 500; audio.playSell();
    expect(contexts).toHaveLength(1);
    expect(oscillators().length).toBeGreaterThan(0);
  });

  it('drops the toast chime that follows an action sound, and a doubled sound', async () => {
    const audio = await import('../services/audioService');
    audio.playPurchase(); const afterPurchase = oscillators().length;
    audio.playNotification(); audio.playPurchase();
    expect(oscillators().length).toBe(afterPurchase);
    clock += 1000; audio.playNotification();
    expect(oscillators().length).toBeGreaterThan(afterPurchase);
  });

  it('waits for the first click before starting the city', async () => {
    activation.hasBeenActive = false;
    const audio = await import('../services/audioService');
    const ready = vi.fn();
    audio.whenAudioReady(ready);
    expect(ready).not.toHaveBeenCalled();
    expect(contexts).toHaveLength(0);
    activation.hasBeenActive = true;
    window.dispatchEvent(new Event('pointerdown'));
    expect(ready).toHaveBeenCalledTimes(1);
    expect(contexts).toHaveLength(1);
  });
});
