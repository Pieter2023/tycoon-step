import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { INITIAL_GAME_STATE, CHARACTERS, MARKET_ITEMS } from '../constants';
import { AssetType, GameState } from '../types';
import { investorJourney, activeJourney, completeActiveJourney, completeTownJourney, HOLD_MONTHS } from '../services/townJourney';
import { resolveTownAction } from '../services/townProgress';
import { marketIndexStep, processTurn, clearSimSeed } from '../services/gameLogic';
import { projectContributions } from '../services/investmentModel';
import { marketMood, indexChangePct, downsideSentence, unrealised } from '../services/townMarket';
import { clampExchangePoint, exchangeSpot } from '../components/town/townExchange';
import { guideLabel, guideNextHop } from '../components/town/townGuide';
import ExchangePanel from '../components/town/ExchangePanel';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 8000, month: 3, townProgress: { reserveConfirmed: true, permitMonth: 1, firstShiftMonth: 1, journeyCompletedMonth: 2 } });
const fund = (month: number, quantity = 2) => ({ id: 'sp', marketItemId: 'sp500', name: 'S&P 500 Index', type: AssetType.INDEX_FUND, value: 520, costBasis: 500, quantity, cashFlow: 0, volatility: .15, appreciationRate: .04, priceHistory: [{ month, value: 500 }] });
afterEach(() => { cleanup(); clearSimSeed(); });

describe('investor journey', () => {
  it('starts after the opening badge and walks visit → buy → hold → finish, awarding no cash', () => {
    let s = base();
    expect(activeJourney(s).stage).toBe(2); expect(activeJourney({ ...s, townProgress: {} }).stage).toBe(1);
    expect(investorJourney(s)).toMatchObject({ step: 0, action: 'exchange' });
    s = resolveTownAction(s, 'visit-exchange'); expect(s.townProgress?.exchangeVisitedMonth).toBe(3); expect(resolveTownAction(s, 'visit-exchange')).toBe(s);
    expect(investorJourney(s)).toMatchObject({ step: 1, action: 'invest' });
    s = { ...s, assets: [fund(3)] }; expect(investorJourney(s)).toMatchObject({ step: 2, action: 'review' });
    expect(completeActiveJourney(s)).toBe(s);
    s = { ...s, month: 3 + HOLD_MONTHS }; expect(investorJourney(s)).toMatchObject({ step: 3, action: 'finish' });
    const done = completeActiveJourney(s); expect(done.cash).toBe(s.cash); expect(investorJourney(done).completed).toBe(true); expect(activeJourney(done).stage).toBe(3); expect(activeJourney(done).completed).toBe(false); // the neighbourhood tour follows
    expect(done.events[0].title).toBe('Patient investor'); expect(completeActiveJourney(done)).toBe(done);
  });
  it('routes the finish through the right arc and defers to pending events', () => {
    const cart = { id: 'c', marketItemId: 'coffee_cart', name: 'Coffee Cart', type: AssetType.BUSINESS, value: 1500, costBasis: 1500, quantity: 1, cashFlow: 30, volatility: .18, appreciationRate: .01, priceHistory: [] };
    const opening = { ...base(), assets: [cart], townProgress: { reserveConfirmed: true, permitMonth: 1, firstShiftMonth: 1 }, lastMonthlyReport: { month: 3 } as GameState['lastMonthlyReport'] };
    expect(completeActiveJourney(opening).townProgress?.journeyCompletedMonth).toBe(3);
    const untouched = base(); expect(completeTownJourney(untouched)).toBe(untouched);
    const busy = { ...base(), pendingScenario: { id: 'p' } as GameState['pendingScenario'] };
    expect(investorJourney(busy).action).toBe('event');
  });
});

