import React from 'react';
import { useI18n } from '../i18n';
import { FreedomPace } from '../services/freedomPace';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** "about 14 years" from two years out, months below that. */
export const paceTime = (months: number, t: Translate) =>
  months >= 24 ? t('shell.pace.years', { n: Math.round(months / 12) }) : months === 1 ? t('shell.pace.one_month') : t('shell.pace.months', { n: months });

export const paceText = (pace: FreedomPace, t: Translate) =>
  pace.status === 'on-track' ? t('shell.pace.on_track', { time: paceTime(pace.months, t) })
    : pace.status === 'off-track' ? t('shell.pace.off_track')
      : pace.status === 'between-jobs' ? t('shell.pace.between_jobs')
        : t('shell.pace.free');

/** The freedom meter's countdown: how far away freedom is at today's pace (services/freedomPace.ts). */
export default function FreedomPaceLine({ pace, className = '' }: { pace: FreedomPace; className?: string }) {
  const { t } = useI18n();
  const tone = pace.status === 'off-track' ? 'text-amber-300' : pace.status === 'free' ? 'text-emerald-300' : 'text-slate-300';
  return <p className={`${tone} ${className}`} title={t('shell.pace.hint')} data-pace={pace.status}>{paceText(pace, t)}</p>;
}
