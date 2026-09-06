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
// Quiet synthesized water/rain ambience; no downloads, subscriptions or music rights.
export function createTownAmbience(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate), data = buffer.getChannelData(0);
  let last = 0; for (let i = 0; i < data.length; i++) { last = (last + (Math.random() * 2 - 1) * .02) / 1.02; data[i] = last * 3.5; }
  const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(); source.buffer = buffer; source.loop = true;
  filter.type = 'lowpass'; filter.frequency.value = 900; gain.gain.value = 0; source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start();
  return { update(rainy: boolean, inside: boolean, hidden: boolean) { gain.gain.setTargetAtTime(hidden ? 0 : inside ? .018 : rainy ? .09 : .035, context.currentTime, .4); filter.frequency.setTargetAtTime(rainy ? 1500 : 600, context.currentTime, .4); }, dispose() { source.stop(); source.disconnect(); filter.disconnect(); gain.disconnect(); } };
}
