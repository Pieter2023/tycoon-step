import * as THREE from 'three';
import { bell, cashRegister, mallet, noise, noiseBuffers, NOTES as N, route, tone, type SoundOut } from '../../services/soundDesign';
export function createTownWeather() {
  const positions = new Float32Array(280 * 6), geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: '#d4edf3', transparent: true, opacity: .5 })); rain.frustumCulled = false;
  const puddles = new THREE.Group();
  for (const [x, z, size] of [[-4, 4, .8], [1, 5, .6], [8, 3, 1], [-8, 2, .7]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(size, 24), new THREE.MeshStandardMaterial({ color: '#a2c5cc', roughness: .12, metalness: .35, transparent: true, opacity: .65 }));
    p.rotation.x = -Math.PI / 2; p.scale.y = .45; p.position.set(x, .225, z); puddles.add(p);
  }
  const root = new THREE.Group(); root.add(rain, puddles); root.visible = false;
  return { root, update(time: number, rainy: boolean, reduced: boolean) {
    root.visible = rainy; rain.visible = !reduced; if (!rainy || reduced) return;
    for (let i = 0; i < 280; i++) { const x = ((i * 17.31) % 34) - 17, z = ((i * 7.19) % 18) - 5, y = 10 - ((time * 8 + i * .37) % 10); positions.set([x, y, z, x + .12, y - .5, z + .04], i * 6); }
    geometry.attributes.position.needsUpdate = true;
  } };
}

export type ChimeKind = 'order' | 'serve' | 'sale' | 'left' | 'celebrate' | 'ready';
export type BirdKind = 'whistle' | 'trill' | 'warble';
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const BIRDS: BirdKind[] = ['whistle', 'trill', 'warble'];

