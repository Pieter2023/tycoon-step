import { TownPoint, clampTownPoint } from './townWorld';
// Footprints match the Blender scene. Player radius is included when testing them.
export const TOWN_OBSTACLES = [
  ...[-6, 6].map(x => ({ x, z: 7.18, w: 1.12, d: .36 })),
  ...[-14,-7,7,14].map(x => ({ x, z: 5.9, w: .24, d: .24 })),
  ...[-10.5,-3.5,3.5,10.5].flatMap(x => [-2.75,2.75].map(dx => ({ x:x+dx,z:-1.24,w:.5,d:.4 }))),
  ...[4.7,7.2].flatMap(x => [{x,z:.55,w:.5,d:.5},...[-.7,.7].map(dx=>({x:x+dx,z:.55,w:.2,d:.2}))]),
  ...[[-16,-1,1.35],[16,-1,1.4],[-12,8,1.5],[12,8,1.5]].map(([x,z,s])=>({x,z,w:s,d:s})),
  {x:2.2,z:8.7,w:.95,d:.6},
];
export const isWalkable = (p:TownPoint,radius=.30) => {
  const bounded=clampTownPoint(p);
  return bounded.x===p.x && bounded.z===p.z && !TOWN_OBSTACLES.some(o=>Math.abs(p.x-o.x)<o.w+radius && Math.abs(p.z-o.z)<o.d+radius);
};
export function slideMovement(from:TownPoint,to:TownPoint):TownPoint {
  const p=clampTownPoint(to);
  if(isWalkable(p))return p;
  if(isWalkable({x:p.x,z:from.z}))return {x:p.x,z:from.z};
  if(isWalkable({x:from.x,z:p.z}))return {x:from.x,z:p.z};
  return from;
}
const grid:TownPoint[]=[];
for(let z=-1;z<=10;z+=.5)for(let x=-16;x<=16;x+=.5)if(isWalkable({x,z},.42))grid.push({x,z});
const key=(p:TownPoint)=>`${p.x},${p.z}`;
const nodes=new Map(grid.map(p=>[key(p),p]));
const nearest=(p:TownPoint)=>grid.reduce((a,b)=>Math.hypot(b.x-p.x,b.z-p.z)<Math.hypot(a.x-p.x,a.z-p.z)?b:a,grid[0]);
export function segmentClear(a:TownPoint,b:TownPoint) {
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));
  for(let i=1;i<=steps;i++)if(!isWalkable({x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps},.42))return false;
  return true;
}
export function findTownPath(from:TownPoint,target:TownPoint):TownPoint[] {
  const end=isWalkable(clampTownPoint(target),.42)?clampTownPoint(target):nearest(target);
  if(segmentClear(from,end))return [end];
  const start=nearest(from),goal=nearest(end),open=[start],cost=new Map([[key(start),0]]),parent=new Map<string,TownPoint>();
  const score=(p:TownPoint)=>(cost.get(key(p))??Infinity)+Math.hypot(p.x-goal.x,p.z-goal.z);
  const closed=new Set<string>();
  while(open.length){open.sort((a,b)=>score(a)-score(b));const p=open.shift()!;
    if(key(p)===key(goal)){
      const path:TownPoint[]=[p];let n=p;while(parent.has(key(n))){n=parent.get(key(n))!;path.unshift(n);}
      if(segmentClear(path[path.length-1],end))path.push(end);
      // Keep only bends, preserving obstacle clearance.
      const smooth:TownPoint[]=[];let anchor=from;
      for(let i=0;i<path.length;){let j=i;while(j+1<path.length&&segmentClear(anchor,path[j+1]))j++;smooth.push(path[j]);anchor=path[j];i=j+1;}
      return smooth;
    }
    closed.add(key(p));
    for(const [dx,dz]of [[.5,0],[-.5,0],[0,.5],[0,-.5],[.5,.5],[.5,-.5],[-.5,.5],[-.5,-.5]]){
      const next=nodes.get(key({x:p.x+dx,z:p.z+dz}));if(!next||closed.has(key(next))||!segmentClear(p,next))continue;
      const c=cost.get(key(p))!+Math.hypot(dx,dz);if(c<(cost.get(key(next))??Infinity)){cost.set(key(next),c);parent.set(key(next),p);if(!open.includes(next))open.push(next);}
    }
  }
  return [];
}
