import { AssetType, type GameState } from '../types';
import { LIFESTYLE_OPTS } from '../constants';
import { calculateMonthlyCashFlowEstimate } from './gameLogic';
import { savingsBalance } from './townActivities';
import { reputationOf } from './townCafe';
import { promotionOutlook } from './townWork';

// Rosa, the neighbour on the promenade bench, reads the player's actual numbers and says the
// one or two things a sensible friend would say. Rules are ordered by urgency; each returns a
// short observation with an optional place to go. Nothing here moves money.
export type Advice = { id: string; tone: 'warn' | 'tip' | 'good'; title: string; text: string; place?: 'bank' | 'exchange' | 'property' | 'cafe' | 'home' | 'board' | 'work' };

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export function adviseFrom(state: GameState): Advice[] {
  const flow = calculateMonthlyCashFlowEstimate(state), expenses = Math.max(1, flow.expenses), income = Math.max(1, flow.income);
  const invested = state.assets.filter(a => a.type !== AssetType.SAVINGS && a.quantity > 0), investedValue = invested.reduce((s, a) => s + a.value * a.quantity, 0);
  const crypto = invested.filter(a => a.type === AssetType.CRYPTO).reduce((s, a) => s + a.value * a.quantity, 0);
  const savings = savingsBalance(state), buffer = state.cash + savings;
  const expensiveDebt = state.liabilities.filter(l => l.interestRate >= .12 && l.balance > 0), expensiveBalance = expensiveDebt.reduce((s, l) => s + l.balance, 0);
  const lifestyleCost = LIFESTYLE_OPTS[state.lifestyle]?.cost ?? 0;
  const passiveShare = flow.passive / expenses;
  const out: Advice[] = [];
  if (state.hasWon) out.push({ id: 'won', tone: 'good', title: 'You did it. Your money works so you do not have to.', text: `Passive income of ${money(flow.passive)} a month covers ${money(expenses)} of bills with room to spare. The trap now is lifestyle creep: every upgrade raises the bar your investments have to clear. Keep the reserve, keep investing, and enjoy the square.` });
  if (state.cash < expenses) out.push({ id: 'thin', tone: 'warn', title: 'Your cash is thinner than one month of bills.', text: `You have ${money(state.cash)} against ${money(expenses)} of monthly costs. One surprise and you are borrowing. Park the next paycheque before anything else.`, place: 'bank' });
  if (expensiveBalance > 0 && investedValue > 0) out.push({ id: 'expensive-debt', tone: 'warn', title: `You are paying ${Math.round(Math.max(...expensiveDebt.map(l => l.interestRate)) * 100)}% interest while hoping for 10% returns.`, text: `${money(expensiveBalance)} of expensive debt is a guaranteed loss every month. Clearing it beats almost any investment you can buy.`, place: 'bank' });
  else if (expensiveBalance > 0) out.push({ id: 'expensive-debt-only', tone: 'tip', title: 'Expensive debt first.', text: `${money(expensiveBalance)} at high interest is the most reliable return in the game: every dollar repaid stops costing you.`, place: 'bank' });
  if (investedValue > 0 && crypto / investedValue > .5) out.push({ id: 'crypto-heavy', tone: 'warn', title: 'More than half your investments are crypto.', text: 'That is a bet, not a plan. A bad year can halve it. Index funds own hundreds of companies; keep the speculation small.', place: 'exchange' });
  if (lifestyleCost / income > .6) out.push({ id: 'lifestyle', tone: 'warn', title: 'Your place eats most of your pay.', text: `${money(lifestyleCost)} of ${money(income)} goes to lifestyle every month. Nothing wrong with living well, but freedom is bought with the gap.`, place: 'home' });
  if (buffer > expenses * 6 && investedValue < expenses) out.push({ id: 'idle-cash', tone: 'tip', title: 'Your cushion is bigger than it needs to be.', text: `${money(buffer)} sits in cash and savings, more than six months of bills. Inflation quietly taxes it. Put the surplus to work a little at a time.`, place: 'exchange' });
  if (state.month >= 6 && investedValue === 0 && state.cash >= expenses * 2) out.push({ id: 'never-invested', tone: 'tip', title: `Six months in and nothing is invested.`, text: 'Time is the ingredient you cannot buy back. Even $500 a month in an index fund compounds for decades.', place: 'exchange' });
  if ((state.marketCycle.phase === 'CONTRACTION' || state.economy.recession) && investedValue > 0) out.push({ id: 'dip', tone: 'tip', title: 'This is the part where people panic.', text: 'Prices are down. Selling now turns a paper loss into a real one. If your bills are covered, the same money buys more units this month.', place: 'exchange' });
  if (state.cafe && reputationOf(state.cafe) < 40) out.push({ id: 'cafe-rep', tone: 'warn', title: 'The café has a reputation problem.', text: `Word gets around at ${reputationOf(state.cafe)}/100. One good owner shift lifts it twelve points; a month behind the counter changes the year.`, place: 'cafe' });
  const outlook = promotionOutlook(state);
  if (outlook.eligible && outlook.next) out.push({ id: 'promotion', tone: 'tip', title: `You qualify for ${outlook.next.title}. Ask.`, text: `Your manager will not bring it up. Each month you ask carries about a ${Math.round(outlook.chance * 100)}% chance, and a raise compounds every month after it lands.`, place: 'work' });
  if (state.cafe && !state.cafe.plan.open) out.push({ id: 'cafe-closed', tone: 'warn', title: 'Closed shops still pay rent.', text: '$720 a month leaves while the doors are shut. Reopen with a lean plan or end the lease; limbo is the expensive choice.', place: 'cafe' });
  if (passiveShare >= 1.1) out.push({ id: 'free', tone: 'good', title: 'Your investments cover your life.', text: `Passive income of ${money(flow.passive)} a month clears ${money(expenses)} of bills with room to spare. Everything from here is choice.` });
  else if (passiveShare >= .25) out.push({ id: 'progress', tone: 'good', title: `${Math.round(passiveShare * 100)}% of your bills are paid by money you do not work for.`, text: `${money(flow.passive)} a month arrives whether you show up or not. Keep the gap wide and that number grows on its own.` });
  if (!out.length) out.push({ id: 'steady', tone: 'good', title: 'Nothing on fire.', text: 'Reserve intact, no expensive debt, a plan in motion. Boring months are where wealth is actually built. The notice board has three small things to do.', place: 'board' });
  return out.slice(0, 3);
}
export const adviceHeadline = (state: GameState) => adviseFrom(state)[0]?.title ?? '';
