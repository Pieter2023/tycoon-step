import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, GraduationCap, Heart, LineChart, Sparkles, Wallet, BookOpen, Clock, Users, Zap, HeartPulse } from 'lucide-react';
import { MonthlyActionsSummary, MonthlyActionCard } from '../../services/monthlyActions';
import { MonthlyActionId } from '../../types';
import EventFeed from './EventFeed';
import NextBestStep from './NextBestStep';
import { GameState } from '../../types';
import { CHART_COLORS, ChartTooltip, Sparkline } from '../ui/charts/chartTheme';

type DashboardScreenProps = {
  cashValue: number;
  netWorthValue: number;
  passiveValue: number;
  expenseValue: number;
  formatMoney: (value: number) => string;
  freedomPercent: number;
  passiveTrend: { label: string; value: number }[];
  expenseTrend: { label: string; value: number }[];
  ratioValue: number;
  ratioLabel: string;
  passiveDelta: number | null;
  expenseDelta: number | null;
  cashSparkline: { label: string; value: number }[];
  netWorthSparkline: { label: string; value: number }[];
  passiveSparkline: { label: string; value: number }[];
  monthlyActions: MonthlyActionsSummary;
  onUseMonthlyAction: (actionId: MonthlyActionId) => void;
  onOpenActions: () => void;
  onNavigate: (path: string, tab?: 'invest' | 'lifestyle' | 'sidehustles') => void;
  events: GameState['events'];
  gameState: GameState;
  onClaimQuest: (questId: string) => void;
  onOpenGoals: () => void;
  isProcessing: boolean;
};

const actionIcon = (action: MonthlyActionCard) => {
  switch (action.id) {
    case 'OVERTIME':
      return <Clock size={18} className="text-emerald-300" />;
    case 'NETWORK':
      return <Users size={18} className="text-blue-300" />;
    case 'TRAINING':
      return <BookOpen size={18} className="text-amber-300" />;
    case 'HUSTLE_SPRINT':
      return <Zap size={18} className="text-purple-300" />;
    case 'RECOVER':
      return <HeartPulse size={18} className="text-pink-300" />;
    default:
      return null;
  }
};

