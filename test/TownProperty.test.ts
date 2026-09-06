import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { INITIAL_GAME_STATE, CHARACTERS, MARKET_ITEMS } from '../constants';
import { GameState } from '../types';
import { mortgageQuote, landlordMonth, rentVsBuy, rentEstimate, canAffordDown } from '../services/townProperty';
import { calculateMortgagePayment } from '../services/gameLogic';
import { clampPropertyPoint, propertySpot } from '../components/town/townProperty';
import PropertyPanel from '../components/town/PropertyPanel';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 30000, month: 2, economy: { ...INITIAL_GAME_STATE.economy, inflationRate: 0, interestRate: .06 } });
afterEach(cleanup);

describe('property office arithmetic', () => {
  it('quotes a mortgage from the base rate plus the option spread and checks eligibility', () => {
    const q = mortgageQuote(180000, 'fha', .06)!;
    expect(q).toMatchObject({ down: 6300, loan: 173700, rate: .065, termYears: 30, eligible: true });
    expect(q.payment).toBe(calculateMortgagePayment(173700, .065, 30));
    const conv = mortgageQuote(180000, 'conventional_20', .06, 10000, 5000)!;
    expect(conv.eligible).toBe(false); expect(conv.reason).toMatch(/net worth/);
    expect(mortgageQuote(1, 'nope', .06)).toBeNull();
  });
  it('shows what a rental leaves after upkeep and vacancies, and compares owning with renting', () => {
    const home = MARKET_ITEMS.find(i => i.id === 'starter_home')!;
    const month = landlordMonth(home, 180000);
    expect(month.grossRent).toBe(900); expect(month.upkeep).toBe(150); expect(month.vacancy).toBe(72); expect(month.net).toBe(678);
    const q = mortgageQuote(180000, 'fha', .06)!;
    const c = rentVsBuy(180000, 900, q);
    expect(c.ownerMonthly).toBe(q.payment + 150); expect(c.interestYear1 + c.principalYear1).toBe(q.payment * 12);
    expect(c.appreciationYear1).toBe(5400); expect(c.aheadBy).toBe(c.rentYear - (c.ownerMonthly * 12 - c.equityYear1));
    expect(rentEstimate(2600)).toBe(910);
    expect(canAffordDown({ ...base(), cash: 8000 }, q, 2600)).toBe(false); expect(canAffordDown({ ...base(), cash: 9000 }, q, 2600)).toBe(true);
  });
  it('keeps the office aisle clear and recognises the agent and exit spots', () => {
    expect(clampPropertyPoint({ x: -9, z: 12 })).toEqual({ x: -2.5, z: 6.4 });
    expect(propertySpot({ x: .3, z: .9 })).toBe('agent'); expect(propertySpot({ x: 0, z: 6.2 })).toBe('exit'); expect(propertySpot({ x: 2, z: 3 })).toBeNull();
  });
});

describe('agent panel', () => {
  it('lists rents after costs, previews a mortgage, buys a fractional share and compares rent with buying', () => {
    const onBuy = vi.fn(), onMortgage = vi.fn();
    render(React.createElement(PropertyPanel, { state: base(), disabled: false, onBuy, onMortgage, onOpenMoney: vi.fn() }));
    expect(screen.getByText(/Today's base rate 6.0%/)).toBeInTheDocument();
    expect(screen.getAllByText(/vacancy allowance leaves/).length).toBe(3);
    fireEvent.click(screen.getAllByRole('button', { name: /Preview a mortgage/ })[0]);
    expect(onMortgage).toHaveBeenCalledWith(MARKET_ITEMS.find(i => i.id === 'starter_home'));
    fireEvent.click(screen.getByRole('button', { name: /Buy a share · \$20,000/ }));
    expect(onBuy).toHaveBeenCalledWith(MARKET_ITEMS.find(i => i.id === 'fractional_rental'), 1);
    expect(document.body.textContent).toMatch(/Your rent is about/);
    fireEvent.click(screen.getByRole('button', { name: 'Duplex' }));
    expect(document.body.textContent).toMatch(/Owning the Duplex/);
  });
  it('blocks a mortgage preview that would empty the reserve', () => {
    const onMortgage = vi.fn();
    render(React.createElement(PropertyPanel, { state: { ...base(), cash: 6500 }, disabled: false, onBuy: vi.fn(), onMortgage, onOpenMoney: vi.fn() }));
    for (const button of screen.getAllByRole('button', { name: /Preview a mortgage/ })) expect(button).toBeDisabled();
    expect(screen.getAllByText(/less than a month of expenses/).length).toBeGreaterThan(0);
  });
});