// The city's one-shot sounds, built from the shared recipes in services/soundDesign.ts. Exported so
// QA can render each one offline. `pan` runs from -1 (left) to 1 (right).
export const townSfx = {
  /** One footstep: a scuff and a heel thump outdoors, a tap with room echo indoors, a splash when wet. */
  step(o: SoundOut, t: number, inside: boolean, speed: number, wet = false, foot = 1) {
    const r = rnd(.88, 1.12), level = (speed > 3 ? 2.3 : 2) * rnd(.85, 1.1), pan = foot * .06;
    if (inside) {
      noise(o, t, .045, .02 * level, { from: 2300 * r, to: 1300 * r, q: 1.6, attack: .002, pan, send: .3 });
      tone(o, t, 190 * r, .035, .009 * level, { glideTo: 120, attack: .002, pan, send: .2 });
      return;
    }
    noise(o, t, speed > 3 ? .06 : .075, .024 * level, { from: 1100 * r, to: 520 * r, q: 1.2, attack: .003, pan });
    tone(o, t, 92 * r, .05, .012 * level, { glideTo: 58, attack: .003, pan });
    if (wet) noise(o, t + .01, .09, .01 * level, { type: 'highpass', from: 2800, attack: .004, pan });
  },
  /** A car going by: tyre roar and a low engine note, both dropping in pitch as it passes (Doppler),
   *  sweeping out to the side it leaves on. Starts at the moment it crosses the player. */
  carPass(o: SoundOut, t: number, side: number, closeness: number, wet = false) {
    const g = Math.max(0, closeness) ** 1.4; if (g < .01) return;
    const sweep = { to: side * .85, t, dur: 1.4 };
    noise(o, t, 1.5, .05 * g, { from: 950, to: 380, q: .7, attack: .07, pan: side * .1, panTo: side * .85 });
    if (wet) noise(o, t, 1.2, .016 * g, { type: 'highpass', from: 2600, attack: .08, pan: side * .1, panTo: side * .85 });
    const engine = o.ctx.createOscillator(), low = o.ctx.createBiquadFilter(), amp = o.ctx.createGain();
    engine.type = 'sawtooth'; engine.frequency.setValueAtTime(76, t); engine.frequency.exponentialRampToValueAtTime(58, t + 1.4);
    low.type = 'lowpass'; low.frequency.value = 300; low.Q.value = .8;
    amp.gain.value = 0; amp.gain.setValueAtTime(.0001, t); amp.gain.exponentialRampToValueAtTime(.03 * g, t + .08); amp.gain.exponentialRampToValueAtTime(.0001, t + 1.4);
    engine.connect(low); low.connect(amp); route(o, amp, side * .1, 0, sweep);
    engine.start(t); engine.stop(t + 1.45);
  },
  /** Three songbirds: a two-note whistle, a fast trill and a warble. Birds sing near-pure tones. */
  bird(o: SoundOut, t: number, kind: BirdKind, pan: number, level = 1) {
    const L = .014 * level, send = .15;
    if (kind === 'whistle') {
      const f = rnd(3000, 3500);
      tone(o, t, f, .26, L, { glideTo: f * .97, attack: .02, pan, send });
      tone(o, t + .32, f * .84, .3, L * .9, { glideTo: f * .82, attack: .02, pan, send });
    } else if (kind === 'trill') {
      const f = rnd(3600, 4200), n = 6 + Math.floor(rnd(0, 4));
      for (let i = 0; i < n; i++) tone(o, t + i * .058, f * rnd(.98, 1.02), .04, L * .75, { glideTo: f * 1.18, attack: .004, pan, send });
    } else {
      const f = rnd(2500, 3200);
      for (let i = 0; i < 4; i++) { const up = i % 2 === 0; tone(o, t + i * .1, f * (up ? .9 : 1.12) * rnd(.97, 1.03), .085, L * .85, { glideTo: f * (up ? 1.15 : .88), attack: .008, pan, send }); }
    }
  },
  /** One cricket chirp: four quick pulses of a high tone. */
  cricket(o: SoundOut, t: number, freq: number, pan: number, level: number) {
    for (let k = 0; k < 4; k++) tone(o, t + k * .034, freq, .016, level, { attack: .003, pan });
  },
  /** A raindrop on a puddle or a drop falling back into the fountain: a tiny rising blip. */
  drop(o: SoundOut, t: number, pan: number, level: number, low = 1400, high = 2600) {
    const f = rnd(low, high); tone(o, t, f, .035, level, { glideTo: f * 1.6, attack: .001, pan });
  },
  /** A firework over the square: the boom, a thump you feel, and a crackle as the stars burn out. */
  firework(o: SoundOut, t: number, pan = 0, level = 1) {
    noise(o, t, 1.8, .09 * level, { type: 'lowpass', from: 1400, to: 110, q: .5, attack: .003, brown: true, pan, send: .5 });
    tone(o, t, 75, .55, .045 * level, { glideTo: 36, attack: .003, pan, send: .3 });
    const crackles = 10 + Math.floor(rnd(0, 8));
    for (let i = 0; i < crackles; i++) noise(o, t + rnd(.25, 1.3), .014, rnd(.006, .014) * level, { type: 'highpass', from: rnd(2500, 4500), attack: .001, pan: pan + rnd(-.5, .5), send: .4 });
  },
  /** The café's service moments. */
  chime(o: SoundOut, t: number, kind: ChimeKind) {
    if (kind === 'order') bell(o, t, N.G6, .6, .024, { ratio: 2.76, index: .8, send: .3 }); // the counter bell
    else if (kind === 'ready') { bell(o, t, N.E6, .3, .02, { ratio: 2, index: .6 }); bell(o, t + .12, N.A6, .6, .022, { ratio: 2, index: .6 }); }
    else if (kind === 'serve') [N.C6, N.E6, N.G6].forEach((f, i) => mallet(o, t + i * .08, f, i === 2 ? .45 : .2, .024));
    else if (kind === 'sale') cashRegister(o, t, .9);
    else if (kind === 'left') { mallet(o, t, N.A4, .3, .024); mallet(o, t + .15, N.E4, .45, .022); }
    else [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => bell(o, t + i * .11, f, i === 3 ? 1.3 : .6, .022, { ratio: 3.5, index: .9, send: .35 }));
  },
};

