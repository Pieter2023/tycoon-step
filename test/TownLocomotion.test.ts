import {describe,it,expect} from 'vitest';
import {followRoute,locomotionClip,turnSpeedFactor} from '../components/town/townLocomotion';
import {routeSpeed} from '../components/town/townControls';
describe('natural movement',()=>{
 it('continues around a clear corner without stopping and settles at the final destination',()=>{
  const route=[{x:0,z:0},{x:3,z:0}];
  const corner=followRoute({x:0,z:.2},route,false,()=>true);
  expect(corner.path).toHaveLength(1);expect(corner.speed).toBeGreaterThan(2);
  const arrival=followRoute({x:2.95,z:0},corner.path,false,()=>true);
  expect(arrival.speed).toBeLessThan(.4);
  expect(followRoute({x:3,z:0},arrival.path,false,()=>true).path).toHaveLength(0);
 });
 it('keeps a corner when smoothing would cut through a building',()=>{
  expect(followRoute({x:0,z:.2},[{x:0,z:0},{x:3,z:0}],false,()=>false).path).toHaveLength(2);
 });
 it('eases from a jog to a walk without a speed jump at four metres',()=>{
  expect(Math.abs(routeSpeed(4.01,false)-routeSpeed(3.99,false))).toBeLessThan(.02);
 });
 it('does not alternate between walk and run near the blend boundary',()=>{
  expect(locomotionClip(2.7,'Run')).toBe('Run');expect(locomotionClip(2.7,'Walk')).toBe('Walk');
  expect(locomotionClip(0,'Run')).toBe('Idle');
 });
 it('slows before reversing direction and uses the short turn across the wrap',()=>{
  expect(turnSpeedFactor(0,Math.PI)).toBeLessThan(.3);
  expect(turnSpeedFactor(Math.PI-.01,-Math.PI+.01)).toBeGreaterThan(.99);
 });
});

import {readFileSync} from 'node:fs';
it('ships only the intended desk meshes, within the mobile geometry budget',()=>{
 for(const name of ['teller','estate']){
  const b=readFileSync(`public/models/town/${name}-desk.glb`);
  const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
  expect(g.nodes.every((n:any)=>n.name.startsWith('EXPORT_PRP_'+name+'_'))).toBe(true);
  expect(g.meshes.reduce((n:number,m:any)=>n+m.primitives.length,0)).toBeLessThanOrEqual(8);
  expect(g.meshes.reduce((n:number,m:any)=>n+m.primitives.reduce((a:number,p:any)=>a+g.accessors[p.indices].count/3,0),0)).toBeLessThan(12000);
  expect(b.length).toBeLessThan(50000);
 }
});
