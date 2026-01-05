import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge, Button, Tooltip } from '../ui';
import { AssetType, AutoInvestSettings, MarketItem } from '../../types';
import { MARKET_ITEMS } from '../../constants';
import { QuizQuestion, getGlossaryEntry } from '../../data/learning';

type InvestTabProps = {
  formatMoney: (value: number) => string;
  formatMoneyFull: (value: number) => string;
  formatPercent: (value: number, digits?: number) => string;
  gameState: any;
  investmentFilter: string;
  setInvestmentFilter: (value: string) => void;
  investmentTierFilter: 'ALL' | 'STARTER' | 'MID' | 'ADVANCED';
  setInvestmentTierFilter: (value: 'ALL' | 'STARTER' | 'MID' | 'ADVANCED') => void;
  investmentSearch: string;
  setInvestmentSearch: (value: string) => void;
  filteredInvestments: MarketItem[];
  batchBuyMode: boolean;
  toggleBatchBuyMode: () => void;
  clearBatchBuyCart: () => void;
  batchBuyQuantities: Record<string, number>;
  setBatchBuyQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  batchBuyCart: any;
  openBatchBuyConfirm: () => void;
  autoInvest: AutoInvestSettings;
  onUpdateAutoInvest: (next: AutoInvestSettings) => void;
  handleBuyAsset: (item: MarketItem) => void;
  hasRequiredEducationForInvestment: (item: MarketItem, degrees: string[]) => boolean;
  getAssetIcon: (type: AssetType) => React.ReactNode;
  getItemTier: (item: MarketItem) => 'STARTER' | 'MID' | 'ADVANCED';
  getRiskRating: (item: MarketItem) => 'LOW' | 'MEDIUM' | 'HIGH';
  isProcessing: boolean;
  playClick: () => void;
  setShowMortgageModal: (item: MarketItem) => void;
  setSelectedMortgage: (value: string) => void;
  isBatchBuyEligible: (item: MarketItem) => boolean;
  setBatchQty: (id: string, qty: number) => void;
  showQuiz: boolean;
  quizTitle?: string;
  quizIntro?: string;
  quizQuestions: QuizQuestion[];
  quizAnswers: Record<string, string>;
  onSelectQuizAnswer: (id: string, answer: string) => void;
  onSubmitQuiz: () => void;
  onSkipQuiz: () => void;
};

