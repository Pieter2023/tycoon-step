import { businessUnits } from '../../services/gameLogic';
import { cafeValue, quoteCafe } from '../../services/townCafe';
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, Wallet } from 'lucide-react';
import { AssetType, TABS, TabId } from '../../types';
import { AnimatedNumber, MOTION_DISABLED, springs } from '../ui';

type PortfolioTabProps = {
  onEnterTown?: ()=>void;
  handleTownPermit?: ()=>void;
  gameState: any;
  cashFlow: any;
  formatMoney: (value: number) => string;
  formatPercent: (value: number, digits?: number) => string;
  getAssetIcon: (type: AssetType) => React.ReactNode;
  getBusinessIncomeRange: (asset: any) => { min: number; max: number } | null;
  getOpsUpgradeCost: (asset: any) => number | null;
  handleRefinanceMortgage: (mortgageId: string) => void;
  handleSellAsset: (assetId: string) => void;
  handleBusinessOpsUpgrade: (assetId: string) => void;
  handlePayDebt: (liabilityId: string, amount: number) => void;
  creditScore: number;
  activeTab: TabId;
  coachHint: any;
  setActiveTab: (tabId: TabId) => void;
};

/** App-icon style tile behind each holding's glyph, tinted by asset class (matches the market). */
const ICON_TINT: Record<string, string> = {
  [AssetType.SAVINGS]: 'from-emerald-400/30 to-emerald-400/10',
  [AssetType.BOND]: 'from-blue-400/30 to-blue-400/10',
  [AssetType.INDEX_FUND]: 'from-cyan-400/30 to-cyan-400/10',
  [AssetType.STOCK]: 'from-indigo-400/30 to-indigo-400/10',
  [AssetType.REAL_ESTATE]: 'from-orange-400/30 to-orange-400/10',
  [AssetType.BUSINESS]: 'from-amber-300/30 to-amber-300/10',
  [AssetType.CRYPTO]: 'from-purple-400/30 to-purple-400/10',
  [AssetType.COMMODITY]: 'from-yellow-300/30 to-yellow-300/10',
};

const rowMotion = (idx: number) =>
  MOTION_DISABLED
    ? { initial: false as const }
    : {
        layout: 'position' as const,
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: { ...springs.smooth, delay: Math.min(idx, 8) * 0.04 } },
        exit: { opacity: 0, scale: 0.98, transition: { type: 'spring' as const, bounce: 0, duration: 0.24 } },
        transition: springs.smooth
      };

