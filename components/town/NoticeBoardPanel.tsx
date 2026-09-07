import React from 'react';
import type { GameState } from '../../types';
import { monthlyChallenges, challengeProgress, currentSnapshot, cleanSweeps, completedCount } from '../../services/townChallenges';
import { tl } from '../../i18n/town';
import { useI18n } from '../../i18n';
import { questBoard, progressText, rewardText } from '../../services/townQuests';

const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
// The square's notice board: three challenges for this month with live progress, last month's
// verdict and the running badge count. Judged when the month closes; badges only, no cash.
export default function NoticeBoardPanel({ state, onNextMonth, disabled, onClaimQuest, onOpenQuests }: { state: GameState; onNextMonth: () => void; disabled: boolean; onClaimQuest?: (id: string) => void; onOpenQuests?: () => void }) {
  const { t } = useI18n(), quests = questBoard(state);
  const snapshot = currentSnapshot(state), challenges = monthlyChallenges(state), progress = challenges.map(c => challengeProgress(c, snapshot, state));
  const done = progress.filter(p => p.done).length, log = state.townProgress?.challengeLog ?? [], last = log[log.length - 1];
  return <>
    <p className="town-eyebrow">{tl('NOTICE BOARD · MONTH','TABLÓN DE ANUNCIOS · MES')} {state.month}</p><h3>{done === challenges.length ? tl('Clean sweep so far.','Pleno por ahora.') : `${done} ${tl('of','de')} ${challenges.length} ${tl('done this month.','logrados este mes.')}`}</h3>
    <p className="town-intro">{tl('Three small habits, judged when the month closes. They count what you do from now, not what you already had. Badges only; the money stays real.','Tres pequeños hábitos, evaluados al cerrar el mes. Cuentan lo que hagas desde ahora, no lo que ya tenías. Solo insignias; el dinero sigue siendo real.')}</p>
    <ol className="town-challenges">{challenges.map((c, i) => { const p = progress[i]; const pct = Math.min(100, Math.round(100 * p.value / Math.max(1, p.target))); return <li key={c.id} className={p.done ? 'done' : ''}>
      <span aria-hidden="true">{p.done ? '✓' : i + 1}</span>
      <div><strong>{c.title}</strong><p>{c.detail}</p><div className="town-reputation-bar" role="img" aria-label={`${pct}% ${tl('of target','del objetivo')}`}><span style={{ width: `${pct}%` }} /></div><small>{c.unit === 'dollars' ? `${money(p.value)} ${tl('of','de')} ${money(p.target)}` : `${p.value} ${tl('of','de')} ${p.target}`}{p.done ? tl(' · done',' · logrado') : ''}</small></div>
    </li>; })}</ol>
    {last && <div className="town-lesson"><strong>{tl('Last month','El mes pasado')}: {last.completed.length} {tl('of','de')} {last.total}</strong><p>{last.completed.length === last.total ? tl('Every challenge landed. Keep the streak.','Todos los retos salieron. Mantén la racha.') : last.completed.length ? tl('Some habits stuck. The rest are back on the board in a new mix.','Algunos hábitos se quedaron. El resto vuelve al tablón en una mezcla nueva.') : tl('Nothing landed last month. Pick one challenge and finish it early this time.','Nada salió el mes pasado. Elige un reto y termínalo pronto esta vez.')}</p></div>}
    <div className="town-badge"><span>✦</span><strong>{completedCount(log)} {tl('challenges completed','retos logrados')} · {cleanSweeps(log)} {tl(cleanSweeps(log) === 1 ? 'clean sweep' : 'clean sweeps', cleanSweeps(log) === 1 ? 'pleno' : 'plenos')}</strong><p>{tl('Twelve months of results are kept. A clean sweep is all three in one month.','Se guardan doce meses de resultados. Un pleno son los tres en un mismo mes.')}</p></div>
    <section className="town-work-block" aria-label={tl('Quest log','Registro de misiones')}>
      <h4>{tl('Quest log','Registro de misiones')} · {quests.completed}/{quests.total}{quests.trackKey && <span className="town-tag">{t(quests.trackKey)}</span>}</h4>
      <p className="town-small">{tl('Longer goals from the dashboard, pinned here with live progress. Rewards are real: claim them.','Metas más largas del panel, fijadas aquí con progreso en vivo. Las recompensas son reales: reclámalas.')}</p>
      {quests.ready.map(q => <div key={q.id} className="town-job town-quest-ready" aria-label={t(q.titleKey)}><strong>🏆 {t(q.titleKey)} <span className="town-tag town-tag-good">{tl('Reward ready','Recompensa lista')}</span></strong><p className="town-small">{t(q.descriptionKey)} · {rewardText(q.reward)}</p><div className="town-actions"><button className="town-primary" disabled={disabled || !onClaimQuest} onClick={() => onClaimQuest?.(q.id)}>{tl('Claim','Reclamar')} · {rewardText(q.reward)}</button></div></div>)}
      {quests.active.map(q => { const pct = Math.round(q.progress * 100); return <div key={q.id} className="town-job" aria-label={t(q.titleKey)}><strong>{t(q.titleKey)}</strong><p className="town-small">{t(q.descriptionKey)}</p><div className="town-reputation-bar" role="img" aria-label={`${pct}% ${tl('of target','del objetivo')}`}><span style={{ width: `${pct}%` }} /></div><small>{progressText(q)} · {tl('reward','recompensa')}: {rewardText(q.reward)}</small>{q.hintKey && <p className="town-small">💡 {t(q.hintKey)}</p>}</div>; })}
      {quests.active.length === 0 && quests.ready.length === 0 && <p className="town-small">{tl('Every quest on your track is done. New ones unlock as your playstyle shows.','Todas las misiones de tu ruta están logradas. Se desbloquean nuevas según tu estilo de juego.')}</p>}
      {quests.upNext.length > 0 && <details className="town-catalogue"><summary>{tl('Up next','Lo que sigue')} ({quests.upNext.length})</summary>{quests.upNext.map(q => <div key={q.id} className="town-job"><strong>🔒 {t(q.titleKey)}</strong><p className="town-small">{t(q.descriptionKey)} · {tl('reward','recompensa')}: {rewardText(q.reward)}</p></div>)}</details>}
      {onOpenQuests && <button className="town-text-button" onClick={onOpenQuests}>{tl('Open the full quest log →','Abrir el registro completo →')}</button>}
    </section>
    <button className="town-primary" disabled={disabled} onClick={onNextMonth}>{tl('Close the month & judge →','Cerrar el mes y evaluar →')}</button>
  </>;
}
