// Tycoon: Financial Freedom - Type Definitions v3.4.3

// ============================================
// TAB NAVIGATION
// ============================================
export const TABS = {
  OVERVIEW: 'overview',
  INVEST: 'invest',
  ASSETS: 'assets',
  BANK: 'bank',
  CAREER: 'career',
  EDUCATION: 'education',
  SELF_LEARN: 'self_learn',
  EQ: 'eq',
  NEGOTIATIONS: 'negotiations',
  SIDEHUSTLE: 'sidehustle',
  LIFESTYLE: 'lifestyle',
} as const;

export type TabId = typeof TABS[keyof typeof TABS];

export enum AssetType {
  STOCK = 'STOCK',
  INDEX_FUND = 'INDEX_FUND',
  BOND = 'BOND',
  REAL_ESTATE = 'REAL_ESTATE',
  BUSINESS = 'BUSINESS',
  CRYPTO = 'CRYPTO',
  COMMODITY = 'COMMODITY',
  SAVINGS = 'SAVINGS'
}

export type CareerPath = 'TECH' | 'FINANCE' | 'HEALTHCARE' | 'TRADES' | 'CREATIVE' | 'ENTREPRENEUR' | 'GOVERNMENT' | 'SALES';
export type EducationCategory = 'STEM' | 'BUSINESS' | 'HEALTHCARE' | 'TRADES' | 'CREATIVE' | 'LIBERAL_ARTS' | 'LAW';
export type EducationLevel = 'HIGH_SCHOOL' | 'CERTIFICATE' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'MBA' | 'PHD' | 'LAW' | 'MEDICAL';
export type Lifestyle = 'FRUGAL' | 'MODEST' | 'COMFORTABLE' | 'AFFLUENT' | 'LUXURIOUS';
export type MarketTrend = 'BOOM' | 'BULL' | 'STABLE' | 'BEAR' | 'CRASH';
export type MarketCyclePhase = 'EXPANSION' | 'PEAK' | 'CONTRACTION' | 'TROUGH';
export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'EXTREME';

// ============================================
// MONTHLY ACTIONS (Adult mode)
// ============================================
// These are lightweight "between-turn" decisions that let players trade time/energy/stress
// for money, growth, or recovery.
export type MonthlyActionId =
  | 'OVERTIME'
  | 'NETWORK'
  | 'TRAINING'
  | 'HUSTLE_SPRINT'
  | 'RECOVER';

// ============================================
// GOALS / QUESTS (Adult mode)
// ============================================
// Lightweight quest system to provide short-term objectives and educational nudges.
// Quests are stored as ids in GameState and evaluated from the current state.

export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Branching questlines: once enough data exists, the game infers a "track" based on playstyle.
export type QuestTrack = 'DEBT_CRUSHER' | 'INVESTOR' | 'ENTREPRENEUR';

export type QuestCategory =
  | 'FOUNDATION'
  | 'HUSTLES'
  | 'INVESTING'
  | 'RISK'
  | 'CAREER'
  | 'CREDIT';

export type QuestMetric =
  | 'CASH_AMOUNT'
  | 'OWN_ASSET_COUNT'
  | 'TOTAL_INVESTED'
  | 'DIVERSIFY_ASSET_TYPES'
  | 'PASSIVE_INCOME'
  | 'ACTIVE_SIDE_HUSTLES'
  | 'CAREER_LEVEL'
  | 'CASH_RESERVE_MONTHS'
  | 'CREDIT_RATING'
  | 'DEBT_REPAID_TOTAL'
  | 'OWN_BUSINESS_COUNT'
  | 'OWN_REAL_ESTATE_COUNT';

export interface QuestReward {
  cash?: number;
  stats?: Partial<PlayerStats>;
  creditRating?: number; // additive, clamped to 300-850
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  // Optional track restriction (used for branching questlines).
  track?: QuestTrack;
  // Optional character restriction (used for character-specific questlines).
  characterId?: string;
  metric: QuestMetric;
  target: number;
  reward: QuestReward;
  unlockAfter?: string[];
  hint?: string;
}

