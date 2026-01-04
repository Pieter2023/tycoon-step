import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export const CHART_COLORS = {
  positive: 'var(--chart-positive)',
  negative: 'var(--chart-negative)',
  neutral: 'var(--chart-neutral)',
  accent: 'var(--chart-accent)'
};

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  delta?: number;
};

export const ChartTooltip: React.FC<ChartTooltipContentProps> = ({
  active,
  payload,
  label,
  valuePrefix,
  valueSuffix,
  delta
}) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const formatted = typeof value === 'number'
    ? `${valuePrefix || ''}${value.toFixed(0)}${valueSuffix || ''}`
    : `${valuePrefix || ''}${value ?? ''}${valueSuffix || ''}`;
  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-950/90 px-3 py-2 text-xs text-slate-200 shadow-[0_12px_24px_rgba(2,6,23,0.6)]">
      {label && <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>}
      <div className="text-sm font-semibold text-white">{formatted}</div>
      {typeof delta === 'number' && (
        <div className={`text-[11px] ${delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(0)}
        </div>
      )}
    </div>
  );
};

type SparklineProps = {
  data: Array<{ label: string; value: number }>;
  type?: 'area' | 'bar';
  color?: string;
};

export const Sparkline: React.FC<SparklineProps> = ({ data, type = 'area', color }) => {
  if (!data.length) {
    return (
      <div className="text-[10px] text-slate-500 text-center py-2">No history yet</div>
    );
  }

  const stroke = color || CHART_COLORS.accent;
  return (
    <div className="h-12 w-full min-w-[1px] min-h-[1px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
        {type === 'bar' ? (
          <BarChart data={data}>
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" fill={stroke} radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="90%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              fill="url(#sparklineGradient)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
