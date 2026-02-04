import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  LineChart,
  Coins,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  BookOpen,
  HeartPulse,
  Sparkles,
  ChevronRight,
  Info,
  Activity,
  Heart,
  Lightbulb,
} from 'lucide-react';
import { MonthlyActionsSummary, MonthlyActionCard } from '../../services/monthlyActions';
import { MonthlyActionId, GameState } from '../../types';
import CollapsibleSection from '../ui/CollapsibleSection';
import EventFeed from './EventFeed';
import NextBestStep from './NextBestStep';

// Sparkline Component
const Sparkline: React.FC<{ data: { value: number }[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;
  
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#grad-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface DashboardScreenEnhancedProps {
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
  onShowToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const actionIcon = (actionId: string) => {
  switch (actionId) {
    case 'OVERTIME': return <Clock className="w-5 h-5 text-emerald-400" />;
    case 'NETWORK': return <Users className="w-5 h-5 text-blue-400" />;
    case 'TRAINING': return <BookOpen className="w-5 h-5 text-amber-400" />;
    case 'HUSTLE_SPRINT': return <Zap className="w-5 h-5 text-purple-400" />;
    case 'RECOVER': return <HeartPulse className="w-5 h-5 text-pink-400" />;
    default: return <Zap className="w-5 h-5 text-slate-400" />;
  }
};

const actionBadge = (actionId: string) => {
  switch (actionId) {
    case 'OVERTIME': return { text: '+Income', color: 'bg-emerald-500/20 text-emerald-400' };
    case 'NETWORK': return { text: 'Career', color: 'bg-blue-500/20 text-blue-400' };
    case 'TRAINING': return { text: 'Growth', color: 'bg-amber-500/20 text-amber-400' };
    case 'HUSTLE_SPRINT': return { text: 'Side $', color: 'bg-purple-500/20 text-purple-400' };
    case 'RECOVER': return { text: 'Health', color: 'bg-pink-500/20 text-pink-400' };
    default: return { text: 'Action', color: 'bg-slate-500/20 text-slate-400' };
  }
};

const DashboardScreenEnhanced: React.FC<DashboardScreenEnhancedProps> = ({
  cashValue,
  netWorthValue,
  passiveValue,
  formatMoney,
  freedomPercent,
  cashSparkline,
  netWorthSparkline,
  passiveSparkline,
  monthlyActions,
  onUseMonthlyAction,
  onOpenActions,
  events,
  gameState,
  onClaimQuest,
  onOpenGoals,
  isProcessing,
  onShowToast,
}) => {
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());

  const handleActionClick = useCallback((actionId: MonthlyActionId) => {
    const action = monthlyActions.actions.find(a => a.id === actionId);
    if (!action || action.disabled) return;

    setSelectedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });

    onUseMonthlyAction(actionId);
    onShowToast?.('Action Selected', `${action.title} will be applied next month`, 'success');
  }, [monthlyActions.actions, onUseMonthlyAction, onShowToast]);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    iconBg: string;
    trend?: number;
    sparklineData: { label: string; value: number }[];
    sparklineColor: string;
    onClick?: () => void;
  }> = ({ title, value, icon, iconBg, trend, sparklineData, sparklineColor, onClick }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-5 relative overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 ${iconBg.replace('bg-', 'bg-').replace('/20', '')}`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        </div>
        <p className="text-3xl font-bold font-mono-nums text-white">{formatMoney(value)}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            )}
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend >= 0 ? '+' : ''}{formatMoney(Math.abs(trend))}
            </span>
            <span className="text-xs text-slate-500">this month</span>
          </div>
        )}
      </div>
      <div className="mt-4 h-10 opacity-60">
        <Sparkline data={sparklineData} color={sparklineColor} />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-5">
      {/* Hero Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            title="Cash"
            value={cashValue}
            icon={<Wallet className="w-4 h-4 text-emerald-400" />}
            iconBg="bg-emerald-500/20"
            trend={3420}
            sparklineData={cashSparkline}
            sparklineColor="#10b981"
            onClick={() => onShowToast?.('Cash Breakdown', 'Salary $4,200 + Passive $850 - Expenses $2,630', 'info')}
          />
          <StatCard
            title="Net Worth"
            value={netWorthValue}
            icon={<LineChart className="w-4 h-4 text-cyan-400" />}
            iconBg="bg-cyan-500/20"
            trend={undefined}
            sparklineData={netWorthSparkline}
            sparklineColor="#06b6d4"
            onClick={() => onShowToast?.('Net Worth', 'Assets $127,640 - Liabilities $12,400', 'info')}
          />
          <StatCard
            title="Passive /mo"
            value={passiveValue}
            icon={<Coins className="w-4 h-4 text-amber-400" />}
            iconBg="bg-amber-500/20"
            trend={420}
            sparklineData={passiveSparkline}
            sparklineColor="#f59e0b"
            onClick={() => onShowToast?.('Passive Income', 'Real Estate $850 + Business $1,200 + Dividends $125', 'info')}
          />
        </div>

        {/* Freedom Progress */}
        <CollapsibleSection
          title="Freedom Goal"
          subtitle={`${Math.round(freedomPercent * 100)}% Complete • Target: $6,750/mo`}
          icon={<Target className="w-5 h-5 text-emerald-400" />}
          headerRight={
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
              On Track
            </span>
          }
          defaultExpanded={false}
        >
          <div className="space-y-3 pt-2">
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(freedomPercent * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 progress-shimmer"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Current: <span className="text-slate-200">{formatMoney(passiveValue)}/mo</span></span>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">Emergency Fund ✓</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                <span className="text-sm text-slate-500">First Property</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                <span className="text-sm text-slate-500">Halfway Point</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* AI Advisor Recommendation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">AI Advisor</span>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold mb-1">Invest in Index Fund</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Your cash reserves are high ({formatMoney(cashValue)}). Consider putting $10,000 into a diversified index fund.
                </p>
                <div className="flex items-center gap-4 text-sm mb-4">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +8.5% projected
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Low Risk
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-primary text-sm py-2 px-4"
                    onClick={() => onShowToast?.('Investment Executed', '$10,000 invested in S&P 500 ETF', 'success')}
                  >
                    Invest $10,000
                  </button>
                  <button className="btn-secondary text-sm py-2 px-4">
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Monthly Actions - Collapsible */}
          <CollapsibleSection
            title="Monthly Actions"
            subtitle={`Choose how to spend your time • ${monthlyActions.remaining}/${monthlyActions.max} remaining`}
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            headerRight={
              <button
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenActions();
                }}
              >
                View all →
              </button>
            }
            defaultExpanded={false}
          >
            <div className="grid grid-cols-2 gap-3 pt-2">
              {monthlyActions.actions.slice(0, 4).map((action) => {
                const badge = actionBadge(action.id);
                const isSelected = selectedActions.has(action.id);
                
                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.id)}
                    disabled={action.disabled}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      action.disabled
                        ? 'border-slate-800/50 bg-slate-900/30 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-slate-700/50 bg-slate-900/30 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        action.disabled ? 'bg-slate-800' : 'bg-slate-800 group-hover:scale-110'
                      }`}>
                        {actionIcon(action.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium text-sm ${action.disabled ? 'text-slate-500' : 'text-slate-200'}`}>
                            {action.title}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{action.details}</p>
                        {!action.disabled && (
                          <div className="flex items-center gap-2 text-xs">
                            {action.effects.map((effect, i) => (
                              <span key={i} className={effect.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>
                                {effect}
                              </span>
                            ))}
                          </div>
                        )}
                        {action.disabledReason && (
                          <p className="text-xs text-rose-400 mt-1">{action.disabledReason}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Portfolio Performance - Collapsible */}
          <CollapsibleSection
            title="Portfolio Performance"
            subtitle="+$12,450 (18.5%) all time"
            icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
            headerRight={
              <div className="flex gap-1 p-1 bg-slate-900/50 rounded-lg">
                {['1M', '3M', '6M', '1Y'].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      period === '1M' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            }
            defaultExpanded={false}
          >
            <div className="h-64 relative bg-slate-900/30 rounded-xl border border-slate-800 pt-2">
              <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
                <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
                <path
                  d="M0,180 L80,165 L160,170 L240,140 L320,135 L400,110 L480,100 L560,85 L640,70 L720,75 L800,50 L800,200 L0,200 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0,180 L80,165 L160,170 L240,140 L320,135 L400,110 L480,100 L560,85 L640,70 L720,75 L800,50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="800" cy="50" r="8" fill="#10b981" stroke="#0a0f1a" strokeWidth="3" />
              </svg>
              <div className="absolute top-4 right-4 glass-card-compact px-4 py-2">
                <p className="text-xs text-slate-500">Current Value</p>
                <p className="text-lg font-bold text-emerald-400">{formatMoney(79640)}</p>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Financial Health */}
          <div className="glass-card-compact p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                Financial Health
              </h3>
              <span className="text-2xl font-bold">75</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500" style={{ width: '75%' }} />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Emergency Fund', status: 'Secure', color: 'text-emerald-400' },
                { label: 'Debt-to-Income', status: '12% (Good)', color: 'text-emerald-400' },
                { label: 'Diversification', status: 'Needs Work', color: 'text-amber-400' },
                { label: 'Savings Rate', status: '28% (Great)', color: 'text-emerald-400' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={item.color}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <CollapsibleSection
            title="Recent Activity"
            subtitle="Latest transactions"
            icon={<Activity className="w-4 h-4 text-cyan-400" />}
            headerRight={
              <button className="text-xs text-slate-400 hover:text-emerald-400">View all</button>
            }
            defaultExpanded={false}
          >
            <div className="space-y-3 pt-2">
              {[
                { icon: TrendingDown, color: 'emerald', title: 'Salary Deposited', date: 'Today', amount: '+$4,200', positive: true },
                { icon: Wallet, color: 'amber', title: 'Rent Income', date: 'Yesterday', amount: '+$850', positive: true },
                { icon: TrendingUp, color: 'rose', title: 'Loan Payment', date: '2 days ago', amount: '-$420', positive: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/20 flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                  <span className={`text-sm font-semibold ${item.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Pro Tip */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-300 mb-1">Pro Tip</p>
                <p className="text-xs text-slate-400">
                  Your debt-to-income ratio is excellent at 12%. Consider leveraging low-interest loans for investments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreenEnhanced;
