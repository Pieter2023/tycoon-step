import React from 'react';

export type KpiChipTone = 'cash' | 'networth' | 'passive';

type KpiChipProps = {
  label: string;
  value: string;
  tone?: KpiChipTone;
};

const toneStyles: Record<KpiChipTone, string> = {
  cash: 'border-emerald-500/30 bg-emerald-900/40 text-emerald-100',
  networth: 'border-slate-700 bg-slate-900/60 text-white',
  passive: 'border-amber-500/30 bg-amber-900/40 text-amber-100'
};

const KpiChip: React.FC<KpiChipProps> = ({ label, value, tone = 'networth' }) => {
  return (
    <div className={`rounded-full border px-4 py-3 min-w-[180px] ${toneStyles[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
};

export default KpiChip;
