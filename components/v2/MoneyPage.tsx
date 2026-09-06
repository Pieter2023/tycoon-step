import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Activity, ArrowRight, Banknote, LineChart, PieChart as PieChartIcon, ShieldCheck, Target, TrendingUp, Wallet } from 'lucide-react';
import InvestTab from '../tabs/InvestTab';
import PortfolioTab from '../tabs/PortfolioTab';
import BankTab from '../tabs/BankTab';
import { FINANCIAL_FREEDOM_TARGET_MULTIPLIER } from '../../constants';
import { AssetType, GameState, TABS, TabId } from '../../types';

type MoneyPageLayoutProps = {
  gameState: GameState;
  netWorth: number;
  cashFlow: any;
  formatMoney: (value: number) => string;
  formatMoneyFull: (value: number) => string;
  formatPercent: (value: number, digits?: number) => string;
  investTabProps: Omit<React.ComponentProps<typeof InvestTab>, 'showQuiz'>;
  portfolioTabProps: Omit<React.ComponentProps<typeof PortfolioTab>, 'activeTab' | 'setActiveTab'>;
  bankTabProps: React.ComponentProps<typeof BankTab>;
  showQuiz: boolean;
  activeTab: 'invest' | 'portfolio' | 'bank' | 'reports';
  onTabChange: (tab: 'invest' | 'portfolio' | 'bank' | 'reports') => void;
};

const assetTypeLabels: Record<string, string> = {
  [AssetType.STOCK]: 'Stocks',
  [AssetType.INDEX_FUND]: 'Index Funds',
  [AssetType.BOND]: 'Bonds',
  [AssetType.REAL_ESTATE]: 'Real Estate',
  [AssetType.BUSINESS]: 'Business',
  [AssetType.CRYPTO]: 'Crypto',
  [AssetType.COMMODITY]: 'Commodities',
  [AssetType.SAVINGS]: 'Savings'
};

const allocationColors = ['#22d3ee', '#34d399', '#a78bfa', '#fbbf24', '#f87171', '#60a5fa', '#f472b6', '#94a3b8'];

