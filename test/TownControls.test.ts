import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { cameraRelativeMovement, normalizeStick } from '../components/town/townControls';
describe('third-person controls and Blender assets', () => {
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
    expect(normalizeStick(.5,0)).toEqual({x:.5,z:0});
  });
  it('ships separate playable animation clips and a compressed town under 2MB', () => {
    const read = (path:string) => { const b=readFileSync(path); return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString()); };
    const character = read('public/models/town/town-character.glb');
    expect(character.animations.map((a:any)=>a.name).sort()).toEqual(['Celebrate','Idle','Run','Serve','Walk','Wave']);
    for (const clip of character.animations) {
      const joints=clip.channels.map((c:any)=>character.nodes[c.target.node].name);
      expect(joints).toEqual(expect.arrayContaining(['Hips','Thigh1','Knee1','Ankle1']));
      if(clip.name!=='Idle')expect(joints).toContain('Shoulder1');
    }
    const city='public/models/town/freedom-square.glb';
    expect(read(city).extensionsUsed).toContain('KHR_draco_mesh_compression');
    expect(statSync(city).size).toBeLessThan(2_000_000);
  });
});
