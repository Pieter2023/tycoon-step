import * as THREE from 'three';
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
// Layered, fully synthesized soundscape: breeze and distant city hum, birdsong on dry days,
// rain hiss, the fountain heard only when close, passing traffic panned by direction, shoe
// steps on pavement or interior floor, the espresso machine while a drink brews, and short
// chimes for service moments. No downloads, subscriptions or music rights involved.
export function createTownAmbience(context: AudioContext) {
  const now = () => context.currentTime;
  const master = context.createGain(); master.gain.value = 1; master.connect(context.destination);
  const seconds = context.sampleRate * 2;
  const white = context.createBuffer(1, seconds, context.sampleRate), whiteData = white.getChannelData(0);
  for (let i = 0; i < seconds; i++) whiteData[i] = Math.random() * 2 - 1;
  const pink = context.createBuffer(1, seconds, context.sampleRate), pinkData = pink.getChannelData(0);
  let last = 0; for (let i = 0; i < seconds; i++) { last = (last + (Math.random() * 2 - 1) * .02) / 1.02; pinkData[i] = last * 3.5; }
  const loop = (buffer: AudioBuffer, type: BiquadFilterType, frequency: number, q = 1) => {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; source.loop = true; filter.type = type; filter.frequency.value = frequency; filter.Q.value = q; gain.gain.value = 0;
    source.connect(filter); filter.connect(gain); gain.connect(master); source.start(); return { source, filter, gain };
  };
  const breeze = loop(pink, 'lowpass', 520), rain = loop(white, 'bandpass', 3400, .5), fountain = loop(white, 'bandpass', 1500, .8), machine = loop(white, 'bandpass', 2700, 1.3);
  const pump = context.createOscillator(), pumpFilter = context.createBiquadFilter(), pumpGain = context.createGain();
  pump.type = 'sawtooth'; pump.frequency.value = 46; pumpFilter.type = 'lowpass'; pumpFilter.frequency.value = 170; pumpGain.gain.value = 0;
  pump.connect(pumpFilter); pumpFilter.connect(pumpGain); pumpGain.connect(master); pump.start();
  // Crickets after dark: a high tone pulsed by a slow LFO, barely there.
  const cricket = context.createOscillator(), cricketLfo = context.createOscillator(), cricketDepth = context.createGain(), cricketGain = context.createGain();
  cricket.type = 'sine'; cricket.frequency.value = 4300; cricketLfo.type = 'square'; cricketLfo.frequency.value = 27; cricketDepth.gain.value = .5; cricketGain.gain.value = 0;
  cricketLfo.connect(cricketDepth); cricketDepth.connect(cricketGain.gain); cricket.connect(cricketGain); cricketGain.connect(master); cricket.start(); cricketLfo.start();
  let nightLevel = 0;
  const oneShots = new Set<AudioScheduledSourceNode>();
  const output = (pan: number) => {
    if (!pan || typeof context.createStereoPanner !== 'function') return master;
    const panner = context.createStereoPanner(); panner.pan.value = THREE.MathUtils.clamp(pan, -1, 1); panner.connect(master); return panner;
  };
  const burst = (from: number, to: number, duration: number, peak: number, type: BiquadFilterType = 'bandpass', q = 1, pan = 0, attack = .01) => {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(); source.buffer = white; source.loopStart = Math.random() * 1.5; source.loop = true;
    filter.type = type; filter.Q.value = q; filter.frequency.setValueAtTime(from, now()); filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), now() + duration);
    gain.gain.setValueAtTime(.0001, now()); gain.gain.exponentialRampToValueAtTime(peak, now() + attack); gain.gain.exponentialRampToValueAtTime(.0001, now() + duration);
    source.connect(filter); filter.connect(gain); gain.connect(output(pan)); source.start(); source.stop(now() + duration + .05); oneShots.add(source); source.onended = () => oneShots.delete(source);
  };
  const tone = (frequency: number, duration: number, peak: number, type: OscillatorType = 'sine', glideTo?: number, delay = 0) => {
    const osc = context.createOscillator(), gain = context.createGain(); const start = now() + delay;
    osc.type = type; osc.frequency.setValueAtTime(frequency, start); if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(peak, start + .008); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + duration + .05); oneShots.add(osc); osc.onended = () => oneShots.delete(osc);
  };
  const state = { rainy: false, inside: false, hidden: false };
  let birdTimer: ReturnType<typeof setTimeout> | undefined, disposed = false;
  const chirp = () => { const base = 2400 + Math.random() * 900; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) tone(base, .07, .02, 'sine', base * 1.35, i * .11); };
  const scheduleBirds = () => {
    birdTimer = setTimeout(() => { if (disposed) return; if (!state.hidden && !state.inside && !state.rainy && nightLevel < .5 && context.state === 'running') chirp(); scheduleBirds(); }, 2500 + Math.random() * 5000);
  };
  scheduleBirds();
  return {
    update(rainy: boolean, inside: boolean, hidden: boolean) {
      Object.assign(state, { rainy, inside, hidden }); const t = now();
      breeze.gain.gain.setTargetAtTime(hidden ? 0 : inside ? .010 : .026, t, .5); breeze.filter.frequency.setTargetAtTime(inside ? 260 : 520, t, .5);
      rain.gain.gain.setTargetAtTime(hidden || !rainy ? 0 : inside ? .010 : .05, t, .6);
      if (hidden || inside) { fountain.gain.gain.setTargetAtTime(0, t, .3); machine.gain.gain.setTargetAtTime(inside ? machine.gain.gain.value : 0, t, .2); }
    },
    // Called every frame outdoors with the player's distance to the fountain.
    tick(fountainDistance: number) {
      const level = state.hidden || state.inside ? 0 : .045 * Math.max(0, 1 - fountainDistance / 9) ** 2;
      fountain.gain.gain.setTargetAtTime(level, now(), .25);
    },
    step(inside: boolean, speed: number) {
      const quick = speed > 3;
      burst(inside ? 1600 : 1000, inside ? 900 : 500, quick ? .06 : .08, (quick ? .06 : .045) * (inside ? .8 : 1), 'bandpass', 1.2, 0, .004);
      if (!inside) tone(95, .05, .018, 'sine', 60);
    },
    night(level: number) { nightLevel = level; cricketGain.gain.setTargetAtTime(state.hidden || state.inside ? 0 : level * .011, now(), .8); },
    carPass(pan: number, closeness: number) { if (closeness > 0) burst(360, 220, 1.2, .10 * closeness, 'bandpass', .7, pan, .35); },
    machine(on: boolean) { machine.gain.gain.setTargetAtTime(on ? .045 : 0, now(), .15); pumpGain.gain.setTargetAtTime(on ? .028 : 0, now(), .15); },
    chime(kind: ChimeKind) {
      if (kind === 'order') tone(880, .25, .04);
      else if (kind === 'ready') { tone(988, .12, .04); tone(1318, .3, .04, 'sine', undefined, .1); }
      else if (kind === 'serve') { tone(1318, .35, .045); tone(1760, .5, .035, 'sine', undefined, .09); }
      else if (kind === 'sale') { burst(3000, 1200, .05, .05, 'highpass', 1); tone(2093, .3, .04, 'triangle', undefined, .04); tone(2637, .45, .035, 'triangle', undefined, .12); }
      else if (kind === 'left') tone(440, .4, .035, 'sine', 300);
      else [523, 659, 784, 1046].forEach((f, i) => tone(f, .35, .04, 'triangle', undefined, i * .12));
    },
    dispose() {
      disposed = true; if (birdTimer) clearTimeout(birdTimer);
      for (const loopNode of [breeze, rain, fountain, machine]) { loopNode.source.stop(); loopNode.source.disconnect(); loopNode.filter.disconnect(); loopNode.gain.disconnect(); }
      pump.stop(); pump.disconnect(); pumpFilter.disconnect(); pumpGain.disconnect();
      cricket.stop(); cricketLfo.stop(); cricket.disconnect(); cricketLfo.disconnect(); cricketDepth.disconnect(); cricketGain.disconnect();
      for (const node of oneShots) { try { node.stop(); } catch { /* already ended */ } }
      master.disconnect();
    },
  };
}
