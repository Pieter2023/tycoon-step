import { useI18n, type Translate } from '../../i18n';
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MonthlyActionId } from '../../types';
import { MonthlyActionCategory, MonthlyActionsSummary } from '../../services/monthlyActions';
import EventFeed from './EventFeed';
import NextBestStep from './NextBestStep';
import { GameState } from '../../types';
import SegmentedControl from '../ui/SegmentedControl';
import { MOTION_DISABLED, riseIn, springs, stagger } from '../ui/motion';
import { ActionPips, MonthlyActionTile } from './ActionsDrawer';

type ActionsScreenProps = {
  summary: MonthlyActionsSummary;
  onSelectAction: (id: MonthlyActionId) => void;
  events: GameState['events'];
  gameState: GameState;
  isProcessing: boolean;
  onClaimQuest: (questId: string) => void;
  onOpenGoals: () => void;
};

const filtersFor = (t: Translate): Array<{ id: 'all' | MonthlyActionCategory; label: string }> => [
  { id: 'all', label: t('shell.actionsScreen.all') },
  { id: 'income', label: t('shell.actionsScreen.income') },
  { id: 'growth', label: t('shell.actionsScreen.growth') },
  { id: 'recovery', label: t('shell.actionsScreen.recovery') }
];

const tileMotion = MOTION_DISABLED
  ? {}
  : {
      layout: 'position' as const,
      variants: {
        hidden: riseIn.hidden,
        show: riseIn.show,
        exit: { opacity: 0, scale: 0.96, transition: { type: 'spring', bounce: 0, duration: 0.22 } }
      },
      exit: 'exit',
      transition: springs.smooth
    };

const ActionsScreen: React.FC<ActionsScreenProps> = ({
  summary,
  onSelectAction,
  events,
  gameState,
  isProcessing,
  onClaimQuest,
  onOpenGoals
}) => {
  const { t } = useI18n();
  const filters = filtersFor(t);
  const [filter, setFilter] = useState<'all' | MonthlyActionCategory>('all');
  const filteredActions = useMemo(() => {
    if (filter === 'all') return summary.actions;
    return summary.actions.filter((action) => action.category === filter);
  }, [filter, summary.actions]);

  const tiles = filteredActions.map((action) => (
    <MonthlyActionTile
      key={action.id}
      action={action}
      onSelect={() => {
        if (action.disabled) return;
        onSelectAction(action.id);
      }}
      {...tileMotion}
    />
  ));

  return (
    <motion.div className="space-y-4" variants={stagger(0.05)} initial={MOTION_DISABLED ? false : 'hidden'} animate="show">
      <motion.section variants={riseIn} className="surface p-5">
        <h2 className="t-title-2 text-white">{t('shell.actionsScreen.monthly_actions')}</h2>
        <div className="mt-2 flex items-center gap-2.5">
          <ActionPips remaining={summary.remaining} max={summary.max} />
          <span className="num text-[13px] font-medium text-slate-200">
            {summary.remaining} / {summary.max} remaining
          </span>
        </div>
        {summary.reason && <p className="mt-1.5 text-[13px] leading-[18px] text-slate-400">{summary.reason}</p>}

        <SegmentedControl<'all' | MonthlyActionCategory>
          className="mt-4"
          role="radiogroup"
          ariaLabel={t('shell.actionsScreen.filter')}
          size="sm"
          fill
          value={filter}
          onChange={setFilter}
          options={filters.map((item) => ({ value: item.id, label: item.label }))}
        />

        {MOTION_DISABLED ? (
          <div className="relative mt-4 grid gap-2.5 md:grid-cols-2">{tiles}</div>
        ) : (
          <motion.div className="relative mt-4 grid gap-2.5 md:grid-cols-2" variants={stagger(0.04, 0.06)}>
            <AnimatePresence mode="popLayout">{tiles}</AnimatePresence>
          </motion.div>
        )}
      </motion.section>

      <motion.section variants={riseIn} className="grid gap-4 md:grid-cols-2">
        <div className="surface p-4 sm:p-5">
          <EventFeed events={events} />
        </div>
        <div className="surface p-4 sm:p-5">
          <NextBestStep
            gameState={gameState}
            isProcessing={isProcessing}
            onClaimQuest={onClaimQuest}
            onOpenGoals={onOpenGoals}
          />
        </div>
      </motion.section>
    </motion.div>
  );
};

export default ActionsScreen;