export interface QuestState {
  // Up to a few active goals to keep focus.
  active: string[];
  // Goals that are complete but waiting for the player to claim rewards.
  readyToClaim: string[];
  // Completed (claimed) goal ids (rewards applied exactly once).
  completed: string[];
  // Optional branching track inferred from playstyle.
  track?: QuestTrack;
}

export type LifeEventCategory = 
  | 'TAX' 
  | 'LEGAL' 
  | 'FAMILY_EMERGENCY' 
  | 'MEDICAL' 
  | 'ECONOMIC' 
  | 'VEHICLE' 
  | 'CAREER' 
  | 'RELATIONSHIP' 
  | 'HOUSING'
  | 'WINDFALL'
  | 'AI_DISRUPTION'
  | 'BUSINESS'
  | 'CRIME'
  | 'SOCIAL';

export interface Character {
  id: string;
  name: string;
  backstory: string;
  avatarEmoji: string;
  avatarColor: string;
  avatarImage?: string;
  careerPath: CareerPath;
  startingBonus: { type: 'cash' | 'asset' | 'skill'; amount: number };
  traits: string[];
  perk: {
    id: string;
    name: string;
    description: string;
    effects?: {
      salaryMultiplier?: number;
      salaryGrowthBonus?: number;
      sideHustleIncomeMultiplier?: number;
      negotiationBonus?: number;
      businessVolatilityMultiplier?: number;
      businessMaintenanceChanceMultiplier?: number;
      businessMaintenanceCostMultiplier?: number;
      medicalCostMultiplier?: number;
      recessionSalaryMultiplier?: number;
    };
  };
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  costBasis: number;
  quantity: number;
  cashFlow: number;
  volatility: number;
  appreciationRate: number;
  priceHistory: { month: number; value: number }[];
  /** Month index when the asset was purchased (if tracked). */
  purchasedMonth?: number;
  /** Unit price paid for the most recent purchase (if tracked). */
  purchasePrice?: number;
  /** Optional asset description copied from the market item at purchase time. */
  description?: string;
  baseYield?: number;
  industry?: string;
  mortgageId?: string;
  /** Business income this month (total across quantity). */
  currentMonthIncome?: number;
  /** Business income from last month (total across quantity). */
  lastMonthIncome?: number;
  /** Optional maintenance status for business assets. */
  maintenanceStatus?: {
    label: string;
    impact: string;
    untilMonth: number;
  };
  /** Operations upgrade reduces volatility and maintenance odds. */
  opsUpgrade?: boolean;
}

export interface Liability {
  id: string;
  name: string;
  balance: number;
  originalBalance: number;
  interestRate: number;
  monthlyPayment: number;
  type: 'MORTGAGE' | 'STUDENT_LOAN' | 'CAR_LOAN' | 'PERSONAL_LOAN' | 'CREDIT_CARD' | 'MEDICAL_DEBT' | 'LEGAL_DEBT';
  assetId?: string;
}

export interface CreditHistoryEntry {
  month: number;
  score: number;
  reasons: string[];
}

export interface Mortgage {
  id: string;
  assetId: string;
  assetName: string;
  originalAmount: number;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  termMonths: number;
  monthsRemaining: number;
  downPaymentPercent: number;
  type: 'CONVENTIONAL' | 'FHA' | 'INVESTMENT';
}

export interface MortgageOption {
  id: string;
  name: string;
  downPaymentPercent: number;
  interestRateSpread: number;
  termYears: number;
  description: string;
  requirements?: { netWorth?: number; income?: number };
}

export interface MarketItem {
  id: string;
  name: string;
  type: AssetType;
  price: number;
  expectedYield: number;
  tier?: 'STARTER' | 'MID' | 'ADVANCED';
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredEducationCategory?: EducationCategory[];
  requiredEducationLevel?: EducationLevel;
  /** Optional long-run appreciation rate (e.g., for real estate). */
  appreciationRate?: number;
  volatility: number;
  volatilityRange?: { min: number; max: number };
  risk: RiskLevel;
  description: string;
  educationalNote?: string;
  industry?: string;
  canMortgage?: boolean;
  mortgageOptions?: string[];
}

