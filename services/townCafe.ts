import type { GameState } from '../types';

export const CAFE_DEPOSIT = 1200;
export const CAFE_FITOUT = 1800;
export const CAFE_RENT = 600;
export const CAFE_UPGRADES = { seats: 650, machine: 900 } as const;
export type CafePlan = { price: 4 | 6; stock: 400 | 700; helper: boolean; open: boolean };
export type CafeReceipt = { month: number; rainy: boolean; sold: number; stock: number; revenue: number; supplies: number; wages: number; rent: number; utilities: number; costs: number; profit: number; demand: number; capacity: number };
export type CafeState = { service?: import('./cafeService').CafeService; openedMonth: number; plan: CafePlan; seats: boolean; machine: boolean; lastReceipt?: CafeReceipt };
export type CafeAction = { type: 'lease' } | { type: 'plan'; plan: CafePlan } | { type: 'upgrade'; upgrade: keyof typeof CAFE_UPGRADES } | { type: 'close' };
export const cafeWeather = (month: number) => month % 3 === 0;
export const cafeValue = (cafe?: CafeState) => cafe ? CAFE_DEPOSIT + 600 + (cafe.seats ? 325 : 0) + (cafe.machine ? 450 : 0) : 0;
export function quoteCafe(cafe: CafeState, month: number): CafeReceipt {
  const { plan } = cafe, rainy = cafeWeather(month);
  const demand = plan.open ? (rainy ? (plan.price === 4 ? 420 : 220) : (plan.price === 4 ? 800 : 650)) + (cafe.seats ? 80 : 0) : 0;
  const capacity = (plan.helper ? 700 : 400) + (cafe.machine ? 150 : 0);
  const stock = plan.open ? plan.stock : 0, sold = Math.min(stock, demand, capacity);
  const revenue = sold * plan.price, supplies = stock * 2, wages = plan.open ? 600 + (plan.helper ? 400 : 0) : 0;
  const costs = supplies + wages + CAFE_RENT + 120;
  return { month, rainy, sold, stock, revenue, supplies, wages, rent: CAFE_RENT, utilities: 120, costs, profit: revenue - costs, demand, capacity };
}
export function canLeaseCafe(state: GameState) {
  return state.assets.some(a => a.marketItemId === 'coffee_cart' && a.quantity > 0) && state.townProgress?.permitMonth !== undefined && (state.townProgress?.firstShiftMonth ?? state.townProgress?.lastShift?.month) !== undefined;
}
export function resolveCafeAction(state: GameState, action: CafeAction): GameState {
  if (state.pendingScenario || state.hasWon || state.isBankrupt) return state;
  let cafe = state.cafe, cash = state.cash, description = '';
  if (action.type === 'lease') {
    if (cafe || !canLeaseCafe(state) || cash < CAFE_DEPOSIT + CAFE_FITOUT) return state;
    cash -= CAFE_DEPOSIT + CAFE_FITOUT;
    cafe = { openedMonth: state.month, seats: false, machine: false, plan: { price: 6, stock: 400, helper: false, open: true } };
    description = 'Leased the café: $1,200 refundable deposit + $1,800 fit-out. Equipment resale starts at $600. Rent, wages and stock start next month; the cart stays a separate business.';
  } else if (!cafe || cafe.service?.status === 'active') return state;
  else if (action.type === 'plan') {
    const p = action.plan;
    if (![4, 6].includes(p.price) || ![400, 700].includes(p.stock) || typeof p.helper !== 'boolean' || typeof p.open !== 'boolean') return state;
    if (JSON.stringify(p) === JSON.stringify(cafe.plan)) return state;
    cafe = { ...cafe, plan: { ...p } };
    description = `Saved next month's café plan: ${p.open ? `$${p.price} cups, ${p.stock} supplies, ${p.helper ? 'two staff' : 'one barista'}` : 'temporarily closed; $720 rent and utilities still due'}. No money moves until the month advances.`;
  } else if (action.type === 'upgrade') {
    const cost = CAFE_UPGRADES[action.upgrade];
    if (!cost || cafe[action.upgrade] || cash < cost) return state;
    cash -= cost; cafe = { ...cafe, [action.upgrade]: true };
    description = action.upgrade === 'seats' ? 'Added cosy seating for $650. Demand rises by 80 cups per month; sales still depend on stock and staff capacity. Resale value $325.' : 'Upgraded the espresso machine for $900. Capacity rises by 150 cups per month; customers are not guaranteed. Resale value $450.';
  } else if (action.type === 'close') {
    const refund = cafeValue(cafe); cash += refund; cafe = undefined;
    description = `Ended the café lease and returned the keys. Recovered $${refund} in deposit and equipment resale. Future café bills stop; the coffee cart remains yours.`;
  } else return state;
  return { ...state, cash, cafe, events: [{ id: `cafe-${crypto.randomUUID()}`, month: state.month, title: action.type === 'lease' ? 'Your first café' : action.type === 'close' ? 'Café lease ended' : 'Café decision', description, type: 'DECISION' }, ...state.events] };
}
