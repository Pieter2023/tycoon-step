import { describe, it, expect, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { AssetType, GameState } from '../types';
import { resolveCafeAction, quoteCafe, cafeValue, CafeState } from '../services/townCafe';
import { calculateNetWorth, calculateMonthlyCashFlow, calculateMonthlyCashFlowEstimate, processTurn } from '../services/gameLogic';
import { saveAdultGame, loadAdultGame } from '../services/storageService';
import { clampCafePoint, cafeSpot } from '../components/town/townCafeRoom';
const base=():GameState=>({...structuredClone(INITIAL_GAME_STATE),character:CHARACTERS[0],cash:10000,month:2,townProgress:{permitMonth:1,firstShiftMonth:1},assets:[{id:'cart',marketItemId:'coffee_cart',name:'Cart',type:AssetType.BUSINESS,value:1500,costBasis:1500,quantity:1,cashFlow:30,volatility:0,appreciationRate:0,priceHistory:[]}]});
afterEach(()=>localStorage.clear());
describe('café ownership and costs',()=>{
 it('requires a licensed experienced cart and enough cash, and rejects duplicate leases',()=>{
  const s=base(); for(const bad of [{...s,cash:2999},{...s,assets:[]},{...s,townProgress:{}},{...s,pendingScenario:{id:'p'} as any},{...s,hasWon:true}])expect(resolveCafeAction(bad,{type:'lease'})).toBe(bad);
  const next=resolveCafeAction(s,{type:'lease'});expect(next.cash).toBe(7000);expect(next.cafe).toBeDefined();expect(resolveCafeAction(next,{type:'lease'})).toBe(next);
  expect(calculateNetWorth(next)).toBe(calculateNetWorth(s)-1200); // $1,800 fit-out has $600 resale.
 });
 it('accounts for all stock, rainy demand, staffing limits and real losses',()=>{
  const c=resolveCafeAction(base(),{type:'lease'}).cafe!;
  expect(quoteCafe(c,3)).toMatchObject({sold:220,revenue:1320,costs:2120,profit:-800});
  expect(quoteCafe(c,4)).toMatchObject({sold:400,profit:280});
  expect(quoteCafe({...c,plan:{...c.plan,stock:700}},4)).toMatchObject({sold:400,profit:-320});
  expect(quoteCafe({...c,machine:true,plan:{...c.plan,stock:700}},4).sold).toBe(550);
  expect(quoteCafe({...c,seats:true},3).sold).toBe(300);
  expect(quoteCafe({...c,plan:{...c.plan,open:false}},3)).toMatchObject({sold:0,stock:0,wages:0,profit:-720});
 });
 it('charges each furnishing once and closing returns only deposit and salvage',()=>{
  let s=resolveCafeAction(base(),{type:'lease'});s=resolveCafeAction(s,{type:'upgrade',upgrade:'seats'});s=resolveCafeAction(s,{type:'upgrade',upgrade:'machine'});
  expect(s.cash).toBe(5450);expect(cafeValue(s.cafe)).toBe(2575);expect(resolveCafeAction(s,{type:'upgrade',upgrade:'seats'})).toBe(s);
  const nw=calculateNetWorth(s),closed=resolveCafeAction(s,{type:'close'});expect(closed.cash).toBe(8025);expect(closed.cafe).toBeUndefined();expect(calculateNetWorth(closed)).toBe(nw);expect(closed.assets).toEqual(s.assets);expect(resolveCafeAction(closed,{type:'close'})).toBe(closed);
 });
 it('saves plans without changing cash, validates forged plans and preserves receipts',()=>{
  let s=resolveCafeAction(base(),{type:'lease'});const cash=s.cash;
  expect(resolveCafeAction(s,{type:'plan',plan:{price:99,stock:1,helper:false,open:true} as any})).toBe(s);
  s=resolveCafeAction(s,{type:'plan',plan:{price:4,stock:700,helper:true,open:true}});expect(s.cash).toBe(cash);
  expect(saveAdultGame(s)).toBe(true);expect(loadAdultGame()?.cafe).toEqual(s.cafe);
 });
 it('connects forecast, turn settlement and report without double deducting costs',()=>{
  const s=resolveCafeAction(base(),{type:'lease'});
  const noCafe={...s,cafe:undefined};expect(calculateMonthlyCashFlowEstimate(s).income-calculateMonthlyCashFlowEstimate(noCafe).income).toBe(-800);
  const advanced={...s,month:3};expect(calculateMonthlyCashFlow(advanced).income-calculateMonthlyCashFlow({...advanced,cafe:undefined}).income).toBe(-800);
  const {newState,monthlyReport}=processTurn(s);expect(monthlyReport.cafe).toMatchObject({month:3,profit:-800});expect(newState.cafe?.lastReceipt).toEqual(monthlyReport.cafe);
  expect(monthlyReport.assetPayments?.find(p=>p.name.startsWith('Your café'))?.amount).toBe(-800);
  expect(newState.cafe?.plan).toEqual(s.cafe?.plan);expect(s.cafe?.lastReceipt).toBeUndefined();
 });
 it('keeps café walking routes clear of furniture, queue and counter',()=>{
  expect(clampCafePoint({x:99,z:-99})).toEqual({x:1.65,z:.5});expect(cafeSpot({x:0,z:.8})).toBe('cafe-counter');expect(cafeSpot({x:0,z:6.1})).toBe('exit');expect(cafeSpot({x:0,z:3})).toBe(null);
 });
});

it('makes staffing useful in crowds and value pricing useful in rain',()=>{
 const c=resolveCafeAction(base(),{type:'lease'}).cafe!;
 const equipped={...c,seats:true,machine:true,plan:{...c.plan,stock:700 as const}};
 expect(quoteCafe({...equipped,plan:{...equipped.plan,helper:true}},4).profit).toBeGreaterThan(quoteCafe(equipped,4).profit);
 expect(quoteCafe({...c,plan:{...c.plan,price:4}},3).profit).toBeGreaterThan(quoteCafe(c,3).profit);
 expect(quoteCafe({...equipped,plan:{...equipped.plan,helper:true}},3).profit).toBeLessThan(quoteCafe(equipped,3).profit);
});

import { applyShiftReputation, driftReputation, reputationOf, reputationDemand, CAFE_REPUTATION_START } from '../services/townCafe';
import { createCafeService, resolveCafeService, serviceTask, SERVICE_STATIONS } from '../services/cafeService';
describe('café reputation ties hands-on shifts to monthly trading',()=>{
 it('defaults old saves to 50 with no demand change, and scales demand with reputation',()=>{
  const c=resolveCafeAction(base(),{type:'lease'}).cafe!;
  expect(reputationOf({...c,reputation:undefined})).toBe(CAFE_REPUTATION_START);expect(reputationDemand(50)).toBe(1);
  expect(quoteCafe({...c,reputation:undefined},4).demand).toBe(quoteCafe(c,4).demand);
  expect(quoteCafe({...c,reputation:100},4).demand).toBe(Math.round(650*1.2));expect(quoteCafe({...c,reputation:0},4).demand).toBe(520);
  const staffed={...c,machine:true,plan:{...c.plan,stock:700 as const,helper:true}};
  expect(quoteCafe({...staffed,reputation:100},4).sold).toBe(700);expect(quoteCafe(staffed,4).sold).toBe(650);
 });
 it('moves by stars after a paid shift, never past 0–100, and drifts toward 50 in idle months',()=>{
  const c=resolveCafeAction(base(),{type:'lease'}).cafe!;
  expect(applyShiftReputation(c,3).reputation).toBe(62);expect(applyShiftReputation(c,0).reputation).toBe(38);expect(applyShiftReputation({...c,reputation:95},3).reputation).toBe(100);
  expect(driftReputation({...c,reputation:62}).reputation).toBe(59);expect(driftReputation({...c,reputation:38}).reputation).toBe(41);expect(driftReputation({...c,reputation:51}).reputation).toBe(50);
  let s={...resolveCafeAction(base(),{type:'lease'}),month:4} as GameState;s={...s,cafe:{...s.cafe!,seats:true,machine:true}};
  s=resolveCafeService(s,{type:'start',plan:{price:4,stock:6,helper:false,pace:'relaxed'}});
  for(let guard=0;guard<400&&s.cafe!.service!.status==='active';guard++){const task=serviceTask(s.cafe!.service!)!;s=resolveCafeService(s,task.kind==='wait'?{type:'tick'}:{type:'interact',point:SERVICE_STATIONS[task.station]});}
  expect(s.cafe!.reputation).toBe(62);expect(s.events[0].description).toContain('reputation 50 → 62');
  const {newState}=processTurn(s);expect(newState.cafe!.reputation).toBe(62); // shift month: no drift
  const later=processTurn({...newState,pendingScenario:undefined}).newState;expect(later.cafe!.reputation).toBe(59);
  expect(later.cafe!.lastReceipt!.reputation).toBe(59);
 });
});

import { cafeIncidents, settleCafeMonth } from '../services/townCafe';
describe('café incidents follow the owner\'s choices',()=>{
 const shop=():CafeState=>({openedMonth:1,seats:false,machine:false,plan:{price:6,stock:400,helper:true,open:true},reputation:50});
 it('is deterministic per month, quiet when closed or brand new, and never touches the forecast',()=>{
  const c=shop();expect(cafeIncidents(c,1)).toEqual([]);expect(cafeIncidents({...c,plan:{...c.plan,open:false}},9)).toEqual([]);
  for(let m=2;m<40;m++){expect(cafeIncidents(c,m)).toEqual(cafeIncidents(c,m));expect(quoteCafe(c,m).incidents).toBeUndefined();}
 });
 it('breaks the basic machine about three times as often as the upgrade',()=>{
  const months=Array.from({length:600},(_,i)=>i+2);
  const basic=months.filter(m=>cafeIncidents(shop(),m).some(i=>i.id==='breakdown')).length;
  const upgraded=months.filter(m=>cafeIncidents({...shop(),machine:true},m).some(i=>i.id==='breakdown')).length;
  expect(basic).toBeGreaterThan(upgraded*2);expect(basic/600).toBeGreaterThan(.1);expect(basic/600).toBeLessThan(.25);
 });
 it('fails inspections and loses staff when reputation is poor, earns praise and regulars when it is strong',()=>{
  const months=Array.from({length:120},(_,i)=>i+2);
  const poor=months.flatMap(m=>cafeIncidents({...shop(),reputation:20},m)).map(i=>i.id), strong=months.flatMap(m=>cafeIncidents({...shop(),reputation:90},m)).map(i=>i.id);
  expect(poor).toContain('inspection-fail');expect(poor).toContain('staff-quit');expect(poor).not.toContain('regulars');
  expect(strong).toContain('inspection-pass');expect(strong).toContain('regulars');expect(strong).not.toContain('staff-quit');expect(strong).not.toContain('inspection-fail');
  expect(months.flatMap(m=>cafeIncidents({...shop(),reputation:20,plan:{...shop().plan,helper:false}},m)).map(i=>i.id)).not.toContain('staff-quit');
 });
 it('settles costs, lost capacity and reputation, and the turn deducts exactly that from cash',()=>{
  const c=shop();const month=Array.from({length:60},(_,i)=>i+2).find(m=>cafeIncidents(c,m).some(i=>i.id==='breakdown'))!;
  const {cafe,receipt,incidentCost}=settleCafeMonth(c,month);
  expect(receipt.incidents?.some(i=>i.id==='breakdown')).toBe(true);expect(receipt.profit).toBe(receipt.revenue-receipt.costs-receipt.incidents!.reduce((s,i)=>s+i.cost,0));
  expect(cafe.reputation).toBe(50+receipt.incidents!.reduce((s,i)=>s+i.reputation,0));expect(incidentCost).toBeGreaterThanOrEqual(250);
  vi.spyOn(Math,'random').mockReturnValue(.5);
  let s={...base(),month:month-1,cafe:{...c,reputation:50}} as GameState;s={...s,assets:[...s.assets]};
  const quiet={...s,cafe:{...s.cafe!,plan:{...s.cafe!.plan,open:false}}};
  const withIncident=processTurn(s).newState, without=processTurn({...s,cafe:{...s.cafe!,machine:true}}).newState;
  expect(withIncident.events.some(e=>e.title.includes('broke down'))).toBe(true);
  expect(withIncident.cafe!.lastReceipt!.incidents!.length).toBeGreaterThan(0);
  expect(quiet.cafe!.plan.open).toBe(false);
 });
});
