import { incomeYield, nominalPrice } from '../services/investmentModel';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import type confetti from 'canvas-confetti';
import { GameState, AssetType, MarketItem, Asset } from '../types';
import { MARKET_ITEMS } from '../constants';
import { playClick, playPurchase, playMoneyLoss } from '../services/audioService';
import { formatCurrencyValue } from '../i18n';
import type { ConfirmDialogConfig } from '../components/modals/ConfirmDialogModal';

// Mirrors the module-scope helper in App.tsx (same one-liner over the shared
// i18n formatter). Do NOT import it from '../App' — that creates a cycle.
const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });

interface BatchBuyDeps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  showNotif: (
    title: string,
    message: string,
    type?: string,
    opts?: { actionLabel?: string; onAction?: () => void; durationMs?: number }
  ) => void;
  openConfirmDialog: (cfg: ConfirmDialogConfig) => void;
  setFloatingNumbers: Dispatch<SetStateAction<{ id: string; value: number }[]>>;
  maybeConfetti: (opts: Parameters<typeof confetti>[0]) => void;
}

// Phase-3 slice 5: the batch-buy (securities) cluster from App.tsx — cart
// mode + quantities, the priced cart memo, and the toggle/clear/confirm/
// execute handlers. The handlers are deliberately PLAIN functions (no
// useCallback): InvestTab's "Buy Nx" button replaces the cart and defers
// openBatchBuyConfirm via setTimeout(0), relying on today's fresh-per-render
// closure semantics. No recordAutosave here on purpose — a batch buy
// persists indirectly when the quest/event-sync effect sees the prepended
// '📦 Batch Purchase' event and autosaves. The fixed "Batch Cart" bar JSX
// stays in App (it reads App-owned activeTab).
export const useBatchBuy = (deps: BatchBuyDeps) => {
  const { gameState, setGameState, showNotif, openConfirmDialog, setFloatingNumbers, maybeConfetti } = deps;

  // Batch buying (securities): build a small 'cart' and confirm once
  const [batchBuyMode, setBatchBuyMode] = useState(false);
  const [batchBuyQuantities, setBatchBuyQuantities] = useState<Record<string, number>>({});

  const batchBuyCart = useMemo(() => {
    const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);

    const lines = Object.entries(batchBuyQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = MARKET_ITEMS.find(i => i.id === id);
        if (!item) return null;

        const unitPrice = nominalPrice(item, gameState.month, gameState.economy.inflationRate);
        return {
          id,
          item,
          qty,
          unitPrice,
          lineTotal: unitPrice * qty
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        item: MarketItem;
        qty: number;
        unitPrice: number;
        lineTotal: number;
      }>;

    const totalCost = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const totalUnits = lines.reduce((sum, l) => sum + l.qty, 0);

    return {
      lines,
      totalCost,
      totalUnits,
      canAfford: totalCost <= gameState.cash
    };
  }, [batchBuyQuantities, gameState.cash, gameState.economy.inflationRate, gameState.month]);

  const isBatchBuyEligible = (item: MarketItem) => {
    return [
      AssetType.STOCK,
      AssetType.INDEX_FUND,
      AssetType.BOND,
      AssetType.CRYPTO,
      AssetType.COMMODITY
    ].includes(item.type);
  };

  const toggleBatchBuyMode = () => {
    playClick();
    setBatchBuyMode(prev => {
      const next = !prev;
      if (!next) {
        setBatchBuyQuantities({});
      }
      return next;
    });
  };

  const setBatchQty = (itemId: string, qty: number) => {
    setBatchBuyQuantities(prev => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = qty;
      }
      return next;
    });
  };

  const clearBatchBuyCart = () => {
    playClick();
    setBatchBuyQuantities({});
  };

  const executeBatchBuy = () => {
    if (batchBuyCart.lines.length === 0) {
      showNotif('Cart Empty', 'Select quantities on securities first.', 'warning');
      return;
    }

    if (!batchBuyCart.canAfford) {
      showNotif(
        'Not Enough Cash',
        `Total is ${formatMoneyFull(batchBuyCart.totalCost)} but you only have ${formatMoneyFull(gameState.cash)}.`,
        'error'
      );
      return;
    }

    playPurchase();

    setGameState(prev => {
      const inflationMult = Math.pow(1 + prev.economy.inflationRate, prev.month / 12);

      let cash = prev.cash;
      let assets = [...prev.assets];
      let totalSpent = 0;

      const purchased: string[] = [];

      for (const line of batchBuyCart.lines) {
        const item = line.item;
        if (!isBatchBuyEligible(item)) continue;

        const unitPrice = nominalPrice(item, prev.month, prev.economy.inflationRate);
        const qty = Math.max(1, line.qty);
        const lineTotal = unitPrice * qty;

        if (cash < lineTotal) break;

        cash -= lineTotal;
        totalSpent += lineTotal;
        purchased.push(`${qty}x ${item.name}`);

        const existing = assets.find(a => a.name === item.name && a.type === item.type && !a.mortgageId);
        if (existing) {
          const prevQty = typeof existing.quantity === 'number' ? existing.quantity : 1;
          const newQty = prevQty + qty;
          const newCostBasis = ((existing.costBasis * prevQty) + (unitPrice * qty)) / newQty;

          assets = assets.map(a => a.id === existing.id ? {
            ...a,
            quantity: newQty,
            costBasis: newCostBasis,
            value: unitPrice,
            cashFlow: (incomeYield(item) * unitPrice) / 12,
            purchasePrice: unitPrice
          } : a);
        } else {
          const baseMonthly = (incomeYield(item) * unitPrice) / 12;
          const newAsset: Asset = {
            id: 'asset-' + Date.now().toString() + '-' + item.id,
            name: item.name,
            type: item.type,
            value: unitPrice,
            costBasis: unitPrice,
            quantity: qty,
            appreciationRate: item.appreciationRate || (incomeYield(item) * 0.4),
            volatility: item.volatility,
            baseYield: incomeYield(item),
          marketItemId: item.id,
          incomeModelVersion: 2,
            cashFlow: baseMonthly,
            purchasedMonth: prev.month,
            purchasePrice: unitPrice,
            industry: item.industry,
            description: item.description,
            priceHistory: [{ month: prev.month, value: unitPrice }],
            opsUpgrade: item.type === AssetType.BUSINESS ? false : undefined,
            currentMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly * qty) : undefined,
            lastMonthIncome: item.type === AssetType.BUSINESS ? Math.round(baseMonthly * qty) : undefined
          };
          assets.push(newAsset);
        }
      }

      if (totalSpent <= 0) return prev;

      return {
        ...prev,
        cash,
        assets,
        events: [{
          id: Date.now().toString(),
          month: prev.month,
          title: '📦 Batch Purchase',
          description: `Bought ${purchased.join(', ')} for ${formatMoneyFull(totalSpent)} total.`,
          type: 'DECISION'
        }, ...prev.events]
      };
    });

    setFloatingNumbers(p => [...p, { id: Date.now().toString(), value: -batchBuyCart.totalCost }]);
    playMoneyLoss();
    showNotif(
      'Batch Purchase Complete!',
      `Bought ${batchBuyCart.lines.length} ${batchBuyCart.lines.length === 1 ? 'security' : 'securities'} for ${formatMoneyFull(batchBuyCart.totalCost)}.`,
      'success'
    );

    maybeConfetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

    // Clear cart (keep mode on for rapid re-buying)
    setBatchBuyQuantities({});
  };

  const openBatchBuyConfirm = () => {
    if (batchBuyCart.lines.length === 0) {
      showNotif('Cart Empty', 'Select quantities on securities first.', 'warning');
      return;
    }

    const details = batchBuyCart.lines.map(l => ({
      label: `${l.qty}x ${l.item.name}`,
      value: `${formatMoneyFull(l.lineTotal)} (${formatMoneyFull(l.unitPrice)} each)`
    }));

    details.push({
      label: 'TOTAL',
      value: formatMoneyFull(batchBuyCart.totalCost)
    });

    openConfirmDialog({
      title: 'Confirm Batch Purchase',
      description: 'You are about to buy the following securities:',
      details,
      confirmLabel: `Buy (${formatMoneyFull(batchBuyCart.totalCost)})`,
      cancelLabel: 'Cancel',
      onConfirm: executeBatchBuy
    });
  };

  return {
    batchBuyMode,
    batchBuyQuantities,
    setBatchBuyQuantities,
    batchBuyCart,
    isBatchBuyEligible,
    toggleBatchBuyMode,
    setBatchQty,
    clearBatchBuyCart,
    openBatchBuyConfirm
  };
};