export interface EducationOption {
  id: string;
  name: string;
  icon: string;
  category: EducationCategory;
  level: EducationLevel;
  cost: number;
  duration: number;
  salaryBoost: number;
  description: string;
  relevantCareers: CareerPath[];
  requirements?: EducationLevel[];
}

export interface SideHustle {
  id: string;
  name: string;
  icon: string;
  description: string;
  incomeRange: { min: number; max: number };
  hoursPerWeek: number;
  startupCost: number;
  energyCost: number;
  stressIncrease: number;
  aiVulnerability: number;
  requiredCareerLevel?: number;
  requiredCareerPath?: CareerPath[];
  requiredEducation?: EducationCategory[];
  isActive?: boolean;
  monthsActive?: number;
  upgrades?: SideHustleUpgradeId[];
  milestones?: SideHustleMilestone[];
}

export type SideHustleUpgradeId = 'AUTOMATE' | 'HIRE_HELP' | 'MANUAL';

export interface SideHustleUpgradeEffects {
  incomeMultiplier?: number;
  passiveIncomeShare?: number;
  energyMultiplier?: number;
  stressMultiplier?: number;
}

export interface SideHustleUpgradeOption {
  id: SideHustleUpgradeId;
  label: string;
  description: string;
  cost: number;
  effects: SideHustleUpgradeEffects;
}

export interface SideHustleMilestone {
  monthsRequired: number;
  options: SideHustleUpgradeOption[];
}

export interface ScenarioOption {
  label: string;
  outcome: {
    cashChange?: number;
    // Adds a cash change based on current monthly salary (e.g., severance).
    // Example: cashChangeSalaryMonths: 2 -> +2 months of salary (computed at apply time).
    cashChangeSalaryMonths?: number;
    statChanges?: Partial<PlayerStats>;
    message: string;
    careerImpact?: number;
    addLiability?: Partial<Liability>;
    addAsset?: Partial<Asset>;
    marriageChange?: boolean;
    childChange?: number;
    startRelationship?: boolean;
    // Temporarily sets the player as unemployed (salary becomes $0) for N months.
    jobLossMonths?: number;
    negotiateType?: string;
    // Temporarily reduces income from a specific owned asset for N months.
    assetIncomeDisruption?: {
      assetId: string;
      months: number;
      incomeMultiplier: number;
      reason: string;
      recoveryTitle?: string;
      recoveryMessage?: string;
    };
    // Permanently adjusts a specific asset (value/cashflow).
    assetAdjustment?: {
      assetId: string;
      valueDelta?: number;
      valueMultiplier?: number;
      cashFlowDelta?: number;
      cashFlowMultiplier?: number;
    };
    followups?: { id: string; delayMonths?: number }[];
  };
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: LifeEventCategory;
  options: ScenarioOption[];
  tags?: string[];
  characterIds?: string[];
  cooldownMonths?: number;
  conditions?: {
    minMonth?: number;
    maxMonth?: number;
    minCash?: number;
    minNetWorth?: number;
    careers?: CareerPath[];
    aiDisruptionLevel?: number;
    requiresMarriage?: boolean;
    requiresChildren?: boolean;
    requiresVehicle?: boolean;
    maxOccurrences?: number;
  };
  weight?: number;
  isRecurring?: boolean;
  image?: string; // Optional image URL to display in scenario modal
}

export interface LifeEvent {
  id: string;
  month: number;
  title: string;
  description: string;
  type: LifeEventCategory | 'DECISION' | 'ACHIEVEMENT' | 'NEWS' | 'MILESTONE' | 'WARNING' | 'BANKRUPTCY';
  impact?: number;
}

export interface PlayerStats {
  happiness: number;
  health: number;
  energy: number;
  stress: number;
  networking: number;
  financialIQ: number;
  fulfillment: number;
}

