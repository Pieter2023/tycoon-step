import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { GameState, AssetType, MarketItem, Lifestyle, Character, Asset, SideHustle, EducationOption, Liability, PlayerConfig, MonthlyActionId, TABS, TabId, SideHustleUpgradeOption, EducationLevel, PlayerStats } from './types';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { INITIAL_GAME_STATE, CHARACTERS, DIFFICULTY_SETTINGS, CAREER_PATHS, LIFESTYLE_OPTS, MARKET_ITEMS, EDUCATION_OPTIONS, SIDE_HUSTLES, MORTGAGE_OPTIONS, AI_CAREER_IMPACT, FINANCIAL_FREEDOM_TARGET_MULTIPLIER, getInitialQuestState, getQuestById, ALL_LIFE_EVENTS, AUTO_INVEST_PRESETS } from './constants';
import { processTurn, calculateMonthlyCashFlowEstimate, applyScenarioOutcome, calculateNetWorth, createMortgage, getEducationSalaryMultiplier, applyMonthlyAction, getQuestProgress, updateQuests, claimQuestReward, getCreditTier, checkPromotion } from './services/gameLogic';
import { playMoneyGain, playMoneyLoss, playClick, playPurchase, playSell, playAchievement, playLevelUp, playVictory, playWarning, playTick, playNotification, playError, setMuted } from './services/audioService';
import {
  saveAdultGame,
  loadAdultGame,
  getSaveSummaries,
  getSaveSummary,
  deleteSaveSlot,
  renameSaveSlot,
  exportSaveSlot,
  importSavePayload,
  SaveSlotId,
  SaveSummary
} from './services/storageService';
import confetti from 'canvas-confetti';
import { useI18n, formatCurrencyCompactValue, formatCurrencyValue, formatPercentValue, formatDateTimeValue } from './i18n';
import { DEFAULT_TAB_UI_STATE, hydrateTabUiState, TabUiState } from './services/tabState';
import { GLOSSARY_ENTRIES, QUIZ_DEFINITIONS, getQuizDefinition } from './data/learning';

import TabErrorBoundary from './components/TabErrorBoundary';
import Modal from './components/Modal';
import QuestLog from './components/QuestLog';
import { Button, Badge, Card, Tooltip } from './components/ui';
import type { AppShellNavItem } from './components/ui/AppShell';
import CustomAvatarBuilder, { CustomAvatarResult } from './components/customAvatar/CustomAvatarBuilder';
import HelpDrawer from './components/HelpDrawer';
import DashboardWidget from './components/DashboardWidget';
import SelfLearnTab from './components/tabs/SelfLearnTab';
import { MoneyPageLayout } from './components/v2/MoneyPage';
import { CareerPageLayout } from './components/v2/CareerPage';
import { LearnPageLayout } from './components/v2/LearnPage';
import { LifePageLayout } from './components/v2/LifePage';
import ActionsDrawer from './components/v2/ActionsDrawer';
import MobileShell from './components/v2/MobileShell';
import SidebarShell from './components/v2/SidebarShell';
import DashboardScreen from './components/v2/DashboardScreen';
import ActionsScreen from './components/v2/ActionsScreen';
import ProfileScreen from './components/v2/ProfileScreen';
import MoreScreen from './components/v2/MoreScreen';


import { getMonthlyActionsSummary } from './services/monthlyActions';

import {
  Play, Pause, FastForward, TrendingUp, DollarSign, Home, Briefcase,
  GraduationCap, Heart, PiggyBank, LineChart, AlertTriangle, CheckCircle,
  X, Clock, Wallet, ArrowUpRight, ArrowDownRight, Sparkles, Volume2, VolumeX,
  Bot, CreditCard, Coffee, Banknote, Plus, Minus, Save as SaveIcon, FolderOpen as FolderOpenIcon, Trash2,
  Users, BookOpen, Zap, HeartPulse, Trophy, Info, Settings, MoreHorizontal,
  ChevronLeft, ChevronRight, LogOut, User, Landmark
} from 'lucide-react';

const OverviewTab = lazy(() => import('./components/tabs/OverviewTab'));
const InvestTab = lazy(() => import('./components/tabs/InvestTab'));
const PortfolioTab = lazy(() => import('./components/tabs/PortfolioTab'));
const BankTab = lazy(() => import('./components/tabs/BankTab'));
const CareerTab = lazy(() => import('./components/tabs/CareerTab'));
const EducationTab = lazy(() => import('./components/tabs/EducationTab'));
const SideHustlesTab = lazy(() => import('./components/tabs/SideHustlesTab'));
const LifestyleTab = lazy(() => import('./components/tabs/LifestyleTab'));

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });

const formatPercent = (val: number): string => formatPercentValue(val, 1);

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const TAB_SHORTCUTS: Partial<Record<TabId, string>> = {
  [TABS.INVEST]: 'I',
  [TABS.ASSETS]: 'P',
  [TABS.BANK]: 'B',
  [TABS.CAREER]: 'C',
  [TABS.EDUCATION]: 'E',
  [TABS.SIDEHUSTLE]: 'S',
  [TABS.LIFESTYLE]: 'L'
};

const getAssetIcon = (type: AssetType) => {
  const icons: Record<AssetType, string> = {
    [AssetType.STOCK]: '📈', [AssetType.INDEX_FUND]: '📊', [AssetType.BOND]: '📜',
    [AssetType.REAL_ESTATE]: '🏠', [AssetType.BUSINESS]: '🏪', [AssetType.CRYPTO]: '₿',
    [AssetType.COMMODITY]: '🥇', [AssetType.SAVINGS]: '🏦'
  };
  return icons[type] || '💰';
};

const getOpsUpgradeCost = (asset: Asset) => {
  const qty = asset.quantity || 1;
  return Math.max(750, Math.round(asset.value * qty * 0.06));
};

type CashFlowHistoryEntry = {
  month: number;
  income: number;
  expenses: number;
};

type AiDisruptionHistoryEntry = {
  month: number;
  level: number;
};

const getBusinessIncomeRange = (asset: Asset) => {
  const qty = asset.quantity || 1;
  const baseIncome = Math.max(0, asset.cashFlow || 0) * qty;
  const volatility = asset.volatility ?? 0;
  const opsFactor = asset.opsUpgrade ? 0.6 : 1;
  const swing = volatility * 0.6 * opsFactor;
  const minMult = clamp(1 - swing, 0.55, 1.45);
  const maxMult = clamp(1 + swing, 0.55, 1.45);
  return {
    min: Math.round(baseIncome * minMult),
    max: Math.round(baseIncome * maxMult)
  };
};

const getNextHustleMilestone = (hustle: SideHustle) => {
  const milestones = hustle.milestones || [];
  const nextIndex = (hustle.upgrades || []).length;
  const milestone = milestones[nextIndex];
  return milestone ? { milestone, index: nextIndex } : null;
};

const getHustleUpgradeLabel = (hustle: SideHustle, index: number, optionId?: string) => {
  if (!optionId) return null;
  const milestone = hustle.milestones?.[index];
  const option = milestone?.options.find(opt => opt.id === optionId);
  return option?.label || optionId;
};

