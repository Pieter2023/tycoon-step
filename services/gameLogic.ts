// Tycoon: Financial Freedom - Game Logic v3.4.3
// Complete with Life Events, Marriage, Children, Taxes, Recessions

import { 
  GameState, Asset, Liability, Scenario, MarketTrend, MarketCyclePhase, AssetType,
  CareerPath, EducationCategory, EducationLevel, Mortgage, SideHustle, MonthlyReport,
  Child, Spouse, LifeEventCategory, MonthlyActionId, QuestState, QuestReward, QuestDefinition,
  MarketItem
} from '../types';
import { 
  CAREER_PATHS, LIFESTYLE_OPTS, DIFFICULTY_SETTINGS, AI_CAREER_IMPACT,
  EDUCATION_OPTIONS, MORTGAGE_OPTIONS, ALL_LIFE_EVENTS, getFinancialFreedomTarget, MARKET_ITEMS,
  QUEST_DEFINITIONS, getInitialQuestState, getQuestById
} from '../constants';
import { formatCurrencyValue } from '../i18n';

// ============================================
// MONTHLY ACTIONS HELPERS
// ============================================
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const clampStat = (v: number) => clamp(v, 0, 100);

const clampCredit = (v: number) => clamp(v, 300, 850);

export const getCreditTier = (score: number): 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' => {
  if (score >= 760) return 'EXCELLENT';
  if (score >= 700) return 'GOOD';
  if (score >= 640) return 'FAIR';
  return 'POOR';
};

const formatMoneyFull = (val: number) =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });

let devBusinessSeed: number | null = null;
let devBusinessSeedSource: number | null = null;

const businessRandom = () => {
  const seed = (globalThis as any).__TYCOON_DEV_SEED;
  if ((import.meta.env?.DEV || import.meta.env?.MODE === 'test') && typeof seed === 'number') {
    if (devBusinessSeed === null || devBusinessSeedSource !== seed) {
      devBusinessSeed = seed;
      devBusinessSeedSource = seed;
    }
    devBusinessSeed = (devBusinessSeed * 9301 + 49297) % 233280;
    return devBusinessSeed / 233280;
  }
  return Math.random();
};

export const __testOnly_setBusinessSeed = (seed: number) => {
  devBusinessSeed = seed;
  devBusinessSeedSource = seed;
  (globalThis as any).__TYCOON_DEV_SEED = seed;
};

export const __testOnly_nextBusinessRandom = () => businessRandom();

// Applies temporary income disruptions (e.g., vacancy, strike) to owned assets.
const getAssetIncomeMultiplier = (state: GameState, assetId: string): number => {
  const disruptions = state.assetIncomeDisruptions || [];
  let mult = 1;
  for (const d of disruptions) {
    if (d.assetId === assetId && (d.monthsRemaining ?? 0) > 0) {
      const m = typeof d.incomeMultiplier === 'number' ? d.incomeMultiplier : 1;
      mult *= m;
    }
  }
  return clamp(mult, 0, 1);
};

// ============================================
// QUESTS / GOALS HELPERS
// ============================================
// Step 6 upgrades:
// - Live completion: quests become claimable immediately when requirements are met (not only month-end)
// - Claim flow: rewards apply when the player taps "Claim"
// - Branching questlines: the game infers a playstyle track (Investor / Entrepreneur / Debt Crusher)

const uniq = (ids: string[]) => Array.from(new Set(ids));

const computeTotalInvested = (state: GameState): number => {
  return (state.assets || [])
    .filter(a => a.type !== AssetType.SAVINGS)
    .reduce((s, a) => s + (a.value * (a.quantity || 1)), 0);
};

const computeDiversifiedTypes = (state: GameState): number => {
  const set = new Set<string>();
  for (const a of (state.assets || [])) {
    if (a.type === AssetType.SAVINGS) continue;
    set.add(a.type);
  }
  return set.size;
};

const computeDebtRepaidTotal = (state: GameState): number => {
  const liabPaid = (state.liabilities || []).reduce((s, l) => {
    const orig = typeof l.originalBalance === 'number' ? l.originalBalance : (l.balance || 0);
    const paid = Math.max(0, orig - (l.balance || 0));
    return s + paid;
  }, 0);

  const mortPaid = (state.mortgages || []).reduce((s, m) => {
    const orig = typeof m.originalAmount === 'number' ? m.originalAmount : (m.balance || 0);
    const paid = Math.max(0, orig - (m.balance || 0));
    return s + paid;
  }, 0);

  return liabPaid + mortPaid;
};

const computeBusinessCount = (state: GameState): number => {
  return (state.assets || []).filter(a => a.type === AssetType.BUSINESS).length;
};

const getCharacterPerkEffects = (state: GameState) => {
  return state.character?.perk?.effects || {};
};

const getNegotiationRaiseBonus = (state: GameState): number => {
  const bestScore = state.negotiationsCourse?.bestScore ?? 0;
  const certifiedBonus = state.negotiationsCourse?.certified ? 0.01 : 0;
  const scoreBonus = (bestScore / 15) * 0.01;
  return Math.min(0.03, certifiedBonus + scoreBonus);
};

const educationLevelOrder: EducationLevel[] = ['HIGH_SCHOOL', 'CERTIFICATE', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'MBA', 'PHD', 'LAW', 'MEDICAL'];

const hasRequiredEducationForInvestment = (item: MarketItem, degreeIds: string[]) => {
  if (!item.requiredEducationCategory && !item.requiredEducationLevel) return true;
  const requiredLevelIdx = item.requiredEducationLevel ? educationLevelOrder.indexOf(item.requiredEducationLevel) : -1;
  return degreeIds.some(degId => {
    const edu = EDUCATION_OPTIONS.find(e => e.id === degId);
    if (!edu) return false;
    const hasCategory = item.requiredEducationCategory
      ? item.requiredEducationCategory.includes(edu.category)
      : true;
    const hasLevel = requiredLevelIdx >= 0 ? educationLevelOrder.indexOf(edu.level) >= requiredLevelIdx : true;
    return hasCategory && hasLevel;
  });
};

const isAutoInvestEligible = (item: MarketItem) => {
  return item.type !== AssetType.REAL_ESTATE && item.type !== AssetType.BUSINESS;
};

const addAutoInvestAssetUnits = (state: GameState, item: MarketItem, unitPrice: number, qty: number): GameState => {
  if (qty <= 0) return state;
  const existing = (state.assets || []).find(a => a.name === item.name && !a.mortgageId);
  let newAssets = [...(state.assets || [])];

  if (existing) {
    const idx = newAssets.findIndex(a => a.id === existing.id);
    const newQuantity = (existing.quantity || 1) + qty;
    const newCostBasis = ((existing.costBasis * (existing.quantity || 1)) + (unitPrice * qty)) / newQuantity;
    const newCashFlow = (item.expectedYield * newCostBasis) / 12;
    newAssets[idx] = {
      ...existing,
      quantity: newQuantity,
      value: unitPrice,
      costBasis: newCostBasis,
      cashFlow: newCashFlow
    };
  } else {
    const baseMonthly = (item.expectedYield * unitPrice) / 12;
    newAssets.push({
      id: `asset-${Date.now()}-${item.id}`,
      name: item.name,
      type: item.type,
      value: unitPrice,
      costBasis: unitPrice,
      quantity: qty,
      cashFlow: baseMonthly,
      volatility: item.volatility,
      appreciationRate: item.expectedYield * 0.4,
      priceHistory: [{ month: state.month, value: unitPrice }],
      baseYield: item.expectedYield,
      industry: item.industry,
      opsUpgrade: item.type === AssetType.BUSINESS ? false : undefined,
      currentMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly) : undefined,
      lastMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly) : undefined
    });
  }

  return { ...state, assets: newAssets };
};

const validTracks = new Set(['DEBT_CRUSHER', 'INVESTOR', 'ENTREPRENEUR']);

type InferredTrack = 'DEBT_CRUSHER' | 'INVESTOR' | 'ENTREPRENEUR' | undefined;

const inferQuestTrack = (state: GameState, doneCount: number, existing?: InferredTrack): InferredTrack => {
  if (existing) return existing;

  // Don't force a track immediately; wait until there's enough signal.
  if (doneCount < 2 && state.month < 4) return undefined;

  const totalInvested = computeTotalInvested(state);
  const diversify = computeDiversifiedTypes(state);
  // IMPORTANT: do not call random side-hustle variance here.
  // This function can run outside the "Next Month" pipeline (e.g., UI), so we use the deterministic estimate.
  const passive = calculateMonthlyCashFlowEstimate(state).passive;
  const hustles = (state.activeSideHustles || []).length;
  const businessCount = computeBusinessCount(state);
  const debtRepaid = computeDebtRepaidTotal(state);
  const credit = state.creditRating || 650;

  // Strong explicit signals first
  if (businessCount >= 1 || hustles >= 2) return 'ENTREPRENEUR';
  if (debtRepaid >= 3000 && totalInvested < 12000) return 'DEBT_CRUSHER';

  // Otherwise use simple score heuristic
  const investorScore = (totalInvested / 15000) + (diversify / 4) + (passive / 2000);
  const debtScore = (debtRepaid / 12000) + ((credit - 650) / 300);
  const entrepreneurScore = (hustles / 2) + (businessCount * 1.5);

  const max = Math.max(investorScore, debtScore, entrepreneurScore);

  // If the player is still early and the signal is weak, keep it unassigned.
  if (max < 0.9 && state.month < 6) return undefined;

  if (max == entrepreneurScore) return 'ENTREPRENEUR';
  if (max == debtScore) return 'DEBT_CRUSHER';
  return 'INVESTOR';
};

const normalizeQuestState = (qs: any, characterId?: string): QuestState => {
  const validIds = new Set(QUEST_DEFINITIONS.map(q => q.id));
  const rawActive = Array.isArray(qs?.active) ? qs.active : null;
  const rawReady = Array.isArray(qs?.readyToClaim) ? qs.readyToClaim : null;
  const rawCompleted = Array.isArray(qs?.completed) ? qs.completed : null;

  const rawTrack = typeof qs?.track === 'string' && validTracks.has(qs.track) ? (qs.track as InferredTrack) : undefined;

  const completed = uniq((rawCompleted || [])
    .filter((id: any) => typeof id === 'string' && validIds.has(id))
    .filter((id: string) => {
      const quest = getQuestById(id);
      return quest && (!quest.characterId || quest.characterId === characterId);
    }));

  const completedSet = new Set(completed);

  const readyToClaim = uniq((rawReady || [])
    .filter((id: any) => typeof id === 'string' && validIds.has(id) && !completedSet.has(id))
    .filter((id: string) => {
      const quest = getQuestById(id);
      return quest && (!quest.characterId || quest.characterId === characterId);
    }));

  const readySet = new Set(readyToClaim);

  const fallbackActive = [...getInitialQuestState(characterId).active];
  const active = uniq((rawActive || fallbackActive)
    .filter((id: any) => typeof id === 'string' && validIds.has(id) && !completedSet.has(id) && !readySet.has(id))
    .filter((id: string) => {
      const quest = getQuestById(id);
      return quest && (!quest.characterId || quest.characterId === characterId);
    }))
    .slice(0, 3);

  return {
    active,
    readyToClaim,
    completed,
    track: rawTrack
  };
};

export type QuestProgressInfo = {
  quest: QuestDefinition;
  current: number;
  target: number;
  progress: number; // 0..1
  complete: boolean;
  unit: 'money' | 'count' | 'months' | 'score';
  // For CASH_RESERVE_MONTHS we expose the monthly expense used for the calculation.
  expenseBasis?: number;
};

export const getQuestProgress = (state: GameState, questId: string): QuestProgressInfo | null => {
  const quest = getQuestById(questId);
  if (!quest) return null;

  const metric = quest.metric;
  let current = 0;
  const target = quest.target;
  let unit: QuestProgressInfo['unit'] = 'count';
  let expenseBasis: number | undefined = undefined;

  switch (metric) {
    case 'CASH_AMOUNT': {
      unit = 'money';
      current = state.cash || 0;
      break;
    }
    case 'OWN_ASSET_COUNT': {
      unit = 'count';
      current = (state.assets || []).filter(a => a.type !== AssetType.SAVINGS).length;
      break;
    }
    case 'TOTAL_INVESTED': {
      unit = 'money';
      current = computeTotalInvested(state);
      break;
    }
    case 'DIVERSIFY_ASSET_TYPES': {
      unit = 'count';
      current = computeDiversifiedTypes(state);
      break;
    }
    case 'PASSIVE_INCOME': {
      unit = 'money';
      // IMPORTANT: avoid calling random side-hustle variance in UI-driven helpers.
      current = calculateMonthlyCashFlowEstimate(state).passive;
      break;
    }
    case 'ACTIVE_SIDE_HUSTLES': {
      unit = 'count';
      current = (state.activeSideHustles || []).length;
      break;
    }
    case 'CAREER_LEVEL': {
      unit = 'count';
      current = state.career?.level || state.playerJob?.level || 1;
      break;
    }
    case 'CASH_RESERVE_MONTHS': {
      unit = 'months';
      // IMPORTANT: avoid calling random side-hustle variance in UI-driven helpers.
      const expenses = calculateMonthlyCashFlowEstimate(state).expenses;
      expenseBasis = expenses;
      if (expenses <= 0) {
        current = state.cash > 0 ? target : 0;
      } else {
        current = (state.cash || 0) / expenses;
      }
      break;
    }
    case 'CREDIT_RATING': {
      unit = 'score';
      current = state.creditRating || 650;
      break;
    }
    case 'DEBT_REPAID_TOTAL': {
      unit = 'money';
      current = computeDebtRepaidTotal(state);
      break;
    }
    case 'OWN_BUSINESS_COUNT': {
      unit = 'count';
      current = computeBusinessCount(state);
      break;
    }
    case 'OWN_REAL_ESTATE_COUNT': {
      unit = 'count';
      current = (state.assets || []).filter(a => a.type === AssetType.REAL_ESTATE).length;
      break;
    }
    default:
      current = 0;
  }

  const progress = target <= 0 ? 1 : clamp(current / target, 0, 1);
  const complete = progress >= 0.999;

  return { quest, current, target, progress, complete, unit, expenseBasis };
};

const applyQuestReward = (state: GameState, reward: QuestReward): GameState => {
  let newState: GameState = { ...state };

  if (typeof reward.cash === 'number' && !Number.isNaN(reward.cash)) {
    newState.cash = Math.max(0, (newState.cash || 0) + reward.cash);
  }

  if (typeof reward.creditRating === 'number' && !Number.isNaN(reward.creditRating)) {
    const base = newState.creditRating || 650;
    newState.creditRating = clampCredit(base + reward.creditRating);
  }

  if (reward.stats) {
    const currentStats = newState.stats || ({} as any);
    const nextStats = { ...currentStats } as any;
    for (const [k, delta] of Object.entries(reward.stats)) {
      const key = k as keyof typeof nextStats;
      const d = typeof delta === 'number' ? delta : 0;
      const base = typeof nextStats[key] === 'number' ? nextStats[key] : 0;
      nextStats[key] = clampStat(base + d);
    }
    newState.stats = nextStats;
  }

  return newState;
};

const formatRewardShort = (reward: QuestReward): string => {
  const parts: string[] = [];
  if (typeof reward.cash === 'number' && reward.cash !== 0) {
    parts.push(`${reward.cash >= 0 ? '+' : ''}$${Math.abs(Math.round(reward.cash)).toLocaleString()} cash`);
  }
  if (typeof reward.creditRating === 'number' && reward.creditRating !== 0) {
    parts.push(`${reward.creditRating >= 0 ? '+' : ''}${Math.round(reward.creditRating)} credit`);
  }
  if (reward.stats) {
    for (const [k, v] of Object.entries(reward.stats)) {
      if (typeof v !== 'number' || v === 0) continue;
      const pretty = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      parts.push(`${v >= 0 ? '+' : ''}${Math.round(v)} ${pretty}`);
    }
  }
  return parts.length ? parts.join(' • ') : 'Reward applied';
};

const isQuestEligible = (
  q: QuestDefinition,
  doneSet: Set<string>,
  completedSet: Set<string>,
  readySet: Set<string>,
  activeSet: Set<string>,
  track: InferredTrack,
  mode: 'TRACK' | 'GLOBAL',
  characterId?: string
): boolean => {
  if (completedSet.has(q.id) || readySet.has(q.id) || activeSet.has(q.id)) return false;
  if (q.characterId && q.characterId !== characterId) return false;
  if (!q.characterId && characterId === undefined && mode === 'TRACK') {
    // No special handling needed, but keep for clarity.
  }

  if (mode === 'TRACK') {
    if (!track) return false;
    if (q.track !== track) return false;
  } else {
    // GLOBAL
    if (q.track) return false;
  }

  const prereq = q.unlockAfter || [];
  return prereq.every(p => doneSet.has(p));
};

