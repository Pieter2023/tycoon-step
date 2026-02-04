import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, GraduationCap, Heart, LineChart, Sparkles, Wallet, BookOpen, Clock, Users, Zap, HeartPulse, PieChart as PieChartIcon } from 'lucide-react';
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
      className={`min-w-[170px] rounded-2xl border px-4 py-3 text-left transition ${action.disabled
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


  return (
    <div className="space-y-5">
      {/* Row 1: High-level Financial Health */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Col: Main Stats (2/3 width on LG) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-tile px-4 py-4 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Wallet size={16} />
                </div>
                <p className="text-[10px] uppercase tracking-wide text-emerald-200 font-bold">Cash</p>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{formatMoney(animatedCash)}</p>
            </div>
            <div className="h-10 opacity-60 mt-2">
              <Sparkline data={cashSparkline} color={CHART_COLORS.neutral} />
            </div>
          </div>

          <div className="glass-tile px-4 py-4 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <LineChart size={16} />
                </div>
                <p className="text-[10px] uppercase tracking-wide text-indigo-200 font-bold">Net Worth</p>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{formatMoney(animatedNetWorth)}</p>
            </div>
            <div className="h-10 opacity-60 mt-2">
              <Sparkline data={netWorthSparkline} color={CHART_COLORS.accent} />
            </div>
          </div>

          <div className="glass-tile px-4 py-4 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Briefcase size={16} />
                </div>
                <p className="text-[10px] uppercase tracking-wide text-amber-200 font-bold">Passive/mo</p>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{formatMoney(animatedPassive)}</p>
            </div>
            <div className="h-10 opacity-60 mt-2">
              <Sparkline data={passiveSparkline} color={CHART_COLORS.positive} />
            </div>
          </div>
        </div>

        {/* Right Col: Financial Freedom Target (1/3 width on LG) */}
        <div className="glass-panel p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-300" />
              Freedom Goal
            </h3>
            <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300 uppercase">
              {ratioLabel}
            </div>
          </div>

          <div className="relative pt-2 pb-6">
            <div className="flex items-end justify-between mb-2">
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                {Math.round(freedomPercent * 100)}%
              </span>
            </div>
            <div className="ff-progress-track h-3">
              <div
                className="ff-progress-fill"
                style={{ width: `${Math.min(1, freedomPercent) * 100}%` }}
              >
                <div className="ff-progress-spark" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Target: 110% coverage of expenses
            </p>
          </div>
        </div>
      </section>

      {/* Row 2: Command Center (Actions & Assistant) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main Action Area (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap size={18} className="text-amber-400" />
              Monthly Actions
            </h3>
            <button
              onClick={onOpenActions}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all available →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {monthlyActions.actions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                onClick={() => onUseMonthlyAction(action.id)}
                disabled={action.disabled}
                className={`group relative p-4 rounded-xl border text-left transition-all duration-200
                    ${action.disabled
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]'}
                  `}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg ${action.disabled ? 'bg-slate-800 text-slate-500' : 'bg-slate-900 shadow-inner group-hover:scale-110 transition-transform duration-200'}`}>
                    {actionIcon(action)}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${action.disabled ? 'text-slate-500' : 'text-slate-100 group-hover:text-emerald-300'}`}>
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{action.details}</p>
                    {action.disabledReason && (
                      <p className="text-[10px] text-rose-400 mt-2 font-medium bg-rose-950/30 px-2 py-0.5 rounded inline-block">
                        {action.disabledReason}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assistant / Next Best Step (1/3) */}
        <div className="glass-panel p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800/60 bg-slate-900/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              Advisor
            </h3>
            <button
              onClick={onOpenGoals}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View goals
            </button>
          </div>
          <div className="p-4 flex-1">
            <NextBestStep
              gameState={gameState}
              isProcessing={isProcessing}
              onClaimQuest={onClaimQuest}
              onOpenGoals={onOpenGoals}
            />
          </div>
        </div>
      </section>

      {/* Row 3: Analytics & Details */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Financial Breakdown Charts */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <PieChartIcon size={16} className="text-blue-400" /> {/* Note: Ensure PieChartIcon or similar is imported, or reuse LineChart */}
            Cashflow Analytics
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Passive Chart */}
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-slate-400 uppercase">Passive</span>
                <span className={`text-[10px] font-bold ${passiveDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {passiveDelta >= 0 ? '↑' : '↓'} {formatMoney(Math.abs(passiveDelta || 0))}
                </span>
              </div>
              <div className="h-16 w-full">
                {passiveTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={passiveTrend}>
                      <defs>
                        <linearGradient id="passiveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.positive} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.positive} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke={CHART_COLORS.positive} fill="url(#passiveGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="text-xs text-slate-600 flex items-center justify-center h-full">No data</div>}
              </div>
            </div>

            {/* Expenses Chart */}
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-slate-400 uppercase">Expenses</span>
                <span className={`text-[10px] font-bold ${expenseDelta <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {/* Note: expenses going down is good (emerald), going up is bad (rose) usually */}
                  {expenseDelta >= 0 ? '↑' : '↓'} {formatMoney(Math.abs(expenseDelta || 0))}
                </span>
              </div>
              <div className="h-16 w-full">
                {expenseTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={expenseTrend}>
                      <defs>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.negative} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.negative} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke={CHART_COLORS.negative} fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="text-xs text-slate-600 flex items-center justify-center h-full">No data</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Event Feed */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            Recent Events
          </h3>
          <div className="max-h-[160px] overflow-y-auto glass-scroll pr-2">
            <EventFeed events={events} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardScreen;