const formatUpgradeEffects = (option: SideHustleUpgradeOption) => {
  const effects = option.effects || {};
  const parts: string[] = [];
  if (typeof effects.incomeMultiplier === 'number') {
    const pct = Math.round((effects.incomeMultiplier - 1) * 100);
    if (pct !== 0) parts.push(`Income ${pct > 0 ? '+' : ''}${pct}%`);
  }
  if (typeof effects.passiveIncomeShare === 'number' && effects.passiveIncomeShare > 0) {
    parts.push(`Passive ${Math.round(effects.passiveIncomeShare * 100)}%`);
  }
  if (typeof effects.energyMultiplier === 'number') {
    const pct = Math.round((effects.energyMultiplier - 1) * 100);
    if (pct !== 0) parts.push(`Energy ${pct}%`);
  }
  if (typeof effects.stressMultiplier === 'number') {
    const pct = Math.round((effects.stressMultiplier - 1) * 100);
    if (pct !== 0) parts.push(`Stress ${pct}%`);
  }
  return parts.length > 0 ? parts.join(' • ') : 'No change';
};

type TurnPreviewLine = { label: string; value: number };

type TurnPreviewData = {
  nextMonth: number;
  nextYear: number;
  monthOfYear: number;
  incomeLines: TurnPreviewLine[];
  expenseLines: TurnPreviewLine[];
  income: number;
  expenses: number;
  netChange: number;
  projectedEndCash: number;
  shortfall: number;
  warningLevel: 'SAFE' | 'LOW_BUFFER' | 'SHORTFALL';
};

type ConfirmDialogConfig = {
  title: string;
  description: string;
  details?: { label: string; value: string }[];
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

type AccessibilityPrefs = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  disableConfetti: boolean;
  disableVideoPreload: boolean;
};

// ============================================
// COACH UI (Step 12)
// ============================================
type CoachTarget =
  | 'monthly-actions'
  | 'lifestyle-grid'
  | 'assets-sell'
  | 'sidehustles-list'
  | 'bank-loans'
  | 'self-learn-tab';

type CoachHintData = {
  id: string;
  tabId: TabId;
  title: string;
  message: string;
  target?: CoachTarget;
  allowReopenPreview?: boolean;
};

const getRiskColor = (risk: string) => {
  const colors: Record<string, string> = {
    'VERY_LOW': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'LOW': 'bg-green-500/20 text-green-400 border-green-500/30',
    'MEDIUM': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'VERY_HIGH': 'bg-red-500/20 text-red-400 border-red-500/30',
    'EXTREME': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };
  return colors[risk] || 'bg-slate-500/20 text-slate-400';
};

const getTierColor = (tier: string) => {
  const colors: Record<string, string> = {
    'STARTER': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    'MID': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'ADVANCED': 'bg-violet-500/20 text-violet-300 border-violet-500/30'
  };
  return colors[tier] || 'bg-slate-500/20 text-slate-400';
};

const getRiskRating = (item: MarketItem): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (item.riskRating) return item.riskRating;
  if (item.risk === 'VERY_LOW' || item.risk === 'LOW') return 'LOW';
  if (item.risk === 'MEDIUM') return 'MEDIUM';
  return 'HIGH';
};

