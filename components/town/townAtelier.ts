import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Local, deterministic material library. No network assets or generation services.
export function createAtelierMaterials() {
  const make = (paint: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    paint(canvas.getContext('2d')!);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 4;
    return texture;
  };
  let seed = 127; const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  const stone = make(ctx => {
    ctx.fillStyle = '#a29c8b'; ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 5; col++) {
      const v = 195 + Math.floor(rand() * 27), x = col * 128 + (row % 2) * 64;
      ctx.fillStyle = `rgb(${v},${v - 4},${v - 14})`; ctx.fillRect(x + 2, row * 64 + 2, 124, 60);
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x + 3, row * 64 + 3, 122, 1);
    }
    for (let i = 0; i < 13000; i++) { ctx.fillStyle = rand() > .5 ? 'rgba(255,255,255,.07)' : 'rgba(45,36,22,.06)'; ctx.fillRect(rand() * 512, rand() * 512, 1.5, 1.5); }
  });
  const wood = make(ctx => {
    ctx.fillStyle = '#c9a27a'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 240; i++) {
      const y = rand() * 512; ctx.strokeStyle = `rgba(64,37,19,${.03 + rand() * .14})`; ctx.lineWidth = .5 + rand() * 2;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(160, y + rand() * 12, 350, y - rand() * 12, 512, y); ctx.stroke();
    }
  });
  const grain = make(ctx => {
    ctx.fillStyle = '#e3dfd5'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 18000; i++) { ctx.fillStyle = `rgba(52,49,39,${rand() * .10})`; ctx.fillRect(rand() * 512, rand() * 512, 1, 1); }
  });
  const mapped = (color: string, map: THREE.Texture, roughness = .8) => new THREE.MeshStandardMaterial({ color, map, roughness });
  return { stone, wood, grain,
    walnut: mapped('#936846', wood, .58), brass: new THREE.MeshStandardMaterial({ color: '#ba955d', metalness: .72, roughness: .32 }),
    enamel: new THREE.MeshStandardMaterial({ color: '#254e43', roughness: .32 }),
    linen: mapped('#f4e5c6', grain, .92),
    dispose() { stone.dispose(); wood.dispose(); grain.dispose(); }
  };
}
export type AtelierMaterials = ReturnType<typeof createAtelierMaterials>;

export function dressTown(root: THREE.Object3D, library: AtelierMaterials) {
  const colors: Record<string, string> = { ivory: '#d9cbb0', cream: '#f0e2c8', stone: '#958f7e', mint: '#80a496', mintDark: '#244d43', blue: '#7c9aab', clay: '#ad5c41', peach: '#d6a478', pink: '#b18778', slate: '#293b3b', glass: '#264a4e', wood: '#946b47', gold: '#bb995b', road: '#515959', roof: '#4b5a59' };
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material) || !(o.material instanceof THREE.MeshStandardMaterial)) return;
    const m = o.material, name = m.name;
    if (colors[name]) m.color.set(colors[name]);
    if (name === 'glass') { m.roughness = .18; m.metalness = .25; }
    else if (name === 'gold') { m.roughness = .32; m.metalness = .65; }
    else if (name === 'wood') { m.map = library.wood; m.roughness = .68; }
    else if (name === 'paving') {
      m.map = library.stone; m.roughness = .92;
      const pos = o.geometry.attributes.position, uv = new Float32Array(pos.count * 2), v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); uv[i * 2] = v.x / 3.2; uv[i * 2 + 1] = v.z / 3.2; }
      o.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    } else if (['ivory', 'cream', 'stone', 'peach'].includes(name)) { m.map = library.grain; m.roughness = .87; }
    m.needsUpdate = true;
  });
}

