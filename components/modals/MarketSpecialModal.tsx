import { incomeYield } from '../../services/investmentModel';
import React from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import Modal from '../Modal';
import { AssetType, GameState } from '../../types';
import { MARKET_ITEMS } from '../../constants';
import { formatCurrencyValue } from '../../i18n';
import { SheetItem, SheetStagger } from './sheet';

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

/** A round check mark (the look of a selected row in an Apple list). */
const CheckCircle: React.FC<{ on: boolean; tint?: 'green' | 'red' }> = ({ on, tint = 'green' }) => (
  <span
    aria-hidden
    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
      on ? (tint === 'red' ? 'bg-[#ff453a] text-white' : 'bg-emerald-400 text-[#03170a]') : 'ring-[1.5px] ring-inset ring-slate-600'
    }`}
  >
    {on && <Check size={14} strokeWidth={3} />}
  </span>
);

const emptyNote = 'rounded-[16px] bg-white/[0.04] p-4 text-[15px] text-slate-300';

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
    overlayClassName="bg-black/60"
    overlayStyle={{
      paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
    }}
    contentClassName="max-w-2xl!"
    closeOnOverlayClick
    closeOnEsc
  >
    <SheetStagger className="px-5 pb-5 pt-6 sm:px-6" gap={0.03}>
      <SheetItem className="pr-10">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${
            action.type === 'BUY_DISCOUNT' ? 'bg-emerald-400/[0.15] text-emerald-300' : 'bg-red-500/[0.15] text-red-300'
          }`}
        >
          <span className="num">−{Math.round(action.discount * 100)}%</span>
        </span>
        <h3 className="t-title-2 mt-2 text-white">{action.title}</h3>
        <p className="mt-1 text-[15px] leading-snug text-slate-400">{action.description}</p>
      </SheetItem>

      {action.type === 'BUY_DISCOUNT' && (
        <div className="mt-4 space-y-4">
          <SheetItem className="flex flex-wrap items-center justify-between gap-2 px-1 text-[14px]">
            <div className="num text-slate-400">
              Budget: <span className="font-semibold text-white">{formatMoneyFull(action.budget)}</span>
              <span className="text-slate-500"> • Cash: {formatMoneyFull(gameState.cash)}</span>
            </div>
            <div className="num text-slate-400">
              Discount: <span className="font-semibold text-white">{Math.round(action.discount * 100)}%</span>
            </div>
          </SheetItem>

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
                <div className={emptyNote}>
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
                      <SheetItem key={d.item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountBuyItemId(d.item.id);
                            if (d.singleUnit) {
                              setDiscountBuyQuantity(1);
                            } else {
                              setDiscountBuyQuantity((q) => Math.min(Math.max(1, q), Math.max(1, d.maxUnits)));
                            }
                          }}
                          className={`surface-interactive w-full rounded-[16px] p-3.5 text-left ${
                            isSelected
                              ? 'bg-emerald-400/[0.09] shadow-[inset_0_0_0_1.5px_rgb(48_209_88/0.7)] hover:bg-emerald-400/[0.12]'
                              : 'bg-white/[0.05] hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5"><CheckCircle on={isSelected} /></span>
                            <div className="min-w-0 flex-1">
                              <div className="text-[15px] font-semibold text-white">{d.item.name}</div>
                              <div className="mt-0.5 text-[13px] leading-snug text-slate-400">{d.item.description}</div>
                              <div className="num mt-1.5 text-[13px] text-slate-400">
                                <span className="line-through decoration-slate-500">{formatMoneyFull(d.base)}</span>
                                <span className="ml-2 font-semibold text-white">{formatMoneyFull(d.discounted)}</span>
                                <span className="ml-2 text-slate-500">({Math.round(action.discount * 100)}% off)</span>
                              </div>
                            </div>
                            <div className="shrink-0 text-right text-[12px]">
                              <div className={`num font-semibold ${d.affordable ? 'text-emerald-300' : 'text-rose-300'}`}>
                                {d.affordable ? `Max ${d.singleUnit ? 1 : d.maxUnits}` : 'Too expensive'}
                              </div>
                              <div className="num mt-1 text-slate-400">
                                ~{formatMoneyFull((incomeYield(d.item) * d.discounted) / 12)}/mo
                              </div>
                            </div>
                          </div>
                        </button>
                      </SheetItem>
                    );
                  })}
                </div>

                {/* The order: sits at the foot of the sheet while you scroll the deals. */}
                <div className="sticky bottom-0 z-[1] -mx-5 border-t border-white/[0.08] bg-[rgb(30_30_33/0.94)] px-5 pb-1 pt-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
                  {!selected ? (
                    <div className="pb-3 text-center text-[14px] text-slate-400">Select a deal above to continue.</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 truncate text-[15px] font-semibold text-slate-200">{selected.item.name}</div>
                        {selected.singleUnit ? (
                          <div className="text-[14px] text-slate-400">Qty: <span className="num font-semibold text-white">1</span></div>
                        ) : (
                          <div className="flex items-center rounded-full bg-[rgb(118_118_128/0.24)] p-0.5">
                            <button
                              type="button"
                              aria-label="−"
                              className="pressable flex h-8 w-10 items-center justify-center rounded-full text-white hover:bg-white/[0.08] disabled:opacity-35"
                              onClick={() => setDiscountBuyQuantity(q => Math.max(1, q - 1))}
                              disabled={discountBuyQuantity <= 1}
                            >
                              <Minus size={16} strokeWidth={2.6} />
                            </button>
                            <div className="num min-w-[2.75rem] text-center text-[15px] font-semibold text-white">{discountBuyQuantity}</div>
                            <button
                              type="button"
                              aria-label="+"
                              className="pressable flex h-8 w-10 items-center justify-center rounded-full text-white hover:bg-white/[0.08] disabled:opacity-35"
                              onClick={() => setDiscountBuyQuantity(q => Math.min(selected.maxUnits, q + 1))}
                              disabled={discountBuyQuantity >= selected.maxUnits}
                            >
                              <Plus size={16} strokeWidth={2.6} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[14px]">
                        <div className="text-slate-400">
                          Total:
                        </div>
                        <div className="num text-[17px] font-bold text-white">
                          {formatMoneyFull(selected.discounted * (selected.singleUnit ? 1 : discountBuyQuantity))}
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button type="button" onClick={onClose} className="btn-secondary min-h-[46px] flex-1 px-4 text-[15px]">
                          Cancel
                        </button>
                        <button type="button" onClick={onExecuteDiscountBuy} className="btn-primary min-h-[46px] flex-1 px-4 text-[15px]">
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
        <div className="mt-4 space-y-4">
          {(() => {
            const assets = gameState.assets || [];
            if (assets.length === 0) {
              return (
                <div className={emptyNote}>
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
                <SheetItem className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sel: Record<string, boolean> = {};
                      assets.forEach(a => { sel[a.id] = true; });
                      setPanicSellSelection(sel);
                    }}
                    className="pressable rounded-full bg-[rgb(118_118_128/0.24)] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[rgb(118_118_128/0.36)]"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanicSellSelection({})}
                    className="pressable rounded-full px-4 py-2 text-[14px] font-semibold text-[#0a84ff] hover:bg-[rgb(118_118_128/0.18)]"
                  >
                    Clear
                  </button>
                  <div className="num ml-auto text-[14px] text-slate-400">
                    Est. cash received: <span className="text-[16px] font-bold text-white">{formatMoneyFull(preview)}</span>
                  </div>
                </SheetItem>

                <SheetItem>
                  <div className="list-group">
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
                          className={`list-row cursor-pointer items-start py-3 transition-colors ${checked ? 'bg-red-500/[0.07]' : 'hover:bg-white/[0.03]'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setPanicSellSelection(prev => ({ ...prev, [a.id]: e.target.checked }))}
                            className="peer sr-only"
                          />
                          <span className="mt-0.5 rounded-full peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgb(10_132_255/0.75)]">
                            <CheckCircle on={checked} tint="red" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[15px] font-semibold text-white">{a.name}</div>
                            <div className="num mt-0.5 text-[13px] leading-snug text-slate-400">
                              Value: {formatMoneyFull(gross)} → Fire-sale: {formatMoneyFull(fireSale)}
                              {mtg ? ` • Mortgage: ${formatMoneyFull(mtg.balance)} • Net: ${formatMoneyFull(net)}` : ` • Net: ${formatMoneyFull(net)}`}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </SheetItem>

                <SheetItem className="flex gap-2.5">
                  <button type="button" onClick={onClose} className="btn-secondary min-h-[46px] flex-1 px-4 text-[15px]">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onExecutePanicSell}
                    disabled={selectedIds.length === 0}
                    className="pressable min-h-[46px] flex-1 rounded-full bg-[#ff453a] px-4 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_22px_-10px_rgb(255_69_58/0.7)] hover:bg-[#ff5b51] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#ff453a]"
                  >
                    Execute Fire Sale
                  </button>
                </SheetItem>
              </>
            );
          })()}
        </div>
      )}
    </SheetStagger>
  </Modal>
);

export default MarketSpecialModal;