const getItemTier = (item: MarketItem): 'STARTER' | 'MID' | 'ADVANCED' => {
  if (item.tier) return item.tier;
  if (item.price <= 5000) return 'STARTER';
  if (item.price <= 25000) return 'MID';
  return 'ADVANCED';
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

const getAIRiskColor = (risk: string) => {
  const colors: Record<string, string> = {
    'LOW': 'text-emerald-400', 'MEDIUM': 'text-amber-400',
    'HIGH': 'text-orange-400', 'CRITICAL': 'text-red-400'
  };
  return colors[risk] || 'text-slate-400';
};

const clampStatValue = (value: number) => Math.max(0, Math.min(100, value));

const getCreditTierColor = (tier: ReturnType<typeof getCreditTier>) => {
  const colors: Record<string, string> = {
    EXCELLENT: 'text-emerald-400',
    GOOD: 'text-emerald-300',
    FAIR: 'text-amber-400',
    POOR: 'text-red-400'
  };
  return colors[tier] || 'text-slate-400';
};

// ============================================
// LOAN OPTIONS
// ============================================
const LOAN_OPTIONS = [
  { id: 'emergency', name: 'Emergency Loan', amount: 2000, rate: 0.15, term: 12, description: 'Quick cash for emergencies' },
  { id: 'personal_small', name: 'Small Personal Loan', amount: 5000, rate: 0.12, term: 24, description: 'For minor expenses' },
  { id: 'personal_medium', name: 'Medium Personal Loan', amount: 10000, rate: 0.10, term: 36, description: 'For larger purchases' },
  { id: 'personal_large', name: 'Large Personal Loan', amount: 25000, rate: 0.09, term: 48, description: 'Major life expenses' },
  { id: 'business', name: 'Business Loan', amount: 50000, rate: 0.08, term: 60, description: 'Start or expand a business' },
];

type LoanOption = typeof LOAN_OPTIONS[number];
type AdjustedLoanOption = LoanOption & { baseRate: number; baseAmount: number; perkLabel?: string };

const getCreditRateAdjustment = (creditScore: number) => {
  const tier = getCreditTier(creditScore);
  if (tier === 'EXCELLENT') return -0.015;
  if (tier === 'GOOD') return -0.0075;
  if (tier === 'FAIR') return 0;
  return 0.02;
};

const getCreditDownPaymentAdjustment = (creditScore: number) => {
  const tier = getCreditTier(creditScore);
  if (tier === 'EXCELLENT') return -2;
  if (tier === 'GOOD') return 0;
  if (tier === 'FAIR') return 2;
  return 5;
};

const getLoanApprovalChance = (creditScore: number, dti: number) => {
  const tier = getCreditTier(creditScore);
  let chance = tier === 'EXCELLENT' ? 0.95 : tier === 'GOOD' ? 0.9 : tier === 'FAIR' ? 0.75 : 0.6;
  if (dti >= 0.6) chance -= 0.2;
  if (dti >= 0.4 && dti < 0.6) chance -= 0.1;
  return Math.max(0.2, Math.min(0.98, chance));
};

const getMortgageApprovalChance = (creditScore: number, dti: number) => {
  const tier = getCreditTier(creditScore);
  let chance = tier === 'EXCELLENT' ? 0.92 : tier === 'GOOD' ? 0.85 : tier === 'FAIR' ? 0.65 : 0.5;
  if (dti >= 0.6) chance -= 0.25;
  if (dti >= 0.4 && dti < 0.6) chance -= 0.12;
  return Math.max(0.15, Math.min(0.95, chance));
};

const getMortgageCreditAdjustments = (creditScore: number, optionId: string, dti: number) => {
  const downPaymentPercentDelta = getCreditDownPaymentAdjustment(creditScore);
  const rateAdjustment = getCreditRateAdjustment(creditScore) * 0.6;
  const minScore = optionId.includes('investment') ? 680 : optionId.includes('conventional') ? 620 : 580;
  const approvalChance = getMortgageApprovalChance(creditScore, dti);
  return { downPaymentPercentDelta, rateAdjustment, minScore, approvalChance };
};

type MortgagePreview = {
  id: string;
  name: string;
  description: string;
  minScore: number;
  incomeRequirement?: number;
  netWorthRequirement?: number;
  down: number;
  loanAmount: number;
  rate: number;
  payment: number;
  rentIncome: number;
  maintenance: number;
  cashflowImpact: number;
  approvalChance: number;
  canAfford: boolean;
  meetsIncomeReq: boolean;
  meetsNetWorthReq: boolean;
  meetsCreditReq: boolean;
};

const estimatePropertyMaintenance = (price: number) =>
  Math.max(0, Math.round(price * 0.01 / 12));

const buildMortgagePreview = ({
  item,
  optId,
  price,
  creditScore,
  dti,
  cashFlow,
  netWorth,
  baseRate,
  cash
}: {
  item: MarketItem;
  optId: string;
  price: number;
  creditScore: number;
  dti: number;
  cashFlow: ReturnType<typeof calculateMonthlyCashFlowEstimate>;
  netWorth: number;
  baseRate: number;
  cash: number;
}): MortgagePreview | null => {
  const opt = MORTGAGE_OPTIONS.find(o => o.id === optId);
  if (!opt) return null;
  const creditAdjust = getMortgageCreditAdjustments(creditScore, optId, dti);
  const adjustedDownPercent = Math.max(3.5, Math.min(40, opt.downPaymentPercent + creditAdjust.downPaymentPercentDelta));
  const down = Math.round(price * adjustedDownPercent / 100);
  const loanAmount = Math.max(0, price - down);
  const rate = baseRate + opt.interestRateSpread + creditAdjust.rateAdjustment;
  const payment = calculateLoanPayment(loanAmount, rate, opt.termYears * 12);
  const rentIncome = Math.round((item.expectedYield * price) / 12);
  const maintenance = estimatePropertyMaintenance(price);
  const cashflowImpact = Math.round(rentIncome - payment - maintenance);
  const meetsIncomeReq = !opt.requirements?.income || cashFlow.income >= opt.requirements.income;
  const meetsNetWorthReq = !opt.requirements?.netWorth || netWorth >= opt.requirements.netWorth;
  const meetsCreditReq = creditScore >= creditAdjust.minScore;
  const canAfford = cash >= down && meetsIncomeReq && meetsNetWorthReq && meetsCreditReq;

  return {
    id: optId,
    name: opt.name,
    description: opt.description,
    minScore: creditAdjust.minScore,
    incomeRequirement: opt.requirements?.income,
    netWorthRequirement: opt.requirements?.netWorth,
    down,
    loanAmount,
    rate,
    payment,
    rentIncome,
    maintenance,
    cashflowImpact,
    approvalChance: creditAdjust.approvalChance,
    canAfford,
    meetsIncomeReq,
    meetsNetWorthReq,
    meetsCreditReq
  };
};

const adjustLoanOption = (loan: LoanOption, careerLevel: number, creditScore: number, dti: number): AdjustedLoanOption => {
  let rateDiscount = 0;
  let amountMultiplier = 1;
  let perkLabel: string | undefined;

  if (careerLevel >= 4) {
    rateDiscount = 0.015;
    amountMultiplier = 1.15;
    perkLabel = 'Promotion perk: lower APR + higher limit';
  } else if (careerLevel >= 2) {
    rateDiscount = 0.0075;
    amountMultiplier = 1.05;
    perkLabel = 'Promotion perk: lower APR';
  }

  return {
    ...loan,
    baseRate: loan.rate,
    baseAmount: loan.amount,
    rate: Math.max(0.02, loan.rate - rateDiscount + getCreditRateAdjustment(creditScore)),
    amount: Math.round(loan.amount * amountMultiplier),
    perkLabel
  };
};

// ============================================
// TAB INTRO VIDEOS (config-driven onboarding popups)
// ============================================
const INVEST_INTRO_VIDEO_STORAGE_KEY = 'tycoon_seen_invest_intro_video_v2';
const INVEST_INTRO_VIDEO_SRC = '/videos/investment-types-explained.mp4';

const PORTFOLIO_INTRO_VIDEO_STORAGE_KEY = 'tycoon_seen_overview_intro_video_v1';
const PORTFOLIO_INTRO_VIDEO_SRC = '/videos/master-your-game-portfolio.mp4';
const PORTFOLIO_INTRO_VIDEO_POSTER = '/images/financial-planner-poster-16x9.jpg';

const CAREER_INTRO_VIDEO_STORAGE_KEY = 'tycoon_seen_career_intro_video_v1';
const CAREER_INTRO_VIDEO_SRC = '/videos/climb-your-career.mp4';

const BANK_INTRO_VIDEO_STORAGE_KEY = 'tycoon_seen_bank_intro_video_v1';
const BANK_INTRO_VIDEO_SRC = '/videos/bank-tab-guide-tycoon.mp4';

const SIDE_HUSTLE_INTRO_VIDEO_STORAGE_KEY = 'tycoon_seen_side_hustle_intro_video_v1';
const SIDE_HUSTLE_INTRO_VIDEO_SRC = '/videos/side-hustle-updated-tycoon.mp4';

const EDUCATION_INTRO_VIDEO_STORAGE_KEY = 'tycoon_seen_education_intro_video_v4';
const EDUCATION_INTRO_VIDEO_SRC = '/videos/education-tab-updated-tycoon.mp4';

const NEGOTIATIONS_INTRO_VIDEO_STORAGE_KEY = 'tycoon_seen_negotiations_intro_video_v1';
const NEGOTIATIONS_INTRO_VIDEO_SRC = '/videos/tycoon-master-negotiations.mp4';

const QUICK_TUTORIAL_STORAGE_KEY = 'tycoon_quick_tutorial_seen_v1';
const QUICK_TUTORIAL_SRC = '/videos/quick-tutorial.mov';

const AUTO_TUTORIAL_POPUPS_STORAGE_KEY = 'tycoon_auto_tutorial_popups_v1';
const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';
const HIDE_TIPS_STORAGE_KEY = 'tycoon_hide_tips_v1';
const CASH_FLOW_HISTORY_STORAGE_KEY = 'tycoon_cash_flow_history_v1_';
const AI_DISRUPTION_HISTORY_STORAGE_KEY = 'tycoon_ai_disruption_history_v1_';
const AUTOPLAY_PREF_PREFIX = 'tycoon_autoplay_pref_v1_';
const UI_V2_STORAGE_KEY = 'tycoon_ui_v2';

const normalizeFlag = (value?: string | null) => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const readUiV2Preference = () => {
  try {
    const stored = localStorage.getItem(UI_V2_STORAGE_KEY);
    if (stored !== null) return normalizeFlag(stored);
  } catch (e) {
    // Ignore localStorage access errors.
  }
  return normalizeFlag(import.meta.env.VITE_UI_V2);
};
const LAST_SAVE_SLOT_STORAGE_KEY = 'tycoon_last_save_slot_v1';
const SELF_LEARN_HINT_STORAGE_KEY = 'tycoon_self_learn_hint_v1';
const AUTOPLAY_SPEED_OPTIONS = [1000, 500, 250];
const AUTOPLAY_SPEED_LABELS: Record<number, string> = {
  1000: '1x',
  500: '2x',
  250: '4x'
};

const resolveSaveSlot = (raw: string | null): SaveSlotId => {
  if (raw === 'autosave' || raw === 'slot1' || raw === 'slot2' || raw === 'slot3') return raw;
  return 'autosave';
};

const readAutoplayPreference = (slotId: SaveSlotId): number | null => {
  try {
    const raw = localStorage.getItem(`${AUTOPLAY_PREF_PREFIX}${slotId}`);
    if (!raw || raw === 'off') return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return AUTOPLAY_SPEED_OPTIONS.includes(parsed) ? parsed : AUTOPLAY_SPEED_OPTIONS[0];
  } catch (e) {
    console.warn('Failed to read autoplay preference:', e);
    return null;
  }
};

type TabIntroVideoConfig = {
  storageKey: string;
  src: string;
  captionsSrc?: string;
  poster?: string;
  title: string;
  duration?: string;
  description: string;
  quickTips?: string[];
  transcript?: string[];
  icon?: React.ReactNode;
  continueLabel?: string;
  continueToTab?: TabId;
};

type MarketSpecialAction =
  | {
    type: 'BUY_DISCOUNT';
    budget: number;
    discount: number; // e.g. 0.3 = 30% off
    title: string;
    description: string;
    allowedTypes?: AssetType[];
  }
  | {
    type: 'PANIC_SELL';
    discount: number; // e.g. 0.3 = 30% fire-sale haircut
    title: string;
    description: string;
  };

// NOTE: Add future tab videos by extending this config (tab id -> src/poster/storage key)
const TAB_INTRO_VIDEO_CONFIG: Partial<Record<TabId, TabIntroVideoConfig>> = {
  [TABS.INVEST]: {
    storageKey: INVEST_INTRO_VIDEO_STORAGE_KEY,
    src: INVEST_INTRO_VIDEO_SRC,
    captionsSrc: '/videos/investment-types-explained.vtt',
    title: 'Investment Types Explained',
    duration: '3:12',
    description: 'A quick explainer to help you pick smarter investments in the game.',
    quickTips: [
      'Index funds are low risk and steady; use them to stabilize cashflow.',
      'Businesses and real estate can boost passive income, but watch debt.',
      'Diversify so one sector crash does not wreck your month.',
      'Watch inflation: asset prices rise over time.'
    ],
    transcript: [
      'Welcome to investing: savings, bonds, index funds, stocks, real estate, and businesses.',
      'Start with stable cashflow before chasing high-risk returns.',
      'Diversification protects you from sector shocks and AI disruption.',
      'Inflation pushes prices up over time, so plan your timing.'
    ],
    icon: <BookOpen size={18} className="text-emerald-300" />,
    continueLabel: 'Continue to Invest'
  },
  [TABS.ASSETS]: {
    storageKey: PORTFOLIO_INTRO_VIDEO_STORAGE_KEY,
    src: PORTFOLIO_INTRO_VIDEO_SRC,
    captionsSrc: '/videos/master-your-game-portfolio.vtt',
    poster: PORTFOLIO_INTRO_VIDEO_POSTER,
    title: 'Master Your Game: Portfolio',
    duration: '2:48',
    description: 'A quick walkthrough so you know exactly what to track — and what to do next.',
    quickTips: [
      'Sort by cashflow first if you need monthly stability.',
      'Check equity before selling mortgaged assets.',
      'Review price history to spot trends, not just spikes.',
      'Look for AI disruption risk flags.'
    ],
    transcript: [
      'Your portfolio shows value, cashflow, equity, and risk signals.',
      'Use cashflow to stabilize monthly expenses before expanding.',
      'Check equity and mortgages before selling assets.',
      'Price history helps you see long-term direction, not just noise.'
    ],
    icon: <Wallet size={18} className="text-emerald-300" />,
    continueLabel: 'Continue to Overview',
    continueToTab: TABS.OVERVIEW
  },
  [TABS.CAREER]: {
    storageKey: CAREER_INTRO_VIDEO_STORAGE_KEY,
    src: CAREER_INTRO_VIDEO_SRC,
    captionsSrc: '/videos/climb-your-career.vtt',
    title: 'Climb Your Career',
    duration: '2:40',
    description: 'A quick walkthrough to help you choose a career path and grow your income.',
    quickTips: [
      'Salary grows with promotions and relevant education.',
      'Manage stress and happiness to improve promotion odds.',
      'Use networking actions for faster growth.'
    ],
    transcript: [
      'Career growth comes from experience, promotions, and education.',
      'Lower stress and higher happiness improve promotion odds.',
      'Networking builds long-term leverage and faster raises.'
    ],
    icon: <Briefcase size={18} className="text-emerald-300" />,
    continueLabel: 'Continue to Career'
  },
  [TABS.BANK]: {
    storageKey: BANK_INTRO_VIDEO_STORAGE_KEY,
    src: BANK_INTRO_VIDEO_SRC,
    captionsSrc: '/videos/bank-tab-guide-tycoon.vtt',
    title: 'Bank Tab Guide',
    duration: '2:25',
    description: 'A quick walkthrough of loans, repayments, and how to keep your cashflow healthy.',
    quickTips: [
      'Loans add cash now but increase monthly expenses.',
      'Check total interest before you accept.',
      'Keep an emergency buffer to avoid forced sales.'
    ],
    transcript: [
      'Loans add cash today but reduce monthly flexibility.',
      'Compare APR, term length, and total interest before accepting.',
      'Keep a buffer so you never miss payments.'
    ],
    icon: <PiggyBank size={18} className="text-emerald-300" />,
    continueLabel: 'Continue to Bank'
  },
  [TABS.EDUCATION]: {
    storageKey: EDUCATION_INTRO_VIDEO_STORAGE_KEY,
    src: EDUCATION_INTRO_VIDEO_SRC,
    captionsSrc: '/videos/education-tab-updated-tycoon.vtt',
    title: 'Education Tab Guide',
    duration: '3:05',
    description: 'A quick walkthrough to help you upgrade your skills, increase income potential, and plan your next steps.',
    quickTips: [
      'Only relevant degrees boost salary for your path.',
      'Check prerequisites before enrolling.',
      'Big programs may require a student loan.'
    ],
    transcript: [
      'Education raises salary when aligned to your career path.',
      'Check prerequisites and total cost before enrolling.',
      'Use loans carefully; payback depends on your salary delta.'
    ],
    icon: <GraduationCap size={18} className="text-emerald-300" />,
    continueLabel: 'Continue to Education'
  },
  [TABS.SIDEHUSTLE]: {
    storageKey: SIDE_HUSTLE_INTRO_VIDEO_STORAGE_KEY,
    src: SIDE_HUSTLE_INTRO_VIDEO_SRC,
    captionsSrc: '/videos/side-hustle-updated-tycoon.vtt',
    title: 'Side Hustles Tab Guide',
    duration: '2:15',
    description: 'A quick walkthrough to help you start side hustles and boost your monthly cashflow.',
    quickTips: [
      'Side hustles trade energy for cashflow.',
      'AI risk reduces earnings as disruption rises.',
      'Stack 1-2 low-risk hustles early.'
    ],
    transcript: [
      'Side hustles add income but cost energy and stress.',
      'Choose low-risk options early for stability.',
      'Watch AI disruption levels over time.'
    ],
    icon: <Coffee size={18} className="text-emerald-300" />,
    continueLabel: 'Continue to Side Hustles'
  },
  [TABS.NEGOTIATIONS]: {
    storageKey: NEGOTIATIONS_INTRO_VIDEO_STORAGE_KEY,
    src: NEGOTIATIONS_INTRO_VIDEO_SRC,
    captionsSrc: '/videos/tycoon-master-negotiations.vtt',
    title: 'Master Negotiations',
    duration: '2:05',
    description: 'Unlock deal-making perks and a $50,000 bonus (100% required).',
    quickTips: [
      'Complete every module to unlock the bonus.',
      'Negotiation boosts help across multiple tabs.',
      'Track progress so you do not miss the reward.'
    ],
    transcript: [
      'Negotiation mastery improves deals and raises success odds.',
      'Complete every module to unlock the bonus.',
      'Use negotiation perks across loans, assets, and careers.'
    ],
    icon: <Users size={18} className="text-emerald-300" />,
    continueLabel: 'Continue to Master Negotiations'
  }
};

// Calculate loan payment
const calculateLoanPayment = (principal: number, annualRate: number, termMonths: number): number => {
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return Math.round(principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1));
};

