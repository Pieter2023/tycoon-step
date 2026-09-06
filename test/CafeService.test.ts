import { describe, it, expect, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState } from '../types';
import { CafeService, ServicePlan, createCafeService, resolveCafeService, stepCafeService, serviceTask, serviceReceipt, serviceStars, expectedGuests, SERVICE_STATIONS } from '../services/cafeService';
import { resolveCafeAction } from '../services/townCafe';
import { processTurn } from '../services/gameLogic';
import { saveAdultGame, loadAdultGame } from '../services/storageService';
const plan: ServicePlan = {price:4,stock:3,helper:false,pace:'relaxed'};
const base=():GameState=>({...structuredClone(INITIAL_GAME_STATE),character:CHARACTERS[0],cash:10000,month:4,cafe:{openedMonth:2,seats:true,machine:true,plan:{price:6,stock:400,helper:false,open:true}}} as GameState);
const tick=(s:CafeService,n=1)=>{for(let i=0;i<n;i++)s=stepCafeService(s,{type:'tick'});return s;};
const interact=(s:CafeService)=>stepCafeService(s,{type:'interact',point:SERVICE_STATIONS[serviceTask(s)!.station]});
afterEach(()=>localStorage.clear());
describe('hands-on café service',()=>{
 it('charges committed costs once and blocks invalid or unavailable shifts',()=>{
  const s=base(), opened=resolveCafeService(s,{type:'start',plan});expect(opened.cash).toBe(9991);expect(s.cash).toBe(10000);
  expect(resolveCafeService(opened,{type:'start',plan})).toBe(opened);
  for(const bad of [{...s,cafe:undefined},{...s,cash:8},{...s,pendingScenario:{id:'pending'} as any},{...s,hasWon:true},{...s,isBankrupt:true},{...s,cafe:{...s.cafe!,plan:{...s.cafe!.plan,open:false}}}])expect(resolveCafeService(bad,{type:'start',plan})).toBe(bad);
  expect(resolveCafeService(s,{type:'start',plan:{...plan,stock:99} as any})).toBe(s);
 });
 it('requires visiting the correct stations, collecting the drink and waiting for the guest to sit',()=>{
  let s=createCafeService(4,plan,{seats:true,machine:true});
  expect(s.guests).toHaveLength(4);expect(expectedGuests(4,plan)).toBe(4);
  expect(stepCafeService(s,{type:'interact',point:{x:0,z:5}})).toBe(s);
  expect(stepCafeService(s,{type:'interact',point:{x:NaN,z:.8}})).toBe(s);
  s=interact(s);expect(serviceTask(s)?.kind).toBe('brew');
  s=interact(s);expect(s.prepared).toBe(1);expect(serviceTask(s)?.kind).toBe('wait');
  s=tick(s,2);expect(s.ready).toBe(0);expect(s.cupFor).toBeUndefined();expect(serviceTask(s)?.kind).toBe('pickup');
  s=interact(s);expect(s.cupFor).toBe(0);expect(s.ready).toBeUndefined();expect(serviceTask(s)?.kind).toBe('wait');expect(interact(s)).toBe(s);
  s=tick(s,3);expect(serviceTask(s)?.kind).toBe('serve');s=interact(s);expect(serviceReceipt(s).served).toBe(1);expect(s.guests[0].tip).toBe(1);
 });
 it('lets the owner take the next order while a drink brews and tips only quick service',()=>{
  let s=createCafeService(4,{...plan,stock:6},{seats:false,machine:false});
  s=tick(s,7);expect(s.guests[1].status).toBe('queued');
  s=interact(s);expect(s.guests[0].status).toBe('ordered');expect(serviceTask(s)?.kind).toBe('take');
  s=interact(s);expect(s.guests[1].status).toBe('ordered');expect(serviceTask(s)?.kind).toBe('brew');
  s=interact(s);expect(s.brewing?.guest).toBe(0);expect(serviceTask(s)?.kind).toBe('wait');
  s=tick(s,7);expect(s.ready).toBe(0);expect(s.brewing).toBeUndefined();expect(serviceTask(s)?.kind).toBe('pickup'); // a finished drink comes first
  s=interact(s);expect(s.cupFor).toBe(0);expect(serviceTask(s)?.kind).toBe('serve'); // counter guest: no seat delay
  s=interact(s);expect(s.guests[0]).toMatchObject({status:'served',tip:1});
  expect(serviceTask(s)?.kind).toBe('take'); // Leo arrived while it brewed
  s=interact(s);expect(interact(s).brewing?.guest).toBe(1); // Sam's drink starts straight after
  let slow=createCafeService(3,{...plan,price:6},{seats:false,machine:true});slow=interact(slow);slow=tick(slow,40);
  slow=interact(slow);/* Sam's order */slow=interact(slow);/* brew Mia's */slow=tick(slow,2);slow=interact(slow);/* pick up */slow=interact(slow);/* serve late */
  expect(slow.guests[0]).toMatchObject({status:'served',tip:0});
  expect(serviceReceipt(s).tips).toBe(1);expect(serviceReceipt(s).revenue).toBe(5);
 });
 it('lets a helper take orders so the owner only brews and delivers',()=>{
  let s=createCafeService(4,{...plan,helper:true},{seats:false,machine:true});
  expect(serviceTask(s)?.kind).toBe('wait');expect(interact(s)).toBe(s);
  s=tick(s,3);expect(s.guests[0]).toMatchObject({status:'ordered',helperTook:true});expect(serviceTask(s)?.kind).toBe('brew');
 });
 it('rates the shift: everyone served earns two stars, quick service the third',()=>{
  let s=createCafeService(4,{...plan,stock:6},{seats:false,machine:true});
  expect(serviceStars(s)).toBe(0);
  for(let guard=0;guard<400&&s.status==='active';guard++){const task=serviceTask(s)!;s=task.kind==='wait'?tick(s):interact(s);}
  expect(serviceReceipt(s)).toMatchObject({served:4,left:0});expect(serviceStars(s)).toBe(3);
  const partial={...s,guests:s.guests.map((g,i)=>i===3?{...g,status:'left' as const,tip:undefined}:g)};expect(serviceStars(partial)).toBe(1);
  const untipped={...s,guests:s.guests.map(g=>({...g,tip:0}))};expect(serviceStars(untipped)).toBe(2);
 });
 it('settles each sale and tip once and preserves the shift across save and reload',()=>{
  let s=resolveCafeService(base(),{type:'start',plan});
  for(let guard=0;guard<400&&s.cafe!.service!.status==='active';guard++){
   const task=serviceTask(s.cafe!.service!);
   s=resolveCafeService(s,task?.kind==='wait'?{type:'tick'}:{type:'interact',point:SERVICE_STATIONS[task!.station]});
   if(guard===4){expect(saveAdultGame(s)).toBe(true);s=loadAdultGame()!;}
  }
  const receipt=serviceReceipt(s.cafe!.service!);
  expect(receipt).toMatchObject({served:3,left:1,wasted:0,guests:4});expect(receipt.tips).toBeGreaterThan(0);
  expect(receipt.profit).toBe(receipt.revenue-9);expect(s.cash).toBe(10000-9+receipt.revenue);
  expect(resolveCafeService(s,{type:'finish'})).toBe(s);expect(resolveCafeService(s,{type:'start',plan})).toBe(s);
  expect(s.events.filter(e=>e.title==='Owner shift results')).toHaveLength(1);
 });
 it('expires impatient guests and discards their drinks without sales',()=>{
  let s=createCafeService(4,{...plan,pace:'rush'},{seats:false,machine:false});
  s=interact(s);s=interact(s);s=tick(s,35);expect(s.ready).toBeUndefined();expect(s.cupFor).toBeUndefined();expect(s.guests[0].status).toBe('left');
  s=tick(s,16);expect(s.status).toBe('complete');expect(serviceReceipt(s)).toMatchObject({served:0,left:4,profit:-9,wasted:3});
 });
 it('makes early finishing final with no stock refund and prevents mid-shift lease changes',()=>{
  const s=resolveCafeService(base(),{type:'start',plan:{...plan,stock:6,helper:true}});
  expect(s.cash).toBe(9982);expect(resolveCafeAction(s,{type:'close'})).toBe(s);
  expect(resolveCafeAction(s,{type:'plan',plan:{...s.cafe!.plan,open:false}})).toBe(s);
  const ended=resolveCafeService(s,{type:'finish'});expect(ended.cash).toBe(9982);expect(serviceReceipt(ended.cafe!.service!)).toMatchObject({left:4,wasted:6,wages:3,profit:-18});
 });
 it('teaches the price, demand, staffing and stock tradeoffs',()=>{
  const regular=createCafeService(3,plan,{seats:false,machine:false}), premium=createCafeService(3,{...plan,price:6},{seats:false,machine:false}), helper=createCafeService(3,{...plan,helper:true},{seats:false,machine:false});
  expect(regular.guests).toHaveLength(3);expect(premium.guests).toHaveLength(2);expect(premium.guests[0].deadline).toBeLessThan(regular.guests[0].deadline);expect(helper.guests[0].deadline).toBe(regular.guests[0].deadline+12);
  expect(interact(interact(regular)).brewing?.readyAt).toBe(4);expect(interact(tick(helper,3)).brewing?.readyAt).toBe(6);
 });
 it('ends an unfinished shift on month advance without paying twice or mutating the saved input',()=>{
  const s=resolveCafeService(base(),{type:'start',plan});const before=structuredClone(s);
  const {newState}=processTurn(s);expect(s).toEqual(before);expect(newState.cafe?.service?.status).toBe('complete');
  expect(newState.cafe?.service?.month).toBe(4);expect(newState.month).toBe(5);
  expect(resolveCafeService(newState,{type:'interact',point:SERVICE_STATIONS.counter})).toBe(newState);
  const next=resolveCafeService({...newState,pendingScenario:undefined},{type:'start',plan});expect(next.cafe?.service?.month).toBe(5);
 });
});