const PortfolioTab: React.FC<PortfolioTabProps> = (props) => {
  const {
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
    activeTab,
    coachHint,
    setActiveTab
  } = props;

  const assetAllocation = useMemo(() => {
    const totals: Record<string, number> = {
      cash: gameState.cash || 0,
      stocks: 0,
      indexFunds: 0,
      bonds: 0,
      realEstate: 0,
      business: cafeValue(gameState.cafe),
      crypto: 0,
      savings: 0
    };

    gameState.assets.forEach((asset: any) => {
      const value = asset.value * asset.quantity;
      switch (asset.type) {
        case AssetType.STOCK:
          totals.stocks += value;
          break;
        case AssetType.INDEX_FUND:
          totals.indexFunds += value;
          break;
        case AssetType.BOND:
          totals.bonds += value;
          break;
        case AssetType.REAL_ESTATE:
          totals.realEstate += value;
          break;
        case AssetType.BUSINESS:
          totals.business += value;
          break;
        case AssetType.CRYPTO:
          totals.crypto += value;
          break;
        case AssetType.SAVINGS:
          totals.savings += value;
          break;
        default:
          break;
      }
    });

    // Apple system colours: one hue per asset class.
    return [
      { name: 'Cash', value: totals.cash, color: '#8E8E93' },
      { name: 'Stocks', value: totals.stocks, color: '#5E5CE6' },
      { name: 'Index Funds', value: totals.indexFunds, color: '#64D2FF' },
      { name: 'Bonds', value: totals.bonds, color: '#0A84FF' },
      { name: 'Real Estate', value: totals.realEstate, color: '#FF9F0A' },
      { name: 'Business', value: totals.business, color: '#FFD60A' },
      { name: 'Crypto', value: totals.crypto, color: '#BF5AF2' },
      { name: 'Savings', value: totals.savings, color: '#30D158' }
    ].filter((entry) => entry.value > 0);
  }, [gameState.assets, gameState.cash, gameState.cafe]);

  const totalAssetValue = useMemo(() => {
    return assetAllocation.reduce((sum, entry) => sum + entry.value, 0);
  }, [assetAllocation]);

  const summary = [
    {
      label: 'Total Assets',
      value: gameState.assets.reduce((s, a) => s + a.value * a.quantity, 0) + cafeValue(gameState.cafe),
      format: formatMoney,
      tone: 'text-white'
    },
    { label: 'Passive Income', value: cashFlow.passive, format: (v: number) => `${formatMoney(v)}/mo`, tone: 'text-emerald-400' },
    // Debt falling is good news, so it must not flash red: no tint on this one.
    { label: 'Total Debt', value: gameState.liabilities.reduce((s, l) => s + l.balance, 0), format: formatMoney, tone: 'text-rose-400', flash: false },
    { label: 'Positions', value: gameState.assets.length + (gameState.cafe ? 1 : 0), format: (v: number) => String(Math.round(v)), tone: 'text-white' }
  ];
  // 2×2 on a phone, one row from `sm` up; hairlines between cells rather than boxes.
  const summaryCellBorders = ['border-b sm:border-b-0', 'border-l border-b sm:border-b-0', 'sm:border-l', 'border-l'];

  return (
    <div className="space-y-6">
      {/* Summary: the Stocks-style stat strip. */}
      <div className="surface grid grid-cols-2 overflow-hidden sm:grid-cols-4">
        {summary.map((stat, index) => (
          <div key={stat.label} className={`border-white/[0.07] px-4 py-3.5 sm:px-5 sm:py-4 ${summaryCellBorders[index]}`}>
            <p className="text-[12px] font-medium leading-4 text-slate-400">{stat.label}</p>
            <AnimatedNumber
              value={stat.value}
              format={stat.format}
              flash={stat.flash !== false}
              className={`mt-1 block text-[20px] font-semibold leading-7 tracking-[-0.018em] sm:text-[24px] ${stat.tone}`}
            />
          </div>
        ))}
      </div>

      {gameState.cafe && <div className="surface relative overflow-hidden p-5">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(48_209_88/0.14),transparent_65%)]" />
        <div className="relative flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-gradient-to-b from-emerald-400/30 to-emerald-400/10 text-emerald-200 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
            <Coffee size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="t-headline text-emerald-200">Little Square Café</h3>
            <p className="num mt-1 text-[14px] leading-5 text-slate-300">Deposit and equipment resale: {formatMoney(cafeValue(gameState.cafe))}. Next month’s net operating profit: {formatMoney(quoteCafe(gameState.cafe,gameState.month+1).profit)}.</p>
            <p className="mt-1.5 text-[12px] leading-4 text-slate-400">Included in your business assets and income. Manage prices, staff, furnishings or end the lease from the café counter.</p>
            {props.onEnterTown&&<button className="pressable mt-3.5 rounded-full bg-emerald-400/[0.16] px-4 py-2.5 text-[14px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/[0.24]" onClick={props.onEnterTown}>Return to city to manage café →</button>}
          </div>
        </div>
      </div>}

      {assetAllocation.length > 0 && (
        <section className="surface p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="t-headline text-white">Net Worth Mix</h3>
              <p className="mt-0.5 text-[13px] text-slate-400">Allocation by asset category</p>
            </div>
            <p className="text-[13px] text-slate-400">
              Total tracked: <span className="num text-[17px] font-semibold text-white">{formatMoney(totalAssetValue)}</span>
            </p>
          </div>
          {/* A storage-style allocation bar (Settings → iPhone Storage), filling in from the left. */}
          <motion.div
            className="mt-4 flex h-3 w-full origin-left gap-[2px] overflow-hidden rounded-full bg-white/[0.06]"
            initial={MOTION_DISABLED ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={springs.settle}
            role="img"
            aria-label={assetAllocation.map((entry) => `${entry.name} ${formatMoney(entry.value)}`).join(', ')}
          >
            {assetAllocation.map((entry) => (
              <span
                key={entry.name}
                className="h-full min-w-[4px] first:rounded-l-full last:rounded-r-full"
                style={{ flexGrow: entry.value, flexBasis: 0, backgroundColor: entry.color }}
              />
            ))}
          </motion.div>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
            {assetAllocation.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-200">{entry.name}</span>
                <span className="num ml-auto text-slate-400">{formatMoney(entry.value)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Assets List */}
      {gameState.assets.length === 0 ? (
        <div className="surface flex flex-col items-center px-6 py-14 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-b from-emerald-400/25 to-emerald-400/5 text-emerald-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]">
            <Wallet size={30} aria-hidden />
          </span>
          <h3 className="t-title-3 mt-4 text-white">No Assets Yet</h3>
          <p className="mt-1 text-[15px] text-slate-400">Start building your portfolio!</p>
          <button onClick={() => setActiveTab(TABS.INVEST)} className="btn-primary mt-5 px-6 py-2.5 text-[15px]">
            Browse Investments
          </button>
        </div>
      ) : (
        <section>
          <h3 className="t-title-3 mb-3 px-1 text-white">Your Assets</h3>
          <div className="list-group relative [&>.list-row+.list-row]:before:left-[68px]">
            {(() => {
          const rows = gameState.assets.map((asset, idx) => {
            const totalValue = asset.value * asset.quantity;
            const totalCost = asset.costBasis * asset.quantity;
            const profitLoss = totalValue - totalCost;
            const profitPercent = totalCost > 0 ? ((totalValue / totalCost) - 1) * 100 : 0;
            const isBusiness = asset.type === AssetType.BUSINESS;
            const unlicensedCart=asset.marketItemId==='coffee_cart'&&gameState.townProgress?.permitMonth===undefined;
            const displayedIncome = unlicensedCart ? 0 : isBusiness && typeof asset.currentMonthIncome === 'number'
              ? asset.currentMonthIncome
              : asset.cashFlow * (isBusiness ? businessUnits(asset.quantity) : asset.quantity);
            const lastBusinessIncome = isBusiness
              ? (typeof asset.lastMonthIncome === 'number' ? asset.lastMonthIncome : Math.round(displayedIncome))
              : null;
            const businessRange = unlicensedCart ? {min:0,max:0} : isBusiness ? getBusinessIncomeRange(asset) : null;
            const maintenanceStatus = isBusiness ? asset.maintenanceStatus : undefined;
            const opsUpgradeCost = isBusiness ? getOpsUpgradeCost(asset) : null;
            const mortgage = asset.mortgageId
              ? (gameState.mortgages.find(m => m.id === asset.mortgageId) || gameState.mortgages.find(m => m.assetId === asset.id))
              : gameState.mortgages.find(m => m.assetId === asset.id);
            const equity = mortgage ? totalValue - mortgage.balance : totalValue;
            const gaining = profitLoss >= 0;
            const coached = coachHint && coachHint.tabId === TABS.ASSETS && coachHint.target === 'assets-sell' && activeTab === TABS.ASSETS;

            return (
              <motion.div
                key={asset.id}
                {...rowMotion(idx)}
                className="list-row grid grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 py-3.5 sm:grid-cols-[40px_minmax(0,1fr)_auto_auto] sm:gap-x-4"
              >
                <div className={`row-span-2 grid h-10 w-10 shrink-0 place-items-center sm:row-span-1 rounded-[11px] bg-gradient-to-b ${ICON_TINT[asset.type] || 'from-slate-500/30 to-slate-500/10'} text-[20px] leading-none shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]`}>
                  {getAssetIcon(asset.type)}
                </div>
                <div className="col-start-2 row-start-1 min-w-0">
                  <h4 className="text-[15px] font-semibold leading-5 tracking-[-0.012em] text-white">{asset.name}</h4>
                  <p className="num mt-0.5 text-[13px] text-slate-400">{asset.quantity}x @ {formatMoney(asset.value)}</p>
                  {mortgage && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <p className="num text-[12px] text-sky-300">Mortgage: {formatMoney(mortgage.balance)} • Equity: {formatMoney(equity)}</p>
                      <button
                        onClick={() => handleRefinanceMortgage(mortgage.id)}
                        disabled={creditScore < 680}
                        className="pressable rounded-full bg-sky-500/[0.14] px-2.5 py-0.5 text-[12px] font-semibold text-sky-300 transition-colors hover:bg-sky-500/[0.22] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-slate-500"
                      >
                        Refinance
                      </button>
                    </div>
                  )}
                  {isBusiness && (
                    <div className="mt-2 space-y-1 text-[12px] leading-4 text-slate-400">
                      {unlicensedCart&&<><p className="text-amber-300">A one-time trading permit is needed before earning income.</p><button disabled={!props.handleTownPermit||gameState.cash<60||!!gameState.pendingScenario} className="pressable my-1 rounded-full bg-emerald-400/[0.16] px-3 py-1.5 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/[0.24] disabled:opacity-40" onClick={props.handleTownPermit}>Pay trading permit $60</button></>}
                      <p className="num">Expected range: {formatMoney(businessRange?.min || 0)}–{formatMoney(businessRange?.max || 0)}/mo</p>
                      <p className="num">Last month: {formatMoney(lastBusinessIncome || 0)}/mo</p>
                      {maintenanceStatus && (
                        <p className="text-amber-300">Maintenance: {maintenanceStatus.label} • {maintenanceStatus.impact}</p>
                      )}
                      <button
                        onClick={() => handleBusinessOpsUpgrade(asset.id)}
                        disabled={asset.opsUpgrade}
                        className="pressable num mt-1.5 inline-flex min-h-[30px] items-center pointer-coarse:min-h-[40px] rounded-full bg-[rgb(118_118_128/0.24)] px-3.5 py-1.5 text-[12px] font-semibold text-slate-100 transition-colors hover:bg-[rgb(118_118_128/0.32)] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-slate-500"
                      >
                        {asset.opsUpgrade ? 'Ops Upgraded' : `Ops Upgrade (${formatMoney(opsUpgradeCost || 0)})`}
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-start-3 row-span-2 row-start-1 text-right sm:row-span-1">
                  <p className="num text-[17px] font-semibold leading-6 tracking-[-0.015em] text-white">{formatMoney(totalValue)}</p>
                  <p className={`num text-[13px] font-medium ${gaining ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span aria-hidden className="mr-0.5 text-[10px]">{gaining ? '▲' : '▼'}</span>
                    {gaining ? '+' : ''}{formatMoney(profitLoss)} ({profitPercent.toFixed(1)}%)
                  </p>
                  <p className="num text-[12px] text-emerald-400/75">+{formatMoney(displayedIncome)}/mo</p>
                </div>
                <div className="col-start-2 row-start-2 flex sm:col-start-4 sm:row-start-1 sm:mt-2.5">
                  <button
                    onClick={() => handleSellAsset(asset.id)}
                    className={`pressable inline-flex min-h-[34px] items-center justify-center pointer-coarse:min-h-[44px] rounded-full bg-rose-500/[0.14] px-4 py-1.5 text-[14px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/[0.22] ${coached
                        ? 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-[#1c1c1e]'
                        : ''
                      }`}
                  >
                    {asset.type===AssetType.SAVINGS?'Withdraw':'Sell'}
                  </button>
                </div>
              </motion.div>
            );
          });
          return MOTION_DISABLED ? rows : <AnimatePresence mode="popLayout">{rows}</AnimatePresence>;
            })()}
          </div>
        </section>
      )}

      {/* Liabilities: Wallet-style cards with a payoff meter. */}
      {gameState.liabilities.length > 0 && (
        <section>
          <h3 className="t-title-3 mb-3 px-1 text-white">Liabilities</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {gameState.liabilities.map(liability => {
              const progress = ((liability.originalBalance - liability.balance) / liability.originalBalance) * 100;

              return (
                <div key={liability.id} className="surface-card p-4">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold leading-5 text-white">{liability.name}</h4>
                      <p className="num mt-0.5 text-[13px] text-slate-400">
                        {formatPercent(liability.interestRate)} APR • {formatMoney(liability.monthlyPayment)}/mo
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <AnimatedNumber value={liability.balance} format={formatMoney} flash={false} className="block text-[20px] font-semibold leading-6 tracking-[-0.018em] text-rose-400" />
                      <p className="num text-[12px] text-slate-500">of {formatMoney(liability.originalBalance)}</p>
                    </div>
                  </div>
                  <div className="meter mt-3.5">
                    <motion.div
                      className="h-full rounded-full bg-emerald-400"
                      initial={MOTION_DISABLED ? false : { width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={springs.settle}
                    />
                  </div>
                  <div className="mt-3.5 flex gap-2">
                    <button onClick={() => handlePayDebt(liability.id, liability.monthlyPayment)}
                      disabled={gameState.cash < liability.monthlyPayment}
                      className="btn-secondary num flex-1 px-3 py-2 text-[14px]">
                      Pay {formatMoney(liability.monthlyPayment)}
                    </button>
                    <button onClick={() => handlePayDebt(liability.id, liability.balance)}
                      disabled={gameState.cash < liability.balance}
                      className="pressable num flex-1 rounded-full bg-rose-500/[0.14] px-3 py-2 text-[14px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/[0.22] disabled:cursor-not-allowed disabled:opacity-40">
                      Pay Off ({formatMoney(liability.balance)})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default PortfolioTab;
