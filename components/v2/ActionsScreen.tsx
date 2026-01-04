import React, { useMemo, useState } from 'react';
import { BookOpen, Clock, Filter, HeartPulse, Users, Zap } from 'lucide-react';
import { MonthlyActionId } from '../../types';
import { MonthlyActionCard, MonthlyActionCategory, MonthlyActionsSummary } from '../../services/monthlyActions';
import EventFeed from './EventFeed';
import NextBestStep from './NextBestStep';
import { GameState } from '../../types';

type ActionsScreenProps = {
  summary: MonthlyActionsSummary;
  onSelectAction: (id: MonthlyActionId) => void;
  events: GameState['events'];
  gameState: GameState;
  isProcessing: boolean;
  onClaimQuest: (questId: string) => void;
  onOpenGoals: () => void;
};

const actionIcon = (action: MonthlyActionCard) => {
  switch (action.id) {
    case 'OVERTIME':
      return <Clock size={18} className="text-emerald-300" />;
    case 'NETWORK':
      return <Users size={18} className="text-blue-300" />;
    case 'TRAINING':
      return <BookOpen size={18} className="text-amber-300" />;
    case 'HUSTLE_SPRINT':
      return <Zap size={18} className="text-purple-300" />;
    case 'RECOVER':
      return <HeartPulse size={18} className="text-pink-300" />;
    default:
      return null;
  }
};

const filters: Array<{ id: 'all' | MonthlyActionCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'income', label: 'Income' },
  { id: 'growth', label: 'Growth' },
  { id: 'recovery', label: 'Recovery' }
];

const ActionsScreen: React.FC<ActionsScreenProps> = ({
  summary,
  onSelectAction,
  events,
  gameState,
  isProcessing,
  onClaimQuest,
  onOpenGoals
}) => {
  const [filter, setFilter] = useState<'all' | MonthlyActionCategory>('all');
  const filteredActions = useMemo(() => {
    if (filter === 'all') return summary.actions;
    return summary.actions.filter((action) => action.category === filter);
  }, [filter, summary.actions]);

  return (
    <div className="space-y-5">
      <section className="glass-panel px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Monthly Actions</h2>
            <p className="text-xs text-slate-400">{summary.remaining} / {summary.max} remaining • {summary.reason}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter size={14} />
            Filter
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filter === item.id
                  ? 'border-white/80 bg-white text-slate-950'
                  : 'border-slate-700/70 text-slate-200 hover:border-white/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                if (action.disabled) return;
                onSelectAction(action.id);
              }}
              disabled={action.disabled}
              className={`rounded-2xl border p-4 text-left transition ${
                action.disabled
                  ? 'cursor-not-allowed border-slate-800/60 bg-slate-900/30 text-slate-500'
                  : 'border-slate-700/70 bg-slate-900/60 hover:border-emerald-400/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{actionIcon(action)}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{action.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{action.subtitle}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">{action.details}</p>
              {action.disabledReason && (
                <p className="mt-2 text-xs text-rose-300">{action.disabledReason}</p>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel px-4 py-4">
          <EventFeed events={events} />
        </div>
        <div className="glass-panel px-4 py-4">
          <NextBestStep
            gameState={gameState}
            isProcessing={isProcessing}
            onClaimQuest={onClaimQuest}
            onOpenGoals={onOpenGoals}
          />
        </div>
      </section>
    </div>
  );
};

export default ActionsScreen;
