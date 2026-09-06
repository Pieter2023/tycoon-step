import React from 'react';
import type { GameState } from '../../types';
import { payStub, promotionOutlook, jobSecurity, managerLine, money } from '../../services/townWork';

type Props = { state: GameState; disabled: boolean; onPromote?: () => void; onOpenLife?: (tab: 'career' | 'education') => void };

// The manager's desk: this month's pay stub reconciled to the dollar, how close the next title
// is and what is in the way, and how exposed this line of work is to automation and downturns.
export default function WorkPanel({ state, disabled, onPromote, onOpenLife }: Props) {
  const stub = payStub(state), outlook = promotionOutlook(state), security = jobSecurity(state);
  const progress = outlook.next ? Math.min(100, Math.round(outlook.experience / Math.max(1, outlook.next.experienceRequired) * 100)) : 100;
  return <>
    <p className="town-eyebrow">MAIN STREET OFFICES · {stub.employer.toUpperCase()}</p><h3>{managerLine(state)}</h3>
    <div className="town-lesson"><strong>{money(stub.net)} take-home this month</strong><p>Your salary is the engine that funds everything else, and tax comes off before you see it. The pay stub below reconciles to the dollar the turn pays you.</p></div>

    <section className="town-work-block" aria-label="Pay stub">
      <h4>Pay stub · {stub.title}</h4>
      <dl className="town-stub">
        {stub.lines.map((line, i) => <React.Fragment key={i}><dt>{line.label}{line.note && <small>{line.note}</small>}</dt><dd className={line.amount < 0 ? 'is-negative' : ''}>{money(line.amount)}</dd></React.Fragment>)}
        <dt>Gross pay</dt><dd>{money(stub.gross)}</dd>
        <dt>Income tax <small>your share of this year's bill, spread monthly</small></dt><dd className="is-negative">{money(-stub.tax)}</dd>
        <dt className="is-total">Take-home</dt><dd className="is-total">{money(stub.net)}</dd>
      </dl>
    </section>

    <section className="town-work-block" aria-label="Promotion outlook">
      <h4>{outlook.top ? 'Top of the ladder' : `Next title: ${outlook.next!.title}`}</h4>
      {outlook.next && <>
        <p className="town-small">{money(outlook.next.salary)} a month · {outlook.experience} of {outlook.next.experienceRequired} months' experience</p>
        <div className="town-meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Experience toward the next title"><span style={{ width: `${progress}%` }} /></div>
        {outlook.eligible ? <p className="town-small">You qualify. Each month you ask there is roughly a {Math.round(outlook.chance * 100)}% chance; expect about {outlook.expectedMonths} month{outlook.expectedMonths === 1 ? '' : 's'} of asking.</p> : null}
        {outlook.blockers.length > 0 && <ul className="town-list">{outlook.blockers.map(b => <li key={b}>⛔ {b}</li>)}</ul>}
        {outlook.boosters.length > 0 && <ul className="town-list">{outlook.boosters.map(b => <li key={b}>↑ {b}</li>)}</ul>}
        <div className="town-actions">
          <button className="town-primary" disabled={disabled || !outlook.eligible || !onPromote} onClick={onPromote}>Ask about a promotion</button>
          {!outlook.educationMet && onOpenLife && <button className="town-text-button" onClick={() => onOpenLife('education')}>Study options →</button>}
        </div>
      </>}
      {outlook.top && <p className="town-small">Every rung is behind you. From here, income growth comes from what you own, not what you are paid.</p>}
    </section>

    <section className="town-work-block" aria-label="Job security">
      <h4>How safe is this job? <span className={`town-tag town-tag-${security.label === 'Resilient' ? 'good' : security.label === 'Exposed' ? 'warn' : 'bad'}`}>{security.label}</span></h4>
      <p className="town-small">Future-proof score {security.score}/100 · AI exposure {Math.round(security.vulnerability * 100)}%. {security.text}</p>
      <ul className="town-list">{security.shields.map(s => <li key={s}>{s}</li>)}</ul>
      <p className="town-small">The only job security you control is not needing the job: a reserve, qualifications, a second income and, eventually, investments that pay the bills.</p>
      {onOpenLife && <div className="town-actions"><button className="town-text-button" onClick={() => onOpenLife('career')}>Career overview →</button><button className="town-text-button" onClick={() => onOpenLife('education')}>Study options →</button></div>}
    </section>
  </>;
}