// ============================================
// FLOATING NUMBER COMPONENT
// ============================================
const FloatingNumber: React.FC<{ value: number; onComplete: () => void }> = ({ value, onComplete }) => {
  useEffect(() => { const t = setTimeout(onComplete, 1500); return () => clearTimeout(t); }, [onComplete]);
  return (
    <motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -80 }} transition={{ duration: 1.5 }}
      className={`fixed z-50 font-bold text-3xl pointer-events-none left-1/2 top-1/4 -translate-x-1/2 gpu-hint ${value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {value >= 0 ? '+' : ''}{formatMoney(value)}
    </motion.div>
  );
};

const TabLoading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
    Loading {label}...
  </div>
);




const InfoTip: React.FC<{ text: string; id?: string }> = ({ text }) => (
  <div className="group relative inline-flex items-center justify-center ml-1">
    <div className="text-slate-500 hover:text-slate-300 cursor-help">
      <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">?</div>
    </div>
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-center border border-slate-700">
      {text}
    </div>
  </div>
);

// ============================================
// MAIN APP COMPONENT
// ============================================
interface AppProps {
  onBackToMenu?: () => void;
  initialGameState?: GameState;
  playerConfig?: PlayerConfig;
  isMultiplayer?: boolean;
  onTurnComplete?: (newState: GameState) => void;
}

const createTabUiStateMap = (): Record<TabId, TabUiState> =>
  Object.values(TABS).reduce((acc, tabId) => {
    acc[tabId] = { ...DEFAULT_TAB_UI_STATE };
    return acc;
  }, {} as Record<TabId, TabUiState>);

const App: React.FC<AppProps> = ({ onBackToMenu, initialGameState, playerConfig, isMultiplayer, onTurnComplete }) => {
  const { t, locale, setLocale, formatNumber } = useI18n();
  const renderStart = import.meta.env.DEV ? performance.now() : 0;
  const isResumingFromSave = !isMultiplayer && !!initialGameState && !!initialGameState.character;
  const [gameStarted, setGameStarted] = useState(isMultiplayer ? true : isResumingFromSave);
  const [gameState, setGameState] = useState<GameState>(() => {
    const base: any = initialGameState || INITIAL_GAME_STATE;
    return {
      ...base,
      assets: base.assets ?? [],
      liabilities: base.liabilities ?? [],
      mortgages: base.mortgages ?? [],
      events: base.events ?? [],
      activeSideHustles: base.activeSideHustles ?? [],
      netWorthHistory: base.netWorthHistory ?? [],
      vehicles: base.vehicles ?? [],
    } as GameState;
  });
  const [multiplayerTurnsTaken, setMultiplayerTurnsTaken] = useState(0);
  const MULTIPLAYER_TURNS_PER_ROUND = 3; // Each player takes 3 months per turn
  const [isProcessing, setIsProcessing] = useState(false);
  const initialSaveSlot = (() => {
    try {
      return resolveSaveSlot(localStorage.getItem(LAST_SAVE_SLOT_STORAGE_KEY));
    } catch (e) {
      console.warn('Failed to read save slot preference:', e);
      return 'autosave';
    }
  })();
  const [currentSaveSlot, setCurrentSaveSlot] = useState<SaveSlotId>(initialSaveSlot);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<number | null>(() => readAutoplayPreference(initialSaveSlot));
  const cashFlowHistoryStorageKey = `${CASH_FLOW_HISTORY_STORAGE_KEY}${currentSaveSlot}`;
  const aiDisruptionHistoryStorageKey = `${AI_DISRUPTION_HISTORY_STORAGE_KEY}${currentSaveSlot}`;
  const [cashFlowHistory, setCashFlowHistory] = useState<CashFlowHistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(`${CASH_FLOW_HISTORY_STORAGE_KEY}${initialSaveSlot}`);
      return raw ? (JSON.parse(raw) as CashFlowHistoryEntry[]) : [];
    } catch (e) {
      console.warn('Failed to read cash flow history:', e);
      return [];
    }
  });
  const [aiDisruptionHistory, setAiDisruptionHistory] = useState<AiDisruptionHistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(`${AI_DISRUPTION_HISTORY_STORAGE_KEY}${initialSaveSlot}`);
      return raw ? (JSON.parse(raw) as AiDisruptionHistoryEntry[]) : [];
    } catch (e) {
      console.warn('Failed to read AI disruption history:', e);
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<TabId>(TABS.OVERVIEW);

  // ============================================
  // MISSING HANDLERS & STATE (Recovered)
  // ============================================
  const [isMuted, setIsMuted] = useState(false);
  const toggleMute = () => setIsMuted(prev => !prev);
  const [showSettings, setShowSettings] = useState(false);
  const [showReopenPreviewPill, setShowReopenPreviewPill] = useState(false);
  const [showTurnPreview, setShowTurnPreview] = useState(false);

  const [investmentFilter, setInvestmentFilter] = useState<any>('ALL');
  const [investmentTierFilter, setInvestmentTierFilter] = useState<any>('ALL');
  const [investmentSearch, setInvestmentSearch] = useState('');
  const [batchBuyMode, setBatchBuyMode] = useState(false);
  const toggleBatchBuyMode = (item?: any) => setBatchBuyMode(prev => !prev);
  const [batchBuyQuantities, setBatchBuyQuantities] = useState<Record<string, number>>({});
  const [autoInvest, setAutoInvest] = useState<any>({ enabled: false, maxPercent: 0, allocations: [] });
  const updateAutoInvest = (val: any) => setAutoInvest(val);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showMortgageModal, setShowMortgageModal] = useState(false);
  const [selectedMortgage, setSelectedMortgage] = useState<string | null>(null);
  const [showSideHustleUpgradeModal, setShowSideHustleUpgradeModal] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Derived Helpers
  const activeQuiz = activeQuizId ? getQuizDefinition(activeQuizId) : null;
  /* FILTER INVESTMENTS */
  const filteredInvestments = useMemo(() => {
    let items = MARKET_ITEMS;
    if (investmentFilter !== 'ALL') {
      items = items.filter(i => i.type === investmentFilter);
    }
    if (investmentTierFilter !== 'ALL') {
      // Simplified tier filtering for restoration
      items = items.filter(i => {
        if (investmentTierFilter === 'STARTER') return i.price < 5000;
        if (investmentTierFilter === 'MID') return i.price >= 5000 && i.price < 50000;
        if (investmentTierFilter === 'ADVANCED') return i.price >= 50000;
        return true;
      });
    }
    if (investmentSearch) {
      const q = investmentSearch.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return items;
  }, [investmentFilter, investmentSearch, investmentTierFilter]);
  const isBatchBuyEligible = (item: any) => true;
  const setBatchQty = (id: string, qty: number) => setBatchBuyQuantities(prev => ({ ...prev, [id]: qty }));
  const batchBuyCart = useMemo(() => ({ totalUnits: 0, totalCost: 0, canAfford: true, lines: [] }), []);
  const openBatchBuyConfirm = () => { };
  const clearBatchBuyCart = () => setBatchBuyQuantities({});
  const adjustedLoanOptions = useMemo(() => [], []);

  // Action Handlers
  const handleBuyAsset = (asset: any) => console.log('Buy default', asset);
  const handleSellAsset = (asset: any) => console.log('Sell default', asset);
  const handleBusinessOpsUpgrade = () => { };
  const handleRefinanceMortgage = () => { };
  const handlePayDebt = () => { };
  const handleTakeLoan = () => { };
  const handleManualPromotion = () => { };
  const handleEnrollEducation = () => { };
  const handleStartSideHustle = () => { };
  const handleStopSideHustle = () => { };
  const handleChangeLifestyle = () => { };

  const handleClaimQuest = (questId: string) => { console.log('Claiming quest', questId); };
  const handleSelectQuizAnswer = () => { };
  const handleSubmitQuiz = () => { };
  const markQuizSeen = (id?: string) => { };

  // Coach & Event Lab
  const [coachHint, setCoachHint] = useState<any>(null);
  const coachMonthlyActionsRef = useRef<any>(null);
  const coachLifestyleGridRef = useRef<any>(null);
  const coachBankLoansRef = useRef(null);
  const coachSideHustlesRef = useRef(null);
  const [coachHighlightTarget, setCoachHighlightTarget] = useState<string | null>(null);
  const coachHighlight = (target: string) => (coachHighlightTarget === target ? 'ring-2 ring-emerald-400/40' : '');

  const [showEventLab, setShowEventLab] = useState(false);
  const [eventLabEventId, setEventLabEventId] = useState<string | null>(null);
  const [eventLabOptionIdx, setEventLabOptionIdx] = useState(0);
  const [eventLabSimulation, setEventLabSimulation] = useState<any>(null);
  const runEventLabSimulation = () => { };
  const injectEventLab = () => { };
  const eventLabEvent = useMemo(() => ({ id: 'debug', title: 'Debug' }), []);

  // Floating Numbers & Notifications
  const [floatingNumbers, setFloatingNumbers] = useState<Array<{ id: string; value: number }>>([]);
  const removeFloatingNumber = (id: string) => setFloatingNumbers(prev => prev.filter(fn => fn.id !== id));
  const showNotif = (notif: any) => { console.log('Notif', notif); };
  const maybeConfetti = () => { };

  // Dialogs
  interface ConfirmDialogState {
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    danger?: boolean;
    cancelLabel?: string;
  }
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const openConfirmDialog = (opts: ConfirmDialogState) => setConfirmDialog(opts);
  const closeConfirmDialog = () => setConfirmDialog(null);

  // Monthly Report
  const monthlyReport = null;
  const monthlyActionsSummary = { actionsTaken: 0, actionsAvailable: 5, max: 5, remaining: 5, reason: 'base', tooltip: 'Base', locked: false, actions: [] };
  const handleUseMonthlyActions = () => { };
  const openActionsSignal = 0;
  const openTurnPreviewNow = () => setShowTurnPreview(true);

  const getCreditTierColor = (tier: any) => 'text-emerald-400';
  const getAIRiskColor = (risk: any) => 'text-rose-400';
  const calculateLoanPayment = (amount: number, rate: number, months: number) => 0;

  // Derived Financials
  const netWorth = useMemo(() => calculateNetWorth(gameState), [gameState]);
  const cashFlow = useMemo(() => calculateMonthlyCashFlowEstimate(gameState), [gameState]);
  const careerPath = gameState.career?.path || 'TECH';
  const aiImpact = gameState.aiDisruption?.affectedIndustries?.[careerPath];
  const creditScore = gameState.creditRating ?? 650;
  const creditTier = getCreditTier(creditScore);


  // Formatting Wrappers
  const formatMoneyFull = (val: number) => formatMoney(val); // Reuse existing or define


  // ============================================
  // SIDEBAR NAV CONFIG (Option A)
  // ============================================
  const sidebarNavItems = useMemo(() => [
    // EMPIRE Group
    { id: TABS.OVERVIEW, label: t('tabs.overview'), icon: <Home size={20} />, group: 'EMPIRE' as const },
    { id: TABS.ASSETS, label: t('tabs.portfolio'), icon: <Wallet size={20} />, group: 'EMPIRE' as const },
    { id: TABS.BANK, label: t('tabs.bank'), icon: <Landmark size={20} />, group: 'EMPIRE' as const },

    // GROWTH Group
    { id: TABS.INVEST, label: t('tabs.invest'), icon: <TrendingUp size={20} />, group: 'GROWTH' as const },
    { id: TABS.CAREER, label: t('tabs.career'), icon: <Briefcase size={20} />, group: 'GROWTH' as const },
    { id: TABS.SIDEHUSTLE, label: t('tabs.sideHustles'), icon: <Coffee size={20} />, group: 'GROWTH' as const },

    // LIFE Group
    { id: TABS.EDUCATION, label: t('tabs.education'), icon: <GraduationCap size={20} />, group: 'LIFE' as const },
    { id: TABS.LIFESTYLE, label: t('tabs.lifestyle'), icon: <Heart size={20} />, group: 'LIFE' as const },
    { id: TABS.SELF_LEARN, label: t('tabs.selfLearn'), icon: <BookOpen size={20} />, group: 'LIFE' as const },
  ], [t]);

  // ============================================
  // COMPACT HEADER COMPONENTS
  // ============================================
  const headerLeading = (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
        <span>Year {Math.floor(gameState.month / 12) + 1}</span>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <span>Month {gameState.month % 12 + 1}</span>
      </div>
      <h2 className="text-xl font-bold text-white tracking-tight">
        {sidebarNavItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
      </h2>
    </div>
  );

  const headerActions = (
    <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 pr-4 rounded-xl border border-slate-800/60 backdrop-blur-sm">
      <div className="flex flex-col items-end px-2 border-r border-slate-700/50">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cash</span>
        <motion.span
          key={gameState.cash}
          initial={{ scale: 1.1, color: '#34d399' }}
          animate={{ scale: 1, color: '#ffffff' }}
          className="text-lg font-bold tabular-nums"
        >
          {formatMoney(gameState.cash)}
        </motion.span>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Net Worth</span>
        <span className="text-lg font-bold text-cyan-400 tabular-nums">
          {formatMoney(netWorth)}
        </span>
      </div>

      <div className="ml-2 pl-4 border-l border-slate-700/50 flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
        {/* Simplified Start Screen Logic (preserved) */}
        <div className="max-w-md w-full glass-panel p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <span className="text-4xl">💎</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Tycoon</h1>
          <p className="text-slate-400 mb-8">Build your empire. Achieve financial freedom.</p>

          <div className="space-y-3">
            <button
              onClick={() => setGameStarted(true)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-900/20"
            >
              Continue (Adult)
            </button>
            {/* Add other start options here if needed */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarShell
      title="FINANCIAL TYCOON"
      subtitle="PROJECT STEP"
      navItems={sidebarNavItems}
      activeItemId={activeTab}
      onNavigate={(id) => setActiveTab(id as TabId)}
      headerLeading={headerLeading}
      headerActions={headerActions}
      onLogout={() => setGameStarted(false)}
    >
      {/* GLOBAL OVERLAYS */}
      <AnimatePresence>
        {floatingNumbers.map(fn => (
          <FloatingNumber key={fn.id} value={fn.value} onComplete={() => removeFloatingNumber(fn.id)} />
        ))}
      </AnimatePresence>

      {/* MODALS */}
      {showEventLab && (
        <Modal isOpen={showEventLab} onClose={() => setShowEventLab(false)}>
          {/* Event Lab Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Event Lab (Debug)</h3>
            <p className="text-slate-300">Test specific events or scenarios.</p>
            {/* Simplified for brevity - reuse existing logic if needed */}
            <button
              onClick={() => runEventLabSimulation()}
              className="px-4 py-2 bg-purple-600 rounded-lg text-white font-semibold"
            >
              Run Simulation
            </button>
          </div>
        </Modal>
      )}

      {/* DASHBOARD CONTENT */}
      <div className="space-y-6 pb-24">
        {/* Top Widgets Area (only on Overview) */}
        {activeTab === TABS.OVERVIEW && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-panel p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Monthly Income</p>
                <p className="text-lg font-bold text-white">{formatMoney(cashFlow.income)}</p>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                <TrendingUp size={20} className="rotate-180" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Monthly Expenses</p>
                <p className="text-lg font-bold text-white">{formatMoney(cashFlow.expenses)}</p>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Energy</p>
                <p className="text-lg font-bold text-white">{Math.round(gameState.stats.energy)}%</p>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Networking</p>
                <p className="text-lg font-bold text-white">{Math.round(gameState.stats.networking)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Coach Hint Render */}
        <AnimatePresence>
          {coachHint && coachHint.tabId === activeTab && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel border-l-4 border-l-emerald-500 p-4 mb-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-50 hover:opacity-100 cursor-pointer" onClick={() => setCoachHint(null)}>
                <X size={16} />
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><Sparkles className="text-emerald-400 animate-pulse" size={20} /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">{coachHint.title}</h4>
                  <p className="text-slate-300 text-sm mt-1">{coachHint.message}</p>
                  {coachHint.allowReopenPreview && (
                    <button onClick={() => openTurnPreviewNow()} className="mt-2 text-xs bg-emerald-600/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-600/30 hover:bg-emerald-600/30">
                      Check Cashflow
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content Rendering */}
        <div className="min-h-[60vh]">
          {activeTab === TABS.OVERVIEW && (
            <TabErrorBoundary tabName={t('tabs.overview')}>
              <Suspense fallback={<TabLoading label={t('tabs.overview')} />}>
                <OverviewTab
                  t={t as any}
                  formatNumber={formatNumber}
                  formatPercent={formatPercent}
                  formatMoney={formatMoney}
                  formatMoneyFull={formatMoneyFull}
                  gameState={gameState}
                  isProcessing={isProcessing}
                  coachMonthlyActionsRef={coachMonthlyActionsRef}
                  coachHighlight={coachHighlight as any}
                  InfoTip={InfoTip}
                  creditTier={creditTier as any}
                  creditScore={creditScore}
                  getCreditTierColor={getCreditTierColor}
                  handleClaimQuest={handleClaimQuest}
                  showEventLab={showEventLab}
                  setShowEventLab={setShowEventLab}
                  eventLabEvent={eventLabEvent}
                  eventLabOptionIdx={eventLabOptionIdx}
                  setEventLabEventId={setEventLabEventId}
                  setEventLabOptionIdx={setEventLabOptionIdx}
                  eventLabSimulation={eventLabSimulation}
                  setEventLabSimulation={setEventLabSimulation}
                  runEventLabSimulation={runEventLabSimulation}
                  injectEventLab={injectEventLab}
                  aiImpact={aiImpact}
                  careerPath={careerPath}
                  getAIRiskColor={getAIRiskColor}
                  netWorth={netWorth}
                  monthlyReport={monthlyReport}
                  cashFlow={cashFlow}
                  monthlyActionsSummary={monthlyActionsSummary}
                  handleUseMonthlyActions={handleUseMonthlyActions}
                  openActionsSignal={openActionsSignal}
                />
              </Suspense>
            </TabErrorBoundary>
          )}

          {activeTab === TABS.INVEST && (
            <TabErrorBoundary tabName={t('tabs.invest')}>
              <Suspense fallback={<TabLoading label={t('tabs.invest')} />}>
                <InvestTab
                  t={t as any}
                  formatMoney={formatMoney}
                  formatMoneyFull={formatMoneyFull}
                  formatPercent={formatPercent}
                  gameState={gameState}
                  investmentFilter={investmentFilter}
                  setInvestmentFilter={setInvestmentFilter}
                  investmentTierFilter={investmentTierFilter}
                  setInvestmentTierFilter={setInvestmentTierFilter}
                  investmentSearch={investmentSearch}
                  setInvestmentSearch={setInvestmentSearch}
                  filteredInvestments={filteredInvestments}
                  batchBuyMode={batchBuyMode}
                  toggleBatchBuyMode={() => setBatchBuyMode(prev => !prev)}
                  clearBatchBuyCart={clearBatchBuyCart}
                  batchBuyQuantities={batchBuyQuantities}
                  setBatchBuyQuantities={setBatchBuyQuantities}
                  batchBuyCart={batchBuyCart}
                  openBatchBuyConfirm={openBatchBuyConfirm}
                  autoInvest={autoInvest}
                  onUpdateAutoInvest={updateAutoInvest}
                  onOpenGlossary={() => setShowGlossary(true)}
                  handleBuyAsset={handleBuyAsset}
                  hasRequiredEducationForInvestment={(item: any) => true}
                  getAssetIcon={getAssetIcon}
                  getItemTier={(item: any) => 'STARTER'}
                  getRiskRating={(item: any) => 'LOW'}
                  isProcessing={isProcessing}
                  playClick={playClick}
                  setShowMortgageModal={(item: any) => setShowMortgageModal(true)}
                  setSelectedMortgage={setSelectedMortgage}
                  isBatchBuyEligible={isBatchBuyEligible}
                  setBatchQty={setBatchQty}
                  showQuiz={!!activeQuiz && activeTab === TABS.INVEST}
                  quizTitle={activeQuiz?.title}
                  quizIntro={activeQuiz?.intro}
                  quizQuestions={activeQuiz?.questions || []}
                  quizAnswers={quizAnswers}
                  onSelectQuizAnswer={(ans: any) => setQuizAnswers(prev => ({ ...prev, ...ans }))}
                  onSubmitQuiz={() => handleSubmitQuiz()}
                  onSkipQuiz={() => {
                    if (activeQuizId && markQuizSeen) markQuizSeen(activeQuizId);
                  }}
                />
              </Suspense>
            </TabErrorBoundary>
          )}

          {activeTab === TABS.ASSETS && (
            <TabErrorBoundary tabName={t('tabs.portfolio')}>
              <Suspense fallback={<TabLoading label={t('tabs.portfolio')} />}>
                <PortfolioTab
                  gameState={gameState}
                  cashFlow={cashFlow}
                  formatMoney={formatMoney}
                  formatPercent={formatPercent}
                  getAssetIcon={getAssetIcon}
                  getBusinessIncomeRange={(a: any) => ({ min: 0, max: 0 })}
                  getOpsUpgradeCost={getOpsUpgradeCost}
                  handleRefinanceMortgage={handleRefinanceMortgage}
                  handleSellAsset={handleSellAsset}
                  handleBusinessOpsUpgrade={handleBusinessOpsUpgrade}
                  handlePayDebt={handlePayDebt}
                  creditScore={creditScore}
                  activeTab={activeTab}
                  coachHint={coachHint}
                  setActiveTab={setActiveTab}
                />
              </Suspense>
            </TabErrorBoundary>
          )}

          {activeTab === TABS.BANK && (
            <TabErrorBoundary tabName={t('tabs.bank')}>
              <Suspense fallback={<TabLoading label={t('tabs.bank')} />}>
                <BankTab
                  gameState={gameState}
                  creditTier={creditTier as any}
                  creditScore={creditScore}
                  formatMoney={formatMoney}
                  formatPercent={formatPercent}
                  getCreditTierColor={getCreditTierColor}
                  coachBankLoansRef={coachBankLoansRef}
                  coachHighlight={coachHighlight as any}
                  adjustedLoanOptions={adjustedLoanOptions}
                  calculateLoanPayment={calculateLoanPayment}
                  handleTakeLoan={handleTakeLoan}
                  handlePayDebt={handlePayDebt}
                />
              </Suspense>
            </TabErrorBoundary>
          )}

          {activeTab === TABS.CAREER && (
            <TabErrorBoundary tabName={t('tabs.career')}>
              <Suspense fallback={<TabLoading label={t('tabs.career')} />}>
                <CareerTab
                  gameState={gameState}
                  careerPath={careerPath}
                  cashFlow={cashFlow}
                  formatMoney={formatMoney}
                  aiImpact={aiImpact}
                  isProcessing={isProcessing}
                  onPromote={handleManualPromotion}
                  onOpenSideHustles={() => setActiveTab(TABS.SIDEHUSTLE)}
                />
              </Suspense>
            </TabErrorBoundary>
          )}

          {activeTab === TABS.EDUCATION && (
            <TabErrorBoundary tabName={t('tabs.education')}>
              <Suspense fallback={<TabLoading label={t('tabs.education')} />}>
                <EducationTab
                  gameState={gameState}
                  careerPath={careerPath}
                  formatMoney={formatMoney}
                  handleEnrollEducation={handleEnrollEducation}
                  coachLifestyleGridRef={coachLifestyleGridRef}
                  coachHighlight={coachHighlight as any}
                />
              </Suspense>
            </TabErrorBoundary>
          )}

          {activeTab === TABS.SELF_LEARN && (
            <TabErrorBoundary tabName={t('tabs.selfLearn')}>
              <Suspense fallback={<TabLoading label={t('tabs.selfLearn')} />}>
                <SelfLearnTab
                  gameState={gameState}
                  setGameState={setGameState}
                  formatMoney={formatMoney}
                />
              </Suspense>
            </TabErrorBoundary>
          )}

          {activeTab === TABS.SIDEHUSTLE && (
            <TabErrorBoundary tabName={t('tabs.sideHustles')}>
              <Suspense fallback={<TabLoading label={t('tabs.sideHustles')} />}>
                <SideHustlesTab
                  gameState={gameState}
                  cashFlow={cashFlow}
                  formatMoney={formatMoney}
                  getHustleUpgradeLabel={(h: any) => h?.name}
                  getNextHustleMilestone={(h: any) => 100}
                  handleStartSideHustle={handleStartSideHustle}
                  handleStopSideHustle={handleStopSideHustle}
                  setShowSideHustleUpgradeModal={setShowSideHustleUpgradeModal}
                  coachSideHustlesRef={coachSideHustlesRef}
                  coachHighlight={coachHighlight as any}
                />
              </Suspense>
            </TabErrorBoundary>
          )}

          {activeTab === TABS.LIFESTYLE && (
            <TabErrorBoundary tabName={t('tabs.lifestyle')}>
              <Suspense fallback={<TabLoading label={t('tabs.lifestyle')} />}>
                <LifestyleTab
                  gameState={gameState}
                  formatMoney={formatMoney}
                  handleChangeLifestyle={handleChangeLifestyle}
                  coachLifestyleGridRef={coachLifestyleGridRef}
                  coachHighlight={coachHighlight as any}
                  coachHint={coachHint}
                  activeTab={activeTab}
                  InfoTip={InfoTip}
                />
              </Suspense>
            </TabErrorBoundary>
          )}
        </div>
      </div>

      {/* Footer / Floating Elements */}
      {showReopenPreviewPill && !showTurnPreview && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50 pointer-events-auto"
        >
          <button onClick={() => openTurnPreviewNow()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 transform hover:scale-105 transition-all">
            <Sparkles size={18} />
            Next Month Preview
          </button>
        </motion.div>
      )}

      {/* Legacy Mobile Fallback for Batch Cart - Keeping simpler version */}
      {batchBuyMode && batchBuyCart.totalUnits > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 z-50 flex justify-between items-center md:hidden">
          <div>
            <div className="text-white font-bold">{batchBuyCart.totalUnits} items</div>
            <div className="text-xs text-slate-400">{formatMoneyFull(batchBuyCart.totalCost)}</div>
          </div>
          <button onClick={openBatchBuyConfirm} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">
            Buy
          </button>
        </div>
      )}

      {/* CONFIRM DIALOGS etc would go here if not portal'd */}
      {confirmDialog && (
        <Modal isOpen={true} onClose={() => setConfirmDialog(null)}>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
            <p className="text-slate-300">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setConfirmDialog(null)} className="text-slate-400 hover:text-white px-3">{confirmDialog.cancelLabel || 'Cancel'}</button>
              <button onClick={confirmDialog.onConfirm} className={`px-4 py-2 rounded-lg font-bold text-white ${confirmDialog.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </SidebarShell>
  );
};

export default App;
