import { AssetType, type GameState } from '../types';
import { LIFE_EVENTS } from '../constants';
import { tl } from '../i18n/town';

// Insurance at the Community Bank. Three policies with a monthly premium that lands in the bills
// like any other expense, a deductible the player picks, and a share of the loss the policy pays
// on a named list of dashboard shocks. The rules are the plain North American shape: premium,
// deductible per claim, co-insurance share, and premiums that rise after claims. Some events
// already offer an "insured" option priced by the event itself; the policy pays on the others.
// Nothing here uses rand(), so daily-challenge worlds stay in sync.
export type PolicyId = 'health' | 'property' | 'business';
export type Policy = { since: number; deductible: number };
export type Claim = { month: number; policy: PolicyId; event: string; loss: number; paid: number };
export type InsuranceState = { policies: Partial<Record<PolicyId, Policy>>; claims: Claim[]; premiumsPaid: number };
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export const LOADING_PER_CLAIM = .15, LOADING_CAP = .6, LOADING_WINDOW = 24, REPAIR_DEDUCTIBLE = 500;
export const VEHICLE_EXTRA = 45, RENTAL_EXTRA = 60, BUSINESS_RATE = .005;

type Cover = { name: () => string; blurb: () => string; events: string[]; share: number; deductibles: number[]; base: number[] };
export const COVERAGE: Record<PolicyId, Cover> = {
  health: { name: () => tl('Health cover','Seguro de salud'), blurb: () => tl('Pays 80% of a covered medical bill above your deductible. A lower deductible costs more every month.','Paga el 80% de una factura médica cubierta por encima de tu deducible. Un deducible más bajo cuesta más cada mes.'), events: ['appendicitis', 'sports_injury', 'dental_emergency', 'wisdom_teeth', 'root_canal', 'major_surgery', 'chronic_illness_diagnosis', 'medical_bill_negotiation', 'mental_health_crisis', 'child_sick', 'pet_emergency'], share: .8, deductibles: [500, 2000, 5000], base: [240, 160, 110] },
  property: { name: () => tl('Home & car cover','Seguro de hogar y auto'), blurb: () => tl('Pays 90% of covered repairs, break-ins and accidents above a $1,000 deductible. Each vehicle and each rental property adds to the premium.','Paga el 90% de reparaciones, robos y accidentes cubiertos por encima de un deducible de $1,000. Cada vehículo y cada propiedad en renta suman a la prima.'), events: ['home_repair', 'hvac_failure', 'appliance_breakdown', 'home_break_in', 'car_breakdown', 'car_accident', 'car_theft', 'car_totaled', 'phone_stolen', 'rental_major_maintenance', 'fender_bender_lawsuit'], share: .9, deductibles: [1000], base: [80] },
  business: { name: () => tl('Business cover','Seguro de negocio'), blurb: () => tl('Pays 70% of covered business shocks and of each month\'s repair bills above a $500 deductible. Priced on the value of what you own.','Paga el 70% de los golpes de negocio cubiertos y de las reparaciones de cada mes por encima de un deducible de $500. Se cotiza según el valor de lo que posees.'), events: ['equipment_failure', 'owned_business_fraud', 'owned_business_strike', 'employee_strike'], share: .7, deductibles: [500], base: [80] },
};

// An option that already uses insurance ("Use insurance ($3,000 deductible)", "File insurance claim", "Their insurance covers it") is priced by the event; "No insurance" and "uninsured" options are the ones the policy pays on.
export const pricesCover = (label: string) => /insur|claim/i.test(label) && !/no insurance|uninsured|without insurance/i.test(label);
// The policy an event belongs to, if any.
export const policyFor = (eventId: string): PolicyId | undefined => (Object.keys(COVERAGE) as PolicyId[]).find(p => COVERAGE[p].events.includes(eventId));
// An event option that uses YOUR insurance ("Use insurance ($3,000 deductible)", "File insurance claim") is only open to a player who holds that policy; the other driver's insurance is theirs to have. Returns the policy that would unlock a locked option.
export const optionLocked = (state: GameState, eventId: string, label: string): PolicyId | undefined => { if (!pricesCover(label) || /their insurance/i.test(label)) return undefined; const id = policyFor(eventId); return id && !state.insurance?.policies[id] ? id : undefined; };
const businessValue = (state: GameState) => state.assets.filter(a => a.type === AssetType.BUSINESS).reduce((s, a) => s + a.value * a.quantity, 0);
const rentals = (state: GameState) => state.assets.filter(a => a.type === AssetType.REAL_ESTATE && a.quantity > 0).length;
export const isOffered = (state: GameState, id: PolicyId) => id !== 'business' || businessValue(state) > 0;
export const recentClaims = (state: GameState, id: PolicyId) => (state.insurance?.claims ?? []).filter(c => c.policy === id && state.month - c.month < LOADING_WINDOW).length;
export const loading = (state: GameState, id: PolicyId) => Math.min(LOADING_CAP, recentClaims(state, id) * LOADING_PER_CLAIM);
export function premiumFor(state: GameState, id: PolicyId, deductible?: number): number {
  const cover = COVERAGE[id], d = deductible ?? state.insurance?.policies[id]?.deductible ?? cover.deductibles[0];
  const index = Math.max(0, cover.deductibles.indexOf(d));
  let base = cover.base[index];
  if (id === 'property') base += (state.vehicles?.length ?? 0) * VEHICLE_EXTRA + rentals(state) * RENTAL_EXTRA;
  if (id === 'business') base += businessValue(state) * BUSINESS_RATE / 12;
  return Math.round(base * (1 + loading(state, id)));
}
export const insurancePremiums = (state: GameState) => (Object.keys(state.insurance?.policies ?? {}) as PolicyId[]).filter(id => state.insurance?.policies[id]).reduce((s, id) => s + premiumFor(state, id), 0);

