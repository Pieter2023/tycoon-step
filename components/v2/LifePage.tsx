import { useI18n } from '../../i18n';
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Coffee, Heart, Home } from 'lucide-react';
import Modal from '../Modal';
import LifestyleTab, { VITAL_TONES, VitalMeter, formatStat, type VitalKey } from '../tabs/LifestyleTab';
import SideHustlesTab from '../tabs/SideHustlesTab';
import { ActivityRing, AnimatedNumber } from '../ui';
import SegmentedControl from '../ui/SegmentedControl';
import { MOTION_DISABLED, riseIn, stagger } from '../ui/motion';
import { CAREER_PATHS, LIFESTYLE_OPTS } from '../../constants';
import { GameState, SideHustle, TabId, TABS } from '../../types';

type LifePageLayoutProps = {
  gameState: GameState;
  cashFlow: any;
  formatMoney: (value: number) => string;
  handleChangeLifestyle: (value: any) => void;
  coachLifestyleGridRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
  coachHint: any;
  InfoTip: React.FC<{ id: string; text: string }>;
  getHustleUpgradeLabel: (hustle: SideHustle, idx: number, upgradeId: string) => string | null;
  getNextHustleMilestone: (hustle: SideHustle) => any;
  handleStartSideHustle: (hustle: SideHustle) => void;
  handleStopSideHustle: (hustleId: string) => void;
  setShowSideHustleUpgradeModal: (open: boolean) => void;
  coachSideHustlesRef: React.RefObject<HTMLDivElement>;
  activeTab: 'lifestyle' | 'sidehustles' | 'family';
  onTabChange: (tab: 'lifestyle' | 'sidehustles' | 'family') => void;
};

type LifeTab = 'lifestyle' | 'sidehustles' | 'family';

/** A stat as an Activity-style ring with its figure in the middle and its name beneath. */
const VitalRing: React.FC<{ tone: VitalKey; label: string; value: number; size: number; stroke: number }> = ({ tone, label, value, size, stroke }) => {
  const colors = VITAL_TONES[tone];
  const numeric = Number(value) || 0;
  const format = Number.isInteger(numeric) ? (v: number) => String(Math.round(v)) : (v: number) => formatStat(v);
  return (
    <div className="flex flex-col items-center gap-2">
      <ActivityRing progress={numeric / 100} size={size} stroke={stroke} colors={[colors.from, colors.to]}>
        <AnimatedNumber
          value={numeric}
          format={format}
          flash={false}
          className={`font-semibold tracking-[-0.02em] text-white ${size >= 80 ? 'text-[22px]' : 'text-[17px]'}`}
        />
      </ActivityRing>
      <span className="text-[13px] font-medium text-slate-300">{label}</span>
    </div>
  );
};

/**
 * Overview card: a tinted glyph, the headline figure, and a "View details" action whose hit area
 * covers the card. Phones lay it out as a compact row; wider screens as a card.
 */