const ActionTile: React.FC<{
  action: MonthlyActionCard;
  onSelect: (id: MonthlyActionId) => void;
}> = ({ action, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(action.id)}
      disabled={action.disabled}
      className={`min-w-[170px] rounded-2xl border px-4 py-3 text-left transition ${
        action.disabled
          ? 'border-slate-800/60 bg-slate-900/40 text-slate-500'
          : 'border-slate-700/60 bg-slate-900/70 hover:border-emerald-400/50 hover:shadow-[0_0_18px_rgba(52,211,153,0.25)]'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-slate-800/70 flex items-center justify-center">
          {actionIcon(action)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{action.title}</p>
          <p className="text-[11px] text-slate-400">{action.subtitle}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{action.details}</p>
      {action.disabledReason && (
        <p className="mt-2 text-[11px] text-rose-300">{action.disabledReason}</p>
      )}
    </button>
  );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({
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
  isProcessing
}) => {
  const [activeDetail, setActiveDetail] = useState<'passive' | 'expenses' | 'ratio' | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const useCountUp = (value: number) => {
    const [display, setDisplay] = useState(value);
    useEffect(() => {
      const start = display;
      const diff = value - start;
      const duration = 650;
      const startTime = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration);
        setDisplay(start + diff * progress);
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [value]);
    return display;
  };

  const animatedCash = useCountUp(cashValue);
  const animatedNetWorth = useCountUp(netWorthValue);
  const animatedPassive = useCountUp(passiveValue);
  const expenseAvg = expenseTrend.length
    ? expenseTrend.reduce((sum, point) => sum + point.value, 0) / expenseTrend.length
    : 0;

  const getSeriesDelta = (series: Array<{ label: string; value: number }>, label?: string | number) => {
    if (label === undefined || label === null) return undefined;
    const labelKey = String(label);
    const idx = series.findIndex((point) => point.label === labelKey);
    if (idx <= 0) return undefined;
    return series[idx].value - series[idx - 1].value;
  };

  const passiveTooltip = (props: any) => (
    <ChartTooltip {...props} valuePrefix="$" delta={getSeriesDelta(passiveTrend, props?.label)} />
  );

  const expenseTooltip = (props: any) => (
    <ChartTooltip {...props} valuePrefix="$" delta={getSeriesDelta(expenseTrend, props?.label)} />
  );
  const modeTiles = useMemo(() => ([
    { label: 'Overview', icon: LineChart, glow: 'neon-outline-blue', onClick: () => onNavigate('/play') },
    { label: 'Invest', icon: Wallet, glow: 'neon-outline-green', onClick: () => onNavigate('/money', 'invest') },
    { label: 'Study', icon: GraduationCap, glow: 'neon-outline-yellow', onClick: () => onNavigate('/learn') },
    { label: 'Side Hustle', icon: Briefcase, glow: 'neon-outline-purple', onClick: () => onNavigate('/life', 'sidehustles') },
    { label: 'Lifestyle', icon: Heart, glow: 'neon-outline-red', onClick: () => onNavigate('/life', 'lifestyle') }
  ]), [onNavigate]);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3">
        {modeTiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={tile.onClick}
            className={`glass-tile ${tile.glow} flex items-center gap-2 px-4 py-3 text-left`}
          >
            <tile.icon size={18} className="text-slate-200" />
            <span className="text-sm font-semibold text-white">{tile.label}</span>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="glass-tile px-3 py-3 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-wide text-emerald-200">Cash</p>
          <p className="text-base font-semibold text-white">{formatMoney(animatedCash)}</p>
          <div className="absolute inset-x-2 bottom-2 h-12 opacity-70">
            <Sparkline data={cashSparkline} color={CHART_COLORS.neutral} />
          </div>
        </div>
        <div className="glass-tile px-3 py-3 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-wide text-slate-300">Net Worth</p>
          <p className="text-base font-semibold text-white">{formatMoney(animatedNetWorth)}</p>
          <div className="absolute inset-x-2 bottom-2 h-12 opacity-70">
            <Sparkline data={netWorthSparkline} color={CHART_COLORS.accent} />
          </div>
        </div>
        <div className="glass-tile px-3 py-3 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-wide text-amber-200">Passive/mo</p>
          <p className="text-base font-semibold text-white">{formatMoney(animatedPassive)}</p>
          <div className="absolute inset-x-2 bottom-2 h-12 opacity-70">
            <Sparkline data={passiveSparkline} color={CHART_COLORS.positive} />
          </div>
        </div>
      </section>

      <section className="glass-panel px-4 py-4">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Financial Freedom Progress (Goal: 110%)</span>
          <span className="text-emerald-200">{Math.round(freedomPercent * 100)}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{ width: `${Math.min(1, freedomPercent) * 100}%` }}
          />
        </div>
      </section>

      <section className="glass-panel px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles size={16} className="text-cyan-300" />
          Financial Breakdown
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => isMobile && setActiveDetail(activeDetail === 'passive' ? null : 'passive')}
            className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3 text-left"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400">Passive income (Monthly)</p>
              {passiveDelta !== null && (
                <span className={`text-[10px] ${passiveDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {passiveDelta >= 0 ? '+' : ''}{formatMoney(passiveDelta)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-white">{formatMoney(passiveValue)}</p>
            <div className="h-16 mt-2 min-w-[1px] min-h-[1px]">
              {passiveTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[10px] text-slate-500">
                  No history yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <AreaChart data={passiveTrend}>
                    <defs>
                      <linearGradient id="passiveMini" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.positive} stopOpacity={0.45} />
                        <stop offset="95%" stopColor={CHART_COLORS.positive} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  <Tooltip content={passiveTooltip} />
                    <Area type="monotone" dataKey="value" stroke={CHART_COLORS.positive} fill="url(#passiveMini)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => isMobile && setActiveDetail(activeDetail === 'expenses' ? null : 'expenses')}
            className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-950/60 to-rose-950/30 p-3 text-left shadow-[0_0_20px_rgba(244,114,182,0.08)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Monthly Expenses</p>
              {expenseDelta !== null && (
                <span className={`text-[10px] ${expenseDelta >= 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {expenseDelta >= 0 ? '+' : ''}{formatMoney(expenseDelta)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-white">{formatMoney(expenseValue)}</p>
            <p className="text-[10px] text-slate-400">
              Avg {formatMoney(expenseAvg)} • Last 6 months
            </p>
            <div className="h-16 mt-2 min-w-[1px] min-h-[1px]">
              {expenseTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[10px] text-slate-500">
                  No history yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <AreaChart data={expenseTrend}>
                    <defs>
                      <linearGradient id="expensesGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fda4af" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#fda4af" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip content={expenseTooltip} />
                    <Area type="monotone" dataKey="value" stroke="#fda4af" fill="url(#expensesGlow)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => isMobile && setActiveDetail(activeDetail === 'ratio' ? null : 'ratio')}
            className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3 flex flex-col items-center justify-center"
          >
            <p className="text-[10px] text-slate-400">Financial Ratio</p>
            <div className="h-16 w-16 min-w-[1px] min-h-[1px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'ratio', value: ratioValue },
                      { name: 'rest', value: Math.max(0, 100 - ratioValue) }
                    ]}
                    dataKey="value"
                    innerRadius={18}
                    outerRadius={28}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill={CHART_COLORS.accent} />
                    <Cell fill="rgba(148,163,184,0.2)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs font-semibold text-white mt-1">{ratioLabel}</p>
            <p className="text-[10px] text-slate-400">Target: 110%</p>
          </button>
        </div>
        {isMobile && activeDetail && (
          <div className="mt-3 rounded-2xl border border-slate-800/60 bg-slate-950/50 p-3 text-xs text-slate-200">
            {activeDetail === 'passive' && (
              <>Passive income for the selected month. Delta shows change vs last month.</>
            )}
            {activeDetail === 'expenses' && (
              <>Expenses for the selected month. Delta shows change vs last month.</>
            )}
            {activeDetail === 'ratio' && (
              <>Passive income divided by expenses. Target is 110%.</>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Monthly Actions</h3>
          <button
            type="button"
            onClick={onOpenActions}
            className="text-xs text-slate-300 hover:text-white"
          >
            View all
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 glass-scroll">
          {monthlyActions.actions.map((action) => (
            <ActionTile key={action.id} action={action} onSelect={onUseMonthlyAction} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel px-4 py-4">
          <EventFeed events={events} />
        </div>
        <div className="glass-panel px-4 py-4">
          <NextBestStep
            gameState={gameState}
            isProcessing={isProcessing}
            onClaimQuest={onClaimQuest}
            onOpenGoals={onOpenGoals}
          />
        </div>
      </section>
    </div>
  );
};

export default DashboardScreen;
