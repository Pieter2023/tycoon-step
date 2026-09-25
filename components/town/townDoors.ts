import type { TownPoint } from './townWorld';
export type DoorRoom = 'bank'|'exchange'|'cafe'|'property'|'home'|'work'|'college';
type Door = {room:DoorRoom; threshold:TownPoint; inward:TownPoint; halfWidth:number};
// Thresholds sit just inside the walkable boundary, allowing the avatar radius
// to meet the door without ever requiring movement through a solid facade.
export const TOWN_DOORS:readonly Door[] = [
  ...(['bank','exchange','cafe','property'] as const).map((room,i)=>({room,threshold:{x:-10.5+i*7,z:-1.32},inward:{x:0,z:-1},halfWidth:.58})),
  {room:'home',threshold:{x:-15.92,z:7.4},inward:{x:-1,z:0},halfWidth:.52},
  {room:'work',threshold:{x:15.92,z:7.4},inward:{x:1,z:0},halfWidth:.52},
  {room:'college',threshold:{x:4.4,z:9.92},inward:{x:0,z:1},halfWidth:.58},
];
export function doorwayEntry(position:TownPoint,intent:TownPoint,now:number,lockedUntil:number):DoorRoom|null {
  const length=Math.hypot(intent.x,intent.z);
  if(now<lockedUntil || length<.08)return null;
  for(const door of TOWN_DOORS){
    const dx=position.x-door.threshold.x,dz=position.z-door.threshold.z;
    const depth=dx*door.inward.x+dz*door.inward.z;
    const across=dx*door.inward.z-dz*door.inward.x;
    const pushing=(intent.x*door.inward.x+intent.z*door.inward.z)/length;
    if(depth>=0 && depth<=.2 && Math.abs(across)<=door.halfWidth && pushing>.6)return door.room;
  }
  return null;
}
