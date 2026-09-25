import { TownPoint } from './townWorld';
import { routeSpeed } from './townControls';

/** Keep momentum through visible corners, brake only at the final destination. */
export function followRoute(position:TownPoint, route:TownPoint[], hurry:boolean, clear:(a:TownPoint,b:TownPoint)=>boolean) {
  let path=route;
  while(path.length>1&&Math.hypot(path[0].x-position.x,path[0].z-position.z)<.32&&clear(position,path[1])) path=path.slice(1);
  const target=path[0];
  if(!target)return {path,movement:{x:0,z:0},speed:0};
  const dx=target.x-position.x,dz=target.z-position.z,distance=Math.hypot(dx,dz);
  if(distance<.035)return {path:path.slice(1),movement:{x:0,z:0},speed:0};
  let remaining=distance;
  for(let i=1;i<path.length;i++)remaining+=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);
  const cruise=routeSpeed(remaining,hurry);
  return {path,movement:{x:dx/distance,z:dz/distance},speed:path.length===1?Math.min(cruise,Math.sqrt(9*distance),distance*7):Math.min(cruise,Math.max(.7,distance*10))};
}

// Hysteresis avoids repeatedly restarting the walk/run blend near a speed boundary.
export function locomotionClip(speed:number,previous:string):'Idle'|'Walk'|'Run' {
  if(speed<(previous==='Idle'?.10:.055))return 'Idle';
  return speed>(previous==='Run'?2.45:2.95)?'Run':'Walk';
}
export function turnSpeedFactor(current:number,target:number) {
  const error=Math.abs(Math.atan2(Math.sin(target-current),Math.cos(target-current)));
  return .28+.72*Math.max(0,Math.cos(error));
}
