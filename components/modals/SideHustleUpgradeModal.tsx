import React from 'react';
import Modal from '../Modal';
import { SideHustle, SideHustleMilestone, SideHustleUpgradeOption } from '../../types';
import { useI18n, formatCurrencyValue } from '../../i18n';

const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });

const formatUpgradeEffects = (option: SideHustleUpgradeOption) => {
  const effects = option.effects || {};
  const parts: string[] = [];
  if (typeof effects.incomeMultiplier === 'number') {
    const pct = Math.round((effects.incomeMultiplier - 1) * 100);
    if (pct !== 0) parts.push(`Income ${pct > 0 ? '+' : ''}${pct}%`);
  }
  if (typeof effects.passiveIncomeShare === 'number' && effects.passiveIncomeShare > 0) {
    parts.push(`Passive ${Math.round(effects.passiveIncomeShare * 100)}%`);
  }
  if (typeof effects.energyMultiplier === 'number') {
    const pct = Math.round((effects.energyMultiplier - 1) * 100);
    if (pct !== 0) parts.push(`Energy ${pct}%`);
  }
  if (typeof effects.stressMultiplier === 'number') {
    const pct = Math.round((effects.stressMultiplier - 1) * 100);
    if (pct !== 0) parts.push(`Stress ${pct}%`);
  }
  return parts.length > 0 ? parts.join(' • ') : 'No change';
};

// Side hustle milestone upgrade chooser; closable (the choice can be deferred).
interface SideHustleUpgradeModalProps {
  hustle: SideHustle;
  milestone: SideHustleMilestone;
  cash: number;
  onChoose: (optionId: string) => void;
  onClose: () => void;
}

const SideHustleUpgradeModal: React.FC<SideHustleUpgradeModalProps> = ({
  hustle,
  milestone,
  cash,
  onChoose,
  onClose
}) => {
  const { t } = useI18n();
  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Side hustle milestone upgrade"
      overlayClassName="bg-black/70 backdrop-blur-sm"
      contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="text-center mb-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl mb-3">
          {hustle.icon}
        </div>
        <h2 className="text-2xl font-bold text-white">Milestone reached</h2>
        <p className="text-slate-400 text-sm">
          {hustle.name} hit {milestone.monthsRequired} months. Choose your next move.
        </p>
      </div>

      <div className="space-y-3">
        {milestone.options.map(option => {
          const canAfford = cash >= option.cost;
          return (
            <button
              key={option.id}
              onClick={() => onChoose(option.id)}
              disabled={!canAfford}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                canAfford
                  ? 'bg-slate-800/60 border-slate-600 hover:border-emerald-500/60 hover:bg-slate-700/60'
                  : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">{option.label}</p>
                  <p className="text-slate-400 text-xs">{option.description}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-emerald-300 font-semibold">{option.cost > 0 ? formatMoneyFull(option.cost) : 'Free'}</p>
                  <p className="text-slate-500 text-xs">{formatUpgradeEffects(option)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        {t('hustle.upgrade.deferHint')}
      </p>
    </Modal>
  );
};

export default SideHustleUpgradeModal;