export interface PlayerJob {
  title: string;
  salary: number;
  level: number;
  experience: number;
}

export interface PlayerCareer {
  path: CareerPath;
  title: string;
  salary: number;
  level: number;
  experience: number;
  skills: { [key: string]: number };
  aiVulnerability: number;
  futureProofScore: number;
}

export interface PlayerEducation {
  level: EducationLevel;
  degrees: string[];
  currentlyEnrolled?: {
    educationId: string;
    monthsRemaining: number;
    monthlyPayment: number;
  };
}

export interface Child {
  id: string;
  name: string;
  birthMonth: number;
  age: number;
  inSchool: boolean;
  inCollege: boolean;
  collegeStartMonth?: number;
}

export interface Spouse {
  name: string;
  income: number;
  careerPath: CareerPath;
  marriedMonth: number;
}

export interface Family {
  spouse?: Spouse;
  children: Child[];
  isEngaged: boolean;
  engagedMonth?: number;
  weddingCost?: number;
  inRelationship?: boolean;
  relationshipStartMonth?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  value: number;
  age: number;
  monthlyMaintenance: number;
  hasLoan: boolean;
  loanId?: string;
}

export interface AIDisruptionState {
  disruptionLevel: number;
  year: number;
  affectedIndustries: {
    [key in CareerPath]?: {
      jobLossPercent: number;
      salaryImpact: number;
      automationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
  };
}

export interface EconomyState {
  inflationRate: number;
  interestRate: number;
  unemploymentRate: number;
  marketTrend: MarketTrend;
  recession: boolean;
  recessionMonths: number;
  sectorPerformance: { [key: string]: number };
}

export interface MarketCycle {
  phase: MarketCyclePhase;
  monthsInPhase: number;
  intensity: number;
  nextPhaseIn: number;
}

export interface AssetIncomeDisruption {
  id: string;
  assetId: string;
  monthsRemaining: number;
  // Multiplier applied to the asset's total income (0 = no income, 0.5 = half income, etc).
  incomeMultiplier: number;
  reason: string;
  recoveryTitle?: string;
  recoveryMessage?: string;
}

export interface EventTracker {
  taxesPaidThisYear: boolean;
  lastTaxMonth: number;
  occurrences: { [eventId: string]: number };
  lastOccurrence: { [eventId: string]: number };
  lastEventMonth: number; // Track when last event fired for drought prevention
  recentEventIds?: string[];
}

export interface PrestigeData {
  lifetimeEarnings: number;
  totalGamesWon: number;
  fastestWin?: number;
  highestNetWorth: number;
  unlockedCharacters: string[];
}

export interface GameState {
  month: number;
  year: number;
  cash: number;
  assets: Asset[];
  liabilities: Liability[];
  mortgages: Mortgage[];
  lifestyle: Lifestyle;
  character: Character | null;
  difficulty: string;
  playerJob: PlayerJob;
  career: PlayerCareer | null;
  // When > 0, the player is temporarily unemployed and receives $0 salary for this many months.
  // Used by scenarios like layoffs / job loss.
  jobLossMonthsRemaining?: number;
  // Temporary disruptions to income from specific owned assets.
  assetIncomeDisruptions?: AssetIncomeDisruption[];
  education: PlayerEducation;
  activeSideHustles: SideHustle[];
  family: Family;
  vehicles: Vehicle[];
  stats: PlayerStats;
  events: LifeEvent[];
  eventTracker: EventTracker;
  economy: EconomyState;
  marketCycle: MarketCycle;
  aiDisruption: AIDisruptionState;
  pendingScenario: Scenario | null;
  eventQueue?: { id: string; minMonth: number }[];
  pendingSideHustleUpgrade?: {
    hustleId: string;
    milestoneIndex: number;
  } | null;
  hasWon: boolean;
  prestige: PrestigeData;
  spouseIncome: number;
  soundEnabled: boolean;
  netWorthHistory: { month: number; value: number }[];
  creditHistory?: CreditHistoryEntry[];
  creditLastChangeReasons?: string[];

