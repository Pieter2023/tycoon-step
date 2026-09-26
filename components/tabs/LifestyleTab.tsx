import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Check, Heart, Info, Lightbulb, Smile, Users, Zap, type LucideIcon } from 'lucide-react';
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { LIFESTYLE_OPTS } from '../../constants';
import { Lifestyle, TABS, TabId } from '../../types';
import { MOTION_DISABLED, riseIn, springs, stagger } from '../ui/motion';

type LifestyleTabProps = {
  gameState: any;
  formatMoney: (value: number) => string;
  handleChangeLifestyle: (value: Lifestyle) => void;
  coachLifestyleGridRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
  coachHint: any;
  activeTab: TabId;
  InfoTip: React.FC<{ id: string; text: string }>;
};

/* -------------------------------------------------------------------------------------------------
 * Vitals: one colour and glyph per stat, shared by the Life page, this tab and the Profile screen
 * (Apple Health style: a category keeps its colour everywhere it appears).
 * ---------------------------------------------------------------------------------------------- */
export type VitalKey = 'energy' | 'stress' | 'happiness' | 'health' | 'networking' | 'financialIQ';

export const VITAL_TONES: Record<VitalKey, { from: string; to: string; icon: LucideIcon }> = {
  energy: { from: '#ffd60a', to: '#ff9f0a', icon: Zap },
  stress: { from: '#bf5af2', to: '#5e5ce6', icon: Brain },
  happiness: { from: '#30d158', to: '#66d4cf', icon: Smile },
  health: { from: '#ff375f', to: '#ff6482', icon: Heart },
  networking: { from: '#0a84ff', to: '#64d2ff', icon: Users },
  financialIQ: { from: '#64d2ff', to: '#40c8e0', icon: Lightbulb }
};

/** Stats can carry a half point (side-hustle drain); show at most one decimal, never float noise. */
export const formatStat = (value: number) => String(Math.round((Number(value) || 0) * 10) / 10);

/** A thin rounded meter whose fill springs to its value. */
export const VitalMeter: React.FC<{ value: number; tone: VitalKey; className?: string }> = ({ value, tone, className = '' }) => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const colors = VITAL_TONES[tone];
  return (
    <div className={`meter ${className}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${colors.from}, ${colors.to})` }}
        initial={MOTION_DISABLED ? false : { width: '0%' }}
        animate={{ width: `${clamped}%` }}
        transition={springs.settle}
      />
    </div>
  );
};

/** The rounded-square glyph tile (iOS Settings style) for a vital. */
export const VitalGlyph: React.FC<{ tone: VitalKey; size?: number }> = ({ tone, size = 29 }) => {
  const colors = VITAL_TONES[tone];
  const Icon = colors.icon;
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[8px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22)]"
      style={{ width: size, height: size, background: `linear-gradient(160deg, ${colors.from}, ${colors.to})` }}
    >
      <Icon size={Math.round(size * 0.55)} strokeWidth={2.4} />
    </span>
  );
};

