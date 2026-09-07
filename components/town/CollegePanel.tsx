import React from 'react';
import type { GameState, EducationOption, TabId } from '../../types';
import { CAREER_PATHS } from '../../constants';
import { tl } from '../../i18n/town';
import { studyPlan, enrolment, registrarLine, certificates, money, levelName, type CourseCard } from '../../services/townCollege';

type Props = { state: GameState; disabled: boolean; onEnroll?: (edu: EducationOption) => void; onOpenLife?: (tab: TabId) => void };

// The registrar's desk: the study plan priced by payback, the course you are on, the four
// self-study certificates and the shelf. Enrolling hands the course to App's enrolment handler,
// which applies the same deposit, loan and confirmation rules as the Education tab.
export default function CollegePanel({ state, disabled, onEnroll, onOpenLife }: Props) {
  const plan = studyPlan(state), now = enrolment(state), certs = certificates(state);
  const path = state.career ? CAREER_PATHS[state.career.path]?.name : undefined;
  const statusTag = (c: CourseCard) => c.status === 'done' ? <span className="town-tag town-tag-good">{tl('Completed','Completado')}</span> : c.status === 'enrolled' ? <span className="town-tag">{tl('Enrolled','Inscrito')}</span> : c.status === 'locked' ? <span className="town-tag town-tag-bad">{tl('Prerequisite','Requisito previo')}</span> : c.status === 'short' ? <span className="town-tag town-tag-bad">{tl('Save up','Ahorra')}</span> : null;
  const course = (c: CourseCard) => <div key={c.id} className="town-job" aria-label={c.name}>
    <strong>{c.icon} {c.name} {statusTag(c)}</strong>
    <p className="town-small">{levelName(c.level)} · {money(c.cost)} · {c.months} {tl(c.months === 1 ? 'month' : 'months', c.months === 1 ? 'mes' : 'meses')}{c.loan > 0 ? ` · ${money(c.deposit)} ${tl('deposit, the rest on a student loan at 6.5%','de anticipo, el resto con préstamo estudiantil al 6.5%')} (${money(c.loanPayment)}/${tl('mo','mes')})` : ` · ${tl('paid up front','pagado por adelantado')}`}</p>
    {c.relevant ? <p className="town-small">{c.gainMonthly > 0 ? <>+{money(c.gainMonthly)} {tl('a month once finished','al mes al terminar')} · {tl('pays for itself in about','se paga sola en unos')} <strong>{c.paybackMonths} {tl('months','meses')}</strong> {tl('including study time','contando el tiempo de estudio')}</> : c.capped ? tl('Your salary is already at the education cap; this adds no raise.','Tu sueldo ya está en el tope por educación; esto no añade aumento.') : tl('No salary on file to project a raise from yet.','Aún no hay un sueldo registrado para proyectar un aumento.')}</p>
      : <p className="town-small">{tl('Not on your career path: it costs the same and adds no raise.','No es de tu carrera: cuesta lo mismo y no añade aumento.')}{path ? ` ${tl('Made for','Pensado para')}: ${c.option.relevantCareers.map(p => CAREER_PATHS[p]?.name ?? p).join(', ')}.` : ''}</p>}
    {c.status === 'open' || c.status === 'short' || c.status === 'locked' || c.status === 'busy' ? <div className="town-actions"><button className="town-primary" disabled={disabled || c.status !== 'open' || !onEnroll} onClick={() => onEnroll?.(c.option)}>{c.loan > 0 ? `${tl('Enrol · pay','Inscribirse · pagar')} ${money(c.deposit)} ${tl('deposit','de anticipo')}` : `${tl('Enrol · pay','Inscribirse · pagar')} ${money(c.cost)}`}</button>{c.reason && <p className="town-small">{c.reason}</p>}</div> : null}
  </div>;
  return <>
    <p className="town-eyebrow">{tl('COMMUNITY COLLEGE','COLEGIO COMUNITARIO')}{path ? ` · ${path.toUpperCase()}` : ''}</p><h3>{registrarLine(state)}</h3>
    <div className="town-lesson"><strong>{tl('Education is an investment with a payback period.','La educación es una inversión con un plazo de retorno.')}</strong><p>{tl('Every course is priced the way an investor prices anything: what it costs, what it adds each month, and how long until it has paid for itself. Only courses on your career path raise your salary; the rest cost the same and add nothing to your pay.','Cada curso se valora como un inversor valora cualquier cosa: lo que cuesta, lo que suma cada mes y cuánto tarda en pagarse. Solo los cursos de tu carrera suben tu sueldo; los demás cuestan lo mismo y no añaden nada a tu paga.')}</p></div>

    {now && <section className="town-work-block" aria-label={tl('Your course','Tu curso')}>
      <h4>{tl('Enrolled','Inscrito')} · {now.card.icon} {now.card.name}</h4>
      <p className="town-small">{now.monthsRemaining} {tl(now.monthsRemaining === 1 ? 'month to go' : 'months to go', now.monthsRemaining === 1 ? 'mes restante' : 'meses restantes')} · {now.monthsDone} {tl('of','de')} {now.card.months} {tl('done','hechos')}</p>
      <div className="town-meter" role="progressbar" aria-valuenow={Math.round(now.monthsDone / Math.max(1, now.card.months) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={tl('Course progress','Progreso del curso')}><span style={{ width: `${Math.round(now.monthsDone / Math.max(1, now.card.months) * 100)}%` }} /></div>
      {now.loanBalance > 0 && <p className="town-small">{tl('Student loan','Préstamo estudiantil')}: {money(now.loanBalance)} {tl('outstanding','pendiente')} · {money(now.loanPayment)} {tl('a month, already in your bills','al mes, ya incluido en tus facturas')}</p>}
      <p className="town-small">{now.card.relevant ? `${tl('Finishing raises your salary by about','Terminar sube tu sueldo unos')} ${money(now.card.gainMonthly)} ${tl('a month.','al mes.')}` : tl('This course is not on your career path, so it will not raise your salary.','Este curso no es de tu carrera, así que no subirá tu sueldo.')}</p>
    </section>}

    <section className="town-work-block" aria-label={tl('Study plan','Plan de estudio')}>
      <h4>{tl('Your study plan','Tu plan de estudio')}{path ? ` · ${path}` : ''}</h4>
      <p className="town-small">{tl('Courses on your path, quickest payback first.','Cursos de tu carrera, primero los de retorno más rápido.')}</p>
      {plan.relevant.filter(c => c.status !== 'done').slice(0, 4).map(course)}
      {plan.relevant.filter(c => c.status !== 'done').length === 0 && <p className="town-small">{tl('Every course on your path is complete.','Todos los cursos de tu carrera están completos.')}</p>}
      <details className="town-catalogue"><summary>{tl('All courses','Todos los cursos')} ({plan.cards.length})</summary>
        {plan.relevant.filter(c => c.status !== 'done').slice(4).map(course)}
        {plan.other.map(course)}
      </details>
    </section>

    <section className="town-work-block" aria-label={tl('Certificates','Certificados')}>
      <h4>{tl('Self-study certificates','Certificados de estudio propio')} · {certs.filter(c => c.certified).length}/{certs.length}</h4>
      <ul className="town-list">{certs.map(c => <li key={c.id}>{c.certified ? '✓' : '○'} <strong>{c.name}</strong> · {c.certified ? tl('certified','certificado') : `${tl('best score','mejor puntaje')} ${c.bestScore}/${c.total}`} · {c.perk}</li>)}</ul>
      {onOpenLife && <button className="town-text-button" onClick={() => onOpenLife('self_learn')}>{tl('Open the courses →','Abrir los cursos →')}</button>}
    </section>

    <section className="town-work-block" aria-label={tl('Your shelf','Tu librero')}>
      <h4>{tl('On your shelf','En tu librero')}</h4>
      {plan.degrees.length ? <ul className="town-list">{plan.degrees.map(c => <li key={c.id}>🎓 {c.icon} {c.name} · {levelName(c.level)}</li>)}</ul> : <p className="town-small">{tl('No qualifications yet. Some investments and promotions need one.','Sin títulos todavía. Algunas inversiones y ascensos requieren uno.')}</p>}
      {onOpenLife && <button className="town-text-button" onClick={() => onOpenLife('education')}>{tl('Education on the dashboard →','Educación en el panel →')}</button>}
    </section>
  </>;
}
