import React, { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { AssetType, TABS, TabId } from '../../types';
import { Card } from '../ui';

type PortfolioTabProps = {
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
      business: 0,
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

    return [
      { name: 'Cash', value: totals.cash, color: '#94a3b8' },
      { name: 'Stocks', value: totals.stocks, color: '#34d399' },
      { name: 'Index Funds', value: totals.indexFunds, color: '#38bdf8' },
      { name: 'Bonds', value: totals.bonds, color: '#60a5fa' },
      { name: 'Real Estate', value: totals.realEstate, color: '#f59e0b' },
      { name: 'Business', value: totals.business, color: '#f97316' },
      { name: 'Crypto', value: totals.crypto, color: '#a855f7' },
      { name: 'Savings', value: totals.savings, color: '#22c55e' }
    ].filter((entry) => entry.value > 0);
  }, [gameState.assets, gameState.cash]);

  const totalAssetValue = useMemo(() => {
    return assetAllocation.reduce((sum, entry) => sum + entry.value, 0);
  }, [assetAllocation]);

  return (
<div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <p className="text-slate-400 text-xs">Total Assets</p>
                <p className="text-xl font-bold text-white">{formatMoney(gameState.assets.reduce((s, a) => s + a.value * a.quantity, 0))}</p>
              </Card>
              <Card className="p-4">
                <p className="text-slate-400 text-xs">Passive Income</p>
                <p className="text-xl font-bold text-emerald-400">{formatMoney(cashFlow.passive)}/mo</p>
              </Card>
              <Card className="p-4">
                <p className="text-slate-400 text-xs">Total Debt</p>
                <p className="text-xl font-bold text-red-400">{formatMoney(gameState.liabilities.reduce((s, l) => s + l.balance, 0))}</p>
              </Card>
              <Card className="p-4">
                <p className="text-slate-400 text-xs">Positions</p>
                <p className="text-xl font-bold text-white">{gameState.assets.length}</p>
              </Card>
            </div>
            
            {assetAllocation.length > 0 && (
              <Card className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Net Worth Mix</p>
                    <p className="text-xs text-slate-400">Allocation by asset category</p>
                    <p className="text-sm text-slate-300 mt-2">
                      Total tracked: <span className="text-white font-semibold">{formatMoney(totalAssetValue)}</span>
                    </p>
                  </div>
                  <div className="h-40 w-full md:w-56">
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                      <PieChart>
                        <Pie
                          data={assetAllocation}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {assetAllocation.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(val: number, name: string) => [formatMoney(val), name]}
                          contentStyle={{
                            background: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: 8,
                            fontSize: 12
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-400">
                  {assetAllocation.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-300">{entry.name}</span>
                      <span className="text-slate-500">{formatMoney(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Assets List */}
            {gameState.assets.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                <Wallet size={48} className="mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Assets Yet</h3>
                <p className="text-slate-400 mb-4">Start building your portfolio!</p>
                <button onClick={() => setActiveTab(TABS.INVEST)} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-all">
                  Browse Investments
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Your Assets</h3>
                {gameState.assets.map(asset => {
                  const totalValue = asset.value * asset.quantity;
                  const totalCost = asset.costBasis * asset.quantity;
                  const profitLoss = totalValue - totalCost;
                  const profitPercent = totalCost > 0 ? ((totalValue / totalCost) - 1) * 100 : 0;
                  const isBusiness = asset.type === AssetType.BUSINESS;
                  const displayedIncome = isBusiness && typeof asset.currentMonthIncome === 'number'
                    ? asset.currentMonthIncome
                    : asset.cashFlow * asset.quantity;
                  const lastBusinessIncome = isBusiness
                    ? (typeof asset.lastMonthIncome === 'number' ? asset.lastMonthIncome : Math.round(displayedIncome))
                    : null;
                  const businessRange = isBusiness ? getBusinessIncomeRange(asset) : null;
                  const maintenanceStatus = isBusiness ? asset.maintenanceStatus : undefined;
                  const opsUpgradeCost = isBusiness ? getOpsUpgradeCost(asset) : null;
                  const mortgage = asset.mortgageId
                    ? (gameState.mortgages.find(m => m.id === asset.mortgageId) || gameState.mortgages.find(m => m.assetId === asset.id))
                    : gameState.mortgages.find(m => m.assetId === asset.id);
                  const equity = mortgage ? totalValue - mortgage.balance : totalValue;
                  
                  return (
                    <div key={asset.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-2xl">
                            {getAssetIcon(asset.type)}
                          </div>
                          <div>
                            <h4 className="text-white font-bold">{asset.name}</h4>
                            <p className="text-slate-400 text-sm">{asset.quantity}x @ {formatMoney(asset.value)}</p>
                            {mortgage && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-blue-400 text-xs">Mortgage: {formatMoney(mortgage.balance)} • Equity: {formatMoney(equity)}</p>
                                <button
                                  onClick={() => handleRefinanceMortgage(mortgage.id)}
                                  disabled={creditScore < 680}
                                  className={`text-xs px-2 py-1 rounded-md border transition-all ${
                                    creditScore < 680
                                      ? 'border-slate-700 text-slate-500 cursor-not-allowed'
                                      : 'border-blue-500/40 text-blue-300 hover:bg-blue-500/10'
                                  }`}
                                >
                                  Refinance
                                </button>
                              </div>
                            )}
                            {isBusiness && (
                              <div className="mt-2 space-y-1 text-xs text-slate-400">
                                <p>Expected range: {formatMoney(businessRange?.min || 0)}–{formatMoney(businessRange?.max || 0)}/mo</p>
                                <p>Last month: {formatMoney(lastBusinessIncome || 0)}/mo</p>
                                {maintenanceStatus && (
                                  <p className="text-amber-300">Maintenance: {maintenanceStatus.label} • {maintenanceStatus.impact}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="text-white font-bold text-lg">{formatMoney(totalValue)}</p>
                            <p className={`text-sm ${profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {profitLoss >= 0 ? '+' : ''}{formatMoney(profitLoss)} ({profitPercent.toFixed(1)}%)
                            </p>
                            <p className="text-emerald-400/70 text-xs">+{formatMoney(displayedIncome)}/mo</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => handleSellAsset(asset.id)}
                              className={`px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-600/30 transition-all touch-target ${
                                coachHint && coachHint.tabId === TABS.ASSETS && coachHint.target === 'assets-sell' && activeTab === TABS.ASSETS
                                  ? 'ring-2 ring-amber-400/70 animate-pulse'
                                  : ''
                              }`}
                            >
                              Sell
                            </button>
                            {isBusiness && (
                              <button
                                onClick={() => handleBusinessOpsUpgrade(asset.id)}
                                disabled={asset.opsUpgrade}
                                className={`px-4 py-2 text-xs rounded-lg border transition-all touch-target ${
                                  asset.opsUpgrade
                                    ? 'bg-slate-700/40 text-slate-400 border-slate-600/60 cursor-not-allowed'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600'
                                }`}
                              >
                                {asset.opsUpgrade ? 'Ops Upgraded' : `Ops Upgrade (${formatMoney(opsUpgradeCost || 0)})`}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Liabilities List */}
            {gameState.liabilities.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4">💳 Liabilities</h3>
                <div className="space-y-3">
                  {gameState.liabilities.map(liability => {
                    const progress = ((liability.originalBalance - liability.balance) / liability.originalBalance) * 100;
                    
                    return (
                      <div key={liability.id} className="bg-slate-800/50 border border-red-900/30 rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h4 className="text-white font-bold">{liability.name}</h4>
                            <p className="text-slate-400 text-sm">
                              {formatPercent(liability.interestRate)} APR • {formatMoney(liability.monthlyPayment)}/mo
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-400 font-bold">{formatMoney(liability.balance)}</p>
                            <p className="text-slate-500 text-xs">of {formatMoney(liability.originalBalance)}</p>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handlePayDebt(liability.id, liability.monthlyPayment)} 
                            disabled={gameState.cash < liability.monthlyPayment}
                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm transition-all">
                            Pay {formatMoney(liability.monthlyPayment)}
                          </button>
                          <button onClick={() => handlePayDebt(liability.id, liability.balance)} 
                            disabled={gameState.cash < liability.balance}
                            className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-600/30 disabled:opacity-50 transition-all">
                            Pay Off ({formatMoney(liability.balance)})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
  );
};

export default PortfolioTab;