const SummaryCard: React.FC<{
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
  actionLabel: string;
  onOpen: () => void;
}> = ({ icon, tint, label, value, caption, actionLabel, onOpen }) => (
  <motion.div
    variants={riseIn}
    className="surface surface-interactive group relative grid grid-cols-[40px_minmax(0,1fr)_auto] gap-x-3.5 p-4 md:grid-cols-[40px_minmax(0,1fr)] md:p-5 md:hover:-translate-y-0.5"
  >
    <span
      aria-hidden
      className="col-start-1 row-span-3 row-start-1 flex h-10 w-10 items-center justify-center self-center rounded-[12px] md:row-span-1"
      style={{ background: `rgb(${tint} / 0.16)`, color: `rgb(${tint})`, boxShadow: `inset 0 0 0 1px rgb(${tint} / 0.14)` }}
    >
      {icon}
    </span>
    <span className="col-start-2 row-start-1 text-[13px] font-semibold text-slate-400 md:self-center">{label}</span>
    <p className="col-start-2 row-start-2 text-[17px] font-semibold leading-[22px] tracking-[-0.013em] text-white md:col-span-2 md:col-start-1 md:mt-4 md:text-[22px] md:font-bold md:leading-7 md:tracking-[-0.018em]">
      {value}
    </p>
    <p className="num col-start-2 row-start-3 mt-0.5 text-[13px] text-slate-400 md:col-span-2 md:col-start-1">{caption}</p>
    <button
      type="button"
      onClick={onOpen}
      className="col-start-3 row-span-3 row-start-1 inline-flex items-center gap-1 self-center text-[15px] font-medium text-[#0a84ff] outline-offset-4 after:absolute after:inset-0 after:rounded-[22px] after:content-[''] md:col-span-2 md:col-start-1 md:row-span-1 md:row-start-4 md:mt-4 md:justify-self-start"
    >
      {actionLabel}
      <ChevronRight size={16} strokeWidth={2.4} aria-hidden className="transition-transform duration-[530ms] ease-spring group-hover:translate-x-0.5" />
    </button>
  </motion.div>
);

