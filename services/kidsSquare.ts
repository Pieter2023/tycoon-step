import type { KidsGameState, KidsCollectible } from '../kidsTypes';
import { KIDS_CAREERS, KIDS_DIFFICULTIES, KIDS_SIDE_HUSTLES, KIDS_COLLECTIBLES, KIDS_SAVINGS_GOALS } from '../kidsConstants';
import { tl } from '../i18n/town';

// Money Quest's square. The kids game runs on weeks, coins, energy hearts, hustles, collectibles
// and one savings goal; these helpers turn that state into four stops on the same 3D square the
// adult game uses: the piggy bank, the lemonade stand, the toy shop and the goal jar.
export type KidsStop = 'piggy' | 'lemonade' | 'toys' | 'goal';
export const STOP_PLACE: Record<KidsStop, 'bank' | 'business' | 'property' | 'exchange'> = { piggy: 'bank', lemonade: 'business', toys: 'property', goal: 'exchange' };
export const PLACE_STOP: Record<string, KidsStop> = { bank: 'piggy', business: 'lemonade', property: 'toys', exchange: 'goal' };
export const stopName = (stop: KidsStop) => ({ piggy: tl('Piggy bank', 'Alcancía'), lemonade: tl('Lemonade stand', 'Puesto de limonada'), toys: tl('Toy shop', 'Juguetería'), goal: tl('Goal jar', 'Frasco de metas') })[stop];
export const stopEmoji = (stop: KidsStop) => ({ piggy: '🐷', lemonade: '🍋', toys: '🧸', goal: '🎯' })[stop];
export const stopHint = (stop: KidsStop) => ({ piggy: tl('Count your coins and see your allowance', 'Cuenta tus monedas y mira tu mesada'), lemonade: tl('Earn coins with a job', 'Gana monedas con un trabajo'), toys: tl('Spend, and see what things are worth later', 'Gasta, y mira lo que valen las cosas después'), goal: tl('Pick something big to save for', 'Elige algo grande para ahorrar') })[stop];

export const weeklyAllowance = (state: KidsGameState) => {
  const career = KIDS_CAREERS[state.careerPath], diff = KIDS_DIFFICULTIES[state.difficulty];
  if (!career || !diff) return 0;
  return Math.round((career.baseAllowance + (career.levels[state.careerLevel]?.weeklyBonus ?? 0)) * diff.allowanceMultiplier);
};
export const energyHearts = (state: KidsGameState) => '⚡'.repeat(Math.max(0, Math.round(state.energy))) + '·'.repeat(Math.max(0, 5 - Math.round(state.energy)));

export type HustleCard = { id: string; name: string; emoji: string; description: string; min: number; max: number; energy: number; cost: number; active: boolean; canStart: boolean; reason?: string };
export const hustleCards = (state: KidsGameState): HustleCard[] => KIDS_SIDE_HUSTLES.map(h => {
  const active = state.activeHustles.includes(h.id);
  const reason = active ? tl('You already do this!', '¡Ya haces esto!') : state.cash < h.startupCost ? `${tl('Save up', 'Ahorra')} $${h.startupCost} ${tl('to start.', 'para empezar.')}` : undefined;
  return { id: h.id, name: h.name, emoji: h.emoji, description: h.description, min: h.earnRange.min, max: h.earnRange.max, energy: h.energyCost, cost: h.startupCost, active, canStart: !reason, reason };
});
export const weeklyHustleEnergy = (state: KidsGameState) => state.activeHustles.reduce((s, id) => s + (KIDS_SIDE_HUSTLES.find(h => h.id === id)?.energyCost ?? 0), 0);

export type ToyCard = { item: (typeof KIDS_COLLECTIBLES)[number]; canBuy: boolean; reason?: string };
export const toyCards = (state: KidsGameState): ToyCard[] => KIDS_COLLECTIBLES.map(item => ({ item, canBuy: state.cash >= item.price, reason: state.cash >= item.price ? undefined : `${tl('Save up', 'Ahorra')} $${item.price - state.cash} ${tl('more.', 'más.')}` }));
export const collectionValue = (state: KidsGameState) => state.collectibles.reduce((s, c) => s + c.currentValue, 0);
export const valueArrow = (c: KidsCollectible) => c.currentValue > c.purchasePrice ? '📈' : c.currentValue < c.purchasePrice ? '📉' : '➡️';

export type GoalCard = { goal: (typeof KIDS_SAVINGS_GOALS)[number]; chosen: boolean; done: boolean; weeksAway: number | null };
export const goalCards = (state: KidsGameState): GoalCard[] => {
  const perWeek = weeklyAllowance(state);
  return KIDS_SAVINGS_GOALS.map(goal => ({ goal, chosen: state.savingsGoal?.id === goal.id && !state.savingsGoal?.completed, done: state.completedGoals.includes(goal.id), weeksAway: state.cash >= goal.price ? 0 : perWeek > 0 ? Math.ceil((goal.price - state.cash) / perWeek) : null }));
};
export const goalProgress = (state: KidsGameState) => state.savingsGoal ? Math.min(100, Math.round(state.cash / Math.max(1, state.savingsGoal.targetAmount) * 100)) : 0;
