import type { GameState, MarketItem } from '../types';
import { MORTGAGE_OPTIONS } from '../constants';
import { calculateMortgagePayment } from './gameLogic';
import { incomeYield } from './investmentModel';
import { UPKEEP_RATE, ownershipCostMonthly, closingCosts, pmiMonthly } from './propertyCosts';

// Property-office arithmetic in plain, checkable numbers. Teaching assumptions: upkeep, property tax and
// insurance (services/propertyCosts.ts), an 8% vacancy allowance, and the game's own mortgage options and base rate.
export const PROPERTY_LISTINGS = ['fractional_rental', 'starter_home', 'duplex'] as const;
export { UPKEEP_RATE };
export const VACANCY_RATE = .08;

export type MortgageQuote = { optionId: string; name: string; downPercent: number; down: number; loan: number; rate: number; payment: number; pmi: number; closing: number; termYears: number; eligible: boolean; reason?: string };
export function mortgageQuote(price: number, optionId: string, baseRate: number, netWorth = Infinity, income = Infinity): MortgageQuote | null {
  const option = MORTGAGE_OPTIONS.find(o => o.id === optionId); if (!option) return null;
  const down = Math.round(price * option.downPaymentPercent / 100), loan = price - down, rate = baseRate + option.interestRateSpread;
  const needsWorth = option.requirements?.netWorth ?? 0, needsIncome = option.requirements?.income ?? 0;
  const eligible = netWorth >= needsWorth && income >= needsIncome;
  const reason = eligible ? undefined : netWorth < needsWorth ? `needs net worth of $${needsWorth.toLocaleString('en-US')}` : `needs income of $${needsIncome.toLocaleString('en-US')}/mo`;
  const pmi = pmiMonthly(loan, option.downPaymentPercent);
  return { optionId, name: option.name, downPercent: option.downPaymentPercent, down, loan, rate, payment: calculateMortgagePayment(loan, rate, option.termYears) + pmi, pmi, closing: closingCosts(price), termYears: option.termYears, eligible, reason };
}

// What a rental property leaves each month before any loan: gross rent less upkeep and a vacancy allowance.
export function landlordMonth(item: MarketItem, price: number) {
  const grossRent = Math.round(price * incomeYield(item) / 12), upkeep = ownershipCostMonthly(price), vacancy = Math.round(grossRent * VACANCY_RATE);
  return { grossRent, upkeep, vacancy, net: grossRent - upkeep - vacancy };
}

// Owning versus renting the same home for one year, from the buyer's cash point of view.
export function rentVsBuy(price: number, rentPerMonth: number, quote: MortgageQuote, appreciation = .03) {
  const ownerMonthly = quote.payment + ownershipCostMonthly(price);
  const interestYear1 = Math.round(quote.loan * quote.rate), principalYear1 = Math.max(0, (quote.payment - quote.pmi) * 12 - interestYear1);   // mortgage insurance pays down nothing
  const appreciationYear1 = Math.round(price * appreciation);
  const equityYear1 = principalYear1 + appreciationYear1;
  const rentYear = rentPerMonth * 12, ownYear = ownerMonthly * 12;
  return { ownerMonthly, rentPerMonth, extraPerMonth: ownerMonthly - rentPerMonth, interestYear1, principalYear1, appreciationYear1, equityYear1, netOwnCostYear1: ownYear - equityYear1, rentYear, aheadBy: rentYear - (ownYear - equityYear1) };
}

// Roughly a third of monthly expenses is treated as the player's rent for the comparison.
export const rentEstimate = (monthlyExpenses: number) => Math.round(monthlyExpenses * .35);
export const canAffordDown = (state: GameState, quote: MortgageQuote, monthlyExpenses: number) => state.cash - quote.down - quote.closing >= monthlyExpenses;