export const LifePageLayout: React.FC<LifePageLayoutProps> = ({
  gameState,
  cashFlow,
  formatMoney,
  handleChangeLifestyle,
  coachLifestyleGridRef,
  coachHighlight,
  coachHint,
  InfoTip,
  getHustleUpgradeLabel,
  getNextHustleMilestone,
  handleStartSideHustle,
  handleStopSideHustle,
  setShowSideHustleUpgradeModal,
  coachSideHustlesRef,
  activeTab,
  onTabChange
}) => {
  const { t } = useI18n();
  const [openDetail, setOpenDetail] = useState<LifeTab | null>(null);

  const lifestyle = LIFESTYLE_OPTS[gameState.lifestyle];
  const familySummary = useMemo(() => {
    const spouse = gameState.family?.spouse;
    const childrenCount = gameState.family?.children?.length || 0;
    if (!spouse && !gameState.family?.isEngaged && !gameState.family?.inRelationship) {
      return t('shell.lifePage.single');
    }
    if (gameState.family?.isEngaged) return t('shell.lifePage.engaged');
    if (spouse) return t('shell.lifePage.married_to', { name: spouse.name });
    if (gameState.family?.inRelationship) return t('shell.lifePage.in_a_relationship');
    return t('shell.lifePage.family');
  }, [gameState.family, t]);

  const stats = gameState.stats || ({} as GameState['stats']);
  const enter = MOTION_DISABLED ? { initial: false as const, animate: 'show' } : { initial: 'hidden', animate: 'show' };

  return (
    <motion.div className="space-y-6" variants={stagger(0.05, 0.02)} {...enter}>
      {/* The desktop shell already titles the page; phones get the large title here. */}
      <motion.header variants={riseIn} className="px-1">
        <h2 className="t-large-title text-white md:sr-only">{t('shell.lifePage.life')}</h2>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-slate-400 md:mt-0">{t('shell.lifePage.balance_lifestyle_side_hustles_and')}</p>
      </motion.header>

      {/* Vitals. Energy and stress lead (they set this month's actions); happiness and health follow. */}
      <motion.section variants={riseIn} className="surface p-5 sm:p-6">
        <p className="eyebrow">{t('shell.profileScreen.core_stats')}</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
          <div className="flex items-start justify-center gap-8 sm:gap-10">
            <VitalRing tone="energy" label={t('shell.profileScreen.energy')} value={stats.energy ?? 0} size={92} stroke={10} />
            <VitalRing tone="stress" label={t('shell.profileScreen.stress')} value={stats.stress ?? 0} size={92} stroke={10} />
          </div>
          <div aria-hidden className="hidden h-24 w-px bg-white/[0.08] md:block" />
          <div className="grid flex-1 gap-4">
            {(
              [
                ['happiness', t('shell.profileScreen.happiness'), stats.happiness ?? 0],
                ['health', t('shell.profileScreen.health'), stats.health ?? 0]
              ] as Array<[VitalKey, string, number]>
            ).map(([tone, label, value]) => (
              <div key={tone}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="font-medium text-slate-300">{label}</span>
                  <span className="num font-semibold text-white">{formatStat(value)}</span>
                </div>
                <VitalMeter tone={tone} value={value} />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section variants={stagger(0.05)} className="grid gap-3 md:grid-cols-3 md:gap-4">
        <SummaryCard
          icon={<Home size={19} strokeWidth={2.2} />}
          tint="48 209 88"
          label={t('shell.lifePage.lifestyle')}
          value={<span className="capitalize">{gameState.lifestyle.toLowerCase()}</span>}
          caption={<><AnimatedNumber value={lifestyle.cost} format={formatMoney} />/mo</>}
          actionLabel={t('shell.lifePage.view_details')}
          onOpen={() => {
            onTabChange('lifestyle');
            setOpenDetail('lifestyle');
          }}
        />
        <SummaryCard
          icon={<Coffee size={19} strokeWidth={2.2} />}
          tint="255 159 10"
          label={t('shell.lifePage.side_hustles')}
          value={t('shell.lifePage.n_active', { count: gameState.activeSideHustles.length })}
          caption={t('shell.lifePage.income_per_month', { amount: formatMoney(cashFlow.sideHustleIncome) })}
          actionLabel={t('shell.lifePage.view_details')}
          onOpen={() => {
            onTabChange('sidehustles');
            setOpenDetail('sidehustles');
          }}
        />
        <SummaryCard
          icon={<Heart size={19} strokeWidth={2.2} />}
          tint="255 55 95"
          label={t('shell.lifePage.family')}
          value={familySummary}
          caption={t('shell.lifePage.children_count', { count: gameState.family?.children?.length || 0 })}
          actionLabel={t('shell.lifePage.view_details')}
          onOpen={() => {
            onTabChange('family');
            setOpenDetail('family');
          }}
        />
      </motion.section>

      <motion.section variants={riseIn} className="surface p-5 sm:p-6">
        <SegmentedControl<LifeTab>
          value={activeTab}
          onChange={onTabChange}
          size="md"
          className="w-full sm:w-auto"
          fill
          options={[
            { value: 'lifestyle', label: t('shell.lifePage.lifestyle') },
            { value: 'sidehustles', label: t('shell.lifePage.side_hustles') },
            { value: 'family', label: t('shell.lifePage.family') }
          ]}
        />

        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.span
            key={activeTab}
            initial={MOTION_DISABLED ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
            className="text-[15px] leading-snug text-slate-300"
          >
            {activeTab === 'lifestyle' && t('shell.lifePage.lifestyle_choices_affect_expenses_happiness')}
            {activeTab === 'sidehustles' && t('shell.lifePage.manage_side_hustles_upgrades_and')}
            {activeTab === 'family' && t('shell.lifePage.family_events_and_relationships_live')}
          </motion.span>
          <button
            type="button"
            onClick={() => setOpenDetail(activeTab)}
            className="btn-secondary shrink-0 self-start px-4 py-2 text-sm sm:self-auto"
          >
            {t('shell.lifePage.open_details')}
            <ChevronRight size={15} strokeWidth={2.4} aria-hidden className="-mr-1" />
          </button>
        </div>
      </motion.section>

      <Modal
        isOpen={openDetail === 'lifestyle'}
        onClose={() => setOpenDetail(null)}
        ariaLabel={t('shell.lifePage.lifestyle')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-[680px] p-5 sm:p-7 overflow-y-auto overscroll-contain"
      >
        <LifestyleTab
          gameState={gameState}
          formatMoney={formatMoney}
          handleChangeLifestyle={handleChangeLifestyle}
          coachLifestyleGridRef={coachLifestyleGridRef}
          coachHighlight={coachHighlight}
          coachHint={coachHint}
          activeTab={TABS.LIFESTYLE as TabId}
          InfoTip={InfoTip}
        />
      </Modal>

      <Modal
        isOpen={openDetail === 'sidehustles'}
        onClose={() => setOpenDetail(null)}
        ariaLabel={t('shell.lifePage.side_hustles')}
        overlayClassName="items-center justify-center"
        contentClassName="h-[90vh] w-[96vw] max-w-6xl px-4 pb-5 pt-14 sm:px-7 sm:pb-7 sm:pt-16 overflow-y-auto overscroll-contain"
      >
        <SideHustlesTab
          gameState={gameState}
          cashFlow={cashFlow}
          formatMoney={formatMoney}
          getHustleUpgradeLabel={getHustleUpgradeLabel}
          getNextHustleMilestone={getNextHustleMilestone}
          handleStartSideHustle={handleStartSideHustle}
          handleStopSideHustle={handleStopSideHustle}
          setShowSideHustleUpgradeModal={setShowSideHustleUpgradeModal}
          coachSideHustlesRef={coachSideHustlesRef}
          coachHighlight={coachHighlight}
        />
      </Modal>

      <Modal
        isOpen={openDetail === 'family'}
        onClose={() => setOpenDetail(null)}
        ariaLabel={t('shell.lifePage.family')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-[560px] p-5 sm:p-7 overflow-y-auto overscroll-contain"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 pr-10">
            <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#ff375f]/[0.16] text-[#ff375f]">
              <Heart size={19} strokeWidth={2.2} />
            </span>
            <h3 className="t-title-2 text-white">{t('shell.lifePage.family')}</h3>
          </div>
          {!gameState.family?.spouse && !gameState.family?.isEngaged && !gameState.family?.inRelationship ? (
            <p className="rounded-2xl bg-white/[0.045] p-4 text-[15px] text-slate-400">{t('shell.lifePage.single_romance_may_come_your')}</p>
          ) : (
            <div className="space-y-3">
              {gameState.family?.inRelationship && !gameState.family?.isEngaged && !gameState.family?.spouse && (
                <div className="rounded-2xl bg-[#ff375f]/[0.12] p-3 text-center">
                  <span className="font-semibold text-[#ff6482]">{t('shell.lifePage.in_a_relationship')}</span>
                </div>
              )}
              {gameState.family?.isEngaged && !gameState.family?.spouse && (
                <div className="rounded-2xl bg-[#ff375f]/[0.12] p-3 text-center">
                  <span className="font-semibold text-[#ff6482]">{t('shell.lifePage.engaged')}</span>
                </div>
              )}
              {gameState.family?.spouse && (
                <div className="rounded-2xl bg-white/[0.045] p-4">
                  <p className="text-[17px] font-semibold text-white">👫 Married to {gameState.family.spouse.name}</p>
                  <p className="num mt-1 text-[13px] text-slate-400">
                    {CAREER_PATHS[gameState.family.spouse.careerPath]?.icon} {CAREER_PATHS[gameState.family.spouse.careerPath]?.name} • {formatMoney(gameState.family.spouse.income)}/mo
                  </p>
                </div>
              )}
              {gameState.family?.children && gameState.family.children.length > 0 && (
                <div className="pt-1">
                  <p className="mb-2 text-[13px] font-semibold text-slate-400">Children ({gameState.family.children.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {gameState.family.children.map(child => {
                      const ageMonths = gameState.month - child.birthMonth;
                      const isPreBorn = ageMonths < 0;
                      return (
                        <span key={child.id} className="chip">
                          {isPreBorn ? '🤰 Due soon' : `👶 ${child.name}, ${child.age}y`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
};

const LifePage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="t-title-2 text-white">{t('shell.lifePage.life')}</h2>
        <p className="mt-2 text-[15px] text-slate-400">{t('shell.lifePage.lifestyle_choices_goals_and_life')}
        </p>
      </section>
    </div>
  );
};

export default LifePage;