// Evaluate quests, move completed ones into "ready to claim", and keep up to 3 active.
export const updateQuests = (state: GameState): GameState => {
  const current = { ...state };
  const characterId = state.character?.id;
  const quests = normalizeQuestState((state as any).quests, characterId);

  const completedSet = new Set<string>(quests.completed);
  const readySet = new Set<string>(quests.readyToClaim);

  // For unlocking purposes, a quest is considered "done" once it is completed OR ready-to-claim.
  const doneSet = new Set<string>([...quests.completed, ...quests.readyToClaim]);

  // 1) Infer track (once) based on playstyle
  const inferred = inferQuestTrack(current, doneSet.size, quests.track as InferredTrack);
  let trackJustSet = false;
  if (!quests.track && inferred) {
    quests.track = inferred;
    trackJustSet = true;
  }

  let newState: GameState = current;

  // Add a single milestone event when track is first assigned.
  if (trackJustSet) {
    const label = quests.track === 'INVESTOR' ? 'Investor' : quests.track === 'ENTREPRENEUR' ? 'Entrepreneur' : 'Debt Crusher';
    const id = `track-${quests.track}-${newState.month}`;
    const already = (newState.events || []).some(e => e.id === id);
    if (!already) {
      newState.events = [
        {
          id,
          month: newState.month,
          title: `🧭 Track Unlocked: ${label}`,
          description: `Based on your recent decisions, your next goals will lean toward the ${label} track. You can still play however you want—this just guides your short-term objectives.`,
          type: 'MILESTONE'
        },
        ...(newState.events || [])
      ];
    }
  }

  // 2) Move newly completed ACTIVE quests into readyToClaim (no reward yet)
  let active = [...quests.active];
  const newlyReady: string[] = [];
  for (const id of active) {
    if (completedSet.has(id) || readySet.has(id)) continue;
    const info = getQuestProgress(newState, id);
    if (!info) continue;
    if (info.complete) newlyReady.push(id);
  }

  if (newlyReady.length > 0) {
    for (const id of newlyReady) {
      active = active.filter(a => a !== id);
      if (!readySet.has(id) && !completedSet.has(id)) {
        quests.readyToClaim.push(id);
        readySet.add(id);
        doneSet.add(id);
      }
    }
  }

  // 3) Fill active slots (max 3), preferring track quests when a track exists
  const activeSet = new Set<string>(active);
  while (active.length < 3) {
    let next: QuestDefinition | undefined;

    if (quests.track) {
      next = QUEST_DEFINITIONS.find(q => isQuestEligible(q, doneSet, completedSet, readySet, activeSet, quests.track as InferredTrack, 'TRACK', characterId));
    }

    if (!next) {
      next = QUEST_DEFINITIONS.find(q => isQuestEligible(q, doneSet, completedSet, readySet, activeSet, quests.track as InferredTrack, 'GLOBAL', characterId));
    }

    if (!next) break;

    active.push(next.id);
    activeSet.add(next.id);
  }

  newState.quests = {
    active,
    readyToClaim: uniq(quests.readyToClaim),
    completed: uniq(Array.from(completedSet)),
    track: quests.track
  };

  return newState;
};

// Claim a quest reward (applies reward exactly once), then refresh quest slots.
export const claimQuestReward = (state: GameState, questId: string): GameState => {
  const quests = normalizeQuestState((state as any).quests, state.character?.id);

  if (!(quests.readyToClaim || []).includes(questId)) return state;

  const def = getQuestById(questId);
  if (!def) return state;

  let newState: GameState = { ...state };

  // Apply reward once
  newState = applyQuestReward(newState, def.reward);

  // Update quest lists
  quests.readyToClaim = (quests.readyToClaim || []).filter(id => id !== questId);
  quests.completed = uniq([...(quests.completed || []), questId]);
  quests.active = (quests.active || []).filter(id => id !== questId);

  newState.quests = {
    ...quests,
    completed: quests.completed,
    readyToClaim: quests.readyToClaim,
    active: quests.active
  };

  // Add achievement event
  newState.events = [
    {
      id: `quest-claim-${questId}-${newState.month}`,
      month: newState.month,
      title: `🏆 Goal Achieved: ${def.title}`,
      description: `${def.description}\nReward: ${formatRewardShort(def.reward)}${def.hint ? `\nTip: ${def.hint}` : ''}`,
      type: 'ACHIEVEMENT'
    },
    ...(newState.events || [])
  ];

  // Refresh quest state (fills new active quests, may infer track, etc.)
  newState = updateQuests(newState);

  // Keep events trimmed (lightweight safety)
  newState.events = (newState.events || []).slice(0, 50);

  return newState;
};


// Determine how many Monthly Actions the player gets this month.
// Keeps it simple, gamey, and understandable: you get more actions when you're
// rested and not overloaded.
export const calculateMonthlyActionsMax = (state: GameState): number => {
  const energy = state.stats?.energy ?? 50;
  const stress = state.stats?.stress ?? 50;
  const health = state.stats?.health ?? 50;

  let slots = 2;

  // Feeling good → more capacity
  if (energy >= 70 && stress <= 60) slots += 1;

  // Career momentum → more bandwidth
  const careerLevel = state.career?.level ?? state.playerJob?.level ?? 0;
  if (careerLevel >= 3) slots += 1;

  // Burnout / poor health → less capacity
  if (energy < 35 || stress >= 85 || health < 30) slots -= 1;

  return clamp(slots, 1, 4);
};

// Salary calculation without any random calls.
// (We avoid calculateMonthlyCashFlow here because it triggers random side hustle variance.)
export const calculateEffectiveMonthlySalary = (state: GameState): number => {
  const perkEffects = getCharacterPerkEffects(state);
  // If the player is unemployed due to a job loss shock, salary is temporarily $0.
  if ((state.jobLossMonthsRemaining ?? 0) > 0) {
    return 0;
  }

  // Base salary with education multiplier
  const educationMultiplier = getEducationSalaryMultiplier(state);
  let baseSalary = (state.career?.salary || state.playerJob?.salary || 0);
  baseSalary = Math.round(baseSalary * educationMultiplier);

  // Apply AI disruption to salary
  const careerPath = state.career?.path || 'TECH';
  const aiImpact = state.aiDisruption?.affectedIndustries?.[careerPath];
  if (aiImpact && aiImpact.salaryImpact) {
    baseSalary = Math.round(baseSalary * aiImpact.salaryImpact);
  }

  // Apply recession impact
  if (state.economy?.recession) {
    const recessionMultiplier = perkEffects.recessionSalaryMultiplier ?? 0.95;
    baseSalary = Math.round(baseSalary * recessionMultiplier);
  }

  // Monthly Actions: overtime, etc. (one-turn salary bonus)
  if (state.tempSalaryBonus) {
    baseSalary += Math.round(state.tempSalaryBonus);
  }

  const salaryMultiplier = perkEffects.salaryMultiplier ?? 1;
  return Math.max(0, Math.round(baseSalary * salaryMultiplier));
};

// ============================================
// NET WORTH CALCULATION
// ============================================
export const calculateNetWorth = (state: GameState): number => {
  const assetsValue = (state.assets || []).reduce((sum, a) => sum + (a.value * (a.quantity ?? 1)), 0);
  const vehiclesValue = state.vehicles?.reduce((sum, v) => sum + v.value, 0) || 0;
  const liabilitiesValue = state.liabilities.reduce((sum, l) => sum + l.balance, 0);
  return state.cash + assetsValue + vehiclesValue - liabilitiesValue;
};

// ============================================
// TAX CALCULATION
// ============================================
export const calculateAnnualTaxes = (state: GameState): number => {
  const cashFlow = calculateMonthlyCashFlow(state);
  const annualIncome = (cashFlow.salary + cashFlow.sideHustleIncome + cashFlow.passive + cashFlow.spouseIncome) * 12;
  
  // Progressive tax brackets (simplified)
  let tax = 0;
  if (annualIncome > 578125) {
    tax = 174238 + (annualIncome - 578125) * 0.37;
  } else if (annualIncome > 231250) {
    tax = 52832 + (annualIncome - 231250) * 0.35;
  } else if (annualIncome > 182100) {
    tax = 37104 + (annualIncome - 182100) * 0.32;
  } else if (annualIncome > 95375) {
    tax = 16290 + (annualIncome - 95375) * 0.24;
  } else if (annualIncome > 44725) {
    tax = 5147 + (annualIncome - 44725) * 0.22;
  } else if (annualIncome > 11000) {
    tax = 1100 + (annualIncome - 11000) * 0.12;
  } else {
    tax = annualIncome * 0.10;
  }
  
  // Deductions for children
  const childDeduction = (state.family?.children?.length || 0) * 2000;
  
  return Math.max(0, Math.round(tax - childDeduction));
};

// ============================================
// EDUCATION RELEVANCE CHECK
// ============================================
export const isEducationRelevant = (educationCategory: EducationCategory, careerPath: CareerPath): boolean => {
  const relevantCombos: { [key in EducationCategory]: CareerPath[] } = {
    'STEM': ['TECH', 'ENTREPRENEUR', 'FINANCE'],
    'BUSINESS': ['FINANCE', 'SALES', 'ENTREPRENEUR', 'GOVERNMENT'],
    'HEALTHCARE': ['HEALTHCARE'],
    'TRADES': ['TRADES', 'ENTREPRENEUR'],
    'CREATIVE': ['CREATIVE'],
    'LIBERAL_ARTS': [],
    'LAW': ['GOVERNMENT', 'FINANCE', 'ENTREPRENEUR']
  };
  return relevantCombos[educationCategory]?.includes(careerPath) || false;
};

// ============================================
// EDUCATION SALARY MULTIPLIER
// ============================================
export const getEducationSalaryMultiplier = (state: GameState): number => {
  let multiplier = 1.0;
  const careerPath = state.career?.path || 'TECH';
  
  for (const degreeId of state.education.degrees) {
    const edu = EDUCATION_OPTIONS.find(e => e.id === degreeId);
    if (edu && edu.relevantCareers.includes(careerPath)) {
      multiplier *= edu.salaryBoost;
    }
  }
  
  // Cap at 3x to prevent unrealistic salary inflation
  return Math.min(3.0, multiplier);
};

// ============================================
// CHILDREN EXPENSES CALCULATION
// ============================================
export const calculateChildrenExpenses = (state: GameState): number => {
  if (!state.family?.children || state.family.children.length === 0) return 0;
  
  let expenses = 0;
  const currentMonth = state.month;
  
  for (const child of state.family.children) {
    const ageInMonths = currentMonth - child.birthMonth;
    
    // Skip children not yet born (pregnancy costs handled separately)
    if (ageInMonths < 0) {
      expenses += 300; // Pregnancy costs (prenatal care, preparations)
      continue;
    }
    
    const ageInYears = Math.floor(ageInMonths / 12);
    
    // Base costs by age
    if (ageInYears < 2) {
      expenses += 1200; // Infant/toddler (daycare, diapers, etc.)
    } else if (ageInYears < 5) {
      expenses += 1000; // Preschool age
    } else if (ageInYears < 12) {
      expenses += 600; // Elementary school
    } else if (ageInYears < 18) {
      expenses += 800; // Teenager
    } else if (ageInYears < 22 && child.inCollege) {
      expenses += 1500; // College support (if paying)
    }
    // Children 22+ are independent (no expenses)
  }
  
  return expenses;
};

// ============================================
// AI DISRUPTION UPDATE
// ============================================
export const updateAIDisruption = (state: GameState): GameState => {
  const newState = { ...state };
  const diffSettings = DIFFICULTY_SETTINGS[state.difficulty as keyof typeof DIFFICULTY_SETTINGS] || DIFFICULTY_SETTINGS.NORMAL;
  
  const monthlyIncrease = 0.25 * (diffSettings.aiDisruptionSpeed || 1);
  
  newState.aiDisruption = {
    ...state.aiDisruption,
    disruptionLevel: Math.min(100, (state.aiDisruption?.disruptionLevel || 0) + monthlyIncrease),
    year: 2025 + Math.floor(state.month / 12)
  };
  
  const level = newState.aiDisruption.disruptionLevel;
  const careers: CareerPath[] = ['TECH', 'FINANCE', 'HEALTHCARE', 'TRADES', 'CREATIVE', 'ENTREPRENEUR', 'GOVERNMENT', 'SALES'];
  
  const affectedIndustries: typeof newState.aiDisruption.affectedIndustries = {};
  
  careers.forEach(career => {
    const impact = AI_CAREER_IMPACT[career];
    if (!impact) return;
    
    const currentYear = newState.aiDisruption.year;
    let salaryImpact = 1.0;
    
    for (const phase of impact.phases) {
      if (currentYear >= phase.year) {
        salaryImpact = phase.impact;
      }
    }
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (impact.vulnerability >= 0.6) riskLevel = 'CRITICAL';
    else if (impact.vulnerability >= 0.4) riskLevel = 'HIGH';
    else if (impact.vulnerability >= 0.2) riskLevel = 'MEDIUM';
    
    affectedIndustries[career] = {
      jobLossPercent: impact.vulnerability * level,
      salaryImpact,
      automationRisk: riskLevel
    };
  });
  
  newState.aiDisruption.affectedIndustries = affectedIndustries;
  
  return newState;
};

// ============================================
// MORTGAGE CALCULATIONS
// ============================================
export const calculateMortgagePayment = (principal: number, annualRate: number, termYears: number): number => {
  const monthlyRate = annualRate / 12;
  const numPayments = termYears * 12;
  
  if (monthlyRate === 0) return Math.round(principal / numPayments);
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.round(payment);
};

export const createMortgage = (
  assetId: string, 
  assetName: string, 
  price: number, 
  optionId: string, 
  baseRate: number,
  overrides?: { downPaymentPercent?: number; rateAdjustment?: number }
): { mortgage: Mortgage; downPayment: number; liability: Liability } | null => {
  const option = MORTGAGE_OPTIONS.find(o => o.id === optionId);
  if (!option) return null;
  
  const downPaymentPercent = typeof overrides?.downPaymentPercent === 'number'
    ? overrides.downPaymentPercent
    : option.downPaymentPercent;
  const downPayment = Math.round(price * (downPaymentPercent / 100));
  const loanAmount = price - downPayment;
  const interestRate = baseRate + option.interestRateSpread + (overrides?.rateAdjustment || 0);
  const monthlyPayment = calculateMortgagePayment(loanAmount, interestRate, option.termYears);
  
  const mortgageId = 'mtg-' + Date.now();
  
  const mortgage: Mortgage = {
    id: mortgageId,
    assetId,
    assetName,
    originalAmount: loanAmount,
    balance: loanAmount,
    interestRate,
    monthlyPayment,
    termMonths: option.termYears * 12,
    monthsRemaining: option.termYears * 12,
    downPaymentPercent,
    type: optionId.includes('investment') ? 'INVESTMENT' : optionId.includes('fha') ? 'FHA' : 'CONVENTIONAL'
  };
  
  const liability: Liability = {
    id: mortgageId,
    name: `Mortgage: ${assetName}`,
    balance: loanAmount,
    originalBalance: loanAmount,
    interestRate,
    monthlyPayment,
    type: 'MORTGAGE',
    assetId
  };
  
  return { mortgage, downPayment, liability };
};

// ============================================
// SIDE HUSTLE INCOME CALCULATION
// ============================================
const getSideHustleUpgradeEffects = (hustle: SideHustle) => {
  const effects = {
    incomeMultiplier: 1,
    passiveIncomeShare: 0,
    energyMultiplier: 1,
    stressMultiplier: 1
  };
  const upgrades = hustle.upgrades || [];
  const milestones = hustle.milestones || [];

  upgrades.forEach((upgradeId, index) => {
    const milestone = milestones[index];
    const option = milestone?.options.find(opt => opt.id === upgradeId);
    if (!option) return;
    const upgradeEffects = option.effects || {};
    if (typeof upgradeEffects.incomeMultiplier === 'number') {
      effects.incomeMultiplier *= upgradeEffects.incomeMultiplier;
    }
    if (typeof upgradeEffects.energyMultiplier === 'number') {
      effects.energyMultiplier *= upgradeEffects.energyMultiplier;
    }
    if (typeof upgradeEffects.stressMultiplier === 'number') {
      effects.stressMultiplier *= upgradeEffects.stressMultiplier;
    }
    if (typeof upgradeEffects.passiveIncomeShare === 'number') {
      effects.passiveIncomeShare = clamp(effects.passiveIncomeShare + upgradeEffects.passiveIncomeShare, 0, 0.9);
    }
  });

  return effects;
};

