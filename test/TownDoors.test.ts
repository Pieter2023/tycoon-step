import {describe,it,expect} from 'vitest';
import {doorwayEntry,TOWN_DOORS} from '../components/town/townDoors';
import {slideMovement} from '../components/town/townNavigation';
import {cameraRelativeMovement} from '../components/town/townControls';
describe('walk through building doors',()=>{
 for(const door of TOWN_DOORS){
  it(`enters ${door.room} by pushing through its reachable threshold`,()=>{
   const start={x:door.threshold.x-door.inward.x*.5,z:door.threshold.z-door.inward.z*.5};
   let position=start;
   for(let frame=0;frame<120;frame++)position=slideMovement(position,{x:position.x+door.inward.x*.02,z:position.z+door.inward.z*.02});
   expect(doorwayEntry(position,door.inward,1000,0)).toBe(door.room);
   expect(doorwayEntry(start,door.inward,1000,0)).toBeNull();
   expect(doorwayEntry(position,{x:0,z:0},1000,0)).toBeNull();
   expect(doorwayEntry(position,{x:-door.inward.z,z:door.inward.x},1000,0)).toBeNull();
   expect(doorwayEntry(position,{x:-door.inward.x,z:-door.inward.z},1000,0)).toBeNull();
   expect(doorwayEntry({...position,x:position.x+door.inward.z*1.1,z:position.z-door.inward.x*1.1},door.inward,1000,0)).toBeNull();
   expect(doorwayEntry(position,door.inward,1000,1800)).toBeNull();
  });
 }
 it('uses world direction after rotating the camera',()=>{
  expect(doorwayEntry({x:4.4,z:10},cameraRelativeMovement(0,-1,Math.PI),1000,0)).toBe('college');
 });
});
