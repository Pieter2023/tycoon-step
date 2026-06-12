import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GameState, AssetType, MarketItem, Lifestyle, Character, Asset, SideHustle, EducationOption, Liability, PlayerConfig, MonthlyActionId, TABS, TabId, EducationLevel, PlayerStats } from './types';
import { INITIAL_GAME_STATE, CHARACTERS, DIFFICULTY_SETTINGS, CAREER_PATHS, LIFESTYLE_OPTS, MARKET_ITEMS, EDUCATION_OPTIONS, SIDE_HUSTLES, MORTGAGE_OPTIONS, AI_CAREER_IMPACT, FINANCIAL_FREEDOM_TARGET_MULTIPLIER, getInitialQuestState, getQuestById, ALL_LIFE_EVENTS, AUTO_INVEST_PRESETS } from './constants';
import { processTurn, calculateMonthlyCashFlowEstimate, applyScenarioOutcome, calculateNetWorth, createMortgage, getEducationSalaryMultiplier, applyMonthlyAction, getQuestProgress, updateQuests, claimQuestReward, getCreditTier, checkPromotion, MAX_SOLD_POSITIONS } from './services/gameLogic';
import { playMoneyGain, playMoneyLoss, playClick, playPurchase, playSell, playAchievement, playLevelUp, playVictory, playWarning, playTick, playNotification, playError, setMuted } from './services/audioService';
import { SaveSlotId } from './services/storageService';
import confetti from 'canvas-confetti';
import { useI18n, formatCurrencyCompactValue, formatCurrencyValue, formatPercentValue } from './i18n';
import { DEFAULT_TAB_UI_STATE, hydrateTabUiState, TabUiState } from './services/tabState';
import { GLOSSARY_ENTRIES, QUIZ_DEFINITIONS, getQuizDefinition } from './data/learning';

import TabErrorBoundary from './components/TabErrorBoundary';
import { useTabIntroVideo } from './hooks/useTabIntroVideo';
import { useSaveLoad } from './hooks/useSaveLoad';
import { useAutoplay, useAutoplayScheduler, AUTOPLAY_SPEED_OPTIONS, AUTOPLAY_SPEED_LABELS } from './hooks/useAutoplay';
import { useTutorial } from './hooks/useTutorial';
import { useCoachHints, CoachTarget } from './hooks/useCoachHints';
import Modal from './components/Modal';
import {
  VictoryModal,
  BankruptcyModal,
  ChallengeEndModal,
  RunSummaryModal,
  AnnualReportModal,
  ConfirmDialogModal,
  ConfirmDialogConfig,
  AccessibilityModal,
  AccessibilityPrefs,
  ImageLightboxModal,
  EmergencyCashModal,
  GlossaryModal,
  SideHustleUpgradeModal,
  MarketSpecialModal,
  MarketSpecialAction,
  DashboardDetailModal,
  QuickTutorialModal,
  TutorialModal,
  TUTORIAL_TIPS,
  MortgageModal,
  MortgagePreview,
  TurnPreviewModal,
  TurnPreviewData,
  TurnPreviewLine,
  ScenarioModal,
  TabIntroVideoModal,
  TabIntroVideoConfig,
  SaveManagerModal,
  TutorialVideosModal
} from './components/modals';
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
import ActionsScreen from './components/v2/ActionsScreen';
import ProfileScreen from './components/v2/ProfileScreen';
import MoreScreen from './components/v2/MoreScreen';
import { getMonthlyActionsSummary } from './services/monthlyActions';
import { useBatchBuy } from './hooks/useBatchBuy';
import UnlockModal from './components/UnlockModal';
import { AccessTier, DEMO_MONTH_LIMIT, getAccessTier } from './services/accessControl';

// New Components for Enhanced UI
import CollapsibleSection from './components/ui/CollapsibleSection';
import { ToastContainer, useToast } from './components/ui/Toast';
import Confetti from './components/Confetti';
import KeyboardShortcutsOverlay from './components/KeyboardShortcutsOverlay';
import CharacterSelect from './components/CharacterSelect';
import CommandDashboard from './components/v2/CommandDashboard';

// Hooks
import { useKeyboardShortcuts, createGameShortcuts } from './hooks/useKeyboardShortcuts';