const calculateSideHustleIncomeBreakdown = (state: GameState): { total: number; passive: number } => {
  if (!state.activeSideHustles || state.activeSideHustles.length === 0) {
    return { total: 0, passive: 0 };
  }
  
  let total = 0;
  let passive = 0;
  const disruptionLevel = state.aiDisruption?.disruptionLevel || 0;
  
  for (const hustle of state.activeSideHustles) {
    const aiPenalty = 1 - (hustle.aiVulnerability * disruptionLevel / 200);
    const midpoint = (hustle.incomeRange.min + hustle.incomeRange.max) / 2;
    const variance = (hustle.incomeRange.max - hustle.incomeRange.min) * (Math.random() - 0.5) * 0.5;
    const baseIncome = midpoint + variance;
    const effects = getSideHustleUpgradeEffects(hustle);
    const adjustedIncome = Math.round(baseIncome * Math.max(0.3, aiPenalty) * effects.incomeMultiplier);
    const passiveShare = Math.round(adjustedIncome * effects.passiveIncomeShare);
    total += adjustedIncome;
    passive += passiveShare;
  }

  // Monthly action modifier (e.g., "Side Hustle Sprint")
  const mult = typeof state.tempSideHustleMultiplier === 'number' ? state.tempSideHustleMultiplier : 1;
  const totalAdjusted = Math.round(total * clamp(mult, 0.25, 3));
  const passiveAdjusted = Math.round(passive * clamp(mult, 0.25, 3));
  const perkMultiplier = getCharacterPerkEffects(state).sideHustleIncomeMultiplier ?? 1;
  const perkTotal = Math.round(totalAdjusted * perkMultiplier);
  const perkPassive = Math.round(passiveAdjusted * perkMultiplier);
  return { total: perkTotal, passive: Math.min(perkPassive, perkTotal) };
};

export const calculateSideHustleIncome = (state: GameState): number => {
  return calculateSideHustleIncomeBreakdown(state).total;
};

// Deterministic estimate (NO random calls). Use this for UI previews, save summaries,
// and any calculations that may run outside the "Next Month" pipeline.
const calculateSideHustleIncomeEstimateBreakdown = (state: GameState): { total: number; passive: number } => {
  if (!state.activeSideHustles || state.activeSideHustles.length === 0) {
    return { total: 0, passive: 0 };
  }

  let total = 0;
  let passive = 0;
  const disruptionLevel = state.aiDisruption?.disruptionLevel || 0;

  for (const hustle of state.activeSideHustles) {
    const aiPenalty = 1 - (hustle.aiVulnerability * disruptionLevel / 200);
    const midpoint = (hustle.incomeRange.min + hustle.incomeRange.max) / 2;
    const baseIncome = midpoint; // no variance
    const effects = getSideHustleUpgradeEffects(hustle);
    const adjustedIncome = Math.round(baseIncome * Math.max(0.3, aiPenalty) * effects.incomeMultiplier);
    const passiveShare = Math.round(adjustedIncome * effects.passiveIncomeShare);
    total += adjustedIncome;
    passive += passiveShare;
  }

  const mult = typeof state.tempSideHustleMultiplier === 'number' ? state.tempSideHustleMultiplier : 1;
  const totalAdjusted = Math.round(total * clamp(mult, 0.25, 3));
  const passiveAdjusted = Math.round(passive * clamp(mult, 0.25, 3));
  const perkMultiplier = getCharacterPerkEffects(state).sideHustleIncomeMultiplier ?? 1;
  const perkTotal = Math.round(totalAdjusted * perkMultiplier);
  const perkPassive = Math.round(passiveAdjusted * perkMultiplier);
  return { total: perkTotal, passive: Math.min(perkPassive, perkTotal) };
};

export const calculateSideHustleIncomeEstimate = (state: GameState): number => {
  return calculateSideHustleIncomeEstimateBreakdown(state).total;
};

const updateSideHustleProgress = (state: GameState): GameState => {
  const activeSideHustles = (state.activeSideHustles || []).map(hustle => ({
    ...hustle,
    monthsActive: (hustle.monthsActive ?? 0) + 1
  }));

  if (state.pendingSideHustleUpgrade) {
    return { ...state, activeSideHustles };
  }

  let pendingUpgrade = state.pendingSideHustleUpgrade ?? null;

  for (const hustle of activeSideHustles) {
    const milestones = hustle.milestones || [];
    const nextIndex = (hustle.upgrades || []).length;
    const nextMilestone = milestones[nextIndex];
    if (nextMilestone && (hustle.monthsActive ?? 0) >= nextMilestone.monthsRequired) {
      pendingUpgrade = { hustleId: hustle.id, milestoneIndex: nextIndex };
      break;
    }
  }

  return {
    ...state,
    activeSideHustles,
    pendingSideHustleUpgrade: pendingUpgrade
  };
};

type BusinessMaintenanceEvent = {
  label: string;
  impact: string;
  incomeMultiplier?: number;
  cashCostPct?: number;
};

const BUSINESS_MAINTENANCE_EVENTS: BusinessMaintenanceEvent[] = [
  { label: 'Site outage', incomeMultiplier: 0.7, impact: '-30% income' },
  { label: 'Supply issue', incomeMultiplier: 0.8, impact: '-20% income' },
  { label: 'Refund spike', incomeMultiplier: 0.65, impact: '-35% income' },
  { label: 'Compliance audit', cashCostPct: 0.03, impact: 'Compliance cost' },
  { label: 'Equipment repair', cashCostPct: 0.05, impact: 'Repair cost' }
];

const hasEducationCategory = (state: GameState, categories: EducationCategory[]) => {
  return state.education.degrees.some(degId => {
    const edu = EDUCATION_OPTIONS.find(e => e.id === degId);
    return edu ? categories.includes(edu.category) : false;
  });
};

const applyBusinessIncomeVariance = (state: GameState): { state: GameState; maintenanceCost: number } => {
  let maintenanceCost = 0;
  const maintenanceEvents: any[] = [];
  const perkEffects = getCharacterPerkEffects(state);
  const volatilityMultiplier = perkEffects.businessVolatilityMultiplier ?? 1;
  const maintenanceChanceMultiplier = perkEffects.businessMaintenanceChanceMultiplier ?? 1;
  const maintenanceCostMultiplier = perkEffects.businessMaintenanceCostMultiplier ?? 1;

  state.assets = state.assets.map(asset => {
    if (asset.type !== AssetType.BUSINESS) return asset;

    const qty = asset.quantity ?? 1;
    const baseIncome = Math.max(0, asset.cashFlow || 0) * qty;
    const prevIncome = typeof asset.currentMonthIncome === 'number' ? asset.currentMonthIncome : Math.round(baseIncome);

    let maintenanceStatus = asset.maintenanceStatus;
    if (maintenanceStatus && maintenanceStatus.untilMonth < state.month) {
      maintenanceStatus = undefined;
    }

    const opsFactor = asset.opsUpgrade ? 0.6 : 1;
    const educationVolatilityFactor = hasEducationCategory(state, ['BUSINESS']) ? 0.9 : hasEducationCategory(state, ['STEM']) ? 0.95 : 1;
    const educationMaintenanceFactor = hasEducationCategory(state, ['BUSINESS']) ? 0.8 : hasEducationCategory(state, ['STEM']) ? 0.9 : 1;
    const variance = (businessRandom() * 2 - 1) * asset.volatility * volatilityMultiplier * 0.6 * opsFactor * educationVolatilityFactor;
    let incomeMultiplier = clamp(1 + variance, 0.55, 1.45);

    const maintenanceChance = (0.05 + asset.volatility * 0.12) * maintenanceChanceMultiplier * (asset.opsUpgrade ? 0.6 : 1) * educationMaintenanceFactor;
    if (!maintenanceStatus && businessRandom() < maintenanceChance) {
      const event = BUSINESS_MAINTENANCE_EVENTS[Math.floor(businessRandom() * BUSINESS_MAINTENANCE_EVENTS.length)];

      if (typeof event.incomeMultiplier === 'number') {
        incomeMultiplier *= event.incomeMultiplier;
      }

      if (typeof event.cashCostPct === 'number') {
        const cost = Math.max(0, Math.round(asset.value * qty * event.cashCostPct * maintenanceCostMultiplier));
        maintenanceCost += cost;
        maintenanceStatus = {
          label: event.label,
          impact: `${event.impact}: ${formatMoneyFull(cost)}`,
          untilMonth: state.month
        };
        maintenanceEvents.push({
          id: Date.now().toString(),
          month: state.month,
          title: `🔧 ${event.label}`,
          description: `${asset.name} incurred ${formatMoneyFull(cost)} in maintenance costs.`,
          type: 'WARNING'
        });
      } else {
        maintenanceStatus = {
          label: event.label,
          impact: event.impact,
          untilMonth: state.month
        };
        maintenanceEvents.push({
          id: Date.now().toString(),
          month: state.month,
          title: `⚠️ ${event.label}`,
          description: `${asset.name} income was impacted this month (${event.impact}).`,
          type: 'WARNING'
        });
      }
    }

    const currentIncome = Math.max(0, Math.round(baseIncome * incomeMultiplier));

    return {
      ...asset,
      lastMonthIncome: prevIncome,
      currentMonthIncome: currentIncome,
      maintenanceStatus
    };
  });

  if (maintenanceEvents.length > 0) {
    state.events = [...maintenanceEvents, ...(state.events || [])].slice(0, 50);
  }

  return { state, maintenanceCost };
};

// ============================================
// MONTHLY CASH FLOW CALCULATION
// ============================================
export const calculateMonthlyCashFlow = (state: GameState): {
  salary: number;
  sideHustleIncome: number;
  passive: number;
  spouseIncome: number;
  income: number;
  lifestyleCost: number;
  debtPayments: number;
  educationPayment: number;
  childrenExpenses: number;
  vehicleCosts: number;
  expenses: number;
} => {
  const diffSettings = DIFFICULTY_SETTINGS[state.difficulty as keyof typeof DIFFICULTY_SETTINGS] || DIFFICULTY_SETTINGS.NORMAL;
  
  // Salary (education multiplier + AI / recession impacts + one-turn bonuses)
  const baseSalary = calculateEffectiveMonthlySalary(state);
  
  // Side hustle income (with automation/hire passive split)
  const sideHustleBreakdown = calculateSideHustleIncomeBreakdown(state);
  const sideHustleIncome = sideHustleBreakdown.total - sideHustleBreakdown.passive;
  
  // Passive income from assets
  let passiveIncome = 0;
  for (const asset of state.assets) {
    const sectorMult = state.economy?.sectorPerformance?.[asset.industry || 'diversified'] || 1;
    const yieldBonus = diffSettings.assetYieldBonus || 0;
    const incomeMult = getAssetIncomeMultiplier(state, asset.id);
    const qty = asset.quantity || 1;
    const baseIncome = asset.type === AssetType.BUSINESS && typeof asset.currentMonthIncome === 'number'
      ? asset.currentMonthIncome
      : asset.cashFlow * qty;
    const assetIncome = (baseIncome + (asset.value * yieldBonus / 12) * qty) * sectorMult * incomeMult;
    passiveIncome += assetIncome;
  }

  // Financial IQ slightly improves passive income efficiency (0% to +5%)
  const fi = clampStat(state.stats?.financialIQ ?? 0);
  passiveIncome = (passiveIncome + sideHustleBreakdown.passive) * (1 + fi * 0.0005);
  
  // Spouse income
  const spouseIncome = state.family?.spouse?.income || 0;
  
  const totalIncome = baseSalary + sideHustleIncome + Math.round(passiveIncome) + spouseIncome;
  
  // Expenses
  const lifestyleOpt = LIFESTYLE_OPTS[state.lifestyle];
  let lifestyleCost = Math.round((lifestyleOpt?.cost || 2500) * diffSettings.expenseMultiplier);
  
  // Inflation adjustment
  const inflationMult = Math.pow(1 + (state.economy?.inflationRate || 0.03), state.month / 12);
  lifestyleCost = Math.round(lifestyleCost * inflationMult);
  
  // Debt payments
  const debtPayments = state.liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0);
  
  // Education payment
  const educationPayment = state.education?.currentlyEnrolled?.monthlyPayment || 0;
  
  // Children expenses
  const childrenExpenses = calculateChildrenExpenses(state);
  
  // Vehicle costs
  const vehicleCosts = state.vehicles?.reduce((sum, v) => sum + v.monthlyMaintenance, 0) || 0;
  
  const totalExpenses = lifestyleCost + debtPayments + educationPayment + childrenExpenses + vehicleCosts;
  
  return {
    salary: baseSalary,
    sideHustleIncome,
    passive: Math.round(passiveIncome),
    spouseIncome,
    income: totalIncome,
    lifestyleCost,
    debtPayments,
    educationPayment,
    childrenExpenses,
    vehicleCosts,
    expenses: totalExpenses
  };
};

// Deterministic cash flow estimate used for UI previews, quest calculations, and save summaries.
// IMPORTANT: This function must never call Math.random().
export const calculateMonthlyCashFlowEstimate = (state: GameState): {
  salary: number;
  sideHustleIncome: number;
  passive: number;
  spouseIncome: number;
  income: number;
  lifestyleCost: number;
  debtPayments: number;
  educationPayment: number;
  childrenExpenses: number;
  vehicleCosts: number;
  expenses: number;
} => {
  const diffSettings = DIFFICULTY_SETTINGS[state.difficulty as keyof typeof DIFFICULTY_SETTINGS] || DIFFICULTY_SETTINGS.NORMAL;

  // Salary (includes any one-turn monthly action bonus)
  const salary = calculateEffectiveMonthlySalary(state);

  // Side hustle income (expected value, no variance)
  const sideHustleBreakdown = calculateSideHustleIncomeEstimateBreakdown(state);
  const sideHustleIncome = sideHustleBreakdown.total - sideHustleBreakdown.passive;

  // Passive income from assets
  let passiveIncome = 0;
  for (const asset of (state.assets || [])) {
    const sectorMult = state.economy?.sectorPerformance?.[asset.industry || 'diversified'] || 1;
    const yieldBonus = diffSettings.assetYieldBonus || 0;
    const qty = asset.quantity ?? 1;
    const incomeMult = getAssetIncomeMultiplier(state, asset.id);
    const assetIncome = (asset.cashFlow + (asset.value * yieldBonus / 12)) * qty * sectorMult * incomeMult;
    passiveIncome += assetIncome;
  }

  // Financial IQ slightly improves passive income efficiency (0% to +5%)
  const fi = clampStat(state.stats?.financialIQ ?? 0);
  passiveIncome = (passiveIncome + sideHustleBreakdown.passive) * (1 + fi * 0.0005);

  const passive = Math.round(passiveIncome);

  // Spouse income
  const spouseIncome = state.family?.spouse?.income || 0;

  const income = salary + sideHustleIncome + passive + spouseIncome;

  // Expenses
  const lifestyleOpt = LIFESTYLE_OPTS[state.lifestyle];
  let lifestyleCost = Math.round((lifestyleOpt?.cost || 2500) * diffSettings.expenseMultiplier);

  // Inflation adjustment
  const inflationMult = Math.pow(1 + (state.economy?.inflationRate || 0.03), state.month / 12);
  lifestyleCost = Math.round(lifestyleCost * inflationMult);

  // Debt payments
  const debtPayments = (state.liabilities || []).reduce((sum, l) => sum + (l.monthlyPayment || 0), 0);

  // Education payment
  const educationPayment = state.education?.currentlyEnrolled?.monthlyPayment || 0;

  // Children expenses
  const childrenExpenses = calculateChildrenExpenses(state);

  // Vehicle costs
  const vehicleCosts = state.vehicles?.reduce((sum, v) => sum + (v.monthlyMaintenance || 0), 0) || 0;

  const expenses = lifestyleCost + debtPayments + educationPayment + childrenExpenses + vehicleCosts;

  return {
    salary,
    sideHustleIncome,
    passive,
    spouseIncome,
    income,
    lifestyleCost,
    debtPayments,
    educationPayment,
    childrenExpenses,
    vehicleCosts,
    expenses,
  };
};

// ============================================
// MARKET CYCLE UPDATE
// ============================================
export const updateMarketCycle = (state: GameState): GameState => {
  const newState = { ...state };
  newState.marketCycle = { ...state.marketCycle };
  newState.marketCycle.monthsInPhase++;
  
  // Check for phase transition
  const transitionChance = newState.marketCycle.monthsInPhase / newState.marketCycle.nextPhaseIn;
  
  if (Math.random() < transitionChance * 0.3) {
    const phases: MarketCyclePhase[] = ['EXPANSION', 'PEAK', 'CONTRACTION', 'TROUGH'];
    const currentIdx = phases.indexOf(newState.marketCycle.phase);
    newState.marketCycle.phase = phases[(currentIdx + 1) % 4];
    newState.marketCycle.monthsInPhase = 0;
    newState.marketCycle.intensity = 0.3 + Math.random() * 0.5;
    newState.marketCycle.nextPhaseIn = 12 + Math.floor(Math.random() * 24);
    
    const trendMap: { [key in MarketCyclePhase]: MarketTrend } = {
      'EXPANSION': 'BULL',
      'PEAK': 'BOOM',
      'CONTRACTION': 'BEAR',
      'TROUGH': 'CRASH'
    };
    
    newState.economy = { ...newState.economy, marketTrend: trendMap[newState.marketCycle.phase] };
    
    // Check for recession
    if (newState.marketCycle.phase === 'CONTRACTION' && Math.random() < 0.4) {
      newState.economy.recession = true;
      newState.economy.recessionMonths = 12 + Math.floor(Math.random() * 12);
    }
  }
  
  // Update recession status
  if (newState.economy.recession && newState.economy.recessionMonths > 0) {
    newState.economy.recessionMonths--;
    if (newState.economy.recessionMonths <= 0) {
      newState.economy.recession = false;
    }
  }
  
  return newState;
};

