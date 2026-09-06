import type { GameState } from '../types';
import { tl } from '../i18n/town';
import { applyShiftReputation, reputationOf, type CafeState } from './townCafe';
export type ServicePlan = { price: 4 | 6; stock: 3 | 6; helper: boolean; pace: 'relaxed' | 'rush' };
export type ServiceGuest = { id: number; name: string; drink: 'espresso' | 'latte'; arrival: number; deadline: number; table: 'table1' | 'table2' | 'counter'; status: 'coming' | 'queued' | 'ordered' | 'served' | 'left'; changedAt: number; tip?: number; helperTook?: boolean };
export type ServiceStation = 'counter' | 'machine' | 'table1' | 'table2';
export const SERVICE_STATIONS: Record<ServiceStation, { x: number; z: number; label: string }> = {
  counter: { x: .9, z: .8, get label() { return tl('order counter','el mostrador'); } }, machine: { x: -.8, z: .8, get label() { return tl('coffee machine','la máquina de café'); } },
  table1: { x: -2.15, z: 1.4, get label() { return tl('table 1','la mesa 1'); } }, table2: { x: -2.15, z: 4.3, get label() { return tl('table 2','la mesa 2'); } },
};
// `ready` is a finished drink waiting on the machine; `cupFor` is the drink in the player's hands.
export type CafeService = { month: number; plan: ServicePlan; seats: boolean; machine: boolean; elapsed: number; status: 'active' | 'complete'; guests: ServiceGuest[]; prepared: number; brewing?: { guest: number; readyAt: number }; ready?: number; cupFor?: number };
export type ServiceAction = { type: 'start'; plan: ServicePlan } | { type: 'tick' } | { type: 'interact'; point: { x: number; z: number } } | { type: 'finish' };
export const serviceCost = (p: ServicePlan) => p.stock * 2 + 3 + (p.helper ? 3 : 0);
export const validServicePlan = (p: ServicePlan) => p && [4, 6].includes(p.price) && [3, 6].includes(p.stock) && typeof p.helper === 'boolean' && ['relaxed', 'rush'].includes(p.pace);
const GUEST_NAMES = ['Mia', 'Sam', 'Leo', 'Ava'];
const SEAT_DELAY = 5, HELPER_DELAY = 3;
// Busy market days bring four guests, rain three; premium pricing keeps one away.
export const expectedGuests = (month: number, plan: Pick<ServicePlan, 'price'>) => Math.max(2, (month % 3 === 0 ? 3 : 4) - (plan.price === 6 ? 1 : 0));
export const patienceFor = (plan: ServicePlan) => (plan.pace === 'relaxed' ? 60 : 34) - (plan.price === 6 ? 8 : 0) + (plan.helper ? 12 : 0);
export const tipFor = (guest: Pick<ServiceGuest, 'arrival' | 'deadline'>, elapsed: number, price: number) => (guest.deadline - elapsed) / Math.max(1, guest.deadline - guest.arrival) >= .55 ? (price === 6 ? 2 : 1) : 0;
export function createCafeService(month: number, plan: ServicePlan, cafe: Pick<CafeState, 'seats' | 'machine'>): CafeService {
  const count = expectedGuests(month, plan), gap = plan.pace === 'relaxed' ? 7 : 5, patience = patienceFor(plan);
  return { month, plan: { ...plan }, seats: cafe.seats, machine: cafe.machine, elapsed: 0, status: 'active', prepared: 0,
    guests: GUEST_NAMES.slice(0, count).map((name, id) => ({ id, name, drink: id % 2 ? 'espresso' : 'latte', arrival: id * gap, deadline: id * gap + patience,
      table: cafe.seats && id < 2 ? (id === 0 ? 'table1' : 'table2') : 'counter', status: id === 0 ? 'queued' : 'coming', changedAt: 0 })) };
}
export function serviceReceipt(shift: CafeService) {
  const served = shift.guests.filter(g => g.status === 'served').length, left = shift.guests.filter(g => g.status === 'left').length;
  const tips = shift.guests.reduce((sum, g) => sum + (g.tip ?? 0), 0);
  const revenue = served * shift.plan.price + tips, costs = serviceCost(shift.plan);
  return { served, left, tips, revenue, costs, profit: revenue - costs, wasted: shift.plan.stock - served, supplies: shift.plan.stock * 2, wages: shift.plan.helper ? 3 : 0, overhead: 3, guests: shift.guests.length };
}
// 0–3 stars: everyone served earns two, quick service (tips from at least half of them) earns the third.
export function serviceStars(shift: CafeService) {
  const r = serviceReceipt(shift); if (!r.served) return 0;
  if (r.served < r.guests) return 1;
  return shift.guests.filter(g => (g.tip ?? 0) > 0).length * 2 >= r.guests ? 3 : 2;
}
export type ServiceTask = { station: ServiceStation; verb: string; detail: string; kind: 'take' | 'brew' | 'pickup' | 'serve' | 'wait'; guest?: ServiceGuest };
const seated = (guest: ServiceGuest, elapsed: number) => guest.table === 'counter' || elapsed >= guest.changedAt + SEAT_DELAY;
// The next useful thing to do. Carrying beats collecting beats taking orders beats brewing, but a
// queued guest can be served an order while a drink brews or while the carried guest is still sitting down.
export function serviceTask(shift: CafeService): ServiceTask | null {
  if (shift.status === 'complete') return null;
  const byId = (id?: number) => shift.guests.find(g => g.id === id && g.status === 'ordered');
  const carrying = byId(shift.cupFor), waiting = byId(shift.ready);
  const queued = shift.guests.find(g => g.status === 'queued' && !shift.plan.helper);
  const unmade = shift.guests.find(g => g.status === 'ordered' && g.id !== shift.cupFor && g.id !== shift.ready && g.id !== shift.brewing?.guest);
  if (carrying && seated(carrying, shift.elapsed)) return { station: carrying.table, verb: `${tl('Serve','Servir a')} ${carrying.name}`, detail: `${carrying.drink} → ${SERVICE_STATIONS[carrying.table].label}`, kind: 'serve', guest: carrying };
  if (waiting) return { station: 'machine', verb: `${tl('Pick up','Recoger')} ${waiting.drink} ${tl('for','para')} ${waiting.name}`, detail: tl('The drink is ready on the machine.','La bebida está lista en la máquina.'), kind: 'pickup', guest: waiting };
  if (queued) return { station: 'counter', verb: `${tl('Take','Tomar el pedido de')} ${queued.name}${tl('’s order','')}`, detail: shift.brewing ? tl('A drink is brewing; take the next order meanwhile.','Una bebida se está preparando; toma el siguiente pedido mientras tanto.') : tl('Meet the next customer at the order counter.','Recibe al siguiente cliente en el mostrador.'), kind: 'take', guest: queued };
  if (carrying) return { station: carrying.table, verb: tl('Customer finding their place…','El cliente busca su lugar…'), detail: `${carrying.name} ${tl('is on the way.','va en camino.')}`, kind: 'wait', guest: carrying };
  if (unmade && !shift.brewing && shift.prepared < shift.plan.stock) return { station: 'machine', verb: `${tl('Make','Preparar')} ${unmade.drink}`, detail: `${unmade.name} · ${SERVICE_STATIONS[unmade.table].label}`, kind: 'brew', guest: unmade };
  if (shift.brewing) { const guest = byId(shift.brewing.guest); return { station: 'machine', verb: `${tl('Brewing','Preparando')} · ${Math.max(0, shift.brewing.readyAt - shift.elapsed)}s`, detail: `${guest?.name ?? 'A guest'} is waiting for ${guest?.drink ?? 'coffee'}.`, kind: 'wait', guest }; }
  if (unmade) return { station: 'machine', verb: tl('Fresh stock used up','Se acabó el surtido fresco'), detail: tl('Finish the shift; unfilled orders cannot be served.','Termina el turno; los pedidos sin preparar no se pueden servir.'), kind: 'wait', guest: unmade };
  const helperQueue = shift.guests.find(g => g.status === 'queued');
  if (helperQueue) return { station: 'machine', verb: tl('Helper is taking the order…','El ayudante toma el pedido…'), detail: `${helperQueue.name} ${tl('is at the counter with your helper.','está en el mostrador con tu ayudante.')}`, kind: 'wait', guest: helperQueue };
  return { station: 'counter', verb: tl('Next guest arriving…','Llega el siguiente cliente…'), detail: tl('A moment to get back to the counter.','Un momento para volver al mostrador.'), kind: 'wait' };
}
export const atServiceStation = (point: { x: number; z: number }, station: ServiceStation) => Number.isFinite(point.x) && Number.isFinite(point.z) && Math.hypot(point.x - SERVICE_STATIONS[station].x, point.z - SERVICE_STATIONS[station].z) < .6;
export function finishCafeService(shift: CafeService): CafeService {
  if (shift.status === 'complete') return shift;
  return { ...shift, status: 'complete', brewing: undefined, ready: undefined, cupFor: undefined, guests: shift.guests.map(g => g.status === 'served' || g.status === 'left' ? g : { ...g, status: 'left', changedAt: shift.elapsed }) };
}
export function stepCafeService(shift: CafeService, action: Exclude<ServiceAction, { type: 'start' }>): CafeService {
  if (shift.status !== 'active') return shift;
  if (action.type === 'finish') return finishCafeService(shift);
  let next = shift;
  if (action.type === 'tick') {
    const elapsed = shift.elapsed + 1;
    const guests = shift.guests.map(g => (g.status === 'queued' || g.status === 'ordered') && elapsed >= g.deadline ? { ...g, status: 'left' as const, changedAt: elapsed }
      : g.status === 'coming' && elapsed >= g.arrival ? { ...g, status: 'queued' as const, changedAt: elapsed }
      : g.status === 'queued' && shift.plan.helper && elapsed >= g.changedAt + HELPER_DELAY ? { ...g, status: 'ordered' as const, changedAt: elapsed, helperTook: true } : g);
    next = { ...shift, elapsed, guests };
    const stillOrdered = (id?: number) => guests.some(g => g.id === id && g.status === 'ordered');
    if (next.brewing && !stillOrdered(next.brewing.guest)) next.brewing = undefined;
    if (next.ready !== undefined && !stillOrdered(next.ready)) next.ready = undefined;
    if (next.cupFor !== undefined && !stillOrdered(next.cupFor)) next.cupFor = undefined;
    if (next.brewing && elapsed >= next.brewing.readyAt) { next.ready = next.brewing.guest; next.brewing = undefined; }
  } else if (action.type === 'interact') {
    const task = serviceTask(shift);
    if (!task || !task.guest || task.kind === 'wait' || !atServiceStation(action.point, task.station)) return shift;
    const id = task.guest.id;
    if (task.kind === 'take') next = { ...shift, guests: shift.guests.map(g => g.id === id ? { ...g, status: 'ordered', changedAt: shift.elapsed } : g) };
    if (task.kind === 'brew') {
      if (shift.prepared >= shift.plan.stock || shift.brewing || shift.ready !== undefined) return shift;
      next = { ...shift, prepared: shift.prepared + 1, brewing: { guest: id, readyAt: shift.elapsed + (shift.machine ? 2 : shift.plan.helper ? 3 : 4) } };
    }
    if (task.kind === 'pickup') next = { ...shift, ready: undefined, cupFor: id };
    if (task.kind === 'serve') next = { ...shift, cupFor: undefined, guests: shift.guests.map(g => g.id === id ? { ...g, status: 'served', changedAt: shift.elapsed, tip: tipFor(g, shift.elapsed, shift.plan.price) } : g) };
  }
  if (next.guests.every(g => g.status === 'served' || g.status === 'left')) return { ...next, status: 'complete', brewing: undefined, ready: undefined, cupFor: undefined };
  return next;
}
export function resolveCafeService(state: GameState, action: ServiceAction): GameState {
  if (state.pendingScenario || state.hasWon || state.isBankrupt || !state.cafe) return state;
  if (action.type === 'start') {
    if (!validServicePlan(action.plan) || !state.cafe.plan.open || state.cafe.service?.month === state.month || state.cash < serviceCost(action.plan)) return state;
    return { ...state, cash: state.cash - serviceCost(action.plan), cafe: { ...state.cafe, service: createCafeService(state.month, action.plan, state.cafe) }, events: [{ id: `cafe-service-start-${state.month}`, month: state.month, title: 'Owner shift opened', description: `Committed $${serviceCost(action.plan)} for an extra owner shift: all fresh supplies, $3 extra operating costs${action.plan.helper ? ' and $3 helper pay' : ''}. Sales and tips are paid as customers receive their drinks. Regular monthly trading stays separate.`, type: 'DECISION' }, ...state.events] };
  }
  const shift = state.cafe.service;
  if (!shift || shift.month !== state.month) return state;
  const next = stepCafeService(shift, action);
  if (next === shift) return state;
  const receipt = serviceReceipt(next), revenue = receipt.revenue - serviceReceipt(shift).revenue;
  const completed = next.status === 'complete' && shift.status !== 'complete';
  const stars = serviceStars(next), tipsText = receipt.tips ? ' + $' + receipt.tips + ' tips' : '';
  const cafe = completed ? applyShiftReputation({ ...state.cafe, service: next }, stars) : { ...state.cafe, service: next };
  const reputationText = completed ? ' Café reputation ' + reputationOf(state.cafe) + ' → ' + reputationOf(cafe) + ', which changes next month\'s demand.' : '';
  const summary = 'Served ' + receipt.served + ' of ' + receipt.guests + '; ' + receipt.left + ' left. Sales $' + (receipt.revenue - receipt.tips) + tipsText + ' − committed costs $' + receipt.costs + ' = ' + (receipt.profit < 0 ? 'loss' : 'profit') + ' $' + Math.abs(receipt.profit) + '. ' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '. ' + receipt.wasted + ' cups’ worth of fresh stock unused. This result is already in cash and is not paid again next month.' + reputationText;
  return { ...state, cash: state.cash + revenue, cafe, events: completed ? [{ id: `cafe-service-end-${state.month}`, month: state.month, title: 'Owner shift results', description: summary, type: 'DECISION' }, ...state.events] : state.events };
}
