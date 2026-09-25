export const normalizeStick = (x: number, z: number) => {
  const length = Math.hypot(x, z);
  if (length < .12) return { x: 0, z: 0 };
  const magnitude = Math.min(1, (length - .12) / .88);
  return { x: x / length * magnitude, z: z / length * magnitude };
};
export const cameraRelativeMovement = (x: number, z: number, yaw: number) => ({
  x: x * Math.cos(yaw) + z * Math.sin(yaw),
  z: -x * Math.sin(yaw) + z * Math.cos(yaw)
});

export type CameraPreset = 'follow' | 'overview';
export const cameraPreset = (mode:CameraPreset, inside:boolean) => mode==='overview'
  ? {pitch:inside?.82:.86,distance:inside?10.5:14}
  : {pitch:inside?.65:.45,distance:inside?9:11.5};
// Outdoors a longer lens (narrower field of view) from a little further back flattens the toy-like
// perspective of a close chase camera and shows more of the square; rooms keep their wider framing.
export const cameraFov = (aspect:number, inside:boolean) => inside ? (aspect<.8?58:48) : (aspect<.8?52:40);
export const turnTowards = (current:number,target:number,dt:number,rate=8) => {
  const delta=((target-current+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
  return current+delta*(1-Math.exp(-Math.max(0,dt)*rate));
};
export const isWalkTap = (distance:number,hadPinch:boolean,cancelled:boolean) => distance<=8&&!hadPinch&&!cancelled;
export const WALK_SPEED = 2.1, JOG_SPEED = 3.7;
// Tap-to-walk and guided routes jog while the destination is far, then settle into a walk for the last stretch.
// Scripted service trips (cart shift) always hurry so the customer moment arrives quickly.
export const routeSpeed = (remaining:number, hurry:boolean) => hurry ? JOG_SPEED : WALK_SPEED + (JOG_SPEED-WALK_SPEED)*Math.max(0,Math.min(1,(remaining-3)/3));