export type PolicyOffer = { id: PolicyId; name: string; blurb: string; held?: Policy; premium: number; loading: number; options: { deductible: number; premium: number }[]; covers: string[]; share: number; available: boolean; example: { title: string; loss: number; withCover: number } };
export function offers(state: GameState): PolicyOffer[] {
  return (Object.keys(COVERAGE) as PolicyId[]).map(id => {
    const cover = COVERAGE[id], held = state.insurance?.policies[id];
    const titles = cover.events.map(e => LIFE_EVENTS.find(ev => ev.id === e)?.title ?? e);
    // The biggest covered bill in the game, priced with and without the policy.
    let worst = { title: '', loss: 0 };
    for (const e of cover.events) { const ev = LIFE_EVENTS.find(ev => ev.id === e); for (const o of ev?.options ?? []) { const loss = -(o.outcome.cashChange ?? 0); if (loss > worst.loss && !pricesCover(o.label)) worst = { title: ev!.title, loss }; } }
    const deductible = held?.deductible ?? cover.deductibles[0];
    return { id, name: cover.name(), blurb: cover.blurb(), held, premium: premiumFor(state, id), loading: loading(state, id), options: cover.deductibles.map(d => ({ deductible: d, premium: premiumFor(state, id, d) })), covers: titles, share: cover.share, available: isOffered(state, id), example: { title: worst.title, loss: worst.loss, withCover: worst.loss - Math.round(Math.max(0, worst.loss - deductible) * cover.share) } };
  });
}

const blocked = (state: GameState) => !!state.pendingScenario || state.hasWon || state.isBankrupt;
const bare = (state: GameState): InsuranceState => ({ policies: {}, claims: [], premiumsPaid: 0, ...state.insurance });
export function buyPolicy(state: GameState, id: PolicyId, deductible: number): GameState {
  const cover = COVERAGE[id]; if (!cover || blocked(state) || !isOffered(state, id) || state.insurance?.policies[id] || !cover.deductibles.includes(deductible)) return state;
  const ins = bare(state), premium = premiumFor(state, id, deductible);
  return { ...state, insurance: { ...ins, policies: { ...ins.policies, [id]: { since: state.month, deductible } } }, events: [{ id: `policy-${id}-${state.month}`, month: state.month, title: `🛡️ ${cover.name()} taken out`, description: `${money(premium)} a month from next month, ${money(deductible)} deductible per claim, pays ${Math.round(cover.share * 100)}% of a covered loss above it.`, type: 'DECISION' }, ...state.events] };
}
export function cancelPolicy(state: GameState, id: PolicyId): GameState {
  if (blocked(state) || !state.insurance?.policies[id]) return state;
  const policies = { ...state.insurance.policies }; delete policies[id];
  return { ...state, insurance: { ...state.insurance, policies }, events: [{ id: `policy-cancel-${id}-${state.month}`, month: state.month, title: `${COVERAGE[id].name()} cancelled`, description: 'No premium from next month; the next covered shock is yours in full.', type: 'DECISION' }, ...state.events] };
}

// A covered dashboard shock: the option's own label decides. Options that already price insurance
// ("Use insurance ($3,000 deductible)", "File insurance claim") are not paid again.
export function settleClaim(state: GameState, eventId: string, optionLabel: string, loss: number): Claim | null {
  if (loss <= 0 || pricesCover(optionLabel)) return null;
  const id = (Object.keys(COVERAGE) as PolicyId[]).find(p => COVERAGE[p].events.includes(eventId)); if (!id) return null;
  const policy = state.insurance?.policies[id]; if (!policy) return null;
  const paid = Math.round(Math.max(0, loss - policy.deductible) * COVERAGE[id].share); if (paid <= 0) return null;
  const title = LIFE_EVENTS.find(ev => ev.id === eventId)?.title ?? eventId;
  return { month: state.month, policy: id, event: title, loss, paid };
}
// Business cover also pays the month's repair bill on business assets above the deductible.
export function settleRepairs(state: GameState, maintenanceCost: number): Claim | null {
  const policy = state.insurance?.policies.business; if (!policy || maintenanceCost <= REPAIR_DEDUCTIBLE) return null;
  const paid = Math.round((maintenanceCost - REPAIR_DEDUCTIBLE) * COVERAGE.business.share);
  return paid > 0 ? { month: state.month, policy: 'business', event: tl('Business repairs','Reparaciones del negocio'), loss: maintenanceCost, paid } : null;
}
export function applyClaim(state: GameState, claim: Claim): Partial<GameState> {
  const ins = bare(state);
  return { cash: state.cash + claim.paid, insurance: { ...ins, claims: [...ins.claims, claim].slice(-24) }, events: [{ id: `claim-${claim.policy}-${claim.month}-${ins.claims.length}`, month: claim.month, title: `🛡️ Claim paid: ${claim.event}`, description: `${COVERAGE[claim.policy].name()} paid ${money(claim.paid)} of a ${money(claim.loss)} bill. Premiums rise ${Math.round(LOADING_PER_CLAIM * 100)}% per claim for ${LOADING_WINDOW} months.`, type: 'DECISION' }, ...state.events] };
}

export type Ledger = { premiumsPaid: number; claimsPaid: number; claims: Claim[]; monthly: number };
export const ledger = (state: GameState): Ledger => ({ premiumsPaid: state.insurance?.premiumsPaid ?? 0, claimsPaid: (state.insurance?.claims ?? []).reduce((s, c) => s + c.paid, 0), claims: [...(state.insurance?.claims ?? [])].reverse().slice(0, 5), monthly: insurancePremiums(state) });