const LifestyleTab: React.FC<LifestyleTabProps> = (props) => {
  const {
    gameState,
    formatMoney,
    handleChangeLifestyle,
    coachLifestyleGridRef,
    coachHighlight,
    coachHint,
    activeTab,
    InfoTip
  } = props;

  const lifestylePoints = useMemo(() => {
    return (Object.entries(LIFESTYLE_OPTS) as [Lifestyle, typeof LIFESTYLE_OPTS[Lifestyle]][])
      .map(([key, opt]) => ({
        key,
        name: key.toLowerCase(),
        cost: opt.cost,
        happiness: opt.happiness,
        icon: opt.icon
      }));
  }, []);

  const selectedPoint = lifestylePoints.find((p) => p.key === gameState.lifestyle);
  const otherPoints = lifestylePoints.filter((p) => p.key !== gameState.lifestyle);

  const costs = lifestylePoints.map((p) => p.cost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const [budgetCost, setBudgetCost] = useState(LIFESTYLE_OPTS[gameState.lifestyle].cost);
  const budgetPercent = ((budgetCost - minCost) / Math.max(1, maxCost - minCost)) * 100;

  const enter = MOTION_DISABLED ? { initial: false as const, animate: 'show' } : { initial: 'hidden', animate: 'show' };

  return (
    <motion.div className="mx-auto max-w-3xl" variants={stagger(0.05)} {...enter}>
      <motion.header variants={riseIn} className="pr-10">
        <h2 className="t-title-2 text-white">Choose Your Lifestyle</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-slate-400">Your lifestyle determines your monthly expenses and happiness.</p>
      </motion.header>

      {/* Tiers: the current one wears a ring that glides to whichever tier you pick. */}
      <motion.div variants={riseIn} className="mt-6 grid gap-2.5" role="group">
        {(Object.entries(LIFESTYLE_OPTS) as [Lifestyle, typeof LIFESTYLE_OPTS[Lifestyle]][]).map(([key, opt]) => {
          const selected = gameState.lifestyle === key;
          const tone = opt.happiness > 0 ? 'text-emerald-300 bg-emerald-400/[0.14]' : opt.happiness < 0 ? 'text-rose-300 bg-rose-400/[0.14]' : 'text-slate-300 bg-white/[0.08]';
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => handleChangeLifestyle(key)}
              className={`surface-interactive relative flex items-center gap-3.5 rounded-[18px] border p-3.5 text-left sm:p-4 ${
                selected ? 'border-transparent bg-emerald-400/[0.07]' : 'border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.07]'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="lifestyle-tier-selection"
                  transition={springs.glide}
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-[18px] border-2 border-[#30d158] shadow-[0_0_0_4px_rgb(48_209_88/0.1),0_12px_32px_-14px_rgb(48_209_88/0.5)]"
                />
              )}
              <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white/[0.07] text-[26px] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
                {opt.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold capitalize leading-[22px] tracking-[-0.013em] text-white">{key.toLowerCase()}</span>
                <span className="mt-0.5 block text-[13px] leading-[18px] text-slate-400">{opt.description}</span>
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${tone}`}>
                    <span className="font-medium opacity-80">Happiness:</span>
                    {opt.happiness >= 0 ? '+' : ''}{opt.happiness}
                  </span>
                  {selected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#30d158] px-2 py-0.5 text-[12px] font-semibold text-[#03170a]">
                      <Check size={12} strokeWidth={3} aria-hidden />
                      Current Lifestyle
                    </span>
                  )}
                </span>
              </span>
              <span className="shrink-0 self-start text-right">
                <span className="block text-[11px] text-slate-500">Monthly Cost:</span>
                <span className="num block text-[17px] font-semibold tracking-[-0.013em] text-white">{formatMoney(opt.cost)}</span>
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Trade-off chart */}
      <motion.section variants={riseIn} className="surface mt-6 p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-white">Lifestyle trade-offs</p>
            <p className="text-[13px] text-slate-400">Cost vs happiness (tap a point to choose)</p>
          </div>
          <div className="chip text-slate-400">
            Budget target: <span className="num font-semibold text-white">{formatMoney(budgetCost)}</span>
          </div>
        </div>

        <div className="h-56 min-h-[1px] min-w-[1px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
            <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis
                type="number"
                dataKey="cost"
                tick={{ fill: '#8e8e93', fontSize: 11 }}
                tickFormatter={(value: number) => formatMoney(value)}
                domain={[minCost * 0.9, maxCost * 1.05]}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="happiness"
                tick={{ fill: '#8e8e93', fontSize: 11 }}
                domain={[-20, 40]}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ stroke: 'rgba(255,255,255,0.18)' }}
                contentStyle={{
                  background: 'var(--mat-regular)',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 12,
                  fontSize: 12,
                  backdropFilter: 'blur(24px) saturate(180%)',
                  boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.6)'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'cost') return [formatMoney(value), 'Monthly cost'];
                  return [value, 'Happiness'];
                }}
                labelFormatter={(label, payload) => {
                  const point = payload?.[0]?.payload;
                  return point?.name ? point.name : '';
                }}
              />
              <ReferenceLine x={budgetCost} stroke="#64d2ff" strokeDasharray="4 4" />
              <Scatter
                data={otherPoints}
                fill="#8e8e93"
                onClick={(data) => {
                  const payload = data?.payload;
                  if (payload?.key) handleChangeLifestyle(payload.key);
                }}
              />
              {selectedPoint && (
                <Scatter
                  data={[selectedPoint]}
                  fill="#30d158"
                  onClick={(data) => {
                    const payload = data?.payload;
                    if (payload?.key) handleChangeLifestyle(payload.key);
                  }}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <input
          type="range"
          min={minCost}
          max={maxCost}
          value={budgetCost}
          onChange={(e) => setBudgetCost(Number(e.target.value))}
          className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#30d158] [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_3px_8px_rgb(0_0_0/0.3),0_0_0_0.5px_rgb(0_0_0/0.04)]"
          style={{ background: `linear-gradient(90deg, #30d158 ${budgetPercent}%, rgb(118 118 128 / 0.32) ${budgetPercent}%)` }}
        />
      </motion.section>

      {/* Stats Overview. Phase 1 slice 5: energy and stress lead, because they set this month's actions and the
          burnout risk; the other four sit under "More about you" with what each one actually changes. */}
      <motion.section variants={riseIn} className="surface mt-6 p-5">
        <h3 className="t-headline mb-4 text-white">Your Stats</h3>
        {(() => {
          const stats: Array<{ label: string; key: VitalKey; value: number; tipId: string; tipText: string }> = [
            {
              label: 'Energy',
              key: 'energy',
              value: gameState.stats.energy,
              tipId: 'stat-energy',
              tipText:
                'Energy drives productivity: Energy < 35 reduces Monthly Actions by 1. Energy ≥ 70 and Stress ≤ 60 gives +1 Monthly Action.',
            },
            {
              label: 'Stress',
              key: 'stress',
              value: gameState.stats.stress,
              tipId: 'stat-stress',
              tipText:
                'Stress reduces promotions and productivity: above ~30 lowers promotion chance; Stress ≥ 85 reduces Monthly Actions by 1. High stress drains health over time.',
            },
            {
              label: 'Happiness',
              key: 'happiness',
              value: gameState.stats.happiness,
              tipId: 'stat-happiness',
              tipText:
                'Happiness affects promotions: above ~50 increases promotion chance, below ~50 reduces it.',
            },
            {
              label: 'Health',
              key: 'health',
              value: gameState.stats.health,
              tipId: 'stat-health',
              tipText:
                'Health affects productivity: Health < 30 reduces Monthly Actions by 1. Low health also increases the chance of costly medical events.',
            },
            {
              label: 'Networking',
              key: 'networking',
              value: gameState.stats.networking,
              tipId: 'stat-networking',
              tipText:
                'Networking improves promotion odds. Networking actions raise this stat, helping you grow salary faster.',
            },
            {
              label: 'Financial IQ',
              key: 'financialIQ',
              value: gameState.stats.financialIQ,
              tipId: 'stat-financialiq',
              tipText:
                'Financial IQ grows as you learn and make informed choices. At 60 or more it adds a few points to your yearly performance review.',
            },
          ];
          const tile = (stat: typeof stats[number]) => (
            <div key={stat.label} className="rounded-2xl bg-white/[0.045] p-3.5">
              <div className="mb-2.5 flex items-center gap-2.5">
                <VitalGlyph tone={stat.key} size={26} />
                <p className="flex min-w-0 flex-1 items-center gap-1 text-[13px] font-medium text-slate-300">
                  <span className="truncate">{stat.label}</span>
                  <InfoTip id={stat.tipId} text={stat.tipText} />
                </p>
                <span className="num text-[17px] font-semibold tracking-[-0.013em] text-white">{formatStat(stat.value)}</span>
              </div>
              <VitalMeter value={stat.value} tone={stat.key} />
            </div>
          );
          return <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Energy and stress">{stats.slice(0, 2).map(tile)}</div>
            <details className="group mt-4" aria-label="More about you">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl py-1 text-[15px] font-medium text-[#0a84ff] [&::-webkit-details-marker]:hidden">
                <span className="flex-1">More about you (happiness, health, networking, financial IQ)</span>
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-[530ms] ease-spring group-open:rotate-90"><path d="m9 18 6-6-6-6" /></svg>
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{stats.slice(2).map(tile)}</div>
            </details>
          </>;
        })()}

        {/* Quick feedback on impact */}
        <div className="mt-5 flex gap-3 rounded-2xl bg-[#5e5ce6]/[0.1] p-4">
          <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5e5ce6]/25 text-[#a5a4ff]">
            <Info size={15} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="mb-1.5 text-[15px] font-semibold text-white">How this impacts you</p>
            <ul className="space-y-1.5 text-[13px] leading-[18px] text-slate-400">
              <li>
                Monthly Actions: <span className="num font-semibold text-white">{gameState.monthlyActionsMax}</span> (energy/health/stress thresholds apply)
              </li>
              <li>
                Promotion odds are driven by Networking + Happiness − Stress (higher stats = faster salary growth)
              </li>
              <li>
                Low Health / high Stress increases the chance of expensive medical events
              </li>
            </ul>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default LifestyleTab;
