import React, { useEffect, useMemo, useState } from 'react';
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
import { Banknote, LineChart, PieChart as PieChartIcon, Wallet } from 'lucide-react';
import InvestTab from '../tabs/InvestTab';
import PortfolioTab from '../tabs/PortfolioTab';
import BankTab from '../tabs/BankTab';
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
  forcedTab?: 'invest' | 'portfolio' | 'bank';
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
  forcedTab
}) => {
  const [activeTab, setActiveTab] = useState<'invest' | 'portfolio' | 'bank' | 'reports'>('invest');

  useEffect(() => {
    if (!forcedTab) return;
    setActiveTab(forcedTab);
  }, [forcedTab]);

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
    const mortgageSum = gameState.mortgages.reduce((sum, m) => sum + m.balance, 0);
    return liabilitySum + mortgageSum;
  }, [gameState.liabilities, gameState.mortgages]);

  const portfolioValue = useMemo(() => {
    return gameState.assets.reduce((sum, asset) => sum + asset.value * asset.quantity, 0);
  }, [gameState.assets]);

  const handleLegacyTabChange = (tabId: TabId) => {
    if (tabId === TABS.INVEST) setActiveTab('invest');
    if (tabId === TABS.ASSETS) setActiveTab('portfolio');
    if (tabId === TABS.BANK) setActiveTab('bank');
  };

  const tabButtonClass = (tab: string) =>
    `rounded-full px-4 py-2 text-xs font-semibold border transition ${
      activeTab === tab
        ? 'border-white/80 bg-white text-slate-900 shadow-[0_0_18px_rgba(255,255,255,0.2)]'
        : 'border-slate-700/70 text-slate-200 hover:border-white/40 hover:text-white'
    }`;

  return (
    <div className="space-y-8">
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
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
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
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
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
                  <Tooltip formatter={(value: number) => [formatMoneyFull(value), 'Value']} />
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

      <section className="glass-panel p-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button type="button" className={tabButtonClass('invest')} onClick={() => setActiveTab('invest')}>
            Invest
          </button>
          <button type="button" className={tabButtonClass('portfolio')} onClick={() => setActiveTab('portfolio')}>
            Portfolio
          </button>
          <button type="button" className={tabButtonClass('bank')} onClick={() => setActiveTab('bank')}>
            Bank
          </button>
          <button type="button" className={tabButtonClass('reports')} onClick={() => setActiveTab('reports')}>
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
            Reports coming soon. Your investment performance and cashflow summaries will live here.
            <div className="mt-4 text-xs">
              Current interest rate: <span className="text-white">{formatPercent(gameState.economy?.interestRate || 0.065)}</span>
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
