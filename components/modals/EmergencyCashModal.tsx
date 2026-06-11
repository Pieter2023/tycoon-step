import React from 'react';
import Modal from '../Modal';
import { Asset, GameState } from '../../types';
import { formatCurrencyCompactValue, formatCurrencyValue } from '../../i18n';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);
const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });

// Cash emergency: out of cash but holding assets — offer 50%-value fire sales.
// Blocking until cash goes positive (or bankruptcy ends the game).
interface EmergencyCashModalProps {
  gameState: GameState;
  /** Fire-sale the asset; netValue is the mortgage-adjusted payout. */
  onSell: (asset: Asset, netValue: number) => void;
}

const EmergencyCashModal: React.FC<EmergencyCashModalProps> = ({ gameState, onSell }) => (
  <Modal
    isOpen
    onClose={() => undefined}
    ariaLabel="Cash emergency"
    overlayClassName="bg-black/80"
    closeOnOverlayClick={false}
    closeOnEsc={false}
    showCloseButton={false}
    contentClassName="bg-gradient-to-br from-amber-900/50 to-red-900/50 border border-amber-500/50 rounded-2xl p-6 max-w-lg w-full"
  >
    <div className="text-center mb-4">
      <div className="text-5xl mb-2">⚠️</div>
      <h2 className="text-2xl font-bold text-amber-400">Cash Emergency!</h2>
      <p className="text-white">You're out of cash but have assets. Sell at 50% value to survive.</p>
      <p className="text-slate-400 text-sm mt-2">Credit Rating: <span className={`font-bold ${(gameState.creditRating || 650) > 600 ? 'text-green-400' : 'text-red-400'}`}>{gameState.creditRating || 650}</span></p>
    </div>
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {gameState.assets.map(asset => {
        const emergencyValue = Math.round(asset.costBasis * 0.5 * asset.quantity);
        const mortgage = asset.mortgageId
          ? (gameState.mortgages.find(m => m.id === asset.mortgageId) || gameState.mortgages.find(m => m.assetId === asset.id))
          : gameState.mortgages.find(m => m.assetId === asset.id);
        const netValue = mortgage ? Math.max(0, emergencyValue - mortgage.balance) : emergencyValue;

        return (
          <div key={asset.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
            <div>
              <p className="text-white font-medium">{asset.name}</p>
              <p className="text-slate-400 text-sm">Emergency Sale: {formatMoney(emergencyValue)}</p>
              {mortgage && <p className="text-red-400 text-xs">Net after mortgage: {formatMoney(netValue)}</p>}
            </div>
            <button
              onClick={() => onSell(asset, netValue)}
              disabled={netValue <= 0}
              className={`px-4 py-2 rounded-lg font-medium ${netValue > 0 ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              Sell for {formatMoney(netValue)}
            </button>
          </div>
        );
      })}
    </div>
    <p className="text-red-400 text-xs text-center mt-4">
      ⚠️ {3 - (gameState.missedPayments || 0)} missed payments until bankruptcy
    </p>
  </Modal>
);

export default EmergencyCashModal;
