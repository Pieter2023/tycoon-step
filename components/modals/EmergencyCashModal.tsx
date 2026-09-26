import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal';
import { Asset, GameState } from '../../types';
import { formatCurrencyCompactValue } from '../../i18n';
import { SheetEmblem, SheetItem, SheetStagger } from './sheet';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

// Cash emergency: out of cash but holding assets — offer 50%-value fire sales.
// Blocking until cash goes positive (or bankruptcy ends the game).
interface EmergencyCashModalProps {
  gameState: GameState;
  /** Fire-sale the asset; netValue is the mortgage-adjusted payout. */
  onSell: (asset: Asset, netValue: number) => void;
}

const EmergencyCashModal: React.FC<EmergencyCashModalProps> = ({ gameState, onSell }) => {
  const credit = gameState.creditRating || 650;
  const missed = gameState.missedPayments || 0;
  return (
    <Modal
      isOpen
      onClose={() => undefined}
      ariaLabel="Cash emergency"
      overlayClassName="bg-black/70"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showCloseButton={false}
      contentClassName="max-w-lg overflow-hidden"
    >
      {/* A warm wash of warning light across the top of the sheet. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(120%_100%_at_50%_0%,rgb(255_159_10/0.22),transparent_70%)]" />
      <SheetStagger className="relative px-5 pb-5 pt-7 sm:px-6" gap={0.045}>
        <SheetItem className="text-center">
          <SheetEmblem className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-amber-400/[0.18] text-amber-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
            <AlertTriangle size={30} strokeWidth={2.2} aria-hidden />
          </SheetEmblem>
          <h2 className="t-title-1 mt-4 text-amber-300">Cash Emergency!</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[15px] leading-snug text-slate-200">You're out of cash but have assets. Sell at 50% value to survive.</p>
          <p className="mt-3 text-[13px] text-slate-400">
            Credit Rating:{' '}
            <span className={`num rounded-full px-2 py-0.5 font-bold ${credit > 600 ? 'bg-emerald-400/[0.14] text-emerald-300' : 'bg-red-500/[0.14] text-red-300'}`}>{credit}</span>
          </p>
        </SheetItem>

        <SheetItem className="mt-5">
          <div className="list-group max-h-72 overflow-y-auto overscroll-contain">
            {gameState.assets.map(asset => {
              const emergencyValue = Math.round(asset.costBasis * 0.5 * asset.quantity);
              const mortgage = asset.mortgageId
                ? (gameState.mortgages.find(m => m.id === asset.mortgageId) || gameState.mortgages.find(m => m.assetId === asset.id))
                : gameState.mortgages.find(m => m.assetId === asset.id);
              const netValue = mortgage ? Math.max(0, emergencyValue - mortgage.balance) : emergencyValue;

              return (
                <div key={asset.id} className="list-row justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-white">{asset.name}</p>
                    <p className="num text-[13px] text-slate-400">Emergency Sale: {formatMoney(emergencyValue)}</p>
                    {mortgage && <p className="num text-[12px] text-red-300">Net after mortgage: {formatMoney(netValue)}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSell(asset, netValue)}
                    disabled={netValue <= 0}
                    className="pressable num shrink-0 rounded-full bg-amber-400 px-4 py-2 text-[14px] font-semibold text-[#241300] shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-[rgb(118_118_128/0.24)] disabled:text-slate-500 disabled:shadow-none"
                  >
                    Sell for {formatMoney(netValue)}
                  </button>
                </div>
              );
            })}
          </div>
        </SheetItem>

        <SheetItem className="mt-4 flex flex-col items-center gap-2">
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-1.5 w-8 rounded-full ${i < missed ? 'bg-red-500' : 'bg-[rgb(118_118_128/0.3)]'}`} />
            ))}
          </div>
          <p className="num text-center text-[13px] font-medium text-red-300">
            ⚠️ {3 - missed} missed payments until bankruptcy
          </p>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default EmergencyCashModal;
