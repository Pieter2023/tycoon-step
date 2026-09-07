import type { GameState, Vehicle, Liability } from '../types';
import { calculateNetWorth } from './gameLogic';
import { tl } from '../i18n/town';

// The parking bay by the townhouse: the player's car, priced honestly. The turn already charges
// upkeep and knocks 0.5% off the value every month; this module adds the two things the dashboard
// never showed, the value quietly lost each month and the interest on a car loan, and lets the
// player sell (at a dealer's haircut) or buy from a small deterministic lot, cash or financed.
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export const DEPRECIATION_MONTHLY = .005, DEALER_HAIRCUT = .1, AUTO_APR = .079, AUTO_TERM = 48, AUTO_DOWN = .1, MAX_CARS = 2;
export const loanPayment = (principal: number, annualRate: number, months: number) => { if (principal <= 0 || months <= 0) return 0; const r = annualRate / 12; return Math.round(principal * r / (1 - Math.pow(1 + r, -months))); };

export type Listing = { id: string; name: () => string; price: number; age: number; maintenance: number; paint: string; blurb: () => string };
export const LISTINGS: Listing[] = [
  { id: 'hatch', name: () => tl('Reliable used hatchback','Hatchback usado confiable'), price: 9000, age: 5, maintenance: 110, paint: '#c94f3f', blurb: () => tl('Cheap to buy, cheap to run, nothing to prove.','Barato de comprar, barato de mantener, nada que demostrar.') },
  { id: 'sedan', name: () => tl('Three-year-old sedan','Sedán de tres años'), price: 18000, age: 3, maintenance: 130, paint: '#3f6f8c', blurb: () => tl('The first owner paid for the steepest years of depreciation.','El primer dueño pagó los años más duros de depreciación.') },
  { id: 'pickup', name: () => tl('Work pickup','Camioneta de trabajo'), price: 26000, age: 3, maintenance: 170, paint: '#4f7a55', blurb: () => tl('Carries tools and materials; costs more to feed.','Lleva herramientas y materiales; cuesta más de alimentar.') },
  { id: 'ev', name: () => tl('Nearly new electric compact','Compacto eléctrico casi nuevo'), price: 32000, age: 1, maintenance: 70, paint: '#e8e8ea', blurb: () => tl('Lowest upkeep on the lot; the price tag is where the money goes.','El menor mantenimiento del lote; el precio es donde se va el dinero.') },
];

export const findLoan = (state: GameState, vehicle: Vehicle): Liability | undefined => state.liabilities.find(l => (vehicle.loanId && l.id === vehicle.loanId) || l.assetId === vehicle.id);
export type CarCard = { vehicle: Vehicle; loan?: Liability; depreciation: number; interest: number; trueCost: number; resale: number; equity: number; share: number; inFiveYears: number; canSell: boolean; sellReason?: string };
export function carCard(state: GameState, vehicle: Vehicle): CarCard {
  const loan = findLoan(state, vehicle);
  const depreciation = Math.round(vehicle.value * DEPRECIATION_MONTHLY), interest = loan ? Math.round(loan.balance * loan.interestRate / 12) : 0;
  const resale = Math.round(vehicle.value * (1 - DEALER_HAIRCUT)), equity = resale - (loan?.balance ?? 0);
  const netWorth = calculateNetWorth(state);   // at or below zero, the car is simply the biggest thing owned (share 100)
  const underwater = !!loan && loan.balance >= resale;   // nothing left after the dealer pays off the loan: not a sale, a surrender
  return { vehicle, loan, depreciation, interest, trueCost: vehicle.monthlyMaintenance + depreciation + interest, resale, equity, share: netWorth > 0 ? Math.min(100, Math.round(vehicle.value / netWorth * 100)) : 100, inFiveYears: Math.max(500, Math.round(vehicle.value * Math.pow(1 - DEPRECIATION_MONTHLY, 60))), canSell: !underwater, sellReason: underwater ? `${tl('The loan','El préstamo')} (${money(loan!.balance)}) ${tl('is at least what the car is worth','es al menos lo que vale el auto')} (${money(resale)}). ${tl('Pay it down first.','Págalo primero.')}` : undefined };
}

export type ListingOffer = { listing: Listing; name: string; canBuyCash: boolean; down: number; loan: number; payment: number; totalInterest: number; canFinance: boolean; fiveYearCost: number; reason?: string };
export function listingOffer(state: GameState, listing: Listing): ListingOffer {
  const down = Math.round(listing.price * AUTO_DOWN), loan = listing.price - down, payment = loanPayment(loan, AUTO_APR, AUTO_TERM), totalInterest = payment * AUTO_TERM - loan;
  const full = (state.vehicles?.length ?? 0) >= MAX_CARS;
  const fiveYearCost = listing.maintenance * 60 + (listing.price - Math.round(listing.price * Math.pow(1 - DEPRECIATION_MONTHLY, 60)));
  return { listing, name: listing.name(), canBuyCash: !full && state.cash >= listing.price, down, loan, payment, totalInterest, canFinance: !full && state.cash >= down, fiveYearCost, reason: full ? tl('Two cars is the limit of the bay.','Dos autos es el límite de la cochera.') : state.cash < down ? `${tl('Needs','Necesitas')} ${money(down)} ${tl('down; you have','de enganche; tienes')} ${money(state.cash)}.` : undefined };
}