// Keep the established pivot/clip contract while improving the featured player's outfit.
export function dressPlayer(root: THREE.Object3D, library: AtelierMaterials) {
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material) || !(o.material instanceof THREE.MeshStandardMaterial)) return;
    const m = o.material.clone(); o.material = m;
    if (m.name === 'shirt') { m.color.set('#406f5b'); m.map = library.grain; m.roughness = .86; }
    if (m.name === 'trousers') { m.color.set('#34494d'); m.roughness = .9; }
    if (m.name === 'shoe') { m.color.set('#e9dfca'); m.roughness = .72; }
    if (m.name === 'skin') m.roughness = .64;
  });
  const outfit=new THREE.Group();outfit.name='Atelier_work_apron';
  const torso = root.getObjectByName('Torso');
  if (torso) {
    torso.add(outfit);
    // glTF converts the existing character hierarchy to Y-up; forward is +Z.
    const positions: number[] = [], indices: number[] = [];
    for (const z of [-.025, .40]) for (let i=0;i<=8;i++) {
      const x=(i/8-.5)*.39, y=-.23+Math.pow(x/.22,2)*.065;
      positions.push(x,z,-y);
    }
    for(let i=0;i<8;i++)indices.push(i,i+9,i+1,i+1,i+9,i+10);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const apronMaterial=new THREE.MeshStandardMaterial({color:'#b69870',roughness:.92,side:THREE.DoubleSide});
    const apron=new THREE.Mesh(geometry,apronMaterial);apron.name='Atelier_apron';apron.castShadow=true;outfit.add(apron);
    const pocket=new THREE.Mesh(new THREE.BoxGeometry(.18,.10,.018),new THREE.MeshStandardMaterial({color:'#947551',roughness:.95}));pocket.position.set(0,.12,.247);pocket.name='Atelier_apron_pocket';outfit.add(pocket);
    for(const x of [-.115,.115]){const strap=new THREE.Mesh(new THREE.BoxGeometry(.025,.18,.018),apronMaterial);strap.position.set(x,.43,.205);strap.rotation.x=.40;outfit.add(strap);}
  }
  return outfit;
}

export function decorateCart(root: THREE.Group, cover: THREE.Group, library: AtelierMaterials) {
  const box = (name: string, size: number[], p: number[], material: THREE.Material, radius = .012) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 1, radius), material);
    mesh.name = name; mesh.position.set(p[0], p[1], p[2]); mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  for (const z of [-.456, .456]) for (let i = 0; i < 13; i++) box('Walnut fluting', [.105, .64, .025], [-.744 + i * .124, .67, z], library.walnut);
  for (const z of [-.48, .48]) {
    box('Brass lower rail', [1.66, .022, .018], [0, .32, z], library.brass, .005);
    box('Brass upper rail', [1.66, .022, .018], [0, 1.01, z], library.brass, .005);
  }
  for (const x of [-.83, .83]) box('Enamel corner', [.06, .78, .96], [x, .64, 0], library.enamel);
  // Sloped continuous fabric replaces the flat individual canopy blocks.
  for (const child of [...cover.children]) if (child instanceof THREE.Mesh && child.geometry instanceof RoundedBoxGeometry) { cover.remove(child); child.geometry.dispose(); (child.material as THREE.Material).dispose(); }
  for (let stripe = 0; stripe < 10; stripe++) {
    const x = -1 + stripe * .2, positions: number[] = [], indices: number[] = [], segments = 10;
    for (let j = 0; j <= segments; j++) {
      const z = -.65 + j / segments * 1.3, y = 2.30 + .20 * Math.cos((z / .65) * Math.PI / 2);
      positions.push(x, y, z, x + .2, y, z);
      if (j < segments) { const k = j * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals();
    const mat = (stripe % 2 ? library.enamel : library.linen).clone(); mat.side = THREE.DoubleSide;
    const panel = new THREE.Mesh(geo, mat); panel.castShadow = true; cover.add(panel);
    for (const z of [-.65, .65]) {
      const valance = new THREE.Mesh(new RoundedBoxGeometry(.198, .14, .024, 1, .016), mat); valance.position.set(x + .1, 2.25, z); cover.add(valance);
    }
  }
  const badge = document.createElement('canvas'); badge.width = 768; badge.height = 256;
  const ink = badge.getContext('2d')!; ink.fillStyle = '#1e4439'; ink.fillRect(0, 0, 768, 256); ink.strokeStyle = '#c8aa72'; ink.lineWidth = 3; ink.strokeRect(15, 15, 738, 226);
  ink.textAlign = 'center'; ink.fillStyle = '#e9d8b6'; ink.font = '20px sans-serif'; ink.fillText('SMALL BATCH · BIG AMBITIONS', 384, 62);
  ink.font = 'bold 65px Georgia'; ink.fillText('Little Square', 384, 145); ink.font = '22px sans-serif'; ink.fillText('C O F F E E   &   C O M P A N Y', 384, 203);
  const tex = new THREE.CanvasTexture(badge); tex.colorSpace = THREE.SRGBColorSpace;
  for (const z of [-.49, .49]) { const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.25, .417), new THREE.MeshStandardMaterial({ map: tex, roughness: .8 })); sign.position.set(0, .73, z); sign.rotation.y = z < 0 ? Math.PI : 0; root.add(sign); }
  // Soft grounding survives the lowest graphics tier without extra shadow passes.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128; const ctx = shadowCanvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 15, 64, 64, 64); gradient.addColorStop(0, 'rgba(31,37,29,.25)'); gradient.addColorStop(1, 'rgba(31,37,29,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .014; root.add(shadow);
}