import { 
  Play, Pause, FastForward, TrendingUp, DollarSign, Home, Briefcase, 
  GraduationCap, Heart, PiggyBank, LineChart, AlertTriangle, CheckCircle,
  X, Clock, Wallet, ArrowUpRight, ArrowDownRight, Sparkles, Volume2, VolumeX, 
  Bot, CreditCard, Coffee, Banknote, Plus, Minus, Save as SaveIcon, FolderOpen as FolderOpenIcon, Trash2,
  Users, BookOpen, Zap, HeartPulse, Trophy, Info, Settings, MoreHorizontal, Keyboard
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


// TurnPreviewLine/TurnPreviewData types now live in components/modals/TurnPreviewModal.

// ConfirmDialogConfig and AccessibilityPrefs now live in components/modals/.

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

// MortgagePreview type now lives in components/modals/MortgageModal.

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


const QUICK_TUTORIAL_SRC = '/videos/quick-tutorial.mp4';

const CASH_FLOW_HISTORY_STORAGE_KEY = 'tycoon_cash_flow_history_v1_';
const AI_DISRUPTION_HISTORY_STORAGE_KEY = 'tycoon_ai_disruption_history_v1_';
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
  if (import.meta.env.MODE === 'test') {
    return false;
  }
  const envValue = import.meta.env.VITE_UI_V2;
  if (typeof envValue === 'string' && envValue.length > 0) {
    return normalizeFlag(envValue);
  }
  return true;
};
const LAST_SAVE_SLOT_STORAGE_KEY = 'tycoon_last_save_slot_v1';

const resolveSaveSlot = (raw: string | null): SaveSlotId => {
  if (raw === 'autosave' || raw === 'slot1' || raw === 'slot2' || raw === 'slot3') return raw;
  return 'autosave';
};

// TabIntroVideoConfig type now lives in components/modals/TabIntroVideoModal.

// MarketSpecialAction type now lives in components/modals/MarketSpecialModal.

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
  accessTier?: AccessTier;
}

const createTabUiStateMap = (): Record<TabId, TabUiState> =>
  Object.values(TABS).reduce((acc, tabId) => {
    acc[tabId] = { ...DEFAULT_TAB_UI_STATE };
    return acc;
  }, {} as Record<TabId, TabUiState>);

