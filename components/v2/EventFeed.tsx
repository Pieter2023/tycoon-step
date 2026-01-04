import React from 'react';
import { LifeEvent } from '../../types';
import { useI18n } from '../../i18n';

type EventFeedProps = {
  events: LifeEvent[];
  limit?: number;
};

const EventFeed: React.FC<EventFeedProps> = ({ events, limit = 10 }) => {
  const { t } = useI18n();
  const items = events.slice(0, limit);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('events.recentTitle')}</h3>
        <span className="text-xs text-slate-500">{items.length} shown</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 glass-scroll">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">Advance a month to trigger events.</p>
        ) : (
          items.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-3"
            >
              <span className="text-xs font-mono text-slate-500 whitespace-nowrap">M{event.month}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{t(event.title)}</p>
                <p className="text-xs text-slate-400 truncate">{t(event.description)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventFeed;
