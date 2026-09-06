import React, { useState } from 'react';
import type { CareerPath, MonthlyActionId } from '../../types';
import type { MonthlyActionsSummary } from '../../services/monthlyActions';
import { raiseOdds, jobBoard, careerChangeEligibility, layoffHazard, jobSearchOdds, reviewFactorLabel, mentorTalk, proposeRecoveryPlan, planProgress, planGoalLabel, PLAN_CREDIT, type RaiseAsk } from '../../services/townCareer';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';
import type { GameState } from '../../types';
import { payStub, promotionOutlook, jobSecurity, managerLine, money } from '../../services/townWork';
import { tl } from '../../i18n/town';

type Props = { state: GameState; disabled: boolean; onPromote?: () => void; onOpenLife?: (tab: 'career' | 'education') => void; onAskRaise?: (ask: RaiseAsk) => void; onSwitchCareer?: (path: CareerPath) => void; onJobSearch?: () => void; onAcceptPlan?: () => void; workActions?: MonthlyActionsSummary; onMonthlyAction?: (id: MonthlyActionId) => void };

// The manager's desk: this month's pay stub reconciled to the dollar, how close the next title
// is and what is in the way, and how exposed this line of work is to automation and downturns.
export default function WorkPanel({ state, disabled, onPromote, onOpenLife, onAskRaise, onSwitchCareer, onJobSearch, onAcceptPlan, workActions, onMonthlyAction }: Props) {
  const stub = payStub(state), outlook = promotionOutlook(state), security = jobSecurity(state);
  const [confirmPath, setConfirmPath] = useState<CareerPath | null>(null);
  const lastRaise = state.events.find(e => (e.title === 'Raise approved' || e.title === 'Raise declined') && e.month === state.month);
  const changeable = careerChangeEligibility(state), listings = jobBoard(state), deskActions = (workActions?.actions ?? []).filter(a => ['OVERTIME', 'NETWORK', 'TRAINING'].includes(a.id));
  const unemployed = (state.jobLossMonthsRemaining ?? 0) > 0, search = jobSearchOdds(state), hazard = layoffHazard(state), review = state.townProgress?.lastReview, runway = Math.floor(state.cash / Math.max(1, calculateMonthlyCashFlowEstimate(state).expenses));
  const lastSearch = state.events.find(e => e.title === 'Job search: offer accepted' && e.month === state.month);
  const talk = mentorTalk(state), plan = state.townProgress?.recoveryPlan, planActive = !!plan && !plan.result, proposal = proposeRecoveryPlan(state), planSteps = plan ? planProgress(state, plan) : [];
  const [talking, setTalking] = useState(false);
  const progress = outlook.next ? Math.min(100, Math.round(outlook.experience / Math.max(1, outlook.next.experienceRequired) * 100)) : 100;
  return <>
    <p className="town-eyebrow">{tl('MAIN STREET OFFICES','OFICINAS DE MAIN STREET')} · {stub.employer.toUpperCase()}</p><h3>{managerLine(state)}</h3>
    <div className="town-lesson"><strong>{money(stub.net)} {tl('take-home this month','netos este mes')}</strong><p>{tl('Your salary is the engine that funds everything else, and tax comes off before you see it. The pay stub below reconciles to the dollar the turn pays you.','Tu sueldo es el motor que financia todo lo demás, y el impuesto se descuenta antes de que lo veas. El recibo de abajo cuadra al dólar con lo que te paga el turno.')}</p></div>

    <section className="town-work-block" aria-label={tl('Pay stub','Recibo de sueldo')}>
      <h4>{tl('Pay stub','Recibo de sueldo')} · {stub.title}</h4>
      <dl className="town-stub">
        {stub.lines.map((line, i) => <React.Fragment key={i}><dt>{line.label}{line.note && <small>{line.note}</small>}</dt><dd className={line.amount < 0 ? 'is-negative' : ''}>{money(line.amount)}</dd></React.Fragment>)}
        <dt>{tl('Gross pay','Sueldo bruto')}</dt><dd>{money(stub.gross)}</dd>
        <dt>{tl('Income tax','Impuesto sobre la renta')} <small>{tl('your share of this year\'s bill, spread monthly','tu parte de la cuenta anual, repartida por mes')}</small></dt><dd className="is-negative">{money(-stub.tax)}</dd>
        <dt className="is-total">{tl('Take-home','Neto')}</dt><dd className="is-total">{money(stub.net)}</dd>
      </dl>
    </section>

    <section className="town-work-block" aria-label={tl('Promotion outlook','Perspectiva de ascenso')}>
      <h4>{outlook.top ? tl('Top of the ladder','Cima de la escalera') : `${tl('Next title','Siguiente puesto')}: ${outlook.next!.title}`}</h4>
      {outlook.next && <>
        <p className="town-small">{money(outlook.next.salary)} {tl('a month','al mes')} · {outlook.experience} {tl('of','de')} {outlook.next.experienceRequired} {tl('months\' experience','meses de experiencia')}</p>
        <div className="town-meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={tl('Experience toward the next title','Experiencia hacia el siguiente puesto')}><span style={{ width: `${progress}%` }} /></div>
        {outlook.eligible ? <p className="town-small">{tl('You qualify. Each month you ask there is roughly a','Cumples los requisitos. Cada mes que preguntes hay cerca de un')} {Math.round(outlook.chance * 100)}% {tl('chance; expect about','de probabilidad; cuenta con unos')} {outlook.expectedMonths} {tl(outlook.expectedMonths === 1 ? 'month of asking.' : 'months of asking.', outlook.expectedMonths === 1 ? 'mes de insistir.' : 'meses de insistir.')}</p> : null}
        {outlook.blockers.length > 0 && <ul className="town-list">{outlook.blockers.map(b => <li key={b}>⛔ {b}</li>)}</ul>}
        {outlook.boosters.length > 0 && <ul className="town-list">{outlook.boosters.map(b => <li key={b}>↑ {b}</li>)}</ul>}
        <div className="town-actions">
          <button className="town-primary" disabled={disabled || !outlook.eligible || !onPromote} onClick={onPromote}>{tl('Ask about a promotion','Pedir un ascenso')}</button>
          {!outlook.educationMet && onOpenLife && <button className="town-text-button" onClick={() => onOpenLife('education')}>{tl('Study options →','Opciones de estudio →')}</button>}
        </div>
      </>}
      {outlook.top && <p className="town-small">{tl('Every rung is behind you. From here, income growth comes from what you own, not what you are paid.','Ya subiste todos los peldaños. Desde aquí, el crecimiento viene de lo que posees, no de lo que te pagan.')}</p>}
    </section>

    {unemployed && <section className="town-work-block" aria-label={tl('Between jobs','Sin empleo')}>
      <h4>{tl('Between jobs','Sin empleo')} <span className="town-tag town-tag-bad">{state.jobLossMonthsRemaining} {tl(state.jobLossMonthsRemaining === 1 ? 'month' : 'months', state.jobLossMonthsRemaining === 1 ? 'mes' : 'meses')}</span></h4>
      <p className="town-small">{tl('No salary until you are back at work. Your cash covers about','Sin sueldo hasta que vuelvas a trabajar. Tu efectivo cubre unos')} {runway} {tl(runway === 1 ? 'month of bills.' : 'months of bills.', runway === 1 ? 'mes de facturas.' : 'meses de facturas.')} {tl('Apply once a month to shorten the gap, or take a different path from the job board below.','Postula una vez al mes para acortar la pausa, o toma otro camino en la bolsa de trabajo de abajo.')}</p>
      <button className="town-primary" disabled={disabled || !search.eligible || !onJobSearch} onClick={onJobSearch}>{tl('Apply for roles this month','Postular a puestos este mes')} · {Math.round(search.chance * 100)}% {tl('chance','de probabilidad')}</button>
      <ul className="town-list town-factors">{search.factors.map(f => <li key={f.label}>{f.delta >= 0 ? '↑' : '↓'} {f.label} {f.delta >= 0 ? '+' : ''}{Math.round(f.delta * 100)}%</li>)}</ul>
      {!search.eligible && <p className="town-small">{search.reason}</p>}
      {lastSearch && <p className="town-receipt" role="status">{lastSearch.description}</p>}
    </section>}

    <section className="town-work-block" aria-label={tl('One-on-one with your manager','Reunión uno a uno con tu jefe')}>
      <h4>{tl('One-on-one','Uno a uno')}{talk.projected && <span className={`town-tag ${talk.projected.grade === 'A' || talk.projected.grade === 'B' ? 'town-tag-good' : talk.projected.grade === 'C' ? 'town-tag-warn' : 'town-tag-bad'}`}>{tl('if the year ended today','si el año terminara hoy')}: {talk.projected.grade} · {talk.projected.score}</span>}</h4>
      {!talking ? <button className="town-primary" onClick={() => setTalking(true)}>{tl('Ask how you are doing','Preguntar cómo vas')}</button> : <>
        <p className="town-small town-quote">“{talk.opener}”</p>
        {talk.points.map(p => <div key={p.id} className="town-job"><strong>{p.id === 'projection' ? '' : reviewFactorLabel(p.id as Parameters<typeof reviewFactorLabel>[0])}{p.delta !== undefined ? ` (${p.delta})` : ''}</strong><p className="town-small">{p.why}</p><p className="town-small"><em>{p.fix}</em></p></div>)}
        <p className="town-small town-quote">“{talk.closing}”</p>
      </>}
      {plan && <div className="town-job"><strong>{planActive ? `${tl('Recovery plan','Plan de recuperación')} · ${Math.max(0, plan.endMonth - state.month)} ${tl('months left','meses restantes')}` : plan.result === 'completed' ? tl('Recovery plan completed ✓','Plan de recuperación completado ✓') : tl('Recovery plan missed','Plan de recuperación no cumplido')}</strong>
        <ul className="town-list">{planSteps.map(p => <li key={p.goal.id}>{p.done ? '✓' : '○'} {planGoalLabel(p.goal)}{p.goal.id === 'stress-down' || p.goal.id === 'network-up' ? ` (${tl('now','ahora')} ${p.value})` : p.goal.id === 'land-job' ? '' : ` (${p.value}/${p.goal.target})`}</li>)}</ul>
        {planActive && <p className="town-small">{tl('Judged in month','Se evalúa en el mes')} {plan.endMonth}. {tl('Completing it adds','Completarlo suma')} +{PLAN_CREDIT} {tl('to the next review','a la próxima evaluación')}{review?.grade === 'D' ? ` ${tl('and lifts the notice','y levanta el aviso')}` : ''}.</p>}
      </div>}
      {!planActive && proposal.length > 0 && !unemployed && <div className="town-actions"><button className="town-primary" disabled={disabled || !onAcceptPlan} onClick={onAcceptPlan}>{tl('Agree a 3-month plan','Acordar un plan de 3 meses')}: {proposal.map(g => planGoalLabel(g)).join(' · ')}</button></div>}
      {!planActive && proposal.length > 0 && unemployed && <div className="town-actions"><button className="town-primary" disabled={disabled || !onAcceptPlan} onClick={onAcceptPlan}>{tl('Agree a 3-month plan','Acordar un plan de 3 meses')}: {proposal.map(g => planGoalLabel(g)).join(' · ')}</button></div>}
    </section>

    {review && <section className="town-work-block" aria-label={tl('Last performance review','Última evaluación de desempeño')}>
      <h4>{tl('Last review','Última evaluación')} <span className={`town-tag ${review.grade === 'A' || review.grade === 'B' ? 'town-tag-good' : review.grade === 'C' ? 'town-tag-warn' : 'town-tag-bad'}`}>{review.grade} · {review.score}/100</span></h4>
      <p className="town-small">{tl('Year','Año')} {review.year}{review.bonus ? ` · ${tl('bonus','bono')} ${money(review.bonus)}` : ''}{review.grade === 'D' ? ` · ${tl('on notice: layoff risk doubled until the next review','en observación: riesgo de despido duplicado hasta la próxima evaluación')}` : ''}</p>
      <ul className="town-list town-factors">{review.factors.map(f => <li key={f.id}>{f.delta >= 0 ? '↑' : '↓'} {reviewFactorLabel(f.id)} {f.delta >= 0 ? '+' : ''}{f.delta}</li>)}</ul>
      <p className="town-small">{tl('Reviews land every January. Low stress, a strong network and desk actions lift the grade; months between jobs sink it. A and B pay a bonus and help the next promotion.','Las evaluaciones llegan cada enero. Poco estrés, una buena red y las acciones del escritorio suben la nota; los meses sin empleo la hunden. A y B pagan un bono y ayudan al siguiente ascenso.')}</p>
    </section>}

    {!unemployed && <section className="town-work-block" aria-label={tl('Ask for a raise','Pedir un aumento')}>
      <h4>{tl('Ask for a raise','Pedir un aumento')}</h4>
      <p className="town-small">{tl('Raises compound: every later increase builds on this one. Ask when your case is strongest. A refusal still nudges pay a little, and you cannot ask again for six months.','Los aumentos se acumulan: cada subida posterior parte de esta. Pide cuando tu caso sea más fuerte. Un rechazo aún mueve un poco el sueldo, y no podrás pedir de nuevo en seis meses.')}</p>
      {([8, 15] as const).map(ask => { const odds = raiseOdds(state, ask); return <div key={ask} className="town-raise">
        <button className="town-primary" disabled={disabled || !odds.eligible || !onAskRaise} onClick={() => onAskRaise?.(ask)}>{tl('Ask for','Pedir')} {ask}% · {Math.round(odds.chance * 100)}% {tl('chance','de probabilidad')}</button>
        <ul className="town-list town-factors">{odds.factors.map(f => <li key={f.label}>{f.delta >= 0 ? '↑' : '↓'} {f.label} {f.delta >= 0 ? '+' : ''}{Math.round(f.delta * 100)}%</li>)}</ul>
      </div>; })}
      {!raiseOdds(state, 8).eligible && <p className="town-small">{raiseOdds(state, 8).reason}</p>}
      {lastRaise && <p className="town-receipt" role="status">{lastRaise.description}</p>}
    </section>}

    {workActions && onMonthlyAction && deskActions.length > 0 && <section className="town-work-block" aria-label={tl('This month at work','Este mes en el trabajo')}>
      <h4>{tl('This month at work','Este mes en el trabajo')} <span className="town-tag town-tag-warn">{workActions.remaining}/{workActions.max} {tl('left','restantes')}</span></h4>
      {deskActions.map(a => <div key={a.id} className="town-job"><strong>{a.title}</strong><p className="town-small">{a.subtitle} · {a.details}</p><button disabled={disabled || a.disabled || workActions.locked || workActions.remaining <= 0} title={a.disabledReason} onClick={() => onMonthlyAction(a.id)}>{tl('Do it this month','Hacerlo este mes')}</button></div>)}
      <p className="town-small">{tl('The same actions as the dashboard: they spend this month\'s energy and count against the same limit.','Las mismas acciones del panel: gastan la energía de este mes y cuentan para el mismo límite.')}</p>
    </section>}

    <section className="town-work-block" aria-label={tl('Job security','Seguridad laboral')}>
      <h4>{tl('How safe is this job?','¿Qué tan seguro es este empleo?')} <span className={`town-tag town-tag-${security.label === 'Resilient' ? 'good' : security.label === 'Exposed' ? 'warn' : 'bad'}`}>{tl(security.label, security.label === 'Resilient' ? 'Resistente' : security.label === 'Exposed' ? 'Expuesto' : 'En riesgo')}</span></h4>
      <p className="town-small">{tl('Future-proof score','Puntaje a prueba de futuro')} {security.score}/100 · {tl('AI exposure','Exposición a la IA')} {Math.round(security.vulnerability * 100)}%. {security.text}</p>
      {hazard.monthly > 0 && <p className="town-small"><strong>{tl('Layoff risk','Riesgo de despido')}: {tl('about','cerca de')} {Math.round(hazard.annual * 100)}% {tl('over the next year','durante el próximo año')}</strong> · {hazard.factors.map(f => `${f.label} ×${f.multiplier.toFixed(1)}`).join(' · ')}. {tl('A cut pays severance from half a month to three months of salary, then three months without pay unless you land something sooner.','Un recorte paga una indemnización de entre medio mes y tres meses de sueldo, y luego tres meses sin sueldo salvo que consigas algo antes.')}</p>}
      <ul className="town-list">{security.shields.map(s => <li key={s}>{s}</li>)}</ul>
      <p className="town-small">{tl('The only job security you control is not needing the job: a reserve, qualifications, a second income and, eventually, investments that pay the bills.','La única seguridad laboral que controlas es no necesitar el empleo: una reserva, títulos, un segundo ingreso y, con el tiempo, inversiones que paguen las facturas.')}</p>
      {onOpenLife && <div className="town-actions"><button className="town-text-button" onClick={() => onOpenLife('career')}>{tl('Career overview →','Resumen de carrera →')}</button><button className="town-text-button" onClick={() => onOpenLife('education')}>{tl('Study options →','Opciones de estudio →')}</button></div>}
    </section>

    <section className="town-work-block" aria-label={tl('Job board','Bolsa de trabajo')}>
      <h4>{tl('Job board','Bolsa de trabajo')}</h4>
      <p className="town-small">{tl('Other ladders start at rung one. A change costs a month between jobs with no salary; a relevant qualification gives six months of credit. Weigh the entry pay against what you earn now, and the score against how exposed your field is.','Otras escaleras empiezan en el primer peldaño. Un cambio cuesta un mes sin sueldo entre empleos; un título relevante da seis meses de crédito. Compara el sueldo inicial con lo que ganas ahora, y el puntaje con lo expuesto que está tu campo.')}</p>
      {!changeable.eligible && <p className="town-small">{changeable.reason}</p>}
      {listings.map(j => <div key={j.path} className="town-job"><strong>{j.icon} {j.title} · {j.name}</strong><p className="town-small">{money(j.salary)} {tl('a month','al mes')} ({j.delta >= 0 ? '+' : ''}{money(j.delta)} {tl('vs now','frente a ahora')}) · {tl('future-proof','a prueba de futuro')} {j.futureProofScore}/100{j.relevantEducation ? ` · ${tl('your qualification fits','tu título encaja')}` : ''}</p>{j.mechanic && <p className="town-small">{j.mechanic}</p>}
        {confirmPath === j.path ? <div className="town-actions"><button className="town-primary" disabled={disabled || !onSwitchCareer} onClick={() => { onSwitchCareer?.(j.path); setConfirmPath(null); }}>{tl('Yes, change careers','Sí, cambiar de carrera')}</button><button className="town-text-button" onClick={() => setConfirmPath(null)}>{tl('Keep my job','Conservar mi empleo')}</button></div> : <button disabled={disabled || !changeable.eligible || !onSwitchCareer} onClick={() => setConfirmPath(j.path)}>{tl('Apply','Postular')}</button>}
      </div>)}
    </section>
  </>;
}
