import React, { useState } from 'react';

type ActionCardProps = {
  title: string;
  summary: string;
  costs: string[];
  effects: string[];
  disabledReason?: string;
  disabled?: boolean;
  checked?: boolean;
  onCheckedChange?: (next: boolean) => void;
};

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  summary,
  costs,
  effects,
  disabledReason,
  disabled = false,
  checked = false,
  onCheckedChange
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <div
      className={`min-w-[240px] max-w-[280px] rounded-2xl border p-4 transition-all ${
        disabled
          ? 'bg-slate-900/40 border-slate-800 text-slate-500'
          : 'bg-slate-900/70 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-900'
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-slate-400">{summary}</p>
        </div>
        <label className="flex items-center gap-1 text-xs text-slate-400">
          <input
            type="checkbox"
            className="rounded border-slate-600 bg-slate-900"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
          />
          Queue
        </label>
      </div>

      {disabledReason && (
        <p className="text-xs text-red-400 mt-2">{disabledReason}</p>
      )}

      <button
        type="button"
        className="text-xs text-slate-400 hover:text-white mt-2"
        onClick={toggleExpanded}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide details' : 'View details'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-slate-300">
          {costs.length > 0 && (
            <div>
              <p className="text-slate-400 font-semibold">Costs</p>
              <ul className="mt-1 space-y-1">
                {costs.map((cost) => (
                  <li key={cost}>- {cost}</li>
                ))}
              </ul>
            </div>
          )}
          {effects.length > 0 && (
            <div>
              <p className="text-slate-400 font-semibold">Effects</p>
              <ul className="mt-1 space-y-1">
                {effects.map((effect) => (
                  <li key={effect}>- {effect}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionCard;
