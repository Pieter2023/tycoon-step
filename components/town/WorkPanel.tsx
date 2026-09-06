import React from 'react';
import type { GameState } from '../../types';
import { payStub, promotionOutlook, jobSecurity, managerLine, money } from '../../services/townWork';
import { tl } from '../../i18n/town';

type Props = { state: GameState; disabled: boolean; onPromote?: () => void; onOpenLife?: (tab: 'career' | 'education') => void };

// The manager's desk: this month's pay stub reconciled to the dollar, how close the next title
// is and what is in the way, and how exposed this line of work is to automation and downturns.
export default function WorkPanel({ state, disabled, onPromote, onOpenLife }: Props) {
  const stub = payStub(state), outlook = promotionOutlook(state), security = jobSecurity(state);
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

    <section className="town-work-block" aria-label={tl('Job security','Seguridad laboral')}>
      <h4>{tl('How safe is this job?','¿Qué tan seguro es este empleo?')} <span className={`town-tag town-tag-${security.label === 'Resilient' ? 'good' : security.label === 'Exposed' ? 'warn' : 'bad'}`}>{tl(security.label, security.label === 'Resilient' ? 'Resistente' : security.label === 'Exposed' ? 'Expuesto' : 'En riesgo')}</span></h4>
      <p className="town-small">{tl('Future-proof score','Puntaje a prueba de futuro')} {security.score}/100 · {tl('AI exposure','Exposición a la IA')} {Math.round(security.vulnerability * 100)}%. {security.text}</p>
      <ul className="town-list">{security.shields.map(s => <li key={s}>{s}</li>)}</ul>
      <p className="town-small">{tl('The only job security you control is not needing the job: a reserve, qualifications, a second income and, eventually, investments that pay the bills.','La única seguridad laboral que controlas es no necesitar el empleo: una reserva, títulos, un segundo ingreso y, con el tiempo, inversiones que paguen las facturas.')}</p>
      {onOpenLife && <div className="town-actions"><button className="town-text-button" onClick={() => onOpenLife('career')}>{tl('Career overview →','Resumen de carrera →')}</button><button className="town-text-button" onClick={() => onOpenLife('education')}>{tl('Study options →','Opciones de estudio →')}</button></div>}
    </section>
  </>;
}