describe('teaching market index', () => {
  it('compounds deterministically with the cycle, keeps three years, and survives a turn', () => {
    const s = base();
    const a = marketIndexStep(s), b = marketIndexStep(s);
    expect(a).toEqual(b); expect(a).toHaveLength(2); expect(a[0].value).toBe(100);
    const contraction = marketIndexStep({ ...s, marketCycle: { ...s.marketCycle, phase: 'CONTRACTION' } });
    expect(contraction[1].value).toBeLessThan(a[1].value);
    let history = s.marketIndex; let state = s;
    for (let i = 0; i < 40; i++) { history = marketIndexStep(state); state = { ...state, month: state.month + 1, marketIndex: history }; }
    expect(history).toHaveLength(36);
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const { newState } = processTurn(s); expect(newState.marketIndex?.at(-1)?.month).toBe(newState.month);
    vi.restoreAllMocks();
  });
  it('explains the mood and measures changes in plain numbers', () => {
    expect(marketMood('CONTRACTION').label).toBe('Contraction'); expect(marketMood('EXPANSION', true).label).toBe('Recession');
    expect(indexChangePct([{ month: 1, value: 100 }, { month: 2, value: 110 }])).toBe(10); expect(indexChangePct(undefined)).toBeNull();
    expect(downsideSentence(.6)).toMatch(/half/); expect(downsideSentence(.15)).toMatch(/30%/);
    expect(unrealised({ value: 520, costBasis: 500, quantity: 2 })).toBe(40);
    expect(projectContributions(250, 10, .10)).toMatchObject({ invested: 30000 }); expect(projectContributions(250, 10, .10).value).toBeGreaterThan(48000);
    expect(projectContributions(100, 1, 0)).toMatchObject({ invested: 1200, value: 1200, growth: 0 });
  });
});

describe('trading floor', () => {
  it('keeps the aisle clear and recognises the broker and exit spots', () => {
    expect(clampExchangePoint({ x: 9, z: -3 })).toEqual({ x: 2.4, z: .4 });
    expect(exchangeSpot({ x: 0, z: .8 })).toBe('broker'); expect(exchangeSpot({ x: 0, z: 6 })).toBe('exit'); expect(exchangeSpot({ x: 0, z: 3 })).toBeNull();
  });
  it('guides one tap from the square to the broker and labels the investor steps', () => {
    const journey = investorJourney(base()); const city = { room: 'city' as const, near: null, spot: null, showDetails: false, journal: false, serviceActive: false, hasCafe: false };
    expect(guideLabel({ ...city, journey })).toBe('Go to the Exchange');
    expect(guideLabel({ ...city, journey, near: 'exchange' })).toBe('Enter the Exchange');
    expect(guideLabel({ ...city, journey, room: 'exchange' })).toBe('Walk to the broker');
    expect(guideLabel({ ...city, journey, room: 'exchange', spot: 'broker', showDetails: true })).toBe('Read the market mood');
    const buying = investorJourney(resolveTownAction(base(), 'visit-exchange'));
    expect(guideLabel({ ...city, journey: buying, room: 'exchange', spot: 'broker', showDetails: true })).toBe('Buy an index fund below');
    const finishing = investorJourney({ ...resolveTownAction(base(), 'visit-exchange'), assets: [fund(3)], month: 6 });
    expect(guideLabel({ ...city, journey: finishing, journal: true, showDetails: true })).toBe('Complete my investor journey ✦');
    expect(guideNextHop('broker', { room: 'city', near: 'exchange', spot: null })).toBe('enterExchange');
    expect(guideNextHop('broker', { room: 'exchange', near: null, spot: null })).toBe('walkToBroker');
    expect(guideNextHop('broker', { room: 'exchange', near: 'exchange', spot: 'broker' })).toBe('arrived');
  });
});

describe('broker panel', () => {
  it('buys in multiples with a reserve warning, sells whole holdings, and shows unrealised change', () => {
    const onBuy = vi.fn(), onSell = vi.fn();
    const s = { ...base(), cash: 2900, economy: { ...base().economy, inflationRate: 0 }, assets: [fund(3)], marketIndex: [{ month: 1, value: 100 }, { month: 2, value: 104 }, { month: 3, value: 108 }] };
    render(React.createElement(ExchangePanel, { state: s, disabled: false, onBuy, onSell, onOpenMoney: vi.fn() }));
    expect(screen.getByText(/Market mood: Expansion/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /^Buy 5 · \$2,500/ })[0]); // S&P first; Bitcoin shares the teaching price
    expect(onBuy).toHaveBeenCalledWith(MARKET_ITEMS.find(i => i.id === 'sp500'), 5);
    for (const button of screen.getAllByRole('button', { name: /Buy 10 · \$5,000/ })) expect(button).toBeDisabled();
    expect(screen.getByText(/up \$40 unrealised/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sell all 2/ })); expect(onSell).toHaveBeenCalledWith('sp');
    expect(document.body.textContent).toMatch(/Pays no cash/);
    fireEvent.click(screen.getByRole('button', { name: '20 years' })); expect(screen.getByText(/for 20 years pays in/)).toBeInTheDocument();
  });
});
