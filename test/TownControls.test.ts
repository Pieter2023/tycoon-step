import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { cameraRelativeMovement, normalizeStick, cameraPreset, cameraFov } from '../components/town/townControls';
import { LID_OPEN } from '../components/town/townCharacterExpression';
describe('third-person controls and Blender assets', () => {
  it('frames the square with a longer lens from further back, and keeps rooms as they were', () => {
    const follow = cameraPreset('follow', false);
    expect(follow.distance).toBeGreaterThan(10); expect(follow.pitch).toBeGreaterThan(.4); expect(follow.pitch).toBeLessThan(.6);
    expect(cameraPreset('follow', true)).toEqual({ pitch: .65, distance: 9 });
    expect(cameraFov(16 / 9, false)).toBeLessThan(cameraFov(16 / 9, true));
    expect(cameraFov(9 / 19, false)).toBeGreaterThan(cameraFov(16 / 9, false));   // phones keep a wider view
    expect(cameraFov(16 / 9, true)).toBe(48); expect(cameraFov(9 / 19, true)).toBe(58);
  });
  it('keeps forward movement aligned with the camera after rotation', () => {
    const forward = cameraRelativeMovement(0, -1, Math.PI / 2);
    expect(forward.x).toBeCloseTo(-1); expect(forward.z).toBeCloseTo(0);
    const right = cameraRelativeMovement(1, 0, Math.PI / 2);
    expect(right.x).toBeCloseTo(0); expect(right.z).toBeCloseTo(-1);
  });
  it('prevents faster diagonal movement and ignores joystick drift', () => {
    const stick = normalizeStick(1, 1);
    expect(Math.hypot(stick.x, stick.z)).toBeCloseTo(1);
    expect(normalizeStick(.04, -.03)).toEqual({x:0,z:0});
    expect(normalizeStick(.5,0).x).toBeCloseTo(.38/.88);
    expect(normalizeStick(.121,0).x).toBeLessThan(.002);
  });
  it('ships separate playable animation clips and a compressed town under 2MB', () => {
    const read = (path:string) => { const b=readFileSync(path); return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString()); };
    const character = read('public/models/town/town-people.glb');
    expect(character.animations.map((a:any)=>a.name).sort()).toEqual(['Celebrate','Idle','Run','Serve','Sit','Walk','Wave']);
    for (const clip of character.animations) {
      const joints=clip.channels.map((c:any)=>character.nodes[c.target.node].name);
      expect(joints).toEqual(expect.arrayContaining(['Hips','Thigh1','Knee1','Ankle1']));
      if(clip.name!=='Idle')expect(joints).toContain('Shoulder1');
    }
    // One skinned body whose joints keep the old names and an identity rest rotation, so the seated,
    // carrying and cycling poses (which set joint.rotation.x directly) still work.
    expect(character.skins).toHaveLength(1);
    const joints=character.skins[0].joints.map((i:number)=>character.nodes[i]);
    expect(joints.map((n:any)=>n.name)).toEqual(expect.arrayContaining(['Hips','Torso','Head','Shoulder1','Elbow1','Grip1','Grip-1','Thigh1','Knee1','Ankle1','Ankle-1']));
    for(const joint of joints)expect(joint.rotation??[0,0,0,1]).toEqual([0,0,0,1]);
    expect(character.meshes.find((m:any)=>m.name==='Body').extras.targetNames).toEqual(['Fem','Blink']);
    const city='public/models/town/freedom-square.glb';
    expect(read(city).extensionsUsed).toContain('KHR_draco_mesh_compression');
    expect(statSync(city).size).toBeLessThan(2_000_000);
    // Baked ambient occlusion (scripts/build-town-assets.py): one shared 1024 atlas on the second UV set for every material.
    const town = read(city);
    expect(town.images).toHaveLength(1);
    for (const m of town.materials) { expect(m.occlusionTexture.texCoord).toBe(1); expect(town.textures[m.occlusionTexture.index].source).toBe(0); }
    for (const p of town.meshes.flatMap((m:any)=>m.primitives)) expect(Object.keys(p.attributes)).toContain('TEXCOORD_1');
  });
  it('ships the AI-modelled Alex on the townspeople rig', () => {
    // scripts/build-town-hero.py: same joint names, identity rest rotations and seven clips, so the player's
    // direct poses (cup carry, apron on the Torso joint) and CLIP_GROUND_SPEED hold for the hero too.
    const path = 'public/models/town/town-hero-alex.glb';
    const b = readFileSync(path), hero = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
    expect(hero.animations.map((a:any)=>a.name).sort()).toEqual(['Celebrate','Idle','Run','Serve','Sit','Walk','Wave']);
    expect(hero.skins).toHaveLength(1);
    const joints = hero.skins[0].joints.map((i:number)=>hero.nodes[i]);
    expect(joints.map((n:any)=>n.name).sort()).toEqual(['Ankle-1','Ankle1','Elbow-1','Elbow1','Grip-1','Grip1','Head','Hips','Knee-1','Knee1','Shoulder-1','Shoulder1','Thigh-1','Thigh1','Torso']);
    for (const joint of joints) expect(joint.rotation ?? [0,0,0,1]).toEqual([0,0,0,1]);
    expect(hero.extensionsUsed).toContain('KHR_draco_mesh_compression');
    expect(statSync(path).size).toBeLessThan(700_000);
    // The blink: his eyes are painted into the texture, so the lids are a mesh on the Head joint, stored open
    // (squashed to LID_OPEN) and coloured by vertex (skin, then the lash line).
    const lid = hero.nodes.findIndex((n:any)=>n.name==='Eyelids');
    expect(hero.nodes.find((n:any)=>(n.children??[]).includes(lid))?.name).toBe('Head');
    expect(hero.nodes[lid].scale[1]).toBeCloseTo(LID_OPEN);
    expect(Object.keys(hero.meshes[hero.nodes[lid].mesh].primitives[0].attributes)).toContain('COLOR_0');
  });
});
