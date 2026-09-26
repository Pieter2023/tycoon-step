import React from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronRight, FastForward, Lock, Maximize2, Pause } from 'lucide-react';
import Modal from '../Modal';
import { MOTION_DISABLED } from '../ui/motion';
import { Scenario } from '../../types';
import { useI18n, formatCurrencyCompactValue } from '../../i18n';
import { DeltaChip, SheetEmblem, SheetItem, SheetStagger } from './sheet';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

// Category tint for the emblem shown when an event has no illustration.
const CATEGORY_TINT: Record<string, string> = {
  AI_DISRUPTION: 'bg-purple-500/20',
  MEDICAL: 'bg-red-500/20',
  FAMILY_EMERGENCY: 'bg-red-500/20',
  TAX: 'bg-amber-500/20',
  LEGAL: 'bg-orange-500/20',
  ECONOMIC: 'bg-blue-500/20',
  VEHICLE: 'bg-slate-500/25',
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

// A title's leading emoji ("📉 Market dip"), including joined sequences like 👨‍👩‍👧.
const LEADING_EMOJI = /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s+/u;

// The illustration fades into the sheet's material instead of ending on a hard edge.
const IMAGE_FADE = 'linear-gradient(to bottom, #000 0%, #000 62%, rgb(0 0 0 / 0.55) 82%, transparent 100%)';

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
  /** Why an option is closed to this player (an insured option without the policy), or null when open. */
  lockedOption?: (label: string) => string | null;
  /** Where in town this happens, when the event opens over the 3D city (Phase 1, slice 3). */
  cityPlace?: string;
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
  lockedOption,
  onExploreTown,
  cityPlace
}) => {
  const { t } = useI18n();
  const title = t(scenario.title);
  // The frame takes the art's own shape (16:9, 3:2 or square), so it bleeds edge to edge without
  // cropping; on short screens it is capped and a blurred copy fills the sides.
  const [artRatio, setArtRatio] = React.useState(1.5);
  const Img = (MOTION_DISABLED ? 'img' : motion.img) as React.ElementType;
  const imgMotion = MOTION_DISABLED
    ? {}
    : {
        // A slow one-shot settle, like a photo coming to rest (a plain fade under reduce motion).
        initial: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.06 },
        animate: reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 },
        transition: reduceMotion
          ? { duration: 0.2 }
          : { opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }, scale: { type: 'spring', bounce: 0, duration: 1.4 } }
      };

  const openImage = () => onOpenImage(scenario.image!, title);
  // Without an illustration the emblem carries the title's own emoji, so it isn't shown twice
  // (the heading keeps it for screen readers: its accessible name is unchanged).
  const lead = !scenario.image ? LEADING_EMOJI.exec(title) : null;
  const placePill = cityPlace ? <span className="eyebrow text-emerald-300">📍 {cityPlace}</span> : null;

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      ariaLabel={t('events.modalTitle')}
      overlayClassName={cityPlace ? 'bg-black/45' : 'bg-black/70'}
      zIndex={cityPlace ? 1100 : undefined}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showCloseButton={false}
      contentClassName="max-w-lg overflow-hidden"
    >
      {/* Illustration: full bleed under the sheet's corners, fading into the material. */}
      {scenario.image && (
        <div
          className="group relative w-full cursor-zoom-in select-none overflow-hidden outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[rgb(10_132_255/0.75)]"
          style={{ aspectRatio: String(artRatio), maxHeight: '42vh' }}
          onClick={openImage}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openImage();
            }
          }}
          aria-label={t('events.enlargeImage')}
        >
          <div className="absolute inset-0" style={{ WebkitMaskImage: IMAGE_FADE, maskImage: IMAGE_FADE }}>
            {/* A soft, blurred copy fills the frame when the art is square or wide. */}
            <img
              src={scenario.image}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
              draggable={false}
            />
            <Img
              {...imgMotion}
              src={scenario.image}
              alt={title}
              onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalWidth > 0 && naturalHeight > 0) setArtRatio(Math.min(2, Math.max(1, naturalWidth / naturalHeight)));
              }}
              className="relative h-full w-full object-contain transition-[scale] duration-500 ease-spring group-hover:scale-[1.015]"
              draggable={false}
            />
          </div>

          {cityPlace && (
            <span className="mat-popover absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white">
              📍 {cityPlace}
            </span>
          )}

          {/* Hint (always visible on touch screens, on hover with a pointer) */}
          <span className="mat-popover pointer-events-none absolute right-3 top-3 inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-medium text-white/90 opacity-100 transition-opacity duration-200 sm:px-2.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
            <Maximize2 size={13} strokeWidth={2.4} aria-hidden />
            <span className="sr-only sm:not-sr-only">{t('events.tapToEnlarge')}</span>
          </span>
        </div>
      )}

      <SheetStagger className={`relative px-5 sm:px-6 ${scenario.image ? '-mt-7 pt-0' : 'pt-7'} ${isMultiplayer ? 'pb-6' : 'pb-5'}`} delay={0.08}>
        {!scenario.image && (
          <SheetItem className="mb-4">
            <SheetEmblem
              className={`flex h-16 w-16 items-center justify-center rounded-[20px] text-[34px] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] ${CATEGORY_TINT[scenario.category] || 'bg-emerald-500/20'}`}
            >
              <span aria-hidden>{lead ? lead[1] : CATEGORY_EMOJI[scenario.category] || '💡'}</span>
            </SheetEmblem>
          </SheetItem>
        )}

        {!scenario.image && placePill && <SheetItem className="mb-1.5">{placePill}</SheetItem>}

        <SheetItem>
          <h2 className="font-display text-[26px] font-bold leading-[1.15] tracking-[-0.022em] text-white text-balance sm:text-[28px]">
            {lead ? (
              <>
                <span className="sr-only">{lead[0]}</span>
                {title.slice(lead[0].length)}
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mt-2 text-[15px] leading-[1.45] text-slate-400 sm:text-base">{t(scenario.description)}</p>
        </SheetItem>

        <div ref={optionsRef} className={`mt-5 space-y-2 rounded-[18px] ${optionsHighlightClass}`}>
          {scenario.options.map((opt, idx) => {
            const locked = lockedOption?.(opt.label) ?? null;
            const cash = opt.outcome.cashChange;
            return (
              <SheetItem key={idx}>
                <button
                  type="button"
                  onClick={() => { if (!locked) onChoose(idx); }}
                  disabled={!!locked}
                  title={locked ?? undefined}
                  className="surface-interactive flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-white/[0.065] px-4 py-3 text-left shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-white/[0.065]"
                >
                  {locked && <Lock size={15} strokeWidth={2.4} className="shrink-0 text-amber-300" aria-hidden />}
                  <span className="min-w-0 flex-1 text-[16px] font-medium leading-snug text-white">{t(opt.label)}</span>
                  {cash !== 0 && cash !== undefined && (
                    <DeltaChip value={cash}>
                      {cash >= 0 ? '+' : ''}{formatMoney(cash)}
                    </DeltaChip>
                  )}
                </button>
                {locked && <p className="mt-1.5 px-4 text-[13px] leading-snug text-amber-300">{locked}</p>}
              </SheetItem>
            );
          })}
        </div>

        {onExploreTown && (
          <SheetItem className="mt-3">
            <button
              type="button"
              onClick={onExploreTown}
              className="surface-interactive group flex w-full items-center gap-3 rounded-[16px] bg-emerald-400/[0.1] px-4 py-3 text-left ring-1 ring-inset ring-emerald-400/25 hover:bg-emerald-400/[0.15]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-emerald-400/[0.18] text-emerald-300" aria-hidden>
                <Building2 size={20} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[15px] font-semibold text-emerald-100">Enter 3D city</strong>
                <span className="mt-0.5 block text-[13px] leading-snug text-emerald-100/70">Explore now and return to this decision afterwards.</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-emerald-300/70 transition-transform duration-300 ease-spring group-hover:translate-x-0.5" aria-hidden />
            </button>
          </SheetItem>
        )}
      </SheetStagger>

      {/* Autoplay: a quiet toolbar along the sheet's foot (kept inside so desktop players can stop the clock here). */}
      {!isMultiplayer && (
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-black/[0.12] px-5 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-[13px]">
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${autoPlaySpeed ? 'bg-amber-400 shadow-[0_0_8px_rgb(255_159_10/0.8)]' : 'bg-slate-600'}`}
            />
            <span className={`truncate font-medium ${autoPlaySpeed ? 'text-amber-200' : 'text-slate-400'}`}>
              {autoPlaySpeed
                ? t('autoplay.statusOn', { speed: autoplaySpeedLabel })
                : t('autoplay.statusOff')}
            </span>
            <span className="hidden truncate text-slate-500 sm:inline">{t('autoplay.hotkeyHint')}</span>
          </div>

          <button
            type="button"
            onClick={onToggleAutoplay}
            title={autoPlaySpeed ? t('autoplay.stopHint') : t('autoplay.startHint')}
            className={`pressable inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
              autoPlaySpeed
                ? 'bg-amber-400/[0.16] text-amber-200 hover:bg-amber-400/[0.24]'
                : 'text-[#0a84ff] hover:bg-[rgb(118_118_128/0.18)]'
            }`}
          >
            {autoPlaySpeed ? <Pause size={14} strokeWidth={2.4} /> : <FastForward size={14} strokeWidth={2.4} />}
            {autoPlaySpeed ? t('autoplay.stop') : t('autoplay.start')}
          </button>
        </div>
      )}
    </Modal>
  );
};

export default ScenarioModal;
