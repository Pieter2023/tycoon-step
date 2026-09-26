import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { styleCharacter, sitHips, SIT_DROP } from '../components/town/townResidents';
import { createBlink, LID_OPEN } from '../components/town/townCharacterExpression';
import { CLIP_GROUND_SPEED } from '../components/town/townLocomotion';

// A minimal stand-in for public/models/town/town-people.glb: an armature node, a Hips joint,
// a two-material skinned body with the Fem and Blink morph targets, and two optional hair parts.
function townsperson() {
  const root = new THREE.Group(), character = new THREE.Group(); character.name = 'Character'; root.add(character);
  const hips = new THREE.Bone(); hips.name = 'Hips'; hips.position.y = .945; character.add(hips);
  const skeleton = new THREE.Skeleton([hips]);
  const part = (name: string, material: string) => {
    const geometry = new THREE.BoxGeometry(.1, .1, .1); geometry.morphAttributes.position = [geometry.attributes.position.clone(), geometry.attributes.position.clone()];
    const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial({ name: material })); mesh.name = name;
    mesh.morphTargetDictionary = { Fem: 0, Blink: 1 }; mesh.morphTargetInfluences = [0, 0]; mesh.bind(skeleton); character.add(mesh); return mesh;
  };
  return { root, hips, shirt: part('Body', 'shirt'), trousers: part('Body_1', 'trousers'), hair: part('Hair', 'hair'), long: part('Fem_HairLong', 'hair') };
}

describe('skinned townspeople', () => {
  it('styles a woman with long hair through parts, the Fem morph and material colours', () => {
    const p = townsperson();
    styleCharacter(p.root, { sex: 'f', hair: 'long', colors: { shirt: '#aa716a', trousers: '#354955', skirt: '#8c5a7e', hair: '#71503a' } });
    expect(p.hair.visible).toBe(false); expect(p.long.visible).toBe(true);
    expect(p.shirt.morphTargetInfluences![0]).toBe(1);
    expect('#' + (p.shirt.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('#aa716a');
    expect('#' + (p.trousers.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('#8c5a7e');   // women's trousers take the skirt palette
    expect(p.root.getObjectByName('Character')!.scale.x).toBeCloseTo(.95);
  });
  it('styles a man with short hair and no female build', () => {
    const p = townsperson(); styleCharacter(p.root, { sex: 'm', hair: 'short' });
    expect(p.hair.visible).toBe(true); expect(p.long.visible).toBe(false); expect(p.shirt.morphTargetInfluences![0]).toBe(0);
  });
  it('lowers the hips onto seats fitted to the old model, and leaves the old model alone', () => {
    const p = townsperson(); sitHips(p.root); expect(p.hips.position.y).toBeCloseTo(.945 - SIT_DROP);
    expect(.945 - SIT_DROP).toBeCloseTo(.82);
    const rigid = new THREE.Group(), hips = new THREE.Object3D(); hips.name = 'Hips'; hips.position.y = .82; rigid.add(hips);
    sitHips(rigid); expect(hips.position.y).toBeCloseTo(.82);
  });
  it('drops the hips once per value the mixer writes, not once per frame', () => {
    // The mixer skips joints whose value did not change (the still Sit clip, or dt 0 under reduced motion).
    const p = townsperson(); for (let frame = 0; frame < 5; frame++) sitHips(p.root);
    expect(p.hips.position.y).toBeCloseTo(.945 - SIT_DROP);
    p.hips.position.y = .95; sitHips(p.root); sitHips(p.root);   // a new value from the clip is lowered once
    expect(p.hips.position.y).toBeCloseTo(.95 - SIT_DROP);
  });
  it('blinks now and then through the Blink morph, never under reduced motion', () => {
    const p = townsperson(), blink = createBlink(p.root, 3); let closed = 0;
    for (let t = 0; t < 12; t += .02) { blink(t); closed = Math.max(closed, p.shirt.morphTargetInfluences![1]); }
    expect(closed).toBeGreaterThan(.9);
    blink(0, true); expect(p.shirt.morphTargetInfluences![1]).toBe(0);
  });
  it('blinks the hero by lowering his Eyelids mesh, hidden between blinks and under reduced motion', () => {
    const root = new THREE.Group(), head = new THREE.Bone(); head.name = 'Head'; root.add(head);
    const lids = new THREE.Mesh(new THREE.PlaneGeometry(.1, .02), new THREE.MeshStandardMaterial()); lids.name = 'Eyelids'; lids.scale.y = LID_OPEN; head.add(lids);
    const blink = createBlink(root, 1); expect(lids.visible).toBe(false);
    let closed = 0, shownOpen = false;
    for (let t = 0; t < 12; t += .01) { blink(t); closed = Math.max(closed, lids.scale.y); if (lids.visible && lids.scale.y <= LID_OPEN) shownOpen = true; }
    expect(closed).toBeGreaterThan(.95); expect(shownOpen).toBe(false);
    blink(0, true); expect(lids.visible).toBe(false); expect(lids.scale.y).toBe(LID_OPEN);
  });
  it('plays walk and run at the ground speed their strides were built for', () => {
    expect(CLIP_GROUND_SPEED.Walk).toBeCloseTo(1.03125); expect(CLIP_GROUND_SPEED.Run).toBeCloseTo(1.5);
  });
});
