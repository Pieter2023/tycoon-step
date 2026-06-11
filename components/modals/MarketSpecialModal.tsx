import React from 'react';
import Modal from '../Modal';
import { AssetType, GameState } from '../../types';
import { MARKET_ITEMS } from '../../constants';
import { formatCurrencyValue } from '../../i18n';

const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });

export type MarketSpecialAction =
  | {
      type: 'BUY_DISCOUNT';
      budget: number;
      discount: number; // e.g. 0.3 = 30% off
      title: string;
      description: string;
      allowedTypes?: AssetType[];
    }
  | {
      type: 'PANIC_SELL';
      discount: number; // e.g. 0.3 = 30% fire-sale haircut
      title: string;
      description: string;
    };

// Buy the Dip / Panic Sell event modal. Controlled: selection state and the
// execute handlers live in App (the handlers read the selections directly).
interface MarketSpecialModalProps {
  action: MarketSpecialAction;
  gameState: GameState;
  discountBuyItemId: string | null;
  setDiscountBuyItemId: (id: string | null) => void;
  discountBuyQuantity: number;
  setDiscountBuyQuantity: React.Dispatch<React.SetStateAction<number>>;
  panicSellSelection: Record<string, boolean>;
  setPanicSellSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onExecuteDiscountBuy: () => void;
  onExecutePanicSell: () => void;
  onClose: () => void;
}

