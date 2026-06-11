import React from 'react';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import Modal from '../Modal';
import { formatCurrencyCompactValue, formatCurrencyValue } from '../../i18n';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);
const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });

export type DashboardModalKind = 'netWorth' | 'cashFlow' | 'credit' | 'ai';

// Drill-down charts for the dashboard tiles. Pure display — all series and
// color classes are computed in App.
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

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 8,
  fontSize: 12
};

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
}) => (
  <Modal
    isOpen
    onClose={onClose}
    ariaLabel="Dashboard details"
    closeOnOverlayClick
    closeOnEsc
    contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full"
  >
    {kind === 'netWorth' && (
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Net Worth Trend</h2>
        <p className="text-slate-400 text-sm mb-4">
          Latest: <span className="text-white font-semibold">{formatMoney(netWorth)}</span>
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthTrendData}>
              <defs>
                <linearGradient id="netWorthDetailGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <RechartsTooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [formatMoneyFull(val), 'Net Worth']}
              />
              <Area type="monotone" dataKey="value" stroke="#34d399" fill="url(#netWorthDetailGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
    {kind === 'cashFlow' && (
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Cash Flow</h2>
        <p className="text-slate-400 text-sm mb-4">
          Latest net: <span className="text-white font-semibold">
            {latestCashFlowNet >= 0 ? '+' : '-'}{formatMoneyFull(Math.abs(latestCashFlowNet))}
          </span>
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowTrendData}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <RechartsTooltip
                contentStyle={tooltipStyle}
                formatter={(val: number, name: string) => [
                  formatMoneyFull(val),
                  name === 'income' ? 'Income' : 'Expenses'
                ]}
              />
              <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
    {kind === 'credit' && (
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Credit Score History</h2>
        <p className="text-slate-400 text-sm mb-4">
          Current score: <span className={`font-semibold ${creditTierColorClass}`}>{creditScore}</span>
          <span className="text-slate-500"> • {creditTier}</span>
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={creditTrendData}>
              <defs>
                <linearGradient id="creditDetailGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={[300, 850]} />
              <RechartsTooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [Math.round(val).toString(), 'Score']}
              />
              <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="url(#creditDetailGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
    {kind === 'ai' && (
      <div>
        <h2 className="text-xl font-bold text-white mb-2">AI Disruption Level</h2>
        <p className="text-slate-400 text-sm mb-4">
          Current: <span className="text-white font-semibold">{Math.round(aiDisruptionLevel)}%</span>
          <span className={`ml-2 font-semibold ${aiRiskColorClass}`}>
            {aiRiskLabel} risk
          </span>
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={aiTrendData}>
              <defs>
                <linearGradient id="aiDetailGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={[0, 100]} />
              <RechartsTooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [`${Math.round(val)}%`, 'Disruption']}
              />
              <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#aiDetailGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
  </Modal>
);

export default DashboardDetailModal;
