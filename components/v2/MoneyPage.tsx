import { useI18n, type Translate } from '../../i18n';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { Activity, ArrowRight, Banknote, ChevronRight, LineChart, PieChart as PieChartIcon, ShieldCheck, Target, TrendingUp, Wallet } from 'lucide-react';
import InvestTab from '../tabs/InvestTab';
import PortfolioTab from '../tabs/PortfolioTab';
import BankTab from '../tabs/BankTab';
import { financialFreedom } from '../../services/gameLogic';
import { AssetType, GameState, TABS, TabId } from '../../types';
import { AnimatedNumber, SegmentedControl, MOTION_DISABLED, riseIn, springs, stagger } from '../ui';

type MoneyTab = 'invest' | 'portfolio' | 'bank' | 'reports';

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
  activeTab: MoneyTab;
  onTabChange: (tab: MoneyTab) => void;
};

const assetTypeLabelsFor = (t: Translate): Record<string, string> => ({
  [AssetType.STOCK]: t('shell.moneyPage.stocks'),
  [AssetType.INDEX_FUND]: t('shell.moneyPage.index_funds'),
  [AssetType.BOND]: t('shell.moneyPage.bonds'),
  [AssetType.REAL_ESTATE]: t('shell.moneyPage.real_estate'),
  [AssetType.BUSINESS]: t('shell.moneyPage.business'),
  [AssetType.CRYPTO]: t('shell.moneyPage.crypto'),
  [AssetType.COMMODITY]: t('shell.moneyPage.commodities'),
  [AssetType.SAVINGS]: t('shell.moneyPage.savings')
});

// Apple system colours, in the order the allocation slices are drawn.
const allocationColors = ['#64D2FF', '#30D158', '#BF5AF2', '#FF9F0A', '#FF453A', '#0A84FF', '#FF375F', '#8E8E93'];

const chartTooltipStyle = {
  contentStyle: {
    background: 'rgb(30 30 32 / 0.94)',
    border: '1px solid rgb(255 255 255 / 0.12)',
    borderRadius: 12,
    boxShadow: '0 12px 30px -12px rgb(0 0 0 / 0.7)',
    fontSize: 12,
    color: '#fff',
    padding: '6px 10px'
  },
  itemStyle: { color: '#e5e5ea' },
  labelStyle: { display: 'none' },
  cursor: { stroke: 'rgb(255 255 255 / 0.18)', strokeWidth: 1 }
};