const MarketSpecialModal: React.FC<MarketSpecialModalProps> = ({
  action,
  gameState,
  discountBuyItemId,
  setDiscountBuyItemId,
  discountBuyQuantity,
  setDiscountBuyQuantity,
  panicSellSelection,
  setPanicSellSelection,
  onExecuteDiscountBuy,
  onExecutePanicSell,
  onClose
}) => (
  <Modal
    isOpen
    onClose={onClose}
    ariaLabel="Market special action"
    overlayClassName="bg-black/80 backdrop-blur-sm"
    overlayStyle={{
      paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
    }}
    contentClassName="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
    closeOnOverlayClick
    closeOnEsc
  >
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-xl font-bold text-white">{action.title}</h3>
        <p className="text-slate-300 text-sm mt-1">{action.description}</p>
      </div>
    </div>

    {action.type === 'BUY_DISCOUNT' && (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="text-slate-300">
            Budget: <span className="text-white font-semibold">{formatMoneyFull(action.budget)}</span>
            <span className="text-slate-400"> • Cash: {formatMoneyFull(gameState.cash)}</span>
          </div>
          <div className="text-slate-400">
            Discount: <span className="text-white font-semibold">{Math.round(action.discount * 100)}%</span>
          </div>
        </div>

        {(() => {
          const inflationMult = Math.pow(1 + gameState.economy.inflationRate, gameState.month / 12);
          const cap = Math.min(gameState.cash, action.budget);

          const deals = MARKET_ITEMS
            .filter(i => i.type !== AssetType.SAVINGS)
            .map(i => {
              const base = Math.round(i.price * inflationMult);
              const discounted = Math.max(1, Math.round(base * (1 - action.discount)));
              const singleUnit = i.type === AssetType.REAL_ESTATE || i.type === AssetType.BUSINESS;
              const maxUnits = singleUnit ? (discounted <= cap ? 1 : 0) : Math.floor(cap / discounted);
              return {
                item: i,
                base,
                discounted,
                singleUnit,
                maxUnits,
                affordable: maxUnits > 0
              };
            })
            .sort((a, b) => Number(b.affordable) - Number(a.affordable) || a.discounted - b.discounted)
            .slice(0, 18);

          if (deals.length === 0) {
            return (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-300">
                No deals available right now.
              </div>
            );
          }

          const selected = deals.find(d => d.item.id === discountBuyItemId) || null;

          return (
            <>
              <div className="grid gap-2">
                {deals.map(d => {
                  const isSelected = discountBuyItemId === d.item.id;
                  return (
                    <button
                      key={d.item.id}
                      onClick={() => {
                        setDiscountBuyItemId(d.item.id);
                        if (d.singleUnit) {
                          setDiscountBuyQuantity(1);
                        } else {
                          setDiscountBuyQuantity((q) => Math.min(Math.max(1, q), Math.max(1, d.maxUnits)));
                        }
                      }}
                      className={`text-left p-3 rounded-xl border transition ${
                        isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-white font-semibold">{d.item.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{d.item.description}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            <span className="line-through">{formatMoneyFull(d.base)}</span>
                            <span className="ml-2 text-white font-semibold">{formatMoneyFull(d.discounted)}</span>
                            <span className="ml-2 text-slate-400">({Math.round(action.discount * 100)}% off)</span>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className={`font-semibold ${d.affordable ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {d.affordable ? `Max ${d.singleUnit ? 1 : d.maxUnits}` : 'Too expensive'}
                          </div>
                          <div className="text-slate-400 mt-1">
                            ~{formatMoneyFull((d.item.expectedYield * d.discounted) / 12)}/mo
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                {!selected ? (
                  <div className="text-slate-300 text-sm">Select a deal above to continue.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-slate-200 font-semibold">{selected.item.name}</div>
                      {selected.singleUnit ? (
                        <div className="text-slate-300 text-sm">Qty: <span className="text-white font-semibold">1</span></div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            className="w-9 h-9 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white font-bold"
                            onClick={() => setDiscountBuyQuantity(q => Math.max(1, q - 1))}
                            disabled={discountBuyQuantity <= 1}
                          >
                            −
                          </button>
                          <div className="min-w-[3rem] text-center text-white font-semibold">{discountBuyQuantity}</div>
                          <button
                            className="w-9 h-9 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white font-bold"
                            onClick={() => setDiscountBuyQuantity(q => Math.min(selected.maxUnits, q + 1))}
                            disabled={discountBuyQuantity >= selected.maxUnits}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-300">
                        Total:
                      </div>
                      <div className="text-white font-semibold">
                        {formatMoneyFull(selected.discounted * (selected.singleUnit ? 1 : discountBuyQuantity))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onExecuteDiscountBuy}
                        className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                      >
                        Buy on Sale
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    )}

    {action.type === 'PANIC_SELL' && (
      <div className="space-y-4">
        {(() => {
          const assets = gameState.assets || [];
          if (assets.length === 0) {
            return (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-300">
                You have no assets to sell.
              </div>
            );
          }

          const selectedIds = Object.entries(panicSellSelection).filter(([, v]) => !!v).map(([id]) => id);
          const preview = (() => {
            let net = 0;
            for (const id of selectedIds) {
              const a = assets.find(x => x.id === id);
              if (!a) continue;
              const qty = typeof a.quantity === 'number' ? a.quantity : 1;
              const gross = a.value * qty;
              const fireSale = Math.round(gross * (1 - action.discount));

              const mtg = a.mortgageId
                ? (gameState.mortgages.find(m => m.id === a.mortgageId) || gameState.mortgages.find(m => m.assetId === id))
                : gameState.mortgages.find(m => m.assetId === id);

              if (mtg) {
                net += Math.max(0, fireSale - mtg.balance);
              } else {
                net += fireSale;
              }
            }
            return net;
          })();

          return (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const sel: Record<string, boolean> = {};
                    assets.forEach(a => { sel[a.id] = true; });
                    setPanicSellSelection(sel);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold"
                >
                  Select all
                </button>
                <button
                  onClick={() => setPanicSellSelection({})}
                  className="px-4 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold"
                >
                  Clear
                </button>
                <div className="sm:ml-auto px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-200">
                  Est. cash received: <span className="text-white font-semibold">{formatMoneyFull(preview)}</span>
                </div>
              </div>

              <div className="grid gap-2">
                {assets.map(a => {
                  const checked = !!panicSellSelection[a.id];
                  const qty = typeof a.quantity === 'number' ? a.quantity : 1;
                  const gross = a.value * qty;
                  const fireSale = Math.round(gross * (1 - action.discount));

                  const mtg = a.mortgageId
                    ? (gameState.mortgages.find(m => m.id === a.mortgageId) || gameState.mortgages.find(m => m.assetId === a.id))
                    : gameState.mortgages.find(m => m.assetId === a.id);

                  const net = mtg ? Math.max(0, fireSale - mtg.balance) : fireSale;

                  return (
                    <label
                      key={a.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700 hover:bg-slate-800/60 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setPanicSellSelection(prev => ({ ...prev, [a.id]: e.target.checked }))}
                        className="mt-1 w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="text-white font-semibold">{a.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Value: {formatMoneyFull(gross)} → Fire-sale: {formatMoneyFull(fireSale)}
                          {mtg ? ` • Mortgage: ${formatMoneyFull(mtg.balance)} • Net: ${formatMoneyFull(net)}` : ` • Net: ${formatMoneyFull(net)}`}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={onExecutePanicSell}
                  disabled={selectedIds.length === 0}
                  className="flex-1 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/40 text-white font-semibold"
                >
                  Execute Fire Sale
                </button>
              </div>
            </>
          );
        })()}
      </div>
    )}
  </Modal>
);

export default MarketSpecialModal;
