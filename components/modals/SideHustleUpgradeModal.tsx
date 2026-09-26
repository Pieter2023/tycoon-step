import React from 'react';
import Modal from '../Modal';
import { SideHustle, SideHustleMilestone, SideHustleUpgradeOption } from '../../types';
import { useI18n, formatCurrencyValue } from '../../i18n';
import { SheetEmblem, SheetItem, SheetStagger } from './sheet';

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
      overlayClassName="bg-black/60"
      contentClassName="max-w-lg overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(110%_100%_at_50%_0%,rgb(48_209_88/0.16),transparent_70%)]" />
      <SheetStagger className="relative px-5 pb-5 pt-7 sm:px-6" gap={0.05}>
        <SheetItem className="text-center">
          <SheetEmblem bouncy className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-emerald-400/[0.18] text-[34px] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
            <span aria-hidden>{hustle.icon}</span>
          </SheetEmblem>
          <h2 className="t-title-1 mt-4 text-white">Milestone reached</h2>
          <p className="mx-auto mt-1 max-w-sm text-[15px] leading-snug text-slate-400">
            {hustle.name} hit <span className="num">{milestone.monthsRequired}</span> months. Choose your next move.
          </p>
        </SheetItem>

        <div className="mt-5 space-y-2.5">
          {milestone.options.map(option => {
            const canAfford = cash >= option.cost;
            return (
              <SheetItem key={option.id}>
                <button
                  type="button"
                  onClick={() => onChoose(option.id)}
                  disabled={!canAfford}
                  className="surface-interactive w-full rounded-[18px] bg-white/[0.06] p-4 text-left hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-white">{option.label}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-slate-400">{option.description}</p>
                      <p className="num mt-2 text-[12px] font-medium text-slate-300">{formatUpgradeEffects(option)}</p>
                    </div>
                    <span
                      className={`num shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold ${
                        option.cost > 0 ? 'bg-red-500/[0.14] text-red-300' : 'bg-emerald-400/[0.16] text-emerald-300'
                      }`}
                    >
                      {option.cost > 0 ? formatMoneyFull(option.cost) : 'Free'}
                    </span>
                  </div>
                </button>
              </SheetItem>
            );
          })}
        </div>

        <SheetItem>
          <p className="mt-4 px-1 text-center text-[13px] text-slate-500">
            {t('hustle.upgrade.deferHint')}
          </p>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default SideHustleUpgradeModal;
