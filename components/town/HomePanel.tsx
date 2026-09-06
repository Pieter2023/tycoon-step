import React from 'react';
import type { GameState, Lifestyle } from '../../types';
import { LIFESTYLE_OPTS } from '../../constants';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';
import { adviseFrom } from '../../services/townAdvisor';
import { TIERS } from './townHome';
import { tl } from '../../i18n/town';

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
    <p className="town-eyebrow">{tl('YOUR PLACE','TU CASA')} · {state.lifestyle}</p><h3>{current.icon} {current.description}</h3>
    <div className="town-lesson"><strong>{money(current.cost)} {tl('a month','al mes')} · {share}% {tl('of your income','de tus ingresos')}</strong><p>{tl('Lifestyle is the one bill you choose. Happiness','El estilo de vida es la única factura que eliges. Felicidad')} {current.happiness >= 0 ? '+' : ''}{current.happiness}. {tl('The gap between income and this number is what buys freedom.','La brecha entre tus ingresos y este número es lo que compra la libertad.')}</p>
      <div className="town-tabs" aria-label={tl('Move to a different place','Mudarte a otro lugar')}>{TIERS.map(t => <button key={t} aria-pressed={state.lifestyle === t} disabled={disabled || !onChangeLifestyle} title={`${LIFESTYLE_OPTS[t].description} · ${money(LIFESTYLE_OPTS[t].cost)}/mo`} onClick={() => onChangeLifestyle?.(t)}>{LIFESTYLE_OPTS[t].icon} {money(LIFESTYLE_OPTS[t].cost)}</button>)}</div>
      <p className="town-small">{tl('Moving takes effect immediately and asks you to confirm. Your place in the city changes to match.','Mudarte surte efecto de inmediato y pide confirmación. Tu casa en la ciudad cambia para reflejarlo.')}</p></div>
    <div className="town-lesson"><strong>{tl('On the fridge: this month\'s bills','En el refrigerador: las facturas de este mes')}</strong>
      <dl className="town-bills"><div><dt>{tl('Income expected','Ingresos esperados')}</dt><dd>{money(flow.income)}</dd></div><div><dt>{tl('Lifestyle','Estilo de vida')}</dt><dd>−{money(current.cost)}</dd></div><div><dt>{tl('Debt and mortgage payments','Pagos de deuda e hipoteca')}</dt><dd>−{money(debtPayments)}</dd></div><div><dt>{tl('Everything else','Todo lo demás')}</dt><dd>−{money(Math.max(0, flow.expenses - current.cost - debtPayments))}</dd></div><div><dt>{tl('Left over','Lo que queda')}</dt><dd className={flow.income - flow.expenses < 0 ? 'town-caution' : ''}>{money(flow.income - flow.expenses)}</dd></div></dl>
      <p>{tl('Passive income covers','Los ingresos pasivos cubren el')} {Math.round(Math.min(999, flow.passive / Math.max(1, flow.expenses) * 100))}% {tl('of the bills. Freedom is 110%.','de las facturas. La libertad es 110%.')}</p></div>
    {advice && <div className={`town-lesson town-advice town-advice-${advice.tone}`}><strong>{tl('Rosa left a note','Rosa dejó una nota')}: {advice.title}</strong><p>{advice.text}</p>{advice.place && onGo && <button className="town-text-button" onClick={() => onGo(advice.place!)}>{tl('Show me →','Muéstrame →')}</button>}</div>}
    <div className="town-lesson"><strong>{tl('The mail','El correo')}</strong>{mail.length ? mail.map(e => <p key={e.id}><strong>{e.title}</strong><br />{e.description}</p>) : <p>{tl('Nothing yet. Decisions and events land here.','Nada todavía. Las decisiones y los eventos llegan aquí.')}</p>}</div>
    <div className="town-lesson"><strong>{tl('Bookshelf','Librero')}</strong><p>{state.education?.degrees?.length ? `${state.education.degrees.length} ${tl(state.education.degrees.length === 1 ? 'qualification' : 'qualifications', state.education.degrees.length === 1 ? 'título' : 'títulos')}: ${state.education.degrees.join(', ')}.` : tl('No qualifications yet. Courses live under Learn; some investments need them.','Sin títulos todavía. Los cursos están en Aprender; algunas inversiones los requieren.')}{state.family?.children?.length ? ` ${state.family.children.length} ${tl(state.family.children.length === 1 ? 'child at home.' : 'children at home.', state.family.children.length === 1 ? 'hijo en casa.' : 'hijos en casa.')}` : ''}</p></div>
  </>;
}
