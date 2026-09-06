import { describe,it,expect,afterEach,vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { Asset, AssetType } from '../types';
import { calculateMonthlyCashFlow, calculateMonthlyCashFlowEstimate, processTurn, clearSimSeed } from '../services/gameLogic';
import { resolveTownAction, townMission } from '../services/townProgress';
import { findTownPath, isWalkable, segmentClear, slideMovement } from '../components/town/townNavigation';
import { TOWN_PLACES } from '../components/town/townWorld';
import { saveAdultGame,loadAdultGame } from '../services/storageService';
const base=()=>({...structuredClone(INITIAL_GAME_STATE),character:CHARACTERS[0],cash:8000});
const cart:Asset={id:'cart',marketItemId:'coffee_cart',incomeModelVersion:2,name:'Coffee Cart',type:AssetType.BUSINESS,value:1500,costBasis:1500,quantity:1,cashFlow:30,currentMonthIncome:30,volatility:.18,appreciationRate:.01,baseYield:.24,priceHistory:[]};
afterEach(()=>{vi.restoreAllMocks();clearSimSeed();localStorage.clear();});
describe('city movement and first business',()=>{
 it('routes around benches, planters and tables to every entrance',()=>{
   for(const start of [{x:0,z:7},{x:6,z:8.2},{x:10,z:6},{x:-10,z:9}])for(const p of TOWN_PLACES){
     const path=findTownPath(start,{x:p.x,z:-1.1});expect(path.length).toBeGreaterThan(0);let previous=start;
     for(const node of path){expect(isWalkable(node)).toBe(true);expect(segmentClear(previous,node)).toBe(true);previous=node;}
     expect(Math.hypot(previous.x-p.x,previous.z+1.1)).toBeLessThan(.2);
   }
 });
 it('blocks direct movement into the bench and snaps furniture taps to reachable ground',()=>{
   expect(slideMovement({x:6,z:8},{x:6,z:7.8})).toEqual({x:6,z:8});
   const path=findTownPath({x:0,z:7},{x:6,z:7.2});expect(isWalkable(path.at(-1)!)).toBe(true);
 });
 it('charges real permit and upgrade costs once and guards pending events and low balances',()=>{
   const s={...base(),assets:[cart]};const permit=resolveTownAction(s,'permit');expect(permit.cash).toBe(7940);expect(resolveTownAction(permit,'permit')).toBe(permit);
   const upgraded=resolveTownAction(permit,'upgrade');expect(upgraded.cash).toBe(7590);expect(upgraded.assets[0].opsUpgrade).toBe(true);expect(resolveTownAction(upgraded,'upgrade')).toBe(upgraded);
   expect(resolveTownAction({...s,cash:50},'permit').cash).toBe(50);
   const blocked={...s,pendingScenario:{id:'p'} as any};expect(resolveTownAction(blocked,'permit')).toBe(blocked);
 });
 it('pays no coffee income before licensing, including Easy bonuses and forecasts',()=>{
   const s={...base(),assets:[cart],difficulty:'EASY' as const};
   expect(calculateMonthlyCashFlow(s).passive).toBe(0);expect(calculateMonthlyCashFlowEstimate(s).passive).toBe(0);
   const permitted=resolveTownAction(s,'permit');expect(calculateMonthlyCashFlow(permitted).passive).toBeGreaterThan(0);
 });
 it('finishes the mission only after a funded reserve, ownership, licensing and a trading month',()=>{
   let s=base();expect(townMission(s).step).toBe(1);expect(resolveTownAction({...s,cash:1},'reserve').townProgress).toBeUndefined();
   s=resolveTownAction(s,'reserve');expect(s.cash).toBe(8000);expect(townMission(s).step).toBe(2);
   s={...s,assets:[cart]};expect(townMission(s).step).toBe(3);s=resolveTownAction(s,'permit');expect(townMission(s).step).toBe(4);
   expect(townMission({...s,month:s.month+1}).step).toBe(5);
 });
 it('preserves mission, camera and actual month receipt through save and reload',()=>{
   vi.spyOn(Math,'random').mockReturnValue(.5);let s=resolveTownAction({...base(),assets:[cart]},'permit');
   s={...s,townView:{x:1,z:7,yaw:1,pitch:.4,distance:9}};
   const next=processTurn(s).newState;expect(next.lastMonthlyReport?.assetPayments?.[0].amount).toBeGreaterThan(0);
   expect(next.lastMonthlyReport?.cashBefore).toBe(s.cash);expect(next.lastMonthlyReport?.cashAfter).toBe(next.cash);
   expect(saveAdultGame(next)).toBe(true);const loaded=loadAdultGame()!;expect(loaded.townView).toEqual(s.townView);expect(loaded.townProgress).toEqual(next.townProgress);expect(loaded.townProgress).toMatchObject(s.townProgress!);expect(loaded.lastMonthlyReport).toEqual(next.lastMonthlyReport);
 });
});

it('follows the cafe-to-cart route without cutting into furniture at the bends',()=>{
 let position={x:3.5,z:-1.1};const path=findTownPath(position,{x:2.2,z:9.8});let velocity={x:0,z:0};
 for(let tick=0;tick<2500&&path.length;tick++){
  const dx=path[0].x-position.x,dz=path[0].z-position.z,len=Math.hypot(dx,dz);
  if(len<.035){path.shift();velocity={x:0,z:0};continue;}
  const speed=Math.min(2.8,len*5),blend=1-Math.exp(-.016*14);
  velocity.x+=(dx/len*speed-velocity.x)*blend;velocity.z+=(dz/len*speed-velocity.z)*blend;
  position=slideMovement(position,{x:position.x+velocity.x*.016,z:position.z+velocity.z*.016});
 }
 expect(path).toHaveLength(0);expect(Math.hypot(position.x-2.2,position.z-9.8)).toBeLessThan(.05);
});
