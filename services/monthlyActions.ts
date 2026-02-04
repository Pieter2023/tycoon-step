import { GameState, MonthlyActionId } from '../types';

export type MonthlyActionCategory = 'income' | 'growth' | 'recovery';

export type MonthlyActionCard = {
  id: MonthlyActionId;
  title: string;
  subtitle: string;
  details: string;
  category: MonthlyActionCategory;
  disabled: boolean;
  disabledReason?: string;
};

export type MonthlyActionsSummary = {
  max: number;
  remaining: number;
  reason: string;
  tooltip: string;
  locked: boolean;
  actions: MonthlyActionCard[];
};

const getLockedReason = (locked: boolean, remaining: number) => {
  if (locked) return 'Resolve the current event before taking actions.';
  if (remaining <= 0) return 'No Monthly Actions remaining.';
  return '';
};

export const getMonthlyActionsSummary = (state: GameState, isProcessing: boolean): MonthlyActionsSummary => {
  const max = state.monthlyActionsMax ?? 2;
  const remaining = typeof state.monthlyActionsRemaining === 'number' ? state.monthlyActionsRemaining : max;
  const energy = state.stats?.energy ?? 0;
  const stress = state.stats?.stress ?? 0;
  const health = state.stats?.health ?? 0;
  const hasBonus = energy >= 70 && stress <= 60;
  const hasCareerBonus = (state.career?.level ?? state.playerJob?.level ?? 0) >= 3;
  const hasPenalty = energy < 35 || stress >= 85 || health < 30;
  const reason = hasBonus
    ? 'Bonus: +1 action (high energy, manageable stress)'
    : hasPenalty
      ? 'Penalty: -1 action (low energy / high stress / low health)'
      : hasCareerBonus
        ? 'Bonus: +1 action (career momentum)'
        : 'Tip: keep energy high and stress low for more actions';
  const tooltip =
    `Monthly Actions start at 2. +1 if Energy ≥ 70 AND Stress ≤ 60. +1 if Career level ≥ 3. -1 if Energy < 35 OR Stress ≥ 85 OR Health < 30. Range: 1–4. ` +
    `This month: Energy ${Math.round(energy)}, Stress ${Math.round(stress)}, Health ${Math.round(health)} → Max ${max}.`;
  const locked = isProcessing || !!state.pendingScenario || !!state.hasWon || !!state.isBankrupt;
  const tooDrained = energy < 20;
  const hasHustle = (state.activeSideHustles || []).length > 0;
  const baseReason = getLockedReason(locked, remaining);

  const actions: MonthlyActionCard[] = [
    {
      id: 'OVERTIME',
      title: 'Work Overtime',
      subtitle: '+10% salary bonus (next month)',
      details: '-15 energy • +12 stress',
      category: 'income',
      disabled: locked || remaining <= 0 || tooDrained,
      disabledReason: baseReason || (tooDrained ? 'Too drained (need 20+ energy).' : undefined)
    },
    {
      id: 'NETWORK',
      title: 'Networking',
      subtitle: '+$0–$500 chance • +networking',
      details: 'Cost: $100 • +12 networking',
      category: 'income',
      disabled: locked || remaining <= 0 || state.cash < 100,
      disabledReason: baseReason || (state.cash < 100 ? 'Need $100 cash.' : undefined)
    },
    {
      id: 'TRAINING',
      title: 'Skill Training',
      subtitle: '+12 Financial IQ (stronger investing)',
      details: 'Cost: $300 • -8 energy • +4 stress',
      category: 'growth',
      disabled: locked || remaining <= 0 || tooDrained || state.cash < 300,
      disabledReason:
        baseReason ||
        (state.cash < 300 ? 'Need $300 cash.' : undefined) ||
        (tooDrained ? 'Too drained (need 20+ energy).' : undefined)
    },
    {
      id: 'HUSTLE_SPRINT',
      title: 'Hustle Sprint',
      subtitle: '+25% side hustle income (next month)',
      details: 'Requires active hustle • -12 energy • +10 stress',
      category: 'income',
      disabled: locked || remaining <= 0 || tooDrained || !hasHustle,
      disabledReason:
        baseReason ||
        (!hasHustle ? 'Start a hustle first.' : undefined) ||
        (tooDrained ? 'Too drained (need 20+ energy).' : undefined)
    },
    {
      id: 'RECOVER',
      title: 'Recover',
      subtitle: 'Restore energy & reduce stress',
      details: '+18 energy • -15 stress • +4 health',
      category: 'recovery',
      disabled: locked || remaining <= 0,
      disabledReason: baseReason || undefined
    }
  ];

  return {
    max,
    remaining,
    reason,
    tooltip,
    locked,
    actions
  };
};
