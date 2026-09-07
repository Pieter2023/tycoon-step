import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState } from '../types';
import { garage, carCard, listingOffer, buyVehicle, sellVehicle, garageFigures, LISTINGS, DEALER_HAIRCUT, AUTO_TERM, loanPayment } from '../services/townGarage';
import { calculateNetWorth, calculateMonthlyCashFlowEstimate, processTurn, clearSimSeed } from '../services/gameLogic';
import { isWalkable, findTownPath } from '../components/town/townNavigation';
import { adviseFrom } from '../services/townAdvisor';
import GaragePanel from '../components/town/GaragePanel';

const base = (o: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 12000, month: 8, ...o });
afterEach(() => { cleanup(); vi.restoreAllMocks(); clearSimSeed(); });

describe('the parking bay', () => {
  it('prices the starter car honestly: upkeep, lost value, resale, five-year value', () => {
    const s = base();
    const g = garage(s); expect(g.carFree).toBe(false); expect(g.cars).toHaveLength(1);
    const car = g.cars[0];
    expect(car.vehicle.name).toBe('Used Car'); expect(car.depreciation).toBe(40); expect(car.interest).toBe(0); expect(car.trueCost).toBe(140);
    expect(car.resale).toBe(Math.round(8000 * (1 - DEALER_HAIRCUT))); expect(car.equity).toBe(car.resale); expect(car.canSell).toBe(true);
    expect(car.inFiveYears).toBeLessThan(8000); expect(car.inFiveYears).toBeGreaterThan(5000);
    expect(g.headline).toMatch(/Used Car: \$140 a month all in\. \$100 upkeep \+ \$40 lost value\./);
    expect(garage(base({ vehicles: [] })).headline).toMatch(/^No car/);
    expect(carCard(base({ cash: 0, liabilities: [{ id: 'd', name: 'Debt', balance: 50000, originalBalance: 50000, interestRate: .1, monthlyPayment: 500, type: 'PERSONAL_LOAN' }] }), base().vehicles[0]).share).toBe(100);
  });
  it('sells to the dealer at the haircut, clears the loan, and refuses an underwater car', () => {
    const s = base();
    const sold = sellVehicle(s, 'starter-car');
    expect(sold.vehicles).toEqual([]); expect(sold.cash).toBe(12000 + 7200); expect(sold.events[0].title).toMatch(/Sold: Used Car/);
    expect(calculateMonthlyCashFlowEstimate(sold).vehicleCosts).toBe(0);
    const financed = buyVehicle(base({ vehicles: [] }), 'ev', true);
    const card = carCard(financed, financed.vehicles[0]);
    expect(card.loan?.balance).toBe(32000 - 3200); expect(card.canSell).toBe(false); expect(card.sellReason).toMatch(/at least what the car is worth/);
    expect(sellVehicle(financed, financed.vehicles[0].id)).toBe(financed);
    expect(sellVehicle(s, 'nobody')).toBe(s);
  });
  it('buys from the lot for cash or on a 48-month loan, within the limits of the bay', () => {
    const s = base({ vehicles: [] });
    const cash = buyVehicle(s, 'hatch', false);
    expect(cash.cash).toBe(3000); expect(cash.vehicles[0]).toMatchObject({ name: 'Reliable used hatchback', value: 9000, monthlyMaintenance: 110, hasLoan: false }); expect(cash.liabilities).toHaveLength(s.liabilities.length);
    expect(calculateNetWorth(cash)).toBe(calculateNetWorth(s));
    const offer = listingOffer(s, LISTINGS.find(l => l.id === 'sedan')!);
    expect(offer.down).toBe(1800); expect(offer.payment).toBe(loanPayment(16200, .079, AUTO_TERM)); expect(offer.totalInterest).toBe(offer.payment * AUTO_TERM - 16200);
    const financed = buyVehicle(s, 'sedan', true);
    expect(financed.cash).toBe(12000 - 1800); const loan = financed.liabilities.find(l => l.type === 'CAR_LOAN')!;
    expect(loan).toMatchObject({ balance: 16200, monthlyPayment: offer.payment, assetId: financed.vehicles[0].id }); expect(financed.vehicles[0].loanId).toBe(loan.id);
    expect(calculateMonthlyCashFlowEstimate(financed).debtPayments - calculateMonthlyCashFlowEstimate(s).debtPayments).toBe(offer.payment);
    const broke = base({ vehicles: [], cash: 100 }); expect(buyVehicle(broke, 'hatch', false)).toBe(broke); expect(buyVehicle(broke, 'hatch', true)).toBe(broke);
    const two = buyVehicle(buyVehicle(base({ vehicles: [], cash: 30000 }), 'hatch', false), 'hatch', false); expect(two.vehicles).toHaveLength(2);
    expect(buyVehicle(two, 'hatch', false)).toBe(two); expect(listingOffer(two, LISTINGS[0]).reason).toMatch(/Two cars/);
    expect(buyVehicle({ ...s, pendingScenario: { id: 'x' } as GameState['pendingScenario'] }, 'hatch', false).vehicles).toEqual([]);
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const turn = processTurn(financed).newState;
    expect(turn.vehicles[0].value).toBe(Math.round(18000 * .995)); expect(turn.liabilities.find(l => l.type === 'CAR_LOAN')!.balance).toBeLessThan(16200);
  });
  it('parks the car by the townhouse without blocking the front door, and Rosa notices a heavy car', () => {
    expect(isWalkable({ x: -14.7, z: 9.5 })).toBe(false); expect(isWalkable({ x: -15.7, z: 7.4 })).toBe(true); expect(isWalkable({ x: -14.2, z: 8.0 })).toBe(true);
    expect(findTownPath({ x: 0, z: 7 }, { x: -15.7, z: 7.4 }).length).toBeGreaterThan(0);
    expect(garageFigures(base())).toEqual([{ paint: '#8a8f96' }]);
    expect(garageFigures(buyVehicle(base({ vehicles: [], cash: 40000 }), 'ev', false))).toEqual([{ paint: '#e8e8ea' }]);
    expect(garageFigures(base({ vehicles: [] }))).toEqual([]);
    // $5,000 to your name and a financed $32,000 car: the car is most of the net worth, and Rosa says so.
    const heavy = buyVehicle(base({ vehicles: [], cash: 5000, assets: [], liabilities: [] }), 'ev', true);
    expect(adviseFrom(heavy).some(a => a.id === 'car-heavy' && a.place === 'garage')).toBe(true);
    expect(adviseFrom(base({ cash: 200000 })).some(a => a.id === 'car-heavy')).toBe(false);
  });
  it('shows the bay and the lot, and buys and sells from the panel', () => {
    const onBuyVehicle = vi.fn(), onSellVehicle = vi.fn();
    render(<GaragePanel state={base()} disabled={false} onBuyVehicle={onBuyVehicle} onSellVehicle={onSellVehicle} />);
    const car = screen.getByLabelText('Used Car');
    expect(car.textContent).toMatch(/True monthly cost−\$140/); expect(car.textContent).toMatch(/Dealer would pay today\$7,200/);
    fireEvent.click(screen.getByText(/Sell to the dealer/)); expect(onSellVehicle).toHaveBeenCalledWith('starter-car');
    const hatch = screen.getByLabelText('Reliable used hatchback');
    fireEvent.click(hatch.querySelector('button.town-primary')!); expect(onBuyVehicle).toHaveBeenCalledWith('hatch', false);
    fireEvent.click([...hatch.querySelectorAll('button')].find(b => /Finance/.test(b.textContent ?? ''))!); expect(onBuyVehicle).toHaveBeenCalledWith('hatch', true);
    const ev = screen.getByLabelText('Nearly new electric compact');
    expect(ev.querySelector('button.town-primary')).toBeDisabled();
  });
});
