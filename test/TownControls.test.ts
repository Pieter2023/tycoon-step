import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { cameraRelativeMovement, normalizeStick, cameraPreset, cameraFov } from '../components/town/townControls';
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
