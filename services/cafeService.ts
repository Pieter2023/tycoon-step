import type { GameState } from '../types';
import type { CafeState } from './townCafe';
export type ServicePlan = { price: 4 | 6; stock: 3 | 6; helper: boolean; pace: 'relaxed' | 'rush' };
export type ServiceGuest = { id: number; name: string; drink: 'espresso' | 'latte'; arrival: number; deadline: number; table: 'table1' | 'table2' | 'counter'; status: 'coming' | 'queued' | 'ordered' | 'served' | 'left'; changedAt: number };
export type ServiceStation = 'counter' | 'machine' | 'table1' | 'table2';
export const SERVICE_STATIONS: Record<ServiceStation, { x: number; z: number; label: string }> = {
  counter: { x: .9, z: .8, label: 'order counter' }, machine: { x: -.8, z: .8, label: 'coffee machine' },
  table1: { x: -2.15, z: 1.4, label: 'table 1' }, table2: { x: -2.15, z: 4.3, label: 'table 2' },
};
export type CafeService = { month: number; plan: ServicePlan; seats: boolean; machine: boolean; elapsed: number; status: 'active' | 'complete'; guests: ServiceGuest[]; prepared: number; brewing?: { guest: number; readyAt: number }; cupFor?: number };
export type ServiceAction = { type: 'start'; plan: ServicePlan } | { type: 'tick' } | { type: 'interact'; point: { x: number; z: number } } | { type: 'finish' };
export const serviceCost = (p: ServicePlan) => p.stock * 2 + 3 + (p.helper ? 3 : 0);
export const validServicePlan = (p: ServicePlan) => p && [4, 6].includes(p.price) && [3, 6].includes(p.stock) && typeof p.helper === 'boolean' && ['relaxed', 'rush'].includes(p.pace);
export function createCafeService(month: number, plan: ServicePlan, cafe: Pick<CafeState, 'seats' | 'machine'>): CafeService {
  const count = month % 3 === 0 && plan.price === 6 ? 2 : 3;
  return { month, plan: { ...plan }, seats: cafe.seats, machine: cafe.machine, elapsed: 0, status: 'active', prepared: 0,
    guests: ['Mia', 'Sam', 'Leo'].slice(0, count).map((name, id) => ({ id, name, drink: id % 2 ? 'espresso' : 'latte', arrival: id * 8,
      deadline: id * 8 + (plan.pace === 'relaxed' ? 90 : 35) - (plan.price === 6 ? 8 : 0) + (plan.helper ? 15 : 0),
      table: cafe.seats && id < 2 ? (id === 0 ? 'table1' : 'table2') : 'counter', status: id === 0 ? 'queued' : 'coming', changedAt: 0 })) };
}
export function serviceReceipt(shift: CafeService) {
  const served = shift.guests.filter(g => g.status === 'served').length, left = shift.guests.filter(g => g.status === 'left').length;
  const revenue = served * shift.plan.price, costs = serviceCost(shift.plan);
  return { served, left, revenue, costs, profit: revenue - costs, wasted: shift.plan.stock - served, supplies: shift.plan.stock * 2, wages: shift.plan.helper ? 3 : 0, overhead: 3 };
}
export function serviceTask(shift: CafeService) {
  const order = shift.guests.find(g => g.status === 'ordered');
  if (shift.status === 'complete') return null;
  if (order && shift.cupFor === order.id && shift.elapsed < order.changedAt + 6) return { station: order.table, verb: 'Customer finding their place…', detail: `${order.name} is on the way.`, kind: 'wait' as const, guest: order };
  if (order && shift.cupFor === order.id) return { station: order.table, verb: `Serve ${order.name}`, detail: `${order.drink} → ${SERVICE_STATIONS[order.table].label}`, kind: 'serve' as const, guest: order };
  if (order && shift.brewing) return { station: 'machine' as const, verb: `Brewing · ${Math.max(0, shift.brewing.readyAt - shift.elapsed)}s`, detail: `${order.name} is waiting for ${order.drink}.`, kind: 'wait' as const, guest: order };
  if (order && shift.prepared >= shift.plan.stock) return { station: 'machine' as const, verb: 'Fresh stock used up', detail: 'Finish the shift; unused orders cannot be filled.', kind: 'wait' as const, guest: order };
  if (order) return { station: 'machine' as const, verb: `Make ${order.drink}`, detail: `${order.name} · ${SERVICE_STATIONS[order.table].label}`, kind: 'brew' as const, guest: order };
  const next = shift.guests.find(g => g.status === 'queued');
  if (next) return { station: 'counter' as const, verb: `Take ${next.name}’s order`, detail: 'Meet the next customer at the order counter.', kind: 'take' as const, guest: next };
  return { station: 'counter' as const, verb: 'Next guest arriving…', detail: 'A moment to get back to the counter.', kind: 'wait' as const, guest: undefined };
}
export const atServiceStation = (point: { x: number; z: number }, station: ServiceStation) => Number.isFinite(point.x) && Number.isFinite(point.z) && Math.hypot(point.x - SERVICE_STATIONS[station].x, point.z - SERVICE_STATIONS[station].z) < .6;
export function finishCafeService(shift: CafeService): CafeService {
  if (shift.status === 'complete') return shift;
  return { ...shift, status: 'complete', brewing: undefined, cupFor: undefined, guests: shift.guests.map(g => g.status === 'served' || g.status === 'left' ? g : { ...g, status: 'left', changedAt: shift.elapsed }) };
}
export function stepCafeService(shift: CafeService, action: Exclude<ServiceAction, { type: 'start' }>): CafeService {
  if (shift.status !== 'active') return shift;
  if (action.type === 'finish') return finishCafeService(shift);
  let next = shift;
  if (action.type === 'tick') {
    const elapsed = shift.elapsed + 1;
    const guests = shift.guests.map(g => (g.status === 'queued' || g.status === 'ordered') && elapsed >= g.deadline ? { ...g, status: 'left' as const, changedAt: elapsed } : g.status === 'coming' && elapsed >= g.arrival ? { ...g, status: 'queued' as const, changedAt: elapsed } : g);
    next = { ...shift, elapsed, guests };
    if (next.brewing && !guests.some(g => g.id === next.brewing!.guest && g.status === 'ordered')) next.brewing = undefined;
    if (next.cupFor !== undefined && !guests.some(g => g.id === next.cupFor && g.status === 'ordered')) next.cupFor = undefined;
    if (next.brewing && elapsed >= next.brewing.readyAt) { next.cupFor = next.brewing.guest; next.brewing = undefined; }
  } else if (action.type === 'interact') {
    const task = serviceTask(shift);
    if (!task || !task.guest || task.kind === 'wait' || !atServiceStation(action.point, task.station)) return shift;
    if (task.kind === 'take') next = { ...shift, guests: shift.guests.map(g => g.id === task.guest!.id ? { ...g, status: 'ordered', changedAt: shift.elapsed } : g) };
    if (task.kind === 'brew') {
      if (shift.prepared >= shift.plan.stock) return shift;
      next = { ...shift, prepared: shift.prepared + 1, brewing: { guest: task.guest.id, readyAt: shift.elapsed + (shift.machine ? 2 : shift.plan.helper ? 3 : 4) } };
    }
    if (task.kind === 'serve') next = { ...shift, cupFor: undefined, guests: shift.guests.map(g => g.id === task.guest!.id ? { ...g, status: 'served', changedAt: shift.elapsed } : g) };
  }
  if (next.guests.every(g => g.status === 'served' || g.status === 'left')) return { ...next, status: 'complete', brewing: undefined, cupFor: undefined };
  return next;
}
export function resolveCafeService(state: GameState, action: ServiceAction): GameState {
  if (state.pendingScenario || state.hasWon || state.isBankrupt || !state.cafe) return state;
  if (action.type === 'start') {
    if (!validServicePlan(action.plan) || !state.cafe.plan.open || state.cafe.service?.month === state.month || state.cash < serviceCost(action.plan)) return state;
    return { ...state, cash: state.cash - serviceCost(action.plan), cafe: { ...state.cafe, service: createCafeService(state.month, action.plan, state.cafe) }, events: [{ id: `cafe-service-start-${state.month}`, month: state.month, title: 'Owner shift opened', description: `Committed $${serviceCost(action.plan)} for an extra owner shift: all fresh supplies, $3 extra operating costs${action.plan.helper ? ' and $3 helper pay' : ''}. Sales are paid as customers receive their drinks. Regular monthly trading stays separate.`, type: 'DECISION' }, ...state.events] };
  }
  const shift = state.cafe.service;
  if (!shift || shift.month !== state.month) return state;
  const next = stepCafeService(shift, action);
  if (next === shift) return state;
  const receipt = serviceReceipt(next), revenue = receipt.revenue - serviceReceipt(shift).revenue;
  const completed = next.status === 'complete' && shift.status !== 'complete';
  return { ...state, cash: state.cash + revenue, cafe: { ...state.cafe, service: next }, events: completed ? [{ id: `cafe-service-end-${state.month}`, month: state.month, title: 'Owner shift results', description: `Served ${receipt.served}; ${receipt.left} guests left. Sales $${receipt.revenue} − committed costs $${receipt.costs} = ${receipt.profit < 0 ? 'loss' : 'profit'} $${Math.abs(receipt.profit)}. ${receipt.wasted} cups’ worth of fresh stock unused. This result is already in cash and is not paid again next month.`, type: 'DECISION' }, ...state.events] : state.events };
}
