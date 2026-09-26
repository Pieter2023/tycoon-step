import { useI18n, type Translate } from '../../i18n';
import FreedomPaceLine from '../FreedomPaceLine';
import type { FreedomPace } from '../../services/freedomPace';
import React, { useMemo, useState } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  Flame,
  GraduationCap,
  Handshake,
  HeartPulse,
  History,
  Landmark,
  LayoutDashboard,
  LayoutList,
  LineChart,
  PieChart,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import { AssetType, GameState, LifeEvent, MonthlyActionId } from '../../types';
import { MonthlyActionsSummary } from '../../services/monthlyActions';
import AnimatedNumber from '../ui/AnimatedNumber';
import ActivityRing from '../ui/ActivityRing';
import { MOTION_DISABLED, riseIn, springs, stagger } from '../ui/motion';
import EventFeed from './EventFeed';
import NextBestStep from './NextBestStep';

type TrendPoint = { label: string; value: number };

type CommandDashboardProps = {
  firstSteps?: React.ReactNode;
  cashValue: number;
  netWorthValue: number;
  passiveValue: number;
  /** Freedom income (investments at the 4% rule) and its target: the same figures the win check uses. */
  freedomIncome?: number;
  freedomTarget?: number;
  /** How far away freedom is at today's pace (services/freedomPace.ts). */
  pace?: FreedomPace;
  expenseValue: number;
  formatMoney: (value: number) => string;
  freedomPercent: number;
  passiveTrend: TrendPoint[];
  expenseTrend: TrendPoint[];
  ratioValue: number;
  ratioLabel: string;
  passiveDelta: number | null;
  expenseDelta: number | null;
  cashSparkline: TrendPoint[];
  netWorthSparkline: TrendPoint[];
  passiveSparkline: TrendPoint[];
  monthlyActions: MonthlyActionsSummary;
  onUseMonthlyAction: (actionId: MonthlyActionId) => void;
  onOpenActions: () => void;
  onNavigate: (path: '/play' | '/money' | '/career' | '/learn' | '/life', tab?: 'invest' | 'lifestyle' | 'sidehustles') => void;
  events: LifeEvent[];
  gameState: GameState;
  onClaimQuest: (questId: string) => void;
  onOpenGoals: () => void;
  isProcessing: boolean;
  onShowToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  /** Open the drill-down chart modal (net worth / cash flow / credit / AI). */
  onOpenDetail?: (kind: 'netWorth' | 'cashFlow' | 'credit' | 'ai') => void;
};

type AdvisorAction =
  | { type: 'monthly'; actionId: MonthlyActionId }
  | { type: 'navigate'; path: '/play' | '/money' | '/career' | '/learn' | '/life'; tab?: 'invest' | 'lifestyle' | 'sidehustles' }
  | { type: 'goals' }
  | { type: 'drawer' }
  | { type: 'none' };

type AdvisorRecommendation = {
  label: string;
  title: string;
  body: string;
  impact: string;
  caution?: string;
  cta: string;
  icon: React.ReactNode;
  action: AdvisorAction;
  disabled?: boolean;
};

/* ------------------------------------------------------------------------------------------------
 * Apple system tints (docs/ui-design-system.md §2). Colour marks meaning: green = money and progress,
 * cyan/blue = information and net worth, orange = attention, red/pink = risk. Class strings are
 * literal so Tailwind can see them.
 * ---------------------------------------------------------------------------------------------- */
type Tint = 'green' | 'cyan' | 'blue' | 'orange' | 'purple' | 'pink' | 'red' | 'teal' | 'gray';

const TINTS: Record<Tint, { hex: string; medallion: string; text: string; glow: string; soft: string }> = {
  green: { hex: '#30d158', medallion: 'bg-[#30d158]/[0.16] text-[#30d158]', text: 'text-[#30d158]', glow: 'bg-[#30d158]/[0.16]', soft: 'bg-[#30d158]/[0.14]' },
  cyan: { hex: '#64d2ff', medallion: 'bg-[#64d2ff]/[0.16] text-[#64d2ff]', text: 'text-[#64d2ff]', glow: 'bg-[#64d2ff]/[0.14]', soft: 'bg-[#64d2ff]/[0.14]' },
  blue: { hex: '#0a84ff', medallion: 'bg-[#0a84ff]/[0.2] text-[#409cff]', text: 'text-[#409cff]', glow: 'bg-[#0a84ff]/[0.16]', soft: 'bg-[#0a84ff]/[0.16]' },
  orange: { hex: '#ff9f0a', medallion: 'bg-[#ff9f0a]/[0.16] text-[#ff9f0a]', text: 'text-[#ff9f0a]', glow: 'bg-[#ff9f0a]/[0.13]', soft: 'bg-[#ff9f0a]/[0.14]' },
  purple: { hex: '#bf5af2', medallion: 'bg-[#bf5af2]/[0.18] text-[#da8fff]', text: 'text-[#da8fff]', glow: 'bg-[#bf5af2]/[0.14]', soft: 'bg-[#bf5af2]/[0.16]' },
  pink: { hex: '#ff375f', medallion: 'bg-[#ff375f]/[0.16] text-[#ff6482]', text: 'text-[#ff6482]', glow: 'bg-[#ff375f]/[0.13]', soft: 'bg-[#ff375f]/[0.14]' },
  red: { hex: '#ff453a', medallion: 'bg-[#ff453a]/[0.16] text-[#ff6961]', text: 'text-[#ff6961]', glow: 'bg-[#ff453a]/[0.13]', soft: 'bg-[#ff453a]/[0.14]' },
  teal: { hex: '#40c8e0', medallion: 'bg-[#40c8e0]/[0.16] text-[#5de6ff]', text: 'text-[#5de6ff]', glow: 'bg-[#40c8e0]/[0.13]', soft: 'bg-[#40c8e0]/[0.14]' },
  gray: { hex: '#8e8e93', medallion: 'bg-white/[0.08] text-slate-300', text: 'text-slate-300', glow: 'bg-white/[0.05]', soft: 'bg-white/[0.08]' }
};

