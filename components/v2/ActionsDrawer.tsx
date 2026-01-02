import React, { useMemo, useState } from 'react';
import { BookOpen, Clock, Filter, HeartPulse, Users, Zap } from 'lucide-react';
import Modal from '../Modal';
import { MonthlyActionId } from '../../types';
import { MonthlyActionCard, MonthlyActionCategory, MonthlyActionsSummary } from '../../services/monthlyActions';

type ActionsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  summary: MonthlyActionsSummary;
  onSelectAction: (id: MonthlyActionId) => void;
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

const ActionsDrawer: React.FC<ActionsDrawerProps> = ({ isOpen, onClose, summary, onSelectAction }) => {
  const [filter, setFilter] = useState<'all' | MonthlyActionCategory>('all');
  const filteredActions = useMemo(() => {
    if (filter === 'all') return summary.actions;
    return summary.actions.filter((action) => action.category === filter);
  }, [filter, summary.actions]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="All Monthly Actions"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Monthly Actions</h2>
            <p className="text-xs text-slate-400">
              {summary.remaining} / {summary.max} remaining • {summary.reason}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter size={14} />
            <span>Filter</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filter === item.id
                  ? 'border-white bg-white text-slate-900'
                  : 'border-slate-700 text-slate-200 hover:border-slate-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filteredActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                if (action.disabled) return;
                onSelectAction(action.id);
                onClose();
              }}
              disabled={action.disabled}
              className={`rounded-2xl border p-4 text-left transition ${
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
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default ActionsDrawer;
