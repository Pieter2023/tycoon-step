import { useI18n, type Translate } from '../../i18n';
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
	  AlertTriangle,
	  ArrowRight,
	  Banknote,
	  Bot,
	  BriefcaseBusiness,
	  CheckCircle2,
	  Coins,
	  CreditCard,
	  GraduationCap,
	  Gauge,
	  HeartPulse,
  Landmark,
  LineChart,
  ShieldCheck,
  Sparkles,
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
import { FINANCIAL_FREEDOM_TARGET_MULTIPLIER } from '../../constants';
import { AssetType, GameState, LifeEvent, MonthlyActionId } from '../../types';
import { MonthlyActionsSummary } from '../../services/monthlyActions';
import EventFeed from './EventFeed';
import NextBestStep from './NextBestStep';

type TrendPoint = { label: string; value: number };

type CommandDashboardProps = {
  firstSteps?: React.ReactNode;
  cashValue: number;
  netWorthValue: number;
  passiveValue: number;
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
  if (score >= 760) return 'text-emerald-300';
  if (score >= 680) return 'text-cyan-300';
  if (score >= 620) return 'text-amber-300';
  return 'text-rose-300';
};

const getHealthTone = (score: number, t: Translate) => {
  if (score >= 80) return { label: t('shell.commandDashboard.excellent'), className: 'text-emerald-300', bar: 'bg-emerald-400' };
  if (score >= 62) return { label: t('shell.commandDashboard.stable'), className: 'text-cyan-300', bar: 'bg-cyan-400' };
  if (score >= 45) return { label: t('shell.commandDashboard.watch'), className: 'text-amber-300', bar: 'bg-amber-400' };
  return { label: t('shell.commandDashboard.at_risk'), className: 'text-rose-300', bar: 'bg-rose-400' };
};

const assetTypeLabel = (type: AssetType | string) => String(type).replace(/_/g, ' ');

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

const SparkArea: React.FC<{ data: TrendPoint[]; color: string; gradientId: string }> = ({ data, color, gradientId }) => {
  const { t } = useI18n();
  const safeData = data.length >= 2 ? data : makeFallbackTrend(data[0]?.value ?? 0, null, t('shell.commandDashboard.now'), t);

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
      <AreaChart data={safeData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.34} />
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
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const metricToneClasses = {
  cash: {
    frame: 'border-emerald-500/20 bg-emerald-500/10',
    icon: 'bg-emerald-500/15 text-emerald-300',
    deltaPositive: 'text-emerald-300',
    deltaNegative: 'text-rose-300',
    chart: '#34d399'
  },
  networth: {
    frame: 'border-cyan-500/20 bg-cyan-500/10',
    icon: 'bg-cyan-500/15 text-cyan-300',
    deltaPositive: 'text-cyan-300',
    deltaNegative: 'text-rose-300',
    chart: '#22d3ee'
  },
  passive: {
    frame: 'border-amber-500/20 bg-amber-500/10',
    icon: 'bg-amber-500/15 text-amber-300',
    deltaPositive: 'text-amber-200',
    deltaNegative: 'text-rose-300',
    chart: '#f59e0b'
  }
};

type MetricTone = keyof typeof metricToneClasses;

const MetricCard: React.FC<{
  title: string;
  value: string;
  caption: string;
  delta?: string | null;
  trendPositive?: boolean;
  icon: React.ReactNode;
  trend: TrendPoint[];
  tone: MetricTone;
  gradientId: string;
  onClick?: () => void;
}> = ({ title, value, caption, delta, trendPositive = true, icon, trend, tone, gradientId, onClick }) => {
  const { t } = useI18n();
  const classes = metricToneClasses[tone];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`tycoon-card min-h-[178px] p-4 ${classes.frame} ${onClick ? 'cursor-pointer' : ''}`}
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${classes.icon}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400">{caption}</p>
        {delta && (
          <p className={`text-xs font-semibold ${trendPositive ? classes.deltaPositive : classes.deltaNegative}`}>
            {delta}
          </p>
        )}
      </div>
      <div className="mt-4 h-12">
        <SparkArea data={trend} color={classes.chart} gradientId={gradientId} />
      </div>
    </motion.div>
  );
};