/** Recharts styling: a dark material tooltip and quiet gray axes. */
const chartTooltip = {
  contentStyle: {
    background: 'rgba(44, 44, 46, 0.86)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.6)',
    color: '#fff',
    fontSize: 12,
    padding: '8px 12px'
  },
  labelStyle: { color: '#aeaeb2', fontSize: 11, marginBottom: 2 },
  itemStyle: { color: '#fff', fontVariantNumeric: 'tabular-nums' as const }
};
const axisTick = { fill: '#8e8e93', fontSize: 11 };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatSignedMoney = (value: number | null | undefined, formatMoney: (value: number) => string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}${formatMoney(Math.abs(value))}`;
};

const compactPercent = (value: number) => `${Math.round(clamp(value, 0, 100))}%`;

const getTrendDelta = (data: TrendPoint[]) => {
  if (data.length < 2) return null;
  const last = data[data.length - 1]?.value ?? 0;
  const previous = data[data.length - 2]?.value ?? 0;
  return last - previous;
};

const getCreditTone = (score: number) => {
  if (score >= 760) return TINTS.green.text;
  if (score >= 680) return TINTS.cyan.text;
  if (score >= 620) return TINTS.orange.text;
  return TINTS.red.text;
};

const getHealthTone = (score: number, t: Translate) => {
  if (score >= 80) return { label: t('shell.commandDashboard.excellent'), className: TINTS.green.text, badge: 'bg-[#30d158]/[0.16] text-[#30d158]', ring: ['#30d158', '#66d4cf'] as [string, string] };
  if (score >= 62) return { label: t('shell.commandDashboard.stable'), className: TINTS.cyan.text, badge: 'bg-[#64d2ff]/[0.16] text-[#64d2ff]', ring: ['#64d2ff', '#0a84ff'] as [string, string] };
  if (score >= 45) return { label: t('shell.commandDashboard.watch'), className: TINTS.orange.text, badge: 'bg-[#ff9f0a]/[0.16] text-[#ffb340]', ring: ['#ff9f0a', '#ffd60a'] as [string, string] };
  return { label: t('shell.commandDashboard.at_risk'), className: TINTS.red.text, badge: 'bg-[#ff453a]/[0.16] text-[#ff6961]', ring: ['#ff453a', '#ff375f'] as [string, string] };
};

/** "REAL_ESTATE" → "Real estate" for the allocation chart's axis. */
const assetTypeLabel = (type: AssetType | string) => {
  const words = String(type).replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const makeFallbackTrend = (current: number, delta: number | null, label: string, t: Translate): TrendPoint[] => {
  if (typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) {
    return [
      { label: t('shell.commandDashboard.now'), value: current },
      { label, value: current }
    ];
  }
  return [
    { label: t('shell.commandDashboard.prev'), value: current - delta },
    { label, value: current }
  ];
};

/** A tinted rounded-square icon plate, the way Settings and Fitness mark a row's meaning. */
const Medallion: React.FC<{ tint: Tint; size?: 'sm' | 'md' | 'lg'; className?: string; children: React.ReactNode }> = ({ tint, size = 'md', className = '', children }) => {
  const dims = size === 'sm' ? 'h-7 w-7 rounded-[8px]' : size === 'lg' ? 'h-11 w-11 rounded-[13px]' : 'h-10 w-10 rounded-[12px]';
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center ${dims} ${TINTS[tint].medallion} ${className}`}>
      {children}
    </span>
  );
};

/** Small section header: a secondary eyebrow over a semibold title, with an optional trailing accessory. */
const SectionHeader: React.FC<{ eyebrow: string; title: string; accessory?: React.ReactNode }> = ({ eyebrow, title, accessory }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="eyebrow">{eyebrow}</p>
      <h3 className="mt-0.5 text-[19px] font-semibold leading-6 tracking-[-0.016em] text-white">{title}</h3>
    </div>
    {accessory}
  </div>
);

/** The last point of a sparkline gets a lit dot, like Stocks' "now" marker. */
const makeEndDot = (count: number, color: string) => {
  const EndDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props;
    if (index !== count - 1 || typeof cx !== 'number' || typeof cy !== 'number') return <g key={`dot-${index}`} />;
    return (
      <g key={`dot-${index}`}>
        <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.22} />
        <circle cx={cx} cy={cy} r={3} fill={color} stroke="#1c1c1e" strokeWidth={1.5} />
      </g>
    );
  };
  return EndDot;
};