/** One figure in the stat strip under the hero: a tinted glyph, a quiet label, a tabular value. */
const Stat: React.FC<{ icon: React.ReactNode; tint: string; label: string; children: React.ReactNode }> = ({ icon, tint, label, children }) => (
  <div className="flex min-w-0 flex-col justify-between px-3 first:pl-0 last:pr-0 sm:px-5">
    <div className="flex items-center gap-1.5 text-[12px] font-medium leading-4 text-slate-400">
      <span className={`hidden h-5 w-5 shrink-0 place-items-center rounded-full sm:grid ${tint}`}>{icon}</span>
      <span>{label}</span>
    </div>
    <div className="mt-1.5 text-[17px] font-semibold leading-6 tracking-[-0.015em] text-white sm:text-[20px]">{children}</div>
  </div>
);

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
  const { t } = useI18n();
  const assetTypeLabels = assetTypeLabelsFor(t);
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
  // The same freedom figure the win check uses: investments at the 4% rule, savings above inflation.
  const freedom = useMemo(() => financialFreedom(gameState, cashFlow), [gameState, cashFlow]);
  const passiveTarget = Math.max(1, freedom.target);
  const passiveCoverage = Math.min(1, Math.max(0, freedom.coverage));
  const savingsRate = cashFlow.income > 0 ? netMonthlyCashFlow / cashFlow.income : 0;

  const reportRows = [
    {
      label: t('shell.moneyPage.runway'),
      value: runwayMonths >= 12 ? '12+ mo' : `${runwayMonths.toFixed(1)} mo`,
      progress: Math.min(100, (runwayMonths / 6) * 100),
      tone: runwayMonths >= 3 ? 'bg-emerald-400' : runwayMonths >= 1.5 ? 'bg-amber-400' : 'bg-rose-400'
    },
    {
      label: t('shell.moneyPage.passive_coverage'),
      value: `${Math.round(passiveCoverage * 100)}%`,
      progress: passiveCoverage * 100,
      tone: passiveCoverage >= 0.7 ? 'bg-emerald-400' : 'bg-cyan-400'
    },
    {
      label: t('shell.moneyPage.savings_rate'),
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

  const tabOptions: { value: MoneyTab; label: string }[] = [
    { value: 'invest', label: t('shell.moneyPage.invest') },
    { value: 'portfolio', label: t('shell.moneyPage.portfolio') },
    { value: 'bank', label: t('shell.moneyPage.bank') },
    { value: 'reports', label: t('shell.moneyPage.reports') }
  ];

  const deltaPositive = netMonthlyCashFlow >= 0;
  const formatRunway = (value: number) =>
    t('shell.moneyPage.months_short', { value: value >= 12 ? '12+' : value.toFixed(1) });

  return (
    <motion.div
      className="space-y-4"
      variants={stagger(0.05)}
      initial={MOTION_DISABLED ? false : 'hidden'}
      animate="show"
    >
      {/* Hero: where the money stands, at a glance (Stocks / Wallet). */}
      <motion.section variants={riseIn} className="surface relative overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(48_209_88/0.16),transparent_65%)]"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="eyebrow">{t('shell.moneyPage.capital_hq')}</p>
            <h2 className="t-title-2 mt-1 text-white">{t('shell.moneyPage.choose_your_next_money_move')}</h2>
            <p className="mt-1.5 text-[15px] leading-[21px] text-slate-400">{t('shell.moneyPage.keep_a_cash_reserve_compare')}
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[13px] font-medium text-slate-400">{t('ui.money.netWorth')}</p>
            <AnimatedNumber
              value={netWorth}
              format={formatMoney}
              className="mt-0.5 block text-[40px] font-bold leading-[44px] tracking-[-0.03em] text-white sm:text-[46px] sm:leading-[50px]"
            />
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/[0.08] border-t border-white/[0.08] pt-4">
          <Stat
            icon={<ShieldCheck size={12} strokeWidth={2.4} />}
            tint="bg-emerald-400/15 text-emerald-300"
            label={t('shell.moneyPage.runway')}
          >
            <AnimatedNumber value={Math.min(runwayMonths, 12)} format={formatRunway} />
          </Stat>
          <Stat
            icon={<Target size={12} strokeWidth={2.4} />}
            tint="bg-cyan-400/15 text-cyan-300"
            label={t('shell.moneyPage.passive_target')}
          >
            <AnimatedNumber value={passiveTarget} format={(v) => `${formatMoney(v)}/mo`} flash={false} />
          </Stat>
          <Stat
            icon={<TrendingUp size={12} strokeWidth={2.4} />}
            tint={deltaPositive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}
            label={t('shell.moneyPage.monthly_delta')}
          >
            <AnimatedNumber
              value={netMonthlyCashFlow}
              format={(v) => `${v >= 0 ? '+' : ''}${formatMoney(v)}`}
              className={deltaPositive ? 'text-emerald-400' : 'text-rose-400'}
            />
          </Stat>
        </div>
      </motion.section>

      {/* Charts sit one level deeper: a disclosure row, like Settings. */}
      <motion.details variants={riseIn} className="group surface overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
          <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-sky-500/15 text-sky-300">
            <LineChart size={15} />
          </span>
          <span className="flex-1 text-[15px] font-medium text-slate-100">{t('shell.moneyPage.view_charts_and_financial_overview')}</span>
          <ChevronRight size={17} className="text-slate-500 transition-transform duration-300 ease-spring group-open:rotate-90" />
        </summary>
        <div className="space-y-5 border-t border-white/[0.06] px-5 pb-5 pt-4">
          <section className="grid gap-5 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="t-headline flex items-center gap-2 text-white">{t('shell.moneyPage.net_worth_over_time')}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-slate-400">{t('shell.moneyPage.track_progress_toward_financial_freedom')}</p>
                </div>
                <p className="num text-[20px] font-semibold tracking-[-0.015em] text-white">{formatMoney(netWorth)}</p>
              </div>
              <div className="mt-3 h-40 min-h-[1px] min-w-[1px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1} initialDimension={{width:300,height:220}}>
                  <AreaChart data={netWorthHistory.map((entry) => ({ month: entry.month, value: entry.value }))}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#30D158" stopOpacity={0.38} />
                        <stop offset="100%" stopColor="#30D158" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                    <Tooltip {...chartTooltipStyle} formatter={(value: number) => [formatMoneyFull(value), t('ui.money.netWorth')]} />
                    <Area type="monotone" dataKey="value" stroke="#30D158" fill="url(#netWorthGradient)" strokeWidth={2.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="t-headline flex items-center gap-2 text-white">
                <PieChartIcon size={16} className="text-sky-300" />{t('shell.moneyPage.asset_allocation')}
              </h3>
              <div className="mt-3 h-40 min-h-[1px] min-w-[1px]">
                {assetAllocation.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-[13px] text-slate-500">{t('shell.moneyPage.no_assets_yet')}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1} initialDimension={{width:300,height:220}}>
                    <PieChart>
                      <Pie
                        data={assetAllocation}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={46}
                        outerRadius={70}
                        paddingAngle={2}
                        cornerRadius={4}
                        stroke="none"
                      >
                        {assetAllocation.map((entry, index) => (
                          <Cell key={`slice-${entry.name}`} fill={allocationColors[index % allocationColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        {...chartTooltipStyle}
                        formatter={(value: number, _name: string, props: any) => [
                          formatMoneyFull(value),
                          props?.payload?.name || t('shell.moneyPage.asset_class')
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.04] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                <Wallet size={13} />{t('shell.moneyPage.net_cash_flow')}
              </div>
              <p className={`num mt-1 text-[17px] font-semibold ${cashFlow.income - cashFlow.expenses >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {cashFlow.income - cashFlow.expenses >= 0 ? '+' : ''}
                {formatMoney(cashFlow.income - cashFlow.expenses)}/mo
              </p>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                <Banknote size={13} />{t('shell.moneyPage.total_liabilities')}
              </div>
              <p className="num mt-1 text-[17px] font-semibold text-rose-400">{formatMoney(liabilitiesTotal)}</p>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                <Wallet size={13} />{t('shell.moneyPage.portfolio_value')}
              </div>
              <p className="num mt-1 text-[17px] font-semibold text-white">{formatMoney(portfolioValue)}</p>
            </div>
          </section>
        </div>
      </motion.details>

      <motion.section variants={riseIn} className="pt-1">
        <SegmentedControl
          role="group"
          ariaLabel={t('shell.moneyPage.money')}
          options={tabOptions}
          value={activeTab}
          onChange={onTabChange}
          size="md"
          fill
          className="sm:inline-flex sm:w-auto"
        />

        {/* The new sub-page rises in over the old one's slot; nothing waits for anything to leave. */}
        <motion.div
          key={activeTab}
          className="mt-5"
          initial={MOTION_DISABLED ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
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
              <div className="surface p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Activity size={16} />
                  </span>
                  <h3 className="t-title-3 text-white">{t('shell.moneyPage.capital_diagnosis')}</h3>
                </div>
                <div className="mt-5 space-y-5">
                  {reportRows.map((row) => (
                    <div key={row.label}>
                      <div className="flex items-baseline justify-between text-[15px]">
                        <span className="text-slate-300">{row.label}</span>
                        <span className="num text-[17px] font-semibold text-white">{row.value}</span>
                      </div>
                      <div className="meter mt-2">
                        <motion.div
                          className={`h-full rounded-full ${row.tone}`}
                          initial={MOTION_DISABLED ? false : { width: 0 }}
                          animate={{ width: `${row.progress}%` }}
                          transition={springs.settle}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface flex flex-col p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-400/15 text-cyan-300">
                    <Target size={16} />
                  </span>
                  <h3 className="t-title-3 text-white">{t('shell.moneyPage.decision_rules')}</h3>
                </div>
                <ol className="mt-4 space-y-3 text-[15px] leading-[21px] text-slate-300">
                  {[
                    t('shell.moneyPage.keep_at_least_3_months'),
                    t('shell.moneyPage.convert_surplus_cash_into_diversified'),
                    t('shell.moneyPage.if_monthly_delta_turns_negative')
                  ].map((rule, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="num mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-slate-300">{index + 1}</span>
                      <p>{rule}</p>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex items-center justify-between rounded-[12px] bg-white/[0.045] px-3.5 py-2.5 text-[13px] text-slate-400">{t('shell.moneyPage.current_interest_rate')} <span className="num font-semibold text-white">{formatPercent(gameState.economy?.interestRate || 0.065)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onTabChange('invest')}
                  className="btn-primary mt-5 self-start px-5 py-2.5 text-[15px]"
                >{t('shell.moneyPage.review_investments')}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.section>
    </motion.div>
  );
};

const MoneyPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="t-title-2 text-white">{t('shell.moneyPage.money')}</h2>
        <p className="mt-2 text-[15px] text-slate-400">{t('shell.moneyPage.budgeting_cash_flow_investments_and')}
        </p>
      </section>
    </div>
  );
};

export default MoneyPage;