export type Garage = { cars: CarCard[]; monthly: number; trueMonthly: number; offers: ListingOffer[]; carFree: boolean; headline: string };
export function garage(state: GameState): Garage {
  const cars = (state.vehicles ?? []).map(v => carCard(state, v));
  const monthly = cars.reduce((s, c) => s + c.vehicle.monthlyMaintenance, 0), trueMonthly = cars.reduce((s, c) => s + c.trueCost, 0);
  const first = cars[0];
  const headline = first ? `${first.vehicle.name}: ${money(first.trueCost)} ${tl('a month all in.','al mes con todo.')} ${money(first.vehicle.monthlyMaintenance)} ${tl('upkeep','de mantenimiento')} + ${money(first.depreciation)} ${tl('lost value','de valor perdido')}${first.interest ? ` + ${money(first.interest)} ${tl('interest','de interés')}` : ''}.` : tl('No car. Nothing to feed, nothing losing value in the bay.','Sin auto. Nada que alimentar, nada perdiendo valor en la cochera.');
  return { cars, monthly, trueMonthly, offers: LISTINGS.map(l => listingOffer(state, l)), carFree: cars.length === 0, headline };
}

const blocked = (state: GameState) => !!state.pendingScenario || state.hasWon || state.isBankrupt;
export function buyVehicle(state: GameState, listingId: string, finance: boolean): GameState {
  const listing = LISTINGS.find(l => l.id === listingId); if (!listing || blocked(state)) return state;
  const offer = listingOffer(state, listing); if (finance ? !offer.canFinance : !offer.canBuyCash) return state;
  const id = `car-${listing.id}-${state.month}`, loanId = `car-loan-${listing.id}-${state.month}`;
  const vehicle: Vehicle = { id, name: listing.name(), value: listing.price, age: listing.age, monthlyMaintenance: listing.maintenance, hasLoan: finance, loanId: finance ? loanId : undefined };
  const liabilities = finance ? [...state.liabilities, { id: loanId, name: `${listing.name()} car loan`, balance: offer.loan, originalBalance: offer.loan, interestRate: AUTO_APR, monthlyPayment: offer.payment, type: 'CAR_LOAN' as const, assetId: id }] : state.liabilities;
  return { ...state, cash: state.cash - (finance ? offer.down : listing.price), vehicles: [...(state.vehicles ?? []), vehicle], liabilities, events: [{ id: `${id}-bought`, month: state.month, title: `🚗 Bought: ${listing.name()}`, description: finance ? `${money(offer.down)} down, ${money(offer.loan)} on a ${AUTO_TERM}-month loan at ${(AUTO_APR * 100).toFixed(1)}%: ${money(offer.payment)} a month, ${money(offer.totalInterest)} of interest over the term. Upkeep ${money(listing.maintenance)} a month.` : `${money(listing.price)} cash. Upkeep ${money(listing.maintenance)} a month; it loses about ${money(listing.price * DEPRECIATION_MONTHLY)} of value a month from here.`, type: 'DECISION' }, ...state.events] };
}
export function sellVehicle(state: GameState, vehicleId: string): GameState {
  const vehicle = (state.vehicles ?? []).find(v => v.id === vehicleId); if (!vehicle || blocked(state)) return state;
  const card = carCard(state, vehicle); if (!card.canSell) return state;
  const loan = card.loan;
  return { ...state, cash: state.cash + card.resale - (loan?.balance ?? 0), vehicles: state.vehicles.filter(v => v.id !== vehicleId), liabilities: loan ? state.liabilities.filter(l => l.id !== loan.id) : state.liabilities, events: [{ id: `${vehicleId}-sold-${state.month}`, month: state.month, title: `🚗 Sold: ${vehicle.name}`, description: `${money(card.resale)} from the dealer (${Math.round(DEALER_HAIRCUT * 100)}% under its ${money(vehicle.value)} book value)${loan ? `, ${money(loan.balance)} of it cleared the loan` : ''}. No more ${money(vehicle.monthlyMaintenance)} a month of upkeep.`, type: 'DECISION' }, ...state.events] };
}

// The car parked in the bay: paint from the listing when known, else by name.
export function garageFigures(state: GameState): { paint: string }[] {
  return (state.vehicles ?? []).slice(0, MAX_CARS).map(v => ({ paint: LISTINGS.find(l => v.id.includes(`car-${l.id}-`))?.paint ?? (v.hasLoan ? '#3f6f8c' : '#8a8f96') }));
}
