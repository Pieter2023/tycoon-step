import {describe,it,expect} from 'vitest';
import {INITIAL_GAME_STATE,CHARACTERS} from '../constants';
import {GameState,AssetType} from '../types';
import {townJourney,completeTownJourney} from '../services/townJourney';
import {resolveTownAction} from '../services/townProgress';
import {runCartShift} from '../services/townActivities';
import {cameraPreset,isWalkTap,turnTowards} from '../components/town/townControls';
import {findTownPath,slideMovement} from '../components/town/townNavigation';
const base=():GameState=>({...structuredClone(INITIAL_GAME_STATE),character:CHARACTERS[0],cash:8000,month:1});
const cart={id:'c',marketItemId:'coffee_cart',name:'Coffee Cart',type:AssetType.BUSINESS,value:1500,costBasis:1500,quantity:1,cashFlow:30,volatility:.18,appreciationRate:.01,priceHistory:[]};
describe('guided opening journey',()=>{
 it('guides reserve, purchase, permit, first shift and review in order, awarding no cash',()=>{
  let s=base();expect(townJourney(s).action).toBe('bank');
  s=resolveTownAction(s,'reserve');expect(townJourney(s).action).toBe('business');
  s={...s,assets:[cart]};expect(townJourney(s).step).toBe(2);
  s=resolveTownAction(s,'permit');expect(townJourney(s).step).toBe(3);
  s=runCartShift(s,{price:5,stock:12});expect(townJourney(s).action).toBe('review');expect(completeTownJourney(s)).toBe(s);
  s={...s,month:2,lastMonthlyReport:{month:2} as any};expect(townJourney(s).action).toBe('finish');
  const done=completeTownJourney(s);expect(done.cash).toBe(s.cash);expect(townJourney(done).completed).toBe(true);expect(completeTownJourney(done)).toBe(done);
  expect(townJourney({...done,assets:[]}).completed).toBe(true);
 });
 it('resolves pending events first and cannot award a badge during one',()=>{
  const s={...base(),pendingScenario:{id:'p'} as any};expect(townJourney(s).action).toBe('event');expect(completeTownJourney(s)).toBe(s);
 });
 it('keeps the first shift when later shifts replace its receipt, including old saves',()=>{
  let s=resolveTownAction({...base(),assets:[cart]},'permit');s=runCartShift(s,{price:5,stock:12});
  s=runCartShift({...s,month:2},{price:5,stock:12});expect(s.townProgress?.firstShiftMonth).toBe(1);
  const legacy={...s,townProgress:{...s.townProgress,firstShiftMonth:undefined}};
  expect(townJourney(legacy).step).toBe(0); // A shift does not silently confirm the reserve.
  expect(runCartShift({...legacy,month:3},{price:5,stock:12}).townProgress?.firstShiftMonth).toBe(2);
 });
});
it('takes the shortest turn across the angle boundary and keeps comfortable room presets',()=>{
 const angle=turnTowards(Math.PI-.01,-Math.PI+.01,.1);expect(angle).toBeGreaterThan(Math.PI-.01);expect(angle).toBeLessThan(Math.PI+.01);
 expect(cameraPreset('overview',false).distance).toBeGreaterThan(cameraPreset('follow',false).distance);
 expect(cameraPreset('overview',true).distance).toBeLessThan(12);
 expect(isWalkTap(4,false,false)).toBe(true);expect(isWalkTap(4,true,false)).toBe(false);expect(isWalkTap(9,false,false)).toBe(false);expect(isWalkTap(1,false,true)).toBe(false);
});
it('walks from the customer side to the serving side without cutting through the cart',()=>{
 let p={x:2.2,z:9.8},v={x:0,z:0};const path=findTownPath(p,{x:2.2,z:7.4});
 for(let tick=0;tick<2500&&path.length;tick++){
  const dx=path[0].x-p.x,dz=path[0].z-p.z,len=Math.hypot(dx,dz);
  if(len<.035){path.shift();v={x:0,z:0};continue;}
  const speed=Math.min(2.1,Math.sqrt(9*len),len*7),blend=1-Math.exp(-.016*10);
  v.x+=(dx/len*speed-v.x)*blend;v.z+=(dz/len*speed-v.z)*blend;
  p=slideMovement(p,{x:p.x+v.x*.016,z:p.z+v.z*.016});
 }
 expect(path).toHaveLength(0);expect(Math.hypot(p.x-2.2,p.z-7.4)).toBeLessThan(.05);
});
