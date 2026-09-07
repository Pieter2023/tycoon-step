import React from 'react';
import type { GameState, Lifestyle, SideHustle, MonthlyActionId } from '../../types';
import type { MonthlyActionsSummary } from '../../services/monthlyActions';
import { hustleCards, hustleDeskSummary } from '../../services/townHustle';
import { LIFESTYLE_OPTS } from '../../constants';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';
import { adviseFrom } from '../../services/townAdvisor';
import { TIERS } from './townHome';
import { tl } from '../../i18n/town';

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
type Props = { state: GameState; disabled: boolean; onChangeLifestyle?: (lifestyle: Lifestyle) => void; onGo?: (place: NonNullable<ReturnType<typeof adviseFrom>[number]['place']>) => void; onStartHustle?: (hustle: SideHustle) => void; onStopHustle?: (id: string) => void; onChooseUpgrade?: () => void; workActions?: MonthlyActionsSummary; onMonthlyAction?: (id: MonthlyActionId) => void };

// The desk at home: what your place costs and gives, the bills pinned to the fridge, the mail
// (this month's decisions and events), the bookshelf, and a sticky note from Rosa.
export default function HomePanel({ state, disabled, onChangeLifestyle, onGo, onStartHustle, onStopHustle, onChooseUpgrade, workActions, onMonthlyAction }: Props) {
  const cards = hustleCards(state), desk = hustleDeskSummary(state), sprint = workActions?.actions.find(a => a.id === 'HUSTLE_SPRINT'), pending = state.pendingSideHustleUpgrade;
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
    <section className="town-work-block" aria-label={tl('Side-hustle desk','Escritorio de ingresos extra')}>
      <h4>{tl('Side-hustle desk','Escritorio de ingresos extra')} {desk.count > 0 && <span className="town-tag town-tag-good">{money(desk.monthly)}/{tl('mo','mes')} · {desk.hours} {tl('h/week','h/semana')}</span>}</h4>
      <p className="town-small">{desk.count ? `${tl('Your hustles cost about','Tus ingresos extra cuestan unos')} ${desk.energyCost} ${tl('energy and add','de energía y suman')} ${desk.stressCost} ${tl('stress a month. Average automation exposure','de estrés al mes. Exposición media a la automatización')} ${Math.round(desk.exposure * 100)}%.` : tl('A second engine. Every hustle is paid in hours, energy and stress before it pays in dollars; the teaching estimate below is the midpoint of its range, trimmed by how far automation has come.','Un segundo motor. Cada ingreso extra se paga en horas, energía y estrés antes de pagar en dólares; la estimación de abajo es el punto medio de su rango, recortado según cuánto ha avanzado la automatización.')}</p>
      {pending && <div className="town-job"><strong>{tl('Milestone reached','Hito alcanzado')}</strong><p className="town-small">{tl('One of your hustles has earned an upgrade choice.','Uno de tus ingresos extra ganó una opción de mejora.')}</p>{onChooseUpgrade && <button className="town-primary" onClick={onChooseUpgrade}>{tl('Choose the upgrade →','Elegir la mejora →')}</button>}</div>}
      {cards.filter(c => c.active).map(c => <div key={c.hustle.id} className="town-job"><strong>{c.hustle.icon} {c.hustle.name} <span className="town-tag town-tag-good">{tl('running','en marcha')}</span></strong>
        <p className="town-small">{tl('About','Unos')} {money(c.monthly)}/{tl('mo','mes')} · {c.hustle.hoursPerWeek} {tl('h/week','h/semana')} · {c.active!.monthsActive ?? 0} {tl('months in','meses')}{c.nextMilestoneIn !== undefined ? ` · ${tl('next milestone in','siguiente hito en')} ${c.nextMilestoneIn} ${tl(c.nextMilestoneIn === 1 ? 'month' : 'months', c.nextMilestoneIn === 1 ? 'mes' : 'meses')}` : ''}{c.active!.upgrades?.length ? ` · ${c.active!.upgrades!.length} ${tl('upgrade', 'mejora')}${c.active!.upgrades!.length === 1 ? '' : 's'}` : ''}</p>
        <button disabled={disabled || !onStopHustle} onClick={() => onStopHustle?.(c.hustle.id)}>{tl('Stop this hustle','Detener este ingreso extra')}</button></div>)}
      {sprint && onMonthlyAction && desk.count > 0 && <div className="town-job"><strong>{sprint.title}</strong><p className="town-small">{sprint.subtitle} · {sprint.details}</p><button disabled={disabled || sprint.disabled || !!workActions?.locked || (workActions?.remaining ?? 0) <= 0} title={sprint.disabledReason} onClick={() => onMonthlyAction('HUSTLE_SPRINT')}>{tl('Sprint this month','Acelerar este mes')}</button></div>}
      <details className="town-catalogue"><summary>{tl('Start a hustle','Empezar un ingreso extra')} ({cards.filter(c => !c.active).length})</summary>
        {cards.filter(c => !c.active).map(c => <div key={c.hustle.id} className="town-job"><strong>{c.hustle.icon} {c.hustle.name}</strong>
          <p className="town-small">{c.hustle.description}. {tl('About','Unos')} {money(c.monthly)}/{tl('mo','mes')} ({money(c.hustle.incomeRange.min)}–{money(c.hustle.incomeRange.max)}) · {c.hustle.hoursPerWeek} {tl('h/week','h/semana')} · {c.hustle.energyCost} {tl('energy','energía')}, +{c.hustle.stressIncrease} {tl('stress','estrés')} · {tl('automation exposure','exposición a la automatización')} {Math.round(c.hustle.aiVulnerability * 100)}%{c.hustle.startupCost ? ` · ${tl('start-up','inicio')} ${money(c.hustle.startupCost)}` : ''}{c.requirement ? ` · ${c.requirement}` : ''}</p>
          {c.reason && <p className="town-small town-caution">{c.reason}</p>}
          <button disabled={disabled || !c.canStart || !onStartHustle} onClick={() => onStartHustle?.(c.hustle)}>{c.hustle.startupCost ? `${tl('Start','Empezar')} · ${money(c.hustle.startupCost)}` : tl('Start','Empezar')}</button></div>)}
      </details>
    </section>
    {advice && <div className={`town-lesson town-advice town-advice-${advice.tone}`}><strong>{tl('Rosa left a note','Rosa dejó una nota')}: {advice.title}</strong><p>{advice.text}</p>{advice.place && onGo && <button className="town-text-button" onClick={() => onGo(advice.place!)}>{tl('Show me →','Muéstrame →')}</button>}</div>}
    <div className="town-lesson"><strong>{tl('The mail','El correo')}</strong>{mail.length ? mail.map(e => <p key={e.id}><strong>{e.title}</strong><br />{e.description}</p>) : <p>{tl('Nothing yet. Decisions and events land here.','Nada todavía. Las decisiones y los eventos llegan aquí.')}</p>}</div>
    <div className="town-lesson"><strong>{tl('Bookshelf','Librero')}</strong><p>{state.education?.degrees?.length ? `${state.education.degrees.length} ${tl(state.education.degrees.length === 1 ? 'qualification' : 'qualifications', state.education.degrees.length === 1 ? 'título' : 'títulos')}: ${state.education.degrees.join(', ')}.` : tl('No qualifications yet. The community college on the square prices every course by payback; some investments need one.','Sin títulos todavía. El colegio comunitario de la plaza valora cada curso por su retorno; algunas inversiones lo requieren.')}{state.family?.children?.length ? ` ${state.family.children.length} ${tl(state.family.children.length === 1 ? 'child at home.' : 'children at home.', state.family.children.length === 1 ? 'hijo en casa.' : 'hijos en casa.')}` : ''}</p></div>
  </>;
}