const InvestTab: React.FC<InvestTabProps> = (props) => {
  const {
    formatMoney,
    formatMoneyFull,
    formatPercent,
    gameState,
    investmentFilter,
    setInvestmentFilter,
    investmentTierFilter,
    setInvestmentTierFilter,
    investmentSearch,
    setInvestmentSearch,
    filteredInvestments,
    batchBuyMode,
    toggleBatchBuyMode,
    clearBatchBuyCart,
    batchBuyQuantities,
    setBatchBuyQuantities,
    batchBuyCart,
    openBatchBuyConfirm,
    autoInvest,
    onUpdateAutoInvest,
    handleBuyAsset,
    hasRequiredEducationForInvestment,
    getAssetIcon,
    getItemTier,
    getRiskRating,
    isProcessing,
    playClick,
    setShowMortgageModal,
    setSelectedMortgage,
    isBatchBuyEligible,
    setBatchQty,
    showQuiz,
    quizTitle,
    quizIntro,
    quizQuestions,
    quizAnswers,
    onSelectQuizAnswer,
    onSubmitQuiz,
    onSkipQuiz
  } = props;

  const yieldTip = getGlossaryEntry('Yield')?.short || 'Expected annual return as a percent of price.';
  const riskTip = getGlossaryEntry('Risk')?.short || 'Higher risk means bigger swings in value.';
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [autoAddId, setAutoAddId] = useState<string>('');

  const selectedInvestments = useMemo(() => {
    return compareSelection
      .map((id) => filteredInvestments.find((item) => item.id === id))
      .filter((item): item is MarketItem => !!item);
  }, [compareSelection, filteredInvestments]);

  const autoInvestOptions = useMemo(() => {
    return MARKET_ITEMS.filter((item) => item.type !== AssetType.REAL_ESTATE && item.type !== AssetType.BUSINESS);
  }, []);

  const autoTotalPercent = autoInvest.allocations.reduce((sum, alloc) => sum + alloc.percent, 0);
  const autoRemaining = Math.max(0, 100 - autoTotalPercent);

  useEffect(() => {
    if (!autoAddId && autoInvestOptions.length > 0) {
      setAutoAddId(autoInvestOptions[0].id);
    }
  }, [autoAddId, autoInvestOptions]);

  const getLockupPeriod = (item: MarketItem) => {
    if (item.type === AssetType.SAVINGS && /locked/i.test(item.description)) return '12 mo';
    if (item.type === AssetType.BOND) return '6-12 mo';
    if (item.type === AssetType.REAL_ESTATE || item.type === AssetType.BUSINESS) return 'Long-term';
    return 'Liquid';
  };

  const getPassiveIncome = (item: MarketItem, price: number) => {
    const monthly = Math.round((price * item.expectedYield) / 12);
    return `${formatMoneyFull(monthly)}/mo`;
  };

  return (
<div>
            {showQuiz && quizQuestions.length > 0 && (
              <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{quizTitle || 'Quick investing quiz'}</p>
                    <p className="text-xs text-slate-400">{quizIntro || 'Answer a few questions to earn small bonuses.'}</p>
                  </div>
                  <button
                    onClick={onSkipQuiz}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Skip
                  </button>
                </div>
                <div className="space-y-3">
                  {quizQuestions.map((question, idx) => (
                    <div key={question.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                      <p className="text-sm text-slate-200 mb-2">{idx + 1}. {question.question}</p>
                      <div className="flex flex-wrap gap-2">
                        {question.options.map((option) => {
                          const isSelected = quizAnswers[question.id] === option;
                          return (
                            <button
                              key={`${question.id}-${option}`}
                              onClick={() => onSelectQuizAnswer(question.id, option)}
                              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                                isSelected
                                  ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-100'
                                  : 'bg-slate-900/40 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={onSubmitQuiz}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
                  >
                    Submit quiz
                  </button>
                  <span className="text-xs text-slate-500">Rewards are small and optional.</span>
                </div>
              </div>
            )}
            {/* Filters */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: AssetType.SAVINGS, label: 'Savings' },
                { id: AssetType.BOND, label: 'Bonds' },
                { id: AssetType.INDEX_FUND, label: 'Index Funds' },
                { id: AssetType.STOCK, label: 'Stocks' },
                { id: AssetType.REAL_ESTATE, label: 'Real Estate' },
                { id: AssetType.BUSINESS, label: 'Business' },
                { id: AssetType.CRYPTO, label: 'Crypto' },
              ].map(f => (
                <Button
                  key={f.id}
                  size="sm"
                  variant={investmentFilter === f.id ? 'primary' : 'secondary'}
                  onClick={() => setInvestmentFilter(f.id)}
                  className="whitespace-nowrap"
                >
                  {f.label}
                </Button>
              ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: 'All tiers' },
                  { id: 'STARTER', label: 'Starter' },
                  { id: 'MID', label: 'Mid' },
                  { id: 'ADVANCED', label: 'Advanced' },
                ].map(f => (
                  <Button
                    key={f.id}
                    size="sm"
                    variant={investmentTierFilter === f.id ? 'secondary' : 'ghost'}
                    onClick={() => setInvestmentTierFilter(f.id as 'ALL' | 'STARTER' | 'MID' | 'ADVANCED')}
                    className="whitespace-nowrap"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={investmentSearch}
                  onChange={(e) => setInvestmentSearch(e.target.value)}
                  placeholder="Search investments"
                  className="flex-1 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                />
                {investmentSearch && (
                  <button
                    onClick={() => setInvestmentSearch('')}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <p className="text-slate-400 text-sm">
                Available: {formatMoney(gameState.cash)} • {filteredInvestments.length} investments
              </p>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setCompareMode((prev) => !prev);
                    if (compareMode) {
                      setCompareSelection([]);
                    }
                  }}
                  variant={compareMode ? 'primary' : 'secondary'}
                  size="md"
                >
                  {compareMode ? 'Compare: ON' : 'Compare'}
                </Button>
              </div>
            </div>
            {batchBuyCart.totalUnits > 0 && (
              <div className="mb-4 text-xs text-slate-500">
                Cart total: {batchBuyCart.totalUnits} • {formatMoneyFull(batchBuyCart.totalCost)}
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Auto-Invest</p>
                  <p className="text-xs text-slate-400">Invest from last month’s disposable income when you hit Next Month.</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    className="rounded border-slate-600 bg-slate-900"
                    checked={autoInvest.enabled}
                    onChange={(e) => {
                      onUpdateAutoInvest({ ...autoInvest, enabled: e.target.checked });
                    }}
                  />
                  Enable auto-invest
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Max auto-invest</span>
                    <span>{autoInvest.maxPercent}% of disposable income</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={autoInvest.maxPercent}
                    onChange={(e) => {
                      const next = Math.max(0, Math.min(50, Math.floor(Number(e.target.value))));
                      onUpdateAutoInvest({ ...autoInvest, maxPercent: next });
                    }}
                    className="mt-3 w-full accent-emerald-400"
                  />
                  <p className="mt-2 text-[11px] text-slate-500">Round down always. Max 50%.</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Allocation total</span>
                    <span>{autoTotalPercent}%</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Remaining: {autoRemaining}% • {autoRemaining === 0 ? 'Fully allocated' : 'Add more allocations'}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <select
                      value={autoAddId}
                      onChange={(e) => setAutoAddId(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200"
                    >
                      {autoInvestOptions
                        .filter((item) => !autoInvest.allocations.some((alloc) => alloc.itemId === item.id))
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={autoRemaining === 0 || !autoAddId}
                      onClick={() => {
                        if (!autoAddId || autoRemaining === 0) return;
                        const defaultPercent = Math.min(10, autoRemaining);
                        onUpdateAutoInvest({
                          ...autoInvest,
                          allocations: [...autoInvest.allocations, { itemId: autoAddId, percent: defaultPercent }]
                        });
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {autoInvest.allocations.length === 0 ? (
                <p className="mt-4 text-xs text-slate-500">No allocations yet. Add investments to begin auto-investing.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {autoInvest.allocations.map((alloc) => {
                    const item = autoInvestOptions.find((entry) => entry.id === alloc.itemId);
                    if (!item) return null;
                    const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);
                    const price = Math.round(item.price * inflationMult);
                    const totalWithout = autoTotalPercent - alloc.percent;
                    const maxAllowed = Math.max(0, 100 - totalWithout);

                    return (
                      <div key={alloc.itemId} className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.name}</p>
                            <p className="text-[11px] text-slate-500">Price: {formatMoney(price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateAutoInvest({
                                ...autoInvest,
                                allocations: autoInvest.allocations.filter((entry) => entry.itemId !== alloc.itemId)
                              });
                            }}
                            className="text-[11px] text-rose-300 hover:text-rose-200"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={maxAllowed}
                            step={1}
                            value={alloc.percent}
                            onChange={(e) => {
                              const next = Math.max(0, Math.min(maxAllowed, Math.floor(Number(e.target.value))));
                              onUpdateAutoInvest({
                                ...autoInvest,
                                allocations: autoInvest.allocations.map((entry) =>
                                  entry.itemId === alloc.itemId ? { ...entry, percent: next } : entry
                                )
                              });
                            }}
                            className="flex-1 accent-emerald-400"
                          />
                          <div className="w-12 text-right text-xs text-slate-300">{alloc.percent}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {compareMode && (
              <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">Compare investments</p>
                    <p className="text-xs text-slate-400">
                      Select up to three options to compare key metrics.
                    </p>
                  </div>
                  <div className="text-xs text-slate-400">
                    Selected: {compareSelection.length}/3
                  </div>
                </div>

                {selectedInvestments.length === 0 ? (
                  <p className="text-xs text-slate-500 mt-3">Pick investments below to see the comparison table.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm text-slate-300">
                      <thead>
                        <tr className="text-xs uppercase text-slate-500">
                          <th className="text-left py-2 pr-3">Metric</th>
                          {selectedInvestments.map((item) => (
                            <th key={`compare-${item.id}`} className="text-left py-2 pr-3">
                              {item.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);
                          return (
                            <>
                              <tr className="border-t border-slate-800">
                                <td className="py-2 pr-3 text-slate-400">Cost</td>
                                {selectedInvestments.map((item) => {
                                  const price = Math.round(item.price * inflationMult);
                                  return (
                                    <td key={`cost-${item.id}`} className="py-2 pr-3 text-white">
                                      {formatMoney(price)}
                                    </td>
                                  );
                                })}
                              </tr>
                              <tr className="border-t border-slate-800">
                                <td className="py-2 pr-3 text-slate-400">Expected return</td>
                                {selectedInvestments.map((item) => (
                                  <td key={`return-${item.id}`} className="py-2 pr-3 text-emerald-300">
                                    {formatPercent(item.expectedYield)}/yr
                                  </td>
                                ))}
                              </tr>
                              <tr className="border-t border-slate-800">
                                <td className="py-2 pr-3 text-slate-400">Risk rating</td>
                                {selectedInvestments.map((item) => (
                                  <td key={`risk-${item.id}`} className="py-2 pr-3">
                                    {getRiskRating(item)}
                                  </td>
                                ))}
                              </tr>
                              <tr className="border-t border-slate-800">
                                <td className="py-2 pr-3 text-slate-400">Lock-up period</td>
                                {selectedInvestments.map((item) => (
                                  <td key={`lockup-${item.id}`} className="py-2 pr-3">
                                    {getLockupPeriod(item)}
                                  </td>
                                ))}
                              </tr>
                              <tr className="border-t border-slate-800">
                                <td className="py-2 pr-3 text-slate-400">Dividends / passive</td>
                                {selectedInvestments.map((item) => {
                                  const price = Math.round(item.price * inflationMult);
                                  return (
                                    <td key={`income-${item.id}`} className="py-2 pr-3">
                                      {getPassiveIncome(item, price)}
                                    </td>
                                  );
                                })}
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Investment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvestments.map((item, idx) => {
                const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);
                const price = Math.round(item.price * inflationMult);
                const canAffordCash = gameState.cash >= price;
                const canMortgage = item.canMortgage && gameState.cash >= price * 0.035;
                const tier = getItemTier(item);
                const riskRating = getRiskRating(item);
                const isSelected = compareSelection.includes(item.id);
                const hasEducation = hasRequiredEducationForInvestment(item, gameState.education.degrees);
                const isLocked = !hasEducation;
                const requiredEducationLabel = item.requiredEducationCategory
                  ? item.requiredEducationCategory.join(' or ')
                  : 'Education';
                const requiredLevelLabel = item.requiredEducationLevel ? item.requiredEducationLevel.replace('_', ' ') : null;
                
                return (
                  <motion.div key={item.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: idx * 0.02 }}
                    className="ds-card p-4 hover:border-slate-600 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getAssetIcon(item.type)}</span>
                        <div>
                          <h4 className="text-white font-bold text-sm">{item.name}</h4>
                          <p className="text-slate-500 text-xs">{item.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {compareMode && (
                          <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-slate-600 bg-slate-900"
                              checked={isSelected}
                              onChange={(e) => {
                                if (!isSelected && compareSelection.length >= 3) return;
                                const checked = e.target.checked;
                                setCompareSelection((prev) => {
                                  if (checked) {
                                    return [...prev, item.id].slice(0, 3);
                                  }
                                  return prev.filter((id) => id !== item.id);
                                });
                              }}
                            />
                            Compare
                          </label>
                        )}
                        <Badge variant="neutral">{tier.toLowerCase()}</Badge>
                        <Tooltip content={riskTip}>
                          <Badge variant={riskRating === 'LOW' ? 'low' : riskRating === 'MEDIUM' ? 'med' : 'high'}>
                            {riskRating.toLowerCase()} risk
                          </Badge>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-xs mb-2 line-clamp-2">{item.description}</p>
                    
                    {item.educationalNote && (
                      <p className="text-blue-400/70 text-xs mb-2 italic">💡 {item.educationalNote}</p>
                    )}

                    {isLocked && (
                      <p className="text-amber-400 text-xs mb-2">
                        🔒 Requires {requiredEducationLabel}
                        {requiredLevelLabel ? ` (${requiredLevelLabel})` : ''}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-slate-900/50 rounded-lg p-2">
                        <p className="text-slate-500">Price</p>
                        <p className="text-white font-bold">{formatMoney(price)}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2">
                        <p className="text-slate-500 inline-flex items-center gap-1">
                          Yield
                          <Tooltip content={yieldTip}>
                            <span className="text-slate-400">?</span>
                          </Tooltip>
                        </p>
                        <p className="text-emerald-400 font-bold">{formatPercent(item.expectedYield)}/yr</p>
                      </div>
                    </div>
                    
                    {item.canMortgage ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => { playClick(); setShowMortgageModal(item); setSelectedMortgage(''); }}
                          disabled={!canMortgage || isLocked}
                          variant={canMortgage && !isLocked ? 'secondary' : 'ghost'}
                          fullWidth
                        >
                          🏦 Finance
                        </Button>
                        <Button
                          onClick={() => handleBuyAsset(item)}
                          disabled={!canAffordCash || isLocked}
                          variant={canAffordCash && !isLocked ? 'primary' : 'ghost'}
                          fullWidth
                        >
                          💵 Cash
                        </Button>
                      </div>
                    ) : isBatchBuyEligible(item) ? (
                      isLocked ? (
                        <div className="w-full py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-500 border border-slate-700 text-center">
                          Education Required
                        </div>
                      ) : (
                      (() => {
                        const qty = batchBuyQuantities[item.id] || 0;
                        const lineCost = qty * price;
                        const otherCost = batchBuyCart.totalCost - lineCost;
                        const canAddOne = otherCost + (qty + 1) * price <= gameState.cash;
                        const canBuyQty = qty > 0 && lineCost <= gameState.cash;

                        return (
                          <div className="w-full flex flex-col gap-2 py-2 px-3 rounded-lg border border-slate-700 bg-slate-900/40">
                            <div className="text-left">
                              <div className="text-slate-400 text-xs">Quantity</div>
                              <div className="text-white font-bold text-sm">
                                {qty}x
                                <span className="text-slate-400 font-medium ml-2">{qty > 0 ? formatMoneyFull(lineCost) : '—'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setBatchQty(item.id, qty - 1)}
                                disabled={qty <= 0}
                                className={`w-9 h-9 rounded-lg font-bold transition-all ${
                                  qty > 0 ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                }`}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={qty === 0 ? '' : qty}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  if (next === '') {
                                    setBatchQty(item.id, 0);
                                    return;
                                  }
                                  const parsed = Math.max(0, Math.floor(Number(next)));
                                  if (Number.isNaN(parsed)) return;
                                  setBatchQty(item.id, parsed);
                                }}
                                className="w-14 rounded-md border border-slate-700 bg-slate-900 text-center text-sm text-white px-1 py-1"
                                aria-label={`${item.name} quantity`}
                              />
                              <button
                                onClick={() => setBatchQty(item.id, qty + 1)}
                                disabled={!canAddOne}
                                className={`w-9 h-9 rounded-lg font-bold transition-all ${
                                  canAddOne ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                }`}
                              >
                                +
                              </button>
                            </div>

                            <Button
                              onClick={() => {
                                if (!canBuyQty) return;
                                playClick();
                                setBatchBuyQuantities({ [item.id]: qty });
                                setTimeout(() => openBatchBuyConfirm(), 0);
                              }}
                              variant={canBuyQty ? 'primary' : 'ghost'}
                              size="sm"
                              disabled={!canBuyQty}
                              fullWidth
                            >
                              Buy {qty > 0 ? `${qty}x` : ''}
                            </Button>
                          </div>
                        );
                      })()
                      )
                    ) : (
                      <Button
                        onClick={() => handleBuyAsset(item)}
                        disabled={!canAffordCash || isLocked}
                        variant={canAffordCash && !isLocked ? 'primary' : 'ghost'}
                        fullWidth
                      >
                        {isLocked ? 'Education Required' : canAffordCash ? `Buy ${formatMoney(price)}` : 'Insufficient Funds'}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
  );
};

export default InvestTab;