const SparkArea: React.FC<{ data: TrendPoint[]; color: string; gradientId: string }> = ({ data, color, gradientId }) => {
  const { t } = useI18n();
  const safeData = data.length >= 2 ? data : makeFallbackTrend(data[0]?.value ?? 0, null, t('shell.commandDashboard.now'), t);

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
      <AreaChart data={safeData} margin={{ top: 7, right: 7, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="70%" stopColor={color} stopOpacity={0.06} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={`url(#${gradientId})`}
          strokeWidth={2}
          strokeLinecap="round"
          dot={makeEndDot(safeData.length, color)}
          activeDot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const metricTints: Record<'cash' | 'networth' | 'passive', Tint> = { cash: 'green', networth: 'cyan', passive: 'orange' };
type MetricTone = keyof typeof metricTints;

const MetricCard: React.FC<{
  title: string;
  value: number;
  format: (value: number) => string;
  caption: string;
  delta?: string | null;
  trendPositive?: boolean;
  icon: React.ReactNode;
  trend: TrendPoint[];
  tone: MetricTone;
  gradientId: string;
  onClick?: () => void;
}> = ({ title, value, format, caption, delta, trendPositive = true, icon, trend, tone, gradientId, onClick }) => {
  const tint = TINTS[metricTints[tone]];
  return (
    <motion.div
      variants={riseIn}
      className={`surface-card relative min-h-[184px] overflow-hidden p-5 ${
        onClick ? 'surface-interactive cursor-pointer hover:-translate-y-0.5 hover:border-white/[0.14]' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={onClick ? `${title} details` : undefined}
    >
      <div aria-hidden className={`pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-3xl ${tint.glow}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{title}</p>
          <p className="mt-1 text-[28px] font-bold leading-[34px] tracking-[-0.022em] text-white [font-family:var(--font-display)]">
            <AnimatedNumber value={value} format={format} />
          </p>
        </div>
        <Medallion tint={metricTints[tone]} size="sm">{icon}</Medallion>
      </div>
      <div className="relative mt-1.5 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-slate-400">{caption}</p>
        {delta && (
          <span className={`num shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${trendPositive ? `${tint.soft} ${tint.text}` : `${TINTS.red.soft} ${TINTS.red.text}`}`}>
            {delta}
          </span>
        )}
      </div>
      <div className="relative -mx-1 mt-3 h-14">
        <SparkArea data={trend} color={trendPositive ? tint.hex : TINTS.red.hex} gradientId={gradientId} />
      </div>
    </motion.div>
  );
};

/** A thin rounded meter whose fill springs to its value (a cross-fade under reduced motion). */
const MeterFill: React.FC<{ progress: number; color: string }> = ({ progress, color }) => {
  const reduce = useReducedMotionConfig();
  const width = `${clamp(progress, 0, 100)}%`;
  const style = { background: `linear-gradient(90deg, ${color}cc, ${color})` };
  if (MOTION_DISABLED) return <div className="h-full rounded-full" style={{ ...style, width }} />;
  return (
    <motion.div
      className="h-full rounded-full"
      style={style}
      initial={reduce ? false : { width: '0%' }}
      animate={{ width }}
      transition={reduce ? { duration: 0 } : { ...springs.settle, delay: 0.15 }}
    />
  );
};

const ProgressRow: React.FC<{
  label: string;
  valueLabel: string;
  progress: number;
  icon: React.ReactNode;
  tone: 'emerald' | 'cyan' | 'amber' | 'rose';
}> = ({ label, valueLabel, progress, icon, tone }) => {
  const tint: Tint = { emerald: 'green', cyan: 'cyan', amber: 'orange', rose: 'red' }[tone] as Tint;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-slate-200">
          <Medallion tint={tint} size="sm">{icon}</Medallion>
          <span className="leading-[18px]">{label}</span>
        </span>
        <span className="num shrink-0 font-semibold text-white">{valueLabel}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgb(118_118_128/0.24)]">
        <MeterFill progress={progress} color={TINTS[tint].hex} />
      </div>
    </div>
  );
};

const getActionTone = (actionId: MonthlyActionId): { icon: React.ReactNode; tint: Tint } => {
  switch (actionId) {
    case 'OVERTIME':
      return { icon: <Banknote size={19} />, tint: 'green' };
    case 'NETWORK':
      return { icon: <Handshake size={19} />, tint: 'cyan' };
    case 'TRAINING':
      return { icon: <GraduationCap size={19} />, tint: 'orange' };
    case 'HUSTLE_SPRINT':
      return { icon: <Zap size={19} />, tint: 'purple' };
    case 'RECOVER':
      return { icon: <HeartPulse size={19} />, tint: 'pink' };
    default:
      return { icon: <Zap size={19} />, tint: 'gray' };
  }
};

type MonthlyActionCardData = MonthlyActionsSummary['actions'][number];

/** A monthly action as a tactile tile: tinted medallion, title, effect, cost. */
const ActionTile: React.FC<{ action: MonthlyActionCardData; onUse: (id: MonthlyActionId) => void }> = ({ action, onUse }) => {
  const tone = getActionTone(action.id);
  return (
    <motion.button
      variants={riseIn}
      type="button"
      onClick={() => onUse(action.id)}
      disabled={action.disabled}
      className={`relative flex w-full items-start gap-3.5 rounded-[18px] border border-white/[0.07] bg-white/[0.045] p-4 text-left ${
        action.disabled
          ? 'cursor-not-allowed opacity-50'
          : 'surface-interactive hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-white/[0.075]'
      }`}
    >
      <Medallion tint={action.disabled ? 'gray' : tone.tint}>{tone.icon}</Medallion>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-5 tracking-[-0.01em] text-white">{action.title}</span>
        <span className="mt-0.5 block text-[13px] leading-[18px] text-slate-300">{action.subtitle}</span>
        <span className={`mt-1.5 block text-xs leading-4 ${action.disabled ? 'text-slate-500' : 'text-slate-400'}`}>
          {action.disabledReason || action.details}
        </span>
      </span>
    </motion.button>
  );
};

/** How many of the month's actions are left, as a row of lit pips. */
const ActionPips: React.FC<{ remaining: number; max: number }> = ({ remaining, max }) => (
  <span aria-hidden className="flex shrink-0 items-center gap-1.5 pt-1.5">
    {Array.from({ length: Math.max(0, Math.min(max, 8)) }, (_, index) => (
      <span
        key={index}
        className={`h-2 w-5 rounded-full transition-colors duration-500 ${index < remaining ? 'bg-[#30d158] shadow-[0_0_10px_rgb(48_209_88/0.45)]' : 'bg-[rgb(118_118_128/0.28)]'}`}
      />
    ))}
  </span>
);

const getAdvisorRecommendation = (
  props: Pick<CommandDashboardProps, 'cashValue' | 'expenseValue' | 'passiveValue' | 'freedomIncome' | 'freedomTarget' | 'monthlyActions' | 'gameState' | 'isProcessing'>,
  t: Translate
): AdvisorRecommendation => {
  const { cashValue, expenseValue, passiveValue, monthlyActions, gameState, isProcessing } = props;
  const freedomIncome = props.freedomIncome ?? passiveValue;
  const safetyMonths = expenseValue > 0 ? cashValue / expenseValue : 12;
  const readyQuestCount = gameState.quests?.readyToClaim?.length ?? 0;
  const enabledActions = monthlyActions.actions.filter((action) => !action.disabled);
  const actionById = (id: MonthlyActionId) => enabledActions.find((action) => action.id === id);
  const creditCardDebt = (gameState.liabilities || [])
    .filter((liability) => liability.type === 'CREDIT_CARD')
    .reduce((sum, liability) => sum + liability.balance, 0);
  const aiRisk = gameState.aiDisruption?.affectedIndustries?.[gameState.career?.path || 'TECH']?.automationRisk || 'LOW';
  const energy = gameState.stats?.energy ?? 60;
  const stress = gameState.stats?.stress ?? 35;
  const health = gameState.stats?.health ?? 70;
  const freedomTarget = Math.max(1, props.freedomTarget ?? expenseValue * 1.1);
  const passiveCoverage = freedomIncome / freedomTarget;

  if (gameState.pendingScenario) {
    return {
      label: t('shell.commandDashboard.event'),
      title: t('shell.commandDashboard.resolve_the_current_event_first'),
      body: t('shell.commandDashboard.a_life_event_is_waiting'),
      impact: t('shell.commandDashboard.prevents_hidden_penalties'),
      cta: t('shell.commandDashboard.event_open'),
      icon: <AlertTriangle size={22} />,
      action: { type: 'none' },
      disabled: true
    };
  }

  if (readyQuestCount > 0) {
    return {
      label: t('shell.commandDashboard.reward'),
      title: t('shell.commandDashboard.claim_your_completed_goal'),
      body: `${readyQuestCount} quest reward is ready. Claiming it converts progress into cash, stats, or credit momentum.`,
      impact: t('shell.commandDashboard.immediate_upgrade'),
      cta: t('shell.commandDashboard.open_goals'),
      icon: <CheckCircle2 size={22} />,
      action: { type: 'goals' },
      disabled: isProcessing
    };
  }

  if ((energy < 35 || stress > 75 || health < 45) && actionById('RECOVER')) {
    return {
      label: t('shell.commandDashboard.recovery'),
      title: t('shell.commandDashboard.protect_your_action_economy'),
      body: t('shell.commandDashboard.low_energy_or_high_stress'),
      impact: '+Energy, -stress, +health',
      cta: t('shell.commandDashboard.use_recover'),
      icon: <HeartPulse size={22} />,
      action: { type: 'monthly', actionId: 'RECOVER' },
      disabled: isProcessing
    };
  }

  if (creditCardDebt > 0 && cashValue > Math.max(500, expenseValue)) {
    return {
      label: t('shell.commandDashboard.debt'),
      title: t('shell.commandDashboard.attack_high_interest_balances'),
      body: t('shell.commandDashboard.credit_card_debt_creates_drag'),
      impact: t('shell.commandDashboard.improves_credit_path'),
      cta: t('shell.commandDashboard.go_to_bank'),
      icon: <CreditCard size={22} />,
      action: { type: 'navigate', path: '/money' },
      disabled: isProcessing
    };
  }

  if (safetyMonths < 2 && actionById('OVERTIME')) {
    return {
      label: t('shell.commandDashboard.runway'),
      title: t('shell.commandDashboard.build_a_two_month_safety'),
      body: t('shell.commandDashboard.cash_runway_is_thin_one'),
      impact: '+Income next month',
      cta: t('shell.commandDashboard.work_overtime'),
      icon: <ShieldCheck size={22} />,
      action: { type: 'monthly', actionId: 'OVERTIME' },
      disabled: isProcessing
    };
  }

  if (passiveCoverage < 0.55 && cashValue >= Math.max(5000, expenseValue * 3)) {
    return {
      label: t('shell.commandDashboard.freedom'),
      title: t('shell.commandDashboard.convert_idle_cash_into_income'),
      body: t('shell.commandDashboard.your_runway_is_strong_enough'),
      impact: t('shell.commandDashboard.raises_freedom_score'),
      cta: t('shell.commandDashboard.shop_investments'),
      icon: <Coins size={22} />,
      action: { type: 'navigate', path: '/money', tab: 'invest' },
      disabled: isProcessing
    };
  }

  if ((aiRisk === 'HIGH' || aiRisk === 'CRITICAL') && cashValue >= 300) {
    return {
      label: t('shell.commandDashboard.career'),
      title: t('shell.commandDashboard.future_proof_your_income'),
      body: t('shell.commandDashboard.your_career_path_has_elevated'),
      impact: t('shell.commandDashboard.reduces_disruption_risk'),
      cta: t('shell.commandDashboard.open_learn'),
      icon: <Bot size={22} />,
      action: { type: 'navigate', path: '/learn' },
      disabled: isProcessing
    };
  }

  const training = actionById('TRAINING');
  if (training) {
    return {
      label: t('shell.commandDashboard.growth'),
      title: t('shell.commandDashboard.spend_an_action_on_skill'),
      body: t('shell.commandDashboard.financial_iq_and_career_momentum'),
      impact: '+Financial IQ',
      cta: t('shell.commandDashboard.use_training'),
      icon: <LineChart size={22} />,
      action: { type: 'monthly', actionId: 'TRAINING' },
      disabled: isProcessing
    };
  }

  return {
    label: t('shell.commandDashboard.review'),
    title: t('shell.commandDashboard.pressure_test_the_money_plan'),
    body: t('shell.commandDashboard.compare_cash_flow_debt_and'),
    impact: t('shell.commandDashboard.better_next_move'),
    cta: t('shell.commandDashboard.open_money'),
    icon: <Landmark size={22} />,
    action: { type: 'navigate', path: '/money' },
    disabled: isProcessing
  };
};

const CommandDashboard: React.FC<CommandDashboardProps> = (props) => {
  const { t } = useI18n();
  const {
    cashValue,
    netWorthValue,
    passiveValue,
    expenseValue,
    formatMoney,
    freedomPercent,
    passiveTrend,
    expenseTrend,
    ratioValue,
    ratioLabel,
    passiveDelta,
    expenseDelta,
    cashSparkline,
    netWorthSparkline,
    passiveSparkline,
    monthlyActions,
    onUseMonthlyAction,
    onOpenActions,
    onNavigate,
    events,
    gameState,
    onClaimQuest,
    onOpenGoals,
    isProcessing,
    onShowToast
  } = props;

  const [focusedView, setFocusedView] = useState(!!gameState.firstSteps);
  // Re-mounts the recent-events feed each time its disclosure opens, so the timeline assembles in view.
  const [eventsOpenCount, setEventsOpenCount] = useState(0);
  const latestReport = gameState.lastMonthlyReport;
  const netCashFlow = latestReport ? latestReport.income - latestReport.expenses : null;
  const cashTrend = cashSparkline.length >= 2
    ? cashSparkline
    : makeFallbackTrend(cashValue, netCashFlow, t('shell.commandDashboard.now'), t);
  const netWorthTrend = netWorthSparkline.length >= 2
    ? netWorthSparkline
    : makeFallbackTrend(netWorthValue, latestReport?.netWorthChange ?? null, t('shell.commandDashboard.now'), t);
  const passiveTrendData = passiveSparkline.length >= 2
    ? passiveSparkline
    : passiveTrend.length >= 2
      ? passiveTrend
      : makeFallbackTrend(passiveValue, passiveDelta, t('shell.commandDashboard.now'), t);
  const expenseTrendData = expenseTrend.length >= 2
    ? expenseTrend
    : makeFallbackTrend(expenseValue, expenseDelta, t('shell.commandDashboard.now'), t);

  const netWorthDelta = getTrendDelta(netWorthTrend);
  const cashDelta = getTrendDelta(cashTrend);
  const passiveTrendDelta = getTrendDelta(passiveTrendData);

  const totalDebt = (gameState.liabilities || []).reduce((sum, liability) => sum + liability.balance, 0);
  const debtPayments = (gameState.liabilities || []).reduce((sum, liability) => sum + liability.monthlyPayment, 0);
  const incomeForRatios = Math.max(1, latestReport?.income ?? expenseValue + Math.max(0, netCashFlow ?? 0));
  const dti = debtPayments / incomeForRatios;
  const safetyMonths = expenseValue > 0 ? cashValue / expenseValue : 12;
  const creditScore = gameState.creditRating ?? 650;
  const stress = gameState.stats?.stress ?? 35;
  const energy = gameState.stats?.energy ?? 60;
  const health = gameState.stats?.health ?? 70;
  const targetPassive = Math.max(1, props.freedomTarget ?? expenseValue * 1.1);
  const freedomIncome = props.freedomIncome ?? passiveValue;
  const freedomCoverage = freedomIncome / targetPassive;
  const assetTypeCount = new Set((gameState.assets || []).map((asset) => asset.type)).size;
  const assetCount = (gameState.assets || []).reduce((sum, asset) => sum + (asset.quantity || 1), 0);

  const healthScore = Math.round(
    clamp(safetyMonths / 6, 0, 1) * 24 +
    clamp(freedomCoverage, 0, 1) * 28 +
    clamp((creditScore - 300) / 550, 0, 1) * 18 +
    clamp(1 - dti / 0.45, 0, 1) * 15 +
    clamp((energy + health + (100 - stress)) / 300, 0, 1) * 15
  );
  const healthTone = getHealthTone(healthScore, t);

  const allocationData = useMemo(() => {
    const byType = new Map<string, number>();
    (gameState.assets || []).forEach((asset) => {
      const value = Math.max(0, Math.round((asset.value || 0) * (asset.quantity || 1)));
      byType.set(asset.type, (byType.get(asset.type) || 0) + value);
    });
    return Array.from(byType.entries())
      .map(([type, value]) => ({ type: assetTypeLabel(type), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [gameState.assets]);

  const advisor = useMemo(
    () => getAdvisorRecommendation({ cashValue, expenseValue, passiveValue, freedomIncome: props.freedomIncome, freedomTarget: props.freedomTarget, monthlyActions, gameState, isProcessing }, t),
    [cashValue, expenseValue, passiveValue, props.freedomIncome, props.freedomTarget, monthlyActions, gameState, isProcessing]
  );

  const handleAdvisorAction = () => {
    if (advisor.disabled) return;
    switch (advisor.action.type) {
      case 'monthly':
        onUseMonthlyAction(advisor.action.actionId);
        onShowToast?.('Advisor action used', advisor.title, 'success');
        break;
      case 'navigate':
        onNavigate(advisor.action.path, advisor.action.tab);
        break;
      case 'goals':
        onOpenGoals();
        break;
      case 'drawer':
        onOpenActions();
        break;
      default:
        break;
    }
  };

  const barColors = ['#30d158', '#64d2ff', '#ff9f0a', '#bf5af2', '#ff375f', '#8e8e93'];
  const quickRoutes: { label: string; title: string; detail: string; icon: React.ReactNode; tint: Tint; onClick: () => void }[] = [
    {
      label: t('shell.commandDashboard.money'),
      title: cashValue >= expenseValue * 3 ? t('shell.commandDashboard.deploy_excess_cash') : t('shell.commandDashboard.build_the_buffer'),
      detail: `${formatMoney(cashValue)} available`,
      icon: <Coins size={19} />,
      tint: 'green',
      onClick: () => onNavigate('/money', 'invest')
    },
    {
      label: t('shell.commandDashboard.career'),
      title: t('shell.commandDashboard.grow_earned_income'),
      detail: gameState.career?.title || 'Career path',
      icon: <BriefcaseBusiness size={19} />,
      tint: 'blue',
      onClick: () => onNavigate('/career')
    },
    {
      label: t('shell.commandDashboard.learn'),
      title: t('shell.commandDashboard.buy_future_leverage'),
      detail: `Financial IQ ${Math.round(gameState.stats?.financialIQ ?? 0)}`,
      icon: <GraduationCap size={19} />,
      tint: 'orange',
      onClick: () => onNavigate('/learn')
    },
    {
      label: t('shell.commandDashboard.life'),
      title: stress > 65 ? t('shell.commandDashboard.reduce_pressure') : t('shell.commandDashboard.protect_capacity'),
      detail: `Energy ${Math.round(energy)} / Stress ${Math.round(stress)}`,
      icon: <HeartPulse size={19} />,
      tint: 'pink',
      onClick: () => onNavigate('/life', stress > 65 ? 'lifestyle' : 'sidehustles')
    }
  ];

  const formatMonthly = (value: number) => `${formatMoney(value)}/mo`;

  const viewToggle = (
    <button
      type="button"
      onClick={() => setFocusedView(!focusedView)}
      className="ds-button ds-button--secondary ds-button--sm gap-1.5 px-3.5"
    >
      {focusedView ? <LayoutDashboard size={15} aria-hidden /> : <LayoutList size={15} aria-hidden />}
      {focusedView ? t('shell.commandDashboard.open_full_dashboard') : t('shell.commandDashboard.use_simple_view')}
    </button>
  );

  // Both views assemble with a short stagger; switching views swaps instantly and the new one rises in
  // (no exit wait). Under Vitest everything renders in its final state.
  const viewMotion = {
    variants: stagger(0.05),
    initial: MOTION_DISABLED ? (false as const) : 'hidden',
    animate: 'show'
  };

  if (focusedView) {
    const simpleActions = monthlyActions.actions.filter(a => a.id !== 'HUSTLE_SPRINT' || gameState.activeSideHustles.length > 0);
    const heroMetrics: { label: string; value: number; format: (value: number) => string; tint: Tint; icon: React.ReactNode }[] = [
      { label: t('shell.commandDashboard.cash'), value: cashValue, format: formatMoney, tint: 'green', icon: <Wallet size={13} /> },
      { label: t('shell.commandDashboard.net_worth'), value: netWorthValue, format: formatMoney, tint: 'cyan', icon: <LineChart size={13} /> },
      { label: t('shell.commandDashboard.passive_income'), value: passiveValue, format: formatMonthly, tint: 'orange', icon: <Coins size={13} /> }
    ];

    return (
      <motion.div key="simple" className="space-y-4" {...viewMotion}>
        {props.firstSteps && <motion.div variants={riseIn} className="space-y-4">{props.firstSteps}</motion.div>}

        {/* Summary: freedom coverage as a ring, then the three figures that move every month. */}
        <motion.section variants={riseIn} className="surface relative overflow-hidden p-5 sm:p-6">
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-28 h-72 w-72 rounded-full bg-[#30d158]/[0.09] blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[#64d2ff]/[0.06] blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-0">
            <div className="flex items-center gap-4 lg:w-[44%] lg:shrink-0 lg:pr-6">
              <ActivityRing progress={freedomPercent} size={92} stroke={11} colors={['#30d158', '#64d2ff']}>
                <AnimatedNumber value={ratioValue} format={(v) => `${Math.round(v)}%`} flash={false} className="text-[19px] font-bold tracking-[-0.02em] text-white" />
              </ActivityRing>
              <div className="min-w-0">
                <p className="eyebrow">{t('shell.commandDashboard.passive_coverage')}</p>
                <p className="mt-0.5 text-[24px] font-bold leading-[30px] tracking-[-0.02em] text-white [font-family:var(--font-display)]">
                  <AnimatedNumber value={freedomIncome} format={formatMonthly} />
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{t('shell.commandDashboard.freedom_target', { target: formatMoney(targetPassive), ratio: ratioLabel })}</p>
                {props.pace && <FreedomPaceLine pace={props.pace} className="mt-1 text-xs font-semibold" />}
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-white/[0.07] pt-4 lg:flex-1 lg:border-l lg:border-t-0 lg:pl-2 lg:pt-0">
              {heroMetrics.map((metric, index) => (
                <div key={metric.label} className={`flex min-w-0 flex-col justify-between px-2.5 sm:px-3 ${index === 0 ? 'pl-0 lg:pl-4' : 'border-l border-white/[0.07]'}`}>
                  <p className="flex items-center gap-1.5 text-xs font-medium leading-4 text-slate-400 sm:text-[13px] sm:leading-[18px]">
                    <span aria-hidden className={`hidden sm:inline ${TINTS[metric.tint].text}`}>{metric.icon}</span>{metric.label}
                  </p>
                  <p className="mt-1 truncate text-[20px] font-bold leading-7 tracking-[-0.02em] text-white sm:text-[24px] [font-family:var(--font-display)]">
                    <AnimatedNumber value={metric.value} format={metric.format} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* This month's actions as tactile tiles. */}
        <motion.section variants={riseIn} className="surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[20px] font-semibold leading-[25px] tracking-[-0.017em] text-white [font-family:var(--font-display)]">{t('shell.commandDashboard.shape_this_month')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('shell.commandDashboard.actions_left', { remaining: monthlyActions.remaining, max: monthlyActions.max })}</p>
            </div>
            <ActionPips remaining={monthlyActions.remaining} max={monthlyActions.max} />
          </div>
          <motion.div variants={stagger(0.04)} className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {simpleActions.map(action => <ActionTile key={action.id} action={action} onUse={onUseMonthlyAction} />)}
          </motion.div>
        </motion.section>

        {gameState.firstSteps?.reviewed && (
          <motion.section variants={riseIn} className="surface p-5 sm:p-6">
            <h2 className="mb-3 text-[20px] font-semibold leading-[25px] tracking-[-0.017em] text-white [font-family:var(--font-display)]">{t('track.title')}</h2>
            <NextBestStep gameState={gameState} isProcessing={isProcessing} onClaimQuest={onClaimQuest} onOpenGoals={onOpenGoals} />
          </motion.section>
        )}

        <motion.div variants={riseIn}>
          <details
            className="group surface overflow-hidden"
            onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open) setEventsOpenCount(count => count + 1); }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors duration-200 select-none hover:bg-white/[0.03] sm:px-6 [&::-webkit-details-marker]:hidden">
              <Medallion tint="blue" size="sm"><History size={15} /></Medallion>
              <span className="min-w-0 flex-1 text-[15px] font-semibold text-white">{t('shell.commandDashboard.recent_decisions_and_events')}</span>
              {events.length > 0 && <span className="ds-badge ds-badge--neutral num">{Math.min(events.length, 3)}</span>}
              <ChevronRight size={18} aria-hidden className="shrink-0 text-slate-500 transition-transform duration-[530ms] ease-spring group-open:rotate-90" />
            </summary>
            <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 sm:px-6">
              <EventFeed key={eventsOpenCount} events={events} limit={3} />
            </div>
          </details>
        </motion.div>

        <motion.div variants={riseIn} className="flex justify-end pt-1">{viewToggle}</motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div key="full" className="space-y-5" {...viewMotion}>
      {props.firstSteps && <motion.div variants={riseIn} className="space-y-4">{props.firstSteps}</motion.div>}
      <motion.div variants={riseIn} className="flex justify-end">{viewToggle}</motion.div>

      <motion.section variants={riseIn} className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        {/* Hero: one large title and the health score as a ring. */}
        <div className="surface relative overflow-hidden p-6">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[#30d158]/[0.08] blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="eyebrow">{t('shell.commandDashboard.command_center')}</span>
                <span className={`ds-badge ${healthTone.badge}`}>{healthTone.label}</span>
              </div>
              <h2 className="t-large-title mt-2 text-white [text-wrap:balance] md:text-[40px] md:leading-[46px]">{t('shell.commandDashboard.make_the_next_month_count')}</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-400">
                {t('shell.commandDashboard.goal_sentence', { target: formatMoney(targetPassive), ratio: ratioLabel, remaining: monthlyActions.remaining, max: monthlyActions.max })}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-2 self-center">
              <ActivityRing progress={healthScore / 100} size={132} stroke={13} colors={healthTone.ring}>
                <AnimatedNumber value={healthScore} format={(v) => `${Math.round(v)}`} className="text-[34px] font-bold leading-none tracking-[-0.03em] text-white [font-family:var(--font-display)]" />
                <span className="mt-1 text-xs text-slate-500">/ 100</span>
              </ActivityRing>
              <p className="eyebrow">{t('shell.commandDashboard.health_score')}</p>
            </div>
          </div>
        </div>

        {/* The one prominent recommendation. */}
        <div className="surface relative overflow-hidden p-6">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#30d158]/[0.13] blur-3xl" />
          <motion.div
            key={advisor.title}
            className="relative flex h-full flex-col"
            initial={MOTION_DISABLED ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.smooth}
          >
            <div className="flex items-center gap-3">
              <Medallion tint="green" size="lg">{advisor.icon}</Medallion>
              <p className={`eyebrow ${TINTS.green.text}`}>{advisor.label} Advisor</p>
            </div>
            <h3 className="mt-4 text-[20px] font-semibold leading-[25px] tracking-[-0.017em] text-white [font-family:var(--font-display)]">{advisor.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{advisor.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="chip text-xs text-slate-200">{advisor.impact}</span>
              {advisor.caution && <span className="ds-badge ds-badge--med">{advisor.caution}</span>}
            </div>
            <div className="mt-auto pt-5">
              <button
                type="button"
                onClick={handleAdvisorAction}
                disabled={advisor.disabled}
                className="btn-primary ds-button--md group/cta"
              >
                {advisor.cta}
                <ArrowRight size={16} aria-hidden className="transition-transform duration-300 ease-spring group-hover/cta:translate-x-0.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section variants={stagger(0.05)} className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          title={t('shell.commandDashboard.cash')}
          value={cashValue}
          format={formatMoney}
          caption={`${safetyMonths >= 12 ? '12+' : safetyMonths.toFixed(1)} months runway`}
          delta={formatSignedMoney(cashDelta, formatMoney)}
          trendPositive={(cashDelta ?? 0) >= 0}
          icon={<Wallet size={15} />}
          trend={cashTrend}
          tone="cash"
          gradientId="cash-command-gradient"
          onClick={props.onOpenDetail ? () => props.onOpenDetail!('cashFlow') : undefined}
        />
        <MetricCard
          title={t('shell.commandDashboard.net_worth')}
          value={netWorthValue}
          format={formatMoney}
          caption={`${assetCount} assets, ${formatMoney(totalDebt)} debt`}
          delta={formatSignedMoney(netWorthDelta, formatMoney)}
          trendPositive={(netWorthDelta ?? 0) >= 0}
          icon={<LineChart size={15} />}
          trend={netWorthTrend}
          tone="networth"
          gradientId="networth-command-gradient"
          onClick={props.onOpenDetail ? () => props.onOpenDetail!('netWorth') : undefined}
        />
        <MetricCard
          title={t('shell.commandDashboard.passive_income')}
          value={passiveValue}
          format={formatMonthly}
          caption={`${compactPercent(ratioValue)} of expenses`}
          delta={formatSignedMoney(passiveTrendDelta, formatMoney)}
          trendPositive={(passiveTrendDelta ?? 0) >= 0}
          icon={<Coins size={15} />}
          trend={passiveTrendData}
          tone="passive"
          gradientId="passive-command-gradient"
          onClick={props.onOpenDetail ? () => props.onOpenDetail!('cashFlow') : undefined}
        />
      </motion.section>

      {/* Quick routes: interactive cards from tablet up; on a phone they join into one inset grouped list. */}
      <motion.section variants={stagger(0.04)} className="grid md:grid-cols-2 md:gap-3 xl:grid-cols-4">
        {quickRoutes.map((route) => (
          <motion.button
            key={route.label}
            variants={riseIn}
            type="button"
            onClick={route.onClick}
            className="surface-card surface-interactive group flex items-center gap-3.5 p-4 text-left hover:-translate-y-0.5 hover:border-white/[0.14] max-md:rounded-none max-md:py-3 max-md:shadow-none max-md:first:rounded-t-[20px] max-md:last:rounded-b-[20px] max-md:[&:not(:first-child)]:-mt-px max-md:hover:translate-y-0"
          >
            <Medallion tint={route.tint}>{route.icon}</Medallion>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-slate-400">{route.label}</span>
              <span className="mt-0.5 block text-[15px] font-semibold leading-5 tracking-[-0.01em] text-white">{route.title}</span>
              <span className="num mt-0.5 block truncate text-xs text-slate-500">{route.detail}</span>
            </span>
            <ChevronRight size={17} aria-hidden className="shrink-0 text-slate-600 transition-transform duration-300 ease-spring group-hover:translate-x-0.5 group-hover:text-slate-400" />
          </motion.button>
        ))}
      </motion.section>

      <motion.section variants={riseIn} className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div className="surface p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="eyebrow">{t('shell.commandDashboard.monthly_actions')}</p>
                <h3 className="mt-0.5 text-[20px] font-semibold leading-[25px] tracking-[-0.017em] text-white [font-family:var(--font-display)]">{t('shell.commandDashboard.spend_time_where_it_compounds')}</h3>
                <p className="mt-1 text-sm text-slate-400">{monthlyActions.reason}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 self-start">
                <ActionPips remaining={monthlyActions.remaining} max={monthlyActions.max} />
                <button
                  type="button"
                  onClick={onOpenActions}
                  className="ds-button ds-button--ghost ds-button--sm"
                >{t('shell.commandDashboard.view_all')}
                  <ChevronRight size={15} aria-hidden />
                </button>
              </div>
            </div>

            <motion.div variants={stagger(0.04)} className="mt-4 grid gap-2.5 md:grid-cols-2">
              {monthlyActions.actions.map((action) => (
                <ActionTile key={action.id} action={action} onUse={onUseMonthlyAction} />
              ))}
            </motion.div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface p-5 sm:p-6">
              <SectionHeader
                eyebrow={t('shell.commandDashboard.milestones')}
                title={t('shell.commandDashboard.freedom_path')}
                accessory={<Medallion tint="green" size="sm"><Target size={15} /></Medallion>}
              />
              <div className="mt-5 space-y-5">
                <ProgressRow
                  label={t('shell.commandDashboard.safety_runway')}
                  valueLabel={`${safetyMonths >= 12 ? '12+' : safetyMonths.toFixed(1)} mo`}
                  progress={(safetyMonths / 6) * 100}
                  icon={<ShieldCheck size={14} />}
                  tone={safetyMonths >= 3 ? 'emerald' : safetyMonths >= 1.5 ? 'amber' : 'rose'}
                />
                <div>
                  <ProgressRow
                    label={t('shell.commandDashboard.passive_coverage')}
                    valueLabel={`${formatMoney(freedomIncome)} / ${formatMoney(targetPassive)}`}
                    progress={freedomPercent * 100}
                    icon={<Coins size={14} />}
                    tone={freedomPercent >= 0.7 ? 'emerald' : 'cyan'}
                  />
                  {props.pace && <FreedomPaceLine pace={props.pace} className="mt-2 text-xs" />}
                </div>
                <ProgressRow
                  label={t('shell.commandDashboard.diversification')}
                  valueLabel={`${assetTypeCount} / 4 types`}
                  progress={(assetTypeCount / 4) * 100}
                  icon={<Landmark size={14} />}
                  tone={assetTypeCount >= 3 ? 'emerald' : 'amber'}
                />
                <ProgressRow
                  label={t('shell.commandDashboard.credit_quality')}
                  valueLabel={`${creditScore}`}
                  progress={((creditScore - 300) / 550) * 100}
                  icon={<CreditCard size={14} />}
                  tone={creditScore >= 700 ? 'emerald' : creditScore >= 620 ? 'amber' : 'rose'}
                />
              </div>
            </div>

            <div className="surface flex flex-col p-5 sm:p-6">
              <SectionHeader
                eyebrow={t('shell.commandDashboard.portfolio')}
                title={t('shell.commandDashboard.allocation')}
                accessory={<Medallion tint="cyan" size="sm"><PieChart size={15} /></Medallion>}
              />
              <div className="mt-4 h-56 flex-1">
                {allocationData.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-white/[0.035] p-5 text-center">
                    <Medallion tint="gray" size="lg"><PieChart size={20} /></Medallion>
                    <p className="max-w-[240px] text-sm leading-5 text-slate-400">{t('shell.commandDashboard.buy_your_first_income_or')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <BarChart data={allocationData} layout="vertical" margin={{ top: 6, right: 8, bottom: 6, left: 0 }} barCategoryGap="22%">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="type" width={96} tick={axisTick} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                        {...chartTooltip}
                        formatter={(value: number) => [formatMoney(value), 'Value']}
                      />
                      <Bar dataKey="value" radius={[0, 7, 7, 0]} maxBarSize={18}>
                        {allocationData.map((entry, index) => (
                          <Cell key={entry.type} fill={barColors[index % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="surface p-5 sm:p-6">
            <SectionHeader
              eyebrow={t('shell.commandDashboard.cash_flow')}
              title={t('shell.commandDashboard.income_vs_expenses')}
              accessory={(netCashFlow ?? 0) >= 0 ? (
                <Medallion tint="green" size="sm"><TrendingUp size={15} /></Medallion>
              ) : (
                <Medallion tint="red" size="sm"><TrendingDown size={15} /></Medallion>
              )}
            />
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <AreaChart data={expenseTrendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="expense-command-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff453a" stopOpacity={0.16} />
                      <stop offset="55%" stopColor="#ff453a" stopOpacity={0.02} />
                      <stop offset="100%" stopColor="#ff453a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} tickMargin={8} />
                  <YAxis hide />
                  <RechartsTooltip
                    cursor={{ stroke: 'rgba(255, 255, 255, 0.16)', strokeWidth: 1 }}
                    {...chartTooltip}
                    formatter={(value: number) => [formatMoney(value), t('shell.commandDashboard.expenses')]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ff453a"
                    fill="url(#expense-command-gradient)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    activeDot={{ r: 4, fill: '#ff453a', stroke: '#1c1c1e', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="surface p-5 sm:p-6">
            <SectionHeader
              eyebrow={t('shell.commandDashboard.signals')}
              title={t('shell.commandDashboard.risk_cockpit')}
              accessory={<ActivityDot active={!gameState.pendingScenario && !gameState.isBankrupt} />}
            />
            <div className="list-group mt-4">
              <SignalRow icon={<CreditCard size={14} />} tint="green" label={t('shell.commandDashboard.credit_score')} value={`${creditScore}`} valueClass={getCreditTone(creditScore)} />
              <SignalRow icon={<Landmark size={14} />} tint="blue" label={t('shell.commandDashboard.debt_to_income')} value={`${Math.round(dti * 100)}%`} valueClass={dti <= 0.28 ? TINTS.green.text : dti <= 0.43 ? TINTS.orange.text : TINTS.red.text} />
              <SignalRow icon={<HeartPulse size={14} />} tint="pink" label={t('shell.commandDashboard.stress_energy')} value={`${Math.round(stress)} / ${Math.round(energy)}`} valueClass={stress <= 55 && energy >= 45 ? TINTS.green.text : TINTS.orange.text} />
              <SignalRow icon={<Flame size={14} />} tint="orange" label={t('shell.commandDashboard.monthly_burn')} value={formatMoney(expenseValue)} valueClass="text-white" />
            </div>
          </div>

          <div className="surface p-5 sm:p-6">
            <div className="mb-4">
              <p className="eyebrow">{t('shell.commandDashboard.goals')}</p>
              <h3 className="mt-0.5 text-[19px] font-semibold leading-6 tracking-[-0.016em] text-white">{t('track.title')}</h3>
            </div>
            <NextBestStep
              gameState={gameState}
              isProcessing={isProcessing}
              onClaimQuest={onClaimQuest}
              onOpenGoals={onOpenGoals}
            />
          </div>

          <div className="surface p-5 sm:p-6">
            <div className="mb-4">
              <SectionHeader
                eyebrow={t('shell.commandDashboard.timeline')}
                title={t('shell.commandDashboard.recent_events')}
                accessory={<span className="ds-badge ds-badge--neutral num mt-1">{events.length}</span>}
              />
            </div>
            <EventFeed events={events} limit={5} />
          </div>
        </aside>
      </motion.section>
    </motion.div>
  );
};

/** One row of the risk cockpit's inset grouped list. */
const SignalRow: React.FC<{ label: string; value: string; valueClass: string; icon: React.ReactNode; tint: Tint }> = ({ label, value, valueClass, icon, tint }) => (
  <div className="list-row min-h-[46px] text-sm">
    <Medallion tint={tint} size="sm">{icon}</Medallion>
    <span className="min-w-0 flex-1 truncate text-slate-200">{label}</span>
    <span className={`num shrink-0 font-semibold ${valueClass}`}>{value}</span>
  </div>
);

const ActivityDot: React.FC<{ active: boolean }> = ({ active }) => {
  const { t } = useI18n();
  return (
    <span className={`ds-badge mt-1 shrink-0 gap-1.5 px-2.5 py-1 ${active ? 'ds-badge--low' : 'ds-badge--med'}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#30d158] shadow-[0_0_6px_#30d158]' : 'bg-[#ff9f0a]'}`} />
      {active ? t('shell.commandDashboard.live') : t('shell.commandDashboard.blocked')}
    </span>
  );
};

export default CommandDashboard;
