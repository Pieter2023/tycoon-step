import type { GameState } from '../types';

export const CAFE_DEPOSIT = 1200;
export const CAFE_FITOUT = 1800;
export const CAFE_RENT = 600;
export const CAFE_UPGRADES = { seats: 650, machine: 900 } as const;
export type CafePlan = { price: 4 | 6; stock: 400 | 700; helper: boolean; open: boolean };
export type CafeIncident = { id: 'breakdown' | 'inspection-fail' | 'inspection-pass' | 'staff-quit' | 'regulars'; title: string; detail: string; cost: number; reputation: number; capacityLoss?: number };
export type CafeReceipt = { month: number; rainy: boolean; sold: number; stock: number; revenue: number; supplies: number; wages: number; rent: number; utilities: number; costs: number; profit: number; demand: number; capacity: number; reputation?: number; incidents?: CafeIncident[] };
// Reputation 0–100 (missing = 50 for older saves). Hands-on owner shifts move it by their star rating;
// months without a shift drift it back toward 50 as the neighbourhood forgets. It scales monthly demand.
export type CafeState = { service?: import('./cafeService').CafeService; openedMonth: number; plan: CafePlan; seats: boolean; machine: boolean; lastReceipt?: CafeReceipt; reputation?: number };
export const CAFE_REPUTATION_START = 50;
export const REPUTATION_BY_STARS = [-12, -4, 4, 12] as const;
export const reputationOf = (cafe?: Pick<CafeState, 'reputation'>) => Math.max(0, Math.min(100, cafe?.reputation ?? CAFE_REPUTATION_START));
export const reputationDemand = (reputation: number) => .8 + reputation / 250;
export const reputationLabel = (reputation: number) => reputation >= 85 ? 'Talk of the town' : reputation >= 65 ? 'Well liked' : reputation >= 40 ? 'Getting known' : reputation >= 20 ? 'Mixed reviews' : 'Struggling';
export const applyShiftReputation = (cafe: CafeState, stars: number): CafeState => ({ ...cafe, reputation: Math.max(0, Math.min(100, reputationOf(cafe) + REPUTATION_BY_STARS[Math.max(0, Math.min(3, stars))])) });
export const driftReputation = (cafe: CafeState): CafeState => { const r = reputationOf(cafe); return { ...cafe, reputation: r > 50 ? Math.max(50, r - 3) : r < 50 ? Math.min(50, r + 3) : 50 }; };
export type CafeAction = { type: 'lease' } | { type: 'plan'; plan: CafePlan } | { type: 'upgrade'; upgrade: keyof typeof CAFE_UPGRADES } | { type: 'close' };
export const cafeWeather = (month: number) => month % 3 === 0;
export const cafeValue = (cafe?: CafeState) => cafe ? CAFE_DEPOSIT + 600 + (cafe.seats ? 325 : 0) + (cafe.machine ? 450 : 0) : 0;
export function quoteCafe(cafe: CafeState, month: number): CafeReceipt {
  const { plan } = cafe, rainy = cafeWeather(month);
  const reputation = reputationOf(cafe);
  const demand = plan.open ? Math.round(((rainy ? (plan.price === 4 ? 420 : 220) : (plan.price === 4 ? 800 : 650)) + (cafe.seats ? 80 : 0)) * reputationDemand(reputation)) : 0;
  const capacity = (plan.helper ? 700 : 400) + (cafe.machine ? 150 : 0);
  const stock = plan.open ? plan.stock : 0, sold = Math.min(stock, demand, capacity);
  const revenue = sold * plan.price, supplies = stock * 2, wages = plan.open ? 600 + (plan.helper ? 400 : 0) : 0;
  const costs = supplies + wages + CAFE_RENT + 120;
  return { month, rainy, sold, stock, revenue, supplies, wages, rent: CAFE_RENT, utilities: 120, costs, profit: revenue - costs, demand, capacity, reputation };
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
    cafe = { openedMonth: state.month, seats: false, machine: false, plan: { price: 6, stock: 400, helper: false, open: true }, reputation: CAFE_REPUTATION_START };
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

// Surprises that follow from the owner's choices, not the forecast: a basic machine breaks three
// times as often as the upgrade, inspections punish a poor reputation and praise a strong one,
// second baristas quit unloved shops, and regulars turn up for the well-run ones. Deterministic
// per month (no rand) so forecasts stay honest and daily-challenge worlds stay in sync.
const roll = (month: number, salt: number) => { let h = (Math.imul(month * 977 + salt * 131, 2654435761) >>> 0); h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
export function cafeIncidents(cafe: CafeState, month: number): CafeIncident[] {
  if (!cafe.plan.open || month <= cafe.openedMonth) return [];
  const rep = reputationOf(cafe), out: CafeIncident[] = [];
  if (roll(month, 1) < (cafe.machine ? 1 / 18 : 1 / 6)) out.push(cafe.machine
    ? { id: 'breakdown', title: 'The espresso machine needed a service', detail: 'Even the big machine needs attention now and then: $180 for the engineer.', cost: 180, reputation: -1 }
    : { id: 'breakdown', title: 'The old coffee machine broke down', detail: 'It gave up mid-week: $250 repair and a slow few days while it was out. The upgraded machine breaks a third as often.', cost: 250, reputation: -2, capacityLoss: 80 });
  if (roll(month, 2) < .25) {
    if (rep < 40) out.push({ id: 'inspection-fail', title: 'Health inspection: improvement notice', detail: 'Standards matched the café’s reputation. A $150 fine and a notice in the window; regulars noticed too.', cost: 150, reputation: -6 });
    else if (rep >= 70) out.push({ id: 'inspection-pass', title: 'Health inspection: top marks', detail: 'A spotless visit. The certificate goes in the window and word spreads.', cost: 0, reputation: 4 });
  }
  if (cafe.plan.helper && rep < 45 && roll(month, 3) < .3) out.push({ id: 'staff-quit', title: 'Your second barista quit', detail: 'Nobody stays at a struggling shop. The wage was paid, but you ran short-handed and capacity fell. Reputation keeps staff.', cost: 0, reputation: -2, capacityLoss: 300 });
  if (rep >= 80 && roll(month, 4) < .35) out.push({ id: 'regulars', title: 'The regulars brought friends', detail: 'A busy week of word of mouth: extra sales on the receipt, and the neighbourhood talks.', cost: -120, reputation: 2 });
  return out;
}
// Settles a month with its incidents: capacity losses cut sales, costs and windfalls hit the profit line, reputation moves.
export function settleCafeMonth(cafe: CafeState, month: number): { cafe: CafeState; receipt: CafeReceipt; incidentCost: number } {
  const incidents = cafeIncidents(cafe, month), quote = quoteCafe(cafe, month);
  const capacityLoss = incidents.reduce((s, i) => s + (i.capacityLoss ?? 0), 0), cost = incidents.reduce((s, i) => s + i.cost, 0);
  const sold = Math.max(0, Math.min(quote.sold, quote.capacity - capacityLoss)), revenue = sold * cafe.plan.price;
  const receipt: CafeReceipt = { ...quote, sold, revenue, profit: revenue - quote.costs - cost, incidents };
  const reputation = Math.max(0, Math.min(100, reputationOf(cafe) + incidents.reduce((s, i) => s + i.reputation, 0)));
  return { cafe: { ...cafe, reputation, lastReceipt: receipt }, receipt, incidentCost: cost + (quote.revenue - revenue) };
}
