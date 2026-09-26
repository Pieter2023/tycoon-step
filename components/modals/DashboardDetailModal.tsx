import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import Modal from '../Modal';
import { AnimatedNumber, SegmentedControl } from '../ui';
import { MOTION_DISABLED, springs } from '../ui/motion';
import { formatCurrencyCompactValue, formatCurrencyValue } from '../../i18n';
import { chartAxisTick, chartTooltipStyle, useSheetReducedMotion } from './sheet';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);
const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });
const formatScore = (val: number): string => Math.round(val).toString();
const formatPct = (val: number): string => `${Math.round(val)}%`;

export type DashboardModalKind = 'netWorth' | 'cashFlow' | 'credit' | 'ai';

// Drill-down charts for the dashboard tiles. All series and color classes
// are computed in App; `kind` picks the initial chart and a switcher row
// lets the player flip between all four without reopening.
interface DashboardDetailModalProps {
  kind: DashboardModalKind;
  onClose: () => void;
  netWorth: number;
  netWorthTrendData: { label: string; value: number }[];
  latestCashFlowNet: number;
  cashFlowTrendData: { label: string; income: number; expenses: number }[];
  creditScore: number;
  creditTier: string;
  creditTierColorClass: string;
  creditTrendData: { label: string; value: number }[];
  aiDisruptionLevel: number;
  aiRiskLabel: string;
  aiRiskColorClass: string;
  aiTrendData: { label: string; value: number }[];
}

// Apple system tints for the series.
const GREEN = '#30d158';
const ORANGE = '#ff9f0a';
const CYAN = '#64d2ff';

const tooltipProps = {
  contentStyle: chartTooltipStyle,
  labelStyle: { color: '#8e8e93', marginBottom: 2 },
  itemStyle: { color: '#fff', padding: 0 },
  cursor: { stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1 }
};

const xAxisProps = {
  dataKey: 'label',
  tick: chartAxisTick,
  axisLine: false,
  tickLine: false,
  interval: 'preserveStartEnd' as const,
  minTickGap: 28,
  dy: 6
};

const grid = <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />;

/** The chart panel's heading: title, then the current figure large and tabular. */
const Headline: React.FC<{ title: string; label: string; children: React.ReactNode }> = ({ title, label, children }) => (
  <div className="mb-4">
    <h2 className="t-title-3 text-white">{title}</h2>
    <p className="mt-1 text-[14px] text-slate-400">
      {label} {children}
    </p>
  </div>
);