const App: React.FC<AppProps> = ({ onBackToMenu, initialGameState, playerConfig, isMultiplayer, onTurnComplete, accessTier }) => {
  const { t, locale, setLocale, formatNumber } = useI18n();
  const [tier, setTier] = useState<AccessTier>(accessTier ?? getAccessTier());
  const [showDemoLimitModal, setShowDemoLimitModal] = useState(false);
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
  // Autoplay state machine (speed, per-slot prefs, derived labels) lives in
  // hooks/useAutoplay; the timer is wired up further down (useAutoplayScheduler)
  // once advanceMonth + isAutoplayBlocked exist.
  const {
    autoPlaySpeed,
    setAutoPlaySpeed,
    toggleAutoplay,
    autoplayEnabled,
    autoplaySpeedLabel,
    autoplayTooltip
  } = useAutoplay({ initialSaveSlot, currentSaveSlot, gameState });
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
  // Run summary card for normal games (win / bankruptcy / anytime via HUD menu)
  const [showRunCard, setShowRunCard] = useState(false);

  const tabUiStateRef = useRef<Record<TabId, TabUiState>>(createTabUiStateMap());
  const pendingScrollRestoreRef = useRef<TabId | null>(null);
  const prevTabRef = useRef<TabId>(activeTab);


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
  const [showTutorialVideos, setShowTutorialVideos] = useState(false);
  const [showSideHustleUpgradeModal, setShowSideHustleUpgradeModal] = useState(false);
  const [showEventLab, setShowEventLab] = useState(false);
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
  // NEW UI ENHANCEMENTS
  // ============================================
  // Toast notification system
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();
  
  // Confetti effect
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Keyboard shortcuts overlay
  const [showShortcutsOverlay, setShowShortcutsOverlay] = useState(false);

  // View mode for dashboard (compact vs expanded)
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');

  // Monthly actions selected tracking
  const [monthlyActionsSelected, setMonthlyActionsSelected] = useState<Set<string>>(new Set());

  // Confetti configuration for origin point
  const [confettiConfig, setConfettiConfig] = useState<{ origin: { x: number; y: number } } | null>(null);

  // ============================================
  // TAB INTRO VIDEOS (config-driven onboarding popups)
  // - Shows ONLY the first time a user opens a tab (per-device via localStorage)
  // - "Show later" closes without saving (shows again next time they open the tab)
  // - "Don't show again" / "Continue" saves a per-tab localStorage flag
  // ============================================
  // QW-3: tab intro-video state machine lives in hooks/useTabIntroVideo.
  const introVideo = useTabIntroVideo(TAB_INTRO_VIDEO_CONFIG);

  // Event image enhancements
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = accessibilityPrefs.reduceMotion || prefersReducedMotion;
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

  // Keyboard shortcuts
  useKeyboardShortcuts(
    createGameShortcuts({
      onNextMonth: () => {
        if (!isProcessing && !showTurnPreview && gameStarted) {
          handleNextTurn();
        }
      },
      onToggleAutoplay: () => {
        if (gameStarted) {
          toggleAutoplay();
        }
      },
      onOpenActions: () => {
        if (gameStarted) {
          setActionsDrawerOpen(true);
        }
      },
      onNavigateToInvest: () => {
        if (gameStarted) setActiveTab(TABS.INVEST);
      },
      onNavigateToPortfolio: () => {
        if (gameStarted) setActiveTab(TABS.ASSETS);
      },
      onNavigateToBank: () => {
        if (gameStarted) setActiveTab(TABS.BANK);
      },
      onNavigateToCareer: () => {
        if (gameStarted) setActiveTab(TABS.CAREER);
      },
      onNavigateToEducation: () => {
        if (gameStarted) setActiveTab(TABS.EDUCATION);
      },
      onNavigateToSideHustles: () => {
        if (gameStarted) setActiveTab(TABS.SIDEHUSTLE);
      },
      onNavigateToLifestyle: () => {
        if (gameStarted) setActiveTab(TABS.LIFESTYLE);
      },
      onShowShortcuts: () => {
        if (gameStarted) setShowShortcutsOverlay(true);
      },
    }),
    gameStarted && !showCharacterSelect
  );

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
  // COACH HINTS (Step 12) — state machine lives in hooks/useCoachHints
  // ============================================
  const {
    coachHint,
    setCoachHint,
    triggerCoachHint,
    coachHighlight,
    showReopenPreviewPill,
    setShowReopenPreviewPill,
    coachMonthlyActionsRef,
    coachLifestyleGridRef,
    coachAssetsSellRef,
    coachSideHustlesRef,
    coachBankLoansRef
  } = useCoachHints({ activeTab, gameStarted, isMultiplayer, reduceMotion, showTurnPreview });

  // ============================================
  // TAB INTRO VIDEOS (config-driven onboarding popups)
  // ============================================

  // If the scenario modal closes, ensure any open lightbox also closes
  useEffect(() => {
    if (!gameState.pendingScenario && imageLightbox) {
      setImageLightbox(null);
    }
  }, [gameState.pendingScenario, imageLightbox]);

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

  const notifTimeoutRef = useRef<number | null>(null);

  // Defined before useSaveLoad so the hook's deps object can reference it
  // (it's a const — reading it earlier in the render body is a TDZ crash).
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

  // Save / Load (state machine + handlers live in hooks/useSaveLoad)
  const {
    saveSlots: SAVE_SLOTS,
    showSaveManager,
    setShowSaveManager,
    saveSummaries,
    saveLabelDrafts,
    setSaveLabelDrafts,
    exportSlotId,
    setExportSlotId,
    importSlotId,
    setImportSlotId,
    importPayload,
    setImportPayload,
    importError,
    autosaveStatus,
    recordAutosave,
    refreshSaveSummaries,
    openSaveManager,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleDeleteSlot,
    handleRenameSlot,
    handleExportSlot,
    handleImportSave
  } = useSaveLoad({
    isMultiplayer,
    gameState,
    currentSaveSlot,
    setCurrentSaveSlot,
    setGameState,
    setGameStarted,
    setIsProcessing,
    setMonthlyReport,
    setShowCharacterSelect,
    setSoundEnabled,
    showNotif
  });

  // Tutorial/onboarding state machine lives in hooks/useTutorial.
  const {
    autoTutorialPopups,
    setAutoTutorialPopups,
    hideTipsEverywhere,
    setHideTipsEverywhere,
    showTutorial,
    setShowTutorial,
    tutorialStep,
    setTutorialStep,
    tutorialDismissed,
    setTutorialDismissed,
    showQuickTutorial,
    setShowQuickTutorial,
    isTutorialActive,
    markOnboardingSeen,
    shouldShowOnboarding
  } = useTutorial({ gameStarted, isMultiplayer, isResumingFromSave });

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

  // Quiz trigger keys on the invest filter changing (the filter buttons only
  // exist inside InvestTab, so a non-ALL filter proves the invest surface is
  // in use) — NOT on activeTab, which v2 navigation doesn't always set.
  useEffect(() => {
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
  }, [investmentFilter, quizSeen, activeQuizId]);
  
  // Shared restart for the win/bankruptcy end screens.
  const handlePlayAgain = useCallback(() => {
    setAutoPlaySpeed(null);
    setGameStarted(false);
    setShowCharacterSelect(true);
    setMonthlyReport(null);
    setActiveTab(TABS.OVERVIEW);
    setV2Path('/play');
    setTutorialStep(0);
    setTutorialDismissed(false);
    setShowTutorial(shouldShowOnboarding());
    setGameState({
      ...INITIAL_GAME_STATE,
      quests: getInitialQuestState()
    });
  }, [shouldShowOnboarding]);

  // The autoplay-preference write moved into useAutoplay; this keeps the
  // last-used-slot bookkeeping (read at startup by initialSaveSlot).
  useEffect(() => {
    try {
      localStorage.setItem(LAST_SAVE_SLOT_STORAGE_KEY, currentSaveSlot);
    } catch (e) {
      console.warn('Failed to save slot preference:', e);
    }
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

  const isScrollRestoreBlocked =
    !!gameState.pendingScenario ||
    !!gameState.pendingSideHustleUpgrade ||
    !!marketSpecialAction ||
    !!confirmDialog ||
    !!showMortgageModal ||
    !!introVideo.tabId ||
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

  // Navigate BOTH routing systems: the activeTab mirror (still read by the
  // coach gates and tab-keyed config) and the v2 shell router. Without the
  // v2 write, TurnPreview quick-fixes and intro-video "Continue" silently
  // no-op in the v2 shell.
  const navigateToTab = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    if (tabId === TABS.INVEST) {
      setV2Path('/money');
      setForcedMoneyTab('invest');
    } else if (tabId === TABS.ASSETS) {
      setV2Path('/money');
      setForcedMoneyTab('portfolio');
    } else if (tabId === TABS.BANK) {
      setV2Path('/money');
      setForcedMoneyTab('bank');
    } else if (tabId === TABS.LIFESTYLE) {
      setV2Path('/life');
      setForcedLifeTab('lifestyle');
    } else if (tabId === TABS.SIDEHUSTLE) {
      setV2Path('/life');
      setForcedLifeTab('sidehustles');
    } else if (tabId === TABS.CAREER) {
      setV2Path('/career');
    } else if (tabId === TABS.EDUCATION || tabId === TABS.SELF_LEARN || tabId === TABS.EQ || tabId === TABS.NEGOTIATIONS) {
      setV2Path('/learn');
    } else {
      setV2Path('/play');
    }
  }, []);
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

  // Batch-buy (securities) cluster lives in hooks/useBatchBuy.
  const {
    batchBuyMode,
    batchBuyQuantities,
    setBatchBuyQuantities,
    batchBuyCart,
    isBatchBuyEligible,
    toggleBatchBuyMode,
    setBatchQty,
    clearBatchBuyCart,
    openBatchBuyConfirm
  } = useBatchBuy({ gameState, setGameState, showNotif, openConfirmDialog, setFloatingNumbers, maybeConfetti });

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
    if (tier === 'demo' && !isMultiplayer && gameState.month > DEMO_MONTH_LIMIT) {
      setAutoPlaySpeed(null);
      setShowDemoLimitModal(true);
      return;
    }
    // Daily challenge: the run is over once the target month is reached —
    // the end screen takes it from here.
    if (gameState.challenge && gameState.month > gameState.challenge.targetMonths) {
      setAutoPlaySpeed(null);
      return;
    }
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
        setShowConfetti(true);
        if (newState.challenge) {
          // No blocking modal in challenge mode — the sprint continues to the
          // target month; the share card celebrates the win at the end.
          const remaining = Math.max(0, newState.challenge.targetMonths - newState.month + 1);
          showSuccess('🎉 Financially free!', `Locked in for the score card — keep building for ${remaining} more months.`, { duration: 8000 });
        } else {
          showSuccess('🎉 Financial Freedom Achieved!', 'You\'ve reached your goal! Passive income covers 110% of expenses.', { duration: 8000 });
        }
      }

      if (report.promoted) {
        playLevelUp();
        showNotif('🎉 Promotion!', `Promoted to ${newState.career?.title}!`, 'success');
        showSuccess('Promotion!', `Congratulations! You've been promoted to ${newState.career?.title}`, { duration: 6000 });
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      if (shouldShowSummaryToast) {
        const cashDelta = report.income - report.expenses;
        const cashDeltaLabel = `${cashDelta >= 0 ? '+' : '-'}${formatMoneyFull(Math.abs(cashDelta))}`;
        showNotif(
          'Month complete',
          `Income ${formatMoneyFull(report.income)} • Expenses ${formatMoneyFull(report.expenses)} • Cash ${cashDeltaLabel}`,
          cashDelta >= 0 ? 'success' : 'warning'
        );
        showInfo(
          'Month Complete',
          `Income: ${formatMoneyFull(report.income)} • Expenses: ${formatMoneyFull(report.expenses)} • Net: ${cashDeltaLabel}`,
          { duration: 5000 }
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
  }, [autoPlaySpeed, gameState, isProcessing, isMultiplayer, onTurnComplete, multiplayerTurnsTaken, recordAutosave, tier]);

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
          toggleAutoplay();
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
    !!introVideo.tabId ||
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

  useAutoplayScheduler({
    speed: autoPlaySpeed,
    blocked: isAutoplayBlocked,
    month: gameState.month,
    onAdvance: advanceMonth
  });

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
        toggleAutoplay();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showSaveManager, confirmDialog, showAccessibility, imageLightbox,
    introVideo.tabId, showTurnPreview, showTutorial, tutorialDismissed,
    tutorialStep, TUTORIAL_TIPS.length, showMortgageModal,
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

      // Ghost holding: keep tracking what this position would be worth if
      // held — fuels the "Hindsight" counterfactual 12 months from now.
      // heldValue starts at market value (negotiation bonus excluded: holding
      // wouldn't have earned it... but the player DID pocket saleValue).
      const soldPosition = {
        id: `sold-${assetId}-${prev.month}`,
        name: asset.name,
        assetType: asset.type,
        saleMonth: prev.month,
        saleValue,
        heldValue: baseSaleValue,
        industry: asset.industry,
        marketPhaseAtSale: prev.marketCycle.phase
      };

      return {
        ...prev,
        cash: prev.cash + netProceeds,
        assets: prev.assets.filter(a => a.id !== assetId),
        liabilities: nextLiabilities,
        mortgages: nextMortgages,
        soldPositions: [...(prev.soldPositions || []), soldPosition].slice(-MAX_SOLD_POSITIONS),
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
          const loanType: Liability['type'] = loanOption.id === 'business' ? 'BUSINESS_LOAN' : 'PERSONAL_LOAN';
          const newLiability: Liability = {
            id: 'loan-' + Date.now(),
            name: loanOption.name,
            balance: loanOption.amount,
            originalBalance: loanOption.amount,
            interestRate: loanOption.rate,
            monthlyPayment: payment,
            type: loanType
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
    const estLoanPayment = isExpensive ? calculateLoanPayment(loanAmount, 0.065, edu.duration) : 0;
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

      {/* Toast Notifications - New Toast System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Confetti Celebration Effect */}
      <Confetti active={!!confettiConfig} origin={confettiConfig ? { x: confettiConfig.origin.x, y: confettiConfig.origin.y } : undefined} />

      {/* Demo limit — unlock to keep playing this run */}
      <UnlockModal
        open={showDemoLimitModal}
        title="That's the end of the free demo"
        description="You've played 3 in-game years. Unlock the full game to keep building this exact run — your progress is saved."
        perks={['Unlimited in-game years', 'Multiplayer for 2-4 players', 'All future updates']}
        onUnlocked={() => {
          setTier('full');
          setShowDemoLimitModal(false);
          showSuccess('Full game unlocked!', 'All limits removed. Enjoy the climb to financial freedom!', { duration: 6000 });
        }}
        onClose={() => setShowDemoLimitModal(false)}
      />

      {/* Keyboard Shortcuts Overlay */}
      <KeyboardShortcutsOverlay 
        isOpen={showShortcutsOverlay} 
        onClose={() => setShowShortcutsOverlay(false)} 
        shortcuts={[
          { key: 'n', action: () => {}, description: 'Next Month' },
          { key: 't', action: () => {}, description: 'Toggle Autoplay' },
          { key: 'a', action: () => {}, description: 'Actions Tab' },
          { key: 'i', action: () => {}, description: 'Invest Tab' },
          { key: 'p', action: () => {}, description: 'Portfolio Tab' },
          { key: 'b', action: () => {}, description: 'Bank Tab' },
          { key: 'c', action: () => {}, description: 'Career Tab' },
          { key: 'e', action: () => {}, description: 'Education Tab' },
          { key: 's', action: () => {}, description: 'Side Hustles Tab' },
          { key: 'l', action: () => {}, description: 'Lifestyle Tab' },
          { key: '?', action: () => {}, description: 'Show Shortcuts' },
        ]} 
      />

      {/* Tab Intro Video (shows only first time a user opens a tab, unless postponed) */}
      {introVideo.tabId && introVideo.activeConfig && (
        <TabIntroVideoModal
          config={introVideo.activeConfig}
          videoRef={introVideo.videoRef}
          muted={introVideo.muted}
          isPlaying={introVideo.isPlaying}
          hasStarted={introVideo.hasStarted}
          playbackError={introVideo.playbackError}
          dontShowAgain={introVideo.dontShowAgain}
          shouldPreload={shouldPreloadVideos}
          onVideoPlay={introVideo.handleVideoPlay}
          onVideoPause={introVideo.handleVideoPause}
          onVideoEnded={introVideo.handleVideoEnded}
          onVideoError={introVideo.handleVideoError}
          onTogglePlayback={introVideo.togglePlayback}
          onToggleMute={introVideo.toggleMute}
          onRetry={() => void introVideo.requestPlayback()}
          onDontShowAgainChange={introVideo.setDontShowAgain}
          onContinue={() => {
            const continueToTab = introVideo.activeConfig?.continueToTab;
            introVideo.close({ remember: true });
            if (continueToTab) {
              navigateToTab(continueToTab);
            }
          }}
          onSkip={() => introVideo.close({ remember: false })}
          onCloseRemember={() => introVideo.close({ remember: true })}
          onDismiss={() => introVideo.close()}
        />
      )}

      {/* Confirmation Dialog (prevents costly mis-clicks) */}
      {confirmDialog && (
        <ConfirmDialogModal config={confirmDialog} onClose={closeConfirmDialog} />
      )}

      {/* Accessibility Settings */}
      {showAccessibility && (
        <AccessibilityModal
          prefs={accessibilityPrefs}
          setPrefs={setAccessibilityPrefs}
          autoTutorialPopups={autoTutorialPopups}
          setAutoTutorialPopups={setAutoTutorialPopups}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onClose={() => setShowAccessibility(false)}
        />
      )}

      {/* Next Month Preview (Step 10) */}
      {showTurnPreview && turnPreview && (() => {
        const goTo = (tabId: TabId, tipTitle: string, tipMessage: string, tipType: string = 'info') => {
          playClick();
          hideTurnPreview();
          navigateToTab(tabId);
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
          navigateToTab(TABS.OVERVIEW);
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

        return (
          <TurnPreviewModal
            preview={turnPreview}
            gameState={gameState}
            isProcessing={isProcessing}
            lifestyleCashDelta={lifestyleCashDelta}
            showNextMonthPreview={showNextMonthPreview}
            onToggleShowPreview={setShowNextMonthPreview}
            onQuickFixNavigate={goTo}
            onUseQuickAction={useAction}
            onClose={closeTurnPreview}
            onConfirm={confirmTurnPreview}
          />
        );
      })()}

      {/* Side Hustle Milestone Upgrade */}
      {showSideHustleUpgradeModal && pendingSideHustle && pendingSideHustleMilestone && (
        <SideHustleUpgradeModal
          hustle={pendingSideHustle}
          milestone={pendingSideHustleMilestone}
          cash={gameState.cash}
          onChoose={handleSideHustleUpgradeChoice}
          onClose={() => setShowSideHustleUpgradeModal(false)}
        />
      )}

      {/* Scenario Modal */}
      {gameState.pendingScenario && (
        <ScenarioModal
          scenario={gameState.pendingScenario}
          optionsRef={coachAssetsSellRef}
          optionsHighlightClass={coachHighlight('assets-sell')}
          reduceMotion={reduceMotion}
          isMultiplayer={isMultiplayer}
          autoPlaySpeed={autoPlaySpeed}
          autoplaySpeedLabel={autoplaySpeedLabel}
          onToggleAutoplay={toggleAutoplay}
          onOpenImage={openImageLightbox}
          onChoose={handleScenarioChoice}
        />
      )}


      {/* Market Special Action Modal (Buy the Dip / Panic Sell) */}
      {marketSpecialAction && (
        <MarketSpecialModal
          action={marketSpecialAction}
          gameState={gameState}
          discountBuyItemId={discountBuyItemId}
          setDiscountBuyItemId={setDiscountBuyItemId}
          discountBuyQuantity={discountBuyQuantity}
          setDiscountBuyQuantity={setDiscountBuyQuantity}
          panicSellSelection={panicSellSelection}
          setPanicSellSelection={setPanicSellSelection}
          onExecuteDiscountBuy={executeDiscountBuy}
          onExecutePanicSell={executePanicSell}
          onClose={closeMarketSpecialAction}
        />
      )}

      {/* Event Image Lightbox */}
      {imageLightbox && (
        <ImageLightboxModal image={imageLightbox} reduceMotion={reduceMotion} onClose={closeImageLightbox} />
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
          <MortgageModal
            item={showMortgageModal}
            price={price}
            previews={previews}
            selectedMortgage={selectedMortgage}
            onSelectMortgage={setSelectedMortgage}
            cash={gameState.cash}
            cashFlowIncome={cashFlow.income}
            cashFlowDebtPayments={cashFlow.debtPayments}
            onReview={reviewMortgage}
            onBuyCash={() => handleBuyAsset(showMortgageModal)}
            onClose={() => { setShowMortgageModal(null); setSelectedMortgage(''); }}
          />
        );
      })()}

      {/* Win Celebration Modal */}
      {gameState.hasWon && !gameState.challenge && (
        <VictoryModal
          gameState={gameState}
          netWorth={netWorth}
          passiveIncome={cashFlow.passive}
          monthlyExpenses={cashFlow.expenses}
          onShare={() => setShowRunCard(true)}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Daily Challenge end screen (run complete or bust) */}
      {gameState.challenge && (gameState.month > gameState.challenge.targetMonths || gameState.isBankrupt) && (
        <ChallengeEndModal gameState={gameState} netWorth={netWorth} onBackToMenu={onBackToMenu} />
      )}

      {/* Bankruptcy Modal */}
      {gameState.isBankrupt && !gameState.challenge && (
        <BankruptcyModal
          gameState={gameState}
          onShare={() => setShowRunCard(true)}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Run summary card (normal games: win, bankruptcy, or anytime via menu) */}
      {showRunCard && !gameState.challenge && gameState.character && (
        <RunSummaryModal gameState={gameState} netWorth={netWorth} onClose={() => setShowRunCard(false)} />
      )}

      {/* Year in review (learning counterfactuals; normal games only) */}
      {gameState.annualReport && !gameState.challenge && !gameState.isBankrupt && (
        <AnnualReportModal
          report={gameState.annualReport}
          onDismiss={() => setGameState(prev => ({ ...prev, annualReport: undefined }))}
        />
      )}

      {/* Quick Tutorial Modal */}
      {showQuickTutorial && gameStarted && !gameState.pendingScenario && !gameState.isBankrupt && (
        <QuickTutorialModal onClose={() => setShowQuickTutorial(false)} />
      )}

      {/* Tutorial Modal - shown for new players */}
      {gameStarted && showTutorial && !showQuickTutorial && !tutorialDismissed && !gameState.pendingScenario && !gameState.isBankrupt && tutorialStep < TUTORIAL_TIPS.length && (
        <TutorialModal
          step={tutorialStep}
          onNext={() => setTutorialStep(tutorialStep + 1)}
          onDismiss={() => { setTutorialDismissed(true); setShowTutorial(false); markOnboardingSeen(); }}
          onApplyAutoInvestPreset={(presetId) => {
            applyAutoInvestPreset(presetId);
            setActiveTab(TABS.INVEST);
            handleV2Navigate('/money', 'invest');
          }}
        />
      )}

      {/* Emergency Asset Sale Warning */}
      {gameState.cash <= 0 && !gameState.isBankrupt && gameState.assets.length > 0 && (
        <EmergencyCashModal
          gameState={gameState}
          onSell={(asset, netValue) => {
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
        />
      )}

      {/* Save Manager */}
      {showSaveManager && (
        <SaveManagerModal
          saveSlots={SAVE_SLOTS}
          saveSummaries={saveSummaries}
          saveLabelDrafts={saveLabelDrafts}
          setSaveLabelDrafts={setSaveLabelDrafts}
          exportSlotId={exportSlotId}
          setExportSlotId={setExportSlotId}
          importSlotId={importSlotId}
          setImportSlotId={setImportSlotId}
          importPayload={importPayload}
          setImportPayload={setImportPayload}
          importError={importError}
          onSaveToSlot={handleSaveToSlot}
          onLoadFromSlot={handleLoadFromSlot}
          onDeleteSlot={handleDeleteSlot}
          onRenameSlot={handleRenameSlot}
          onExportSlot={(slotId, mode) => void handleExportSlot(slotId, mode)}
          onImport={handleImportSave}
          onRefresh={() => {
            // Hard refresh in case another tab modified saves
            refreshSaveSummaries();
            showNotif('Refreshed', 'Save slots refreshed', 'info');
          }}
          onClose={() => setShowSaveManager(false)}
        />
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
        <GlossaryModal onClose={() => setShowGlossary(false)} />
      )}
      {showTutorialVideos && (
        <TutorialVideosModal
          configs={TAB_INTRO_VIDEO_CONFIG}
          onWatch={(tabId) => {
            setShowTutorialVideos(false);
            introVideo.open(tabId, { autoplay: true });
          }}
          onClose={() => setShowTutorialVideos(false)}
        />
      )}
      {dashboardModal && (
        <DashboardDetailModal
          kind={dashboardModal}
          onClose={() => setDashboardModal(null)}
          netWorth={netWorth}
          netWorthTrendData={netWorthTrendData}
          latestCashFlowNet={latestCashFlowNet}
          cashFlowTrendData={cashFlowTrendData}
          creditScore={creditScore}
          creditTier={creditTier}
          creditTierColorClass={getCreditTierColor(creditTier)}
          creditTrendData={creditTrendData}
          aiDisruptionLevel={aiDisruptionLevel}
          aiRiskLabel={aiImpact?.automationRisk || 'LOW'}
          aiRiskColorClass={getAIRiskColor(aiImpact?.automationRisk || 'LOW')}
          aiTrendData={aiTrendData}
        />
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
            activePath={v2Path}
            onNavigatePath={(path) => {
              setV2Path(path);
              if (path === '/play') setMobileTab('dashboard');
            }}
            activeTab={v2Path === '/play' ? mobileTab : 'more'}
            onSelectTab={(tab) => {
              setMobileTab(tab);
              if (tab !== 'more') {
                setV2Path('/play');
              }
            }}
          >
            {v2Path === '/play' && mobileTab === 'dashboard' && (
              <CommandDashboard
                onOpenDetail={(kind) => setDashboardModal(kind)}
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
                onShowToast={(title, message, type) => {
                  switch (type) {
                    case 'success': showSuccess(title, message); break;
                    case 'error': showError(title, message); break;
                    case 'warning': showWarning(title, message); break;
                    default: showInfo(title, message); break;
                  }
                }}
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
                onOpenRunCard={gameState.challenge ? undefined : () => setShowRunCard(true)}
                onOpenQuests={() => setShowQuestLog(true)}
                onOpenGlossary={() => setShowGlossary(true)}
                onOpenTutorials={() => setShowTutorialVideos(true)}
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
                onToggleAutoplay={toggleAutoplay}
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
              year={Math.ceil(gameState.month / 12)}
              month={((gameState.month - 1) % 12) + 1}
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
                  onClick={toggleAutoplay}
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
              <CommandDashboard
                onOpenDetail={(kind) => setDashboardModal(kind)}
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
                onShowToast={(title, message, type) => {
                  switch (type) {
                    case 'success': showSuccess(title, message); break;
                    case 'error': showError(title, message); break;
                    case 'warning': showWarning(title, message); break;
                    default: showInfo(title, message); break;
                  }
                }}
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
              {!gameState.challenge && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRunCard(true);
                    setMobileOverflowOpen(false);
                  }}
                  className="glass-tile flex items-center gap-3 px-4 py-3 w-full"
                >
                  <LineChart size={18} className="text-violet-300" /> Run summary card
                </button>
              )}
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
                  setShowTutorialVideos(true);
                  setMobileOverflowOpen(false);
                }}
                className="glass-tile flex items-center gap-3 px-4 py-3 w-full"
              >
                <Play size={18} className="text-sky-300" /> Tutorial videos
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
                          onClick={() => {
                            handleNextTurn();
                            setConfettiConfig({ origin: { x: 0.9, y: 0.9 } });
                          }}
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
                        onClick={toggleAutoplay}
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
                              {!isMultiplayer && !gameState.challenge && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  fullWidth
                                  onClick={() => {
                                    playClick();
                                    setShowRunCard(true);
                                    setHudMenuOpen(false);
                                  }}
                                  className="justify-start"
                                >
                                  <LineChart size={16} /> Run summary card
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
                                  setShowTutorialVideos(true);
                                  setHudMenuOpen(false);
                                }}
                                className="justify-start"
                              >
                                <Play size={16} /> Tutorial videos
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
                      onClick={() => introVideo.open(activeTab, { autoplay: true })}
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

                  {introVideo.minimizedTabVideos[activeTab] && (
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
                          onClick={() => introVideo.open(activeTab, { autoplay: true })}
                          className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold flex items-center gap-2"
                        >
                          <Play size={16} /> Replay
                        </button>
                        <button
                          onClick={() => introVideo.setMinimizedTabVideos((prev) => ({ ...prev, [activeTab]: false }))}
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