// The living city under the sound effects: wind with gusts, rain (muffled indoors) with drops,
// the fountain's babble when close, crickets after dark, songbirds on dry days, the espresso
// machine while a drink brews. It plays into the engine's `world` bus and fades in over 1.5 s.
// No downloads, subscriptions or music rights involved.
export function createTownAmbience(context: BaseAudioContext, destination: AudioNode = context.destination, reverb: AudioNode | null = null) {
  const now = () => context.currentTime;
  const master = context.createGain();
  master.gain.value = 0; master.gain.setValueAtTime(.0001, now()); master.gain.exponentialRampToValueAtTime(1, now() + 1.5); master.connect(destination);
  const o: SoundOut = { ctx: context, out: master, send: reverb };
  const { white, brown } = noiseBuffers(context);
  const loops: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode }[] = [];
  const loop = (buffer: AudioBuffer, type: BiquadFilterType, frequency: number, q = 1) => {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; source.loop = true; filter.type = type; filter.frequency.value = frequency; filter.Q.value = q; gain.gain.value = 0;
    source.connect(filter); filter.connect(gain); gain.connect(master); source.start(0, Math.random() * 1.5);
    const made = { source, filter, gain }; loops.push(made); return made;
  };
  const breeze = loop(brown, 'lowpass', 520);
  const rainWash = loop(white, 'lowpass', 1800, .4), rainHiss = loop(white, 'highpass', 6500, .5);
  const fountain = loop(white, 'bandpass', 1400, 1.1), fountainBody = loop(brown, 'lowpass', 420);
  const machine = loop(white, 'bandpass', 2700, 1.3);
  const pump = context.createOscillator(), pumpFilter = context.createBiquadFilter(), pumpGain = context.createGain();
  pump.type = 'sawtooth'; pump.frequency.value = 46; pumpFilter.type = 'lowpass'; pumpFilter.frequency.value = 170; pumpGain.gain.value = 0;
  pump.connect(pumpFilter); pumpFilter.connect(pumpGain); pumpGain.connect(master); pump.start();

  const state = { rainy: false, inside: false, hidden: false, night: 0, fountainNear: 0 };
  const outdoors = () => !state.hidden && !state.inside;
  const breezeLevel = () => state.hidden ? 0 : state.inside ? .010 : .026;
  // Each cricket keeps its own pitch, place and steady rhythm, as real ones do.
  const crickets = [{ freq: 4400, pan: -.55, period: .62, next: 0 }, { freq: 4750, pan: .6, period: .83, next: 0 }, { freq: 4150, pan: .1, period: 1.07, next: 0 }];
  let disposed = false, timer: ReturnType<typeof setTimeout> | undefined, nextGust = 0, lastBabble = -1, foot = 1;
  // Four times a second: gusts, birds, crickets, raindrops and fountain drops, a little ahead of time.
  const scheduler = () => {
    if (disposed) return;
    timer = setTimeout(scheduler, 250);
    if (context.state !== 'running' || state.hidden) return;
    const t = now();
    if (t >= nextGust) { nextGust = t + rnd(2.5, 5); breeze.gain.gain.setTargetAtTime(breezeLevel() * (state.inside ? 1 : rnd(.6, 1.35)), t, 1.2); }
    if (!outdoors()) return;
    if (!state.rainy && state.night < .5 && Math.random() < .07) townSfx.bird(o, t + rnd(.05, .25), BIRDS[Math.floor(Math.random() * BIRDS.length)], rnd(-.8, .8), rnd(.6, 1));
    if (state.night > .25) for (const c of crickets) {
      if (c.next < t) c.next = t + rnd(.05, c.period);
      while (c.next < t + .3) { townSfx.cricket(o, c.next, c.freq, c.pan, .0045 * state.night); c.next += c.period * rnd(.92, 1.08); }
    }
    if (state.rainy) for (let i = 0; i < 3; i++) if (Math.random() < .5) townSfx.drop(o, t + rnd(.02, .25), rnd(-.9, .9), rnd(.002, .005));
    if (state.fountainNear > .15 && Math.random() < .6 * state.fountainNear) townSfx.drop(o, t + rnd(.02, .25), rnd(-.3, .3), .006 * state.fountainNear, 700, 1300);
  };
  scheduler();
  return {
    update(rainy: boolean, inside: boolean, hidden: boolean) {
      Object.assign(state, { rainy, inside, hidden }); const t = now();
      breeze.gain.gain.setTargetAtTime(breezeLevel(), t, .5); breeze.filter.frequency.setTargetAtTime(inside ? 260 : 520, t, .5);
      rainWash.gain.gain.setTargetAtTime(hidden || !rainy ? 0 : inside ? .03 : .06, t, .6); rainWash.filter.frequency.setTargetAtTime(inside ? 500 : 1800, t, .5);
      rainHiss.gain.gain.setTargetAtTime(hidden || !rainy || inside ? 0 : .01, t, .6);
      if (hidden || inside) { state.fountainNear = 0; fountain.gain.gain.setTargetAtTime(0, t, .3); fountainBody.gain.gain.setTargetAtTime(0, t, .3); }
      if (hidden || !inside) { machine.gain.gain.setTargetAtTime(0, t, .2); pumpGain.gain.setTargetAtTime(0, t, .2); }
    },
    /** Called every frame outdoors with the player's distance to the fountain: the closer, the louder
     *  its babble, which wanders in pitch and level like moving water. */
    tick(fountainDistance: number) {
      const t = now(); if (t - lastBabble < .09) return; lastBabble = t;
      const near = outdoors() ? Math.max(0, 1 - fountainDistance / 9) ** 2 : 0; state.fountainNear = near;
      fountain.gain.gain.setTargetAtTime(.045 * near * rnd(.7, 1.15), t, .06);
      fountain.filter.frequency.setTargetAtTime(rnd(900, 2100), t, .05);
      fountainBody.gain.gain.setTargetAtTime(.05 * near, t, .25);
    },
    step(inside: boolean, speed: number) { foot = -foot; townSfx.step(o, now(), inside, speed, state.rainy && !inside, foot); },
    night(level: number) { state.night = level; },
    /** `side`: where the car leaves on screen, -1 left to 1 right. */
    carPass(side: number, closeness: number) { if (outdoors()) townSfx.carPass(o, now(), side, closeness, state.rainy); },
    /** One burst over the square; Freedom Day's endless show passes a lower level so it stays in the distance. */
    firework(level = .8) { if (outdoors()) townSfx.firework(o, now(), rnd(-.4, .4), level); },
    machine(on: boolean) { const t = now(); machine.gain.gain.setTargetAtTime(on ? .035 : 0, t, .15); pumpGain.gain.setTargetAtTime(on ? .028 : 0, t, .15); },
    chime(kind: ChimeKind) { townSfx.chime(o, now(), kind); },
    /** Fades out over a moment (no click), then stops everything. */
    dispose() {
      if (disposed) return; disposed = true; if (timer) clearTimeout(timer);
      const t = now(); master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(Math.max(.0001, master.gain.value), t); master.gain.exponentialRampToValueAtTime(.0001, t + .15);
      setTimeout(() => {
        try {
          for (const l of loops) { l.source.stop(); l.source.disconnect(); l.filter.disconnect(); l.gain.disconnect(); }
          pump.stop(); pump.disconnect(); pumpFilter.disconnect(); pumpGain.disconnect(); master.disconnect();
        } catch { /* the context is already closed */ }
      }, 200);
    },
  };
}
