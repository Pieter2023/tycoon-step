import React from 'react';
import type { GameState, Lifestyle } from '../../types';
import { LIFESTYLE_OPTS } from '../../constants';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';
import { adviseFrom } from '../../services/townAdvisor';
import { TIERS } from './townHome';

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
type Props = { state: GameState; disabled: boolean; onChangeLifestyle?: (lifestyle: Lifestyle) => void; onGo?: (place: NonNullable<ReturnType<typeof adviseFrom>[number]['place']>) => void };

// The desk at home: what your place costs and gives, the bills pinned to the fridge, the mail
// (this month's decisions and events), the bookshelf, and a sticky note from Rosa.
export default function HomePanel({ state, disabled, onChangeLifestyle, onGo }: Props) {
  const flow = calculateMonthlyCashFlowEstimate(state), current = LIFESTYLE_OPTS[state.lifestyle];
  const debtPayments = state.liabilities.reduce((s, l) => s + l.monthlyPayment, 0) + (state.mortgages ?? []).reduce((s, m) => s + m.monthlyPayment, 0);
  const share = Math.round(current.cost / Math.max(1, flow.income) * 100);
  const mail = state.events.slice(0, 4), advice = adviseFrom(state)[0];
  return <>
    <p className="town-eyebrow">YOUR PLACE · {state.lifestyle}</p><h3>{current.icon} {current.description}</h3>
    <div className="town-lesson"><strong>{money(current.cost)} a month · {share}% of your income</strong><p>Lifestyle is the one bill you choose. Happiness {current.happiness >= 0 ? '+' : ''}{current.happiness}. The gap between income and this number is what buys freedom.</p>
      <div className="town-tabs" aria-label="Move to a different place">{TIERS.map(t => <button key={t} aria-pressed={state.lifestyle === t} disabled={disabled || !onChangeLifestyle} title={`${LIFESTYLE_OPTS[t].description} · ${money(LIFESTYLE_OPTS[t].cost)}/mo`} onClick={() => onChangeLifestyle?.(t)}>{LIFESTYLE_OPTS[t].icon} {money(LIFESTYLE_OPTS[t].cost)}</button>)}</div>
      <p className="town-small">Moving takes effect immediately and asks you to confirm. Your place in the city changes to match.</p></div>
    <div className="town-lesson"><strong>On the fridge: this month's bills</strong>
      <dl className="town-bills"><div><dt>Income expected</dt><dd>{money(flow.income)}</dd></div><div><dt>Lifestyle</dt><dd>−{money(current.cost)}</dd></div><div><dt>Debt and mortgage payments</dt><dd>−{money(debtPayments)}</dd></div><div><dt>Everything else</dt><dd>−{money(Math.max(0, flow.expenses - current.cost - debtPayments))}</dd></div><div><dt>Left over</dt><dd className={flow.income - flow.expenses < 0 ? 'town-caution' : ''}>{money(flow.income - flow.expenses)}</dd></div></dl>
      <p>Passive income covers {Math.round(Math.min(999, flow.passive / Math.max(1, flow.expenses) * 100))}% of the bills. Freedom is 110%.</p></div>
    {advice && <div className={`town-lesson town-advice town-advice-${advice.tone}`}><strong>Rosa left a note: {advice.title}</strong><p>{advice.text}</p>{advice.place && onGo && <button className="town-text-button" onClick={() => onGo(advice.place!)}>Show me →</button>}</div>}
    <div className="town-lesson"><strong>The mail</strong>{mail.length ? mail.map(e => <p key={e.id}><strong>{e.title}</strong><br />{e.description}</p>) : <p>Nothing yet. Decisions and events land here.</p>}</div>
    <div className="town-lesson"><strong>Bookshelf</strong><p>{state.education?.degrees?.length ? `${state.education.degrees.length} qualification${state.education.degrees.length === 1 ? '' : 's'}: ${state.education.degrees.join(', ')}.` : 'No qualifications yet. Courses live under Learn; some investments need them.'}{state.family?.children?.length ? ` ${state.family.children.length} child${state.family.children.length === 1 ? '' : 'ren'} at home.` : ''}</p></div>
  </>;
}
