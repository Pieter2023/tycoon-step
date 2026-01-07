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
import DesktopShell from './components/v2/DesktopShell';
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
  Users, BookOpen, Zap, HeartPulse, Trophy, Info, Settings, MoreHorizontal
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
  const [investmentFilter, setInvestmentFilter] = useState<string>('ALL');
  const [investmentTierFilter, setInvestmentTierFilter] = useState<'ALL' | 'STARTER' | 'MID' | 'ADVANCED'>('ALL');
  const [investmentSearch, setInvestmentSearch] = useState('');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSeen, setQuizSeen] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('tycoon_quiz_seen_v1');
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch (e) {
      console.warn('Failed to read quiz preference:', e);
      return {};
    }
  });
  const [hudPanelOpen, setHudPanelOpen] = useState(false);
  const [hudMenuOpen, setHudMenuOpen] = useState(false);
  const tabUiStateRef = useRef<Record<TabId, TabUiState>>(createTabUiStateMap());
  const pendingScrollRestoreRef = useRef<TabId | null>(null);
  const prevTabRef = useRef<TabId>(activeTab);

  // Batch buying (securities): build a small 'cart' and confirm once
  const [batchBuyMode, setBatchBuyMode] = useState(false);
  const [batchBuyQuantities, setBatchBuyQuantities] = useState<Record<string, number>>({});

  const [floatingNumbers, setFloatingNumbers] = useState<{ id: string; value: number }[]>([]);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [dashboardModal, setDashboardModal] = useState<null | 'netWorth' | 'cashFlow' | 'credit' | 'ai'>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showCustomAvatarBuilder, setShowCustomAvatarBuilder] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<keyof typeof DIFFICULTY_SETTINGS>('NORMAL');
  const [soundEnabled, setSoundEnabled] = useState(initialGameState?.soundEnabled ?? true);
  const [showMortgageModal, setShowMortgageModal] = useState<MarketItem | null>(null);
  const [selectedMortgage, setSelectedMortgage] = useState<string>('');
  const [lastLifestyle, setLastLifestyle] = useState<Lifestyle | null>(null);
  const lastLifestyleRef = useRef(gameState.lifestyle);
  const lastMonthRef = useRef(gameState.month);
  const [openActionsSignal, setOpenActionsSignal] = useState(0);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [forcedMoneyTab, setForcedMoneyTab] = useState<'invest' | 'portfolio' | 'bank' | null>(null);
  const [forcedLifeTab, setForcedLifeTab] = useState<'lifestyle' | 'sidehustles' | null>(null);

  // ============================================
  // NEXT MONTH PREVIEW (Step 10)
  // ============================================
  const [showTurnPreview, setShowTurnPreview] = useState(false);
  const [turnPreview, setTurnPreview] = useState<TurnPreviewData | null>(null);
  const [showNextMonthPreview, setShowNextMonthPreview] = useState<boolean>(() => {
    if (isMultiplayer) return false;
    try {
      const stored = localStorage.getItem('tycoon_show_turn_preview');
      if (stored === '1' || stored === '0') {
        return stored === '1';
      }
      const legacy = localStorage.getItem('tycoon_skip_turn_preview');
      if (legacy === '1') {
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Failed to read turn preview preference:', e);
      return true;
    }
  });

  // ============================================
  // CONFIRMATION PROMPTS (prevent costly mis-clicks)
  // ============================================
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null);

  // Tooltips (tap/click) for stats explanations
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  // Special market event flows (Buy the Dip / Panic Sell)
  const [marketSpecialAction, setMarketSpecialAction] = useState<MarketSpecialAction | null>(null);
  const [discountBuyItemId, setDiscountBuyItemId] = useState<string | null>(null);
  const [discountBuyQuantity, setDiscountBuyQuantity] = useState<number>(1);
  const [panicSellSelection, setPanicSellSelection] = useState<Record<string, boolean>>({});

  // ============================================
  // ACCESSIBILITY (larger text, higher contrast)
  // ============================================
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showSideHustleUpgradeModal, setShowSideHustleUpgradeModal] = useState(false);
  const [showEventLab, setShowEventLab] = useState(false);
  const [showQuickTutorial, setShowQuickTutorial] = useState(false);
  const [quickTutorialDontShow, setQuickTutorialDontShow] = useState(false);
  const quickTutorialVideoRef = useRef<HTMLVideoElement | null>(null);
  const [eventLabEventId, setEventLabEventId] = useState(ALL_LIFE_EVENTS[0]?.id || '');
  const [eventLabOptionIdx, setEventLabOptionIdx] = useState(0);
  const [eventLabSimulation, setEventLabSimulation] = useState<{
    cashDelta: number;
    statsDelta: Partial<PlayerStats>;
    liabilitiesDelta: number;
    assetsDelta: number;
    message?: string;
  } | null>(null);
  const [accessibilityPrefs, setAccessibilityPrefs] = useState<AccessibilityPrefs>(() => {
    try {
      const raw = localStorage.getItem('tycoon_accessibility_v1');
      if (raw) {
        return {
          largeText: false,
          highContrast: false,
          reduceMotion: false,
          disableConfetti: false,
          disableVideoPreload: false,
          ...JSON.parse(raw)
        } as AccessibilityPrefs;
      }
    } catch (e) {
      console.warn('Failed to load accessibility preferences:', e);
    }
    return {
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      disableConfetti: false,
      disableVideoPreload: false
    };
  });

  // ============================================
  // COACH HINTS + HIGHLIGHTS (Step 12)
  // ============================================
  const [coachHint, setCoachHint] = useState<CoachHintData | null>(null);
  const coachTimeoutRef = useRef<number | null>(null);

  // After a "Quick Fix" jump, offer a convenient "Re-open Preview" pill for a short time.
  const [showReopenPreviewPill, setShowReopenPreviewPill] = useState(false);
  const reopenPreviewTimeoutRef = useRef<number | null>(null);

  // Coach focus refs (used to scroll + highlight the exact spot)
  const coachMonthlyActionsRef = useRef<HTMLDivElement | null>(null);
  const coachLifestyleGridRef = useRef<HTMLDivElement | null>(null);
  const coachAssetsSellRef = useRef<HTMLDivElement | null>(null);
  const coachSideHustlesRef = useRef<HTMLDivElement | null>(null);
  const coachBankLoansRef = useRef<HTMLDivElement | null>(null);
  // ============================================
  // TAB INTRO VIDEOS (config-driven onboarding popups)
  // - Shows ONLY the first time a user opens a tab (per-device via localStorage)
  // - "Show later" closes without saving (shows again next time they open the tab)
  // - "Don't show again" / "Continue" saves a per-tab localStorage flag
  // ============================================
  const [introVideoTabId, setIntroVideoTabId] = useState<string | null>(null);
  const [introVideoMuted, setIntroVideoMuted] = useState(true);
  const [introVideoIsPlaying, setIntroVideoIsPlaying] = useState(false);
  const [introVideoHasStarted, setIntroVideoHasStarted] = useState(false);
  const [introVideoPlaybackError, setIntroVideoPlaybackError] = useState<string | null>(null);
  const [introVideoAutoplayOnOpen, setIntroVideoAutoplayOnOpen] = useState(false);
  const [introVideoDontShowAgain, setIntroVideoDontShowAgain] = useState(false);
  const [minimizedTabVideos, setMinimizedTabVideos] = useState<Record<string, boolean>>({});
  const introVideoRef = useRef<HTMLVideoElement | null>(null);

  // Event image enhancements
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = accessibilityPrefs.reduceMotion || prefersReducedMotion;
  const scenarioImageContainerRef = useRef<HTMLDivElement | null>(null);
  const scenarioImageX = useMotionValue(0);
  const scenarioImageY = useMotionValue(0);
  const scenarioImageXSpring = useSpring(scenarioImageX, { stiffness: 160, damping: 22, mass: 0.3 });
  const scenarioImageYSpring = useSpring(scenarioImageY, { stiffness: 160, damping: 22, mass: 0.3 });
  const [imageLightbox, setImageLightbox] = useState<{ src: string; alt: string } | null>(null);

  // Initialize audio mute state from saved preference
  useEffect(() => {
    setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Persist accessibility preferences
  useEffect(() => {
    try {
      localStorage.setItem('tycoon_accessibility_v1', JSON.stringify(accessibilityPrefs));
    } catch (e) {
      console.warn('Failed to save accessibility preferences:', e);
    }
  }, [accessibilityPrefs]);

  // Apply accessibility classes (root-level so Tailwind rem-based sizes scale)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('tycoon-text-lg', !!accessibilityPrefs.largeText);
    root.classList.toggle('tycoon-high-contrast', !!accessibilityPrefs.highContrast);
    root.classList.toggle('tycoon-reduce-motion', !!accessibilityPrefs.reduceMotion);
  }, [accessibilityPrefs.largeText, accessibilityPrefs.highContrast, accessibilityPrefs.reduceMotion]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const duration = performance.now() - renderStart;
    if (duration > 24) {
      console.debug('[perf] heavy render', {
        duration: Math.round(duration),
        activeTab,
        pendingScenario: !!gameState.pendingScenario
      });
    }
  });

  // Persist Next Month preview preference
  useEffect(() => {
    if (isMultiplayer) return;
    try {
      localStorage.setItem('tycoon_show_turn_preview', showNextMonthPreview ? '1' : '0');
    } catch (e) {
      console.warn('Failed to save turn preview preference:', e);
    }
  }, [showNextMonthPreview, isMultiplayer]);


  useEffect(() => {
    if (gameState.month === lastMonthRef.current) return;
    setLastLifestyle(lastLifestyleRef.current);
    lastLifestyleRef.current = gameState.lifestyle;
    lastMonthRef.current = gameState.month;
  }, [gameState.lifestyle, gameState.month]);

  // ============================================
  // COACH HINTS (Step 12)
  // ============================================
  const offerReopenPreview = useCallback(() => {
    setShowReopenPreviewPill(true);
    if (reopenPreviewTimeoutRef.current) {
      window.clearTimeout(reopenPreviewTimeoutRef.current);
    }
    reopenPreviewTimeoutRef.current = window.setTimeout(() => {
      setShowReopenPreviewPill(false);
      reopenPreviewTimeoutRef.current = null;
    }, 25000);
  }, []);

  const triggerCoachHint = useCallback((hint: Omit<CoachHintData, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setCoachHint({ id, ...hint });
    if (coachTimeoutRef.current) {
      window.clearTimeout(coachTimeoutRef.current);
    }
    coachTimeoutRef.current = window.setTimeout(() => {
      setCoachHint(null);
      coachTimeoutRef.current = null;
    }, 5000);

    if (hint.allowReopenPreview) {
      offerReopenPreview();
    }
  }, [offerReopenPreview]);

  const coachHighlight = useCallback((target: CoachTarget) => {
    const active = !!coachHint && coachHint.tabId === activeTab && coachHint.target === target;
    return active
      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_0_4px_rgba(16,185,129,0.12)] animate-pulse'
      : '';
  }, [activeTab, coachHint]);

  // Scroll the exact focused UI section into view when a coach hint lands.
  useEffect(() => {
    if (!coachHint?.target) return;
    if (coachHint.tabId !== activeTab) return;

    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';
    const opts: ScrollIntoViewOptions = { behavior, block: 'center' };

    const getRef = (): React.RefObject<HTMLDivElement> | null => {
      switch (coachHint.target) {
        case 'monthly-actions':
          return coachMonthlyActionsRef;
        case 'lifestyle-grid':
          return coachLifestyleGridRef;
        case 'assets-sell':
          return coachAssetsSellRef;
        case 'sidehustles-list':
          return coachSideHustlesRef;
        case 'bank-loans':
          return coachBankLoansRef;
        case 'self-learn-tab':
          return null;
        default:
          return null;
      }
    };

    const r = getRef();
    if (r?.current) {
      try {
        r.current.scrollIntoView(opts);
      } catch (e) {
        console.debug('scrollIntoView failed:', e);
      }
    }
  }, [activeTab, coachHint?.id, coachHint?.tabId, coachHint?.target, reduceMotion]);

  useEffect(() => {
    if (!gameStarted || isMultiplayer) return;
    try {
      if (localStorage.getItem(SELF_LEARN_HINT_STORAGE_KEY) === '1') return;
      const hintTimer = window.setTimeout(() => {
        triggerCoachHint({
          tabId: activeTab,
          title: 'New Self Learn tab',
          message: 'Sales Certification, Upgrade EQ, and Master Negotiations now live under Self Learn.',
          target: 'self-learn-tab'
        });
        localStorage.setItem(SELF_LEARN_HINT_STORAGE_KEY, '1');
      }, 1200);
      return () => window.clearTimeout(hintTimer);
    } catch (e) {
      console.warn('Failed to show Self Learn hint:', e);
    }
  }, [activeTab, gameStarted, isMultiplayer, triggerCoachHint]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (coachTimeoutRef.current) window.clearTimeout(coachTimeoutRef.current);
      if (reopenPreviewTimeoutRef.current) window.clearTimeout(reopenPreviewTimeoutRef.current);
    };
  }, []);

  // If a preview is opened, hide the "Re-open Preview" pill.
  useEffect(() => {
    if (showTurnPreview) {
      setShowReopenPreviewPill(false);
    }
  }, [showTurnPreview]);

  // ============================================
  // TAB INTRO VIDEOS (config-driven onboarding popups)
  // ============================================
  const activeIntroVideoConfig = useMemo(() => {
    if (!introVideoTabId) return null;
    return TAB_INTRO_VIDEO_CONFIG[introVideoTabId] || null;
  }, [introVideoTabId]);

  const markIntroVideoAsSeen = useCallback((tabId: string) => {
    const cfg = TAB_INTRO_VIDEO_CONFIG[tabId];
    if (!cfg) return;
    try {
      localStorage.setItem(cfg.storageKey, '1');
    } catch (e) {
      console.warn('Failed to save intro video preference:', e);
    }
  }, []);

  const openIntroVideoModal = useCallback((tabId: string, opts?: { autoplay?: boolean }) => {
    const cfg = TAB_INTRO_VIDEO_CONFIG[tabId];
    if (!cfg) return;

    setIntroVideoMuted(true);
    setIntroVideoIsPlaying(false);
    setIntroVideoHasStarted(false);
    setIntroVideoPlaybackError(null);
    setIntroVideoAutoplayOnOpen(!!opts?.autoplay);
    setIntroVideoDontShowAgain(false);

    // If the tab has a minimized "replay" panel showing, hide it while the modal is open.
    setMinimizedTabVideos((prev) => ({ ...prev, [tabId]: false }));

    setIntroVideoTabId(tabId);
  }, []);

  const closeIntroVideoModal = useCallback((opts?: { remember?: boolean }) => {
    const tabId = introVideoTabId;
    if (!tabId) return;

    const remember = opts?.remember !== undefined ? opts.remember : true;
    if (remember || introVideoDontShowAgain) markIntroVideoAsSeen(tabId);

    setIntroVideoAutoplayOnOpen(false);

    setIntroVideoTabId(null);

    const vid = introVideoRef.current;
    if (vid) {
      try {
        vid.pause();
        vid.currentTime = 0;
      } catch (e) {
        console.debug('Video pause/reset failed:', e);
      }
    }

    setIntroVideoIsPlaying(false);
    setIntroVideoHasStarted(false);
    setIntroVideoPlaybackError(null);
  }, [introVideoTabId, markIntroVideoAsSeen, introVideoDontShowAgain]);

  const requestIntroVideoPlayback = useCallback(async () => {
    const vid = introVideoRef.current;
    if (!vid) return;

    setIntroVideoPlaybackError(null);
    setIntroVideoHasStarted(true);

    try {
      // If we're paused because we've reached the end, restart before playing.
      const nearEnd = Number.isFinite(vid.duration) && vid.duration > 0
        ? vid.currentTime >= Math.max(0, vid.duration - 0.05)
        : false;

      if (vid.ended || nearEnd) {
        try {
          vid.currentTime = 0;
        } catch (e) {
          console.debug('Video currentTime reset failed:', e);
        }
      }

      // If the user clicks Play, automatically unmute (applies to all tab intro videos).
      try {
        vid.muted = false;
      } catch (e) {
        console.debug('Video unmute failed:', e);
      }
      setIntroVideoMuted(false);

      const p = vid.play();
      // Some browsers return undefined; some return a Promise
      if (p && typeof (p as Promise<void>).then === 'function') {
        await (p as Promise<void>);
      }
    } catch (err: any) {
      const name = err?.name ? String(err.name) : '';
      const msg = err?.message ? String(err.message) : '';
      const pretty = name && msg ? `${name}: ${msg}` : name || msg || 'Unable to start playback.';
      setIntroVideoPlaybackError(pretty);
      setIntroVideoIsPlaying(false);
    }
  }, []);

  const tryEnterIntroVideoFullscreen = useCallback((vid: HTMLVideoElement | null) => {
    if (!vid) return;
    try {
      // Only force fullscreen on small screens (mobile/tablet).
      const isSmall = typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(max-width: 768px)').matches;

      if (!isSmall) return;

      // Avoid repeated fullscreen requests if already fullscreen.
      if (typeof document !== 'undefined' && (document as any).fullscreenElement) return;

      const anyVid = vid as any;

      // iOS Safari supports this on <video> elements.
      if (typeof anyVid.webkitEnterFullscreen === 'function') {
        anyVid.webkitEnterFullscreen();
        return;
      }

      // Standard Fullscreen API
      if (typeof vid.requestFullscreen === 'function') {
        const p = vid.requestFullscreen();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          (p as Promise<void>).catch(() => {});
        }
        return;
      }

      // Older WebKit fallback
      if (typeof anyVid.webkitRequestFullscreen === 'function') {
        anyVid.webkitRequestFullscreen();
      }
    } catch (e) {
      console.debug('Fullscreen request failed:', e);
    }
  }, []);

  // When the user explicitly clicks "Watch Video", we attempt to autoplay
  // (this is considered a user gesture in most browsers).
  useEffect(() => {
    if (!introVideoTabId) return;
    if (!introVideoAutoplayOnOpen) return;
    const vid = introVideoRef.current;
    if (!vid) return;

    let cancelled = false;
    const tryPlay = () => {
      if (cancelled) return;
      void requestIntroVideoPlayback();
      setIntroVideoAutoplayOnOpen(false);
    };

    // If the video is already ready, try immediately on next tick.
    if (vid.readyState >= 2) {
      const t = window.setTimeout(tryPlay, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(t);
      };
    }

    vid.addEventListener('canplay', tryPlay, { once: true });
    return () => {
      cancelled = true;
      vid.removeEventListener('canplay', tryPlay);
    };
  }, [introVideoAutoplayOnOpen, introVideoTabId, requestIntroVideoPlayback]);

  const toggleIntroVideoPlayback = useCallback(() => {
    const vid = introVideoRef.current;
    if (!vid) return;
    try {
      if (vid.paused) {
        tryEnterIntroVideoFullscreen(vid);
        void requestIntroVideoPlayback();
      } else {
        vid.pause();
      }
    } catch (e) {
      console.debug('Video playback state toggle failed:', e);
    }
  }, [requestIntroVideoPlayback, tryEnterIntroVideoFullscreen]);

  // If the scenario modal closes, ensure any open lightbox also closes
  useEffect(() => {
    if (!gameState.pendingScenario && imageLightbox) {
      setImageLightbox(null);
      scenarioImageX.set(0);
      scenarioImageY.set(0);
    }
  }, [gameState.pendingScenario, imageLightbox, scenarioImageX, scenarioImageY]);

  useEffect(() => {
    if (gameState.pendingSideHustleUpgrade) {
      setShowSideHustleUpgradeModal(true);
    } else {
      setShowSideHustleUpgradeModal(false);
    }
  }, [gameState.pendingSideHustleUpgrade]);

  const openImageLightbox = useCallback((src: string, alt: string) => {
    setImageLightbox({ src, alt });
  }, []);

  const closeImageLightbox = useCallback(() => {
    setImageLightbox(null);
  }, []);

  const handleScenarioImagePointerMove = useCallback((e: React.PointerEvent) => {
    if (reduceMotion) return;
    // Keep the effect subtle and avoid odd movement on touch devices
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const el = scenarioImageContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    // Centered offsets, clamped to keep motion subtle
    const offsetX = Math.max(-0.5, Math.min(0.5, relX - 0.5)) * 18; // px
    const offsetY = Math.max(-0.5, Math.min(0.5, relY - 0.5)) * 12; // px
    scenarioImageX.set(offsetX);
    scenarioImageY.set(offsetY);
  }, [reduceMotion, scenarioImageX, scenarioImageY]);

  const resetScenarioImageParallax = useCallback(() => {
    scenarioImageX.set(0);
    scenarioImageY.set(0);
  }, [scenarioImageX, scenarioImageY]);

  // Save / Load
  const SAVE_SLOTS: SaveSlotId[] = ['autosave', 'slot1', 'slot2', 'slot3'];
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [saveSummaries, setSaveSummaries] = useState<SaveSummary[]>([]);
  const [saveLabelDrafts, setSaveLabelDrafts] = useState<Record<SaveSlotId, string>>({
    autosave: '',
    slot1: '',
    slot2: '',
    slot3: ''
  });
  const [lastAutosaveAt, setLastAutosaveAt] = useState<number | null>(() => {
    if (isMultiplayer) return null;
    return getSaveSummary('adult', 'autosave')?.updatedAt ?? null;
  });
  const [autosaveNow, setAutosaveNow] = useState(() => Date.now());
  const [exportSlotId, setExportSlotId] = useState<SaveSlotId>('autosave');
  const [importSlotId, setImportSlotId] = useState<SaveSlotId>('autosave');
  const [importPayload, setImportPayload] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (isMultiplayer) return;
    if (!lastAutosaveAt) return;
    const id = window.setInterval(() => setAutosaveNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, [isMultiplayer, lastAutosaveAt]);

  const [autoTutorialPopups, setAutoTutorialPopups] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTO_TUTORIAL_POPUPS_STORAGE_KEY);
      return stored === null ? true : stored === '1';
    } catch (e) {
      console.warn('Failed to read tutorial popup preference:', e);
      return true;
    }
  });
  const [hideTipsEverywhere, setHideTipsEverywhere] = useState(() => {
    try {
      return localStorage.getItem(HIDE_TIPS_STORAGE_KEY) === '1';
    } catch (e) {
      console.warn('Failed to read tips preference:', e);
      return false;
    }
  });
  
  // Tutorial state - track which tips have been shown
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY) !== '1';
    } catch (e) {
      console.warn('Failed to read onboarding preference:', e);
      return true;
    }
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);

  useEffect(() => {
    const prevTab = prevTabRef.current;
    if (prevTab === activeTab) return;

    const prevState = tabUiStateRef.current[prevTab] ?? DEFAULT_TAB_UI_STATE;
    const prevFilters = prevTab === TABS.INVEST
      ? {
          investmentFilter,
          investmentTierFilter,
          investmentSearch
        }
      : {};

    tabUiStateRef.current[prevTab] = hydrateTabUiState({
      ...prevState,
      ...prevFilters,
      scrollY: window.scrollY || 0
    });

    prevTabRef.current = activeTab;

    const nextState = tabUiStateRef.current[activeTab];
    if (activeTab === TABS.INVEST && nextState) {
      setInvestmentFilter(nextState.investmentFilter);
      setInvestmentTierFilter(nextState.investmentTierFilter);
      setInvestmentSearch(nextState.investmentSearch);
    }

    pendingScrollRestoreRef.current = activeTab;
  }, [activeTab, investmentFilter, investmentSearch, investmentTierFilter]);

  useEffect(() => {
    if (activeTab !== TABS.INVEST) return;
    const prevState = tabUiStateRef.current[activeTab] ?? DEFAULT_TAB_UI_STATE;
    tabUiStateRef.current[activeTab] = hydrateTabUiState({
      ...prevState,
      investmentFilter,
      investmentTierFilter,
      investmentSearch
    });
  }, [activeTab, investmentFilter, investmentSearch, investmentTierFilter]);

  useEffect(() => {
    if (activeTab !== TABS.INVEST) return;
    if (investmentFilter === 'ALL') return;
    if (activeQuizId) return;

    const riskFilters = [AssetType.STOCK, AssetType.INDEX_FUND, AssetType.BOND, AssetType.CRYPTO];
    let nextQuiz = null;
    if (investmentFilter === AssetType.REAL_ESTATE && !quizSeen[QUIZ_DEFINITIONS.realEstate.id]) {
      nextQuiz = QUIZ_DEFINITIONS.realEstate;
    } else if (riskFilters.includes(investmentFilter as AssetType) && !quizSeen[QUIZ_DEFINITIONS.risk.id]) {
      nextQuiz = QUIZ_DEFINITIONS.risk;
    } else if (!quizSeen[QUIZ_DEFINITIONS.investBasics.id]) {
      nextQuiz = QUIZ_DEFINITIONS.investBasics;
    }

    if (nextQuiz) {
      setActiveQuizId(nextQuiz.id);
      setQuizAnswers({});
    }
  }, [activeTab, investmentFilter, quizSeen, activeQuizId]);
  
  // Tutorial tips content
  const tutorialTips = [
    { 
      id: 'welcome',
      title: '👋 Welcome to Tycoon!', 
      message: `Your goal: Build enough passive income to cover ${Math.round(FINANCIAL_FREEDOM_TARGET_MULTIPLIER * 100)}% of your expenses. Click "Next Month" to advance time and watch your finances grow!`,
      highlight: 'next-month'
    },
    {
      id: 'overview',
      title: '💰 Track Your Progress',
      message: 'The Overview tab shows your net worth, cash flow, and important stats. Watch your passive income grow!',
      highlight: 'overview'
    },
    {
      id: 'invest',
      title: '📈 Invest to Build Wealth',
      message: 'Go to the Invest tab to buy stocks, real estate, and businesses. These generate passive income!',
      highlight: 'invest'
    },
    {
      id: 'auto-invest',
      title: '⚡ Auto-Invest',
      message: 'Auto-invest puts a percent of last month’s disposable income to work automatically. Choose a preset to enable it now (you can pause anytime).',
      highlight: 'invest'
    },
    {
      id: 'career',
      title: '💼 Career & Education',
      message: 'Boost your salary through education and side hustles. Higher income = more to invest!',
      highlight: 'career'
    },
    {
      id: 'lifestyle',
      title: '❤️ Watch Your Health!',
      message: 'Check the Lifestyle tab for health, stress, and energy. Low health can trigger expensive medical emergencies!',
      highlight: 'lifestyle'
    },
    {
      id: 'financial-iq',
      title: '🧠 Financial IQ',
      message: 'Increase Financial IQ by making smart investment decisions and surviving market events. Higher IQ = better negotiation outcomes!',
      highlight: 'stats'
    }
  ];

  const markOnboardingSeen = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
    } catch (e) {
      console.warn('Failed to save onboarding preference:', e);
    }
  }, []);

  const shouldShowOnboarding = useCallback(() => {
    if (!autoTutorialPopups) return false;
    try {
      return localStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY) !== '1';
    } catch (e) {
      console.warn('Failed to read onboarding preference:', e);
      return false;
    }
  }, [autoTutorialPopups]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_TUTORIAL_POPUPS_STORAGE_KEY, autoTutorialPopups ? '1' : '0');
    } catch (e) {
      console.warn('Failed to save tutorial popup preference:', e);
    }
  }, [autoTutorialPopups]);

  useEffect(() => {
    try {
      localStorage.setItem(HIDE_TIPS_STORAGE_KEY, hideTipsEverywhere ? '1' : '0');
    } catch (e) {
      console.warn('Failed to save tips preference:', e);
    }
  }, [hideTipsEverywhere]);

  useEffect(() => {
    if (!gameStarted || isMultiplayer) return;
    try {
      const seen = localStorage.getItem(QUICK_TUTORIAL_STORAGE_KEY) === '1';
      if (!seen) setShowQuickTutorial(true);
    } catch (e) {
      console.warn('Failed to read quick tutorial preference:', e);
      setShowQuickTutorial(true);
    }
  }, [gameStarted, isMultiplayer]);

  useEffect(() => {
    try {
      localStorage.setItem(`${AUTOPLAY_PREF_PREFIX}${currentSaveSlot}`, autoPlaySpeed ? String(autoPlaySpeed) : 'off');
      localStorage.setItem(LAST_SAVE_SLOT_STORAGE_KEY, currentSaveSlot);
    } catch (e) {
      console.warn('Failed to save autoplay preference:', e);
    }
  }, [autoPlaySpeed, currentSaveSlot]);

  useEffect(() => {
    setAutoPlaySpeed(readAutoplayPreference(currentSaveSlot));
  }, [currentSaveSlot]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cashFlowHistoryStorageKey);
      setCashFlowHistory(raw ? (JSON.parse(raw) as CashFlowHistoryEntry[]) : []);
    } catch (e) {
      console.warn('Failed to load cash flow history:', e);
      setCashFlowHistory([]);
    }
  }, [cashFlowHistoryStorageKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(aiDisruptionHistoryStorageKey);
      setAiDisruptionHistory(raw ? (JSON.parse(raw) as AiDisruptionHistoryEntry[]) : []);
    } catch (e) {
      console.warn('Failed to load AI disruption history:', e);
      setAiDisruptionHistory([]);
    }
  }, [aiDisruptionHistoryStorageKey]);

  useEffect(() => {
    if (!monthlyReport) return;
    if (isMultiplayer) return;
    const entry = {
      month: gameState.month,
      income: monthlyReport.income,
      expenses: monthlyReport.expenses
    };
    setCashFlowHistory((prev) => {
      const withoutDupes = prev.filter((item) => item.month !== entry.month);
      const next = [...withoutDupes, entry].slice(-24);
      try {
        localStorage.setItem(cashFlowHistoryStorageKey, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save cash flow history:', e);
      }
      return next;
    });
  }, [cashFlowHistoryStorageKey, gameState.month, isMultiplayer, monthlyReport]);

  useEffect(() => {
    if (isMultiplayer) return;
    const level = gameState.aiDisruption?.disruptionLevel ?? 0;
    const entry = { month: gameState.month, level };
    setAiDisruptionHistory((prev) => {
      const withoutDupes = prev.filter((item) => item.month !== entry.month);
      const next = [...withoutDupes, entry].slice(-24);
      try {
        localStorage.setItem(aiDisruptionHistoryStorageKey, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save AI disruption history:', e);
      }
      return next;
    });
  }, [aiDisruptionHistoryStorageKey, gameState.aiDisruption?.disruptionLevel, gameState.month, isMultiplayer]);

  useEffect(() => {
    if (autoTutorialPopups) return;
    if (!showTutorial) return;
    setShowTutorial(false);
    setTutorialDismissed(true);
    markOnboardingSeen();
  }, [autoTutorialPopups, showTutorial, markOnboardingSeen]);


  const isScrollRestoreBlocked =
    !!gameState.pendingScenario ||
    !!gameState.pendingSideHustleUpgrade ||
    !!marketSpecialAction ||
    !!confirmDialog ||
    !!showMortgageModal ||
    !!introVideoTabId ||
    showSaveManager ||
    showQuestLog ||
    !!imageLightbox ||
    showAccessibility ||
    showTurnPreview ||
    showSideHustleUpgradeModal ||
    showTutorial ||
    gameState.hasWon ||
    gameState.isBankrupt;

  useEffect(() => {
    if (isScrollRestoreBlocked) return;
    const tabId = pendingScrollRestoreRef.current;
    if (!tabId || tabId !== activeTab) return;
    const saved = tabUiStateRef.current[tabId];
    const scrollY = saved?.scrollY ?? 0;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: 'auto' });
    });
    pendingScrollRestoreRef.current = null;
  }, [activeTab, isScrollRestoreBlocked]);

  // ============================================
  // DERIVED VALUES
  // ============================================
  const netWorth = useMemo(() => calculateNetWorth(gameState), [gameState]);
  // IMPORTANT: Use the deterministic cash flow estimate for UI so UI renders don't consume randomness.
  const cashFlow = useMemo(() => calculateMonthlyCashFlowEstimate(gameState), [gameState]);
  const activeQuiz = useMemo(() => (activeQuizId ? getQuizDefinition(activeQuizId) : null), [activeQuizId]);
  const activeTabVideo = TAB_INTRO_VIDEO_CONFIG[activeTab];
  const activeTabQuickTips = activeTabVideo?.quickTips || [];
  const autoplayEnabled = autoPlaySpeed !== null;
  const autoplaySpeedLabel = autoPlaySpeed ? (AUTOPLAY_SPEED_LABELS[autoPlaySpeed] || '1x') : '1x';
  const autoplayTooltip = autoplayEnabled
    ? t('autoplay.tooltipOn', { speed: autoplaySpeedLabel })
    : t('autoplay.tooltipOff');
  const uiV2Enabled = useMemo(() => readUiV2Preference(), []);
  const [v2Path, setV2Path] = useState<'/play' | '/money' | '/career' | '/learn' | '/life'>('/play');
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'actions' | 'profile' | 'more'>('dashboard');
  const [mobileOverflowOpen, setMobileOverflowOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const shouldPreloadVideos = !accessibilityPrefs.disableVideoPreload;
  const careerLevel = gameState.career?.level ?? gameState.playerJob?.level ?? 0;
  const creditScore = gameState.creditRating ?? 650;
  const creditTier = getCreditTier(creditScore);
  const aiDisruptionLevel = gameState.aiDisruption?.disruptionLevel ?? 0;
  const creditCardBalance = (gameState.liabilities || []).filter(l => l.type === 'CREDIT_CARD').reduce((sum, l) => sum + l.balance, 0);
  const creditLimitEstimate = Math.max(2000, Math.round(cashFlow.income * 2));
  const creditUtilization = creditLimitEstimate > 0 ? creditCardBalance / creditLimitEstimate : 0;
  const dti = cashFlow.income > 0 ? cashFlow.debtPayments / cashFlow.income : 1;
  const adjustedLoanOptions = useMemo(
    () => LOAN_OPTIONS.map(loan => adjustLoanOption(loan, careerLevel, creditScore, dti)),
    [careerLevel, creditScore, dti]
  );
  const lifestyleCashDelta = useMemo(() => {
    if (!lastLifestyle) return null;
    const prev = LIFESTYLE_OPTS[lastLifestyle];
    const current = LIFESTYLE_OPTS[gameState.lifestyle];
    if (!prev || !current) return null;
    const delta = prev.cost - current.cost;
    if (delta === 0) return null;
    return delta;
  }, [gameState.lifestyle, lastLifestyle]);

  useEffect(() => {
    if (v2Path !== '/play') {
      setMobileTab('more');
    }
  }, [v2Path]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (openActionsSignal > 0) {
      setActionsDrawerOpen(true);
    }
  }, [openActionsSignal]);

  const netWorthTrendData = useMemo(() => {
    const history = gameState.netWorthHistory?.length
      ? gameState.netWorthHistory
      : [{ month: gameState.month, value: netWorth }];
    return history.slice(-12).map((entry) => ({
      label: `M${entry.month}`,
      value: entry.value
    }));
  }, [gameState.month, gameState.netWorthHistory, netWorth]);

  const cashFlowTrendData = useMemo(() => {
    const fallback = [{ month: gameState.month, income: cashFlow.income, expenses: cashFlow.expenses }];
    const history = cashFlowHistory.length ? cashFlowHistory : fallback;
    return history.slice(-6).map((entry) => ({
      label: `M${entry.month}`,
      income: entry.income,
      expenses: entry.expenses
    }));
  }, [cashFlow.expenses, cashFlow.income, cashFlowHistory, gameState.month]);

  const previousCashFlowEntry = cashFlowHistory.length >= 2
    ? cashFlowHistory[cashFlowHistory.length - 2]
    : null;
  const expenseDelta = previousCashFlowEntry ? cashFlow.expenses - previousCashFlowEntry.expenses : null;

  const passiveTrendMini = useMemo(() => {
    return [] as Array<{ label: string; value: number }>;
  }, []);

  const expenseTrendMini = useMemo(() => {
    return cashFlowTrendData.map((entry) => ({
      label: entry.label,
      value: entry.expenses
    }));
  }, [cashFlowTrendData]);

  const passiveCoverage = cashFlow.expenses > 0 ? cashFlow.passive / cashFlow.expenses : 0;
  const freedomPercent = Math.min(1, passiveCoverage / FINANCIAL_FREEDOM_TARGET_MULTIPLIER);
  const ratioValue = Math.min(100, Math.max(0, Math.round(passiveCoverage * 100)));

  const creditTrendData = useMemo(() => {
    const history = gameState.creditHistory?.length
      ? gameState.creditHistory
      : [{ month: gameState.month, score: creditScore, reasons: [] }];
    return history.slice(-12).map((entry) => ({
      label: `M${entry.month}`,
      value: entry.score
    }));
  }, [creditScore, gameState.creditHistory, gameState.month]);

  const aiTrendData = useMemo(() => {
    const fallback = [{ month: gameState.month, level: aiDisruptionLevel }];
    const history = aiDisruptionHistory.length ? aiDisruptionHistory : fallback;
    return history.slice(-12).map((entry) => ({
      label: `M${entry.month}`,
      value: entry.level
    }));
  }, [aiDisruptionHistory, aiDisruptionLevel, gameState.month]);

  const latestCashFlowEntry = cashFlowTrendData[cashFlowTrendData.length - 1];
  const latestCashFlowNet = latestCashFlowEntry
    ? latestCashFlowEntry.income - latestCashFlowEntry.expenses
    : 0;
  const eventLabEvent = useMemo(
    () => ALL_LIFE_EVENTS.find(event => event.id === eventLabEventId) || ALL_LIFE_EVENTS[0],
    [eventLabEventId]
  );
  const questState = gameState.quests || getInitialQuestState(gameState.character?.id);
  const readyQuestCount = questState.readyToClaim?.length || 0;

  const filteredInvestments = useMemo(() => {
    return MARKET_ITEMS.filter(item => {
      const matchesType = investmentFilter === 'ALL' || item.type === investmentFilter;
      const tier = getItemTier(item);
      const matchesTier = investmentTierFilter === 'ALL' || tier === investmentTierFilter;
      const query = investmentSearch.trim().toLowerCase();
      const matchesSearch = !query
        || item.name.toLowerCase().includes(query)
        || (item.description || '').toLowerCase().includes(query)
        || (item.educationalNote || '').toLowerCase().includes(query);
      return matchesType && matchesTier && matchesSearch;
    });
  }, [investmentFilter, investmentSearch, investmentTierFilter]);

  const batchBuyCart = useMemo(() => {
    const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);

    const lines = Object.entries(batchBuyQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = MARKET_ITEMS.find(i => i.id === id);
        if (!item) return null;

        const unitPrice = Math.round(item.price * inflationMult);
        return {
          id,
          item,
          qty,
          unitPrice,
          lineTotal: unitPrice * qty
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        item: MarketItem;
        qty: number;
        unitPrice: number;
        lineTotal: number;
      }>;

    const totalCost = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const totalUnits = lines.reduce((sum, l) => sum + l.qty, 0);

    return {
      lines,
      totalCost,
      totalUnits,
      canAfford: totalCost <= gameState.cash
    };
  }, [batchBuyQuantities, gameState.cash, gameState.economy.inflationRate, gameState.month]);


  const careerPath = gameState.career?.path || 'TECH';
  const aiImpact = gameState.aiDisruption?.affectedIndustries?.[careerPath];
  const v2NavItems: AppShellNavItem[] = [
    { label: 'Play', path: '/play' },
    { label: 'Money', path: '/money' },
    { label: 'Career', path: '/career' },
    { label: 'Learn', path: '/learn' },
    { label: 'Life', path: '/life' }
  ];
  const aiRiskLabel = aiImpact?.automationRisk || 'LOW';
  const aiRiskBadgeTone =
    aiRiskLabel === 'CRITICAL'
      ? 'ds-badge--extreme'
      : aiRiskLabel === 'HIGH'
        ? 'ds-badge--high'
      : aiRiskLabel === 'MEDIUM'
        ? 'ds-badge--med'
          : 'ds-badge--low';

  const handleV2Navigate = useCallback(
    (path: '/play' | '/money' | '/career' | '/learn' | '/life', tab?: 'invest' | 'lifestyle' | 'sidehustles') => {
      setV2Path(path);
      if (path === '/money' && tab === 'invest') {
        setForcedMoneyTab('invest');
      }
      if (path === '/life' && tab === 'sidehustles') {
        setForcedLifeTab('sidehustles');
      }
      if (path === '/life' && tab === 'lifestyle') {
        setForcedLifeTab('lifestyle');
      }
    },
    [setForcedLifeTab, setForcedMoneyTab]
  );
  // ============================================
  // HANDLERS
  // ============================================
  const toggleSound = () => {
    const ns = !soundEnabled;
    setSoundEnabled(ns);
    setMuted(!ns);
    // Keep saved game state in sync
    setGameState(prev => ({ ...prev, soundEnabled: ns }));
    if (ns) playClick();
  };

  const notifTimeoutRef = useRef<number | null>(null);

  const showNotif = (
    title: string,
    message: string,
    type: string = 'info',
    opts?: { actionLabel?: string; onAction?: () => void; durationMs?: number }
  ) => {
    if (notifTimeoutRef.current) window.clearTimeout(notifTimeoutRef.current);
    setNotification({ title, message, type, actionLabel: opts?.actionLabel, onAction: opts?.onAction });
    if (type === 'success') playNotification();
    else if (type === 'error') playError();
    else if (type === 'warning') playWarning();
    const duration = opts?.durationMs ?? 4000;
    notifTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      notifTimeoutRef.current = null;
    }, duration);
  };

  // Consolidate rapid consecutive purchases into one toast (less pop-up spam)
  const purchaseToastAggRef = useRef<{
    timer: number | null;
    items: Record<string, number>;
    totalCost: number;
  }>({
    timer: null,
    items: {},
    totalCost: 0
  });

  const queuePurchaseNotif = (name: string, cost: number) => {
    const ref = purchaseToastAggRef.current;
    ref.items[name] = (ref.items[name] || 0) + 1;
    ref.totalCost += cost;

    if (ref.timer) window.clearTimeout(ref.timer);

    ref.timer = window.setTimeout(() => {
      const entries = Object.entries(ref.items);
      const total = ref.totalCost;

      // reset
      ref.items = {};
      ref.totalCost = 0;
      ref.timer = null;

      if (entries.length === 0) return;

      const isSingle = entries.length === 1 && entries[0][1] === 1;
      const summary = entries
        .slice(0, 3)
        .map(([n, c]) => (c === 1 ? n : `${c}x ${n}`))
        .join(', ');
      const suffix = entries.length > 3 ? ` +${entries.length - 3} more` : '';

      showNotif(
        isSingle ? 'Purchase Complete!' : 'Purchases Complete!',
        isSingle
          ? `Bought ${entries[0][0]} for ${formatMoneyFull(total)}.`
          : `Bought ${summary}${suffix} for ${formatMoneyFull(total)} total.`,
        'success'
      );

      maybeConfetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }, 650);
  };


  const openConfirmDialog = useCallback((cfg: ConfirmDialogConfig) => {
    setConfirmDialog(cfg);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const markQuizSeen = useCallback((quizId: string) => {
    setQuizSeen((prev) => {
      const next = { ...prev, [quizId]: true };
      try {
        localStorage.setItem('tycoon_quiz_seen_v1', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save quiz preference:', e);
      }
      return next;
    });
    setActiveQuizId(null);
    setQuizAnswers({});
  }, []);

  const handleSelectQuizAnswer = useCallback((id: string, answer: string) => {
    setQuizAnswers((prev) => ({ ...prev, [id]: answer }));
  }, []);

  const handleSubmitQuiz = useCallback(() => {
    if (!activeQuizId) return;
    const quiz = getQuizDefinition(activeQuizId);
    if (!quiz || quiz.questions.length === 0) return;
    const correctCount = quiz.questions.filter((q) => quizAnswers[q.id] === q.correct).length;
    const iqGain = Math.max(1, Math.round(correctCount * 0.75));
    const happinessGain = correctCount >= 2 ? 1 : 0;
    const stressRelief = correctCount >= 3 ? 2 : 1;

    setGameState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        financialIQ: clampStatValue((prev.stats?.financialIQ ?? 0) + iqGain),
        happiness: clampStatValue((prev.stats?.happiness ?? 0) + happinessGain),
        stress: clampStatValue((prev.stats?.stress ?? 0) - stressRelief)
      }
    }));

    showNotif(
      'Quiz complete',
      `+${iqGain} FI/Q${happinessGain ? ', +1 happiness' : ''}${stressRelief ? `, -${stressRelief} stress` : ''}.`,
      'success'
    );

    markQuizSeen(activeQuizId);
  }, [activeQuizId, quizAnswers, markQuizSeen]);

  const InfoTip = ({ id, text }: { id: string; text: string }) => {
    const isOpen = openTooltipId === id;

    const open = () => setOpenTooltipId(id);
    const close = () => setOpenTooltipId((prev) => (prev === id ? null : prev));
    const toggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenTooltipId((prev) => (prev === id ? null : id));
    };

    return (
      <span
        className="relative inline-flex"
        onMouseEnter={() => open()}
        onMouseLeave={() => close()}
      >
        <button
          type="button"
          onClick={toggle}
          onBlur={() => close()}
          className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-700/60 text-slate-400 hover:text-slate-200"
          aria-label="Show info"
        >
          <Info size={14} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 top-full mt-2 right-0 w-[min(18rem,calc(100vw-2rem))] bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl block"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-slate-200 text-sm leading-relaxed">{text}</p>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    );
  };


  // ============================================
  // GOALS / QUESTS (Step 6)
  // Live quest completion + claim rewards
  // ============================================
  const trackFrameDrops = useCallback((label: string, durationMs: number = 1200) => {
    if (!import.meta.env.DEV) return;
    let last = performance.now();
    let frames = 0;
    let drops = 0;
    const start = last;

    const tick = (now: number) => {
      frames += 1;
      const delta = now - last;
      if (delta > 50) drops += 1;
      last = now;
      if (now - start < durationMs) {
        requestAnimationFrame(tick);
      } else {
        console.debug('[perf] frame drops', { label, drops, frames });
      }
    };

    requestAnimationFrame(tick);
  }, []);

  const maybeConfetti = useCallback(
    (opts: Parameters<typeof confetti>[0]) => {
      if (accessibilityPrefs.disableConfetti || reduceMotion) return;
      const particleCount = Math.min(opts.particleCount ?? 80, 160);
      confetti({ ...opts, particleCount });
      trackFrameDrops('confetti');
    },
    [accessibilityPrefs.disableConfetti, reduceMotion, trackFrameDrops]
  );

  const recordAutosave = useCallback((state: GameState) => {
    if (isMultiplayer) return;
    saveAdultGame(state, 'autosave');
    const now = Date.now();
    setLastAutosaveAt(now);
    setAutosaveNow(now);
  }, [isMultiplayer]);

  const handleClaimQuest = useCallback((questId: string) => {
    if (isProcessing) return;
    const q = getQuestById(questId);

    setGameState(prev => {
      const next = claimQuestReward(prev, questId);
      recordAutosave(next);
      return next;
    });

    playAchievement();
    maybeConfetti({ particleCount: 140, spread: 85, origin: { y: 0.65 } });
    if (q) {
      showNotif(t('quests.rewardClaimedTitle'), t(q.title), 'success');
    }
  }, [isProcessing, maybeConfetti, recordAutosave, showNotif, t]);

  useEffect(() => {
    // Only sync quests once the run has started
    if (!gameStarted || !gameState.character || gameState.hasWon) return;

    const synced = updateQuests(gameState);

    // Detect newly-ready rewards (quest completed but not claimed yet)
    try {
      const prevReady = new Set(gameState.quests?.readyToClaim || []);
      const nextReady = new Set(synced.quests?.readyToClaim || []);
      const newlyReady = Array.from(nextReady).filter(id => !prevReady.has(id));

      if (newlyReady.length > 0) {
        maybeConfetti({ particleCount: 70, spread: 70, origin: { y: 0.65 } });
        newlyReady.slice(0, 3).forEach(id => {
          const q = getQuestById(id);
          if (q) {
            showNotif(t('quests.completeTitle', { title: t(q.title) }), t('quests.rewardReady'), 'success', {
              actionLabel: t('quests.claim'),
              onAction: () => handleClaimQuest(id),
              durationMs: 6000
            });
          }
        });
      }

      const prevTrack = gameState.quests?.track;
      const nextTrack = synced.quests?.track;
      if (nextTrack && nextTrack !== prevTrack) {
        const label = t(`quests.track.${nextTrack}`);
        showNotif(t('quests.trackUnlockedTitle'), t('quests.trackUnlockedBody', { track: label }), 'info');
      }
    } catch (e) {
      console.warn('Quest sync error:', e);
    }

    const questSig = (qs: any) => {
      const a = Array.isArray(qs?.active) ? qs.active : [];
      const r = Array.isArray(qs?.readyToClaim) ? qs.readyToClaim : [];
      const c = Array.isArray(qs?.completed) ? qs.completed : [];
      const t = typeof qs?.track === 'string' ? qs.track : '';
      return `t:${t}|a:${a.join(',')}|r:${r.join(',')}|c:${c.join(',')}`;
    };

    const questsChanged = questSig(synced.quests) !== questSig(gameState.quests);
    const eventsChanged = (synced.events?.[0]?.id || '') !== (gameState.events?.[0]?.id || '');

      if (questsChanged || eventsChanged) {
        setGameState(synced);
        recordAutosave(synced);
      }
  }, [gameState, gameStarted, handleClaimQuest, recordAutosave]);

  const handleClaimAllQuests = useCallback(() => {
    const readyIds = gameState.quests?.readyToClaim || [];
    if (readyIds.length === 0) {
      showNotif(t('quests.nothingToClaimTitle'), t('quests.nothingToClaimBody'), 'info');
      return;
    }

    openConfirmDialog({
      title: t('quests.claimAllTitle'),
      description: t('quests.claimAllBody', { count: readyIds.length }),
      confirmLabel: t('quests.claimAll'),
      cancelLabel: t('actions.cancel'),
      onConfirm: () => {
        setGameState(prev => {
          let next = prev;
          for (const id of readyIds) {
            next = claimQuestReward(next, id);
          }
          recordAutosave(next);
          return next;
        });
        playAchievement();
        maybeConfetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
        showNotif(t('quests.rewardsClaimedTitle'), t('quests.rewardsClaimedBody', { count: readyIds.length }), 'success');
      }
    });
  }, [gameState.quests?.readyToClaim, openConfirmDialog, recordAutosave, showNotif]);

  const formatDateTime = (ts: number) => {
    try {
      return formatDateTimeValue(ts);
    } catch (e) {
      console.debug('Date formatting failed:', e);
      return t('dates.invalid');
    }
  };

  const relativeTimeFormatter = useMemo(() => {
    try {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    } catch (e) {
      console.debug('RelativeTimeFormat failed:', e);
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    }
  }, [locale]);

  const formatRelativeTime = useCallback((diffMs: number) => {
    const seconds = Math.round(diffMs / 1000);
    if (seconds < 60) return relativeTimeFormatter.format(-seconds, 'second');
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return relativeTimeFormatter.format(-minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (hours < 24) return relativeTimeFormatter.format(-hours, 'hour');
    const days = Math.round(hours / 24);
    return relativeTimeFormatter.format(-days, 'day');
  }, [relativeTimeFormatter]);

  const autosaveStatus = useMemo(() => {
    if (isMultiplayer) return '';
    if (!lastAutosaveAt) return t('save.autosaveNever');
    const diffMs = Math.max(0, autosaveNow - lastAutosaveAt);
    if (diffMs < 45000) return t('save.autosaveJustNow');
    return t('save.autosaveLast', { time: formatRelativeTime(diffMs) });
  }, [autosaveNow, formatRelativeTime, isMultiplayer, lastAutosaveAt, t]);

  const refreshSaveSummaries = useCallback(() => {
    setSaveSummaries(getSaveSummaries('adult'));
  }, []);

  const openSaveManager = () => {
    playClick();
    const summaries = getSaveSummaries('adult');
    setSaveSummaries(summaries);
    setExportSlotId(currentSaveSlot);
    setImportSlotId(currentSaveSlot);
    setImportError(null);
    setSaveLabelDrafts(prev => {
      const drafts: Record<SaveSlotId, string> = { ...prev };
      SAVE_SLOTS.forEach(slotId => {
        if (slotId === 'autosave') return;
        const summary = summaries.find(s => s.slotId === slotId);
        drafts[slotId] = summary?.label ?? '';
      });
      return drafts;
    });
    setShowSaveManager(true);
  };

  const handleSaveToSlot = (slotId: SaveSlotId, label?: string) => {
    try {
      const trimmedLabelRaw = slotId === 'autosave' ? undefined : label?.trim();
      const trimmedLabel = trimmedLabelRaw && trimmedLabelRaw.length > 0 ? trimmedLabelRaw : undefined;
      saveAdultGame(gameState, slotId, trimmedLabel);
      setCurrentSaveSlot(slotId);
      if (slotId === 'autosave') {
        const now = Date.now();
        setLastAutosaveAt(now);
        setAutosaveNow(now);
      } else if (typeof trimmedLabel === 'string') {
        setSaveLabelDrafts(prev => ({ ...prev, [slotId]: trimmedLabel }));
      }
      refreshSaveSummaries();
      showNotif(t('save.savedTitle'), t('save.savedBody', { slot: slotId === 'autosave' ? t('save.slot.autosave') : slotId }), 'success');
    } catch (e) {
      console.error('Failed to save game:', e);
      showNotif(t('save.failedTitle'), t('save.failedBody'), 'error');
    }
  };

  const handleLoadFromSlot = (slotId: SaveSlotId) => {
    const loaded = loadAdultGame(slotId);
    if (!loaded) {
      showNotif(t('save.notFoundTitle'), t('save.notFoundBody', { slot: slotId }), 'warning');
      return;
    }

    setIsProcessing(false);
    setMonthlyReport(null);
    setGameState(loaded);
    setCurrentSaveSlot(slotId);
    setGameStarted(true);
    setShowCharacterSelect(false);

    const se = loaded.soundEnabled ?? true;
    setSoundEnabled(se);
    setMuted(!se);

    const autosaveSummary = getSaveSummary('adult', 'autosave');
    if (autosaveSummary?.updatedAt) {
      setLastAutosaveAt(autosaveSummary.updatedAt);
      setAutosaveNow(Date.now());
    } else {
      setLastAutosaveAt(null);
    }

    setShowSaveManager(false);
    showNotif(t('save.loadedTitle'), t('save.loadedBody', { slot: slotId === 'autosave' ? t('save.slot.autosave') : slotId }), 'success');
  };

  const handleDeleteSlot = (slotId: SaveSlotId) => {
    deleteSaveSlot('adult', slotId);
    refreshSaveSummaries();
    showNotif(t('save.deletedTitle'), t('save.deletedBody', { slot: slotId === 'autosave' ? t('save.slot.autosave') : slotId }), 'info');
  };

  const handleRenameSlot = (slotId: SaveSlotId, label: string) => {
    const nextLabel = label.trim();
    renameSaveSlot('adult', slotId, nextLabel);
    setSaveLabelDrafts(prev => ({ ...prev, [slotId]: nextLabel }));
    refreshSaveSummaries();
    showNotif(t('save.renamedTitle'), t('save.renamedBody', { slot: slotId }), 'success');
  };

  const handleExportSlot = async (slotId: SaveSlotId, mode: 'copy' | 'download') => {
    const payload = exportSaveSlot('adult', slotId);
    if (!payload) {
      showNotif(t('save.exportMissingTitle'), t('save.exportMissingBody'), 'warning');
      return;
    }

    const json = JSON.stringify(payload, null, 2);

    if (mode === 'copy') {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error('Clipboard unavailable');
        }
        await navigator.clipboard.writeText(json);
        showNotif(t('save.exportCopiedTitle'), t('save.exportCopiedBody'), 'success');
      } catch (e) {
        console.warn('Clipboard write failed:', e);
        showNotif(t('save.exportCopyFailedTitle'), t('save.exportCopyFailedBody'), 'error');
      }
      return;
    }

    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tycoon-${slotId}-save.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showNotif(t('save.exportDownloadedTitle'), t('save.exportDownloadedBody'), 'success');
    } catch (e) {
      console.warn('Download failed:', e);
      showNotif(t('save.exportDownloadFailedTitle'), t('save.exportDownloadFailedBody'), 'error');
    }
  };

  const handleImportSave = () => {
    setImportError(null);
    let parsed: unknown;

    try {
      const trimmed = importPayload.trim();
      if (!trimmed) {
        setImportError(t('save.importInvalid'));
        return;
      }
      parsed = JSON.parse(trimmed);
    } catch (e) {
      setImportError(t('save.importInvalid'));
      return;
    }

    const summary = importSavePayload(parsed, 'adult', importSlotId, saveLabelDrafts[importSlotId]);
    if (!summary) {
      setImportError(t('save.importFailed'));
      return;
    }

    refreshSaveSummaries();
    setImportPayload('');
    showNotif(t('save.importSuccessTitle'), t('save.importSuccessBody', { slot: importSlotId }), 'success');
    handleLoadFromSlot(importSlotId);
  };

  const handleQuickStart = () => {
    playClick();
    setShowCharacterSelect(true);
  };

  const handleSelectCharacter = (char: Character) => {
    playPurchase();
    const diff = DIFFICULTY_SETTINGS[selectedDifficulty];
    let startingCash = diff.startingCash + (char.startingBonus.type === 'cash' ? char.startingBonus.amount : 0);
    
    const initialLiabilities: Liability[] = [];
    
    // Student loans from character
    if (char.startingBonus.amount < 0) {
      const debtAmount = Math.abs(char.startingBonus.amount);
      initialLiabilities.push({
        id: 'student-loan-' + Date.now(),
        name: 'Student Loans',
        balance: debtAmount,
        originalBalance: debtAmount,
        interestRate: 0.065,
        monthlyPayment: calculateLoanPayment(debtAmount, 0.065, 120),
        type: 'STUDENT_LOAN'
      });
      startingCash = diff.startingCash; // Don't add negative bonus to cash
    }
    
    // Difficulty debt
    if ('startingDebt' in diff && diff.startingDebt) {
      const debtAmount = diff.startingDebt as number;
      initialLiabilities.push({
        id: 'personal-loan-' + Date.now(),
        name: 'Personal Loan',
        balance: debtAmount,
        originalBalance: debtAmount,
        interestRate: 0.10,
        monthlyPayment: calculateLoanPayment(debtAmount, 0.10, 48),
        type: 'PERSONAL_LOAN'
      });
    }

    const newState: GameState = {
      ...INITIAL_GAME_STATE,
      character: char,
      difficulty: selectedDifficulty,
      cash: Math.max(0, startingCash),
      career: {
        path: char.careerPath,
        title: CAREER_PATHS[char.careerPath].levels[0].title,
        salary: Math.round(CAREER_PATHS[char.careerPath].levels[0].baseSalary * diff.salaryMultiplier),
        level: 1,
        experience: 0,
        skills: {},
        aiVulnerability: CAREER_PATHS[char.careerPath].aiVulnerability,
        futureProofScore: CAREER_PATHS[char.careerPath].futureProofScore
      },
      playerJob: {
        title: CAREER_PATHS[char.careerPath].levels[0].title,
        salary: Math.round(CAREER_PATHS[char.careerPath].levels[0].baseSalary * diff.salaryMultiplier),
        level: 1,
        experience: 0
      },
      liabilities: initialLiabilities,
      activeSideHustles: [],
      quests: getInitialQuestState(char.id),
      soundEnabled
    };
    
    setGameState(newState);
    recordAutosave(newState);
    setShowCharacterSelect(false);
    setGameStarted(true);
    maybeConfetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleCreateCustomCharacter = (result: CustomAvatarResult) => {
    const customCharacter: Character = {
      id: `custom-${Date.now()}`,
      name: result.name,
      backstory: 'Custom tycoon starter.',
      avatarEmoji: '👤',
      avatarColor: 'from-slate-500 to-slate-600',
      avatarImage: result.avatarImage,
      careerPath: result.careerPath,
      startingBonus: { type: 'cash', amount: 0 },
      traits: [],
      perk: {
        id: 'perk_generalist',
        name: 'Generalist',
        description: 'No perk applied.'
      }
    };
    setShowCustomAvatarBuilder(false);
    handleSelectCharacter(customCharacter);
  };

  // ============================================
  // NEXT TURN
  // ============================================
  const buildTurnPreview = useCallback((state: GameState): TurnPreviewData => {
    const nextMonth = (state.month || 1) + 1;
    const baseYear = state.year || 2025;
    const nextYear = (nextMonth % 12 === 1 && nextMonth > 1) ? (baseYear + 1) : baseYear;
    const monthOfYear = ((nextMonth - 1) % 12) + 1;

    const cf = calculateMonthlyCashFlowEstimate(state);
    const netChange = cf.income - cf.expenses;
    const projectedEndCash = (state.cash || 0) + netChange;
    const shortfall = projectedEndCash < 0 ? Math.abs(projectedEndCash) : 0;

    const incomeLines: TurnPreviewLine[] = [
      { label: 'Salary', value: cf.salary },
      { label: 'Side Hustles', value: cf.sideHustleIncome },
      { label: 'Passive Income', value: cf.passive },
      { label: 'Spouse Income', value: cf.spouseIncome },
    ].filter(l => l.value > 0).sort((a, b) => b.value - a.value);

    const expenseLines: TurnPreviewLine[] = [
      { label: 'Lifestyle', value: cf.lifestyleCost },
      { label: 'Debt Payments', value: cf.debtPayments },
      { label: 'Education', value: cf.educationPayment },
      { label: 'Children', value: cf.childrenExpenses },
      { label: 'Vehicles', value: cf.vehicleCosts },
    ].filter(l => l.value > 0).sort((a, b) => b.value - a.value);

    const lowBufferThreshold = Math.max(500, Math.round(cf.expenses * 0.10));
    const warningLevel: TurnPreviewData['warningLevel'] =
      shortfall > 0 ? 'SHORTFALL' : (projectedEndCash < lowBufferThreshold ? 'LOW_BUFFER' : 'SAFE');

    return {
      nextMonth,
      nextYear,
      monthOfYear,
      incomeLines,
      expenseLines,
      income: cf.income,
      expenses: cf.expenses,
      netChange,
      projectedEndCash,
      shortfall,
      warningLevel,
    };
  }, []);

  const advanceMonth = useCallback((opts?: { showSummaryToast?: boolean }) => {
    if (isProcessing || gameState.pendingScenario || gameState.pendingSideHustleUpgrade) return;
    setIsProcessing(true);
    playTick();

    setTimeout(() => {
      const { newState, monthlyReport: report } = processTurn(gameState);
      const netIncome = report.income - report.expenses;
      const shouldShowSummaryToast = !!opts?.showSummaryToast;

      // Autoplay scheduling is blocked while decision/modals are open (see the Auto-play effect),
      // but we do NOT automatically disable autoplay. This lets autoplay continue seamlessly
      // after the player makes a choice (unless they explicitly stop it).

      if (Math.abs(netIncome) > 10) {
        setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: netIncome }]);
        netIncome > 0 ? playMoneyGain(netIncome) : playMoneyLoss();
      }

      if (newState.hasWon && !gameState.hasWon) {
        playVictory();
        maybeConfetti({ particleCount: 300, spread: 120, origin: { y: 0.5 } });
      }

      if (report.promoted) {
        playLevelUp();
        showNotif('🎉 Promotion!', `Promoted to ${newState.career?.title}!`, 'success');
      }

      if (shouldShowSummaryToast) {
        const cashDelta = report.income - report.expenses;
        const cashDeltaLabel = `${cashDelta >= 0 ? '+' : '-'}${formatMoneyFull(Math.abs(cashDelta))}`;
        showNotif(
          'Month complete',
          `Income ${formatMoneyFull(report.income)} • Expenses ${formatMoneyFull(report.expenses)} • Cash ${cashDeltaLabel}`,
          cashDelta >= 0 ? 'success' : 'warning'
        );
      }

      // Goals & Quests: completion + claim notifications are handled by the live quest sync effect (Step 6).

      setGameState(newState);
      recordAutosave(newState);
      setMonthlyReport(report);
      setIsProcessing(false);

      // Multiplayer: track turns and switch players after MULTIPLAYER_TURNS_PER_ROUND
      if (isMultiplayer && onTurnComplete) {
        const newTurnsTaken = multiplayerTurnsTaken + 1;
        setMultiplayerTurnsTaken(newTurnsTaken);

        if (newTurnsTaken >= MULTIPLAYER_TURNS_PER_ROUND || newState.hasWon) {
          // End this player's turn
          setMultiplayerTurnsTaken(0);
          onTurnComplete(newState);
        }
      }
    }, 150);
  }, [autoPlaySpeed, gameState, isProcessing, isMultiplayer, onTurnComplete, multiplayerTurnsTaken, recordAutosave]);

  const hideTurnPreview = useCallback(() => {
    setShowTurnPreview(false);
    setTurnPreview(null);
  }, []);

  const closeTurnPreview = useCallback(() => {
    playClick();
    hideTurnPreview();
  }, [hideTurnPreview]);

  const confirmTurnPreview = useCallback(() => {
    closeTurnPreview();
    advanceMonth();
  }, [advanceMonth, closeTurnPreview]);

  // Next Month button handler (shows preview unless skipped)
  const handleNextTurn = useCallback(() => {
    if (isProcessing || gameState.pendingScenario || gameState.pendingSideHustleUpgrade) return;

    // If autoplay is enabled, or preview is disabled, advance immediately.
    if (autoPlaySpeed !== null || !showNextMonthPreview || isMultiplayer) {
      const showSummaryToast = !showNextMonthPreview && autoPlaySpeed === null && !isMultiplayer;
      advanceMonth({ showSummaryToast });
      return;
    }

    playClick();
    setTurnPreview(buildTurnPreview(gameState));
    setShowTurnPreview(true);
  }, [advanceMonth, autoPlaySpeed, buildTurnPreview, gameState, isMultiplayer, isProcessing, showNextMonthPreview]);

  // Step 12: manual way to (re)open the preview after taking a quick fix.
  const openTurnPreviewNow = useCallback(() => {
    if (isMultiplayer) return;
    if (isProcessing || gameState.pendingScenario || gameState.pendingSideHustleUpgrade) return;
    playClick();
    setTurnPreview(buildTurnPreview(gameState));
    setShowTurnPreview(true);
    setShowReopenPreviewPill(false);
  }, [buildTurnPreview, gameState, isMultiplayer, isProcessing]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      }
      const key = event.key.toLowerCase();
      const openActions = () => {
        if (uiV2Enabled) {
          setV2Path('/play');
        } else {
          setActiveTab(TABS.OVERVIEW);
        }
        setOpenActionsSignal((prev) => prev + 1);
      };
      const openMoneyTab = (tab: 'invest' | 'portfolio' | 'bank') => {
        if (uiV2Enabled) {
          setV2Path('/money');
          setForcedMoneyTab(tab);
        } else {
          const tabId = tab === 'invest' ? TABS.INVEST : tab === 'portfolio' ? TABS.ASSETS : TABS.BANK;
          setActiveTab(tabId);
        }
      };
      const openLifeTab = (tab: 'lifestyle' | 'sidehustles') => {
        if (uiV2Enabled) {
          setV2Path('/life');
          setForcedLifeTab(tab);
        } else {
          const tabId = tab === 'lifestyle' ? TABS.LIFESTYLE : TABS.SIDEHUSTLE;
          setActiveTab(tabId);
        }
      };

      switch (key) {
        case 'n':
          event.preventDefault();
          if (showTurnPreview && turnPreview) {
            confirmTurnPreview();
          } else {
            handleNextTurn();
          }
          break;
        case 't':
          event.preventDefault();
          setAutoPlaySpeed(autoPlaySpeed ? null : AUTOPLAY_SPEED_OPTIONS[0]);
          break;
        case 'a':
          event.preventDefault();
          openActions();
          break;
        case 'i':
          event.preventDefault();
          openMoneyTab('invest');
          break;
        case 'p':
          event.preventDefault();
          openMoneyTab('portfolio');
          break;
        case 'b':
          event.preventDefault();
          openMoneyTab('bank');
          break;
        case 'c':
          event.preventDefault();
          if (uiV2Enabled) setV2Path('/career');
          else setActiveTab(TABS.CAREER);
          break;
        case 'e':
          event.preventDefault();
          if (uiV2Enabled) setV2Path('/learn');
          else setActiveTab(TABS.EDUCATION);
          break;
        case 's':
          event.preventDefault();
          openLifeTab('sidehustles');
          break;
        case 'l':
          event.preventDefault();
          openLifeTab('lifestyle');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoPlaySpeed, confirmTurnPreview, handleNextTurn, showTurnPreview, turnPreview, uiV2Enabled]);

  // Auto-play
  // Autoplay should feel "hands-off": it temporarily pauses itself while any blocking UI is open
  // (events, confirmation dialogs, special market flows, etc.) and then continues automatically.
  // Players can always stop it explicitly via the header button, keyboard (Shift+A), or the event popup.
  const isTutorialActive = showTutorial && !tutorialDismissed && tutorialStep < tutorialTips.length;
  const isEmergencyCashModal = gameState.cash <= 0 && !gameState.isBankrupt && gameState.assets.length > 0;
  const pendingSideHustle = gameState.pendingSideHustleUpgrade
    ? gameState.activeSideHustles.find(h => h.id === gameState.pendingSideHustleUpgrade?.hustleId)
    : null;
  const pendingSideHustleMilestone = pendingSideHustle?.milestones?.[gameState.pendingSideHustleUpgrade?.milestoneIndex ?? -1];

  const isAutoplayBlocked =
    !!gameState.pendingScenario ||
    !!gameState.pendingSideHustleUpgrade ||
    !!marketSpecialAction ||
    !!confirmDialog ||
    !!showMortgageModal ||
    !!introVideoTabId ||
    showSaveManager ||
    showQuestLog ||
    !!imageLightbox ||
    showAccessibility ||
    showTurnPreview ||
    showSideHustleUpgradeModal ||
    isProcessing ||
    isTutorialActive ||
    isEmergencyCashModal ||
    gameState.hasWon ||
    gameState.isBankrupt;

  useEffect(() => {
    if (autoPlaySpeed === null || isAutoplayBlocked) return;
    const t = setTimeout(advanceMonth, autoPlaySpeed);
    return () => clearTimeout(t);
  }, [autoPlaySpeed, isAutoplayBlocked, gameState.month, advanceMonth]);

  // Unified keyboard shortcut handler
  // Handles Escape (close modals by z-index priority), Shift+A (autoplay toggle), Enter (confirm turn preview)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable;

      // Handle Enter - confirm turn preview
      if (e.key === 'Enter' && showTurnPreview) {
        confirmTurnPreview();
        return;
      }

      // Handle Shift+A - toggle autoplay
      if (!isTyping && !e.repeat && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setAutoPlaySpeed((prev) => (prev ? null : AUTOPLAY_SPEED_OPTIONS[0]));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showSaveManager, confirmDialog, showAccessibility, imageLightbox,
    introVideoTabId, showTurnPreview, showTutorial, tutorialDismissed,
    tutorialStep, tutorialTips.length, showMortgageModal,
    confirmTurnPreview
  ]);

  // ============================================
  // SCENARIO CHOICE
  // ============================================
  const handleScenarioChoice = (idx: number) => {
    if (!gameState.pendingScenario) return;
    playClick();

    const scenario = gameState.pendingScenario;
    const option = scenario.options[idx];
    const outcome: any = option.outcome;

    const labelLower = (option.label || '').toLowerCase();

    // Special economic flows (so choices clearly affect Assets/Liabilities)
    const isPanicSell = scenario.id === 'recession_starts' && labelLower.includes('panic sell');
    const isBuyDipLabel = labelLower.includes('buy the dip');
    const isMarketCrashOpportunity = scenario.id === 'market_crash_opportunity' && (labelLower.includes('invest') || labelLower.includes('all in'));
    const isHousingBuyMore = scenario.id === 'housing_bubble' && labelLower.includes('buy more');

    if (isPanicSell) {
      const patchedOutcome = {
        ...outcome,
        cashChange: 0,
        message: 'You decided to fire-sell assets to feel “safe” again. Choose what to sell at a 30% fire-sale discount.'
      };
      const newState = applyScenarioOutcome(gameState, patchedOutcome);
      setGameState(newState);
      recordAutosave(newState);

      // Open asset selection modal (default: everything selected)
      const sel: Record<string, boolean> = {};
      (gameState.assets || []).forEach(a => { sel[a.id] = true; });
      setPanicSellSelection(sel);

      setMarketSpecialAction({
        type: 'PANIC_SELL',
        discount: 0.3,
        title: '📉 Panic Sell',
        description:
          'Choose which assets to fire-sell now. You receive ~70% of current value. Mortgaged properties may create a deficiency balance.'
      });
      return;
    }

    if (isBuyDipLabel || isMarketCrashOpportunity || isHousingBuyMore) {
      const budget = (typeof outcome.cashChange === 'number' && outcome.cashChange < 0) ? Math.abs(outcome.cashChange) : 0;
      const discount = scenario.id === 'housing_bubble' ? 0.2 : 0.3;

      const patchedOutcome = {
        ...outcome,
        cashChange: 0,
        message: `Opportunity: pick a deal to buy at ${Math.round(discount * 100)}% below market price (up to ${formatMoneyFull(budget)}).`
      };
      const newState = applyScenarioOutcome(gameState, patchedOutcome);
      setGameState(newState);
      recordAutosave(newState);

      setDiscountBuyItemId(null);
      setDiscountBuyQuantity(1);
      setMarketSpecialAction({
        type: 'BUY_DISCOUNT',
        budget,
        discount,
        title: '🔥 Market Sale',
        description: `Choose what to buy at ${Math.round(discount * 100)}% below market price. You can invest up to ${formatMoneyFull(budget)} (and no more than your available cash).`
      });
      return;
    }

    const newState = applyScenarioOutcome(gameState, outcome);
    setGameState(newState);
    recordAutosave(newState);
    if (outcome.cashChange) {
      setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: outcome.cashChange! }]);
      outcome.cashChange > 0 ? playMoneyGain(outcome.cashChange) : playMoneyLoss();
    }
  };

  const runEventLabSimulation = useCallback(() => {
    if (!eventLabEvent) return;
    const option = eventLabEvent.options[eventLabOptionIdx];
    if (!option) return;
    const clone = JSON.parse(JSON.stringify(gameState)) as GameState;
    clone.pendingScenario = eventLabEvent;
    const result = applyScenarioOutcome(clone, option.outcome);
    const statsDelta: Partial<PlayerStats> = {};
    (['happiness', 'health', 'energy', 'stress', 'networking', 'financialIQ', 'fulfillment'] as const).forEach(key => {
      const nextVal = result.stats?.[key] ?? clone.stats?.[key];
      const prevVal = gameState.stats?.[key];
      if (typeof nextVal === 'number' && typeof prevVal === 'number') {
        const delta = Math.round(nextVal - prevVal);
        if (delta !== 0) statsDelta[key] = delta;
      }
    });

    setEventLabSimulation({
      cashDelta: Math.round(result.cash - gameState.cash),
      statsDelta,
      liabilitiesDelta: (result.liabilities?.length || 0) - (gameState.liabilities?.length || 0),
      assetsDelta: (result.assets?.length || 0) - (gameState.assets?.length || 0),
      message: t(option.outcome.message)
    });
  }, [eventLabEvent, eventLabOptionIdx, gameState]);

  const injectEventLab = useCallback(() => {
    if (!eventLabEvent) return;
    if (gameState.pendingScenario) {
      showNotif(t('events.eventAlreadyActiveTitle'), t('events.eventAlreadyActiveBody'), 'warning');
      return;
    }
    setGameState(prev => ({ ...prev, pendingScenario: eventLabEvent }));
    setShowEventLab(false);
  }, [eventLabEvent, gameState.pendingScenario]);

  // ============================================
  // SPECIAL MARKET EVENT FLOWS
  // (Buy the Dip / Panic Sell) — makes outcomes explicit and carried through to Assets/Liabilities
  // ============================================
  const closeMarketSpecialAction = useCallback(() => {
    setMarketSpecialAction(null);
    setDiscountBuyItemId(null);
    setDiscountBuyQuantity(1);
    setPanicSellSelection({});
  }, []);

  const executeDiscountBuy = useCallback(() => {
    if (!marketSpecialAction || marketSpecialAction.type !== 'BUY_DISCOUNT') return;

    const item = MARKET_ITEMS.find(i => i.id === discountBuyItemId);
    if (!item) {
      showNotif('Choose a Deal', 'Select an asset to buy on sale.', 'warning');
      return;
    }
    if (!hasRequiredEducationForInvestment(item, gameState.education.degrees)) {
      showNotif('Education Required', 'Complete the required education to unlock this investment.', 'error');
      return;
    }

    const discount = marketSpecialAction.discount;
    const budgetCap = Math.max(0, marketSpecialAction.budget);

    const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);
    const basePrice = Math.round(item.price * inflationMult);
    const unitPrice = Math.max(1, Math.round(basePrice * (1 - discount)));

    const singleUnit = item.type === AssetType.REAL_ESTATE || item.type === AssetType.BUSINESS;
    const maxSpend = Math.min(budgetCap, gameState.cash);
    const maxUnits = singleUnit ? (unitPrice <= maxSpend ? 1 : 0) : Math.floor(maxSpend / unitPrice);

    if (maxUnits <= 0) {
      showNotif('Not Enough Cash', `You need at least ${formatMoneyFull(unitPrice)} available to grab this deal.`, 'error');
      return;
    }

    const qty = singleUnit ? 1 : Math.max(1, Math.min(discountBuyQuantity, maxUnits));
    const totalCost = unitPrice * qty;

    if (totalCost > gameState.cash) {
      showNotif('Not Enough Cash', `You need ${formatMoneyFull(totalCost)} but only have ${formatMoneyFull(gameState.cash)}.`, 'error');
      return;
    }

    playPurchase();

    setGameState(prev => {
      const inflationMultPrev = Math.pow(1 + prev.economy.inflationRate, prev.month / 12);
      const basePricePrev = Math.round(item.price * inflationMultPrev);
      const unitPricePrev = Math.max(1, Math.round(basePricePrev * (1 - discount)));
      const totalCostPrev = unitPricePrev * qty;

      if (prev.cash < totalCostPrev) return prev;

      const existing = prev.assets.find(a => a.name === item.name && a.type === item.type && !a.mortgageId);
      let updatedAssets: Asset[];

      if (existing) {
        const prevQty = typeof existing.quantity === 'number' ? existing.quantity : 1;
        const newQty = prevQty + qty;
        const newCostBasis = ((existing.costBasis * prevQty) + (unitPricePrev * qty)) / newQty;

        updatedAssets = prev.assets.map(a => a.id === existing.id ? {
          ...a,
          quantity: newQty,
          costBasis: newCostBasis,
          value: basePricePrev,
          cashFlow: (item.expectedYield * basePricePrev) / 12,
          purchasePrice: unitPricePrev
        } : a);
      } else {
        const newAsset: Asset = {
          id: 'asset-' + Date.now().toString(),
          name: item.name,
          type: item.type,
          // Market value vs what you paid
          value: basePricePrev,
          costBasis: unitPricePrev,
          quantity: qty,
          appreciationRate: item.appreciationRate || (item.expectedYield * 0.4),
          volatility: item.volatility,
          baseYield: item.expectedYield,
          cashFlow: (item.expectedYield * basePricePrev) / 12,
          purchasedMonth: prev.month,
          purchasePrice: unitPricePrev,
          industry: item.industry,
          description: item.description,
          priceHistory: [{ month: prev.month, value: basePricePrev }]
        };
        updatedAssets = [...prev.assets, newAsset];
      }

      return {
        ...prev,
        cash: prev.cash - totalCostPrev,
        assets: updatedAssets,
        events: [{
          id: Date.now().toString(),
          month: prev.month,
          title: `🔥 Bought on Sale: ${item.name}`,
          description: `Purchased ${qty}x at ${Math.round(discount * 100)}% off for ${formatMoneyFull(totalCostPrev)} total.`,
          type: 'DECISION'
        }, ...prev.events]
      };
    });

    setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: -totalCost }]);
    playMoneyLoss();
    showNotif('Deal Captured!', `Bought ${qty}x ${item.name} at ${Math.round(discount * 100)}% off (${formatMoneyFull(totalCost)}).`, 'success');
    maybeConfetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

    closeMarketSpecialAction();
  }, [marketSpecialAction, discountBuyItemId, discountBuyQuantity, gameState.cash, gameState.economy.inflationRate, gameState.month, closeMarketSpecialAction]);

  const executePanicSell = useCallback(() => {
    if (!marketSpecialAction || marketSpecialAction.type !== 'PANIC_SELL') return;

    const discount = marketSpecialAction.discount;
    const selectedIds = Object.entries(panicSellSelection)
      .filter(([, v]) => !!v)
      .map(([id]) => id);

    if (selectedIds.length === 0) {
      showNotif('Select Assets', 'Choose at least one asset to panic sell.', 'warning');
      return;
    }

    // Preview (for UI feedback)
    const preview = (() => {
      let net = 0;
      for (const id of selectedIds) {
        const a = gameState.assets.find(x => x.id === id);
        if (!a) continue;
        const qty = typeof a.quantity === 'number' ? a.quantity : 1;
        const gross = a.value * qty;
        const fireSale = Math.round(gross * (1 - discount));

        const mtg = a.mortgageId
          ? (gameState.mortgages.find(m => m.id === a.mortgageId) || gameState.mortgages.find(m => m.assetId === id))
          : gameState.mortgages.find(m => m.assetId === id);

        if (mtg) {
          net += Math.max(0, fireSale - mtg.balance);
        } else {
          net += fireSale;
        }
      }
      return net;
    })();

    playWarning();

    setGameState(prev => {
      let cashDelta = 0;
      let nextAssets = [...prev.assets];
      let nextLiabilities = [...prev.liabilities];
      let nextMortgages = [...prev.mortgages];

      const soldNames: string[] = [];
      const deficiencyNotes: string[] = [];

      for (const assetId of selectedIds) {
        const asset = nextAssets.find(a => a.id === assetId);
        if (!asset) continue;

        const qty = typeof asset.quantity === 'number' ? asset.quantity : 1;
        const gross = asset.value * qty;
        const fireSale = Math.round(gross * (1 - discount));

        const mortgage = asset.mortgageId
          ? (nextMortgages.find(m => m.id === asset.mortgageId) || nextMortgages.find(m => m.assetId === assetId))
          : nextMortgages.find(m => m.assetId === assetId);

        if (mortgage) {
          if (fireSale >= mortgage.balance) {
            cashDelta += fireSale - mortgage.balance;
          } else {
            const deficiency = mortgage.balance - fireSale;
            const newLiability: Liability = {
              id: 'def-' + Date.now().toString() + '-' + assetId,
              name: `Deficiency Balance (${asset.name})`,
              balance: deficiency,
              originalBalance: deficiency,
              interestRate: 0.12,
              monthlyPayment: Math.max(50, Math.round(deficiency / 36)),
              type: 'PERSONAL_LOAN'
            };
            nextLiabilities = [...nextLiabilities, newLiability];
            deficiencyNotes.push(`${asset.name}: ${formatMoneyFull(deficiency)}`);
          }

          // Remove mortgage + its matching liability (id)
          nextLiabilities = nextLiabilities.filter(l => l.id !== mortgage.id && l.assetId !== mortgage.assetId);
          nextMortgages = nextMortgages.filter(m => m.id !== mortgage.id);
        } else {
          cashDelta += fireSale;
        }

        nextAssets = nextAssets.filter(a => a.id !== assetId);
        soldNames.push(asset.name);
      }

      if (soldNames.length === 0) return prev;

      const desc = [
        `Fire-sold ${soldNames.join(', ')} at ${Math.round(discount * 100)}% below value.`,
        `Net cash received: ${formatMoneyFull(cashDelta)}.`,
        deficiencyNotes.length ? `Deficiency created: ${deficiencyNotes.join('; ')}.` : ''
      ].filter(Boolean).join(' ');

      return {
        ...prev,
        cash: prev.cash + cashDelta,
        assets: nextAssets,
        liabilities: nextLiabilities,
        mortgages: nextMortgages,
        events: [{
          id: Date.now().toString(),
          month: prev.month,
          title: '📉 Panic Sale Executed',
          description: desc,
          type: 'DECISION'
        }, ...prev.events]
      };
    });

    setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: preview }]);
    preview > 0 ? playMoneyGain(preview) : playMoneyLoss();
    showNotif('Fire Sale Complete', `You panic sold ${selectedIds.length} asset(s).`, 'warning');

    closeMarketSpecialAction();
  }, [marketSpecialAction, panicSellSelection, gameState.assets, gameState.mortgages, closeMarketSpecialAction]);



  // ============================================
  // MONTHLY ACTIONS (Adult mode)
  // ============================================
  const handleUseMonthlyAction = (actionId: MonthlyActionId) => {
    if (isProcessing) return;
    if (gameState.pendingScenario) {
      showNotif('Resolve Event First', 'Please respond to the current event before taking Monthly Actions.', 'warning');
      return;
    }
    if (gameState.isBankrupt) {
      showNotif('Game Over', 'You are bankrupt and can no longer take actions.', 'error');
      return;
    }

    playClick();
    const beforeCash = gameState.cash;
    const { newState, message } = applyMonthlyAction(gameState, actionId);

    // No-op or blocked action
    if (newState === gameState) {
      showNotif('Cannot Do That', message, 'warning');
      return;
    }

    setGameState(newState);
    recordAutosave(newState);

    const cashDelta = newState.cash - beforeCash;
    if (Math.abs(cashDelta) >= 1) {
      setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: cashDelta }]);
      cashDelta > 0 ? playMoneyGain(cashDelta) : playMoneyLoss();
    }

    showNotif('Monthly Action Used', message, 'success');
  };

  const handleUseMonthlyActions = useCallback((actionIds: MonthlyActionId[]) => {
    if (actionIds.length === 0) return;
    if (isProcessing) return;
    if (gameState.pendingScenario) {
      showNotif('Resolve Event First', 'Please respond to the current event before taking Monthly Actions.', 'warning');
      return;
    }
    if (gameState.isBankrupt) {
      showNotif('Game Over', 'You are bankrupt and can no longer take actions.', 'error');
      return;
    }

    playClick();

    let workingState = gameState;
    let appliedCount = 0;

    actionIds.forEach((actionId) => {
      const beforeCash = workingState.cash;
      const { newState, message } = applyMonthlyAction(workingState, actionId);
      if (newState === workingState) {
        showNotif('Cannot Do That', message, 'warning');
        return;
      }

      appliedCount += 1;
      workingState = newState;

      const cashDelta = newState.cash - beforeCash;
      if (Math.abs(cashDelta) >= 1) {
        setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: cashDelta }]);
        cashDelta > 0 ? playMoneyGain(cashDelta) : playMoneyLoss();
      }

      showNotif('Monthly Action Used', message, 'success');
    });

    if (appliedCount === 0) return;
    setGameState(workingState);
    recordAutosave(workingState);
  }, [gameState, isProcessing, playClick, playMoneyGain, playMoneyLoss, recordAutosave, showNotif]);

  const monthlyActionsSummary = useMemo(
    () => getMonthlyActionsSummary(gameState, isProcessing),
    [gameState, isProcessing]
  );

  const handleManualPromotion = useCallback(() => {
    if (isProcessing) return;
    if (!gameState.career) return;
    if (gameState.pendingScenario) {
      showNotif('Resolve Event First', 'Please respond to the current event before requesting a promotion.', 'warning');
      return;
    }
    if (gameState.isBankrupt) {
      showNotif('Game Over', 'You are bankrupt and can no longer advance your career.', 'error');
      return;
    }

    const careerInfo = CAREER_PATHS[gameState.career.path];
    if (!careerInfo) return;
    const currentLevel = gameState.career.level;
    if (currentLevel >= careerInfo.levels.length) {
      showNotif('Top Level', 'You are already at the top of this career path.', 'info');
      return;
    }
    const nextLevel = careerInfo.levels[currentLevel];
    const experience = gameState.career.experience ?? 0;
    if (experience < nextLevel.experienceRequired) {
      showNotif('More Experience Needed', `Reach ${nextLevel.experienceRequired} months of experience to promote.`, 'warning');
      return;
    }
    if (nextLevel.educationRequired && nextLevel.educationCategory) {
      const levelOrder = ['HIGH_SCHOOL', 'CERTIFICATE', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'MBA', 'PHD', 'LAW', 'MEDICAL'];
      const hasRelevantEducation = gameState.education.degrees.some(degId => {
        const edu = EDUCATION_OPTIONS.find(e => e.id === degId);
        if (!edu) return false;
        const requiredIdx = levelOrder.indexOf(nextLevel.educationRequired!);
        const hasIdx = levelOrder.indexOf(edu.level);
        return hasIdx >= requiredIdx && edu.category === nextLevel.educationCategory;
      });
      if (!hasRelevantEducation) {
        showNotif(
          'Education Required',
          `Need ${nextLevel.educationRequired.replace('_', ' ')} in ${nextLevel.educationCategory}.`,
          'warning'
        );
        return;
      }
    }

    const { promoted, newState } = checkPromotion(gameState);
    if (!promoted) {
      showNotif('Promotion Pending', 'Keep boosting happiness and networking to improve promotion odds.', 'info');
      return;
    }

    setGameState(newState);
    recordAutosave(newState);
    playLevelUp();
    showNotif('🎉 Promotion!', `Promoted to ${newState.career?.title}!`, 'success');
  }, [gameState, isProcessing, playLevelUp, recordAutosave, showNotif]);

  

  // ============================================
  // BUY ASSET (with or without mortgage)
  // ============================================
  const handleBuyAsset = useCallback((item: MarketItem, mortgageOptionId?: string) => {
    if (!hasRequiredEducationForInvestment(item, gameState.education.degrees)) {
      playError();
      showNotif('Education Required', 'Complete the required education to unlock this investment.', 'error');
      return;
    }

    const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);
    const listPrice = Math.round(item.price * inflationMult);

    // Negotiation Mastery perk: better deals on negotiable assets
    const negotiationDiscountPct = gameState.negotiationsPerks?.dealDiscountPct ?? 0;
    const isNegotiableDeal = item.type === AssetType.REAL_ESTATE || item.type === AssetType.BUSINESS;
    const price = isNegotiableDeal && negotiationDiscountPct > 0 ? Math.round(listPrice * (1 - negotiationDiscountPct)) : listPrice;
    
    if (mortgageOptionId && item.canMortgage) {
      const assetId = 'asset-' + Date.now().toString();
      const mortgageOpt = MORTGAGE_OPTIONS.find(o => o.id === mortgageOptionId);
      if (!mortgageOpt) { playError(); return; }
      const creditAdjust = getMortgageCreditAdjustments(creditScore, mortgageOptionId, dti);
      if (creditScore < creditAdjust.minScore) {
        playError();
        showNotif('Credit Too Low', `Need credit score ${creditAdjust.minScore}+ for this mortgage.`, 'error');
        return;
      }
      if (Math.random() > creditAdjust.approvalChance) {
        playError();
        showNotif('Mortgage Denied', 'The lender declined your application based on credit and debt load.', 'error');
        return;
      }
      const adjustedDownPercent = Math.max(3.5, Math.min(40, mortgageOpt.downPaymentPercent + creditAdjust.downPaymentPercentDelta));
      const result = createMortgage(assetId, item.name, price, mortgageOptionId, gameState.economy.interestRate, {
        downPaymentPercent: adjustedDownPercent,
        rateAdjustment: creditAdjust.rateAdjustment
      });
      if (!result) { playError(); return; }
      
      if (gameState.cash < result.downPayment) {
        playError();
        showNotif('Insufficient Funds', `Need ${formatMoneyFull(result.downPayment)} for down payment`, 'error');
        return;
      }
      
      playPurchase();
      setGameState(prev => {
        const baseMonthly = (item.expectedYield * price) / 12;
        const asset: Asset = {
          id: assetId,
          name: item.name,
          type: item.type,
          value: price,
          costBasis: price,
          quantity: 1,
          cashFlow: baseMonthly,
          volatility: item.volatility,
          appreciationRate: item.expectedYield * 0.4,
          priceHistory: [{ month: prev.month, value: price }],
          baseYield: item.expectedYield,
          industry: item.industry,
          mortgageId: result.mortgage.id,
          opsUpgrade: item.type === AssetType.BUSINESS ? false : undefined,
          currentMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly) : undefined,
          lastMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly) : undefined
        };
        return {
          ...prev,
          cash: prev.cash - result.downPayment,
          assets: [...prev.assets, asset],
          liabilities: [...prev.liabilities, result.liability],
          mortgages: [...prev.mortgages, result.mortgage],
          events: [{
            id: Date.now().toString(),
            month: prev.month,
            title: `🏠 Purchased ${item.name}`,
            description: `${formatMoneyFull(result.downPayment)} down, ${formatMoneyFull(result.mortgage.monthlyPayment)}/mo mortgage`,
            type: 'DECISION'
          }, ...prev.events]
        };
      });
      setShowMortgageModal(null);
      maybeConfetti({ particleCount: 40, spread: 50 });
      showNotif('Property Purchased!', `Mortgage: ${formatMoneyFull(result.mortgage.monthlyPayment)}/mo`, 'success');
    } else {
      // Cash purchase
      if (gameState.cash < price) {
        playError();
        showNotif('Insufficient Funds', `Need ${formatMoneyFull(price)}`, 'error');
        return;
      }
      
      playPurchase();
      setGameState(prev => {
        const existing = prev.assets.find(a => a.name === item.name && !a.mortgageId);
        let newAssets = [...prev.assets];
        
        if (existing) {
          const idx = newAssets.findIndex(a => a.id === existing.id);
          const newQuantity = existing.quantity + 1;
          const newCostBasis = ((existing.costBasis * existing.quantity) + price) / newQuantity;
          // Recalculate average cashFlow based on new cost basis
          const newCashFlow = (item.expectedYield * newCostBasis) / 12;
          newAssets[idx] = {
            ...existing,
            quantity: newQuantity,
            value: price,
            costBasis: newCostBasis,
            cashFlow: newCashFlow,
            currentMonthIncome: item.type === AssetType.BUSINESS ? Math.round(newCashFlow * newQuantity) : existing.currentMonthIncome,
            lastMonthIncome: item.type === AssetType.BUSINESS ? (existing.lastMonthIncome ?? Math.round(existing.cashFlow * existing.quantity)) : existing.lastMonthIncome
          };
        } else {
          const baseMonthly = (item.expectedYield * price) / 12;
          newAssets.push({
            id: 'asset-' + Date.now(),
            name: item.name,
            type: item.type,
            value: price,
            costBasis: price,
            quantity: 1,
            cashFlow: baseMonthly,
            volatility: item.volatility,
            appreciationRate: item.expectedYield * 0.4,
            priceHistory: [{ month: prev.month, value: price }],
            baseYield: item.expectedYield,
            industry: item.industry,
            opsUpgrade: item.type === AssetType.BUSINESS ? false : undefined,
            currentMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly) : undefined,
            lastMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly) : undefined
          });
        }
        
        return {
          ...prev,
          cash: prev.cash - price,
          assets: newAssets,
          events: [{
            id: Date.now().toString(),
            month: prev.month,
            title: `📦 Purchased ${item.name}`,
            description: `Bought for ${formatMoneyFull(price)} cash`,
            type: 'DECISION'
          }, ...prev.events]
        };
      });
      queuePurchaseNotif(item.name, price);
    }
  }, [gameState]);

  // ============================================
  // BATCH BUY (Securities)
  // ============================================
  const isBatchBuyEligible = (item: MarketItem) => {
    return [
      AssetType.STOCK,
      AssetType.INDEX_FUND,
      AssetType.BOND,
      AssetType.CRYPTO,
      AssetType.COMMODITY
    ].includes(item.type);
  };

  const toggleBatchBuyMode = () => {
    playClick();
    setBatchBuyMode(prev => {
      const next = !prev;
      if (!next) {
        setBatchBuyQuantities({});
      }
      return next;
    });
  };

  const setBatchQty = (itemId: string, qty: number) => {
    setBatchBuyQuantities(prev => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = qty;
      }
      return next;
    });
  };

  const clearBatchBuyCart = () => {
    playClick();
    setBatchBuyQuantities({});
  };

  const executeBatchBuy = () => {
    if (batchBuyCart.lines.length === 0) {
      showNotif('Cart Empty', 'Select quantities on securities first.', 'warning');
      return;
    }

    if (!batchBuyCart.canAfford) {
      showNotif(
        'Not Enough Cash',
        `Total is ${formatMoneyFull(batchBuyCart.totalCost)} but you only have ${formatMoneyFull(gameState.cash)}.`,
        'error'
      );
      return;
    }

    playPurchase();

    setGameState(prev => {
      const inflationMult = Math.pow(1 + prev.economy.inflationRate, prev.month / 12);

      let cash = prev.cash;
      let assets = [...prev.assets];
      let totalSpent = 0;

      const purchased: string[] = [];

      for (const line of batchBuyCart.lines) {
        const item = line.item;
        if (!isBatchBuyEligible(item)) continue;

        const unitPrice = Math.round(item.price * inflationMult);
        const qty = Math.max(1, line.qty);
        const lineTotal = unitPrice * qty;

        if (cash < lineTotal) break;

        cash -= lineTotal;
        totalSpent += lineTotal;
        purchased.push(`${qty}x ${item.name}`);

        const existing = assets.find(a => a.name === item.name && a.type === item.type && !a.mortgageId);
        if (existing) {
          const prevQty = typeof existing.quantity === 'number' ? existing.quantity : 1;
          const newQty = prevQty + qty;
          const newCostBasis = ((existing.costBasis * prevQty) + (unitPrice * qty)) / newQty;

          assets = assets.map(a => a.id === existing.id ? {
            ...a,
            quantity: newQty,
            costBasis: newCostBasis,
            value: unitPrice,
            cashFlow: (item.expectedYield * unitPrice) / 12,
            purchasePrice: unitPrice
          } : a);
        } else {
          const baseMonthly = (item.expectedYield * unitPrice) / 12;
          const newAsset: Asset = {
            id: 'asset-' + Date.now().toString() + '-' + item.id,
            name: item.name,
            type: item.type,
            value: unitPrice,
            costBasis: unitPrice,
            quantity: qty,
            appreciationRate: item.appreciationRate || (item.expectedYield * 0.4),
            volatility: item.volatility,
            baseYield: item.expectedYield,
            cashFlow: baseMonthly,
            purchasedMonth: prev.month,
            purchasePrice: unitPrice,
            industry: item.industry,
            description: item.description,
            priceHistory: [{ month: prev.month, value: unitPrice }],
            opsUpgrade: item.type === AssetType.BUSINESS ? false : undefined,
            currentMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly * qty) : undefined,
            lastMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly * qty) : undefined
          };
          assets.push(newAsset);
        }
      }

      if (totalSpent <= 0) return prev;

      return {
        ...prev,
        cash,
        assets,
        events: [{
          id: Date.now().toString(),
          month: prev.month,
          title: '📦 Batch Purchase',
          description: `Bought ${purchased.join(', ')} for ${formatMoneyFull(totalSpent)} total.`,
          type: 'DECISION'
        }, ...prev.events]
      };
    });

    setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: -batchBuyCart.totalCost }]);
    playMoneyLoss();
    showNotif(
      'Batch Purchase Complete!',
      `Bought ${batchBuyCart.lines.length} ${batchBuyCart.lines.length === 1 ? 'security' : 'securities'} for ${formatMoneyFull(batchBuyCart.totalCost)}.`,
      'success'
    );

    maybeConfetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

    // Clear cart (keep mode on for rapid re-buying)
    setBatchBuyQuantities({});
  };

  const openBatchBuyConfirm = () => {
    if (batchBuyCart.lines.length === 0) {
      showNotif('Cart Empty', 'Select quantities on securities first.', 'warning');
      return;
    }

    const details = batchBuyCart.lines.map(l => ({
      label: `${l.qty}x ${l.item.name}`,
      value: `${formatMoneyFull(l.lineTotal)} (${formatMoneyFull(l.unitPrice)} each)`
    }));

    details.push({
      label: 'TOTAL',
      value: formatMoneyFull(batchBuyCart.totalCost)
    });

    openConfirmDialog({
      title: 'Confirm Batch Purchase',
      description: 'You are about to buy the following securities:',
      details,
      confirmLabel: `Buy (${formatMoneyFull(batchBuyCart.totalCost)})`,
      cancelLabel: 'Cancel',
      onConfirm: executeBatchBuy
    });
  };



  // ============================================
  // SELL ASSET
  // ============================================
  const handleSellAsset = useCallback((assetId: string) => {
    playSell();
    setGameState(prev => {
      const asset = prev.assets.find(a => a.id === assetId);
      if (!asset) return prev;

      const qty = typeof asset.quantity === 'number' ? asset.quantity : 1;
      const baseSaleValue = asset.value * qty;

      // Negotiation Mastery perk: slightly better exits on negotiable assets
      const negotiationSaleBonusPct = prev.negotiationsPerks?.saleBonusPct ?? 0;
      const isNegotiableDeal = asset.type === AssetType.REAL_ESTATE || asset.type === AssetType.BUSINESS;
      const saleValue = isNegotiableDeal && negotiationSaleBonusPct > 0
        ? Math.round(baseSaleValue * (1 + negotiationSaleBonusPct))
        : baseSaleValue;

      // Find mortgage by explicit mortgageId first (backwards compatible), then by assetId
      const mortgage = asset.mortgageId
        ? (prev.mortgages.find(m => m.id === asset.mortgageId) || prev.mortgages.find(m => m.assetId === assetId))
        : prev.mortgages.find(m => m.assetId === assetId);

      // If mortgaged, pay off mortgage first
      let netProceeds = saleValue;
      if (mortgage) {
        netProceeds = saleValue - mortgage.balance;
        if (netProceeds < 0) {
          // Can't sell - underwater
          showNotif('Cannot Sell', 'Property is underwater (worth less than mortgage).', 'error');
          return prev;
        }
      }

      const nextLiabilities = mortgage
        ? prev.liabilities.filter(l => l.id !== mortgage.id && l.assetId !== mortgage.assetId)
        : prev.liabilities;

      const nextMortgages = mortgage
        ? prev.mortgages.filter(m => m.id !== mortgage.id)
        : prev.mortgages;

      return {
        ...prev,
        cash: prev.cash + netProceeds,
        assets: prev.assets.filter(a => a.id !== assetId),
        liabilities: nextLiabilities,
        mortgages: nextMortgages,
        events: [{
          id: Date.now().toString(),
          month: prev.month,
          title: `💰 Sold ${asset.name}`,
          description: `Sold for ${formatMoneyFull(saleValue)}${mortgage ? ` (${formatMoneyFull(netProceeds)} after mortgage)` : ''}`,
          type: 'DECISION'
        }, ...prev.events]
      };
    });
  }, []);

  const handleRefinanceMortgage = useCallback((mortgageId: string) => {
    const mortgage = gameState.mortgages.find(m => m.id === mortgageId);
    if (!mortgage) return;

    const score = gameState.creditRating ?? 650;
    if (score < 680) {
      showNotif('Credit Too Low', 'Reach a 680+ credit score to refinance.', 'warning');
      return;
    }

    const baseSpread = mortgage.type === 'FHA' ? 0.005 : mortgage.type === 'INVESTMENT' ? 0.01 : 0;
    const newRate = gameState.economy.interestRate + baseSpread + getCreditRateAdjustment(score) * 0.6;
    if (newRate >= mortgage.interestRate - 0.005) {
      showNotif('No Better Rate', 'Current market rates are not favorable enough to refinance.', 'info');
      return;
    }

    const remainingYears = Math.max(1, Math.ceil(mortgage.monthsRemaining / 12));
    const newPayment = calculateLoanPayment(mortgage.balance, newRate, remainingYears * 12);
    const savings = mortgage.monthlyPayment - newPayment;
    const closingCost = Math.round(mortgage.balance * 0.01);

    openConfirmDialog({
      title: `Refinance ${mortgage.assetName}`,
      description: 'Refinancing resets your rate and payment. Closing costs are due upfront.',
      details: [
        { label: 'Current rate', value: formatPercent(mortgage.interestRate) },
        { label: 'New rate', value: formatPercent(newRate) },
        { label: 'Current payment', value: formatMoneyFull(mortgage.monthlyPayment) },
        { label: 'New payment', value: formatMoneyFull(newPayment) },
        { label: 'Monthly savings', value: `${savings >= 0 ? '+' : ''}${formatMoneyFull(Math.abs(savings))}` },
        { label: 'Closing costs', value: formatMoneyFull(closingCost) },
      ],
      confirmLabel: 'Refinance',
      cancelLabel: 'Cancel',
      danger: closingCost > gameState.cash,
      onConfirm: () => {
        if (gameState.cash < closingCost) {
          showNotif('Insufficient Funds', `Need ${formatMoneyFull(closingCost)} for closing costs.`, 'error');
          return;
        }

        playPurchase();
        setGameState(prev => ({
          ...prev,
          cash: prev.cash - closingCost,
          mortgages: prev.mortgages.map(m => m.id === mortgageId
            ? { ...m, interestRate: newRate, monthlyPayment: newPayment }
            : m),
          liabilities: prev.liabilities.map(l => l.id === mortgageId
            ? { ...l, interestRate: newRate, monthlyPayment: newPayment }
            : l),
          events: [{
            id: Date.now().toString(),
            month: prev.month,
            title: `🏦 Refinance Approved: ${mortgage.assetName}`,
            description: `New rate ${formatPercent(newRate)}, payment ${formatMoneyFull(newPayment)}/mo.`,
            type: 'DECISION'
          }, ...prev.events]
        }));

        showNotif('Refinance Complete', `Payment lowered by ${formatMoneyFull(Math.max(0, savings))}/mo`, 'success');
      },
      onCancel: () => playClick(),
    });
  }, [gameState]);

  // ============================================
  // TAKE LOAN
  // ============================================
  const handleTakeLoan = useCallback((loanOption: AdjustedLoanOption) => {
    const payment = calculateLoanPayment(loanOption.amount, loanOption.rate, loanOption.term);
    const projectedDebtPayments = cashFlow.debtPayments + payment;
    const projectedDti = cashFlow.income > 0 ? projectedDebtPayments / cashFlow.income : 1;
    const approvalChance = getLoanApprovalChance(creditScore, projectedDti);
    const utilizationPct = Math.round(creditUtilization * 100);
    const creditImpactNote = projectedDti >= 0.4
      ? 'Likely to decrease credit due to higher debt-to-income.'
      : 'Likely stable if payments stay on time.';

    openConfirmDialog({
      title: `Confirm Loan: ${loanOption.name}`,
      description: 'Loans are permanent until repaid. Confirm before taking on new debt.',
      details: [
        { label: 'Cash received now', value: formatMoneyFull(loanOption.amount) },
        { label: 'APR', value: `${(loanOption.rate * 100).toFixed(1)}%` },
        { label: 'Term', value: `${loanOption.term} months` },
        { label: 'Est. monthly payment', value: formatMoneyFull(payment) },
        { label: 'Debt-to-income after loan', value: `${Math.round(projectedDti * 100)}%` },
        { label: 'Credit utilization', value: `${utilizationPct}%` },
        { label: 'Approval chance', value: `${Math.round(approvalChance * 100)}%` },
        { label: 'Credit impact', value: creditImpactNote },
      ],
      confirmLabel: 'Take Loan',
      cancelLabel: 'Cancel',
      danger: true,
      onConfirm: () => {
        if (Math.random() > approvalChance) {
          playError();
          showNotif('Loan Denied', 'The bank rejected your application based on credit and debt load.', 'error');
          return;
        }
        playPurchase();
        setGameState(prev => {
          const newLiability: Liability = {
            id: 'loan-' + Date.now(),
            name: loanOption.name,
            balance: loanOption.amount,
            originalBalance: loanOption.amount,
            interestRate: loanOption.rate,
            monthlyPayment: payment,
            type: 'PERSONAL_LOAN'
          };

          return {
            ...prev,
            cash: prev.cash + loanOption.amount,
            liabilities: [...prev.liabilities, newLiability],
            events: [{
              id: Date.now().toString(),
              month: prev.month,
              title: `💳 Took ${loanOption.name}`,
              description: `Received ${formatMoneyFull(loanOption.amount)} at ${formatPercent(loanOption.rate)} APR, ${formatMoneyFull(payment)}/mo`,
              type: 'DECISION'
            }, ...prev.events]
          };
        });

        setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: loanOption.amount }]);
        playMoneyGain(loanOption.amount);
        showNotif('Loan Approved!', `${formatMoneyFull(loanOption.amount)} deposited`, 'success');
      },
      onCancel: () => {
        playClick();
      }
    });
  }, [cashFlow.debtPayments, cashFlow.income, creditScore, creditUtilization, openConfirmDialog]);

  // ============================================
  // PAY DEBT
  // ============================================
  const handlePayDebt = useCallback((liabilityId: string, amount?: number) => {
    const liability = gameState.liabilities.find(l => l.id === liabilityId);
    if (!liability) return;
    
    const payAmount = amount || Math.min(liability.balance, gameState.cash);
    if (payAmount <= 0 || gameState.cash < payAmount) {
      playError();
      showNotif('Insufficient Funds', 'Not enough cash to pay', 'error');
      return;
    }
    
    playMoneyLoss();
    setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: -payAmount }]);
    
    setGameState(prev => {
      const newLiabilities = prev.liabilities.map(l => {
        if (l.id === liabilityId) {
          const newBalance = l.balance - payAmount;
          return { ...l, balance: Math.max(0, newBalance) };
        }
        return l;
      }).filter(l => l.balance > 0);
      
      const paidOff = !newLiabilities.find(l => l.id === liabilityId);
      if (paidOff) {
        playAchievement();
        showNotif('🎉 Debt Paid Off!', liability.name, 'success');
      }
      
      return {
        ...prev,
        cash: prev.cash - payAmount,
        liabilities: newLiabilities,
        events: [{
          id: Date.now().toString(),
          month: prev.month,
          title: paidOff ? `✅ Paid Off ${liability.name}` : `💸 Paid ${formatMoneyFull(payAmount)} on ${liability.name}`,
          description: paidOff ? 'Debt eliminated!' : `Remaining: ${formatMoneyFull(liability.balance - payAmount)}`,
          type: 'DECISION'
        }, ...prev.events]
      };
    });
  }, [gameState]);

  const handleBusinessOpsUpgrade = useCallback((assetId: string) => {
    const asset = gameState.assets.find(a => a.id === assetId);
    if (!asset || asset.type !== AssetType.BUSINESS) return;
    if (asset.opsUpgrade) {
      showNotif('Ops Upgrade Active', 'This business already has upgraded operations.', 'info');
      return;
    }

    const cost = getOpsUpgradeCost(asset);
    if (gameState.cash < cost) {
      showNotif('Insufficient Funds', `Need ${formatMoneyFull(cost)} for ops upgrade.`, 'error');
      return;
    }

    playPurchase();
    setGameState(prev => ({
      ...prev,
      cash: prev.cash - cost,
      assets: prev.assets.map(a => a.id === assetId ? { ...a, opsUpgrade: true } : a),
      events: [{
        id: Date.now().toString(),
        month: prev.month,
        title: '🛠️ Ops Upgrade Installed',
        description: `${asset.name} volatility reduced and maintenance risk lowered.`,
        type: 'DECISION'
      }, ...prev.events]
    }));
    showNotif('Ops Upgrade Purchased', `Applied to ${asset.name}.`, 'success');
  }, [gameState.assets, gameState.cash]);

  // ============================================
  // EDUCATION
  // ============================================
  const handleEnrollEducation = useCallback((edu: EducationOption) => {
    // Check if currently enrolled (handle both null and undefined)
    const isCurrentlyEnrolled = gameState.education.currentlyEnrolled && 
                                gameState.education.currentlyEnrolled.educationId;
    
    if (isCurrentlyEnrolled) {
      playError();
      showNotif('Already Enrolled', 'Complete current program first', 'error');
      return;
    }
    
    // Check if already completed this degree
    if (gameState.education.degrees.includes(edu.id)) {
      playError();
      showNotif('Already Completed', 'You already have this degree', 'error');
      return;
    }
    
    // Check prerequisites
    if (edu.requirements) {
      const hasPrereq = edu.requirements.some(req => 
        gameState.education.degrees.some(d => {
          const degree = EDUCATION_OPTIONS.find(e => e.id === d);
          return degree && degree.level === req;
        })
      );
      if (!hasPrereq) {
        playError();
        showNotif('Prerequisites Missing', `Requires ${edu.requirements.join(' or ')} degree`, 'error');
        return;
      }
    }
    
    // Check if can afford deposit (10% upfront for expensive degrees, full for cheap ones)
    const isExpensive = edu.cost > 20000;
    const deposit = isExpensive ? Math.round(edu.cost * 0.1) : edu.cost;
    
    if (gameState.cash < deposit) {
      playError();
      showNotif('Insufficient Funds', `Need ${formatMoneyFull(deposit)} ${isExpensive ? 'deposit' : 'to enroll'}`, 'error');
      return;
    }
    
    const isRelevant = edu.relevantCareers.includes(careerPath);
    const loanAmount = isExpensive ? edu.cost - deposit : 0;
    const estLoanPayment = isExpensive ? Math.round(loanAmount / edu.duration) : 0;
    const needsConfirm = isExpensive || !isRelevant || deposit >= 5000;

    const doEnroll = () => {
      playPurchase();
      setGameState(prev => {
        const newLiabilities = [...prev.liabilities];
        if (isExpensive) {
          newLiabilities.push({
            id: 'student-loan-' + Date.now(),
            name: `${edu.name} Student Loan`,
            balance: loanAmount,
            originalBalance: loanAmount,
            interestRate: 0.065, // 6.5% student loan rate
            monthlyPayment: estLoanPayment,
            type: 'STUDENT_LOAN'
          });
        }

        return {
          ...prev,
          cash: prev.cash - deposit,
          liabilities: newLiabilities,
          education: {
            ...prev.education,
            currentlyEnrolled: {
              educationId: edu.id,
              monthsRemaining: edu.duration,
              monthlyPayment: 0 // Payment is now handled by liability
            }
          },
          events: [{
            id: Date.now().toString(),
            month: prev.month,
            title: `📚 Started ${edu.name}`,
            description: isRelevant
              ? `This will boost your ${CAREER_PATHS[careerPath].name} career by ${Math.round((edu.salaryBoost - 1) * 100)}%!${isExpensive ? ` Student loan: ${formatMoneyFull(loanAmount)}` : ''}`
              : `⚠️ Warning: This degree won't help your ${CAREER_PATHS[careerPath].name} career.`,
            type: 'DECISION'
          }, ...prev.events]
        };
      });

      showNotif(
        isRelevant ? '🎓 Great Choice!' : '⚠️ Career Mismatch',
        isRelevant
          ? `${edu.name} will boost your salary!`
          : `${edu.name} won't benefit your ${CAREER_PATHS[careerPath].name} career`,
        isRelevant ? 'success' : 'warning'
      );
    };

    if (needsConfirm) {
      openConfirmDialog({
        title: `Confirm Enrollment: ${edu.name}`,
        description: 'Education is a long-term commitment. Confirm before enrolling in expensive or mismatched programs.',
        details: [
          { label: 'Upfront payment', value: formatMoneyFull(deposit) },
          ...(isExpensive
            ? [
                { label: 'Student loan', value: formatMoneyFull(loanAmount) },
                { label: 'Est. loan payment', value: `${formatMoneyFull(estLoanPayment)}/mo` },
                { label: 'Duration', value: `${edu.duration} months` },
              ]
            : [{ label: 'Duration', value: `${edu.duration} months` }]),
          { label: 'Career relevance', value: isRelevant ? '✅ Relevant' : '⚠️ Not relevant' },
          { label: 'Salary boost', value: `+${Math.round((edu.salaryBoost - 1) * 100)}%` },
        ],
        confirmLabel: 'Enroll',
        cancelLabel: 'Cancel',
        danger: !isRelevant || isExpensive,
        onConfirm: doEnroll,
        onCancel: () => playClick(),
      });
      return;
    }

    doEnroll();
  }, [gameState, careerPath, openConfirmDialog]);

  // ============================================
  // SIDE HUSTLES
  // ============================================
  const handleStartSideHustle = useCallback((hustle: SideHustle) => {
    // Check if already active
    if (gameState.activeSideHustles.find(h => h.id === hustle.id)) {
      playError();
      showNotif('Already Active', 'You are already doing this side hustle', 'error');
      return;
    }
    
    // Check startup cost
    if (gameState.cash < hustle.startupCost) {
      playError();
      showNotif('Insufficient Funds', `Need ${formatMoneyFull(hustle.startupCost)} startup cost`, 'error');
      return;
    }
    
    // Check education requirements
    if (hustle.requiredEducation && hustle.requiredEducation.length > 0) {
      const hasRequired = hustle.requiredEducation.some(reqCat =>
        gameState.education.degrees.some(d => {
          const degree = EDUCATION_OPTIONS.find(e => e.id === d);
          return degree && degree.category === reqCat;
        })
      );
      if (!hasRequired) {
        playError();
        showNotif('Education Required', `Need ${hustle.requiredEducation.join(' or ')} education`, 'error');
        return;
      }
    }

    // Check career requirements
    const careerLevel = gameState.career?.level ?? gameState.playerJob?.level ?? 0;
    if (hustle.requiredCareerLevel && careerLevel < hustle.requiredCareerLevel) {
      playError();
      showNotif('Career Level Required', `Reach career level ${hustle.requiredCareerLevel} to unlock this hustle.`, 'error');
      return;
    }
    if (hustle.requiredCareerPath && hustle.requiredCareerPath.length > 0) {
      if (!gameState.career?.path || !hustle.requiredCareerPath.includes(gameState.career.path)) {
        playError();
        showNotif('Career Path Required', 'This hustle unlocks for a specific career path.', 'error');
        return;
      }
    }
    
    // Check energy
    if (gameState.stats.energy < hustle.energyCost) {
      playError();
      showNotif('Too Tired', 'Not enough energy for this side hustle', 'error');
      return;
    }
    
    playPurchase();
    
    setGameState(prev => ({
      ...prev,
      cash: prev.cash - hustle.startupCost,
      activeSideHustles: [...prev.activeSideHustles, { ...hustle, isActive: true, monthsActive: 0, upgrades: [] }],
      events: [{
        id: Date.now().toString(),
        month: prev.month,
        title: `🚀 Started ${hustle.name}`,
        description: `Expected income: ${formatMoneyFull(hustle.incomeRange.min)}-${formatMoneyFull(hustle.incomeRange.max)}/mo`,
        type: 'DECISION'
      }, ...prev.events]
    }));
    
    if (hustle.startupCost > 0) {
      setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: -hustle.startupCost }]);
    }
    showNotif('Side Hustle Started!', `${hustle.name} is now active`, 'success');
  }, [gameState]);

  const handleStopSideHustle = useCallback((hustleId: string) => {
    playClick();
    const hustle = gameState.activeSideHustles.find(h => h.id === hustleId);
    
    setGameState(prev => ({
      ...prev,
      activeSideHustles: prev.activeSideHustles.filter(h => h.id !== hustleId),
      pendingSideHustleUpgrade: prev.pendingSideHustleUpgrade?.hustleId === hustleId ? null : prev.pendingSideHustleUpgrade,
      events: [{
        id: Date.now().toString(),
        month: prev.month,
        title: `🛑 Stopped ${hustle?.name || 'Side Hustle'}`,
        description: 'Side hustle discontinued',
        type: 'DECISION'
      }, ...prev.events]
    }));
    
    showNotif('Side Hustle Stopped', hustle?.name || 'Hustle', 'info');
  }, [gameState]);

  const handleSideHustleUpgradeChoice = useCallback((optionId: string) => {
    const pending = gameState.pendingSideHustleUpgrade;
    if (!pending) return;

    const hustle = gameState.activeSideHustles.find(h => h.id === pending.hustleId);
    const milestone = hustle?.milestones?.[pending.milestoneIndex];
    const option = milestone?.options.find(opt => opt.id === optionId);
    if (!hustle || !option) return;

    if (gameState.cash < option.cost) {
      showNotif('Insufficient Funds', `Need ${formatMoneyFull(option.cost)} to upgrade.`, 'error');
      return;
    }

    option.cost > 0 ? playPurchase() : playClick();
    setGameState(prev => {
      const target = prev.activeSideHustles.find(h => h.id === pending.hustleId);
      const targetMilestone = target?.milestones?.[pending.milestoneIndex];
      const targetOption = targetMilestone?.options.find(opt => opt.id === optionId);
      if (!target || !targetOption) return prev;

      const upgrades = [...(target.upgrades || [])];
      upgrades[pending.milestoneIndex] = targetOption.id;

      return {
        ...prev,
        cash: prev.cash - targetOption.cost,
        activeSideHustles: prev.activeSideHustles.map(h => h.id === target.id ? { ...h, upgrades } : h),
        pendingSideHustleUpgrade: null,
        events: [{
          id: Date.now().toString(),
          month: prev.month,
          title: `🧩 ${target.name} Upgrade`,
          description: `${targetOption.label} selected.`,
          type: 'DECISION'
        }, ...prev.events]
      };
    });
    setShowSideHustleUpgradeModal(false);
    showNotif('Upgrade Applied', `${hustle.name}: ${option.label}`, 'success');
  }, [gameState]);

  // ============================================
  // LIFESTYLE
  // ============================================
  const handleChangeLifestyle = useCallback((lifestyle: Lifestyle) => {
    if (lifestyle === gameState.lifestyle) {
      playClick();
      return;
    }

    const current = LIFESTYLE_OPTS[gameState.lifestyle];
    const next = LIFESTYLE_OPTS[lifestyle];
    const delta = next.cost - current.cost;

    openConfirmDialog({
      title: 'Confirm Lifestyle Change',
      description: 'Lifestyle changes immediately affect your monthly expenses and wellbeing. Confirm to avoid costly mis-clicks.',
      details: [
        { label: 'From', value: `${gameState.lifestyle} (${formatMoneyFull(current.cost)}/mo)` },
        { label: 'To', value: `${lifestyle} (${formatMoneyFull(next.cost)}/mo)` },
        { label: 'Monthly cost change', value: `${delta >= 0 ? '+' : ''}${formatMoneyFull(delta)}/mo` },
        { label: 'Happiness impact', value: `${next.happiness >= 0 ? '+' : ''}${next.happiness}` },
      ],
      confirmLabel: 'Change Lifestyle',
      cancelLabel: 'Cancel',
      danger: delta > 0,
      onConfirm: () => {
        playClick();
        setGameState(prev => ({ ...prev, lifestyle }));
        showNotif('Lifestyle Changed', `Now living ${lifestyle.toLowerCase()}`, 'info');
      },
      onCancel: () => {
        playClick();
      }
    });
  }, [gameState.lifestyle, openConfirmDialog]);

  // ============================================
  // SCREENS
  // ============================================
  
  // Welcome Screen
  if (!gameStarted && !showCharacterSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
          {onBackToMenu && (
            <button onClick={onBackToMenu} className="absolute top-4 left-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-all">
              ← Back to Menu
            </button>
          )}
          <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-7xl mb-4">💰</motion.div>
          <h1 className="text-5xl font-bold text-white mb-2">Tycoon</h1>
          <p className="text-emerald-400 font-medium text-xl">Financial Freedom Simulator</p>
          <p className="text-slate-400 mt-2 mb-6">Build wealth • Invest wisely • Beat the robots</p>
          
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleQuickStart}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg text-xl mb-4">
            🚀 Start Your Journey
          </motion.button>
          
          <button
            onClick={toggleSound}
            className="p-3 bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <p className="text-slate-500 text-sm mt-6">v3.4.3 • Autoplay Continues After Events • Stop Autoplay in Event Popups • Event Cooldowns • Save/Load • Event Images</p>
        </motion.div>
      </div>
    );
  }

  // Character Select Screen
  if (showCharacterSelect) {
    if (showCustomAvatarBuilder) {
      return (
        <CustomAvatarBuilder
          onCancel={() => setShowCustomAvatarBuilder(false)}
          onComplete={handleCreateCustomCharacter}
        />
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Choose Your Path</h1>
            <p className="text-slate-400">⚠️ Some careers are more AI-proof than others!</p>
          </div>
          
          {/* Difficulty Selection */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {(Object.keys(DIFFICULTY_SETTINGS) as Array<keyof typeof DIFFICULTY_SETTINGS>).map(diff => (
              <motion.button key={diff} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { playClick(); setSelectedDifficulty(diff); }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedDifficulty === diff ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {DIFFICULTY_SETTINGS[diff].label}
              </motion.button>
            ))}
          </div>
          
          <p className="text-center text-slate-500 text-sm mb-6">{DIFFICULTY_SETTINGS[selectedDifficulty].description}</p>
          
          {/* Character Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCustomAvatarBuilder(true)}
              className="bg-slate-800/50 border border-emerald-500/40 rounded-2xl p-4 cursor-pointer hover:border-emerald-400 transition-all flex flex-col items-center justify-center text-center min-h-[260px]"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl mb-3">
                <Plus size={28} className="text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold text-white">Create Custom</h3>
              <p className="text-sm text-slate-400 mt-2">
                Build a 3D Pixar-style avatar from your photo.
              </p>
              <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
                Optional
              </div>
            </motion.div>
            {CHARACTERS.map(char => {
              const career = CAREER_PATHS[char.careerPath];
              const futureProof = career.futureProofScore;
              
              return (
                <motion.div key={char.id} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectCharacter(char)}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 cursor-pointer hover:border-emerald-500/50 transition-all">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${char.avatarColor} flex items-center justify-center text-2xl mb-3 mx-auto`}>
                    {char.avatarEmoji}
                  </div>
                  <h3 className="text-lg font-bold text-white text-center">{char.name}</h3>
                  <p className="text-emerald-400 text-sm text-center">{career.icon} {career.name}</p>
                  <p className="text-slate-400 text-xs text-center mb-2 line-clamp-2">{char.backstory}</p>

                  <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-2 mb-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 text-center">Perk</p>
                    <p className="text-xs text-slate-200 text-center font-medium">{char.perk.name}</p>
                    <p className="text-[11px] text-slate-400 text-center">{char.perk.description}</p>
                  </div>
                  
                  {/* AI-Proof Rating */}
                  <div className={`text-center p-2 rounded-lg mb-2 ${
                    futureProof >= 80 ? 'bg-emerald-900/30 border border-emerald-700/50' : 
                    futureProof >= 50 ? 'bg-amber-900/30 border border-amber-700/50' : 
                    'bg-red-900/30 border border-red-700/50'}`}>
                    <div className="flex items-center justify-center gap-1">
                      <Bot size={12} />
                      <span className="text-xs font-medium">AI-Proof: {futureProof}%</span>
                    </div>
                  </div>
                  
                  <div className="text-center text-xs text-slate-500">
                    Starting: {formatMoney(DIFFICULTY_SETTINGS[selectedDifficulty].startingCash + (char.startingBonus.type === 'cash' && char.startingBonus.amount > 0 ? char.startingBonus.amount : 0))}
                    {char.startingBonus.amount < 0 && <span className="text-red-400"> + {formatMoney(Math.abs(char.startingBonus.amount))} debt</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN GAME SCREEN
  // ============================================
  const autoInvest = gameState.autoInvest || { enabled: false, maxPercent: 20, allocations: [] };
  const updateAutoInvest = (next: typeof autoInvest) => {
    setGameState(prev => ({ ...prev, autoInvest: next }));
  };
  const applyAutoInvestPreset = (presetId: string) => {
    const preset = AUTO_INVEST_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    updateAutoInvest({
      enabled: true,
      maxPercent: Math.max(0, Math.min(50, Math.floor(preset.maxPercent))),
      allocations: preset.allocations.map((alloc) => ({
        itemId: alloc.itemId,
        percent: Math.max(0, Math.min(100, Math.floor(alloc.percent)))
      }))
    });
  };

  const investTabProps = {
    formatMoney,
    formatMoneyFull,
    formatPercent,
    gameState,
    investmentFilter,
    setInvestmentFilter,
    investmentTierFilter,
    setInvestmentTierFilter,
    investmentSearch,
    setInvestmentSearch,
    filteredInvestments,
    batchBuyMode,
    toggleBatchBuyMode,
    clearBatchBuyCart,
    batchBuyQuantities,
    setBatchBuyQuantities,
    batchBuyCart,
    openBatchBuyConfirm,
    autoInvest,
    onUpdateAutoInvest: updateAutoInvest,
    onOpenGlossary: () => setShowGlossary(true),
    handleBuyAsset,
    hasRequiredEducationForInvestment,
    getAssetIcon,
    getItemTier,
    getRiskRating,
    isProcessing,
    playClick,
    setShowMortgageModal,
    setSelectedMortgage,
    isBatchBuyEligible,
    setBatchQty,
    quizTitle: activeQuiz?.title,
    quizIntro: activeQuiz?.intro,
    quizQuestions: activeQuiz?.questions || [],
    quizAnswers,
    onSelectQuizAnswer: handleSelectQuizAnswer,
    onSubmitQuiz: handleSubmitQuiz,
    onSkipQuiz: () => {
      if (activeQuizId) markQuizSeen(activeQuizId);
    }
  };

  const portfolioTabProps = {
    gameState,
    cashFlow,
    formatMoney,
    formatPercent,
    getAssetIcon,
    getBusinessIncomeRange,
    getOpsUpgradeCost,
    handleRefinanceMortgage,
    handleSellAsset,
    handleBusinessOpsUpgrade,
    handlePayDebt,
    creditScore,
    coachHint
  };

  const bankTabProps = {
    gameState,
    creditTier,
    creditScore,
    formatMoney,
    formatPercent,
    getCreditTierColor,
    coachBankLoansRef,
    coachHighlight,
    adjustedLoanOptions,
    calculateLoanPayment,
    handleTakeLoan,
    handlePayDebt
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-24 md:pb-4">
      {/* Floating Numbers */}
      <AnimatePresence>
        {floatingNumbers.map(fn => (
          <FloatingNumber key={fn.id} value={fn.value} onComplete={() => setFloatingNumbers(p => p.filter(f => f.id !== fn.id))} />
        ))}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl w-[min(24rem,calc(100vw-2rem))]" style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                notification.type === 'success' ? 'bg-emerald-500/20' : 
                notification.type === 'error' ? 'bg-red-500/20' : 
                notification.type === 'warning' ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                {notification.type === 'success' ? <CheckCircle className="text-emerald-400" size={20} /> :
                 notification.type === 'error' ? <X className="text-red-400" size={20} /> :
                 notification.type === 'warning' ? <AlertTriangle className="text-amber-400" size={20} /> :
                 <Sparkles className="text-blue-400" size={20} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white">{notification.title}</h4>
                <p className="text-slate-400 text-sm">{notification.message}</p>
              </div>
              {notification.actionLabel && notification.onAction ? (
                <button
                  onClick={() => {
                    notification.onAction?.();
                    if (notifTimeoutRef.current) {
                      window.clearTimeout(notifTimeoutRef.current);
                      notifTimeoutRef.current = null;
                    }
                    setNotification(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 text-xs font-semibold"
                >
                  {notification.actionLabel}
                </button>
              ) : (
                <button
                  onClick={() => setNotification(null)}
                  className="text-slate-500 hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Intro Video (shows only first time a user opens a tab, unless postponed) */}
      {introVideoTabId && activeIntroVideoConfig && (
        <Modal
          isOpen={!!introVideoTabId}
          onClose={() => closeIntroVideoModal()}
          ariaLabel={`${activeIntroVideoConfig.title} intro video`}
          overlayClassName="bg-black/80 backdrop-blur-sm overflow-y-auto"
          overlayStyle={{
            paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
            paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
            paddingRight: 'calc(env(safe-area-inset-right) + 1rem)'
          }}
          contentClassName="w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-y-auto"
          contentStyle={{ maxHeight: 'calc(100dvh - 2rem)' }}
          closeOnOverlayClick
          closeOnEsc
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-5 border-b border-slate-700/60 bg-slate-800/95 backdrop-blur">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {activeIntroVideoConfig.icon}
                {activeIntroVideoConfig.title}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {activeIntroVideoConfig.description}
              </p>
            </div>
            <div className="text-right">
              {activeIntroVideoConfig.duration && (
                <div className="text-xs text-slate-400">Duration {activeIntroVideoConfig.duration}</div>
              )}
            </div>
          </div>

          <div className="p-5">
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
                  <div style={{ aspectRatio: '16 / 9' }} className="w-full relative">
                    {/* Poster thumbnail (never steals input) */}
                    {activeIntroVideoConfig.poster && !introVideoHasStarted && (
                      <img
                        src={activeIntroVideoConfig.poster}
                        alt="Intro video thumbnail"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                        draggable={false}
                      />
                    )}

                    <video
                      ref={introVideoRef}
                      poster={activeIntroVideoConfig.poster}
                      className="w-full h-full object-contain bg-black"
                      playsInline
                      muted={introVideoMuted}
                      preload={shouldPreloadVideos ? 'metadata' : 'none'}
                      controls
                      onPlay={() => {
                        // If the user presses Play (native controls or our button), unmute automatically.
                        const vid = introVideoRef.current;
                        if (vid) {
                          try {
                            vid.muted = false;
                          } catch (e) {
                            console.debug('Video unmute on play failed:', e);
                          }
                        }
                        setIntroVideoMuted(false);

                        // On mobile, automatically expand to fullscreen when playback starts.
                        tryEnterIntroVideoFullscreen(vid);

                        setIntroVideoIsPlaying(true);
                        setIntroVideoHasStarted(true);
                        setIntroVideoPlaybackError(null);
                      }}
                      onPause={() => setIntroVideoIsPlaying(false)}
                      onEnded={() => {
                        setIntroVideoIsPlaying(false);
                        if (introVideoTabId) {
                          setMinimizedTabVideos((prev) => ({ ...prev, [introVideoTabId]: true }));
                        }
                        closeIntroVideoModal({ remember: true });
                      }}
                      onError={() => {
                        const vid = introVideoRef.current;
                        const code = vid?.error?.code;
                        const codeLabel = code === 1
                          ? 'MEDIA_ERR_ABORTED'
                          : code === 2
                            ? 'MEDIA_ERR_NETWORK'
                            : code === 3
                              ? 'MEDIA_ERR_DECODE'
                              : code === 4
                                ? 'MEDIA_ERR_SRC_NOT_SUPPORTED'
                                : code
                                  ? `MEDIA_ERR_${code}`
                                  : '';
                        setIntroVideoPlaybackError(codeLabel ? `Video error: ${codeLabel}` : 'Video failed to load.');
                        setIntroVideoIsPlaying(false);
                      }}
                    >
                      <source src={activeIntroVideoConfig.src} type="video/mp4" />
                      {activeIntroVideoConfig.captionsSrc && (
                        <track
                          kind="subtitles"
                          src={activeIntroVideoConfig.captionsSrc}
                          srcLang="en"
                          label="English"
                          default
                        />
                      )}
                    </video>
                  </div>
                </div>

                {/* Always-visible playback controls */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={toggleIntroVideoPlayback}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-semibold flex items-center gap-2"
                    >
                      {introVideoIsPlaying ? <Pause size={16} /> : <Play size={16} />}
                      {introVideoIsPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={() => {
                        setIntroVideoMuted((m) => {
                          const next = !m;
                          const vid = introVideoRef.current;
                          if (vid) vid.muted = next;
                          return next;
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-semibold"
                    >
                      {introVideoMuted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-500">
                    Tap Play — sound will turn on.
                  </div>
                </div>

                {introVideoPlaybackError && (
                  <div className="mt-3 rounded-xl border border-red-700/30 bg-red-950/30 p-3">
                    <p className="text-red-200 font-semibold text-sm">Video couldn&apos;t start.</p>
                    <p className="text-red-200/80 text-xs mt-1 break-words">
                      {introVideoPlaybackError}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => void requestIntroVideoPlayback()}
                        className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/25 border border-red-500/30 text-red-100 text-xs font-semibold"
                      >
                        Try again
                      </button>
                      <button
                        onClick={() => {
                          try {
                            window.open(activeIntroVideoConfig.src, '_blank', 'noopener,noreferrer');
                          } catch (e) {
                            console.warn('Failed to open video in new tab:', e);
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Open video
                      </button>
                    </div>
                  </div>
                )}

                {(activeIntroVideoConfig.quickTips || activeIntroVideoConfig.transcript) && (
                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                      <p className="text-sm font-semibold text-white mb-2">Quick guide</p>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {(activeIntroVideoConfig.quickTips || []).map((tip, idx) => (
                          <li key={`${activeIntroVideoConfig.title}-tip-${idx}`} className="flex gap-2">
                            <span className="text-emerald-400">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                      <p className="text-sm font-semibold text-white mb-2">Transcript</p>
                      <div className="space-y-2 text-sm text-slate-300">
                        {(activeIntroVideoConfig.transcript || []).map((line, idx) => (
                          <p key={`${activeIntroVideoConfig.title}-transcript-${idx}`}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-5 flex flex-col gap-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={introVideoDontShowAgain}
                      onChange={(e) => setIntroVideoDontShowAgain(e.target.checked)}
                      className="mt-1"
                    />
                    <span>Don&apos;t show this video again</span>
                  </label>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      closeIntroVideoModal({ remember: true });
                      if (activeIntroVideoConfig.continueToTab) {
                        setActiveTab(activeIntroVideoConfig.continueToTab);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    {activeIntroVideoConfig.continueLabel || 'Continue'}
                  </motion.button>

                  <button
                    onClick={() => closeIntroVideoModal({ remember: false })}
                    className="w-full px-5 py-3 rounded-xl bg-slate-900/40 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold touch-target"
                  >
                    Skip video
                  </button>

                  <button
                    onClick={() => closeIntroVideoModal({ remember: true })}
                    className="w-full px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold touch-target"
                  >
                    Close
                  </button>
                </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog (prevents costly mis-clicks) */}
      {confirmDialog && (
        <Modal
          isOpen={!!confirmDialog}
          onClose={closeConfirmDialog}
          ariaLabel="Confirmation"
          overlayClassName="bg-black/80 backdrop-blur-sm"
          overlayStyle={{
            paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
            paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
            paddingRight: 'calc(env(safe-area-inset-right) + 1rem)'
          }}
          contentClassName="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          contentStyle={{ maxHeight: 'calc(100dvh - 2rem)' }}
          closeOnOverlayClick
          closeOnEsc
        >
          <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-700/60">
            <div>
              <h2 className="text-lg font-bold text-white">{confirmDialog.title}</h2>
              <p className="text-slate-400 text-sm mt-1">{confirmDialog.description}</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
                {confirmDialog.details && confirmDialog.details.length > 0 && (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                    <div className="space-y-2">
                      {confirmDialog.details.map((d) => (
                        <div key={d.label} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-300">{d.label}</span>
                          <span className="text-slate-200 font-semibold text-right">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      const onCancel = confirmDialog.onCancel;
                      closeConfirmDialog();
                      onCancel?.();
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold touch-target"
                  >
                    {confirmDialog.cancelLabel || 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      const onConfirm = confirmDialog.onConfirm;
                      closeConfirmDialog();
                      onConfirm();
                    }}
                    className={`w-full sm:flex-1 px-5 py-3 rounded-xl text-white font-semibold touch-target ${
                      confirmDialog.danger
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {confirmDialog.confirmLabel}
                  </button>
                </div>
          </div>
        </Modal>
      )}

      {/* Accessibility Settings */}
      {showAccessibility && (
        <Modal
          isOpen={showAccessibility}
          onClose={() => setShowAccessibility(false)}
          ariaLabel={t('settings.accessibility.ariaLabel')}
          overlayClassName="bg-black/80 backdrop-blur-sm"
          overlayStyle={{
            paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
            paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
            paddingRight: 'calc(env(safe-area-inset-right) + 1rem)'
          }}
          contentClassName="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          contentStyle={{ maxHeight: 'calc(100dvh - 2rem)' }}
          closeOnOverlayClick
          closeOnEsc
        >
          <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-700/60">
            <div>
              <h2 className="text-lg font-bold text-white">{t('settings.accessibility.title')}</h2>
              <p className="text-slate-400 text-sm mt-1">{t('settings.accessibility.subtitle')}</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-white font-semibold" htmlFor="language-select">
                    {t('settings.language.label')}
                  </label>
                  <select
                    id="language-select"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as typeof locale)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="en">{t('language.en')}</option>
                    <option value="es">{t('language.es')}</option>
                  </select>
                  <p className="text-slate-400 text-sm">{t('settings.language.helper')}</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={accessibilityPrefs.largeText}
                    onChange={(e) => setAccessibilityPrefs((p) => ({ ...p, largeText: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-white font-semibold">{t('settings.accessibility.largeText.title')}</div>
                    <div className="text-slate-400 text-sm">{t('settings.accessibility.largeText.description')}</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={accessibilityPrefs.highContrast}
                    onChange={(e) => setAccessibilityPrefs((p) => ({ ...p, highContrast: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-white font-semibold">{t('settings.accessibility.highContrast.title')}</div>
                    <div className="text-slate-400 text-sm">{t('settings.accessibility.highContrast.description')}</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={accessibilityPrefs.reduceMotion}
                    onChange={(e) => setAccessibilityPrefs((p) => ({ ...p, reduceMotion: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-white font-semibold">{t('settings.accessibility.reduceMotion.title')}</div>
                    <div className="text-slate-400 text-sm">{t('settings.accessibility.reduceMotion.description')}</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={accessibilityPrefs.disableConfetti}
                    onChange={(e) => setAccessibilityPrefs((p) => ({ ...p, disableConfetti: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-white font-semibold">{t('settings.accessibility.disableConfetti.title')}</div>
                    <div className="text-slate-400 text-sm">{t('settings.accessibility.disableConfetti.description')}</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={accessibilityPrefs.disableVideoPreload}
                    onChange={(e) => setAccessibilityPrefs((p) => ({ ...p, disableVideoPreload: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-white font-semibold">{t('settings.accessibility.disableVideoPreload.title')}</div>
                    <div className="text-slate-400 text-sm">{t('settings.accessibility.disableVideoPreload.description')}</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoTutorialPopups}
                    onChange={(e) => setAutoTutorialPopups(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-white font-semibold">{t('settings.tutorialPopups.title')}</div>
                    <div className="text-slate-400 text-sm">{t('settings.tutorialPopups.description')}</div>
                  </div>
                </label>

                <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                  <h3 className="text-sm font-semibold text-white">Keyboard shortcuts</h3>
                  <p className="text-xs text-slate-400 mt-1">Press a key to jump without clicking.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                    {[
                      ['N', 'Next Month'],
                      ['T', 'Toggle Autoplay'],
                      ['A', 'Actions'],
                      ['I', 'Invest'],
                      ['P', 'Portfolio'],
                      ['B', 'Bank'],
                      ['C', 'Career'],
                      ['E', 'Education'],
                      ['S', 'Side Hustles'],
                      ['L', 'Lifestyle']
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/40 px-3 py-2">
                        <span className="text-slate-300">{label}</span>
                        <span className="text-xs font-semibold text-emerald-300">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() =>
                      setAccessibilityPrefs({
                        largeText: false,
                        highContrast: false,
                        reduceMotion: false,
                        disableConfetti: false,
                        disableVideoPreload: false
                      })
                    }
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold"
                  >
                    {t('actions.reset')}
                  </button>
                  <button
                    onClick={() => setShowAccessibility(false)}
                    className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    {t('actions.done')}
                  </button>
                </div>
          </div>
        </Modal>
      )}

      {/* Next Month Preview (Step 10) */}
      {showTurnPreview && turnPreview && (
        <Modal
          isOpen={showTurnPreview && !!turnPreview}
          onClose={closeTurnPreview}
          ariaLabel="Next Month preview"
          overlayClassName="bg-black/80 backdrop-blur-sm"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">📅 Next Month Preview</h2>
              <p className="text-slate-400 text-sm">
                Year {turnPreview.nextYear} • Month {turnPreview.monthOfYear} (estimated)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-emerald-300">Income</h3>
                    <span className="text-xs text-slate-400">Top sources</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {turnPreview.incomeLines.slice(0, 5).map((l) => (
                      <div key={l.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{l.label}</span>
                        <span className="text-emerald-200 font-medium">{formatMoneyFull(l.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Estimated total</span>
                    <span className="text-sm font-bold text-emerald-300">{formatMoneyFull(turnPreview.income)}</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-amber-300">Expenses</h3>
                    <span className="text-xs text-slate-400">Top drivers</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {turnPreview.expenseLines.slice(0, 5).map((l) => (
                      <div key={l.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{l.label}</span>
                        <span className="text-amber-200 font-medium">{formatMoneyFull(l.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Estimated total</span>
                    <span className="text-sm font-bold text-amber-300">{formatMoneyFull(turnPreview.expenses)}</span>
                  </div>
                </div>
              </div>

              <div className={`mt-4 p-4 rounded-xl border ${
                turnPreview.warningLevel === 'SHORTFALL' ? 'bg-red-900/20 border-red-700/40' :
                turnPreview.warningLevel === 'LOW_BUFFER' ? 'bg-amber-900/20 border-amber-700/40' :
                'bg-emerald-900/10 border-emerald-700/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300">Projected cash change</div>
                  <div className={`text-sm font-bold flex items-center gap-1 ${turnPreview.netChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {turnPreview.netChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {turnPreview.netChange >= 0 ? '+' : '-'}{formatMoneyFull(Math.abs(turnPreview.netChange))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-slate-300">Projected end cash</div>
                  <div className="text-sm font-bold text-white">
                    {formatMoneyFull(Math.max(0, turnPreview.projectedEndCash))}
                  </div>
                </div>

                {lifestyleCashDelta !== null && (
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm text-slate-300">Lifestyle change impact</div>
                    <div className={`text-sm font-semibold ${lifestyleCashDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {lifestyleCashDelta >= 0 ? '+' : '-'}
                      {formatMoneyFull(Math.abs(lifestyleCashDelta))}/mo
                    </div>
                  </div>
                )}

                {turnPreview.warningLevel === 'SHORTFALL' && (
                  <div className="mt-3 text-sm text-red-200 flex items-start gap-2">
                    <AlertTriangle size={18} className="mt-0.5" />
                    <div>
                      <div className="font-semibold">Projected shortfall: {formatMoneyFull(turnPreview.shortfall)}</div>
                      <div className="text-xs text-red-200/90 mt-1">
                        You may miss payments and take a credit hit. Consider lowering lifestyle, selling an asset, or using a Monthly Action (Overtime / Hustle Sprint).
                      </div>
                    </div>
                  </div>
                )}

                {turnPreview.warningLevel === 'LOW_BUFFER' && (
                  <div className="mt-3 text-sm text-amber-200 flex items-start gap-2">
                    <AlertTriangle size={18} className="mt-0.5" />
                    <div>
                      <div className="font-semibold">Low buffer</div>
                      <div className="text-xs text-amber-200/90 mt-1">
                        One bad event could push you into delinquency. Consider building a 1–3 month cash reserve.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Coach Actions (Step 11): jump to fixes before advancing */}
              {(turnPreview.warningLevel === 'SHORTFALL' || turnPreview.warningLevel === 'LOW_BUFFER') && (
                <div className="mt-4 bg-slate-900/30 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" /> Quick Fixes
                    </h3>
                    <span className="text-xs text-slate-400">Before advancing</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Jump straight to the right place (or use a Monthly Action) to reduce cashflow risk.
                  </p>

                  {(() => {
                    const max = gameState.monthlyActionsMax ?? 2;
                    const remaining = (typeof gameState.monthlyActionsRemaining === 'number') ? gameState.monthlyActionsRemaining : max;
                    const locked = isProcessing || !!gameState.pendingScenario || !!gameState.hasWon || !!gameState.isBankrupt;
                    const energy = gameState.stats?.energy ?? 0;
                    const tooDrained = energy < 20;
                    const canUseAction = !locked && remaining > 0 && !tooDrained;
                    const hasHustle = (gameState.activeSideHustles || []).length > 0;
                    const canLowerLifestyle = gameState.lifestyle !== 'FRUGAL';
                    const hasAssets = (gameState.assets || []).length > 0;
                    const showLoan = turnPreview.warningLevel === 'SHORTFALL';

                    const btnBase = 'w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3';
                    const btnEnabled = 'bg-slate-800/40 border-slate-700 hover:border-emerald-500/40 hover:bg-slate-800/60';
                    const btnDisabled = 'bg-slate-900/20 border-slate-700/50 text-slate-500 cursor-not-allowed';

                    const goTo = (tabId: TabId, tipTitle: string, tipMessage: string, tipType: string = 'info') => {
                      playClick();
                      hideTurnPreview();
                      setActiveTab(tabId);
                      showNotif(tipTitle, tipMessage, tipType);

                      // Step 12: on-tab coach ribbon + section highlight
                      const target: CoachTarget | undefined =
                        tabId === TABS.LIFESTYLE ? 'lifestyle-grid' :
                        tabId === TABS.ASSETS ? 'assets-sell' :
                        tabId === TABS.SIDEHUSTLE ? 'sidehustles-list' :
                        tabId === TABS.BANK ? 'bank-loans' :
                        tabId === TABS.OVERVIEW ? 'monthly-actions' :
                        undefined;

                      triggerCoachHint({
                        tabId,
                        title: tipTitle,
                        message: tipMessage,
                        target,
                        allowReopenPreview: true,
                      });
                    };

                    const useAction = (actionId: MonthlyActionId) => {
                      // Close preview first so effects/notifications feel immediate.
                      hideTurnPreview();
                      setActiveTab(TABS.OVERVIEW);
                      triggerCoachHint({
                        tabId: TABS.OVERVIEW,
                        title: 'Coach Tip',
                        message: actionId === 'OVERTIME'
                          ? 'Overtime applied. Re-open the preview to see the improved projection.'
                          : 'Action applied. Re-open the preview to see the updated projection.',
                        target: 'monthly-actions',
                        allowReopenPreview: true,
                      });
                      // Allow the modal to unmount before applying the action.
                      setTimeout(() => handleUseMonthlyAction(actionId), 0);
                    };

                    const overtimeDisabledReason = locked
                      ? 'Unavailable right now'
                      : remaining <= 0
                        ? 'No actions remaining'
                        : tooDrained
                          ? 'Need 20+ energy'
                          : '';

                    const sprintDisabledReason = locked
                      ? 'Unavailable right now'
                      : remaining <= 0
                        ? 'No actions remaining'
                        : tooDrained
                          ? 'Need 20+ energy'
                          : !hasHustle
                            ? 'Start a hustle first'
                            : '';

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        <motion.button
                          whileHover={{ scale: canLowerLifestyle ? 1.02 : 1 }}
                          whileTap={{ scale: canLowerLifestyle ? 0.99 : 1 }}
                          disabled={!canLowerLifestyle}
                          onClick={() => goTo(TABS.LIFESTYLE, 'Coach Tip', 'Drop one lifestyle tier to cut monthly expenses.', 'info')}
                          className={`${btnBase} ${canLowerLifestyle ? btnEnabled : btnDisabled}`}
                        >
                          <Heart size={18} className="text-pink-300 mt-0.5" />
                          <div>
                            <p className="font-semibold text-white">Lower Lifestyle</p>
                            <p className="text-xs text-slate-400">
                              {canLowerLifestyle ? 'Reduce monthly costs (you choose the tier).' : 'Already at the lowest tier.'}
                            </p>
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: hasAssets ? 1.02 : 1 }}
                          whileTap={{ scale: hasAssets ? 0.99 : 1 }}
                          disabled={!hasAssets}
                          onClick={() => goTo(TABS.ASSETS, 'Coach Tip', 'Sell an asset to raise cash (watch out for underwater mortgages).', 'info')}
                          className={`${btnBase} ${hasAssets ? btnEnabled : btnDisabled}`}
                        >
                          <Wallet size={18} className="text-amber-300 mt-0.5" />
                          <div>
                            <p className="font-semibold text-white">Sell an Asset</p>
                            <p className="text-xs text-slate-400">
                              {hasAssets ? 'Convert an asset into cash to cover your buffer.' : 'No assets available to sell yet.'}
                            </p>
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: canUseAction ? 1.02 : 1 }}
                          whileTap={{ scale: canUseAction ? 0.99 : 1 }}
                          disabled={!canUseAction}
                          onClick={() => useAction('OVERTIME')}
                          className={`${btnBase} ${canUseAction ? btnEnabled : btnDisabled}`}
                        >
                          <Clock size={18} className="text-emerald-300 mt-0.5" />
                          <div>
                            <p className="font-semibold text-white">Use Overtime</p>
                            <p className="text-xs text-slate-400">
                              {canUseAction ? 'Monthly Action: +10% salary bonus (next month).' : overtimeDisabledReason}
                            </p>
                          </div>
                        </motion.button>

                        {hasHustle ? (
                          <motion.button
                            whileHover={{ scale: (canUseAction && hasHustle) ? 1.02 : 1 }}
                            whileTap={{ scale: (canUseAction && hasHustle) ? 0.99 : 1 }}
                            disabled={!(canUseAction && hasHustle)}
                            onClick={() => useAction('HUSTLE_SPRINT')}
                            className={`${btnBase} ${(canUseAction && hasHustle) ? btnEnabled : btnDisabled}`}
                          >
                            <Zap size={18} className="text-amber-200 mt-0.5" />
                            <div>
                              <p className="font-semibold text-white">Hustle Sprint</p>
                              <p className="text-xs text-slate-400">
                                {(canUseAction && hasHustle) ? 'Monthly Action: +25% side hustle income (next month).' : sprintDisabledReason}
                              </p>
                            </div>
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => goTo(TABS.SIDEHUSTLE, 'Coach Tip', 'Start a side hustle to increase monthly income.', 'info')}
                            className={`${btnBase} ${btnEnabled}`}
                          >
                            <Coffee size={18} className="text-sky-200 mt-0.5" />
                            <div>
                              <p className="font-semibold text-white">Start a Side Hustle</p>
                              <p className="text-xs text-slate-400">Add extra income streams (energy/stress tradeoff).</p>
                            </div>
                          </motion.button>
                        )}

                        {showLoan && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => goTo(TABS.BANK, 'Coach Warning', 'A loan can patch a shortfall fast, but increases monthly payments.', 'warning')}
                            className={`${btnBase} ${btnEnabled}`}
                          >
                            <Banknote size={18} className="text-blue-200 mt-0.5" />
                            <div>
                              <p className="font-semibold text-white">Get a Loan</p>
                              <p className="text-xs text-slate-400">Fast cash now, higher expenses later.</p>
                            </div>
                          </motion.button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="mt-3 text-xs text-slate-500">
                Estimates exclude random events, taxes, and side-hustle variance. Use this as a planning snapshot.
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-400 select-none">
                  <input
                    type="checkbox"
                    className="rounded border-slate-600 bg-slate-900"
                    checked={showNextMonthPreview}
                    onChange={(e) => setShowNextMonthPreview(e.target.checked)}
                  />
                  Show month preview
                </label>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={closeTurnPreview}
                    className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white touch-target"
                  >
                    Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmTurnPreview}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold touch-target"
                  >
                    Advance Month
                  </motion.button>
                </div>
              </div>
        </Modal>
      )}

      {/* Side Hustle Milestone Upgrade */}
      {showSideHustleUpgradeModal && pendingSideHustle && pendingSideHustleMilestone && (
        <Modal
          isOpen={showSideHustleUpgradeModal}
          onClose={() => setShowSideHustleUpgradeModal(false)}
          ariaLabel="Side hustle milestone upgrade"
          overlayClassName="bg-black/70 backdrop-blur-sm"
          contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="text-center mb-5">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl mb-3">
              {pendingSideHustle.icon}
            </div>
            <h2 className="text-2xl font-bold text-white">Milestone reached</h2>
            <p className="text-slate-400 text-sm">
              {pendingSideHustle.name} hit {pendingSideHustleMilestone.monthsRequired} months. Choose your next move.
            </p>
          </div>

          <div className="space-y-3">
            {pendingSideHustleMilestone.options.map(option => {
              const canAfford = gameState.cash >= option.cost;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSideHustleUpgradeChoice(option.id)}
                  disabled={!canAfford}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    canAfford
                      ? 'bg-slate-800/60 border-slate-600 hover:border-emerald-500/60 hover:bg-slate-700/60'
                      : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-semibold">{option.label}</p>
                      <p className="text-slate-400 text-xs">{option.description}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-emerald-300 font-semibold">{option.cost > 0 ? formatMoneyFull(option.cost) : 'Free'}</p>
                      <p className="text-slate-500 text-xs">{formatUpgradeEffects(option)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 mt-4">
            {t('hustle.upgrade.deferHint')}
          </p>
        </Modal>
      )}

      {/* Scenario Modal */}
      {gameState.pendingScenario && (
        <Modal
          isOpen={!!gameState.pendingScenario}
          onClose={() => undefined}
          ariaLabel={t('events.modalTitle')}
          overlayClassName="bg-black/80 backdrop-blur-sm"
          closeOnOverlayClick={false}
          closeOnEsc={false}
          showCloseButton={false}
          contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
              {/* Event Image (if available) */}
              {gameState.pendingScenario.image && (
                <div
                  ref={scenarioImageContainerRef}
                  className="mb-4 -mt-2 -mx-2 overflow-hidden rounded-xl relative group cursor-zoom-in select-none bg-slate-900/50 border border-slate-700/50"
                  onClick={() => openImageLightbox(gameState.pendingScenario.image!, t(gameState.pendingScenario.title))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openImageLightbox(gameState.pendingScenario.image!, t(gameState.pendingScenario.title));
                    }
                  }}
                  aria-label={t('events.enlargeImage')}
                >
                  <div className="w-full flex items-center justify-center p-2">
                    <motion.img
                      src={gameState.pendingScenario.image}
                      alt={t(gameState.pendingScenario.title)}
                      className="w-full max-h-[40vh] object-contain rounded-lg"
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.02 }}
                      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      draggable={false}
                    />
                  </div>

                  {/* Hint (always visible on mobile, hover on desktop) */}
                  <div className="absolute bottom-2 right-2 text-xs text-white/90 bg-black/40 backdrop-blur px-2 py-1 rounded-lg pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {t('events.tapToEnlarge')}
                  </div>
                </div>
              )}
              {!gameState.pendingScenario.image && (
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl ${
                  gameState.pendingScenario.category === 'AI_DISRUPTION' ? 'bg-purple-500/20' :
                  gameState.pendingScenario.category === 'MEDICAL' ? 'bg-red-500/20' :
                  gameState.pendingScenario.category === 'FAMILY_EMERGENCY' ? 'bg-red-500/20' :
                  gameState.pendingScenario.category === 'TAX' ? 'bg-amber-500/20' :
                  gameState.pendingScenario.category === 'LEGAL' ? 'bg-orange-500/20' :
                  gameState.pendingScenario.category === 'ECONOMIC' ? 'bg-blue-500/20' :
                  gameState.pendingScenario.category === 'VEHICLE' ? 'bg-slate-500/20' :
                  gameState.pendingScenario.category === 'RELATIONSHIP' ? 'bg-pink-500/20' :
                  gameState.pendingScenario.category === 'WINDFALL' ? 'bg-yellow-500/20' :
                  gameState.pendingScenario.category === 'HOUSING' ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`}>
                  {gameState.pendingScenario.category === 'AI_DISRUPTION' ? '🤖' : 
                   gameState.pendingScenario.category === 'MEDICAL' ? '🏥' :
                   gameState.pendingScenario.category === 'FAMILY_EMERGENCY' ? '👨‍👩‍👧' :
                   gameState.pendingScenario.category === 'TAX' ? '📋' :
                   gameState.pendingScenario.category === 'LEGAL' ? '⚖️' :
                   gameState.pendingScenario.category === 'ECONOMIC' ? '📉' :
                   gameState.pendingScenario.category === 'VEHICLE' ? '🚗' :
                   gameState.pendingScenario.category === 'RELATIONSHIP' ? '💕' :
                   gameState.pendingScenario.category === 'WINDFALL' ? '🎉' :
                   gameState.pendingScenario.category === 'HOUSING' ? '🏠' : '💡'}
                </div>
              )}

              {/* Autoplay controls (kept inside the modal so desktop users don't have to hunt for the header button) */}
              {!isMultiplayer && (
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full border ${
                        autoPlaySpeed
                          ? 'bg-amber-600/20 border-amber-500/40 text-amber-200'
                          : 'bg-slate-900/40 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      {autoPlaySpeed
                        ? t('autoplay.statusOn', { speed: autoplaySpeedLabel })
                        : t('autoplay.statusOff')}
                    </span>
                    <span className="hidden sm:inline">{t('autoplay.hotkeyHint')}</span>
                  </div>

                  <Button
                    size="sm"
                    variant={autoPlaySpeed ? 'secondary' : 'ghost'}
                    onClick={() => setAutoPlaySpeed(autoPlaySpeed ? null : AUTOPLAY_SPEED_OPTIONS[0])}
                    title={autoPlaySpeed ? t('autoplay.stopHint') : t('autoplay.startHint')}
                    className={autoPlaySpeed ? 'border-amber-500/40 text-amber-200 bg-amber-600/20' : ''}
                  >
                    {autoPlaySpeed ? <Pause size={14} /> : <FastForward size={14} />}
                    {autoPlaySpeed ? t('autoplay.stop') : t('autoplay.start')}
                  </Button>
                </div>
              )}

              <h2 className="text-2xl font-bold text-white text-center mb-2">{t(gameState.pendingScenario.title)}</h2>
              <p className="text-slate-400 text-center mb-6">{t(gameState.pendingScenario.description)}</p>
              <div
                ref={coachAssetsSellRef}
                className={`space-y-3 ${coachHighlight('assets-sell')}`}
              >
                {gameState.pendingScenario.options.map((opt, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => handleScenarioChoice(idx)}
                      className="justify-between text-left"
                    >
                      <span className="text-white font-medium">{t(opt.label)}</span>
                      {opt.outcome.cashChange !== 0 && opt.outcome.cashChange !== undefined && (
                        <span className={`ml-2 text-sm flex-shrink-0 ${opt.outcome.cashChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({opt.outcome.cashChange >= 0 ? '+' : ''}{formatMoney(opt.outcome.cashChange)})
                        </span>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
        </Modal>
      )}


      {/* Market Special Action Modal (Buy the Dip / Panic Sell) */}
      {marketSpecialAction && (
        <Modal
          isOpen={!!marketSpecialAction}
          onClose={closeMarketSpecialAction}
          ariaLabel="Market special action"
          overlayClassName="bg-black/80 backdrop-blur-sm"
          overlayStyle={{
            paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
          }}
          contentClassName="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          closeOnOverlayClick
          closeOnEsc
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">{marketSpecialAction.title}</h3>
              <p className="text-slate-300 text-sm mt-1">{marketSpecialAction.description}</p>
            </div>
          </div>

              {marketSpecialAction.type === 'BUY_DISCOUNT' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="text-slate-300">
                      Budget: <span className="text-white font-semibold">{formatMoneyFull(marketSpecialAction.budget)}</span>
                      <span className="text-slate-400"> • Cash: {formatMoneyFull(gameState.cash)}</span>
                    </div>
                    <div className="text-slate-400">
                      Discount: <span className="text-white font-semibold">{Math.round(marketSpecialAction.discount * 100)}%</span>
                    </div>
                  </div>

                  {(() => {
                    const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);
                    const cap = Math.min(gameState.cash, marketSpecialAction.budget);

                    const deals = MARKET_ITEMS
                      .filter(i => i.type !== AssetType.SAVINGS)
                      .map(i => {
                        const base = Math.round(i.price * inflationMult);
                        const discounted = Math.max(1, Math.round(base * (1 - marketSpecialAction.discount)));
                        const singleUnit = i.type === AssetType.REAL_ESTATE || i.type === AssetType.BUSINESS;
                        const maxUnits = singleUnit ? (discounted <= cap ? 1 : 0) : Math.floor(cap / discounted);
                        return {
                          item: i,
                          base,
                          discounted,
                          singleUnit,
                          maxUnits,
                          affordable: maxUnits > 0
                        };
                      })
                      .sort((a, b) => Number(b.affordable) - Number(a.affordable) || a.discounted - b.discounted)
                      .slice(0, 18);

                    if (deals.length === 0) {
                      return (
                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-300">
                          No deals available right now.
                        </div>
                      );
                    }

                    const selected = deals.find(d => d.item.id === discountBuyItemId) || null;

                    return (
                      <>
                        <div className="grid gap-2">
                          {deals.map(d => {
                            const isSelected = discountBuyItemId === d.item.id;
                            return (
                              <button
                                key={d.item.id}
                                onClick={() => {
                                  setDiscountBuyItemId(d.item.id);
                                  if (d.singleUnit) {
                                    setDiscountBuyQuantity(1);
                                  } else {
                                    setDiscountBuyQuantity((q) => Math.min(Math.max(1, q), Math.max(1, d.maxUnits)));
                                  }
                                }}
                                className={`text-left p-3 rounded-xl border transition ${
                                  isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/60'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-white font-semibold">{d.item.name}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{d.item.description}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                      <span className="line-through">{formatMoneyFull(d.base)}</span>
                                      <span className="ml-2 text-white font-semibold">{formatMoneyFull(d.discounted)}</span>
                                      <span className="ml-2 text-slate-400">({Math.round(marketSpecialAction.discount * 100)}% off)</span>
                                    </div>
                                  </div>
                                  <div className="text-right text-xs">
                                    <div className={`font-semibold ${d.affordable ? 'text-emerald-300' : 'text-rose-300'}`}>
                                      {d.affordable ? `Max ${d.singleUnit ? 1 : d.maxUnits}` : 'Too expensive'}
                                    </div>
                                    <div className="text-slate-400 mt-1">
                                      ~{formatMoneyFull((d.item.expectedYield * d.discounted) / 12)}/mo
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                          {!selected ? (
                            <div className="text-slate-300 text-sm">Select a deal above to continue.</div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-slate-200 font-semibold">{selected.item.name}</div>
                                {selected.singleUnit ? (
                                  <div className="text-slate-300 text-sm">Qty: <span className="text-white font-semibold">1</span></div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="w-9 h-9 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white font-bold"
                                      onClick={() => setDiscountBuyQuantity(q => Math.max(1, q - 1))}
                                      disabled={discountBuyQuantity <= 1}
                                    >
                                      −
                                    </button>
                                    <div className="min-w-[3rem] text-center text-white font-semibold">{discountBuyQuantity}</div>
                                    <button
                                      className="w-9 h-9 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white font-bold"
                                      onClick={() => setDiscountBuyQuantity(q => Math.min(selected.maxUnits, q + 1))}
                                      disabled={discountBuyQuantity >= selected.maxUnits}
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="text-slate-300">
                                  Total:
                                </div>
                                <div className="text-white font-semibold">
                                  {formatMoneyFull(selected.discounted * (selected.singleUnit ? 1 : discountBuyQuantity))}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={closeMarketSpecialAction}
                                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={executeDiscountBuy}
                                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                                >
                                  Buy on Sale
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {marketSpecialAction.type === 'PANIC_SELL' && (
                <div className="space-y-4">
                  {(() => {
                    const assets = gameState.assets || [];
                    if (assets.length === 0) {
                      return (
                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-300">
                          You have no assets to sell.
                        </div>
                      );
                    }

                    const selectedIds = Object.entries(panicSellSelection).filter(([, v]) => !!v).map(([id]) => id);
                    const preview = (() => {
                      let net = 0;
                      for (const id of selectedIds) {
                        const a = assets.find(x => x.id === id);
                        if (!a) continue;
                        const qty = typeof a.quantity === 'number' ? a.quantity : 1;
                        const gross = a.value * qty;
                        const fireSale = Math.round(gross * (1 - marketSpecialAction.discount));

                        const mtg = a.mortgageId
                          ? (gameState.mortgages.find(m => m.id === a.mortgageId) || gameState.mortgages.find(m => m.assetId === id))
                          : gameState.mortgages.find(m => m.assetId === id);

                        if (mtg) {
                          net += Math.max(0, fireSale - mtg.balance);
                        } else {
                          net += fireSale;
                        }
                      }
                      return net;
                    })();

                    return (
                      <>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              const sel: Record<string, boolean> = {};
                              assets.forEach(a => { sel[a.id] = true; });
                              setPanicSellSelection(sel);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold"
                          >
                            Select all
                          </button>
                          <button
                            onClick={() => setPanicSellSelection({})}
                            className="px-4 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold"
                          >
                            Clear
                          </button>
                          <div className="sm:ml-auto px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-200">
                            Est. cash received: <span className="text-white font-semibold">{formatMoneyFull(preview)}</span>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          {assets.map(a => {
                            const checked = !!panicSellSelection[a.id];
                            const qty = typeof a.quantity === 'number' ? a.quantity : 1;
                            const gross = a.value * qty;
                            const fireSale = Math.round(gross * (1 - marketSpecialAction.discount));

                            const mtg = a.mortgageId
                              ? (gameState.mortgages.find(m => m.id === a.mortgageId) || gameState.mortgages.find(m => m.assetId === a.id))
                              : gameState.mortgages.find(m => m.assetId === a.id);

                            const net = mtg ? Math.max(0, fireSale - mtg.balance) : fireSale;

                            return (
                              <label
                                key={a.id}
                                className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700 hover:bg-slate-800/60 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => setPanicSellSelection(prev => ({ ...prev, [a.id]: e.target.checked }))}
                                  className="mt-1 w-5 h-5"
                                />
                                <div className="flex-1">
                                  <div className="text-white font-semibold">{a.name}</div>
                                  <div className="text-xs text-slate-400 mt-1">
                                    Value: {formatMoneyFull(gross)} → Fire-sale: {formatMoneyFull(fireSale)}
                                    {mtg ? ` • Mortgage: ${formatMoneyFull(mtg.balance)} • Net: ${formatMoneyFull(net)}` : ` • Net: ${formatMoneyFull(net)}`}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={closeMarketSpecialAction}
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={executePanicSell}
                            disabled={selectedIds.length === 0}
                            className="flex-1 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/40 text-white font-semibold"
                          >
                            Execute Fire Sale
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
        </Modal>
      )}

      {/* Event Image Lightbox */}
      {imageLightbox && (
        <Modal
          isOpen={!!imageLightbox}
          onClose={closeImageLightbox}
          ariaLabel="Event image preview"
          overlayClassName="bg-black/90 backdrop-blur-sm"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="relative w-full max-w-5xl bg-transparent border-0 shadow-none"
        >
          <motion.div
            initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97, y: 8 }}
            animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full"
          >
            <motion.img
              src={imageLightbox.src}
              alt={imageLightbox.alt}
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1 }}
              transition={{ duration: 0.35 }}
              draggable={false}
            />

            <div className="mt-3 text-center text-xs text-slate-300">
              <span className="hidden sm:inline">Click</span>
              <span className="sm:hidden">Tap</span>
              <span> outside to close</span>
            </div>
          </motion.div>
        </Modal>
      )}

      {/* Mortgage Modal */}
      {showMortgageModal && (() => {
        const price = Math.round(showMortgageModal.price * Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12));
        const previews = (showMortgageModal.mortgageOptions || [])
          .map(optId =>
            buildMortgagePreview({
              item: showMortgageModal,
              optId,
              price,
              creditScore,
              dti,
              cashFlow,
              netWorth,
              baseRate: gameState.economy.interestRate,
              cash: gameState.cash
            })
          )
          .filter((preview): preview is MortgagePreview => !!preview);
        const selectedPreview = previews.find((preview) => preview.id === selectedMortgage) || null;
        const cashAfterDown = selectedPreview ? gameState.cash - selectedPreview.down : null;
        const cashflowDelta = selectedPreview ? selectedPreview.cashflowImpact : null;

        const reviewMortgage = () => {
          if (!selectedPreview) return;
          const deltaLabel = `${cashflowDelta >= 0 ? '+' : '-'}${formatMoneyFull(Math.abs(cashflowDelta))}/mo`;
          openConfirmDialog({
            title: `Confirm mortgage for ${showMortgageModal.name}`,
            description: `Buying this will reduce cash to ${formatMoneyFull(cashAfterDown || 0)} and change monthly cashflow by ${deltaLabel}.`,
            confirmLabel: 'Confirm purchase',
            cancelLabel: 'Cancel',
            details: [
              { label: 'Down payment', value: formatMoneyFull(selectedPreview.down) },
              { label: 'Monthly payment', value: `${formatMoneyFull(selectedPreview.payment)}/mo` },
              { label: 'Interest rate', value: formatPercent(selectedPreview.rate) },
              { label: 'Est. cashflow impact', value: deltaLabel }
            ],
            onConfirm: () => handleBuyAsset(showMortgageModal, selectedMortgage)
          });
        };

        return (
          <Modal
            isOpen={!!showMortgageModal}
            onClose={() => { setShowMortgageModal(null); setSelectedMortgage(''); }}
            ariaLabel="Mortgage options"
            overlayClassName="bg-black/80 backdrop-blur-sm"
            closeOnOverlayClick
            closeOnEsc
            contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-white mb-2">🏠 Finance {showMortgageModal.name}</h2>
            <p className="text-slate-400 mb-4">
              Price: {formatMoneyFull(price)}
            </p>

            <div className="space-y-3 mb-4">
              {previews.map((preview) => {
                const {
                  id,
                  name,
                  description,
                  down,
                  rate,
                  payment,
                  cashflowImpact,
                  approvalChance,
                  meetsIncomeReq,
                  meetsNetWorthReq,
                  meetsCreditReq,
                  canAfford
                } = preview;

                return (
                  <div
                    key={id}
                    onClick={() => canAfford && setSelectedMortgage(id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedMortgage === id ? 'border-emerald-500 bg-emerald-900/20' :
                      canAfford ? 'border-slate-600 hover:border-slate-500' :
                      'border-slate-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-white font-medium">{name}</span>
                      <span className="text-emerald-400">{formatMoney(down)} down</span>
                    </div>
                    <p className="text-slate-400 text-xs">{description}</p>
                    {!meetsCreditReq && (
                      <p className="text-amber-400 text-xs mt-1">Requires credit score {preview.minScore}+</p>
                    )}
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-slate-500">Rate: {formatPercent(rate)}</span>
                      <span className="text-slate-500">Payment: {formatMoney(payment)}/mo</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={`font-medium ${cashflowImpact >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        Cashflow: {cashflowImpact >= 0 ? '+' : '-'}{formatMoney(Math.abs(cashflowImpact))}/mo
                      </span>
                      <span className="text-slate-500 inline-flex items-center gap-1">
                        Est. maint
                        <Tooltip content="Estimated maintenance is 1% of purchase price per year.">
                          <Info size={12} className="text-slate-400" />
                        </Tooltip>
                        : {formatMoney(preview.maintenance)}/mo
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      Approval chance: {Math.round(approvalChance * 100)}% • DTI: {Math.round(((cashFlow.debtPayments + payment) / Math.max(1, cashFlow.income)) * 100)}%
                    </p>
                    {!meetsIncomeReq && preview.incomeRequirement !== undefined && (
                      <p className="text-red-400 text-xs mt-1">Income required: {formatMoney(preview.incomeRequirement)}/mo</p>
                    )}
                    {!meetsNetWorthReq && preview.netWorthRequirement !== undefined && (
                      <p className="text-red-400 text-xs mt-1">Net worth required: {formatMoney(preview.netWorthRequirement)}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedPreview && (
              <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wide">
                  <span>Estimated impact</span>
                  <span className={selectedPreview.cashflowImpact >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {selectedPreview.cashflowImpact >= 0 ? '+' : '-'}{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-300 flex flex-wrap gap-3">
                  <span>Rent: {formatMoney(selectedPreview.rentIncome)}/mo</span>
                  <span>Mortgage: -{formatMoney(selectedPreview.payment)}/mo</span>
                  <span>Maint: -{formatMoney(selectedPreview.maintenance)}/mo</span>
                </div>
                <p className={`mt-2 text-sm font-semibold ${selectedPreview.cashflowImpact >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  This deal is cashflow {selectedPreview.cashflowImpact >= 0 ? 'positive' : 'negative'} by ~{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo.
                </p>
                <div className="mt-3 text-xs text-slate-300">
                  Buying this will reduce cash to <span className="text-white font-semibold">{formatMoneyFull(cashAfterDown || 0)}</span> and
                  change monthly cashflow by <span className={selectedPreview.cashflowImpact >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {selectedPreview.cashflowImpact >= 0 ? '+' : '-'}{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo
                  </span>.
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowMortgageModal(null); setSelectedMortgage(''); }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all touch-target"
              >
                Cancel
              </button>
              <button
                onClick={reviewMortgage}
                disabled={!selectedMortgage}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium transition-all touch-target"
              >
                Review Purchase
              </button>
            </div>

            <button
              onClick={() => handleBuyAsset(showMortgageModal)}
              disabled={gameState.cash < price}
              className="w-full mt-3 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 text-amber-400 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-target"
            >
              Pay Full Cash ({formatMoney(price)})
            </button>
          </Modal>
        );
      })()}

      {/* Win Celebration Modal */}
      {gameState.hasWon && (
        <Modal
          isOpen={gameState.hasWon}
          onClose={() => undefined}
          ariaLabel="Financial freedom achieved"
          overlayClassName="bg-black/80"
          closeOnOverlayClick={false}
          closeOnEsc={false}
          showCloseButton={false}
          contentClassName="bg-transparent border-0 shadow-none max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-amber-900/50 to-amber-800/50 border border-amber-500/50 rounded-2xl p-8 w-full text-center"
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity }} 
              className="text-7xl mb-4">👑</motion.div>
            <h2 className="text-4xl font-bold text-amber-400 mb-2">Financial Freedom!</h2>
            <p className="text-white mb-2">Your passive income covers {Math.round(FINANCIAL_FREEDOM_TARGET_MULTIPLIER * 100)}% of your expenses!</p>
            <p className="text-amber-300/80 text-sm mb-6 italic">
              {Math.floor(gameState.month / 12) < 5 
                ? "🚀 Speed run champion! Did you even sleep?" 
                : Math.floor(gameState.month / 12) < 10 
                  ? "🎯 Impressive! You beat the system faster than most!"
                  : Math.floor(gameState.month / 12) < 20
                    ? "💪 Solid performance! Your future self is sending thank-you notes."
                    : "🐢 Slow and steady wins the race! (The race was with a snail, but still!)"
              }
            </p>
            <div className="bg-black/30 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-400">Time</p><p className="text-white font-bold">{Math.floor(gameState.month / 12)}y {gameState.month % 12}m</p></div>
              <div><p className="text-slate-400">Net Worth</p><p className="text-emerald-400 font-bold">{formatMoney(netWorth)}</p></div>
              <div><p className="text-slate-400">Passive Income</p><p className="text-amber-400 font-bold">{formatMoney(cashFlow.passive)}/mo</p></div>
              <div><p className="text-slate-400">Expenses</p><p className="text-white font-bold">{formatMoney(cashFlow.expenses)}/mo</p></div>
            </div>
            <p className="text-slate-400 text-xs mb-4">🏆 Game Over - You escaped the rat race!</p>
            <button onClick={() => { 
              playClick();
              setAutoPlaySpeed(null);
              setGameStarted(false); 
              setShowCharacterSelect(true); 
              setMonthlyReport(null);
              setActiveTab(TABS.OVERVIEW);
              setTutorialStep(0);
              setTutorialDismissed(false);
              setShowTutorial(shouldShowOnboarding());
              setGameState({
                ...INITIAL_GAME_STATE,
                quests: getInitialQuestState()
              }); 
            }} 
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition-all">
              🎮 Play Again
            </button>
          </motion.div>
        </Modal>
      )}

      {/* Bankruptcy Modal */}
      {gameState.isBankrupt && (
        <Modal
          isOpen={gameState.isBankrupt}
          onClose={() => undefined}
          ariaLabel="Bankruptcy"
          overlayClassName="bg-black/90"
          closeOnOverlayClick={false}
          closeOnEsc={false}
          showCloseButton={false}
          contentClassName="bg-transparent border-0 shadow-none max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-red-900/50 to-slate-900/50 border border-red-500/50 rounded-2xl p-8 w-full text-center"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl mb-4"
            >💸</motion.div>
            <h2 className="text-4xl font-bold text-red-400 mb-2">BROKE!</h2>
            <p className="text-white mb-2">Your wallet has filed for emotional support.</p>
            <p className="text-slate-400 text-sm mb-4 italic">
              {Math.floor(gameState.month / 12) < 2 
                ? "Speedrun bankruptcy! That's... actually impressive in a way? 😬"
                : Math.floor(gameState.month / 12) < 5
                  ? "The bank called. They said 'LOL.' Then hung up. 📞"
                  : "Your credit score is now a cautionary tale told to finance students. 📚"}
            </p>
            <div className="bg-black/30 rounded-xl p-4 mb-6 text-sm">
              <p className="text-slate-400 mb-2">📊 The Damage Report</p>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-slate-400">Time Survived</p><p className="text-white font-bold">{Math.floor(gameState.month / 12)}y {gameState.month % 12}m</p></div>
                <div><p className="text-slate-400">Credit Rating</p><p className="text-red-400 font-bold">{gameState.creditRating || 'N/A'} 📉</p></div>
                <div><p className="text-slate-400">Missed Payments</p><p className="text-red-400 font-bold">{gameState.missedPayments || 0} 😅</p></div>
                <div><p className="text-slate-400">Final Debt</p><p className="text-red-400 font-bold">{formatMoney(gameState.liabilities.reduce((s, l) => s + l.balance, 0))}</p></div>
              </div>
            </div>
            <p className="text-yellow-400 text-sm mb-4">
              💡 Pro tip: Emergency funds are like umbrellas. You never need one until you REALLY need one.
            </p>
            <button onClick={() => { 
              playClick();
              setAutoPlaySpeed(null);
              setGameStarted(false); 
              setShowCharacterSelect(true); 
              setMonthlyReport(null);
              setActiveTab(TABS.OVERVIEW);
              setTutorialStep(0);
              setTutorialDismissed(false);
              setShowTutorial(shouldShowOnboarding());
              setGameState({
                ...INITIAL_GAME_STATE,
                quests: getInitialQuestState()
              }); 
            }} 
              className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all">
              🎮 Redemption Arc Time
            </button>
          </motion.div>
        </Modal>
      )}

      {/* Quick Tutorial Modal */}
      {showQuickTutorial && gameStarted && !gameState.pendingScenario && !gameState.isBankrupt && (
        <Modal
          isOpen={showQuickTutorial}
          onClose={() => {
            setShowQuickTutorial(false);
            if (quickTutorialDontShow) {
              try {
                localStorage.setItem(QUICK_TUTORIAL_STORAGE_KEY, '1');
              } catch (e) {
                console.warn('Failed to save quick tutorial preference:', e);
              }
            }
          }}
          ariaLabel="Quick Tutorial"
          overlayClassName="bg-black/70 items-center"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Quick Tutorial</h2>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  className="rounded border-slate-600 bg-slate-900"
                  checked={quickTutorialDontShow}
                  onChange={(e) => setQuickTutorialDontShow(e.target.checked)}
                />
                Do not show again
              </label>
            </div>
            <div className="rounded-xl border border-slate-700 bg-black/40 overflow-hidden">
              <video
                ref={quickTutorialVideoRef}
                className="w-full h-[48vh] object-cover"
                preload="metadata"
              >
                <source src={QUICK_TUTORIAL_SRC} type="video/quicktime" />
              </video>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const vid = quickTutorialVideoRef.current;
                  if (!vid) return;
                  vid.play();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
              >
                Play
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuickTutorial(false);
                  if (quickTutorialDontShow) {
                    try {
                      localStorage.setItem(QUICK_TUTORIAL_STORAGE_KEY, '1');
                    } catch (e) {
                      console.warn('Failed to save quick tutorial preference:', e);
                    }
                  }
                }}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Tutorial Modal - shown for new players */}
      {gameStarted && showTutorial && !showQuickTutorial && !tutorialDismissed && !gameState.pendingScenario && !gameState.isBankrupt && tutorialStep < tutorialTips.length && (
        <Modal
          isOpen={gameStarted && showTutorial && !tutorialDismissed}
          onClose={() => { setTutorialDismissed(true); setShowTutorial(false); markOnboardingSeen(); }}
          ariaLabel="Tutorial"
          overlayClassName="bg-black/60 items-end md:items-center"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="bg-gradient-to-br from-blue-900/90 to-slate-900/90 border border-blue-500/50 rounded-2xl p-6 max-w-md w-full backdrop-blur-sm"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">{tutorialTips[tutorialStep].title.split(' ')[0]}</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">{tutorialTips[tutorialStep].title.split(' ').slice(1).join(' ')}</h3>
              <p className="text-slate-300 text-sm mb-4">{tutorialTips[tutorialStep].message}</p>
              {tutorialTips[tutorialStep].id === 'auto-invest' && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {AUTO_INVEST_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        applyAutoInvestPreset(preset.id);
                        setActiveTab(TABS.INVEST);
                        handleV2Navigate('/money', 'invest');
                      }}
                      className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-100 hover:border-blue-400 hover:bg-blue-500/20"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1">
              {tutorialTips.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === tutorialStep ? 'bg-blue-400' : 'bg-slate-600'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setTutorialDismissed(true); setShowTutorial(false); markOnboardingSeen(); }}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-all"
              >
                Skip Tutorial
              </button>
              <button 
                onClick={() => {
                  if (tutorialStep < tutorialTips.length - 1) {
                    setTutorialStep(tutorialStep + 1);
                  } else {
                    setTutorialDismissed(true);
                    setShowTutorial(false);
                    markOnboardingSeen();
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all"
              >
                {tutorialStep < tutorialTips.length - 1 ? 'Next →' : 'Got it! 🎮'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Emergency Asset Sale Warning */}
      {gameState.cash <= 0 && !gameState.isBankrupt && gameState.assets.length > 0 && (
        <Modal
          isOpen={gameState.cash <= 0 && !gameState.isBankrupt && gameState.assets.length > 0}
          onClose={() => undefined}
          ariaLabel="Cash emergency"
          overlayClassName="bg-black/80"
          closeOnOverlayClick={false}
          closeOnEsc={false}
          showCloseButton={false}
          contentClassName="bg-gradient-to-br from-amber-900/50 to-red-900/50 border border-amber-500/50 rounded-2xl p-6 max-w-lg w-full"
        >
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">⚠️</div>
            <h2 className="text-2xl font-bold text-amber-400">Cash Emergency!</h2>
            <p className="text-white">You're out of cash but have assets. Sell at 50% value to survive.</p>
            <p className="text-slate-400 text-sm mt-2">Credit Rating: <span className={`font-bold ${(gameState.creditRating || 650) > 600 ? 'text-green-400' : 'text-red-400'}`}>{gameState.creditRating || 650}</span></p>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {gameState.assets.map(asset => {
              const emergencyValue = Math.round(asset.costBasis * 0.5 * asset.quantity);
              const mortgage = asset.mortgageId
                ? (gameState.mortgages.find(m => m.id === asset.mortgageId) || gameState.mortgages.find(m => m.assetId === asset.id))
                : gameState.mortgages.find(m => m.assetId === asset.id);
              const netValue = mortgage ? Math.max(0, emergencyValue - mortgage.balance) : emergencyValue;
              
              return (
                <div key={asset.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                  <div>
                    <p className="text-white font-medium">{asset.name}</p>
                    <p className="text-slate-400 text-sm">Emergency Sale: {formatMoney(emergencyValue)}</p>
                    {mortgage && <p className="text-red-400 text-xs">Net after mortgage: {formatMoney(netValue)}</p>}
                  </div>
                  <button
                    onClick={() => {
                      if (netValue <= 0) {
                        showNotif('Cannot Sell', 'Asset is underwater', 'error');
                        return;
                      }
                      playWarning();
                      setGameState(prev => ({
                        ...prev,
                        cash: prev.cash + netValue,
                        assets: prev.assets.filter(a => a.id !== asset.id),
                        liabilities: prev.liabilities.filter(l => l.assetId !== asset.id),
                        mortgages: prev.mortgages.filter(m => m.assetId !== asset.id),
                        events: [{
                          id: Date.now().toString(),
                          month: prev.month,
                          title: `🔥 Emergency Sale: ${asset.name}`,
                          description: `Sold at 50% value for ${formatMoneyFull(netValue)} to avoid bankruptcy`,
                          type: 'WARNING'
                        }, ...prev.events]
                      }));
                    }}
                    disabled={netValue <= 0}
                    className={`px-4 py-2 rounded-lg font-medium ${netValue > 0 ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                  >
                    Sell for {formatMoney(netValue)}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-red-400 text-xs text-center mt-4">
            ⚠️ {3 - (gameState.missedPayments || 0)} missed payments until bankruptcy
          </p>
        </Modal>
      )}

      {/* Save Manager */}
      {showSaveManager && (
        <Modal
          isOpen={showSaveManager}
          onClose={() => setShowSaveManager(false)}
          ariaLabel="Save and load"
          overlayClassName="bg-black/70"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <div>
              <h2 className="text-white font-bold text-lg">💾 Save & Load</h2>
              <p className="text-slate-400 text-xs">Autosaves at the end of every month • Use slots for manual saves</p>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {SAVE_SLOTS.map(slotId => {
              const summary = saveSummaries.find(s => s.slotId === slotId);
              const isEmpty = !summary;
              const title = slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`;

              return (
                <div key={slotId} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold">{title}</p>
                        {summary?.label && slotId !== 'autosave' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                            {summary.label}
                          </span>
                        )}
                      </div>

                      {isEmpty ? (
                        <p className="text-slate-400 text-sm mt-1">Empty</p>
                      ) : (
                        <div className="text-slate-300 text-sm mt-1 space-y-1">
                          <p className="text-slate-400 text-xs">Last saved: {formatDateTime(summary.updatedAt)}</p>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                            <div className="bg-slate-900/40 rounded-lg p-2">
                              <p className="text-slate-500">Time</p>
                              <p className="text-white font-medium">Y{Math.ceil((summary.month || 1) / 12)} • M{(((summary.month || 1) - 1) % 12) + 1}</p>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-2">
                              <p className="text-slate-500">Cash</p>
                              <p className="text-emerald-300 font-medium">{formatMoney(summary.cash || 0)}</p>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-2">
                              <p className="text-slate-500">Net Worth</p>
                              <p className="text-white font-medium">{formatMoney(summary.netWorth || 0)}</p>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-2">
                              <p className="text-slate-500">Passive/mo</p>
                              <p className="text-amber-300 font-medium">{formatMoney(summary.passiveIncome || 0)}</p>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-2">
                              <p className="text-slate-500">Difficulty</p>
                              <p className="text-white font-medium">{summary.difficulty || t('save.unknown')}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleSaveToSlot(slotId, slotId === 'autosave' ? undefined : saveLabelDrafts[slotId])}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2"
                      >
                        <SaveIcon size={16} /> Save
                      </button>

                      <button
                        disabled={isEmpty}
                        onClick={() => handleLoadFromSlot(slotId)}
                        className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium flex items-center gap-2"
                      >
                        <FolderOpenIcon size={16} /> Load
                      </button>

                      <div className="flex gap-2">
                        <button
                          disabled={isEmpty}
                          onClick={() => handleDeleteSlot(slotId)}
                          className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:bg-slate-900 disabled:text-slate-600 text-white text-xs flex items-center gap-1"
                          title="Delete save"
                          aria-label={`Delete ${title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {slotId !== 'autosave' && (
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="text"
                        value={saveLabelDrafts[slotId] || ''}
                        onChange={(e) => setSaveLabelDrafts(prev => ({ ...prev, [slotId]: e.target.value }))}
                        placeholder="Name this save"
                        className="flex-1 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                      />
                      <button
                        disabled={isEmpty}
                        onClick={() => handleRenameSlot(slotId, saveLabelDrafts[slotId] || '')}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 text-xs"
                      >
                        Update label
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-3">
              <div>
                <p className="text-white font-semibold text-sm">Export / Import</p>
                <p className="text-slate-400 text-xs">Keep a backup or move saves between devices.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3">
                  <p className="text-slate-300 text-xs mb-2">Export a save</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={exportSlotId}
                      onChange={(e) => setExportSlotId(e.target.value as SaveSlotId)}
                      className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs text-slate-200"
                    >
                      {SAVE_SLOTS.map(slotId => (
                        <option key={`export-${slotId}`} value={slotId}>
                          {slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => void handleExportSlot(exportSlotId, 'copy')}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                    >
                      Copy JSON
                    </button>
                    <button
                      onClick={() => void handleExportSlot(exportSlotId, 'download')}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                    >
                      Download
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-300 text-xs">Import a save</p>
                    <select
                      value={importSlotId}
                      onChange={(e) => setImportSlotId(e.target.value as SaveSlotId)}
                      className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200"
                    >
                      {SAVE_SLOTS.map(slotId => (
                        <option key={`import-${slotId}`} value={slotId}>
                          {slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={importPayload}
                    onChange={(e) => setImportPayload(e.target.value)}
                    placeholder="Paste save JSON here..."
                    className="w-full min-h-[96px] rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500"
                  />
                  {importError && <p className="text-red-300 text-xs">{importError}</p>}
                  <button
                    onClick={handleImportSave}
                    className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Import & Load
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  // Hard refresh in case another tab modified saves
                  refreshSaveSummaries();
                  showNotif('Refreshed', 'Save slots refreshed', 'info');
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                Refresh
              </button>

              <button
                onClick={() => setShowSaveManager(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      <QuestLog
        isOpen={showQuestLog}
        onClose={() => setShowQuestLog(false)}
        gameState={gameState}
        onClaim={handleClaimQuest}
        onClaimAll={handleClaimAllQuests}
        isProcessing={isProcessing}
      />
      {showGlossary && (
        <Modal
          isOpen={showGlossary}
          onClose={() => setShowGlossary(false)}
          ariaLabel="Glossary"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full"
        >
          <h2 className="text-xl font-bold text-white mb-2">Glossary</h2>
          <p className="text-slate-400 text-sm mb-4">
            Quick definitions to help you learn without slowing down gameplay.
          </p>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {GLOSSARY_ENTRIES.map((entry) => (
              <div key={entry.term} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                <p className="text-sm font-semibold text-white">{entry.term}</p>
                <p className="text-sm text-slate-300 mt-1">{entry.definition}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {dashboardModal && (
        <Modal
          isOpen={!!dashboardModal}
          onClose={() => setDashboardModal(null)}
          ariaLabel="Dashboard details"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full"
        >
          {dashboardModal === 'netWorth' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Net Worth Trend</h2>
              <p className="text-slate-400 text-sm mb-4">
                Latest: <span className="text-white font-semibold">{formatMoney(netWorth)}</span>
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthTrendData}>
                    <defs>
                      <linearGradient id="netWorthDetailGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                      formatter={(val: number) => [formatMoneyFull(val), 'Net Worth']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#34d399" fill="url(#netWorthDetailGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {dashboardModal === 'cashFlow' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Cash Flow</h2>
              <p className="text-slate-400 text-sm mb-4">
                Latest net: <span className="text-white font-semibold">
                  {latestCashFlowNet >= 0 ? '+' : '-'}{formatMoneyFull(Math.abs(latestCashFlowNet))}
                </span>
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowTrendData}>
                    <XAxis dataKey="label" hide />
                    <YAxis hide />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                      formatter={(val: number, name: string) => [
                        formatMoneyFull(val),
                        name === 'income' ? 'Income' : 'Expenses'
                      ]}
                    />
                    <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {dashboardModal === 'credit' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Credit Score History</h2>
              <p className="text-slate-400 text-sm mb-4">
                Current score: <span className={`font-semibold ${getCreditTierColor(creditTier)}`}>{creditScore}</span>
                <span className="text-slate-500"> • {creditTier}</span>
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={creditTrendData}>
                    <defs>
                      <linearGradient id="creditDetailGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={[300, 850]} />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                      formatter={(val: number) => [Math.round(val).toString(), 'Score']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="url(#creditDetailGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {dashboardModal === 'ai' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">AI Disruption Level</h2>
              <p className="text-slate-400 text-sm mb-4">
                Current: <span className="text-white font-semibold">{Math.round(aiDisruptionLevel)}%</span>
                <span className={`ml-2 font-semibold ${getAIRiskColor(aiImpact?.automationRisk || 'LOW')}`}>
                  {aiImpact?.automationRisk || 'LOW'} risk
                </span>
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aiTrendData}>
                    <defs>
                      <linearGradient id="aiDetailGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={[0, 100]} />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                      formatter={(val: number) => [`${Math.round(val)}%`, 'Disruption']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#aiDetailGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Modal>
      )}
      {uiV2Enabled ? (
        <>
          {isMobileViewport && (
            <MobileShell
            playerName={playerConfig?.name || gameState.character?.name || 'Player'}
            year={Math.ceil(gameState.month / 12)}
            month={((gameState.month - 1) % 12) + 1}
            avatarColor={gameState.character?.avatarColor}
            avatarImage={gameState.character?.avatarImage}
            avatarEmoji={gameState.character?.avatarEmoji}
            perkLabel={gameState.character?.perk?.name}
            perkDescription={gameState.character?.perk?.description}
            aiRiskLabel={aiRiskLabel}
            aiRiskTone={aiRiskBadgeTone}
            isProcessing={isProcessing}
            nextMonthDisabled={isProcessing || !!gameState.pendingScenario}
            onNextMonth={handleNextTurn}
            onOpenOverflow={() => setMobileOverflowOpen(true)}
            activeTab={v2Path === '/play' ? mobileTab : 'more'}
            onSelectTab={(tab) => {
              setMobileTab(tab);
              if (tab !== 'more') {
                setV2Path('/play');
              }
            }}
          >
            {v2Path === '/play' && mobileTab === 'dashboard' && (
              <DashboardScreen
                cashValue={gameState.cash}
                netWorthValue={netWorth}
                passiveValue={cashFlow.passive}
                expenseValue={cashFlow.expenses}
                formatMoney={formatMoney}
                freedomPercent={freedomPercent}
                passiveTrend={passiveTrendMini}
                expenseTrend={expenseTrendMini}
                ratioValue={ratioValue}
                ratioLabel={`${ratioValue}%`}
                passiveDelta={null}
                expenseDelta={expenseDelta}
                cashSparkline={[]}
                netWorthSparkline={netWorthTrendData.map((entry) => ({ label: entry.label, value: entry.value }))}
                passiveSparkline={passiveTrendMini}
                monthlyActions={monthlyActionsSummary}
                onUseMonthlyAction={handleUseMonthlyAction}
                onOpenActions={() => setActionsDrawerOpen(true)}
                onNavigate={handleV2Navigate}
                events={gameState.events}
                gameState={gameState}
                isProcessing={isProcessing}
                onClaimQuest={handleClaimQuest}
                onOpenGoals={() => setShowQuestLog(true)}
              />
            )}
            {v2Path === '/play' && mobileTab === 'actions' && (
              <ActionsScreen
                summary={monthlyActionsSummary}
                onSelectAction={handleUseMonthlyAction}
                events={gameState.events}
                gameState={gameState}
                isProcessing={isProcessing}
                onClaimQuest={handleClaimQuest}
                onOpenGoals={() => setShowQuestLog(true)}
              />
            )}
            {v2Path === '/play' && mobileTab === 'profile' && (
              <ProfileScreen
                playerName={playerConfig?.name || gameState.character?.name || 'Player'}
                avatarColor={gameState.character?.avatarColor}
                avatarImage={gameState.character?.avatarImage}
                avatarEmoji={gameState.character?.avatarEmoji}
                gameState={gameState}
                creditScore={creditScore}
                creditTier={creditTier}
                getCreditTierColor={getCreditTierColor}
                aiImpact={aiImpact}
                careerPath={careerPath}
                getAIRiskColor={getAIRiskColor}
                formatMoney={formatMoney}
                onNavigate={(path) => setV2Path(path as typeof v2Path)}
              />
            )}
            {v2Path === '/play' && mobileTab === 'more' && (
              <MoreScreen
                onNavigate={(path) => setV2Path(path as typeof v2Path)}
                onOpenSaveManager={openSaveManager}
                onOpenQuests={() => setShowQuestLog(true)}
                onOpenGlossary={() => setShowGlossary(true)}
                onOpenAccessibility={() => setShowAccessibility(true)}
                onToggleSound={toggleSound}
                soundEnabled={soundEnabled}
                showNextMonthPreview={showNextMonthPreview}
                onToggleMonthPreview={setShowNextMonthPreview}
                autoplayEnabled={autoplayEnabled}
                autoplayLabel={autoplayEnabled ? 'ON' : 'OFF'}
                autoplaySpeed={autoPlaySpeed}
                autoplaySpeedOptions={AUTOPLAY_SPEED_OPTIONS}
                autoplaySpeedLabels={AUTOPLAY_SPEED_LABELS}
                onToggleAutoplay={() => setAutoPlaySpeed(autoPlaySpeed ? null : AUTOPLAY_SPEED_OPTIONS[0])}
                onSetAutoplaySpeed={setAutoPlaySpeed}
              />
            )}
            {v2Path === '/money' && (
              <MoneyPageLayout
                gameState={gameState}
                netWorth={netWorth}
                cashFlow={cashFlow}
                formatMoney={formatMoney}
                formatMoneyFull={formatMoneyFull}
                formatPercent={formatPercent}
                investTabProps={investTabProps}
                portfolioTabProps={portfolioTabProps}
                bankTabProps={bankTabProps}
                showQuiz={!!activeQuiz}
                forcedTab={forcedMoneyTab || undefined}
              />
            )}
            {v2Path === '/career' && (
              <CareerPageLayout
                gameState={gameState}
                careerPath={careerPath}
                cashFlow={cashFlow}
                formatMoney={formatMoney}
                aiImpact={aiImpact}
                isProcessing={isProcessing}
                onPromote={handleManualPromotion}
                onNavigate={handleV2Navigate}
              />
            )}
            {v2Path === '/learn' && (
              <LearnPageLayout
                gameState={gameState}
                careerPath={careerPath}
                formatMoney={formatMoney}
                handleEnrollEducation={handleEnrollEducation}
                coachLifestyleGridRef={coachLifestyleGridRef}
                coachHighlight={coachHighlight}
                setGameState={setGameState}
              />
            )}
            {v2Path === '/life' && (
              <LifePageLayout
                gameState={gameState}
                cashFlow={cashFlow}
                formatMoney={formatMoney}
                handleChangeLifestyle={handleChangeLifestyle}
                coachLifestyleGridRef={coachLifestyleGridRef}
                coachHighlight={coachHighlight}
                coachHint={coachHint}
                InfoTip={InfoTip}
                getHustleUpgradeLabel={getHustleUpgradeLabel}
                getNextHustleMilestone={getNextHustleMilestone}
                handleStartSideHustle={handleStartSideHustle}
                handleStopSideHustle={handleStopSideHustle}
                setShowSideHustleUpgradeModal={setShowSideHustleUpgradeModal}
                coachSideHustlesRef={coachSideHustlesRef}
                forcedTab={forcedLifeTab || undefined}
              />
            )}
            </MobileShell>
          )}

          {!isMobileViewport && (
            <DesktopShell
              title="Financial Freedom"
              subtitle="Tycoon"
              navItems={v2NavItems}
              activePath={v2Path}
              onNavigate={(path) => setV2Path(path as typeof v2Path)}
              headerLeading={
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${gameState.character?.avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-xl overflow-hidden border border-white/10`}>
                    {gameState.character?.avatarImage ? (
                      <img
                        src={gameState.character.avatarImage}
                        alt={playerConfig?.name || gameState.character?.name || 'Player'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      gameState.character?.avatarEmoji || '👤'
                    )}
                  </div>
                  <span className="text-[11px] text-slate-300">
                    {playerConfig?.name || gameState.character?.name || 'Player'}
                  </span>
                </div>
              }
              headerActions={
                <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNextTurn}
                  disabled={isProcessing || !!gameState.pendingScenario}
                  className="flex items-center gap-2 rounded-full bg-emerald-400/90 px-5 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.35)] disabled:opacity-60"
                  title="Next Month (N)"
                >
                  {isProcessing ? <Play size={16} className="animate-spin" /> : <Play size={16} />}
                  Next Month
                </button>
                <button
                  type="button"
                  onClick={() => setAutoPlaySpeed(autoPlaySpeed ? null : AUTOPLAY_SPEED_OPTIONS[0])}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
                    autoplayEnabled
                      ? 'border-amber-400/70 bg-amber-400/10 text-amber-200'
                      : 'border-slate-700/70 text-slate-300'
                  }`}
                  title={`${autoplayTooltip} • Shortcut: T`}
                >
                  {autoplayEnabled ? <FastForward size={14} /> : <Pause size={14} />}
                  Autoplay {autoplayEnabled ? 'ON' : 'OFF'}
                </button>
                <div className="flex items-center gap-1">
                  {AUTOPLAY_SPEED_OPTIONS.map((speed) => {
                    const label = AUTOPLAY_SPEED_LABELS[speed] || '1x';
                    const isActive = autoPlaySpeed === speed;
                    return (
                      <button
                        key={speed}
                        onClick={() => setAutoPlaySpeed(speed)}
                        disabled={!autoplayEnabled}
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${
                          !autoplayEnabled
                            ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                            : isActive
                              ? 'border-amber-400/70 bg-amber-400/10 text-amber-200'
                              : 'border-slate-700/70 text-slate-300 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            }
          >
            {v2Path === '/play' && (
              <DashboardScreen
                cashValue={gameState.cash}
                netWorthValue={netWorth}
                passiveValue={cashFlow.passive}
                expenseValue={cashFlow.expenses}
                formatMoney={formatMoney}
                freedomPercent={freedomPercent}
                passiveTrend={passiveTrendMini}
                expenseTrend={expenseTrendMini}
                ratioValue={ratioValue}
                ratioLabel={`${ratioValue}%`}
                passiveDelta={null}
                expenseDelta={expenseDelta}
                cashSparkline={[]}
                netWorthSparkline={netWorthTrendData.map((entry) => ({ label: entry.label, value: entry.value }))}
                passiveSparkline={passiveTrendMini}
                monthlyActions={monthlyActionsSummary}
                onUseMonthlyAction={handleUseMonthlyAction}
                onOpenActions={() => setActionsDrawerOpen(true)}
                onNavigate={handleV2Navigate}
                events={gameState.events}
                gameState={gameState}
                isProcessing={isProcessing}
                onClaimQuest={handleClaimQuest}
                onOpenGoals={() => setShowQuestLog(true)}
              />
            )}
            {v2Path === '/money' && (
              <MoneyPageLayout
                gameState={gameState}
                netWorth={netWorth}
                cashFlow={cashFlow}
                formatMoney={formatMoney}
                formatMoneyFull={formatMoneyFull}
                formatPercent={formatPercent}
                investTabProps={investTabProps}
                portfolioTabProps={portfolioTabProps}
                bankTabProps={bankTabProps}
                showQuiz={!!activeQuiz}
                forcedTab={forcedMoneyTab || undefined}
              />
            )}
            {v2Path === '/career' && (
              <CareerPageLayout
                gameState={gameState}
                careerPath={careerPath}
                cashFlow={cashFlow}
                formatMoney={formatMoney}
                aiImpact={aiImpact}
                isProcessing={isProcessing}
                onPromote={handleManualPromotion}
                onNavigate={handleV2Navigate}
              />
            )}
            {v2Path === '/learn' && (
              <LearnPageLayout
                gameState={gameState}
                careerPath={careerPath}
                formatMoney={formatMoney}
                handleEnrollEducation={handleEnrollEducation}
                coachLifestyleGridRef={coachLifestyleGridRef}
                coachHighlight={coachHighlight}
                setGameState={setGameState}
              />
            )}
            {v2Path === '/life' && (
              <LifePageLayout
                gameState={gameState}
                cashFlow={cashFlow}
                formatMoney={formatMoney}
                handleChangeLifestyle={handleChangeLifestyle}
                coachLifestyleGridRef={coachLifestyleGridRef}
                coachHighlight={coachHighlight}
                coachHint={coachHint}
                InfoTip={InfoTip}
                getHustleUpgradeLabel={getHustleUpgradeLabel}
                getNextHustleMilestone={getNextHustleMilestone}
                handleStartSideHustle={handleStartSideHustle}
                handleStopSideHustle={handleStopSideHustle}
                setShowSideHustleUpgradeModal={setShowSideHustleUpgradeModal}
                coachSideHustlesRef={coachSideHustlesRef}
                forcedTab={forcedLifeTab || undefined}
              />
            )}
            </DesktopShell>
          )}

          <ActionsDrawer
            isOpen={actionsDrawerOpen}
            onClose={() => setActionsDrawerOpen(false)}
            summary={monthlyActionsSummary}
            onSelectAction={handleUseMonthlyAction}
          />

          <Modal
            isOpen={mobileOverflowOpen}
            onClose={() => setMobileOverflowOpen(false)}
            ariaLabel="Quick actions"
            contentClassName="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-sm w-full"
          >
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  openSaveManager();
                  setMobileOverflowOpen(false);
                }}
                className="glass-tile flex items-center gap-3 px-4 py-3 w-full"
              >
                <SaveIcon size={18} className="text-cyan-300" /> Save / Load
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuestLog(true);
                  setMobileOverflowOpen(false);
                }}
                className="glass-tile flex items-center gap-3 px-4 py-3 w-full"
              >
                <Trophy size={18} className="text-amber-300" /> Quests
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGlossary(true);
                  setMobileOverflowOpen(false);
                }}
                className="glass-tile flex items-center gap-3 px-4 py-3 w-full"
              >
                <BookOpen size={18} className="text-emerald-300" /> Glossary
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAccessibility(true);
                  setMobileOverflowOpen(false);
                }}
                className="glass-tile flex items-center gap-3 px-4 py-3 w-full"
              >
                <Settings size={18} className="text-purple-300" /> Accessibility
              </button>
            </div>
          </Modal>
        </>
      ) : (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gameState.character?.avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-2xl overflow-hidden`}>
                      {gameState.character?.avatarImage ? (
                        <img
                          src={gameState.character.avatarImage}
                          alt={gameState.character.name || 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        gameState.character?.avatarEmoji || '👤'
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{playerConfig?.name || gameState.character?.name || 'Player'}</p>
                      <p className="text-slate-400 text-xs">Year {Math.ceil(gameState.month / 12)} • Month {((gameState.month - 1) % 12) + 1}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {gameState.character?.perk && (
                          <div
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200"
                            title={gameState.character.perk.description}
                          >
                            <Sparkles size={12} />
                            <span>{gameState.character.perk.name}</span>
                          </div>
                        )}
                        {isMultiplayer && (
                          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg px-2 py-0.5">
                            <p className="text-amber-400 text-[11px] font-medium">Turn {multiplayerTurnsTaken + 1}/{MULTIPLAYER_TURNS_PER_ROUND}</p>
                          </div>
                        )}
                        {gameState.aiDisruption && gameState.aiDisruption.disruptionLevel > 20 && (
                          <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] ${
                            aiImpact?.automationRisk === 'CRITICAL' ? 'bg-red-900/30 text-red-400' : 
                            aiImpact?.automationRisk === 'HIGH' ? 'bg-orange-900/30 text-orange-400' : 
                            'bg-amber-900/30 text-amber-400'}`}>
                            <Bot size={12} />
                            <span>AI Risk: {aiImpact?.automationRisk || 'LOW'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-3 flex-1 lg:px-6">
                    <Card className="p-3 border-emerald-500/20 bg-emerald-950/30">
                      <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">Cash</p>
                      <p className="text-xl font-semibold text-emerald-100">{formatMoney(gameState.cash)}</p>
                    </Card>
                    <Card className="p-3 border-slate-700 bg-slate-900/60">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Net Worth</p>
                      <p className="text-xl font-semibold text-white">{formatMoney(netWorth)}</p>
                    </Card>
                    <Card className="p-3 border-amber-500/20 bg-amber-950/30">
                      <p className="text-[11px] uppercase tracking-wide text-amber-300/80">Passive / mo</p>
                      <p className="text-xl font-semibold text-amber-100">{formatMoney(cashFlow.passive)}</p>
                    </Card>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleNextTurn}
                          disabled={isProcessing || !!gameState.pendingScenario}
                          title="Next Month (N)"
                        >
                          {isProcessing ? <Clock size={18} className="animate-spin" /> : <Play size={18} />}
                          <span>Next Month</span>
                        </Button>
                      </motion.div>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setAutoPlaySpeed(autoPlaySpeed ? null : AUTOPLAY_SPEED_OPTIONS[0])}
                        title={`${autoplayTooltip} • Shortcut: T`}
                        aria-label="Autoplay toggle"
                        aria-pressed={autoplayEnabled}
                        className={autoplayEnabled ? 'border-amber-500/40 text-amber-200 bg-amber-600/20' : ''}
                      >
                        {autoplayEnabled ? <FastForward size={16} /> : <Pause size={16} />}
                        <span className="text-sm font-semibold">Autoplay</span>
                        <span className={`text-xs font-semibold ${autoplayEnabled ? 'text-amber-200' : 'text-slate-400'}`}>
                          {autoplayEnabled ? 'ON' : 'OFF'}
                        </span>
                      </Button>
                    </div>
                    {!isMultiplayer && (
                      <label className="flex items-center gap-2 text-[11px] text-slate-400 select-none">
                        <input
                          type="checkbox"
                          className="rounded border-slate-600 bg-slate-900"
                          checked={showNextMonthPreview}
                          onChange={(e) => setShowNextMonthPreview(e.target.checked)}
                        />
                        Show month preview
                      </label>
                    )}
                    <div className="hidden sm:flex items-center gap-1">
                      {AUTOPLAY_SPEED_OPTIONS.map((speed) => {
                        const label = AUTOPLAY_SPEED_LABELS[speed] || '1x';
                        const isActive = autoPlaySpeed === speed;
                        return (
                          <button
                            key={speed}
                            onClick={() => setAutoPlaySpeed(speed)}
                            disabled={!autoplayEnabled}
                            aria-pressed={isActive}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              !autoplayEnabled
                                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                                : isActive
                                  ? 'bg-amber-600/30 border-amber-500/50 text-amber-100'
                                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="sm:hidden"
                        onClick={() => setHudPanelOpen((prev) => !prev)}
                        aria-expanded={hudPanelOpen}
                        aria-label="Toggle finance dashboard"
                      >
                        {hudPanelOpen ? 'Hide KPIs' : 'Show KPIs'}
                      </Button>
                      <div className="relative">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setHudMenuOpen((prev) => !prev)}
                          aria-label="Open dashboard menu"
                          aria-expanded={hudMenuOpen}
                        >
                          <MoreHorizontal size={18} />
                        </Button>
                        {hudMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setHudMenuOpen(false)} />
                            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-xl p-2 z-50">
                              <div className="px-2 py-1 text-[11px] text-slate-500">
                                {autosaveStatus}
                              </div>
                              {onBackToMenu && !isMultiplayer && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  fullWidth
                                  onClick={() => {
                                    playClick();
                                    recordAutosave(gameState);
                                    onBackToMenu();
                                    setHudMenuOpen(false);
                                  }}
                                  className="justify-start"
                                >
                                  <Home size={16} /> Back to Menu
                                </Button>
                              )}
                              {!isMultiplayer && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  fullWidth
                                  onClick={() => {
                                    openSaveManager();
                                    setHudMenuOpen(false);
                                  }}
                                  className="justify-start"
                                >
                                  <SaveIcon size={16} /> Save / Load
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                fullWidth
                                onClick={() => {
                                  setShowQuestLog(true);
                                  setHudMenuOpen(false);
                                }}
                                className="justify-start"
                              >
                                <Trophy size={16} /> Quests
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                fullWidth
                                onClick={() => {
                                  setShowGlossary(true);
                                  setHudMenuOpen(false);
                                }}
                                className="justify-start"
                              >
                                <BookOpen size={16} /> Glossary
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                fullWidth
                                onClick={() => {
                                  toggleSound();
                                  setHudMenuOpen(false);
                                }}
                                className="justify-start"
                              >
                                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                {soundEnabled ? 'Mute sound' : 'Unmute sound'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                fullWidth
                                onClick={() => {
                                  setShowAccessibility(true);
                                  setHudMenuOpen(false);
                                }}
                                className="justify-start"
                              >
                                <Settings size={16} /> Accessibility
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="grid grid-cols-2 gap-3">
                    <DashboardWidget
                      title="Net Worth Trend"
                      data={netWorthTrendData}
                      unit="$"
                      onClick={() => setDashboardModal('netWorth')}
                      valueLabel={formatMoney(netWorth)}
                      caption="Last 12 months"
                      ariaLabel="View net worth trend details"
                      variant="line"
                    />
                    <DashboardWidget
                      title="Cash Flow"
                      data={cashFlowTrendData}
                      unit="$"
                      onClick={() => setDashboardModal('cashFlow')}
                      valueLabel={`${latestCashFlowNet >= 0 ? '+' : '-'}${formatMoneyFull(Math.abs(latestCashFlowNet))}`}
                      caption="Income vs expenses"
                      ariaLabel="View cash flow details"
                      variant="bar"
                    />
                    <DashboardWidget
                      title="Credit Score History"
                      data={creditTrendData}
                      unit="pts"
                      onClick={() => setDashboardModal('credit')}
                      valueLabel={`${creditScore} ${creditTier}`}
                      caption="Last 12 months"
                      ariaLabel="View credit score details"
                      variant="line"
                    />
                    <DashboardWidget
                      title="AI Disruption Level"
                      data={aiTrendData}
                      unit="%"
                      onClick={() => setDashboardModal('ai')}
                      valueLabel={`${Math.round(aiDisruptionLevel)}%`}
                      caption={`Risk: ${aiImpact?.automationRisk || 'LOW'}`}
                      ariaLabel="View AI disruption details"
                      variant="line"
                    />
                  </div>
                </div>

                {hudPanelOpen && (
                  <div className="md:hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <Card className="p-3 border-emerald-500/20 bg-emerald-950/30">
                        <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">Cash</p>
                        <p className="text-xl font-semibold text-emerald-100">{formatMoney(gameState.cash)}</p>
                      </Card>
                      <Card className="p-3 border-slate-700 bg-slate-900/60">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Net Worth</p>
                        <p className="text-xl font-semibold text-white">{formatMoney(netWorth)}</p>
                      </Card>
                      <Card className="p-3 border-amber-500/20 bg-amber-950/30">
                        <p className="text-[11px] uppercase tracking-wide text-amber-300/80">Passive / mo</p>
                        <p className="text-xl font-semibold text-amber-100">{formatMoney(cashFlow.passive)}</p>
                      </Card>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <DashboardWidget
                        title="Net Worth Trend"
                        data={netWorthTrendData}
                        unit="$"
                        onClick={() => setDashboardModal('netWorth')}
                        valueLabel={formatMoney(netWorth)}
                        caption="Last 12 months"
                        ariaLabel="View net worth trend details"
                        variant="line"
                      />
                      <DashboardWidget
                        title="Cash Flow"
                        data={cashFlowTrendData}
                        unit="$"
                        onClick={() => setDashboardModal('cashFlow')}
                        valueLabel={`${latestCashFlowNet >= 0 ? '+' : '-'}${formatMoneyFull(Math.abs(latestCashFlowNet))}`}
                        caption="Income vs expenses"
                        ariaLabel="View cash flow details"
                        variant="bar"
                      />
                      <DashboardWidget
                        title="Credit Score History"
                        data={creditTrendData}
                        unit="pts"
                        onClick={() => setDashboardModal('credit')}
                        valueLabel={`${creditScore} ${creditTier}`}
                        caption="Last 12 months"
                        ariaLabel="View credit score details"
                        variant="line"
                      />
                      <DashboardWidget
                        title="AI Disruption Level"
                        data={aiTrendData}
                        unit="%"
                        onClick={() => setDashboardModal('ai')}
                        valueLabel={`${Math.round(aiDisruptionLevel)}%`}
                        caption={`Risk: ${aiImpact?.automationRisk || 'LOW'}`}
                        ariaLabel="View AI disruption details"
                        variant="line"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Tab Navigation */}
        <div className="sticky top-0 z-40 -mx-4 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 bg-slate-900/95 backdrop-blur border-b border-slate-800/70 md:static md:mx-0 md:px-0 md:pt-0 md:pb-0 md:bg-transparent md:border-b-0">
          <div className="flex flex-wrap gap-2 mb-3 md:mb-4 pb-2">

          {([
            { id: TABS.OVERVIEW, label: t('tabs.overview'), icon: LineChart },
            { id: TABS.INVEST, label: t('tabs.invest'), icon: TrendingUp },
            { id: TABS.ASSETS, label: t('tabs.portfolio'), icon: Wallet },
            { id: TABS.BANK, label: t('tabs.bank'), icon: Banknote },
            { id: TABS.CAREER, label: t('tabs.career'), icon: Briefcase },
            { id: TABS.EDUCATION, label: t('tabs.education'), icon: GraduationCap },
            { id: TABS.SELF_LEARN, label: t('tabs.selfLearn'), icon: BookOpen },
            { id: TABS.SIDEHUSTLE, label: t('tabs.sideHustles'), icon: Coffee },
            { id: TABS.LIFESTYLE, label: t('tabs.lifestyle'), icon: Heart },
          ] as const).map(tab => {
            const shortcut = TAB_SHORTCUTS[tab.id];
            return (
            <div key={tab.id} className="flex items-center gap-1">
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => { playClick(); setActiveTab(tab.id); }}
                title={shortcut ? `${tab.label} (${shortcut})` : tab.label}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all touch-target ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'} ${tab.id === TABS.SELF_LEARN ? coachHighlight('self-learn-tab') : ''}`}>
                <tab.icon size={18} />{tab.label}
                {tab.id === TABS.SELF_LEARN && (
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40">
                    New
                  </span>
                )}
              </motion.button>
            </div>
          );
          })}
        
          </div>
        </div>

        {/* Coach Ribbon (Step 12) */}
        <AnimatePresence>
          {coachHint && coachHint.tabId === activeTab && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mb-4 bg-slate-800/60 border border-emerald-700/30 rounded-2xl p-4"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                  <Sparkles size={18} className="text-emerald-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{coachHint.title}</p>
                      <p className="text-sm text-slate-300 mt-0.5">{coachHint.message}</p>
                    </div>
                    <button
                      onClick={() => setCoachHint(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/40"
                      aria-label="Dismiss coach tip"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {coachHint.allowReopenPreview && (
                      <button
                        onClick={openTurnPreviewNow}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Re-open Preview
                      </button>
                    )}
                    <span className="text-xs text-slate-500 self-center">Tip disappears in a few seconds.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================ */}
        {/* TAB GUIDE VIDEOS */}
        {/* ============================================ */}
        {activeTabVideo && (
          <div className={`mb-3 ${hideTipsEverywhere ? 'flex justify-end' : ''}`}>
            <HelpDrawer
              title="Help & tips"
              summary={activeTabVideo.title}
              isGloballyHidden={hideTipsEverywhere}
              content={(
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-700 flex items-center justify-center">
                        {activeTabVideo.icon ?? <BookOpen size={18} className="text-emerald-300" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{activeTabVideo.title}</p>
                        {activeTabVideo.description && (
                          <p className="text-xs text-slate-400">{activeTabVideo.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openIntroVideoModal(activeTab, { autoplay: true })}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2"
                    >
                      <Play size={16} /> Watch video
                    </button>
                  </div>

                  {activeTabQuickTips.length > 0 && (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                      <p className="text-xs font-semibold text-slate-200 mb-2">Quick tips</p>
                      <ul className="text-sm text-slate-300 space-y-1">
                        {activeTabQuickTips.map((tip) => (
                          <li key={tip}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {minimizedTabVideos[activeTab] && (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {activeTabVideo.poster ? (
                          <img
                            src={activeTabVideo.poster}
                            alt={`${activeTabVideo.title} video thumbnail`}
                            className="w-24 h-14 rounded-lg object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-24 h-14 rounded-lg bg-slate-900/60 border border-slate-700 flex items-center justify-center">
                            <Play size={16} className="text-slate-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{activeTabVideo.title}</p>
                          <p className="text-xs text-slate-400 truncate">Finished — replay anytime.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openIntroVideoModal(activeTab, { autoplay: true })}
                          className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold flex items-center gap-2"
                        >
                          <Play size={16} /> Replay
                        </button>
                        <button
                          onClick={() => setMinimizedTabVideos((prev) => ({ ...prev, [activeTab]: false }))}
                          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200"
                          aria-label="Hide video"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setHideTipsEverywhere((prev) => !prev)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {hideTipsEverywhere ? 'Show tips everywhere' : 'Hide tips everywhere'}
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* ============================================ */}
        {/* OVERVIEW TAB */}
        {/* ============================================ */}
        {activeTab === TABS.OVERVIEW && (
          <TabErrorBoundary tabName={t('tabs.overview')}>
            <Suspense fallback={<TabLoading label={t('tabs.overview')} />}>
              <OverviewTab
                t={t}
                formatNumber={formatNumber}
                formatPercent={formatPercent}
                formatMoney={formatMoney}
                formatMoneyFull={formatMoneyFull}
                gameState={gameState}
                isProcessing={isProcessing}
                coachMonthlyActionsRef={coachMonthlyActionsRef}
                coachHighlight={coachHighlight}
                InfoTip={InfoTip}
                creditTier={creditTier}
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

        {/* ============================================ */}
        {/* INVEST TAB */}
        {/* ============================================ */}
        {activeTab === TABS.INVEST && (
          <TabErrorBoundary tabName={t('tabs.invest')}>
            <Suspense fallback={<TabLoading label={t('tabs.invest')} />}>
              <InvestTab
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
                toggleBatchBuyMode={toggleBatchBuyMode}
                clearBatchBuyCart={clearBatchBuyCart}
                batchBuyQuantities={batchBuyQuantities}
                setBatchBuyQuantities={setBatchBuyQuantities}
                batchBuyCart={batchBuyCart}
                openBatchBuyConfirm={openBatchBuyConfirm}
                autoInvest={autoInvest}
                onUpdateAutoInvest={updateAutoInvest}
                onOpenGlossary={() => setShowGlossary(true)}
                handleBuyAsset={handleBuyAsset}
                hasRequiredEducationForInvestment={hasRequiredEducationForInvestment}
                getAssetIcon={getAssetIcon}
                getItemTier={getItemTier}
                getRiskRating={getRiskRating}
                isProcessing={isProcessing}
                playClick={playClick}
                setShowMortgageModal={setShowMortgageModal}
                setSelectedMortgage={setSelectedMortgage}
                isBatchBuyEligible={isBatchBuyEligible}
                setBatchQty={setBatchQty}
                showQuiz={!!activeQuiz && activeTab === TABS.INVEST}
                quizTitle={activeQuiz?.title}
                quizIntro={activeQuiz?.intro}
                quizQuestions={activeQuiz?.questions || []}
                quizAnswers={quizAnswers}
                onSelectQuizAnswer={handleSelectQuizAnswer}
                onSubmitQuiz={handleSubmitQuiz}
                onSkipQuiz={() => {
                  if (activeQuizId) markQuizSeen(activeQuizId);
                }}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        {/* ============================================ */}
        {/* PORTFOLIO TAB */}
        {/* ============================================ */}
        {activeTab === TABS.ASSETS && (
          <TabErrorBoundary tabName={t('tabs.portfolio')}>
            <Suspense fallback={<TabLoading label={t('tabs.portfolio')} />}>
              <PortfolioTab
                gameState={gameState}
                cashFlow={cashFlow}
                formatMoney={formatMoney}
                formatPercent={formatPercent}
                getAssetIcon={getAssetIcon}
                getBusinessIncomeRange={getBusinessIncomeRange}
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

        {/* ============================================ */}
        {/* BANK TAB - LOANS */}
        {/* ============================================ */}
        {activeTab === TABS.BANK && (
          <TabErrorBoundary tabName={t('tabs.bank')}>
            <Suspense fallback={<TabLoading label={t('tabs.bank')} />}>
              <BankTab
                gameState={gameState}
                creditTier={creditTier}
                creditScore={creditScore}
                formatMoney={formatMoney}
                formatPercent={formatPercent}
                getCreditTierColor={getCreditTierColor}
                coachBankLoansRef={coachBankLoansRef}
                coachHighlight={coachHighlight}
                adjustedLoanOptions={adjustedLoanOptions}
                calculateLoanPayment={calculateLoanPayment}
                handleTakeLoan={handleTakeLoan}
                handlePayDebt={handlePayDebt}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        {/* ============================================ */}
        {/* CAREER TAB */}
        {/* ============================================ */}
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

        {/* ============================================ */}
        {/* EDUCATION TAB */}
        {/* ============================================ */}
        {activeTab === TABS.EDUCATION && (
          <TabErrorBoundary tabName={t('tabs.education')}>
            <Suspense fallback={<TabLoading label={t('tabs.education')} />}>
              <EducationTab
                gameState={gameState}
                careerPath={careerPath}
                formatMoney={formatMoney}
                handleEnrollEducation={handleEnrollEducation}
                coachLifestyleGridRef={coachLifestyleGridRef}
                coachHighlight={coachHighlight}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        {/* ============================================ */}
        {/* SELF LEARN TAB */}
        {/* ============================================ */}
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

        {/* ============================================ */}
        {/* SIDE HUSTLES TAB */}
        {/* ============================================ */}
        {activeTab === TABS.SIDEHUSTLE && (
          <TabErrorBoundary tabName={t('tabs.sideHustles')}>
            <Suspense fallback={<TabLoading label={t('tabs.sideHustles')} />}>
              <SideHustlesTab
                gameState={gameState}
                cashFlow={cashFlow}
                formatMoney={formatMoney}
                getHustleUpgradeLabel={getHustleUpgradeLabel}
                getNextHustleMilestone={getNextHustleMilestone}
                handleStartSideHustle={handleStartSideHustle}
                handleStopSideHustle={handleStopSideHustle}
                setShowSideHustleUpgradeModal={setShowSideHustleUpgradeModal}
                coachSideHustlesRef={coachSideHustlesRef}
                coachHighlight={coachHighlight}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        {/* ============================================ */}
        {/* LIFESTYLE TAB */}
        {/* ============================================ */}
        {activeTab === TABS.LIFESTYLE && (
          <TabErrorBoundary tabName={t('tabs.lifestyle')}>
            <Suspense fallback={<TabLoading label={t('tabs.lifestyle')} />}>
              <LifestyleTab
                gameState={gameState}
                formatMoney={formatMoney}
                handleChangeLifestyle={handleChangeLifestyle}
                coachLifestyleGridRef={coachLifestyleGridRef}
                coachHighlight={coachHighlight}
                coachHint={coachHint}
                activeTab={activeTab}
                InfoTip={InfoTip}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        </main>
      </>
      )}

      {/* Re-open Preview Pill (Step 12) */}
      <AnimatePresence>
        {showReopenPreviewPill && !showTurnPreview && !gameState.pendingScenario && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed right-4 bottom-24 md:bottom-6 z-40"
          >
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <Sparkles size={16} className="text-emerald-300" />
              </div>
              <div className="leading-tight">
                <p className="text-white text-sm font-semibold">Want to re-check cashflow?</p>
                <p className="text-slate-400 text-xs">Re-open the Next Month preview.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openTurnPreviewNow}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Open
                </button>
                <button
                  onClick={() => setShowReopenPreviewPill(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/40"
                  aria-label="Dismiss preview shortcut"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Batch Buy Cart Bar */}
      <AnimatePresence>
        {activeTab === TABS.INVEST && batchBuyMode && batchBuyCart.totalUnits > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:bottom-6 z-[45] w-[min(42rem,calc(100vw-2rem))]"
          >
            <div
              className={`rounded-2xl border backdrop-blur px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
                batchBuyCart.canAfford ? 'bg-slate-900/90 border-slate-700' : 'bg-rose-900/30 border-rose-500/50'
              }`}
            >
              <div className="flex-1">
                <div className="text-white font-semibold">Batch Cart</div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {batchBuyCart.totalUnits} units • Total {formatMoneyFull(batchBuyCart.totalCost)} • Cash {formatMoneyFull(gameState.cash)}
                </div>
                {!batchBuyCart.canAfford && (
                  <div className="text-xs text-rose-200 mt-1">
                    You&apos;re short by {formatMoneyFull(batchBuyCart.totalCost - gameState.cash)}.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearBatchBuyCart}
                  className="px-4 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold transition"
                >
                  Clear
                </button>
                <button
                  onClick={openBatchBuyConfirm}
                  disabled={!batchBuyCart.canAfford}
                  className={`px-4 py-2 rounded-xl font-semibold transition ${
                    batchBuyCart.canAfford ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Review &amp; Buy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Stats Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-3 z-30">
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-xs text-slate-400">Cash</p>
            <p className="text-emerald-400 font-bold">{formatMoney(gameState.cash)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Net Worth</p>
            <p className="text-white font-bold">{formatMoney(netWorth)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Passive</p>
            <p className="text-amber-400 font-bold">{formatMoney(cashFlow.passive)}/mo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
