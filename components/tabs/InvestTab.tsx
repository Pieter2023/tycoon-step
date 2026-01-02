import React from 'react';
import { motion } from 'framer-motion';
import { Badge, Button, Tooltip } from '../ui';
import { AssetType, MarketItem } from '../../types';
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
                  onClick={toggleBatchBuyMode}
                  variant={batchBuyMode ? 'primary' : 'secondary'}
                  size="md"
                >
                  {batchBuyMode ? 'Batch Buy: ON' : 'Batch Buy'}
                </Button>

                {batchBuyMode && (
                  <Button onClick={clearBatchBuyCart} variant="secondary" size="md">
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {batchBuyMode && (
              <div className="mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-300 text-sm">
                Set quantities on stocks, index funds, bonds, crypto, and commodities — then confirm once.
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
                      <div className="flex items-center gap-1">
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
                    ) : batchBuyMode && isBatchBuyEligible(item) ? (
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

                        return (
                          <div className="w-full flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-slate-700 bg-slate-900/40">
                            <div className="text-left">
                              <div className="text-slate-400 text-xs">Cart</div>
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
                              <div className="min-w-[2.5rem] text-center text-white font-bold">{qty}</div>
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