// ============================================
// ASSET PRICE UPDATE
// ============================================
export const updateAssetPrices = (state: GameState): GameState => {
  const newState = { ...state };
  const diffSettings = DIFFICULTY_SETTINGS[state.difficulty as keyof typeof DIFFICULTY_SETTINGS] || DIFFICULTY_SETTINGS.NORMAL;
  
  const cycleMultipliers: { [key in MarketCyclePhase]: number } = {
    'EXPANSION': 1.005,  // +0.5% per month in expansion
    'PEAK': 1.002,       // +0.2% at peak
    'CONTRACTION': 0.997, // -0.3% in contraction
    'TROUGH': 0.999      // -0.1% at trough
  };
  
  const baseMult = cycleMultipliers[state.marketCycle.phase] || 1;
  
  // Recession impact is mild
  const recessionMult = state.economy?.recession ? 0.998 : 1.0;
  
  newState.assets = state.assets.map(asset => {
    const newAsset = { ...asset };
    
    // Base growth/decline from market cycle
    let priceChange = (baseMult * recessionMult - 1);
    
    // Volatility effect - SIGNIFICANTLY reduced
    // Max swing is now ±2% for high volatility assets, ±0.5% for low volatility
    const volatilityMult = (diffSettings.volatilityMultiplier || 1) * 0.1; // Reduce by 90%
    const volatilityEffect = (Math.random() - 0.5) * 2 * asset.volatility * volatilityMult;
    priceChange += volatilityEffect;
    
    // Sector performance adjustment
    const sectorMult = state.economy?.sectorPerformance?.[asset.industry || 'diversified'] || 1;
    priceChange *= sectorMult;
    
    // Real estate is very stable - even further reduced volatility
    if (asset.type === 'REAL_ESTATE') {
      priceChange *= 0.3;
      // Real estate tends to appreciate over time (0.3% monthly = ~3.7% annually)
      priceChange += 0.003;
    }
    
    // Businesses are more stable than stocks
    if (asset.type === 'BUSINESS') {
      priceChange *= 0.5;
      // Businesses should generate value (0.2% monthly growth)
      priceChange += 0.002;
    }
    
    // Clamp price change to reasonable bounds (max ±5% per month)
    priceChange = Math.max(-0.05, Math.min(0.05, priceChange));
    
    // Minimum value is 50% of cost basis, prevents assets from going to near-zero
    newAsset.value = Math.max(Math.round(asset.costBasis * 0.5), Math.round(asset.value * (1 + priceChange)));
    newAsset.priceHistory = [...asset.priceHistory, { month: state.month, value: newAsset.value }].slice(-24);
    
    // Update cash flow based on current value
    if (asset.baseYield) {
      newAsset.cashFlow = (newAsset.value * asset.baseYield) / 12;
    }
    
    return newAsset;
  });
  
  // Depreciate vehicles (0.5% per month = ~6% per year)
  if (newState.vehicles) {
    newState.vehicles = newState.vehicles.map(v => ({
      ...v,
      value: Math.max(500, Math.round(v.value * 0.995)),
      age: v.age + (1/12)
    }));
  }
  
  return newState;
};

// ============================================
// EDUCATION PROGRESS UPDATE
// ============================================
export const updateEducation = (state: GameState): GameState => {
  if (!state.education?.currentlyEnrolled) return state;
  
  // Make sure currentlyEnrolled has valid data
  if (!state.education.currentlyEnrolled.educationId) {
    return {
      ...state,
      education: {
        ...state.education,
        currentlyEnrolled: null as any // Force clear invalid enrollment
      }
    };
  }
  
  const newState = { ...state };
  const enrollment = { ...state.education.currentlyEnrolled };
  enrollment.monthsRemaining--;
  
  if (enrollment.monthsRemaining <= 0) {
    const edu = EDUCATION_OPTIONS.find(e => e.id === enrollment.educationId);
    const careerPath = state.career?.path || 'TECH';
    const isRelevant = edu?.relevantCareers.includes(careerPath);
    
    // Education level hierarchy - only upgrade, never downgrade
    const levelOrder = ['HIGH_SCHOOL', 'CERTIFICATE', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'MBA', 'PHD', 'LAW', 'MEDICAL'];
    const currentLevelIdx = levelOrder.indexOf(state.education.level);
    const newLevelIdx = edu ? levelOrder.indexOf(edu.level) : -1;
    const newLevel = newLevelIdx > currentLevelIdx ? edu!.level : state.education.level;
    
    // IMPORTANT: Set currentlyEnrolled to null explicitly to clear enrollment
    newState.education = {
      level: newLevel,
      degrees: [...state.education.degrees, enrollment.educationId],
      currentlyEnrolled: null as any // Explicitly null, not undefined
    };
    
    newState.events = [{
      id: Date.now().toString(),
      month: state.month,
      title: '🎓 Degree Completed!',
      description: isRelevant 
        ? `You earned your ${edu?.name}! Salary boost applied.`
        : `You earned your ${edu?.name}. Unfortunately, it won't help your ${CAREER_PATHS[careerPath]?.name} career.`,
      type: isRelevant ? 'ACHIEVEMENT' : 'NEWS'
    }, ...state.events];
  } else {
    newState.education = { ...state.education, currentlyEnrolled: enrollment };
  }
  
  return newState;
};

// ============================================
// CHILDREN UPDATE
// ============================================
export const updateChildren = (state: GameState): GameState => {
  if (!state.family?.children || state.family.children.length === 0) return state;
  
  const newState = { ...state };
  newState.family = { ...state.family };
  
  newState.family.children = state.family.children.map(child => {
    const ageInMonths = state.month - child.birthMonth;
    const ageInYears = Math.floor(ageInMonths / 12);
    
    return {
      ...child,
      age: ageInYears,
      inSchool: ageInYears >= 5 && ageInYears < 18,
      inCollege: ageInYears >= 18 && ageInYears < 22
    };
  });
  
  // Check if any child just turned 18 (add fulfillment)
  for (const child of newState.family.children) {
    const ageInMonths = state.month - child.birthMonth;
    if (ageInMonths === 216) { // Exactly 18 years
      newState.events = [{
        id: Date.now().toString(),
        month: state.month,
        title: '🎂 Child Turns 18!',
        description: `${child.name} is now an adult! Time flies.`,
        type: 'MILESTONE'
      }, ...newState.events];
      newState.stats = { ...newState.stats, fulfillment: Math.min(100, newState.stats.fulfillment + 20) };
    }
  }
  
  return newState;
};

// ============================================
// PROMOTION CHECK
// ============================================
const applyCareerSalaryGrowth = (state: GameState): GameState => {
  if (!state.career) return state;
  const negotiationBonus = getNegotiationRaiseBonus(state);
  const perkGrowthBonus = getCharacterPerkEffects(state).salaryGrowthBonus ?? 0;
  const careerLevel = state.career.level ?? 0;
  const experienceBoost = Math.min(0.002, careerLevel * 0.0004);
  const networkingBoost = (state.stats?.networking ?? 0) >= 50 ? 0.0005 : 0;
  const growthRate = 0.0015 + experienceBoost + networkingBoost + negotiationBonus + perkGrowthBonus;

  const newSalary = Math.round(state.career.salary * (1 + growthRate));
  const newPlayerSalary = state.playerJob?.salary
    ? Math.round(state.playerJob.salary * (1 + growthRate))
    : state.playerJob?.salary;

  return {
    ...state,
    career: { ...state.career, salary: newSalary },
    playerJob: state.playerJob ? { ...state.playerJob, salary: newPlayerSalary ?? state.playerJob.salary } : state.playerJob
  };
};

export const checkPromotion = (state: GameState): { promoted: boolean; newState: GameState } => {
  if (!state.career) return { promoted: false, newState: state };
  
  const careerInfo = CAREER_PATHS[state.career.path];
  if (!careerInfo) return { promoted: false, newState: state };
  
  const currentLevel = state.career.level;
  if (currentLevel >= careerInfo.levels.length) return { promoted: false, newState: state };
  
  const nextLevel = careerInfo.levels[currentLevel];
  if (!nextLevel) return { promoted: false, newState: state };
  
  if (state.career.experience < nextLevel.experienceRequired) {
    return { promoted: false, newState: state };
  }
  
  if (nextLevel.educationRequired && nextLevel.educationCategory) {
    const hasRelevantEducation = state.education.degrees.some(degId => {
      const edu = EDUCATION_OPTIONS.find(e => e.id === degId);
      if (!edu) return false;
      const levelOrder = ['HIGH_SCHOOL', 'CERTIFICATE', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'MBA', 'PHD', 'LAW', 'MEDICAL'];
      const requiredIdx = levelOrder.indexOf(nextLevel.educationRequired!);
      const hasIdx = levelOrder.indexOf(edu.level);
      return hasIdx >= requiredIdx && edu.category === nextLevel.educationCategory;
    });
    
    if (!hasRelevantEducation) {
      return { promoted: false, newState: state };
    }
  }
  
  let promoChance = 0.15;
  promoChance += (state.stats.happiness - 50) / 500;
  promoChance += (state.stats.networking) / 500;
  promoChance -= (state.stats.stress - 30) / 500;
  promoChance += getNegotiationRaiseBonus(state);
  
  // Recession reduces promotion chances
  if (state.economy?.recession) {
    promoChance *= 0.5;
  }
  
  if (Math.random() > promoChance) {
    return { promoted: false, newState: state };
  }
  
  const newState = { ...state };
  const diffSettings = DIFFICULTY_SETTINGS[state.difficulty as keyof typeof DIFFICULTY_SETTINGS] || DIFFICULTY_SETTINGS.NORMAL;
  
  newState.career = {
    ...state.career,
    level: currentLevel + 1,
    title: nextLevel.title,
    salary: Math.round(nextLevel.baseSalary * diffSettings.salaryMultiplier)
  };
  
  newState.playerJob = {
    ...state.playerJob,
    level: currentLevel + 1,
    title: nextLevel.title,
    salary: Math.round(nextLevel.baseSalary * diffSettings.salaryMultiplier)
  };
  
  return { promoted: true, newState };
};

// ============================================
// LIFE EVENT GENERATION
// ============================================

