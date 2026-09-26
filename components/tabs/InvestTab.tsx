import { nextBusinessUnitShare } from '../../services/gameLogic';
import { incomeYield, incomeLabel, nominalPrice } from '../../services/investmentModel';
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Banknote, Check, ChevronRight, GitCompareArrows, Info, Landmark, Layers, Lightbulb, Lock, Search, X } from 'lucide-react';
import { AnimatedNumber, Badge, Button, SegmentedControl, MOTION_DISABLED, springs } from '../ui';
import { AssetType, AutoInvestSettings, MarketItem } from '../../types';
import { AUTO_INVEST_PRESETS, MARKET_ITEMS } from '../../constants';
import { QuizQuestion } from '../../data/learning';

type InvestTabProps = {
  startWithFullCatalogue?: boolean;
  t?: any;
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
  onOpenGlossary: () => void;
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

const CATEGORY_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: AssetType.SAVINGS, label: 'Savings' },
  { id: AssetType.BOND, label: 'Bonds' },
  { id: AssetType.INDEX_FUND, label: 'Index Funds' },
  { id: AssetType.STOCK, label: 'Stocks' },
  { id: AssetType.REAL_ESTATE, label: 'Real Estate' },
  { id: AssetType.BUSINESS, label: 'Business' },
  { id: AssetType.CRYPTO, label: 'Crypto' },
];

const TIER_FILTERS: { value: 'ALL' | 'STARTER' | 'MID' | 'ADVANCED'; label: string }[] = [
  { value: 'ALL', label: 'All tiers' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'MID', label: 'Mid' },
  { value: 'ADVANCED', label: 'Advanced' },
];

/** App-icon style tile behind each asset's glyph, tinted by asset class. */
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

