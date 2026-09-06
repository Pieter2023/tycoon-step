import { describe, it, expect, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { AssetType, GameState } from '../types';
import { transferTownSavings, savingsBalance, runCartShift, quoteCartShift } from '../services/townActivities';
import { calculateNetWorth, calculateMonthlyCashFlowEstimate } from '../services/gameLogic';
import { saveAdultGame, loadAdultGame } from '../services/storageService';
import { bankSpot, clampBankPoint } from '../components/town/townBank';
const base = ():GameState => ({...structuredClone(INITIAL_GAME_STATE), character:CHARACTERS[0], cash:8000});
const licensed = ():GameState => ({...base(), month:3, townProgress:{permitMonth:1}, assets:[{id:'cart',marketItemId:'coffee_cart',incomeModelVersion:2,name:'Coffee Cart',type:AssetType.BUSINESS,value:1500,costBasis:1500,quantity:1,cashFlow:30,currentMonthIncome:30,volatility:.18,appreciationRate:.01,baseYield:.24,priceHistory:[]}]});
afterEach(()=>localStorage.clear());
describe('bank teller',()=>{
  it('preserves wealth through deposits, partial withdrawals and withdrawing across lots',()=>{
    const initial=base(), nw=calculateNetWorth(initial);
    let state=transferTownSavings(initial,{direction:'deposit',amount:500});
    state=transferTownSavings(state,{direction:'deposit',amount:1000});
    expect(savingsBalance(state)).toBe(1500);expect(state.cash).toBe(6500);expect(calculateNetWorth(state)).toBeCloseTo(nw);
    expect(calculateMonthlyCashFlowEstimate(state).passive).toBeGreaterThan(0);
    state=transferTownSavings(state,{direction:'withdraw',amount:750});
    expect(state.cash).toBe(7250);expect(savingsBalance(state)).toBe(750);expect(calculateNetWorth(state)).toBeCloseTo(nw);
    state=transferTownSavings(state,{direction:'withdraw',amount:750});expect(state.assets).toHaveLength(0);expect(state.cash).toBe(8000);
  });
  it('rejects overspending, invalid amounts and pending decisions',()=>{
    const s=base();for(const amount of [NaN,Infinity,-1,0,.5,8001])expect(transferTownSavings(s,{direction:'deposit',amount})).toBe(s);
    expect(transferTownSavings(s,{direction:'withdraw',amount:1})).toBe(s);
    const blocked={...s,pendingScenario:{id:'pending'} as any};expect(transferTownSavings(blocked,{direction:'deposit',amount:500})).toBe(blocked);
  });
  it('preserves a legacy holding value and only removes the requested principal',()=>{
    const s=transferTownSavings(base(),{direction:'deposit',amount:1000});s.assets[0].value=1020;
    const next=transferTownSavings(s,{direction:'withdraw',amount:510});
    expect(next.assets[0].quantity).toBe(.5);expect(next.assets[0].costBasis).toBe(1000);expect(calculateNetWorth(next)).toBeCloseTo(calculateNetWorth(s));
  });
});
describe('coffee pop-up',()=>{
  it('charges all stock and shift costs, including an actual loss, once per month',()=>{
    const s=licensed(), plan={price:3,stock:24} as const, quote=quoteCartShift(s,plan);
    expect(quote).toMatchObject({sold:14,revenue:42,costs:66,profit:-24});
    const next=runCartShift(s,plan);expect(next.cash).toBe(7976);expect(runCartShift(next,plan)).toBe(next);
    expect(calculateMonthlyCashFlowEstimate(next).passive).toBe(calculateMonthlyCashFlowEstimate(s).passive);
    expect(runCartShift({...next,month:4},plan).cash).not.toBe(next.cash);
  });
  it('keeps cover useful in rain and validates ownership, licensing, cash and plans',()=>{
    const s=licensed(), plan={price:5,stock:12} as const;
    expect(quoteCartShift({...s,assets:[{...s.assets[0],opsUpgrade:true}]},plan).sold).toBe(12);
    for(const invalid of [{...s,cash:41},{...s,assets:[]},{...s,townProgress:undefined},{...s,hasWon:true}])expect(runCartShift(invalid,plan)).toBe(invalid);
    expect(runCartShift(s,{price:1,stock:999} as any)).toBe(s);
  });
  it('saves both transfers and completed shifts and cannot replay the receipt after reload',()=>{
    const plan={price:5,stock:12} as const;
    const s=runCartShift(transferTownSavings(licensed(),{direction:'deposit',amount:500}),plan);
    expect(saveAdultGame(s)).toBe(true);const loaded=loadAdultGame()!;
    expect(loaded.townProgress?.lastShift).toEqual(s.townProgress?.lastShift);expect(savingsBalance(loaded)).toBe(500);expect(runCartShift(loaded,plan)).toBe(loaded);
  });
});
it('keeps every lobby route in front of the counter and clear of seating',()=>{
  expect(clampBankPoint({x:999,z:-99})).toEqual({x:2.65,z:.4});
  expect(bankSpot({x:0,z:.75})).toBe('teller');expect(bankSpot({x:0,z:6.1})).toBe('exit');expect(bankSpot({x:0,z:3})).toBe(null);
});