export const MoneyPageLayout: React.FC<MoneyPageLayoutProps> = ({
  gameState,
  netWorth,
  cashFlow,
  formatMoney,
  formatMoneyFull,
  formatPercent,
  investTabProps,
  portfolioTabProps,
  bankTabProps,
  showQuiz,
  activeTab,
  onTabChange
}) => {
  const netWorthHistory = useMemo(() => {
    const history = gameState.netWorthHistory || [];
    if (history.length > 0) return history;
    return [{ month: gameState.month, value: netWorth }];
  }, [gameState.month, gameState.netWorthHistory, netWorth]);

  const assetAllocation = useMemo(() => {
    const totals: Record<string, number> = {};
    gameState.assets.forEach((asset) => {
      const key = assetTypeLabels[asset.type] || asset.type;
      totals[key] = (totals[key] || 0) + asset.value * asset.quantity;
    });
    if (gameState.cash > 0) {
      totals.Cash = (totals.Cash || 0) + gameState.cash;
    }
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [gameState.assets, gameState.cash]);

  const liabilitiesTotal = useMemo(() => {
    const liabilitySum = gameState.liabilities.reduce((sum, l) => sum + l.balance, 0);
    const liabilityMortgageIds = new Set(
      gameState.liabilities.filter(l => l.type === 'MORTGAGE').map(l => l.id)
    );
    const liabilityMortgageAssetIds = new Set(
      gameState.liabilities.filter(l => l.type === 'MORTGAGE' && l.assetId).map(l => l.assetId)
    );
    const uncoveredMortgageSum = gameState.mortgages.reduce((sum, m) => {
      if (liabilityMortgageIds.has(m.id)) return sum;
      if (m.assetId && liabilityMortgageAssetIds.has(m.assetId)) return sum;
      return sum + m.balance;
    }, 0);
    return liabilitySum + uncoveredMortgageSum;
  }, [gameState.liabilities, gameState.mortgages]);

  const portfolioValue = useMemo(() => {
    return gameState.assets.reduce((sum, asset) => sum + asset.value * asset.quantity, 0);
  }, [gameState.assets]);

  const netMonthlyCashFlow = cashFlow.income - cashFlow.expenses;
  const runwayMonths = cashFlow.expenses > 0 ? gameState.cash / cashFlow.expenses : 12;
  const passiveTarget = Math.max(1, cashFlow.expenses * FINANCIAL_FREEDOM_TARGET_MULTIPLIER);
  const passiveCoverage = Math.min(1, Math.max(0, cashFlow.passive / passiveTarget));
  const savingsRate = cashFlow.income > 0 ? netMonthlyCashFlow / cashFlow.income : 0;

  const reportRows = [
    {
      label: 'Runway',
      value: runwayMonths >= 12 ? '12+ mo' : `${runwayMonths.toFixed(1)} mo`,
      progress: Math.min(100, (runwayMonths / 6) * 100),
      tone: runwayMonths >= 3 ? 'bg-emerald-400' : runwayMonths >= 1.5 ? 'bg-amber-400' : 'bg-rose-400'
    },
    {
      label: 'Passive coverage',
      value: `${Math.round(passiveCoverage * 100)}%`,
      progress: passiveCoverage * 100,
      tone: passiveCoverage >= 0.7 ? 'bg-emerald-400' : 'bg-cyan-400'
    },
    {
      label: 'Savings rate',
      value: formatPercent(savingsRate, 0),
      progress: Math.min(100, Math.max(0, savingsRate * 100)),
      tone: savingsRate >= 0.25 ? 'bg-emerald-400' : savingsRate >= 0.1 ? 'bg-amber-400' : 'bg-rose-400'
    }
  ];

  const handleLegacyTabChange = (tabId: TabId) => {
    if (tabId === TABS.INVEST) onTabChange('invest');
    if (tabId === TABS.ASSETS) onTabChange('portfolio');
    if (tabId === TABS.BANK) onTabChange('bank');
  };

  const tabButtonClass = (tab: string) =>
    `rounded-lg px-4 py-2 text-xs font-bold border transition ${
      activeTab === tab
        ? 'border-emerald-400/30 bg-emerald-400 text-slate-950 shadow-[0_10px_24px_rgba(52,211,153,0.14)]'
        : 'border-slate-700/70 text-slate-200 hover:border-emerald-400/40 hover:text-white'
    }`;

  return (
    <div className="space-y-4">
      <section className="tycoon-panel p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="tycoon-kicker">Capital HQ</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Choose your next money move.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Keep a cash reserve, compare investments and understand the cost of debt.
            </p>
          </div>
          <div className="grid gap-2 grid-cols-3 lg:min-w-[400px]">
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ShieldCheck size={14} className="text-emerald-300" /> Runway
              </div>
              <p className="mt-2 text-lg font-bold text-white">{runwayMonths >= 12 ? '12+' : runwayMonths.toFixed(1)} mo</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Target size={14} className="text-cyan-300" /> Passive target
              </div>
              <p className="mt-2 text-lg font-bold text-white">{formatMoney(passiveTarget)}/mo</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <TrendingUp size={14} className={netMonthlyCashFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'} /> Monthly delta
              </div>
              <p className={`mt-2 text-lg font-bold ${netMonthlyCashFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {netMonthlyCashFlow >= 0 ? '+' : ''}{formatMoney(netMonthlyCashFlow)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <details className="tycoon-panel p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">View charts and financial overview</summary>
        <div className="mt-4 space-y-4">
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <LineChart size={18} className="text-emerald-300" /> Net Worth Over Time
              </h2>
              <p className="text-xs text-slate-400 mt-1">Track progress toward financial freedom.</p>
            </div>
            <p className="text-lg font-semibold text-white">{formatMoney(netWorth)}</p>
          </div>
          <div className="h-40 mt-4 min-w-[1px] min-h-[1px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1} initialDimension={{width:300,height:220}}>
              <AreaChart data={netWorthHistory.map((entry) => ({ month: entry.month, value: entry.value }))}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip formatter={(value: number) => [formatMoneyFull(value), 'Net Worth']} />
                <Area type="monotone" dataKey="value" stroke="#34d399" fill="url(#netWorthGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-2">
            <PieChartIcon size={18} className="text-blue-300" />
            <h3 className="text-lg font-semibold">Asset Allocation</h3>
          </div>
          <div className="h-40 mt-4 min-w-[1px] min-h-[1px]">
            {assetAllocation.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No assets yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1} initialDimension={{width:300,height:220}}>
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`slice-${entry.name}`} fill={allocationColors[index % allocationColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      formatMoneyFull(value),
                      props?.payload?.name || 'Asset class'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-tile p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Wallet size={14} /> Net Cash Flow
          </div>
          <p className={`mt-2 text-lg font-semibold ${cashFlow.income - cashFlow.expenses >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
            {cashFlow.income - cashFlow.expenses >= 0 ? '+' : ''}
            {formatMoney(cashFlow.income - cashFlow.expenses)}/mo
          </p>
        </div>
        <div className="glass-tile p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Banknote size={14} /> Total Liabilities
          </div>
          <p className="mt-2 text-lg font-semibold text-red-400">{formatMoney(liabilitiesTotal)}</p>
        </div>
        <div className="glass-tile p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Wallet size={14} /> Portfolio Value
          </div>
          <p className="mt-2 text-lg font-semibold text-white">{formatMoney(portfolioValue)}</p>
        </div>
      </section>

        </div>
      </details>

      <section className="glass-panel p-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button type="button" className={tabButtonClass('invest')} onClick={() => onTabChange('invest')}>
            Invest
          </button>
          <button type="button" className={tabButtonClass('portfolio')} onClick={() => onTabChange('portfolio')}>
            Portfolio
          </button>
          <button type="button" className={tabButtonClass('bank')} onClick={() => onTabChange('bank')}>
            Bank
          </button>
          <button type="button" className={tabButtonClass('reports')} onClick={() => onTabChange('reports')}>
            Reports
          </button>
        </div>

        {activeTab === 'invest' && (
          <InvestTab {...investTabProps} showQuiz={showQuiz} />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioTab
            {...portfolioTabProps}
            activeTab={TABS.ASSETS}
            setActiveTab={handleLegacyTabChange}
          />
        )}
        {activeTab === 'bank' && (
          <BankTab {...bankTabProps} />
        )}
        {activeTab === 'reports' && (
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="tycoon-card p-5">
              <div className="flex items-center gap-2">
                <Activity size={17} className="text-emerald-300" />
                <h3 className="text-lg font-semibold text-white">Capital Diagnosis</h3>
              </div>
              <div className="mt-5 space-y-4">
                {reportRows.map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="font-semibold text-white">{row.value}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${row.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tycoon-card p-5">
              <div className="flex items-center gap-2">
                <Target size={17} className="text-cyan-300" />
                <h3 className="text-lg font-semibold text-white">Decision Rules</h3>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <p>Keep at least 3 months of runway before using leverage aggressively.</p>
                <p>Convert surplus cash into diversified assets once runway is healthy.</p>
                <p>If monthly delta turns negative, pause new risk and fix burn rate first.</p>
              </div>
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-2 text-xs text-slate-400">
                Current interest rate: <span className="font-semibold text-white">{formatPercent(gameState.economy?.interestRate || 0.065)}</span>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('invest')}
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-300"
              >
                Review investments
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const MoneyPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-bold">Money</h2>
        <p className="mt-2 text-sm text-slate-400">
          Budgeting, cash flow, investments, and assets will live here in the new layout. Coming soon.
        </p>
      </section>
    </div>
  );
};

export default MoneyPage;