  // ============================================
  // Monthly Actions (Adult mode)
  // ============================================
  // Actions are a small set of intentional choices players can take each month
  // before advancing time. They reset each month.
  monthlyActionsMax?: number;
  monthlyActionsRemaining?: number;

  // One-turn modifiers produced by monthly actions (consumed on the next "Next Month")
  tempSalaryBonus?: number; // additive dollars applied to salary for the next turn
  tempSideHustleMultiplier?: number; // multiplier applied to side hustle income for the next turn

  // ============================================
  // Goals / Quests (Adult mode)
  // ============================================
  quests?: QuestState;

  isBankrupt?: boolean;
  creditRating?: number; // 300-850, starts at 650
  missedPayments?: number;
  pendingNegotiation?: {
    originalEvent: Scenario;
    negotiationType: string;
    successChance: number;
  } | null;

  // ============================================
  // EQ COURSE (Upgrade EQ tab)
  // ============================================
  eqCourse?: EQCourseState;
  eqPerks?: EQPerksState;

  negotiationsCourse?: NegotiationsCourseState;
  negotiationsPerks?: NegotiationsPerksState;
  salesAcceleratorCourse?: SalesAcceleratorCourseState;
  compoundInterestCourse?: CompoundInterestCourseState;
  autoInvest?: AutoInvestSettings;
  lastMonthlyReport?: MonthlyReport;
}

export interface EQCourseState {
  // Number of failed full attempts (not questions) since last certification.
  failedAttempts: number;
  // Best score ever achieved (0-15).
  bestScore: number;
  // True once the player has achieved 100%.
  certified: boolean;
  // Reward is granted once per save to prevent farming.
  rewardClaimed: boolean;
}

export interface EQPerksState {
  // Multiplier applied to monthly career XP gain (default 1).
  careerXpMultiplier: number;
  // Carry used to keep XP integer-based for fractional multipliers.
  careerXpCarry: number;
}

export interface NegotiationsCourseState {
  failedAttempts: number;
  bestScore: number;
  certified: boolean;
  rewardClaimed: boolean;
}

export interface NegotiationsPerksState {
  // Applied to REAL_ESTATE + BUSINESS market transactions
  dealDiscountPct: number;
  saleBonusPct: number;
}

export interface SalesAcceleratorCourseState {
  failedAttempts: number;
  bestScore: number;
  certified: boolean;
  rewardClaimed: boolean;
}

export interface CompoundInterestCourseState {
  failedAttempts: number;
  bestScore: number;
  certified: boolean;
  rewardClaimed: boolean;
}

export interface AutoInvestAllocation {
  itemId: string;
  percent: number;
}

export interface AutoInvestSettings {
  enabled: boolean;
  maxPercent: number;
  allocations: AutoInvestAllocation[];
}

export interface MonthlyReport {
  income: number;
  expenses: number;
  netWorthChange: number;
  promoted: boolean;
  aiImpact?: string;
  taxesDue?: number;
  childExpenses?: number;
}

export interface CareerLevel {
  title: string;
  baseSalary: number;
  experienceRequired: number;
  educationRequired?: EducationLevel;
  educationCategory?: EducationCategory;
}

export interface CareerPathInfo {
  name: string;
  icon: string;
  levels: CareerLevel[];
  aiVulnerability: number;
  futureProofScore: number;
  specialMechanic?: string;
}

// ============================================
// MULTIPLAYER TYPES
// ============================================
export interface PlayerConfig {
  id: string;
  name: string;
  careerPath: CareerPath;
  difficulty: string;
  color: string;
  avatarEmoji: string;
  avatarImage?: string;
}

export interface MultiplayerState {
  players: PlayerConfig[];
  currentPlayerIndex: number;
  gameStates: { [playerId: string]: GameState };
  turnsPerRound: number;
  currentTurnInRound: number;
  gameStarted: boolean;
  winner: string | null;
}
