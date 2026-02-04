import React from 'react';
import { ArrowRight, BookOpen, Clock, HeartPulse, Users, Zap } from 'lucide-react';
import { MonthlyActionId } from '../../types';
import { MonthlyActionsSummary, MonthlyActionCard } from '../../services/monthlyActions';

type MonthlyActionsPreviewProps = {
  summary: MonthlyActionsSummary;
  onSelectAction: (id: MonthlyActionId) => void;
  onOpenDrawer: () => void;
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

const ActionCard: React.FC<{
  action: MonthlyActionCard;
  onSelectAction: (id: MonthlyActionId) => void;
}> = ({ action, onSelectAction }) => {
  return (
    <button
      type="button"
      onClick={() => onSelectAction(action.id)}
      disabled={action.disabled}
      className={`rounded-2xl border p-4 text-left transition-all ${
        action.disabled
          ? 'cursor-not-allowed border-slate-800/60 bg-slate-900/30 text-slate-500'
          : 'border-slate-800 bg-slate-900/50 hover:border-emerald-400/40 hover:bg-slate-900/70'
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
  );
};

const MonthlyActionsPreview: React.FC<MonthlyActionsPreviewProps> = ({
  summary,
  onSelectAction,
  onOpenDrawer
}) => {
  const previewActions = summary.actions.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold">Monthly Actions</h4>
          <p className="text-xs text-slate-400">Spend actions to boost income, skills, or recovery.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Actions Remaining</p>
          <p className="text-lg font-semibold text-white">
            {summary.remaining} / {summary.max}
          </p>
          <p className="text-xs text-slate-500">{summary.reason}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {previewActions.map((action) => (
          <ActionCard key={action.id} action={action} onSelectAction={onSelectAction} />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onOpenDrawer}
          title="Open actions (A)"
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
        >
          View All Actions
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default MonthlyActionsPreview;
