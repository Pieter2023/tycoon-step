import React from 'react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type DashboardWidgetDataPoint = {
  label?: string;
  value?: number;
  income?: number;
  expenses?: number;
};

type DashboardWidgetProps = {
  title: string;
  data: DashboardWidgetDataPoint[];
  unit?: string;
  onClick: () => void;
  variant?: 'line' | 'bar';
  valueLabel?: string;
  caption?: string;
  ariaLabel?: string;
};

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  data,
  unit,
  onClick,
  variant = 'line',
  valueLabel,
  caption,
  ariaLabel
}) => {
  const latest = data[data.length - 1];
  const computedValue = (() => {
    if (valueLabel) return valueLabel;
    if (variant === 'bar') {
      const income = latest?.income ?? 0;
      const expenses = latest?.expenses ?? 0;
      const net = income - expenses;
      const label = Math.abs(net).toLocaleString();
      return `${net >= 0 ? '+' : '-'}${label}${unit ? ` ${unit}` : ''}`;
    }
    const value = latest?.value;
    if (typeof value !== 'number') return '—';
    return unit ? `${Math.round(value)} ${unit}` : `${Math.round(value)}`;
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-slate-600 hover:bg-slate-900/80 transition"
      aria-label={ariaLabel || title}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{title}</p>
          <p className="text-lg font-semibold text-white">{computedValue}</p>
          {caption && <p className="text-xs text-slate-400">{caption}</p>}
        </div>
        <span className="text-slate-500 text-xs">View</span>
      </div>

      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
          {variant === 'bar' ? (
            <BarChart data={data}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  fontSize: 12
                }}
                formatter={(val: number, name: string) => [
                  val.toLocaleString(),
                  name === 'income' ? 'Income' : 'Expenses'
                ]}
              />
              <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Tooltip
                cursor={{ stroke: '#334155' }}
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  fontSize: 12
                }}
                formatter={(val: number) => [val.toLocaleString(), '']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </button>
  );
};

export default DashboardWidget;