const ProgressRow: React.FC<{
  label: string;
  valueLabel: string;
  progress: number;
  icon: React.ReactNode;
  tone: 'emerald' | 'cyan' | 'amber' | 'rose';
}> = ({ label, valueLabel, progress, icon, tone }) => {
  const { t } = useI18n();
  const toneClasses = {
    emerald: { bar: 'bg-emerald-400', text: 'text-emerald-300' },
    cyan: { bar: 'bg-cyan-400', text: 'text-cyan-300' },
    amber: { bar: 'bg-amber-400', text: 'text-amber-300' },
    rose: { bar: 'bg-rose-400', text: 'text-rose-300' }
  }[tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className={`flex items-center gap-2 ${toneClasses.text}`}>{icon}{label}</span>
        <span className="font-semibold text-white">{valueLabel}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${toneClasses.bar}`} style={{ width: `${clamp(progress, 0, 100)}%` }} />
      </div>
    </div>
  );
};

const getActionTone = (actionId: MonthlyActionId) => {
  switch (actionId) {
    case 'OVERTIME':
      return { icon: <Banknote size={17} />, className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' };
    case 'NETWORK':
      return { icon: <Sparkles size={17} />, className: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200' };
    case 'TRAINING':
      return { icon: <LineChart size={17} />, className: 'border-amber-500/20 bg-amber-500/10 text-amber-200' };
    case 'HUSTLE_SPRINT':
      return { icon: <Zap size={17} />, className: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200' };
    case 'RECOVER':
      return { icon: <HeartPulse size={17} />, className: 'border-rose-500/20 bg-rose-500/10 text-rose-200' };
    default:
      return { icon: <Zap size={17} />, className: 'border-slate-700 bg-slate-900/70 text-slate-200' };
  }
};

const getAdvisorRecommendation = (
  props: Pick<CommandDashboardProps, 'cashValue' | 'expenseValue' | 'passiveValue' | 'monthlyActions' | 'gameState' | 'isProcessing'>,
  t: Translate
): AdvisorRecommendation => {
  const { cashValue, expenseValue, passiveValue, monthlyActions, gameState, isProcessing } = props;
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
  const freedomTarget = Math.max(1, expenseValue * FINANCIAL_FREEDOM_TARGET_MULTIPLIER);
  const passiveCoverage = passiveValue / freedomTarget;

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
  const targetPassive = Math.max(1, expenseValue * FINANCIAL_FREEDOM_TARGET_MULTIPLIER);
  const freedomCoverage = passiveValue / targetPassive;
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
    () => getAdvisorRecommendation({ cashValue, expenseValue, passiveValue, monthlyActions, gameState, isProcessing }, t),
    [cashValue, expenseValue, passiveValue, monthlyActions, gameState, isProcessing]
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

  const barColors = ['#34d399', '#22d3ee', '#f59e0b', '#a78bfa', '#fb7185', '#94a3b8'];
  const quickRoutes = [
    {
      label: t('shell.commandDashboard.money'),
      title: cashValue >= expenseValue * 3 ? t('shell.commandDashboard.deploy_excess_cash') : t('shell.commandDashboard.build_the_buffer'),
      detail: `${formatMoney(cashValue)} available`,
      icon: <Coins size={18} />,
      className: 'border-emerald-400/20 hover:border-emerald-300/70',
      iconClass: 'bg-emerald-400/15 text-emerald-300',
      onClick: () => onNavigate('/money', 'invest')
    },
    {
      label: t('shell.commandDashboard.career'),
      title: t('shell.commandDashboard.grow_earned_income'),
      detail: gameState.career?.title || 'Career path',
      icon: <BriefcaseBusiness size={18} />,
      className: 'border-cyan-400/20 hover:border-cyan-300/70',
      iconClass: 'bg-cyan-400/15 text-cyan-300',
      onClick: () => onNavigate('/career')
    },
    {
      label: t('shell.commandDashboard.learn'),
      title: t('shell.commandDashboard.buy_future_leverage'),
      detail: `Financial IQ ${Math.round(gameState.stats?.financialIQ ?? 0)}`,
      icon: <GraduationCap size={18} />,
      className: 'border-amber-400/20 hover:border-amber-300/70',
      iconClass: 'bg-amber-400/15 text-amber-300',
      onClick: () => onNavigate('/learn')
    },
    {
      label: t('shell.commandDashboard.life'),
      title: stress > 65 ? t('shell.commandDashboard.reduce_pressure') : t('shell.commandDashboard.protect_capacity'),
      detail: `Energy ${Math.round(energy)} / Stress ${Math.round(stress)}`,
      icon: <HeartPulse size={18} />,
      className: 'border-rose-400/20 hover:border-rose-300/70',
      iconClass: 'bg-rose-400/15 text-rose-300',
      onClick: () => onNavigate('/life', stress > 65 ? 'lifestyle' : 'sidehustles')
    }
  ];

  const viewToggle = <button onClick={() => setFocusedView(!focusedView)} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200">{focusedView ? t('shell.commandDashboard.open_full_dashboard') : t('shell.commandDashboard.use_simple_view')}</button>;
  if (focusedView) return <div className="space-y-4">
    {props.firstSteps}
    <div className="grid grid-cols-3 gap-2">
      {[[t('shell.commandDashboard.cash'), formatMoney(cashValue)], [t('shell.commandDashboard.net_worth'), formatMoney(netWorthValue)], [t('shell.commandDashboard.passive_income'), `${formatMoney(passiveValue)}/mo`]].map(([label,value]) => <div key={label} className="rounded-xl bg-slate-900 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-white">{value}</p></div>)}
    </div>
    <section className="tycoon-panel p-4">
      <h2 className="text-lg font-bold">{t('shell.commandDashboard.shape_this_month')}</h2>
      <p className="mt-1 text-sm text-slate-300">{t('shell.commandDashboard.actions_left', { remaining: monthlyActions.remaining, max: monthlyActions.max })}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{monthlyActions.actions.filter(a => a.id !== 'HUSTLE_SPRINT' || gameState.activeSideHustles.length > 0).map(action =>
        <button key={action.id} disabled={action.disabled} onClick={() => onUseMonthlyAction(action.id)} className="rounded-lg border border-slate-700 p-3 text-left disabled:opacity-45 hover:border-emerald-400">
          <strong className="text-sm text-white">{action.title}</strong><span className="block text-xs leading-5 text-slate-300">{action.subtitle}</span><span className="block text-xs text-slate-400">{action.disabledReason || action.details}</span>
        </button>)}</div>
    </section>
    {gameState.firstSteps?.reviewed && <section className="tycoon-panel p-4"><h2 className="mb-3 text-lg font-bold">{t('shell.commandDashboard.your_next_milestone')}</h2><NextBestStep gameState={gameState} isProcessing={isProcessing} onClaimQuest={onClaimQuest} onOpenGoals={onOpenGoals} /></section>}
    <details className="tycoon-panel p-4"><summary className="cursor-pointer text-sm font-semibold">{t('shell.commandDashboard.recent_decisions_and_events')}</summary><div className="mt-3"><EventFeed events={events} limit={3} /></div></details>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-400">{t('shell.commandDashboard.freedom_target', { target: formatMoney(targetPassive), ratio: ratioLabel })}</p>{viewToggle}</div>
  </div>;

  return (
    <div className="space-y-5">
      {props.firstSteps}
      <div className="flex justify-end">{viewToggle}</div>
      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="tycoon-panel p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="tycoon-kicker">{t('shell.commandDashboard.command_center')}</span>
                <span className={`rounded-full border border-slate-700 px-2 py-1 text-xs font-semibold ${healthTone.className}`}>
                  {healthTone.label}
                </span>
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-white md:text-4xl">{t('shell.commandDashboard.make_the_next_month_count')}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                {t('shell.commandDashboard.goal_sentence', { target: formatMoney(targetPassive), ratio: ratioLabel, remaining: monthlyActions.remaining, max: monthlyActions.max })}
              </p>
            </div>

            <div className="min-w-[220px] rounded-lg border border-slate-700/70 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t('shell.commandDashboard.health_score')}</p>
                <Gauge size={18} className={healthTone.className} />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-4xl font-bold text-white">{healthScore}</p>
                <p className="pb-1 text-sm text-slate-400">/ 100</p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${healthTone.bar}`} style={{ width: `${healthScore}%` }} />
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="tycoon-panel border-emerald-500/20 p-5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
              {advisor.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="tycoon-kicker text-emerald-300">{advisor.label} Advisor</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{advisor.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{advisor.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-slate-200">
                  {advisor.impact}
                </span>
                {advisor.caution && (
                  <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                    {advisor.caution}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAdvisorAction}
                disabled={advisor.disabled}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {advisor.cta}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          title={t('shell.commandDashboard.cash')}
          value={formatMoney(cashValue)}
          caption={`${safetyMonths >= 12 ? '12+' : safetyMonths.toFixed(1)} months runway`}
          delta={formatSignedMoney(cashDelta, formatMoney)}
          trendPositive={(cashDelta ?? 0) >= 0}
          icon={<Wallet size={18} />}
          trend={cashTrend}
          tone="cash"
          gradientId="cash-command-gradient"
          onClick={props.onOpenDetail ? () => props.onOpenDetail!('cashFlow') : undefined}
        />
        <MetricCard
          title={t('shell.commandDashboard.net_worth')}
          value={formatMoney(netWorthValue)}
          caption={`${assetCount} assets, ${formatMoney(totalDebt)} debt`}
          delta={formatSignedMoney(netWorthDelta, formatMoney)}
          trendPositive={(netWorthDelta ?? 0) >= 0}
          icon={<LineChart size={18} />}
          trend={netWorthTrend}
          tone="networth"
          gradientId="networth-command-gradient"
          onClick={props.onOpenDetail ? () => props.onOpenDetail!('netWorth') : undefined}
        />
        <MetricCard
          title={t('shell.commandDashboard.passive_income')}
          value={`${formatMoney(passiveValue)}/mo`}
          caption={`${compactPercent(ratioValue)} of expenses`}
          delta={formatSignedMoney(passiveTrendDelta, formatMoney)}
          trendPositive={(passiveTrendDelta ?? 0) >= 0}
          icon={<Coins size={18} />}
          trend={passiveTrendData}
          tone="passive"
          gradientId="passive-command-gradient"
          onClick={props.onOpenDetail ? () => props.onOpenDetail!('cashFlow') : undefined}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickRoutes.map((route) => (
          <button
            key={route.label}
            type="button"
            onClick={route.onClick}
            className={`tycoon-card flex items-center justify-between gap-4 p-4 text-left transition hover:-translate-y-0.5 ${route.className}`}
          >
            <span className="min-w-0">
              <span className="tycoon-kicker">{route.label}</span>
              <span className="mt-1 block text-sm font-bold text-white">{route.title}</span>
              <span className="mt-1 block truncate text-xs text-slate-400">{route.detail}</span>
            </span>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${route.iconClass}`}>
              {route.icon}
            </span>
          </button>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div className="tycoon-panel p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="tycoon-kicker">{t('shell.commandDashboard.monthly_actions')}</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{t('shell.commandDashboard.spend_time_where_it_compounds')}</h3>
                <p className="mt-1 text-sm text-slate-400">{monthlyActions.reason}</p>
              </div>
              <button
                type="button"
                onClick={onOpenActions}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-emerald-400/50"
              >{t('shell.commandDashboard.view_all')}
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {monthlyActions.actions.map((action) => {
                const tone = getActionTone(action.id);
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onUseMonthlyAction(action.id)}
                    disabled={action.disabled}
                    className={`min-h-[112px] rounded-lg border p-4 text-left transition ${tone.className} ${
                      action.disabled
                        ? 'cursor-not-allowed opacity-55'
                        : 'hover:-translate-y-0.5 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-slate-950/30">
                        {tone.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-white">{action.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-300">{action.subtitle}</span>
                        <span className="mt-2 block text-xs leading-5 text-slate-400">
                          {action.disabledReason || action.details}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="tycoon-panel p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="tycoon-kicker">{t('shell.commandDashboard.milestones')}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{t('shell.commandDashboard.freedom_path')}</h3>
                </div>
                <Target size={19} className="text-emerald-300" />
              </div>
              <div className="mt-5 space-y-5">
                <ProgressRow
                  label={t('shell.commandDashboard.safety_runway')}
                  valueLabel={`${safetyMonths >= 12 ? '12+' : safetyMonths.toFixed(1)} mo`}
                  progress={(safetyMonths / 6) * 100}
                  icon={<ShieldCheck size={15} />}
                  tone={safetyMonths >= 3 ? 'emerald' : safetyMonths >= 1.5 ? 'amber' : 'rose'}
                />
                <ProgressRow
                  label={t('shell.commandDashboard.passive_coverage')}
                  valueLabel={`${formatMoney(passiveValue)} / ${formatMoney(targetPassive)}`}
                  progress={freedomPercent * 100}
                  icon={<Coins size={15} />}
                  tone={freedomPercent >= 0.7 ? 'emerald' : 'cyan'}
                />
                <ProgressRow
                  label={t('shell.commandDashboard.diversification')}
                  valueLabel={`${assetTypeCount} / 4 types`}
                  progress={(assetTypeCount / 4) * 100}
                  icon={<Landmark size={15} />}
                  tone={assetTypeCount >= 3 ? 'emerald' : 'amber'}
                />
                <ProgressRow
                  label={t('shell.commandDashboard.credit_quality')}
                  valueLabel={`${creditScore}`}
                  progress={((creditScore - 300) / 550) * 100}
                  icon={<CreditCard size={15} />}
                  tone={creditScore >= 700 ? 'emerald' : creditScore >= 620 ? 'amber' : 'rose'}
                />
              </div>
            </div>

            <div className="tycoon-panel p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="tycoon-kicker">{t('shell.commandDashboard.portfolio')}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{t('shell.commandDashboard.allocation')}</h3>
                </div>
                <LineChart size={19} className="text-cyan-300" />
              </div>
              <div className="mt-4 h-56">
                {allocationData.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/30 p-4 text-center text-sm text-slate-400">{t('shell.commandDashboard.buy_your_first_income_or')}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <BarChart data={allocationData} layout="vertical" margin={{ top: 6, right: 8, bottom: 6, left: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="type" width={92} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff' }}
                        formatter={(value: number) => [formatMoney(value), 'Value']}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
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

          <div className="tycoon-panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="tycoon-kicker">{t('shell.commandDashboard.cash_flow')}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{t('shell.commandDashboard.income_vs_expenses')}</h3>
              </div>
              {(netCashFlow ?? 0) >= 0 ? (
                <TrendingUp size={19} className="text-emerald-300" />
              ) : (
                <TrendingDown size={19} className="text-rose-300" />
              )}
            </div>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <AreaChart data={expenseTrendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="expense-command-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis hide />
                  <RechartsTooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff' }}
                    formatter={(value: number) => [formatMoney(value), t('shell.commandDashboard.expenses')]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#fb7185" fill="url(#expense-command-gradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="tycoon-panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="tycoon-kicker">{t('shell.commandDashboard.signals')}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{t('shell.commandDashboard.risk_cockpit')}</h3>
              </div>
              <ActivityDot active={!gameState.pendingScenario && !gameState.isBankrupt} />
            </div>
            <div className="mt-4 space-y-3">
              <SignalRow label={t('shell.commandDashboard.credit_score')} value={`${creditScore}`} valueClass={getCreditTone(creditScore)} />
              <SignalRow label={t('shell.commandDashboard.debt_to_income')} value={`${Math.round(dti * 100)}%`} valueClass={dti <= 0.28 ? 'text-emerald-300' : dti <= 0.43 ? 'text-amber-300' : 'text-rose-300'} />
              <SignalRow label={t('shell.commandDashboard.stress_energy')} value={`${Math.round(stress)} / ${Math.round(energy)}`} valueClass={stress <= 55 && energy >= 45 ? 'text-emerald-300' : 'text-amber-300'} />
              <SignalRow label={t('shell.commandDashboard.monthly_burn')} value={formatMoney(expenseValue)} valueClass="text-slate-100" />
            </div>
          </div>

          <div className="tycoon-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="tycoon-kicker">{t('shell.commandDashboard.goals')}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{t('shell.commandDashboard.next_best_step')}</h3>
              </div>
              <button
                type="button"
                onClick={onOpenGoals}
                className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-400/50"
              >{t('shell.commandDashboard.open')}
              </button>
            </div>
            <NextBestStep
              gameState={gameState}
              isProcessing={isProcessing}
              onClaimQuest={onClaimQuest}
              onOpenGoals={onOpenGoals}
            />
          </div>

          <div className="tycoon-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="tycoon-kicker">{t('shell.commandDashboard.timeline')}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{t('shell.commandDashboard.recent_events')}</h3>
              </div>
              <span className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300">
                {events.length}
              </span>
            </div>
            <EventFeed events={events} limit={5} />
          </div>
        </aside>
      </section>
    </div>
  );
};

const SignalRow: React.FC<{ label: string; value: string; valueClass: string }> = ({ label, value, valueClass }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-2.5 text-sm">
    <span className="text-slate-400">{label}</span>
    <span className={`font-semibold ${valueClass}`}>{value}</span>
  </div>
);

const ActivityDot: React.FC<{ active: boolean }> = ({ active }) => {
  const { t } = useI18n();
  return (
  <span className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${
    active
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
  }`}>
    <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-amber-400'}`} />
    {active ? t('shell.commandDashboard.live') : t('shell.commandDashboard.blocked')}
  </span>
  );
};

export default CommandDashboard;