const formatUSD = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const tailorAssetOwnerEvent = (base: Scenario, state: GameState): Scenario => {
  const businesses = (state.assets || []).filter(a => a.type === AssetType.BUSINESS && (a.quantity || 1) > 0);
  const properties = (state.assets || []).filter(a => a.type === AssetType.REAL_ESTATE && (a.quantity || 1) > 0);

  switch (base.id) {
    case 'owned_business_strike': {
      if (businesses.length === 0) return base;
      const biz = pickRandom(businesses);
      const qty = biz.quantity || 1;
      const monthly = Math.max(0, Math.round((biz.cashFlow || 0) * qty));
      const months = 2 + Math.floor(Math.random() * 2); // 2-3 months

      const negotiateCost = clamp(Math.round(Math.max(2500, monthly * 0.6)), 2500, 30000);
      const tempStaffCost = clamp(Math.round(Math.max(5000, monthly * 1.2)), 5000, 50000);

      return {
        ...base,
        title: `🪧 Strike Threat at ${biz.name}`,
        description: `Workers at ${biz.name} threaten a strike. If operations slow down, your business income could drop for ${months} months.`,
        options: [
          {
            label: `Negotiate (${formatUSD(negotiateCost)})`,
            outcome: {
              cashChange: -negotiateCost,
              message: `You negotiate and agree to concessions. The strike is avoided, but profits dip for a while.`,
              statChanges: { stress: 18, financialIQ: 3 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months,
                incomeMultiplier: 0.85,
                reason: 'Strike disruption',
                recoveryTitle: '✅ Operations Stabilized',
                recoveryMessage: `${biz.name} stabilizes and income returns to normal next month.`
              },
              assetAdjustment: { assetId: biz.id, cashFlowMultiplier: 0.97 }
            }
          },
          {
            label: 'Hold the line (risky)',
            outcome: {
              cashChange: 0,
              message: `The strike happens. Revenue drops hard while you scramble to recover.`,
              statChanges: { stress: 28, happiness: -6 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months,
                incomeMultiplier: 0.55,
                reason: 'Strike shutdown risk',
                recoveryTitle: '✅ Back to Normal',
                recoveryMessage: `${biz.name} reopens fully and income resumes next month.`
              },
              assetAdjustment: { assetId: biz.id, valueMultiplier: 0.95 }
            }
          },
          {
            label: `Use temporary staff (${formatUSD(tempStaffCost)})`,
            outcome: {
              cashChange: -tempStaffCost,
              message: `You hire temporary staff to keep the lights on. It works, but it's expensive.`,
              statChanges: { stress: 22, networking: -3 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months,
                incomeMultiplier: 0.75,
                reason: 'Strike mitigation',
                recoveryTitle: '✅ Staffing Normalized',
                recoveryMessage: `${biz.name} staffing stabilizes and income resumes next month.`
              }
            }
          }
        ]
      };
    }

    case 'owned_business_fraud': {
      if (businesses.length === 0) return base;
      const biz = pickRandom(businesses);
      const qty = biz.quantity || 1;
      const monthly = Math.max(0, Math.round((biz.cashFlow || 0) * qty));
      const fraudLoss = clamp(Math.round(Math.max(3000, monthly * (2 + Math.random() * 2))), 3000, 75000);
      const auditCost = clamp(Math.round(Math.max(2000, fraudLoss * 0.25)), 2000, 20000);

      return {
        ...base,
        title: `🕵️ Fraud at ${biz.name}`,
        description: `You discover fraudulent transactions tied to ${biz.name}. The estimated loss is around ${formatUSD(fraudLoss)}.`,
        options: [
          {
            label: `Forensic audit + report (${formatUSD(auditCost)})`,
            outcome: {
              cashChange: -(fraudLoss + auditCost),
              message: `You investigate and report the fraud. Painful now, but you stop the bleeding.`,
              statChanges: { stress: 20, financialIQ: 6 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months: 2,
                incomeMultiplier: 0.85,
                reason: 'Fraud recovery',
                recoveryTitle: '✅ Fraud Contained',
                recoveryMessage: `${biz.name} stabilizes and income returns to normal next month.`
              },
              assetAdjustment: { assetId: biz.id, valueMultiplier: 0.9 }
            }
          },
          {
            label: 'Settle quietly (avoid headlines)',
            outcome: {
              cashChange: -Math.round(fraudLoss * 1.25),
              message: `You settle quietly to avoid reputational damage. It costs more, but the drama fades.`,
              statChanges: { stress: 16, happiness: -4 },
              assetAdjustment: { assetId: biz.id, valueMultiplier: 0.93 }
            }
          },
          {
            label: 'Ignore it (bad idea)',
            outcome: {
              cashChange: -Math.round(fraudLoss * 0.4),
              message: `You ignore warning signs. More money leaks out and uncertainty grows.`,
              statChanges: { stress: 18, financialIQ: -5 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months: 3,
                incomeMultiplier: 0.75,
                reason: 'Ongoing fraud risk',
                recoveryTitle: '✅ Leak Plugged',
                recoveryMessage: `${biz.name} recovers and income resumes next month.`
              },
              assetAdjustment: { assetId: biz.id, valueMultiplier: 0.88 }
            }
          }
        ]
      };
    }

    case 'owned_business_lawsuit': {
      if (businesses.length === 0) return base;
      const biz = pickRandom(businesses);
      const legalFees = clamp(Math.round(Math.max(8000, biz.value * 0.08)), 8000, 120000);
      const quickSettlement = clamp(Math.round(Math.max(15000, biz.value * 0.12)), 15000, 200000);

      return {
        ...base,
        title: `⚖️ Lawsuit Against ${biz.name}`,
        description: `A serious legal claim is filed involving ${biz.name}. Even if you win, legal fees can hurt. Estimated legal fees: ${formatUSD(legalFees)}.`,
        options: [
          {
            label: `Fight it (${formatUSD(legalFees)})`,
            outcome: {
              cashChange: -legalFees,
              message: `You fight the lawsuit. Legal fees are brutal, and management distraction reduces profits temporarily.`,
              statChanges: { stress: 28, financialIQ: 3 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months: 3,
                incomeMultiplier: 0.8,
                reason: 'Lawsuit distraction',
                recoveryTitle: '✅ Case Resolved',
                recoveryMessage: `${biz.name} moves past the legal stress and income normalizes next month.`
              },
              assetAdjustment: { assetId: biz.id, valueMultiplier: 0.92 }
            }
          },
          {
            label: `Settle quickly (${formatUSD(quickSettlement)})`,
            outcome: {
              cashChange: -quickSettlement,
              message: `You settle quickly to stop the bleeding. You avoid a long battle, but it costs you.`,
              statChanges: { stress: 18, happiness: -3 },
              assetAdjustment: { assetId: biz.id, valueMultiplier: 0.95 }
            }
          },
          {
            label: 'Try mediation first',
            outcome: {
              cashChange: -Math.round(legalFees * 0.5),
              message: `You attempt mediation. It reduces costs, but the business still takes a temporary hit.`,
              statChanges: { stress: 18, networking: 4 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months: 2,
                incomeMultiplier: 0.87,
                reason: 'Mediation process',
                recoveryTitle: '✅ Mediation Completed',
                recoveryMessage: `${biz.name} stabilizes and income resumes next month.`
              }
            }
          }
        ]
      };
    }

    case 'owned_business_regulatory_fine': {
      if (businesses.length === 0) return base;
      const biz = pickRandom(businesses);
      const fine = clamp(Math.round(Math.max(5000, biz.value * 0.05)), 5000, 100000);
      const appealCost = clamp(Math.round(Math.max(2000, fine * 0.2)), 2000, 25000);
      const appealSuccess = Math.random() < 0.45;

      return {
        ...base,
        title: `🏛️ Compliance Fine for ${biz.name}`,
        description: `A regulator flags compliance issues at ${biz.name}. The current proposed fine is ${formatUSD(fine)}.`,
        options: [
          {
            label: `Pay + fix (${formatUSD(fine)})`,
            outcome: {
              cashChange: -fine,
              message: `You pay the fine and fix compliance quickly. Short-term pain, long-term stability.`,
              statChanges: { stress: 16, financialIQ: 5 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months: 1,
                incomeMultiplier: 0.9,
                reason: 'Compliance remediation',
                recoveryTitle: '✅ Compliance Restored',
                recoveryMessage: `${biz.name} completes remediation and income normalizes next month.`
              }
            }
          },
          {
            label: `Appeal (${formatUSD(appealCost)})`,
            outcome: {
              cashChange: -(appealCost + (appealSuccess ? Math.round(fine * 0.25) : Math.round(fine * 1.0))),
              message: appealSuccess
                ? `Your appeal partly succeeds. You still pay a smaller penalty, but you spent time and fees.`
                : `Your appeal fails. You pay the fine and fees anyway.`,
              statChanges: { stress: 20, financialIQ: appealSuccess ? 2 : -2 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months: 2,
                incomeMultiplier: 0.9,
                reason: 'Appeal distraction',
                recoveryTitle: '✅ Appeal Finished',
                recoveryMessage: `${biz.name} moves past the appeal and income normalizes next month.`
              }
            }
          },
          {
            label: 'Delay fixes (risky)',
            outcome: {
              cashChange: -Math.round(fine * 0.6),
              message: `You delay remediation. Penalties increase and operations slow down.`,
              statChanges: { stress: 26, financialIQ: -5 },
              assetIncomeDisruption: {
                assetId: biz.id,
                months: 3,
                incomeMultiplier: 0.75,
                reason: 'Compliance penalties',
                recoveryTitle: '✅ Remediation Complete',
                recoveryMessage: `${biz.name} finishes remediation and income normalizes next month.`
              },
              assetAdjustment: { assetId: biz.id, valueMultiplier: 0.95 }
            }
          }
        ]
      };
    }

    case 'rental_tenant_nonpayment': {
      if (properties.length === 0) return base;
      const prop = pickRandom(properties);
      const qty = prop.quantity || 1;
      const monthlyRent = Math.max(0, Math.round((prop.cashFlow || 0) * qty));
      const months = 2 + Math.floor(Math.random() * 3); // 2-4 months
      const evictionCost = clamp(Math.round(Math.max(600, monthlyRent * 0.6)), 600, 6000);
      const cashForKeys = clamp(Math.round(Math.max(500, monthlyRent * 0.5)), 500, 4000);

      return {
        ...base,
        title: `🏠 Tenant Stops Paying (${prop.name})`,
        description: `A tenant in ${prop.name} stops paying. If unresolved, you could lose rental income for about ${months} months.`,
        options: [
          {
            label: `Start eviction (${formatUSD(evictionCost)})`,
            outcome: {
              cashChange: -evictionCost,
              message: `You start the eviction process. It takes time, and rent goes to $0 temporarily.`,
              statChanges: { stress: 22 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months,
                incomeMultiplier: 0,
                reason: 'Tenant nonpayment / eviction',
                recoveryTitle: '✅ New Tenant Found',
                recoveryMessage: `A new tenant moves into ${prop.name}. Rental income resumes next month.`
              }
            }
          },
          {
            label: 'Offer a payment plan',
            outcome: {
              cashChange: -Math.round(monthlyRent * 0.15),
              message: `You offer a payment plan. You collect partial rent while keeping the tenant in place.`,
              statChanges: { stress: 12, networking: 3 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months,
                incomeMultiplier: 0.6,
                reason: 'Payment plan (partial rent)',
                recoveryTitle: '✅ Rent Back on Track',
                recoveryMessage: `Payments stabilize at ${prop.name}. Rental income normalizes next month.`
              },
              assetAdjustment: { assetId: prop.id, cashFlowMultiplier: 0.98 }
            }
          },
          {
            label: `Cash-for-keys (${formatUSD(cashForKeys)})`,
            outcome: {
              cashChange: -cashForKeys,
              message: `You pay the tenant to leave quickly. It's frustrating, but you can re-let sooner.`,
              statChanges: { stress: 16, happiness: -2 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months: Math.max(1, Math.floor(months * 0.6)),
                incomeMultiplier: 0,
                reason: 'Vacancy while re-letting',
                recoveryTitle: '✅ Tenant Replaced',
                recoveryMessage: `You re-let ${prop.name}. Rental income resumes next month.`
              }
            }
          }
        ]
      };
    }

    case 'rental_major_maintenance': {
      if (properties.length === 0) return base;
      const prop = pickRandom(properties);
      const qty = prop.quantity || 1;
      const repairCost = clamp(Math.round(Math.max(1500, prop.value * 0.03)), 1500, 40000);
      const tempFix = Math.round(repairCost * 0.35);

      return {
        ...base,
        title: `🛠️ Major Maintenance (${prop.name})`,
        description: `A major issue hits ${prop.name}. Repairs are estimated at ${formatUSD(repairCost)}. Ignore it and the damage can worsen.`,
        options: [
          {
            label: `Fix properly (${formatUSD(repairCost)})`,
            outcome: {
              cashChange: -repairCost,
              message: `You fix the issue properly. Rental income pauses briefly during repairs, but the property stays solid.`,
              statChanges: { stress: 12, financialIQ: 2 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months: 1,
                incomeMultiplier: 0,
                reason: 'Repairs / downtime',
                recoveryTitle: '✅ Repairs Completed',
                recoveryMessage: `${prop.name} repairs are completed. Rental income resumes next month.`
              },
              assetAdjustment: { assetId: prop.id, valueMultiplier: 1.01 }
            }
          },
          {
            label: `Temporary fix (${formatUSD(tempFix)})`,
            outcome: {
              cashChange: -tempFix,
              message: `You patch it for now. Tenants complain and you take a small income hit for a while.`,
              statChanges: { stress: 18 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months: 3,
                incomeMultiplier: 0.85,
                reason: 'Temporary repair impact',
                recoveryTitle: '✅ Issue Stabilized',
                recoveryMessage: `${prop.name} stabilizes and rental income normalizes next month.`
              },
              assetAdjustment: { assetId: prop.id, valueMultiplier: 0.99 }
            }
          },
          {
            label: 'Delay repairs (risky)',
            outcome: {
              cashChange: 0,
              message: `You delay repairs. The issue worsens, rent drops, and property value takes a hit.`,
              statChanges: { stress: 28, happiness: -4 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months: 4,
                incomeMultiplier: 0.7,
                reason: 'Deferred maintenance',
                recoveryTitle: '✅ Repairs Finally Done',
                recoveryMessage: `${prop.name} is repaired and rental income normalizes next month.`
              },
              assetAdjustment: { assetId: prop.id, valueMultiplier: 0.9, cashFlowMultiplier: 0.9 }
            }
          }
        ]
      };
    }

    case 'rental_tenant_dispute': {
      if (properties.length === 0) return base;
      const prop = pickRandom(properties);
      const monthlyRent = Math.max(0, Math.round(prop.cashFlow || 0));
      const disputeCost = clamp(Math.round(Math.max(800, monthlyRent * 0.8)), 800, 8000);
      const settlement = clamp(Math.round(Math.max(1200, monthlyRent * 1.5)), 1200, 12000);

      return {
        ...base,
        title: `🧾 Tenant Dispute (${prop.name})`,
        description: `A tenant at ${prop.name} disputes charges and threatens action. If it drags out, rent may be withheld temporarily.`,
        options: [
          {
            label: `Mediation (${formatUSD(disputeCost)})`,
            outcome: {
              cashChange: -disputeCost,
              message: `You mediate and compromise. It costs you, but resolves faster with less stress.`,
              statChanges: { stress: 12, networking: 3 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months: 1,
                incomeMultiplier: 0.85,
                reason: 'Dispute resolution',
                recoveryTitle: '✅ Dispute Resolved',
                recoveryMessage: `The dispute at ${prop.name} is resolved. Rental income normalizes next month.`
              }
            }
          },
          {
            label: `Lawyer up (${formatUSD(Math.round(disputeCost * 1.5))})`,
            outcome: {
              cashChange: -Math.round(disputeCost * 1.5),
              message: `You hire a lawyer. The dispute drags out, and rent gets partially withheld.`,
              statChanges: { stress: 22 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months: 2,
                incomeMultiplier: 0.6,
                reason: 'Legal dispute',
                recoveryTitle: '✅ Legal Matter Closed',
                recoveryMessage: `Legal pressure eases at ${prop.name}. Rental income normalizes next month.`
              }
            }
          },
          {
            label: `Pay to end it (${formatUSD(settlement)})`,
            outcome: {
              cashChange: -settlement,
              message: `You pay to end it quickly. Not ideal, but you protect your time and reduce stress.`,
              statChanges: { stress: 10, happiness: -2 }
            }
          }
        ]
      };
    }

    case 'rental_vacancy': {
      if (properties.length === 0) return base;
      const prop = pickRandom(properties);
      const months = 1 + Math.floor(Math.random() * 3); // 1-3 months
      const renovationCost = clamp(Math.round(Math.max(2000, prop.value * 0.02)), 2000, 35000);

      return {
        ...base,
        title: `🕳️ Vacancy at ${prop.name}`,
        description: `${prop.name} goes vacant unexpectedly. You could lose rental income for about ${months} months while you re-let.`,
        options: [
          {
            label: 'Lower rent to fill faster',
            outcome: {
              cashChange: 0,
              message: `You lower rent to attract tenants quickly. Income drops once re-let, but vacancy ends sooner.`,
              statChanges: { stress: 12 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months: Math.max(1, months - 1),
                incomeMultiplier: 0,
                reason: 'Vacancy',
                recoveryTitle: '✅ Tenant Signed',
                recoveryMessage: `A tenant signs for ${prop.name}. Rental income resumes next month.`
              },
              assetAdjustment: { assetId: prop.id, cashFlowMultiplier: 0.95 }
            }
          },
          {
            label: `Renovate (${formatUSD(renovationCost)})`,
            outcome: {
              cashChange: -renovationCost,
              message: `You renovate to increase demand. Vacancy lasts a bit longer, but future rent improves.`,
              statChanges: { stress: 18, financialIQ: 3 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months: months + 1,
                incomeMultiplier: 0,
                reason: 'Renovation vacancy',
                recoveryTitle: '✅ Renovation Complete',
                recoveryMessage: `${prop.name} renovation completes. Rental income resumes next month.`
              },
              assetAdjustment: { assetId: prop.id, cashFlowMultiplier: 1.07, valueMultiplier: 1.02 }
            }
          },
          {
            label: 'Wait it out',
            outcome: {
              cashChange: 0,
              message: `You wait. Vacancy costs you rent each month until a tenant is found.`,
              statChanges: { stress: 16 },
              assetIncomeDisruption: {
                assetId: prop.id,
                months,
                incomeMultiplier: 0,
                reason: 'Vacancy',
                recoveryTitle: '✅ Tenant Found',
                recoveryMessage: `A tenant moves into ${prop.name}. Rental income resumes next month.`
              }
            }
          }
        ]
      };
    }

    default:
      return base;
  }
};

