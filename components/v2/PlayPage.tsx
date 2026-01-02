import React, { useState } from 'react';
import ModeSelector from '../../ModeSelector';
import KpiChip from './KpiChip';
import PageHeader from './PageHeader';
import MonthlyActionsPreview from './MonthlyActionsPreview';
import ActionsDrawer from './ActionsDrawer';
import { MonthlyActionsSummary } from '../../services/monthlyActions';
import { GameState, LifeEvent, MonthlyActionId } from '../../types';
import EventFeed from './EventFeed';
import NextBestStep from './NextBestStep';
import SignalsStack from './SignalsStack';

type PlayPageLayoutProps = {
  playerName: string;
  year: number;
  month: number;
  avatarColor?: string;
  avatarImage?: string;
  avatarEmoji?: string;
  cashLabel: string;
  netWorthLabel: string;
  passiveLabel: string;
  isProcessing: boolean;
  nextMonthDisabled: boolean;
  onNextMonth: () => void;
  autoplayEnabled: boolean;
  autoplayLabel: string;
  autoplayTooltip: string;
  autoplaySpeed: number | null;
  autoplaySpeedOptions: number[];
  autoplaySpeedLabels: Record<number, string>;
  onToggleAutoplay: () => void;
  onSetAutoplaySpeed: (speed: number) => void;
  monthlyActions: MonthlyActionsSummary;
  onUseMonthlyAction: (actionId: MonthlyActionId) => void;
  events: LifeEvent[];
  gameState: GameState;
  onClaimQuest: (questId: string) => void;
  onOpenGoals: () => void;
  creditScore: number;
  creditTier: string;
  getCreditTierColor: (tier: string) => string;
  aiImpact: { automationRisk?: string } | undefined;
  careerPath: string;
  getAIRiskColor: (risk: string) => string;
};

export const PlayPageLayout: React.FC<PlayPageLayoutProps> = ({
  playerName,
  year,
  month,
  avatarColor,
  avatarImage,
  avatarEmoji,
  cashLabel,
  netWorthLabel,
  passiveLabel,
  isProcessing,
  nextMonthDisabled,
  onNextMonth,
  autoplayEnabled,
  autoplayLabel,
  autoplayTooltip,
  autoplaySpeed,
  autoplaySpeedOptions,
  autoplaySpeedLabels,
  onToggleAutoplay,
  onSetAutoplaySpeed,
  monthlyActions,
  onUseMonthlyAction,
  events,
  gameState,
  onClaimQuest,
  onOpenGoals,
  creditScore,
  creditTier,
  getCreditTierColor,
  aiImpact,
  careerPath,
  getAIRiskColor
}) => {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
        <PageHeader
          playerName={playerName}
          year={year}
          month={month}
          avatarColor={avatarColor}
          avatarImage={avatarImage}
          avatarEmoji={avatarEmoji}
          isProcessing={isProcessing}
          nextMonthDisabled={nextMonthDisabled}
          onNextMonth={onNextMonth}
          autoplayEnabled={autoplayEnabled}
          autoplayLabel={autoplayLabel}
          autoplayTooltip={autoplayTooltip}
          autoplaySpeed={autoplaySpeed}
          autoplaySpeedOptions={autoplaySpeedOptions}
          autoplaySpeedLabels={autoplaySpeedLabels}
          onToggleAutoplay={onToggleAutoplay}
          onSetAutoplaySpeed={onSetAutoplaySpeed}
        />
      </section>

      <section className="flex flex-wrap gap-3">
        <KpiChip label="Cash" value={cashLabel} tone="cash" />
        <KpiChip label="Net Worth" value={netWorthLabel} tone="networth" />
        <KpiChip label="Passive / mo" value={passiveLabel} tone="passive" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-lg font-semibold">This Month</h3>
          <p className="mt-2 text-sm text-slate-400">
            Pick a few actions to shape the month ahead.
          </p>
          <div className="mt-6">
            <MonthlyActionsPreview
              summary={monthlyActions}
              onSelectAction={onUseMonthlyAction}
              onOpenDrawer={() => setActionsOpen(true)}
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <EventFeed events={events} />
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <NextBestStep
              gameState={gameState}
              isProcessing={isProcessing}
              onClaimQuest={onClaimQuest}
              onOpenGoals={onOpenGoals}
            />
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <SignalsStack
              gameState={gameState}
              creditScore={creditScore}
              creditTier={creditTier}
              getCreditTierColor={getCreditTierColor}
              aiImpact={aiImpact}
              careerPath={careerPath}
              getAIRiskColor={getAIRiskColor}
            />
          </div>
        </div>
      </section>

      <ActionsDrawer
        isOpen={actionsOpen}
        onClose={() => setActionsOpen(false)}
        summary={monthlyActions}
        onSelectAction={onUseMonthlyAction}
      />
    </div>
  );
};

const PlayPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-bold">Play</h2>
        <p className="mt-2 text-sm text-slate-400">
          Start or continue a game. The new Play layout appears once you enter the simulation.
        </p>
      </section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <ModeSelector />
      </section>
    </div>
  );
};

export default PlayPage;
