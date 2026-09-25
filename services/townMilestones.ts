import { AssetType, GameState } from '../types';
import { calculateMonthlyCashFlowEstimate, financialFreedom } from './gameLogic';
import { tl } from '../i18n/town';

// Milestone moments in the city (Phase 1, slice 1). Each is derived from the game state, so it cannot be
// earned twice or faked, and is remembered in townProgress.milestones (id → the month it was first seen) so
// the city celebrates it once. Several reached while away from the city: only the biggest is celebrated.
export type MilestoneId = 'first-business' | 'first-income' | 'freedom-25' | 'freedom-50' | 'freedom-75';
export type Milestones = Partial<Record<MilestoneId, number>>;
export type Milestone = { id: MilestoneId; title: string; text: string; moment: 'ribbon' | 'coins' | 'fireworks' };

// Ordered from smallest to biggest.
const ORDER: MilestoneId[] = ['first-business', 'first-income', 'freedom-25', 'freedom-50', 'freedom-75'];

/** Which milestones the state satisfies right now. */
export function reachedMilestones(state: GameState): MilestoneId[] {
  const flow = calculateMonthlyCashFlowEstimate(state), coverage = financialFreedom(state, flow).coverage;
  const business = (state.assets || []).some(a => a.type === AssetType.BUSINESS && a.quantity > 0) || !!state.cafe;
  const income = (state.assets || []).some(a => a.quantity > 0 && a.type !== AssetType.BUSINESS && (a.cashFlow ?? 0) > 0) || flow.passive > 0;
  const out: MilestoneId[] = [];
  if (business) out.push('first-business');
  if (income) out.push('first-income');
  if (coverage >= .25) out.push('freedom-25');
  if (coverage >= .5) out.push('freedom-50');
  if (coverage >= .75) out.push('freedom-75');
  return out;
}

export function milestoneCopy(id: MilestoneId): Milestone {
  switch (id) {
    case 'first-business': return { id, moment: 'ribbon', title: tl('Open for business','Abierto al público'), text: tl('Your first business. It earns while you work elsewhere, and it can have bad months too: keep a reserve beside it.','Tu primer negocio. Gana mientras trabajas en otra cosa, y también puede tener meses malos: mantén una reserva a su lado.') };
    case 'first-income': return { id, moment: 'coins', title: tl('Your money earned money','Tu dinero ganó dinero'), text: tl('The first interest, dividend or profit that arrived without you working for it. Reinvest it and it earns too.','Los primeros intereses, dividendos o ganancias que llegaron sin que trabajaras por ellos. Reinviértelos y también ganarán.') };
    case 'freedom-25': return { id, moment: 'fireworks', title: tl('A quarter of the way to freedom','Un cuarto del camino a la libertad'), text: tl('Your investments could now pay a quarter of your living costs for good.','Tus inversiones ya podrían pagar para siempre una cuarta parte de tu costo de vida.') };
    case 'freedom-50': return { id, moment: 'fireworks', title: tl('Halfway to freedom','A mitad del camino a la libertad'), text: tl('Half of your life could now run on money that works for you. The second half goes faster: it compounds.','La mitad de tu vida ya podría funcionar con dinero que trabaja para ti. La segunda mitad va más rápido: se capitaliza.') };
    case 'freedom-75': return { id, moment: 'fireworks', title: tl('Three-quarters free','Libre en tres cuartas partes'), text: tl('The finish line is in sight. Keep costs steady and let time do the rest.','La meta está a la vista. Mantén estables tus gastos y deja que el tiempo haga el resto.') };
  }
}

/**
 * Milestones reached but not yet recorded: the one to celebrate (the biggest) and every id to record.
 * Returns null when there is nothing new.
 */
export function newMilestones(state: GameState): { celebrate: Milestone; record: MilestoneId[] } | null {
  const seen = state.townProgress?.milestones ?? {};
  const fresh = reachedMilestones(state).filter(id => seen[id] === undefined);
  if (!fresh.length) return null;
  const biggest = fresh.reduce((a, b) => ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a);
  return { celebrate: milestoneCopy(biggest), record: fresh };
}

/** Records milestones as seen this month. */
export function recordMilestones(state: GameState, ids: MilestoneId[]): GameState {
  const milestones: Milestones = { ...(state.townProgress?.milestones ?? {}) };
  for (const id of ids) if (milestones[id] === undefined) milestones[id] = state.month;
  return { ...state, townProgress: { ...state.townProgress, milestones } };
}