export const generateLifeEvent = (state: GameState): Scenario | null => {
  const diffSettings = DIFFICULTY_SETTINGS[state.difficulty as keyof typeof DIFFICULTY_SETTINGS] || DIFFICULTY_SETTINGS.NORMAL;
  const eventFreq = diffSettings.eventFrequency || 1.0;

  // Category-level cooldowns help prevent "similar" events from firing back-to-back.
  // (Example: multiple VEHICLE issues in quick succession.)
  const CATEGORY_COOLDOWN_MONTHS: Record<string, number> = {
    VEHICLE: 6
  };
  
  // GUARANTEED check for annual taxes (April = month 4, 16, 28, etc.)
  // Only trigger AFTER 12 months of play (first April after year 1)
  const monthOfYear = ((state.month - 1) % 12) + 1;
  if (monthOfYear === 4 && state.month >= 12 && !state.eventTracker?.taxesPaidThisYear) {
    const taxEvent = ALL_LIFE_EVENTS.find(e => e.id === 'annual_taxes');
    if (taxEvent) {
      const taxes = calculateAnnualTaxes(state);
      if (taxes > 0) {
        const totalWithPenalty = Math.round(taxes * 1.1);
        const monthlyPayment = Math.round(totalWithPenalty / 10);
        return {
          ...taxEvent,
          description: `April 15th - time to file your taxes. Based on your income, you owe ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(taxes)} to the IRS.`,
          options: [
            { label: 'Pay taxes in full', outcome: { cashChange: -taxes, message: 'Taxes paid. Good citizen!', statChanges: { stress: -5 } } },
            { 
              label: `Set up payment plan (+10% penalty, ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(monthlyPayment)}/mo)`, 
              outcome: { 
                cashChange: 0, 
                message: `Payment plan: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(monthlyPayment)}/mo for 10 months.`, 
                statChanges: { stress: 5 },
                addLiability: {
                  name: 'IRS Payment Plan',
                  balance: totalWithPenalty,
                  originalBalance: totalWithPenalty,
                  interestRate: 0,
                  monthlyPayment: monthlyPayment,
                  type: 'PERSONAL_LOAN'
                }
              } 
            }
          ]
        };
      }
    }
  }

  const queuedEvents = (state.eventQueue || []).filter(entry => entry.minMonth <= state.month);
  if (queuedEvents.length > 0) {
    const queuedPick = queuedEvents[Math.floor(Math.random() * queuedEvents.length)];
    const queuedEvent = ALL_LIFE_EVENTS.find(e => e.id === queuedPick.id);
    if (queuedEvent) return queuedEvent;
  }
  
  // Track months since last event for "drought breaker"
  const monthsSinceLastEvent = state.month - (state.eventTracker?.lastEventMonth || 0);
  
  // DROUGHT BREAKER: Force an event if it's been 4+ months without one
  const droughtForce = monthsSinceLastEvent >= 4;
  
  // Base 35% chance per month (increased from 15% for more engagement)
  // If drought, 100% chance
  if (!droughtForce && Math.random() > 0.35 * eventFreq) {
    return null;
  }

  // Filter eligible events
  const eligible = ALL_LIFE_EVENTS.filter(event => {
    // Skip annual_taxes - it's handled specially above with calculated amounts
    if (event.id === 'annual_taxes') return false;

    if (event.characterIds && (!state.character || !event.characterIds.includes(state.character.id))) {
      return false;
    }
    
    const cond = event.conditions;
    
    // Special event-specific checks FIRST (before general conditions)
    // Skip wedding planning if not engaged
    if (event.id === 'wedding_planning' && !state.family?.isEngaged) return false;
    
    // Skip proposal if already married or already engaged OR not in a relationship
    if (event.id === 'proposal' && (state.family?.spouse || state.family?.isEngaged || !state.family?.inRelationship)) return false;
    
    // NUCLEAR FAMILY: Skip new relationship events if already in a relationship, engaged, or married
    // This ensures loyalty to partner throughout the game
    if (event.id === 'meet_partner' && (state.family?.spouse || state.family?.isEngaged || state.family?.inRelationship)) return false;

    // Skip job loss shock events if the player is already unemployed.
    if (event.id === 'job_loss' && (state.jobLossMonthsRemaining || 0) > 0) return false;

    // Owned asset risk events should only appear if you own the matching asset type.
    if (event.id.startsWith('owned_business_')) {
      const hasBusiness = (state.assets || []).some(a => a.type === AssetType.BUSINESS && (a.quantity || 1) > 0);
      if (!hasBusiness) return false;
    }

    if (event.id.startsWith('rental_')) {
      const hasRealEstate = (state.assets || []).some(a => a.type === AssetType.REAL_ESTATE && (a.quantity || 1) > 0);
      if (!hasRealEstate) return false;
    }
    
    // Skip divorce event if handled elsewhere or add it here for married only
    if (event.id === 'divorce' && !state.family?.spouse) return false;
    
    // Skip baby event if recently had one or not married
    if (event.id === 'expecting_child') {
      if (!state.family?.spouse) return false;
      const recentBirth = state.family?.children?.some(c => state.month - c.birthMonth < 24);
      if (recentBirth) return false;
    }
    
    // Skip child events if no children
    if ((event.id === 'child_sick' || event.id === 'child_school' || event.id === 'child_activities' || event.id === 'child_college') && 
        (!state.family?.children || state.family.children.length === 0)) return false;
    
    // General condition checks
    if (!cond) return true;
    
    if (cond.minMonth && state.month < cond.minMonth) return false;
    if (cond.maxMonth && state.month > cond.maxMonth) return false;
    if (cond.minCash && state.cash < cond.minCash) return false;
    if (cond.minNetWorth && calculateNetWorth(state) < cond.minNetWorth) return false;
    if (cond.careers && state.career && !cond.careers.includes(state.career.path)) return false;
    if (cond.aiDisruptionLevel && (state.aiDisruption?.disruptionLevel || 0) < cond.aiDisruptionLevel) return false;
    
    // For requiresMarriage, skip if set to true for wedding_planning (handled above)
    if (cond.requiresMarriage && event.id !== 'wedding_planning' && !state.family?.spouse) return false;
    
    if (cond.requiresChildren && (!state.family?.children || state.family.children.length === 0)) return false;
    if (cond.requiresVehicle && (!state.vehicles || state.vehicles.length === 0)) return false;
    
    // Check max occurrences
    if (cond.maxOccurrences) {
      const occurrences = state.eventTracker?.occurrences?.[event.id] || 0;
      if (occurrences >= cond.maxOccurrences) return false;
    }
    
    // Category cooldown (prevents repetitive "same type" popups)
    const catCooldown = CATEGORY_COOLDOWN_MONTHS[event.category];
    if (catCooldown) {
      const catKey = `__cat_${event.category}`;
      const lastCat = state.eventTracker?.lastOccurrence?.[catKey];
      if (lastCat && (state.month - lastCat) < catCooldown) return false;
    }

    // Cooldown - prevent repeats of the exact same event.
    // NOTE: previously recurring events had effectively *no* cooldown, which could feel monotonous.
    const lastOccurrence = state.eventTracker?.lastOccurrence?.[event.id];
    const baseCooldownMonths = (event.id.startsWith('owned_business_') || event.id.startsWith('rental_')) ? 6 : 12;
    const recurringCooldownMonths = event.category === 'VEHICLE' ? 6 : 3;
    const cooldownMonths = typeof event.cooldownMonths === 'number'
      ? event.cooldownMonths
      : event.isRecurring ? recurringCooldownMonths : baseCooldownMonths;
    if (lastOccurrence && (state.month - lastOccurrence) < cooldownMonths) return false;
    
    return true;
  });
  
  if (eligible.length === 0) return null;
  
  // Weight-based selection (dynamic weights based on economy + player state)
  const health = clampStat(state.stats?.health ?? 100);
  const stress = clampStat(state.stats?.stress ?? 0);
  const unemployment = state.economy?.unemploymentRate ?? 0.04;
  const isRecession = !!state.economy?.recession;

  const weighted = eligible.map((event) => {
    let w = event.weight || 10;
    const recentIds = state.eventTracker?.recentEventIds || [];
    if (recentIds.includes(event.id)) {
      w *= 0.2;
    }

    // Economic shocks are more likely during recessions / high unemployment.
    if (event.category === 'ECONOMIC') {
      const unemploymentBoost = Math.max(0, unemployment - 0.05) * 5; // 0%..+0.25 at 10% unemployment
      const recessionBoost = isRecession ? 0.5 : 0;
      w *= (1 + unemploymentBoost + recessionBoost);
    }

    // Health emergencies become more likely if you run your stats into the ground.
    if (event.category === 'MEDICAL') {
      let mult = 1;
      if (health < 60) mult += (60 - health) / 100; // up to +0.6
      if (stress > 70) mult += (stress - 70) / 100; // up to +0.3
      w *= mult;
    }

    // Business/Property risk increases as you own more of those assets.
    const businessCount = (state.assets || []).filter(a => a.type === AssetType.BUSINESS && (a.quantity || 1) > 0).length;
    const propertyCount = (state.assets || []).filter(a => a.type === AssetType.REAL_ESTATE && (a.quantity || 1) > 0).length;

    if (event.id.startsWith('owned_business_') && businessCount > 0) {
      // +25% weight per business, capped
      w *= (1 + Math.min(0.9, businessCount * 0.25));
    }

    if (event.id.startsWith('rental_') && propertyCount > 0) {
      // +20% weight per property, capped
      w *= (1 + Math.min(1.0, propertyCount * 0.20));
    }

    // Slightly more windfalls when cash is dangerously low (teaches "buffer" moments).
    if (event.category === 'WINDFALL' && (state.cash || 0) < 1000) {
      w *= 1.25;
    }

    return { event, weight: Math.max(0.1, w) };
  });

  const totalWeight = weighted.reduce((sum, x) => sum + x.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of weighted) {
    random -= item.weight;
    if (random <= 0) {
      return tailorAssetOwnerEvent(item.event, state);
    }
  }
  
  return tailorAssetOwnerEvent(eligible[Math.floor(Math.random() * eligible.length)], state);
};

// ============================================
// NEGOTIATION RESULT GENERATOR
// ============================================
const generateNegotiationResult = (negotiateType: string, state: GameState): Scenario => {
  // Base success chance modified by networking skill
  const perkBonus = getCharacterPerkEffects(state).negotiationBonus ?? 0;
  const networkingBonus = (state.stats.networking || 50) / 100 + perkBonus;
  const baseSuccessChance = 0.5 + (clamp(networkingBonus, 0, 1) * 0.3); // 50-80% base chance
  const isSuccessful = Math.random() < baseSuccessChance;
  
  const negotiations: { [key: string]: { success: Scenario; failure: Scenario } } = {
    'salary_raise_15': {
      success: {
        id: 'negotiation_result',
        title: '🎉 Negotiation Successful!',
        description: 'Your manager approved the 15% raise! Your salary has increased.',
        category: 'CAREER',
        weight: 100,
        options: [
          { label: 'Celebrate!', outcome: { cashChange: 0, message: 'Got the raise! Hard work pays off.', statChanges: { happiness: 20, stress: -10, fulfillment: 15 } } }
        ]
      },
      failure: {
        id: 'negotiation_result',
        title: '😔 Negotiation Failed',
        description: 'Management declined the 15% raise citing budget constraints. They offered 3% instead.',
        category: 'CAREER',
        weight: 100,
        options: [
          { label: 'Accept 3%', outcome: { cashChange: 0, message: 'Better than nothing.', statChanges: { happiness: -5, stress: 5 } } },
          { label: 'Start job hunting', outcome: { cashChange: 0, message: 'Looking for better opportunities.', statChanges: { stress: 15, networking: 10 } } }
        ]
      }
    },
    'salary_raise_8': {
      success: {
        id: 'negotiation_result',
        title: '🎉 Raise Approved!',
        description: 'Your 8% raise request was approved! Effective next month.',
        category: 'CAREER',
        weight: 100,
        options: [
          { label: 'Great news!', outcome: { cashChange: 0, message: 'Modest raise secured.', statChanges: { happiness: 10, stress: -5, fulfillment: 5 } } }
        ]
      },
      failure: {
        id: 'negotiation_result',
        title: '😔 Raise Denied',
        description: 'They said the budget only allows for 2% this year.',
        category: 'CAREER',
        weight: 100,
        options: [
          { label: 'Accept 2%', outcome: { cashChange: 0, message: 'Small increase is something.', statChanges: { happiness: -3 } } }
        ]
      }
    },
    'landlord_repair': {
      success: {
        id: 'negotiation_result',
        title: '✅ Landlord Agreed!',
        description: 'After negotiation, the landlord agreed to fix the heating within 2 weeks.',
        category: 'HOUSING',
        weight: 100,
        options: [
          { label: 'Finally!', outcome: { cashChange: 0, message: 'Repair scheduled. Victory!', statChanges: { happiness: 10, stress: -15 } } }
        ]
      },
      failure: {
        id: 'negotiation_result',
        title: '❌ Landlord Refused',
        description: 'Landlord insists it\'s not their responsibility. You\'ll need to escalate or fix it yourself.',
        category: 'HOUSING',
        weight: 100,
        options: [
          { label: 'Fix it yourself ($1,500)', outcome: { cashChange: -1500, message: 'Fixed it. Will deduct from rent.', statChanges: { stress: 10 } } },
          { label: 'Escalate to authorities', outcome: { cashChange: -200, message: 'Filed complaint. Long process ahead.', statChanges: { stress: 20 } } }
        ]
      }
    },
    'supplier_negotiation': {
      success: {
        id: 'negotiation_result',
        title: '🤝 Deal Reached!',
        description: 'You negotiated the price increase down to 10% instead of 25%!',
        category: 'BUSINESS',
        weight: 100,
        options: [
          { label: 'Great negotiation!', outcome: { cashChange: 0, message: 'Saved significant margin.', statChanges: { happiness: 10, stress: -10, financialIQ: 5 } } }
        ]
      },
      failure: {
        id: 'negotiation_result',
        title: '❌ No Deal',
        description: 'Supplier won\'t budge. Take it or leave it.',
        category: 'BUSINESS',
        weight: 100,
        options: [
          { label: 'Accept 25% increase', outcome: { cashChange: 0, message: 'Margins hurt badly.', statChanges: { stress: 15, happiness: -10 } } },
          { label: 'Find new supplier', outcome: { cashChange: -2000, message: 'Switching suppliers. Transition costs.', statChanges: { stress: 20 } } }
        ]
      }
    },
    'client_retention': {
      success: {
        id: 'negotiation_result',
        title: '🎉 Client Staying!',
        description: 'Your discount offer convinced them to stay. Long-term relationship preserved!',
        category: 'BUSINESS',
        weight: 100,
        options: [
          { label: 'Worth the discount', outcome: { cashChange: -1500, message: 'Client retained at 10% discount.', statChanges: { happiness: 15, stress: -10, networking: 10 } } }
        ]
      },
      failure: {
        id: 'negotiation_result',
        title: '😔 Client Leaving',
        description: 'Despite your efforts, they\'re moving to the competitor. 30% revenue hit incoming.',
        category: 'BUSINESS',
        weight: 100,
        options: [
          { label: 'Time to hustle for new clients', outcome: { cashChange: 0, message: 'Lost major client. Rebuilding.', statChanges: { stress: 25, happiness: -15, energy: -10 } } }
        ]
      }
    },
    'wage_negotiation': {
      success: {
        id: 'negotiation_result',
        title: '🤝 Agreement Reached!',
        description: 'Workers accepted a 5% raise instead of 10%. Strike averted!',
        category: 'BUSINESS',
        weight: 100,
        options: [
          { label: 'Crisis averted', outcome: { cashChange: -2500, message: 'Smaller raise accepted. Operations continue.', statChanges: { stress: -15, happiness: 10, fulfillment: 5 } } }
        ]
      },
      failure: {
        id: 'negotiation_result',
        title: '⚠️ Strike Begins!',
        description: 'Workers rejected your offer and are walking out. Production halted.',
        category: 'BUSINESS',
        weight: 100,
        options: [
          { label: 'Meet their demands ($10,000)', outcome: { cashChange: -10000, message: 'Paid full demands. Expensive lesson.', statChanges: { stress: 20, happiness: -10 } } },
          { label: 'Hire replacements ($15,000)', outcome: { cashChange: -15000, message: 'New workers hired. Productivity down.', statChanges: { stress: 30, networking: -15 } } }
        ]
      }
    },
    'insurance_appeal': {
      success: {
        id: 'negotiation_result',
        title: '✅ Appeal Approved!',
        description: 'Insurance reversed their decision. Claim will be paid!',
        category: 'LEGAL',
        weight: 100,
        options: [
          { label: 'Persistence pays off!', outcome: { cashChange: 5000, message: 'Claim paid after appeal!', statChanges: { happiness: 15, stress: -15, financialIQ: 5 } } }
        ]
      },
      failure: {
        id: 'negotiation_result',
        title: '❌ Appeal Denied',
        description: 'Insurance upheld their denial. You\'ll have to pay out of pocket.',
        category: 'LEGAL',
        weight: 100,
        options: [
          { label: 'Pay the $8,000', outcome: { cashChange: -8000, message: 'Paid out of pocket. Frustrating.', statChanges: { stress: 15, happiness: -15 } } },
          { label: 'Hire lawyer to fight ($3,000)', outcome: { cashChange: -3000, message: 'Legal battle begins...', statChanges: { stress: 25 } } }
        ]
      }
    },
    'medical_bill': {
      success: {
        id: 'negotiation_result',
        title: '✅ Bill Reduced!',
        description: 'Hospital agreed to reduce the bill by 40%! Now only $7,200.',
        category: 'MEDICAL',
        weight: 100,
        options: [
          { label: 'Pay reduced amount', outcome: { cashChange: -7200, message: 'Paid negotiated amount. Saved $4,800!', statChanges: { happiness: 10, stress: -10, financialIQ: 10 } } }
        ]
      },
      failure: {
        id: 'negotiation_result',
        title: '❌ No Reduction',
        description: 'Hospital won\'t budge on the price. Full $12,000 due.',
        category: 'MEDICAL',
        weight: 100,
        options: [
          { label: 'Pay in full', outcome: { cashChange: -12000, message: 'Paid full amount. Ouch.', statChanges: { stress: 15, happiness: -10 } } },
          { label: 'Payment plan (30 months)', outcome: { cashChange: 0, message: '$400/month for 30 months.', statChanges: { stress: 10 }, addLiability: { name: 'Medical Payment Plan', balance: 12000, originalBalance: 12000, interestRate: 0, monthlyPayment: 400, type: 'MEDICAL_DEBT' } } }
        ]
      }
    }
  };
  
  const negotiation = negotiations[negotiateType];
  if (!negotiation) {
    // Default fallback for unknown negotiation types
    return {
      id: 'negotiation_result',
      title: isSuccessful ? '✅ Negotiation Successful!' : '❌ Negotiation Failed',
      description: isSuccessful ? 'Your negotiation worked!' : 'They wouldn\'t budge.',
      category: 'CAREER',
      weight: 100,
      options: [
        { label: 'Continue', outcome: { cashChange: isSuccessful ? 1000 : -1000, message: isSuccessful ? 'Good outcome!' : 'Disappointing result.', statChanges: { stress: isSuccessful ? -5 : 10 } } }
      ]
    };
  }
  
  return isSuccessful ? negotiation.success : negotiation.failure;
};

