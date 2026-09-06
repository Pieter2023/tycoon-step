import React from 'react';
import { motion } from 'framer-motion';
import { FastForward, Pause } from 'lucide-react';
import Modal from '../Modal';
import { Button } from '../ui';
import { Scenario } from '../../types';
import { useI18n, formatCurrencyCompactValue } from '../../i18n';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

const CATEGORY_BG: Record<string, string> = {
  AI_DISRUPTION: 'bg-purple-500/20',
  MEDICAL: 'bg-red-500/20',
  FAMILY_EMERGENCY: 'bg-red-500/20',
  TAX: 'bg-amber-500/20',
  LEGAL: 'bg-orange-500/20',
  ECONOMIC: 'bg-blue-500/20',
  VEHICLE: 'bg-slate-500/20',
  RELATIONSHIP: 'bg-pink-500/20',
  WINDFALL: 'bg-yellow-500/20',
  HOUSING: 'bg-cyan-500/20'
};

const CATEGORY_EMOJI: Record<string, string> = {
  AI_DISRUPTION: '🤖',
  MEDICAL: '🏥',
  FAMILY_EMERGENCY: '👨‍👩‍👧',
  TAX: '📋',
  LEGAL: '⚖️',
  ECONOMIC: '📉',
  VEHICLE: '🚗',
  RELATIONSHIP: '💕',
  WINDFALL: '🎉',
  HOUSING: '🏠'
};

// Life-event scenario: blocking until the player picks an option. Autoplay
// controls are surfaced inside so desktop users can stop the clock here.
interface ScenarioModalProps {
  scenario: Scenario;
  /** App-owned coach ref + highlight class for the options list. */
  optionsRef: React.Ref<HTMLDivElement>;
  optionsHighlightClass: string;
  reduceMotion: boolean;
  isMultiplayer?: boolean;
  autoPlaySpeed: number | null;
  autoplaySpeedLabel: string;
  onToggleAutoplay: () => void;
  onOpenImage: (src: string, alt: string) => void;
  onChoose: (optionIndex: number) => void;
  onExploreTown?: () => void;
}

const ScenarioModal: React.FC<ScenarioModalProps> = ({
  scenario,
  optionsRef,
  optionsHighlightClass,
  reduceMotion,
  isMultiplayer,
  autoPlaySpeed,
  autoplaySpeedLabel,
  onToggleAutoplay,
  onOpenImage,
  onChoose,
  onExploreTown
}) => {
  const { t } = useI18n();
  return (
    <Modal
      isOpen
      onClose={() => undefined}
      ariaLabel={t('events.modalTitle')}
      overlayClassName="bg-black/80 backdrop-blur-sm"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showCloseButton={false}
      contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
      {/* Event Image (if available) */}
      {scenario.image && (
        <div
          className="mb-4 -mt-2 -mx-2 overflow-hidden rounded-xl relative group cursor-zoom-in select-none bg-slate-900/50 border border-slate-700/50"
          onClick={() => onOpenImage(scenario.image!, t(scenario.title))}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenImage(scenario.image!, t(scenario.title));
            }
          }}
          aria-label={t('events.enlargeImage')}
        >
          <div className="w-full flex items-center justify-center p-2">
            <motion.img
              src={scenario.image}
              alt={t(scenario.title)}
              className="w-full max-h-[40vh] object-contain rounded-lg"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.02 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              draggable={false}
            />
          </div>

          {/* Hint (always visible on mobile, hover on desktop) */}
          <div className="absolute bottom-2 right-2 text-xs text-white/90 bg-black/40 backdrop-blur px-2 py-1 rounded-lg pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {t('events.tapToEnlarge')}
          </div>
        </div>
      )}
      {!scenario.image && (
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl ${CATEGORY_BG[scenario.category] || 'bg-emerald-500/20'}`}>
          {CATEGORY_EMOJI[scenario.category] || '💡'}
        </div>
      )}

      {/* Autoplay controls (kept inside the modal so desktop users don't have to hunt for the header button) */}
      {!isMultiplayer && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full border ${
                autoPlaySpeed
                  ? 'bg-amber-600/20 border-amber-500/40 text-amber-200'
                  : 'bg-slate-900/40 border-slate-700/60 text-slate-300'
              }`}
            >
              {autoPlaySpeed
                ? t('autoplay.statusOn', { speed: autoplaySpeedLabel })
                : t('autoplay.statusOff')}
            </span>
            <span className="hidden sm:inline">{t('autoplay.hotkeyHint')}</span>
          </div>

          <Button
            size="sm"
            variant={autoPlaySpeed ? 'secondary' : 'ghost'}
            onClick={onToggleAutoplay}
            title={autoPlaySpeed ? t('autoplay.stopHint') : t('autoplay.startHint')}
            className={autoPlaySpeed ? 'border-amber-500/40 text-amber-200 bg-amber-600/20' : ''}
          >
            {autoPlaySpeed ? <Pause size={14} /> : <FastForward size={14} />}
            {autoPlaySpeed ? t('autoplay.stop') : t('autoplay.start')}
          </Button>
        </div>
      )}

      <h2 className="text-2xl font-bold text-white text-center mb-2">{t(scenario.title)}</h2>
      <p className="text-slate-400 text-center mb-6">{t(scenario.description)}</p>
      {onExploreTown && <button onClick={onExploreTown} className="mb-4 w-full rounded-xl border border-emerald-400/40 bg-emerald-950 px-4 py-3 text-left text-emerald-100"><strong className="block">Enter 3D city</strong><span className="mt-1 block text-xs">Explore now and return to this decision afterwards.</span></button>}
      <div
        ref={optionsRef}
        className={`space-y-3 ${optionsHighlightClass}`}
      >
        {scenario.options.map((opt, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              fullWidth
              variant="secondary"
              onClick={() => onChoose(idx)}
              className="justify-between text-left"
            >
              <span className="text-white font-medium">{t(opt.label)}</span>
              {opt.outcome.cashChange !== 0 && opt.outcome.cashChange !== undefined && (
                <span className={`ml-2 text-sm flex-shrink-0 ${opt.outcome.cashChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ({opt.outcome.cashChange >= 0 ? '+' : ''}{formatMoney(opt.outcome.cashChange)})
                </span>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </Modal>
  );
};

export default ScenarioModal;
