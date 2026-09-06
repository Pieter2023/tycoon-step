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