// ============================================
// APPLY SCENARIO OUTCOME
// ============================================
export const applyScenarioOutcome = (state: GameState, outcome: any): GameState => {
  let newState = { ...state, pendingScenario: null };
  const perkEffects = getCharacterPerkEffects(state);
  const outcomeCashChange = (() => {
    if (typeof outcome.cashChange !== 'number') return undefined;
    if (state.pendingScenario?.category === 'MEDICAL' && outcome.cashChange < 0) {
      const medicalMultiplier = perkEffects.medicalCostMultiplier ?? 1;
      return Math.round(outcome.cashChange * medicalMultiplier);
    }
    return outcome.cashChange;
  })();
  
  // Track event occurrence
  if (state.pendingScenario) {
    const catKey = `__cat_${state.pendingScenario.category}`;
    const prevRecent = state.eventTracker?.recentEventIds || [];
    const nextRecent = [...prevRecent.filter(id => id !== state.pendingScenario?.id), state.pendingScenario.id].slice(-6);
    newState.eventTracker = {
      ...state.eventTracker,
      occurrences: {
        ...state.eventTracker?.occurrences,
        [state.pendingScenario.id]: (state.eventTracker?.occurrences?.[state.pendingScenario.id] || 0) + 1,
        [catKey]: (state.eventTracker?.occurrences?.[catKey] || 0) + 1
      },
      lastOccurrence: {
        ...state.eventTracker?.lastOccurrence,
        [state.pendingScenario.id]: state.month,
        [catKey]: state.month
      },
      recentEventIds: nextRecent
    };
    
    // Mark taxes paid if it was tax event
    if (state.pendingScenario.id === 'annual_taxes') {
      newState.eventTracker.taxesPaidThisYear = true;
      newState.eventTracker.lastTaxMonth = state.month;
    }
  }
  
  // Handle negotiation outcomes - creates a follow-up event
  if (outcome.negotiateType) {
    const negotiationResult = generateNegotiationResult(outcome.negotiateType, state);
    newState.pendingScenario = negotiationResult;
    
    // Apply any immediate effects from choosing to negotiate
    if (typeof outcomeCashChange === 'number' && outcomeCashChange !== 0) {
      newState.cash = Math.max(0, newState.cash + outcomeCashChange);
    }
    if (outcome.statChanges) {
      newState.stats = {
        ...state.stats,
        happiness: Math.min(100, Math.max(0, state.stats.happiness + (outcome.statChanges.happiness || 0))),
        health: Math.min(100, Math.max(0, state.stats.health + (outcome.statChanges.health || 0))),
        energy: Math.min(100, Math.max(0, state.stats.energy + (outcome.statChanges.energy || 0))),
        stress: Math.min(100, Math.max(0, state.stats.stress + (outcome.statChanges.stress || 0))),
        networking: Math.min(100, Math.max(0, state.stats.networking + (outcome.statChanges.networking || 0))),
        financialIQ: Math.min(100, Math.max(0, state.stats.financialIQ + (outcome.statChanges.financialIQ || 0))),
        fulfillment: Math.min(100, Math.max(0, (state.stats.fulfillment || 40) + (outcome.statChanges.fulfillment || 0)))
      };
    }
    return newState;
  }
  
  if (typeof outcomeCashChange === 'number' && outcomeCashChange !== 0) {
    newState.cash = Math.max(0, newState.cash + outcomeCashChange);
  }

  // Dynamic cash changes based on monthly salary (e.g., severance / back pay).
  if (typeof outcome.cashChangeSalaryMonths === 'number' && outcome.cashChangeSalaryMonths !== 0) {
    const salaryForCalc = calculateEffectiveMonthlySalary({
      ...state,
      // Severance is typically based on base salary, not one-turn bonuses.
      tempSalaryBonus: 0,
      // If already unemployed, still compute severance off the normal salary.
      jobLossMonthsRemaining: 0
    } as GameState);
    const delta = Math.round(salaryForCalc * outcome.cashChangeSalaryMonths);
    if (delta !== 0) {
      newState.cash = Math.max(0, newState.cash + delta);
    }
  }
  
  if (outcome.statChanges) {
    newState.stats = {
      ...state.stats,
      happiness: Math.min(100, Math.max(0, state.stats.happiness + (outcome.statChanges.happiness || 0))),
      health: Math.min(100, Math.max(0, state.stats.health + (outcome.statChanges.health || 0))),
      energy: Math.min(100, Math.max(0, state.stats.energy + (outcome.statChanges.energy || 0))),
      stress: Math.min(100, Math.max(0, state.stats.stress + (outcome.statChanges.stress || 0))),
      networking: Math.min(100, Math.max(0, state.stats.networking + (outcome.statChanges.networking || 0))),
      financialIQ: Math.min(100, Math.max(0, state.stats.financialIQ + (outcome.statChanges.financialIQ || 0))),
      fulfillment: Math.min(100, Math.max(0, (state.stats.fulfillment || 40) + (outcome.statChanges.fulfillment || 0)))
    };
  }

  // Job loss shock: salary becomes $0 for N months.
  if (typeof outcome.jobLossMonths === 'number' && outcome.jobLossMonths > 0) {
    const current = newState.jobLossMonthsRemaining ?? 0;
    newState.jobLossMonthsRemaining = Math.max(current, Math.floor(outcome.jobLossMonths));
  }
  
  // Handle marriage
  if (outcome.marriageChange) {
    const names = ['Taylor', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Cameron'];
    const spouseIncome = Math.round((state.career?.salary || 4000) * (0.6 + Math.random() * 0.8));
    
    newState.family = {
      ...newState.family,
      isEngaged: true,
      engagedMonth: state.month,
      inRelationship: true, // Already in relationship when proposing
      spouse: undefined // Set after wedding
    };
  }
  
  // Handle starting a new relationship
  if (outcome.startRelationship) {
    newState.family = {
      ...newState.family,
      inRelationship: true,
      relationshipStartMonth: state.month
    };
  }
  
  // Handle wedding (after engagement)
  if (state.pendingScenario?.id === 'wedding_planning' && state.family?.isEngaged) {
    const names = ['Taylor', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Cameron'];
    const spouseIncome = Math.round((state.career?.salary || 4000) * (0.6 + Math.random() * 0.8));
    const spouseCareer = ['TECH', 'HEALTHCARE', 'FINANCE', 'CREATIVE', 'GOVERNMENT'][Math.floor(Math.random() * 5)] as CareerPath;
    
    newState.family = {
      ...newState.family,
      isEngaged: false,
      spouse: {
        name: names[Math.floor(Math.random() * names.length)],
        income: spouseIncome,
        careerPath: spouseCareer,
        marriedMonth: state.month
      }
    };
  }
  
  // Handle children
  if (outcome.childChange && outcome.childChange > 0) {
    const childNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas'];
    const newChild: Child = {
      id: 'child-' + Date.now(),
      name: childNames[Math.floor(Math.random() * childNames.length)],
      birthMonth: state.month + 9, // Born in 9 months
      age: 0,
      inSchool: false,
      inCollege: false
    };
    
    newState.family = {
      ...newState.family,
      children: [...(newState.family?.children || []), newChild]
    };
  }
  
  // Add liability if specified
  if (outcome.addLiability) {
    const newLiability: Liability = {
      id: 'liability-' + Date.now(),
      name: outcome.addLiability.name || 'Debt',
      balance: outcome.addLiability.balance || 0,
      originalBalance: outcome.addLiability.originalBalance || outcome.addLiability.balance || 0,
      interestRate: outcome.addLiability.interestRate || 0.10,
      monthlyPayment: outcome.addLiability.monthlyPayment || 0,
      type: outcome.addLiability.type || 'PERSONAL_LOAN'
    };
    newState.liabilities = [...newState.liabilities, newLiability];
  }
  
  // Apply temporary asset income disruption (vacancy, strike, etc.)
  if (outcome.assetIncomeDisruption) {
    const d = outcome.assetIncomeDisruption as {
      assetId: string;
      months: number;
      incomeMultiplier: number;
      reason: string;
      recoveryTitle?: string;
      recoveryMessage?: string;
    };

    const months = Math.max(1, Math.floor(d.months || 1));
    const incomeMultiplier = clamp(typeof d.incomeMultiplier === 'number' ? d.incomeMultiplier : 1, 0, 1);

    const disruption = {
      id: `disruption-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      assetId: d.assetId,
      monthsRemaining: months,
      incomeMultiplier,
      reason: d.reason || 'Income disruption',
      recoveryTitle: d.recoveryTitle,
      recoveryMessage: d.recoveryMessage
    };

    newState.assetIncomeDisruptions = [...(newState.assetIncomeDisruptions || []), disruption];
  }

  // Apply permanent asset adjustments (value / cashflow)
  if (outcome.assetAdjustment) {
    const adj = outcome.assetAdjustment as {
      assetId: string;
      valueDelta?: number;
      valueMultiplier?: number;
      cashFlowDelta?: number;
      cashFlowMultiplier?: number;
    };

    newState.assets = (newState.assets || []).map(a => {
      if (a.id !== adj.assetId) return a;

      let value = a.value;
      if (typeof adj.valueDelta === 'number') value += adj.valueDelta;
      if (typeof adj.valueMultiplier === 'number') value *= adj.valueMultiplier;

      let cashFlow = a.cashFlow;
      if (typeof adj.cashFlowDelta === 'number') cashFlow += adj.cashFlowDelta;
      if (typeof adj.cashFlowMultiplier === 'number') cashFlow *= adj.cashFlowMultiplier;

      return {
        ...a,
        value: Math.max(0, Math.round(value)),
        cashFlow: Math.round(cashFlow)
      };
    });
  }

  if (outcome.followups && Array.isArray(outcome.followups) && outcome.followups.length > 0) {
    const queue = [...(newState.eventQueue || [])];
    outcome.followups.forEach((followup: { id: string; delayMonths?: number }) => {
      const delay = typeof followup.delayMonths === 'number' ? followup.delayMonths : 2;
      queue.push({ id: followup.id, minMonth: state.month + Math.max(1, delay) });
    });
    newState.eventQueue = queue;
  }

  // Add asset if specified (rare event rewards)
  if (outcome.addAsset) {
    const a = outcome.addAsset as Partial<Asset>;
    const newAsset: Asset = {
      id: a.id || `asset-${Date.now()}`,
      name: a.name || 'New Asset',
      type: a.type || AssetType.STOCK,
      value: a.value || 0,
      costBasis: a.costBasis ?? a.value ?? 0,
      quantity: a.quantity ?? 1,
      cashFlow: a.cashFlow ?? 0,
      volatility: a.volatility ?? 0.15,
      appreciationRate: a.appreciationRate ?? 0.07,
      baseYield: a.baseYield ?? 0,
      industry: a.industry,
      priceHistory: a.priceHistory ?? [{ month: state.month, value: a.value || 0 }]
    };

    newState.assets = [...(newState.assets || []), newAsset];
  }

  // Add event
  newState.events = [{
    id: Date.now().toString(),
    month: state.month,
    title: state.pendingScenario?.title || 'events.defaultTitle',
    description: outcome.message,
    type: state.pendingScenario?.category || 'DECISION'
  }, ...newState.events];
  
  return newState;
};

// ============================================
// PROCESS MONTHLY TURN
// ============================================

// ============================================
// APPLY MONTHLY ACTION (Adult mode)
// ============================================
export const applyMonthlyAction = (
  state: GameState,
  actionId: MonthlyActionId
): { newState: GameState; message: string } => {
  const inferredMax = calculateMonthlyActionsMax(state);
  const currentMax = typeof state.monthlyActionsMax === 'number' ? state.monthlyActionsMax : inferredMax;
  const currentRemaining = typeof state.monthlyActionsRemaining === 'number' ? state.monthlyActionsRemaining : currentMax;

  if (currentRemaining <= 0) {
    return { newState: state, message: 'No Monthly Actions remaining this month.' };
  }

  // Create a safe copy
  let newState: GameState = {
    ...state,
    monthlyActionsMax: currentMax,
    monthlyActionsRemaining: currentRemaining,
    tempSalaryBonus: state.tempSalaryBonus ?? 0,
    tempSideHustleMultiplier: state.tempSideHustleMultiplier ?? 1,
    stats: { ...state.stats },
    events: [...state.events]
  };

  const applyStats = (changes: Partial<GameState['stats']>) => {
    newState.stats = {
      ...newState.stats,
      happiness: clampStat((newState.stats.happiness || 0) + (changes.happiness || 0)),
      health: clampStat((newState.stats.health || 0) + (changes.health || 0)),
      energy: clampStat((newState.stats.energy || 0) + (changes.energy || 0)),
      stress: clampStat((newState.stats.stress || 0) + (changes.stress || 0)),
      networking: clampStat((newState.stats.networking || 0) + (changes.networking || 0)),
      financialIQ: clampStat((newState.stats.financialIQ || 0) + (changes.financialIQ || 0)),
      fulfillment: clampStat(((newState.stats.fulfillment || 40) as number) + (changes.fulfillment || 0))
    };
  };

  const spendCash = (amount: number): boolean => {
    if (amount <= 0) {
      newState.cash = newState.cash + amount;
      return true;
    }
    if (newState.cash < amount) return false;
    newState.cash -= amount;
    return true;
  };

  let title = '🗓️ Monthly Action';
  let description = '';

  // Lightweight gating based on energy
  const energy = newState.stats.energy || 0;
  if ((actionId === 'OVERTIME' || actionId === 'TRAINING' || actionId === 'HUSTLE_SPRINT') && energy < 20) {
    return { newState: state, message: 'You are too drained right now. Recover some energy first.' };
  }

  // If the player is in a job-loss period, overtime isn't available.
  if ((newState.jobLossMonthsRemaining ?? 0) > 0 && actionId === 'OVERTIME') {
    return { newState: state, message: 'You are currently unemployed. Overtime isn’t available right now.' };
  }

  switch (actionId) {
    case 'OVERTIME': {
      const salary = calculateEffectiveMonthlySalary({ ...state, tempSalaryBonus: 0 });
      const bonus = Math.max(0, Math.round(salary * 0.10));
      newState.tempSalaryBonus = (newState.tempSalaryBonus || 0) + bonus;
      applyStats({ energy: -15, stress: +12, happiness: -3, health: -1 });
      title = '🕒 Work Overtime';
      description = `You picked up extra hours. Next month salary bonus: +$${bonus.toLocaleString()}.`;
      break;
    }
    case 'NETWORK': {
      const ok = spendCash(100);
      if (!ok) return { newState: state, message: 'Not enough cash to attend a networking event ($100).' };
      applyStats({ networking: +12, stress: +5, happiness: +2, energy: -5 });

      // Small chance of an immediate referral (fun moment)
      if (Math.random() < 0.2) {
        newState.cash += 500;
        applyStats({ networking: +3 });
        description = 'You met someone who sent you a warm referral (+$500) and expanded your network.';
      } else {
        description = 'You met new people and strengthened your professional network.';
      }

      title = '🤝 Networking Event';
      break;
    }
    case 'TRAINING': {
      const ok = spendCash(300);
      if (!ok) return { newState: state, message: 'Not enough cash for training materials ($300).' };
      applyStats({ financialIQ: +12, networking: +3, stress: +4, energy: -8, happiness: +1 });

      if (newState.career) {
        newState.career = {
          ...newState.career,
          futureProofScore: clamp((newState.career.futureProofScore || 50) + 1, 0, 100)
        };
      }

      title = '📚 Skill Training';
      description = 'You invested in learning. Financial IQ increased, improving decision quality over time.';
      break;
    }
    case 'HUSTLE_SPRINT': {
      if (!newState.activeSideHustles || newState.activeSideHustles.length === 0) {
        return { newState: state, message: 'You need an active side hustle before you can sprint it.' };
      }
      applyStats({ energy: -12, stress: +10, happiness: -1 });
      const currentMult = typeof newState.tempSideHustleMultiplier === 'number' ? newState.tempSideHustleMultiplier : 1;
      newState.tempSideHustleMultiplier = clamp(currentMult * 1.25, 1, 2);
      title = '⚡ Side Hustle Sprint';
      description = 'You pushed hard on your hustle. Next month hustle income will be boosted.';
      break;
    }
    case 'RECOVER': {
      applyStats({ energy: +18, stress: -15, health: +4, happiness: +6, fulfillment: +2 });
      title = '🛌 Rest & Recovery';
      description = 'You took time to recover. Energy and health improved, stress dropped.';
      break;
    }
    default: {
      return { newState: state, message: 'Unknown Monthly Action.' };
    }
  }

  // Spend the action
  newState.monthlyActionsRemaining = Math.max(0, (newState.monthlyActionsRemaining || 0) - 1);

  // Log it in the event feed
  newState.events = [
    {
      id: `action-${Date.now()}`,
      month: state.month,
      title,
      description,
      type: 'DECISION' as const
    },
    ...newState.events
  ].slice(0, 50);

  return { newState, message: description };
};


// ============================================
// DELINQUENCY / LATE FEES
// ============================================
// Flat late fees to keep gameplay readable (and to make missed payments feel real).
const calculateLateFee = (liability: Liability): number => {
  switch (liability.type) {
    case 'CREDIT_CARD':
      return 35;
    case 'MORTGAGE':
      return 75;
    case 'CAR_LOAN':
      return 35;
    case 'STUDENT_LOAN':
      return 25;
    case 'PERSONAL_LOAN':
      return 30;
    case 'MEDICAL_DEBT':
      return 15;
    case 'LEGAL_DEBT':
      return 25;
    default:
      return 25;
  }
};

export const calculateCreditScoreUpdate = (
  prevState: GameState,
  newState: GameState,
  cashFlow: { income: number; debtPayments: number },
  wasDelinquentThisMonth: boolean
): { score: number; delta: number; reasons: string[] } => {
  const prevScore = prevState.creditRating ?? newState.creditRating ?? 650;
  const reasons: string[] = [];
  let delta = 0;

  const income = Math.max(0, cashFlow.income || 0);
  const debtPayments = Math.max(0, cashFlow.debtPayments || 0);
  const dti = income > 0 ? debtPayments / income : 1;

  const creditCardBalance = (newState.liabilities || [])
    .filter(l => l.type === 'CREDIT_CARD')
    .reduce((sum, l) => sum + l.balance, 0);
  const creditLimitEstimate = Math.max(2000, Math.round(income * 2));
  const utilization = creditLimitEstimate > 0 ? creditCardBalance / creditLimitEstimate : 0;

  const prevDebtTotal = (prevState.liabilities || []).reduce((sum, l) => sum + l.balance, 0);
  const nextDebtTotal = (newState.liabilities || []).reduce((sum, l) => sum + l.balance, 0);

  if (wasDelinquentThisMonth) {
    delta -= 35;
    reasons.push('Missed or late payments');
  } else if ((newState.liabilities || []).length > 0) {
    delta += 4;
    reasons.push('On-time payments');
  } else {
    delta += 2;
    reasons.push('No missed payments');
  }

  if (utilization >= 0.9) {
    delta -= 12;
    reasons.push('Very high credit utilization');
  } else if (utilization >= 0.6) {
    delta -= 6;
    reasons.push('High credit utilization');
  } else if (utilization >= 0.3) {
    reasons.push('Moderate credit utilization');
  } else if (creditCardBalance > 0) {
    delta += 6;
    reasons.push('Low credit utilization');
  } else {
    delta += 3;
    reasons.push('No revolving balance');
  }

  if (dti >= 0.6) {
    delta -= 10;
    reasons.push('High debt-to-income ratio');
  } else if (dti >= 0.4) {
    delta -= 4;
    reasons.push('Elevated debt-to-income ratio');
  } else if (dti <= 0.2) {
    delta += 5;
    reasons.push('Low debt-to-income ratio');
  } else if (dti <= 0.35) {
    delta += 2;
    reasons.push('Healthy debt-to-income ratio');
  }

  if (nextDebtTotal <= prevDebtTotal - 200) {
    delta += 2;
    reasons.push('Total debt decreased');
  } else if (nextDebtTotal >= prevDebtTotal + 500) {
    delta -= 2;
    reasons.push('Total debt increased');
  }

  const score = clampCredit(prevScore + delta);
  return { score, delta, reasons };
};
export const processTurn = (state: GameState): { newState: GameState; monthlyReport: MonthlyReport } => {
  let newState = { ...state };
  
  // Initialize credit rating if not set
  if (!newState.creditRating) {
    newState.creditRating = 650; // Starting credit rating
  }
  if (!newState.creditHistory || newState.creditHistory.length === 0) {
    newState.creditHistory = [{ month: newState.month || 1, score: newState.creditRating, reasons: ['Starting credit profile'] }];
    newState.creditLastChangeReasons = ['Starting credit profile'];
  }
  
  // 1. Advance time
  newState.month++;
  if (newState.month % 12 === 1 && newState.month > 1) {
    newState.year = (newState.year || 2025) + 1;
    // Reset annual tax flag
    newState.eventTracker = { ...newState.eventTracker, taxesPaidThisYear: false };
  }
  
  // 2. Update AI disruption
  newState = updateAIDisruption(newState);
  
  // 3. Update market cycle
  newState = updateMarketCycle(newState);
  
  // 4. Update asset prices (affected by economy)
  newState = updateAssetPrices(newState);
  
  // 5. Update education progress
  newState = updateEducation(newState);
  
  // 6. Update children
  newState = updateChildren(newState);

  // 6.5 Apply business income variance + maintenance
  const businessUpdate = applyBusinessIncomeVariance(newState);
  newState = businessUpdate.state;

  // 7. Calculate cash flow
  const cashFlow = calculateMonthlyCashFlow(newState);
  const totalExpenses = cashFlow.expenses + businessUpdate.maintenanceCost;
  const netCashFlow = cashFlow.income - totalExpenses;
  const previousNetWorth = calculateNetWorth(state);
  
  // Check if player can afford expenses
  const projectedCash = newState.cash + netCashFlow;
  
  let wasDelinquentThisMonth = false;

  // 7a. Handle negative cash - missed payments impact credit rating
  if (projectedCash < 0) {
    wasDelinquentThisMonth = true;
    // Missed payment - reduce credit rating
    newState.creditRating = Math.max(300, (newState.creditRating || 650) - 25);
    newState.missedPayments = (newState.missedPayments || 0) + 1;
    
    // Add event about missed payment
    newState.events = [{
      id: Date.now().toString(),
      month: newState.month,
      title: '⚠️ Missed Payment',
      description: `You couldn't cover your expenses. Credit rating dropped to ${newState.creditRating}. Unpaid debts accrued interest + late fees. Consider selling assets or lowering lifestyle.`,
      type: 'WARNING'
    }, ...newState.events];
    
    // If they have assets, they get a lifeline
    const totalAssetValue = (newState.assets || []).reduce((sum, a) => sum + (a.costBasis * 0.5 * (a.quantity ?? 1)), 0);
    
    if (totalAssetValue > 0) {
      // They can sell assets at 50% value - don't go bankrupt yet
      newState.cash = 0;
    } else if (newState.missedPayments >= 3) {
      // No assets and 3+ missed payments = bankruptcy
      newState.isBankrupt = true;
      newState.events = [{
        id: Date.now().toString(),
        month: newState.month,
        title: '💀 BANKRUPTCY',
        description: 'You have run out of money and assets. Game Over.',
        type: 'BANKRUPTCY'
      }, ...newState.events];
    } else {
      newState.cash = 0;
    }
  } else {
    // Apply net cash flow normally
    newState.cash = projectedCash;
  }

  // 7c. Auto-invest from last month's disposable income (in arrears)
  if (!newState.isBankrupt && state.autoInvest?.enabled && state.lastMonthlyReport) {
    const disposable = Math.max(0, state.lastMonthlyReport.income - state.lastMonthlyReport.expenses);
    const maxPercent = Math.max(0, Math.min(50, Math.floor(state.autoInvest.maxPercent || 0)));
    const investBudget = Math.floor(disposable * (maxPercent / 100));
    const allocations = (state.autoInvest.allocations || []).filter(a => a.percent > 0);
    const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
    let availableCash = newState.cash;

    if (investBudget > 0 && totalPercent > 0 && availableCash > 0) {
      const inflationMult = Math.pow(1 + (newState.economy?.inflationRate || 0.03), newState.month / 12);
      const purchases: Array<{ name: string; qty: number; cost: number }> = [];

      for (const alloc of allocations) {
        const item = MARKET_ITEMS.find(i => i.id === alloc.itemId);
        if (!item || !isAutoInvestEligible(item)) continue;
        if (!hasRequiredEducationForInvestment(item, newState.education?.degrees || [])) continue;

        const price = Math.round(item.price * inflationMult);
        const effectivePercent = totalPercent > 100
          ? Math.floor((alloc.percent / totalPercent) * 100)
          : alloc.percent;
        const allocBudget = Math.floor(investBudget * (effectivePercent / 100));
        const maxByBudget = Math.floor(allocBudget / price);
        const maxByCash = Math.floor(availableCash / price);
        const qty = Math.min(maxByBudget, maxByCash);
        if (qty <= 0) continue;

        newState = addAutoInvestAssetUnits(newState, item, price, qty);
        const cost = qty * price;
        availableCash -= cost;
        purchases.push({ name: item.name, qty, cost });
      }

      if (purchases.length > 0) {
        newState.cash = availableCash;
        const summary = purchases.map(p => `${p.qty}x ${p.name}`).join(', ');
        const totalSpent = purchases.reduce((sum, p) => sum + p.cost, 0);
        newState.events = [{
          id: `autoinvest_${Date.now()}`,
          month: newState.month,
          title: '📈 Auto-Invest',
          description: `Invested ${formatMoneyFull(totalSpent)}: ${summary}`,
          type: 'DECISION'
        }, ...(newState.events || [])];
      }
    }
  }

  // 7b. Update side hustle progression (milestones trigger upgrade choices)
  newState = updateSideHustleProgress(newState);

  // Consume one-turn action modifiers (they apply to this processed month only)
  newState.tempSalaryBonus = 0;
  newState.tempSideHustleMultiplier = 1;

  // 8. Process liabilities
  newState.liabilities = newState.liabilities
    .map(liability => {
      const interestAccrued = (liability.interestRate / 12) * liability.balance;

      // If the player couldn't cover expenses this month, treat all debts as delinquent:
      // no principal gets paid down, and interest + a late fee are added.
      if (wasDelinquentThisMonth) {
        const lateFee = calculateLateFee(liability);
        const newBalance = Math.round(liability.balance + interestAccrued + lateFee);
        return { ...liability, balance: newBalance };
      }

      const interestPayment = interestAccrued;
      const principalPayment = Math.max(0, liability.monthlyPayment - interestPayment);
      const newBalance = Math.max(0, liability.balance - principalPayment);
      return { ...liability, balance: newBalance };
    })
    .filter(l => l.balance > 0);

  // 8.5 Update credit score from payment behavior, utilization, and DTI
  const creditUpdate = calculateCreditScoreUpdate(state, newState, cashFlow, wasDelinquentThisMonth);
  newState.creditRating = creditUpdate.score;
  newState.creditLastChangeReasons = creditUpdate.reasons;
  const nextCreditHistory = [...(newState.creditHistory || []), {
    month: newState.month,
    score: creditUpdate.score,
    reasons: creditUpdate.reasons
  }].slice(-12);
  newState.creditHistory = nextCreditHistory;

  // 9. Update mortgages
  newState.mortgages = newState.mortgages
    .map(m => {
      const liability = newState.liabilities.find(l => l.id === m.id);
      return {
        ...m,
        // If you missed payments, the mortgage doesn't progress this month.
        monthsRemaining: wasDelinquentThisMonth ? m.monthsRemaining : Math.max(0, m.monthsRemaining - 1),
        balance: liability?.balance || 0
      };
    })
    .filter(m => m.balance > 0);
  
  // 10. Add experience
  if (newState.career) {
    newState.career = { ...newState.career, experience: newState.career.experience + 1 };
  }
  if (newState.playerJob) {
    newState.playerJob = { ...newState.playerJob, experience: newState.playerJob.experience + 1 };
  }

  // 10.5 Apply experience-based salary growth (negotiation + networking bonuses)
  newState = applyCareerSalaryGrowth(newState);
  
  // 11. Check promotion
  const { promoted, newState: stateAfterPromo } = checkPromotion(newState);
  newState = stateAfterPromo;
  
  // 12. Update stats
  const lifestyleOpt = LIFESTYLE_OPTS[newState.lifestyle];
  const sideHustleEnergyDrain = (newState.activeSideHustles || []).reduce((s, h) => {
    const effects = getSideHustleUpgradeEffects(h);
    return s + (h.energyCost || 0) * effects.energyMultiplier;
  }, 0);
  const sideHustleStress = (newState.activeSideHustles || []).reduce((s, h) => {
    const effects = getSideHustleUpgradeEffects(h);
    return s + (h.stressIncrease || 0) * effects.stressMultiplier;
  }, 0);
  
  // Children add fulfillment but reduce energy and add stress
  const childCount = newState.family?.children?.length || 0;
  const childFulfillment = childCount * 2;
  const childEnergyDrain = childCount * 3;
  const childStress = childCount * 2;
  
  // Spouse adds happiness and reduces stress
  const spouseHappiness = newState.family?.spouse ? 5 : 0;
  const spouseStressReduction = newState.family?.spouse ? 3 : 0;
  
  // Health changes based on stress, energy, and lifestyle
  const lifestyleHealthBonus = { 'FRUGAL': -2, 'MODEST': 0, 'COMFORTABLE': 1, 'AFFLUENT': 2, 'LUXURIOUS': 1 }[newState.lifestyle] || 0;
  const stressHealthPenalty = newState.stats.stress > 70 ? -2 : newState.stats.stress > 50 ? -1 : 0;
  const energyHealthBonus = newState.stats.energy < 30 ? -1 : 0;
  const healthChange = lifestyleHealthBonus + stressHealthPenalty + energyHealthBonus;
  
  newState.stats = {
    ...newState.stats,
    health: Math.min(100, Math.max(10, newState.stats.health + healthChange * 0.5)),
    happiness: Math.min(100, Math.max(0, newState.stats.happiness + (lifestyleOpt?.happiness || 0) * 0.1 + spouseHappiness * 0.1)),
    energy: Math.min(100, Math.max(10, newState.stats.energy + 10 - sideHustleEnergyDrain * 0.5 - childEnergyDrain * 0.3)),
    stress: Math.min(100, Math.max(0, newState.stats.stress + sideHustleStress * 0.3 + childStress * 0.2 - spouseStressReduction * 0.2 - 3)),
    fulfillment: Math.min(100, Math.max(0, (newState.stats.fulfillment || 40) + childFulfillment * 0.1))
  };

  // Reset Monthly Actions for the new month (after stats update)
  if (!newState.isBankrupt) {
    const maxActions = calculateMonthlyActionsMax(newState);
    newState.monthlyActionsMax = maxActions;
    newState.monthlyActionsRemaining = maxActions;
  } else {
    newState.monthlyActionsMax = 0;
    newState.monthlyActionsRemaining = 0;
  }
  
  // 13. Generate life event (only if not bankrupt)
  if (!newState.pendingScenario && !newState.isBankrupt) {
    const event = generateLifeEvent(newState);
    if (event) {
      newState.pendingScenario = event;
      if (newState.eventQueue && newState.eventQueue.length > 0) {
        newState.eventQueue = newState.eventQueue.filter(entry => !(entry.id === event.id && entry.minMonth <= newState.month));
      }
      // Track that an event fired this month for drought prevention
      newState.eventTracker = {
        ...newState.eventTracker,
        lastEventMonth: newState.month
      };
    }
  }
  
  // 14. Check win condition
  const newNetWorth = calculateNetWorth(newState);
  // Win condition: passive income covers ALL expenses with a small safety buffer.
  // This aligns with the UI (goal: 110% of monthly expenses).
  const targetExpenses = cashFlow.expenses;
  const targetPassive = getFinancialFreedomTarget(targetExpenses);
  
  if (cashFlow.passive >= targetPassive && targetPassive > 0 && !newState.hasWon && !newState.isBankrupt) {
    newState.hasWon = true;
    newState.prestige = {
      ...newState.prestige,
      lifetimeEarnings: (newState.prestige?.lifetimeEarnings || 0) + newNetWorth,
      fastestWin: newState.prestige?.fastestWin 
        ? Math.min(newState.prestige.fastestWin, newState.month) 
        : newState.month
    };
  }

  // 14.5 Goals / Quests (short-term objectives)
  // Update quests after major financial changes for the month.
  if (!newState.isBankrupt) {
    newState = updateQuests(newState);
  }

  // 15. Trim events
  newState.events = newState.events.slice(0, 50);
  
  // 16. Track net worth history (keep last 60 months = 5 years)
  newState.netWorthHistory = [
    ...(state.netWorthHistory || []),
    { month: newState.month, value: newNetWorth }
  ].slice(-60);

  // 16.5 Job loss shock countdown
  // Decrement AFTER cashflow is calculated (so you lose income for the full N months).
  const jobLossBefore = newState.jobLossMonthsRemaining ?? 0;
  if (jobLossBefore > 0) {
    newState.jobLossMonthsRemaining = Math.max(0, jobLossBefore - 1);

    // When the countdown reaches 0, notify the player that income resumes next month.
    if (newState.jobLossMonthsRemaining === 0) {
      newState.events = [
        {
          id: `job_recovered_${newState.month}`,
          month: newState.month,
          title: '✅ Back to Work',
          description: 'You landed a new role. Your salary income resumes next month. (Emergency fund = life saver.)',
          type: 'NEWS'
        },
        ...(newState.events || [])
      ];
      // Small morale bounce
      newState.stats = {
        ...newState.stats,
        happiness: clampStat((newState.stats?.happiness ?? 50) + 6),
        stress: clampStat((newState.stats?.stress ?? 30) - 8)
      };
    }
  }
  
  // 16.6 Asset income disruption countdown
  // Decrement AFTER cashflow is calculated (so the income reduction applies for the full N months).
  if (newState.assetIncomeDisruptions && newState.assetIncomeDisruptions.length > 0) {
    const ended = newState.assetIncomeDisruptions.filter(d => (d.monthsRemaining ?? 0) <= 1);
    const ongoing = newState.assetIncomeDisruptions
      .map(d => ({ ...d, monthsRemaining: Math.max(0, (d.monthsRemaining ?? 0) - 1) }))
      .filter(d => (d.monthsRemaining ?? 0) > 0);

    newState.assetIncomeDisruptions = ongoing;

    if (ended.length > 0) {
      const recoveryEvents = ended.map(d => ({
        id: `disruption_recovered_${d.id}_${newState.month}`,
        month: newState.month,
        title: d.recoveryTitle || '✅ Income Restored',
        description: d.recoveryMessage || 'A temporary disruption ended. Income resumes next month.',
        type: 'NEWS' as const
      }));

      newState.events = [...recoveryEvents, ...(newState.events || [])];

      // Small relief bump
      newState.stats = {
        ...newState.stats,
        stress: clampStat((newState.stats?.stress ?? 30) - 4),
        happiness: clampStat((newState.stats?.happiness ?? 50) + 2)
      };
    }
  }

  const monthlyReport: MonthlyReport = {
    income: cashFlow.income,
    expenses: totalExpenses,
    netWorthChange: newNetWorth - previousNetWorth,
    promoted,
    aiImpact: newState.aiDisruption?.affectedIndustries?.[newState.career?.path || 'TECH']?.automationRisk,
    childExpenses: cashFlow.childrenExpenses
  };

  newState.lastMonthlyReport = monthlyReport;
  
  return { newState, monthlyReport };
};