const sentenceCase = (value: string) => {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const fieldClass =
  'rounded-[10px] border-0 bg-[rgb(118_118_128/0.24)] text-[15px] text-white placeholder:text-slate-500 outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_rgb(10_132_255/0.55)]';

/** An iOS switch drawn around a real checkbox, so its label, role and keyboard behaviour stay native. */
const SwitchVisual: React.FC = () => (
  <span
    aria-hidden
    className="relative inline-flex h-[26px] w-[44px] shrink-0 rounded-full bg-[rgb(120_120_128/0.32)] transition-colors duration-300 peer-checked:bg-emerald-500 peer-focus-visible:shadow-[0_0_0_3px_rgb(10_132_255/0.6)] peer-checked:[&>span]:translate-x-[18px]"
  >
    <span className="absolute left-[2px] top-[2px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.3)] transition-transform duration-300 ease-spring" />
  </span>
);

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
    onOpenGlossary,
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

  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [autoAddId, setAutoAddId] = useState<string>('');
  const [autoInvestOpen, setAutoInvestOpen] = useState(false);
  const [showAllInvestments, setShowAllInvestments] = useState(!!props.startWithFullCatalogue || !gameState.firstSteps || gameState.month > 3);
  useEffect(()=>{if(props.startWithFullCatalogue)setShowAllInvestments(true);},[props.startWithFullCatalogue]);
  const starterIds = ['hysa', 'tbill', 'sp500'];
  const guided = !showAllInvestments && investmentFilter === 'ALL' && investmentTierFilter === 'ALL' && !investmentSearch;
  const visibleInvestments = guided ? filteredInvestments.filter(item => starterIds.includes(item.id)) : filteredInvestments;

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

  const applyPreset = (presetId: string) => {
    const preset = AUTO_INVEST_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    onUpdateAutoInvest({
      enabled: true,
      maxPercent: Math.max(0, Math.min(50, Math.floor(preset.maxPercent))),
      allocations: preset.allocations.map((alloc) => ({
        itemId: alloc.itemId,
        percent: Math.max(0, Math.min(100, Math.floor(alloc.percent)))
      }))
    });
  };

  useEffect(() => {
    if (!autoAddId && autoInvestOptions.length > 0) {
      setAutoAddId(autoInvestOptions[0].id);
    }
  }, [autoAddId, autoInvestOptions]);

  const getLockupPeriod = (item: MarketItem) => {
    if (item.type === AssetType.SAVINGS && /locked/i.test(item.description)) return '12-mo term (simplified)';
    if (item.type === AssetType.BOND) return 'Varies by product';
    if (item.type === AssetType.REAL_ESTATE || item.type === AssetType.BUSINESS) return 'Long-term';
    return 'Liquid';
  };

  const getPassiveIncome = (item: MarketItem, price: number) => {
    const monthly = Math.round((price * incomeYield(item)) / 12);
    // Another unit of a business you already run shares the same customers, so it adds less.
    if (item.type === AssetType.BUSINESS) {
      const owned = (gameState.assets || []).filter((a: any) => a.marketItemId === item.id || a.name === item.name).reduce((n: number, a: any) => n + (a.quantity || 0), 0);
      if (owned > 0) return `${formatMoneyFull(Math.round(monthly * nextBusinessUnitShare(owned)))}/mo for unit ${owned + 1} (shares your customers)`;
    }
    return `${formatMoneyFull(monthly)}/mo`;
  };

  const cartVisible = batchBuyCart.totalUnits > 0;
  const cartBar = cartVisible && (
    <motion.div
      key="batch-cart"
      initial={MOTION_DISABLED ? false : { opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 28, scale: 0.97, transition: { type: 'spring', bounce: 0, duration: 0.3 } }}
      transition={springs.smooth}
      className="pointer-events-none sticky bottom-[calc(env(safe-area-inset-bottom)+5.4rem)] z-30 mt-6 flex justify-center md:bottom-6"
    >
      <div className={`mat-popover pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-full bg-[rgb(36_36_38/0.84)] py-2 pl-5 pr-2 ${
        batchBuyCart.canAfford ? '' : 'ring-1 ring-inset ring-rose-500/60'
      }`}>
        <div className="min-w-0 flex-1 text-[13px] leading-[18px] text-slate-300">
          <div className="truncate">
            Cart total: <span className="num font-semibold text-white">{batchBuyCart.totalUnits}</span> •{' '}
            <AnimatedNumber value={batchBuyCart.totalCost} format={formatMoneyFull} className="font-semibold text-white" />
          </div>
          {!batchBuyCart.canAfford && <span className="text-[12px] font-medium text-rose-300">Not enough cash</span>}
        </div>
        <button
          type="button"
          onClick={clearBatchBuyCart}
          className="btn-secondary shrink-0 px-3.5 py-2 text-[13px]"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={openBatchBuyConfirm}
          disabled={!batchBuyCart.canAfford}
          className="btn-primary shrink-0 px-4 py-2 text-[13px]"
        >
          Review &amp; Buy
        </button>
      </div>
    </motion.div>
  );

  const toggleChip = (active: boolean) =>
    `pressable inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors ${
      active ? 'bg-emerald-400/[0.16] text-emerald-300 hover:bg-emerald-400/[0.22]' : 'bg-[rgb(118_118_128/0.24)] text-slate-100 hover:bg-[rgb(118_118_128/0.32)]'
    }`;

  const renderCard = (item: MarketItem, idx: number) => {
    const price = nominalPrice(item, gameState.month, gameState.economy.inflationRate);
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

    let actions: React.ReactNode;
    if (item.canMortgage) {
      actions = (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { playClick(); setShowMortgageModal(item); setSelectedMortgage(''); }}
            disabled={!canMortgage || isLocked}
            className="btn-secondary flex-1 px-3 py-2 text-[14px]"
          >
            <Landmark size={15} aria-hidden />
            Finance
          </button>
          <button
            type="button"
            onClick={() => handleBuyAsset(item)}
            disabled={!canAffordCash || isLocked}
            className={`${canAffordCash && !isLocked ? 'btn-primary' : 'btn-secondary'} flex-1 px-3 py-2 text-[14px]`}
          >
            <Banknote size={15} aria-hidden />
            Cash
          </button>
        </div>
      );
    } else if (batchBuyMode && isBatchBuyEligible(item)) {
      if (isLocked) {
        actions = (
          <div className="w-full rounded-full bg-white/[0.05] py-2 text-center text-[14px] font-medium text-slate-500">
            Education Required
          </div>
        );
      } else {
        const qty = batchBuyQuantities[item.id] || 0;
        const lineCost = qty * price;
        const otherCost = batchBuyCart.totalCost - lineCost;
        const canAddOne = otherCost + (qty + 1) * price <= gameState.cash;
        const canBuyQty = qty > 0 && lineCost <= gameState.cash;
        const maxAffordable = Math.max(0, Math.floor(gameState.cash / price));

        actions = (
          <div className="rounded-[16px] bg-white/[0.045] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-left">
                <div className="text-[12px] text-slate-400">Quantity</div>
                <div className="num text-[15px] font-semibold text-white">
                  {qty}x
                  <span className="ml-2 font-medium text-slate-400">{qty > 0 ? formatMoneyFull(lineCost) : '—'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchQty(item.id, maxAffordable)}
                disabled={maxAffordable <= 0}
                className="pressable num rounded-full bg-[rgb(118_118_128/0.24)] px-3 py-1.5 text-[12px] font-semibold text-slate-200 transition-colors hover:bg-[rgb(118_118_128/0.32)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Buy max ({formatMoneyFull(maxAffordable * price)})
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {/* Capsule stepper, like iOS's UIStepper. */}
              <div className="flex shrink-0 items-center rounded-full bg-[rgb(118_118_128/0.24)] p-[3px]">
                <button
                  type="button"
                  onClick={() => setBatchQty(item.id, qty - 1)}
                  disabled={qty <= 0}
                  className="pressable grid h-8 w-8 place-items-center rounded-full text-[18px] font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
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
                  placeholder="0"
                  className="num h-8 w-11 appearance-none bg-transparent text-center text-[15px] font-semibold text-white outline-none placeholder:text-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label={`${item.name} quantity`}
                />
                <button
                  type="button"
                  onClick={() => setBatchQty(item.id, qty + 1)}
                  disabled={!canAddOne}
                  className="pressable grid h-8 w-8 place-items-center rounded-full text-[18px] font-semibold text-emerald-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
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
                variant={canBuyQty ? 'primary' : 'secondary'}
                size="md"
                disabled={!canBuyQty}
                className="num flex-1"
              >
                Buy {qty > 0 ? `${qty}x` : ''}
              </Button>
            </div>
          </div>
        );
      }
    } else {
      actions = (
        <Button
          onClick={() => handleBuyAsset(item)}
          disabled={!canAffordCash || isLocked}
          variant={canAffordCash && !isLocked ? 'primary' : 'secondary'}
          size="md"
          className="num min-w-[96px] shrink-0 whitespace-nowrap px-5"
        >
          {isLocked ? 'Education Required' : canAffordCash ? `Buy ${formatMoney(price)}` : 'Insufficient Funds'}
        </Button>
      );
    }

    const simpleBuy = !item.canMortgage && !(batchBuyMode && isBatchBuyEligible(item));

    return (
      <motion.div
        key={item.id}
        layout={MOTION_DISABLED ? false : 'position'}
        initial={MOTION_DISABLED ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0, transition: { ...springs.smooth, delay: Math.min(idx, 12) * 0.03 } }}
        exit={{ opacity: 0, scale: 0.96, transition: { type: 'spring', bounce: 0, duration: 0.22 } }}
        transition={springs.smooth}
        className={`relative flex flex-col rounded-[22px] border bg-[linear-gradient(180deg,rgb(255_255_255/0.05),rgb(255_255_255/0.018))] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_14px_32px_-22px_rgb(0_0_0/0.8)] transition-[border-color,background-color] duration-200 hover:bg-white/[0.04] ${
          isSelected ? 'border-sky-400/50' : 'border-white/[0.08] hover:border-white/[0.14]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-gradient-to-b ${ICON_TINT[item.type] || 'from-slate-500/30 to-slate-500/10'} text-[22px] leading-none shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]`}>
            {getAssetIcon(item.type)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h4 className="text-[15px] font-semibold leading-5 tracking-[-0.012em] text-white">{item.name}</h4>
            <p className="mt-0.5 text-[12px] leading-4 text-slate-400">
              {sentenceCase(item.type.replace('_', ' '))} · {sentenceCase(tier)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge variant={riskRating === 'LOW' ? 'low' : riskRating === 'MEDIUM' ? 'med' : 'high'}>
              {sentenceCase(riskRating)} risk
            </Badge>
            {compareMode && (
              <label className="flex cursor-pointer items-center gap-1.5 text-[12px] font-medium text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-sky-400"
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
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-[13px] leading-[18px] text-slate-400">{item.description}</p>

        {item.educationalNote && (
          <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-4 text-sky-300/90">
            <Lightbulb size={13} className="mt-px shrink-0" aria-hidden />
            <span>{item.educationalNote}</span>
          </p>
        )}

        {isLocked && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium leading-4 text-amber-300">
            <Lock size={12} className="shrink-0" aria-hidden />
            <span>
              Requires {requiredEducationLabel}
              {requiredLevelLabel ? ` (${requiredLevelLabel})` : ''}
            </span>
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="grid grid-cols-2 divide-x divide-white/[0.07] rounded-[14px] bg-white/[0.045]">
            <div className="px-3 py-2.5">
              <p className="text-[12px] leading-4 text-slate-400">Price</p>
              <p className="num mt-0.5 text-[18px] font-semibold leading-6 tracking-[-0.015em] text-white">{formatMoney(price)}</p>
            </div>
            <div className="px-3 py-2.5">
              <p className="truncate text-[12px] leading-4 text-slate-400">{incomeLabel(item.type, item.id)} / year</p>
              <p className="num mt-0.5 text-[18px] font-semibold leading-6 tracking-[-0.015em] text-emerald-400">{formatPercent(incomeYield(item))}/yr</p>
            </div>
          </div>
          <p className="num mt-2 px-1 text-[12px] leading-4 text-slate-400">{getPassiveIncome(item, price)} before costs and tax</p>

          {simpleBuy ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenGlossary}
                className="pressable -ml-1 min-w-0 truncate rounded-full px-1 py-1 text-left text-[12px] font-medium text-sky-400 hover:text-sky-300"
                title="Open glossary"
              >
                Glossary: APY, REIT, risk…
              </button>
              {actions}
            </div>
          ) : (
            <>
              <div className="mt-2 flex justify-start">
                <button
                  type="button"
                  onClick={onOpenGlossary}
                  className="pressable -ml-1 truncate rounded-full px-1 py-1 text-left text-[12px] font-medium text-sky-400 hover:text-sky-300"
                  title="Open glossary"
                >
                  Glossary: APY, REIT, risk…
                </button>
              </div>
              <div className="mt-2">{actions}</div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  const cards = visibleInvestments.map((item, idx) => renderCard(item, idx));

  return (
    <div className="relative">
      {/* Teaching note: one quiet callout, not a boxed wall of text. */}
      <div className="mb-5 flex gap-3 rounded-[18px] bg-white/[0.04] p-4 ring-1 ring-inset ring-white/[0.06]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-300">
          <Info size={16} aria-hidden />
        </span>
        <div className="min-w-0 text-[13px] leading-5 text-slate-300">
          <strong className="font-semibold text-white">Income and price growth are different.</strong> Interest, dividends, rent and profit can provide cash. A higher market price increases wealth, but you must sell to spend it. All rates below are fictional teaching assumptions, not live offers or guaranteed returns.
          <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-4 text-amber-300/90">
            <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />
            <span>{gameState.difficulty === 'EASY' ? 'Easy mode: investment prices cannot fall below 50% of purchase cost. This is a learning aid, not real protection.' : 'Prices can fall substantially, including below half the purchase price. Speculative investments can lose all their value.'}</span>
          </p>
        </div>
      </div>
      {guided && <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[15px] text-slate-300">Start by comparing savings, interest and dividends.</p><button onClick={() => setShowAllInvestments(true)} className="pressable inline-flex items-center gap-1 rounded-full bg-sky-500/15 py-2 pl-4 pr-3 text-[14px] font-semibold text-sky-300 transition-colors hover:bg-sky-500/25">Explore all 45 investments<ChevronRight size={16} aria-hidden /></button></div>}
      {showQuiz && quizQuestions.length > 0 && (
        <motion.div
          initial={MOTION_DISABLED ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
          className="surface mb-5 p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="t-headline text-white">{quizTitle || 'Quick investing quiz'}</p>
              <p className="mt-0.5 text-[13px] text-slate-400">{quizIntro || 'Answer a few questions to earn small bonuses.'}</p>
            </div>
            <button
              onClick={onSkipQuiz}
              className="pressable rounded-full px-3 py-1.5 text-[14px] font-medium text-sky-400 hover:bg-white/[0.06]"
            >
              Skip
            </button>
          </div>
          <div className="space-y-3">
            {quizQuestions.map((question, idx) => (
              <div key={question.id} className="rounded-[16px] bg-white/[0.045] p-3.5">
                <p className="mb-2.5 text-[14px] leading-5 text-slate-100"><span className="num text-slate-400">{idx + 1}.</span> {question.question}</p>
                <div className="flex flex-wrap gap-2">
                  {question.options.map((option) => {
                    const isSelected = quizAnswers[question.id] === option;
                    return (
                      <button
                        key={`${question.id}-${option}`}
                        onClick={() => onSelectQuizAnswer(question.id, option)}
                        aria-pressed={isSelected}
                        className={`pressable inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${isSelected
                          ? 'bg-emerald-400/[0.18] text-emerald-200 shadow-[inset_0_0_0_1px_rgb(48_209_88/0.5)]'
                          : 'bg-[rgb(118_118_128/0.2)] text-slate-200 hover:bg-[rgb(118_118_128/0.3)]'
                          }`}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} aria-hidden />}
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onSubmitQuiz}
              className="btn-primary px-5 py-2.5 text-[15px]"
            >
              Submit quiz
            </button>
            <span className="text-[12px] text-slate-500">Rewards are small and optional.</span>
          </div>
        </motion.div>
      )}
      {/* Filters: a floating toolbar (sticks under the header on wider screens). */}
      <div className="mat-bar z-20 mb-4 space-y-2 rounded-[20px] border border-white/[0.08] bg-[rgb(20_20_22/0.8)] p-2 shadow-[0_12px_30px_-18px_rgb(0_0_0/0.8)] md:sticky md:top-[5.25rem]">
        <motion.div layoutScroll className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 no-scrollbar [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] lg:[mask-image:none]">
          {CATEGORY_FILTERS.map(f => {
            const selected = investmentFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setInvestmentFilter(f.id)}
                aria-pressed={selected}
                className={`ds-button ds-button--sm relative shrink-0 whitespace-nowrap ${
                  selected ? 'ds-button--primary bg-transparent shadow-none hover:bg-transparent' : 'ds-button--secondary'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId={MOTION_DISABLED ? undefined : 'invest-filter-thumb'}
                    transition={springs.glide}
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[var(--accent)] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_6px_16px_-8px_rgb(48_209_88/0.7)]"
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            );
          })}
        </motion.div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            role="group"
            ariaLabel="Tier"
            size="sm"
            options={TIER_FILTERS}
            value={investmentTierFilter}
            onChange={(value) => setInvestmentTierFilter(value)}
          />
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="text"
              value={investmentSearch}
              onChange={(e) => setInvestmentSearch(e.target.value)}
              placeholder="Search investments"
              className={`h-9 w-full pl-8 ${investmentSearch ? 'pr-9' : 'pr-3'} ${fieldClass}`}
            />
            {investmentSearch && (
              <button
                onClick={() => setInvestmentSearch('')}
                aria-label="Clear"
                className="pressable absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-900"
              >
                <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-slate-400">
                  <X size={11} strokeWidth={3.2} aria-hidden />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-[13px] text-slate-400">
          Available: <span className="num font-semibold text-white">{formatMoney(gameState.cash)}</span> • <span className="num">{visibleInvestments.length}</span> investments
        </p>

        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleBatchBuyMode} aria-pressed={batchBuyMode} className={toggleChip(batchBuyMode)}>
            {batchBuyMode ? <Check size={15} strokeWidth={3} aria-hidden /> : <Layers size={15} aria-hidden />}
            Batch Buy{batchBuyMode && <span className="sr-only">: ON</span>}
          </button>
          <button
            type="button"
            onClick={() => {
              setCompareMode((prev) => !prev);
              if (compareMode) {
                setCompareSelection([]);
              }
            }}
            aria-pressed={compareMode}
            className={toggleChip(compareMode)}
          >
            {compareMode ? <Check size={15} strokeWidth={3} aria-hidden /> : <GitCompareArrows size={15} aria-hidden />}
            Compare{compareMode && <span className="sr-only">: ON</span>}
          </button>
        </div>
      </div>

      <div className="surface mb-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setAutoInvestOpen((prev) => !prev)}
            className="pressable -ml-1 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-[15px] font-semibold text-white"
            aria-expanded={autoInvestOpen}
          >
            <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-emerald-400/15 text-emerald-300">
              <ChevronRight size={16} className={`transition-transform duration-300 ease-spring ${autoInvestOpen ? 'rotate-90' : ''}`} aria-hidden />
            </span>
            Auto-Invest
          </button>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-300">
            Enable auto-invest
            <input
              type="checkbox"
              className="peer sr-only"
              checked={autoInvest.enabled}
              onChange={(e) => {
                onUpdateAutoInvest({ ...autoInvest, enabled: e.target.checked });
              }}
            />
            <SwitchVisual />
          </label>
        </div>
        {autoInvestOpen && (
          <motion.div
            key="auto-invest-body"
            initial={MOTION_DISABLED ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.smooth}
          >
          <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
            <p className="text-[13px] text-slate-400">
              Invest from last month’s disposable income when you hit Next Month.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[16px] bg-white/[0.045] p-3.5">
                <div className="flex items-center justify-between text-[13px] text-slate-400">
                  <span>Max auto-invest</span>
                  <span className="num font-medium text-slate-200">{autoInvest.maxPercent}% of disposable income</span>
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
                <p className="mt-2 text-[12px] text-slate-500">Round down always. Max 50%.</p>
              </div>

              <div className="rounded-[16px] bg-white/[0.045] p-3.5">
                <div className="flex items-center justify-between text-[13px] text-slate-400">
                  <span>Allocation total</span>
                  <span className="num font-medium text-slate-200">{autoTotalPercent}%</span>
                </div>
                <div className="mt-1.5 text-[12px] text-slate-500">
                  Remaining: <span className="num">{autoRemaining}%</span> • {autoRemaining === 0 ? 'Fully allocated' : 'Add more allocations'}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={autoAddId}
                    onChange={(e) => setAutoAddId(e.target.value)}
                    className={`h-9 flex-1 px-3 text-[13px] ${fieldClass}`}
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

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {AUTO_INVEST_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={`Apply ${preset.label} auto-invest preset`}
                  onClick={() => applyPreset(preset.id)}
                  className="surface-interactive rounded-[16px] border border-white/[0.06] bg-white/[0.045] px-3.5 py-3 text-left"
                >
                  <div className="text-[14px] font-semibold text-white">{preset.label}</div>
                  <div className="mt-1 text-[12px] leading-4 text-slate-400">{preset.description}</div>
                  <div className="mt-2 inline-flex items-center gap-0.5 text-[12px] font-semibold text-emerald-300">Apply preset<ChevronRight size={13} aria-hidden /></div>
                </button>
              ))}
            </div>

            {autoInvest.allocations.length === 0 ? (
              <p className="mt-4 text-[13px] text-slate-500">No allocations yet. Add investments to begin auto-investing.</p>
            ) : (
              <div className="list-group mt-4">
                {autoInvest.allocations.map((alloc) => {
                  const item = autoInvestOptions.find((entry) => entry.id === alloc.itemId);
                  if (!item) return null;
                  const price = nominalPrice(item, gameState.month, gameState.economy.inflationRate);
                  const totalWithout = autoTotalPercent - alloc.percent;
                  const maxAllowed = Math.max(0, 100 - totalWithout);

                  return (
                    <div key={alloc.itemId} className="list-row flex-col items-stretch gap-2 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[14px] font-semibold text-white">{item.name}</p>
                          <p className="num text-[12px] text-slate-500">Price: {formatMoney(price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAutoInvest({
                              ...autoInvest,
                              allocations: autoInvest.allocations.filter((entry) => entry.itemId !== alloc.itemId)
                            });
                          }}
                          className="pressable rounded-full bg-rose-500/[0.14] px-3 py-1 text-[12px] font-semibold text-rose-300 hover:bg-rose-500/[0.22]"
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
                        <div className="num w-12 text-right text-[13px] font-semibold text-slate-200">{alloc.percent}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </motion.div>
        )}
      </div>

      {compareMode && (
        <motion.div
          key="compare-panel"
          initial={MOTION_DISABLED ? false : { opacity: 0, y: -6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springs.smooth}
          className="surface mb-5 p-4 sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="t-headline text-white">Compare investments</p>
              <p className="mt-0.5 text-[13px] text-slate-400">
                Select up to three options to compare key metrics.
              </p>
            </div>
            <div className="num self-start rounded-full bg-[rgb(118_118_128/0.24)] px-3 py-1 text-[12px] font-semibold text-slate-200 sm:self-auto">
              Selected: {compareSelection.length}/3
            </div>
          </div>

          {selectedInvestments.length === 0 ? (
            <p className="mt-3 text-[13px] text-slate-500">Pick investments below to see the comparison table.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-[14px] bg-white/[0.035]">
              <table className="w-full text-[13px] text-slate-300">
                <thead>
                  <tr className="text-[12px] text-slate-400">
                    <th className="px-3 py-2.5 text-left font-medium">Metric</th>
                    {selectedInvestments.map((item) => (
                      <th key={`compare-${item.id}`} className="px-3 py-2.5 text-left font-semibold text-white">
                        {item.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&>tr]:border-t [&>tr]:border-white/[0.06]">
                  <tr>
                    <td className="px-3 py-2.5 text-slate-400">Cost</td>
                    {selectedInvestments.map((item) => {
                      const price = nominalPrice(item, gameState.month, gameState.economy.inflationRate);
                      return (
                        <td key={`cost-${item.id}`} className="num px-3 py-2.5 font-semibold text-white">
                          {formatMoney(price)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-slate-400">Cash income rate</td>
                    {selectedInvestments.map((item) => (
                      <td key={`return-${item.id}`} className="num px-3 py-2.5 font-semibold text-emerald-400">
                        {formatPercent(incomeYield(item))}/yr
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-slate-400">Risk rating</td>
                    {selectedInvestments.map((item) => (
                      <td key={`risk-${item.id}`} className="px-3 py-2.5">
                        {getRiskRating(item)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-slate-400">Lock-up period</td>
                    {selectedInvestments.map((item) => (
                      <td key={`lockup-${item.id}`} className="px-3 py-2.5">
                        {getLockupPeriod(item)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-slate-400">Dividends / passive</td>
                    {selectedInvestments.map((item) => {
                      const price = nominalPrice(item, gameState.month, gameState.economy.inflationRate);
                      return (
                        <td key={`income-${item.id}`} className="num px-3 py-2.5">
                          {getPassiveIncome(item, price)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Investment grid: cards reflow on a spring when the filter changes. */}
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MOTION_DISABLED ? cards : <AnimatePresence mode="popLayout" initial={true}>{cards}</AnimatePresence>}
      </div>

      {/* The batch cart floats over the catalogue as a translucent bar, springing up when it fills. */}
      {MOTION_DISABLED ? cartBar : <AnimatePresence>{cartBar}</AnimatePresence>}
    </div>
  );
};

export default InvestTab;