const DashboardDetailModal: React.FC<DashboardDetailModalProps> = ({
  kind,
  onClose,
  netWorth,
  netWorthTrendData,
  latestCashFlowNet,
  cashFlowTrendData,
  creditScore,
  creditTier,
  creditTierColorClass,
  creditTrendData,
  aiDisruptionLevel,
  aiRiskLabel,
  aiRiskColorClass,
  aiTrendData
}) => {
  const [active, setActive] = useState<DashboardModalKind>(kind);
  const reduce = useSheetReducedMotion();
  const Panel = (MOTION_DISABLED ? 'div' : motion.div) as React.ElementType;
  // Each chart arrives with a short rise when you switch (no exit wait: the new one never queues behind the old).
  const panelMotion = MOTION_DISABLED
    ? {}
    : {
        initial: reduce ? { opacity: 0 } : { opacity: 0, y: 8 },
        animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0 },
        transition: reduce ? { duration: 0.2 } : springs.smooth
      };
  const animateChart = !MOTION_DISABLED && !reduce;

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Dashboard details"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="max-w-3xl!"
    >
      <div className="px-5 pb-6 pt-5 sm:px-6">
        <div className="mb-5 pr-12">
          <SegmentedControl<DashboardModalKind>
            role="group"
            size="sm"
            value={active}
            onChange={setActive}
            options={[
              { value: 'netWorth', label: 'Net worth' },
              { value: 'cashFlow', label: 'Cash flow' },
              { value: 'credit', label: 'Credit' },
              { value: 'ai', label: 'AI risk' }
            ]}
          />
        </div>

        {active === 'netWorth' && (
          <Panel key="netWorth" {...panelMotion}>
            <Headline title="Net Worth Trend" label="Latest:">
              <span className="num text-[15px] font-semibold text-white">
                <AnimatedNumber value={netWorth} format={formatMoney} flash={false} />
              </span>
            </Headline>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthTrendData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netWorthDetailGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GREEN} stopOpacity={0.38} />
                      <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {grid}
                  <XAxis {...xAxisProps} />
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <RechartsTooltip
                    {...tooltipProps}
                    formatter={(val: number) => [formatMoneyFull(val), 'Net Worth']}
                  />
                  <Area type="monotone" dataKey="value" stroke={GREEN} fill="url(#netWorthDetailGradient)" strokeWidth={2.25} isAnimationActive={animateChart} animationDuration={700} activeDot={{ r: 4, fill: GREEN, stroke: '#1c1c1e', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
        {active === 'cashFlow' && (
          <Panel key="cashFlow" {...panelMotion}>
            <Headline title="Cash Flow" label="Latest net:">
              <span className={`num text-[15px] font-semibold ${latestCashFlowNet >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {latestCashFlowNet >= 0 ? '+' : '-'}{formatMoneyFull(Math.abs(latestCashFlowNet))}
              </span>
            </Headline>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowTrendData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }} barGap={2}>
                  {grid}
                  <XAxis {...xAxisProps} />
                  <YAxis hide />
                  <RechartsTooltip
                    {...tooltipProps}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(val: number, name: string) => [
                      formatMoneyFull(val),
                      name === 'income' ? 'Income' : 'Expenses'
                    ]}
                  />
                  <Bar dataKey="income" fill={GREEN} radius={[5, 5, 1, 1]} maxBarSize={18} isAnimationActive={animateChart} animationDuration={600} />
                  <Bar dataKey="expenses" fill={ORANGE} radius={[5, 5, 1, 1]} maxBarSize={18} isAnimationActive={animateChart} animationDuration={600} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
        {active === 'credit' && (
          <Panel key="credit" {...panelMotion}>
            <Headline title="Credit Score History" label="Current score:">
              <span className={`num text-[15px] font-semibold ${creditTierColorClass}`}>
                <AnimatedNumber value={creditScore} format={formatScore} flash={false} />
              </span>
              <span className="text-slate-500"> • {creditTier}</span>
            </Headline>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={creditTrendData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="creditDetailGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CYAN} stopOpacity={0.36} />
                      <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {grid}
                  <XAxis {...xAxisProps} />
                  <YAxis hide domain={[300, 850]} />
                  <RechartsTooltip
                    {...tooltipProps}
                    formatter={(val: number) => [Math.round(val).toString(), 'Score']}
                  />
                  <Area type="monotone" dataKey="value" stroke={CYAN} fill="url(#creditDetailGradient)" strokeWidth={2.25} isAnimationActive={animateChart} animationDuration={700} activeDot={{ r: 4, fill: CYAN, stroke: '#1c1c1e', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
        {active === 'ai' && (
          <Panel key="ai" {...panelMotion}>
            <Headline title="AI Disruption Level" label="Current:">
              <span className="num text-[15px] font-semibold text-white">
                <AnimatedNumber value={aiDisruptionLevel} format={formatPct} flash={false} />
              </span>
              <span className={`ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[13px] font-semibold ${aiRiskColorClass}`}>
                {aiRiskLabel} risk
              </span>
            </Headline>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aiTrendData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiDetailGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ORANGE} stopOpacity={0.36} />
                      <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {grid}
                  <XAxis {...xAxisProps} />
                  <YAxis hide domain={[0, 100]} />
                  <RechartsTooltip
                    {...tooltipProps}
                    formatter={(val: number) => [`${Math.round(val)}%`, 'Disruption']}
                  />
                  <Area type="monotone" dataKey="value" stroke={ORANGE} fill="url(#aiDetailGradient)" strokeWidth={2.25} isAnimationActive={animateChart} animationDuration={700} activeDot={{ r: 4, fill: ORANGE, stroke: '#1c1c1e', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
      </div>
    </Modal>
  );
};

export default DashboardDetailModal;
