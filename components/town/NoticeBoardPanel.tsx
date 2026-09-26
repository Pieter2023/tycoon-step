import React from 'react';
import type { GameState } from '../../types';
import { monthlyChallenges, challengeProgress, currentSnapshot, cleanSweeps, completedCount } from '../../services/townChallenges';
import { tl } from '../../i18n/town';
import { useI18n } from '../../i18n';
import { questBoard, progressText, rewardText } from '../../services/townQuests';
import { freedomTrack } from '../../services/freedomTrack';
import { FREEDOM_TRACK_IDS } from '../../constants';

const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
// The square's notice board: three challenges for this month with live progress, last month's
// verdict and the running badge count. Judged when the month closes; badges only, no cash.
export default function NoticeBoardPanel({ state, onNextMonth, disabled, onClaimQuest, onOpenQuests }: { state: GameState; onNextMonth: () => void; disabled: boolean; onClaimQuest?: (id: string) => void; onOpenQuests?: () => void }) {
  const { t } = useI18n(), quests = questBoard(state), track = freedomTrack(state);
  // Ready rewards first, then the chapter's milestones in order, then story and side goals (questBoard sorts track first).
  const cards = [...quests.ready, ...quests.active];
  const trackCards = cards.filter(q => FREEDOM_TRACK_IDS.has(q.id)), otherCards = cards.filter(q => !FREEDOM_TRACK_IDS.has(q.id));
  const snapshot = currentSnapshot(state), challenges = monthlyChallenges(state), progress = challenges.map(c => challengeProgress(c, snapshot, state));
  const done = progress.filter(p => p.done).length, log = state.townProgress?.challengeLog ?? [], last = log[log.length - 1];
  return <>
    <p className="town-eyebrow">{tl('NOTICE BOARD · MONTH','TABLÓN DE ANUNCIOS · MES')} {state.month}</p><h3>{done === challenges.length ? tl('Clean sweep so far.','Pleno por ahora.') : `${done} ${tl('of','de')} ${challenges.length} ${tl('done this month.','logrados este mes.')}`}</h3>
    <p className="town-intro">{tl('Three small habits, judged when the month closes. They count what you do from now, not what you already had. Badges only; these challenges give no cash reward.','Tres pequeños hábitos, evaluados al cerrar el mes. Cuentan lo que hagas desde ahora, no lo que ya tenías. Solo insignias; estos retos no dan dinero.')}</p>
    <ol className="town-challenges">{challenges.map((c, i) => { const p = progress[i]; const pct = Math.min(100, Math.round(100 * p.value / Math.max(1, p.target))); return <li key={c.id} className={p.done ? 'done' : ''}>
      <span aria-hidden="true">{p.done ? '✓' : i + 1}</span>
      <div><strong>{c.title}</strong><p>{c.detail}</p><div className="town-reputation-bar" role="img" aria-label={`${pct}% ${tl('of target','del objetivo')}`}><span style={{ width: `${pct}%` }} /></div><small>{c.unit === 'dollars' ? `${money(p.value)} ${tl('of','de')} ${money(p.target)}` : `${p.value} ${tl('of','de')} ${p.target}`}{p.done ? tl(' · done',' · logrado') : ''}</small></div>
    </li>; })}</ol>
    {last && <div className="town-lesson"><strong>{tl('Last month','El mes pasado')}: {last.completed.length} {tl('of','de')} {last.total}</strong><p>{last.completed.length === last.total ? tl('Every challenge landed. Keep the streak.','Todos los retos salieron. Mantén la racha.') : last.completed.length ? tl('Some habits stuck. The rest are back on the board in a new mix.','Algunos hábitos se quedaron. El resto vuelve al tablón en una mezcla nueva.') : tl('Nothing landed last month. Pick one challenge and finish it early this time.','Nada salió el mes pasado. Elige un reto y termínalo pronto esta vez.')}</p></div>}
    <div className="town-badge"><span>✦</span><strong>{completedCount(log)} {tl('challenges completed','retos logrados')} · {cleanSweeps(log)} {tl(cleanSweeps(log) === 1 ? 'clean sweep' : 'clean sweeps', cleanSweeps(log) === 1 ? 'pleno' : 'plenos')}</strong><p>{tl('Twelve months of results are kept. A clean sweep is all three in one month.','Se guardan doce meses de resultados. Un pleno son los tres en un mismo mes.')}</p></div>
    <section className="town-work-block" aria-label={tl('Freedom track','Camino a la libertad')}>
      <h4>{tl('Freedom track','Camino a la libertad')} · {track.current ? `${tl('Chapter','Capítulo')} ${track.current.number}: ${t(`track.chapter.${track.current.id}`)}` : t('track.freedomDay')} · {track.done}/{track.total}</h4>
      <p className="town-small">{tl('The same track as the dashboard: this chapter\'s milestones with live progress, then your story and side goals. Claim rewards here or there.','El mismo camino que en el panel: los hitos de este capítulo con progreso en vivo, y luego tu historia y metas extra. Reclama las recompensas aquí o allá.')}</p>
      {[...trackCards, ...otherCards].map(q => q.status === 'ready'
        ? <div key={q.id} className="town-job town-quest-ready" aria-label={t(q.titleKey)}><strong>🏆 {t(q.titleKey)} <span className="town-tag town-tag-good">{tl('Reward ready','Recompensa lista')}</span></strong><p className="town-small">{t(q.descriptionKey)} · {rewardText(q.reward)}</p><div className="town-actions"><button className="town-primary" disabled={disabled || !onClaimQuest} onClick={() => onClaimQuest?.(q.id)}>{tl('Claim','Reclamar')} · {rewardText(q.reward)}</button></div></div>
        : (() => { const pct = Math.round(q.progress * 100); return <div key={q.id} className="town-job" aria-label={t(q.titleKey)}><strong>{FREEDOM_TRACK_IDS.has(q.id) ? '◆ ' : ''}{t(q.titleKey)}</strong><p className="town-small">{t(q.descriptionKey)}</p><div className="town-reputation-bar" role="img" aria-label={`${pct}% ${tl('of target','del objetivo')}`}><span style={{ width: `${pct}%` }} /></div><small>{progressText(q)} · {tl('reward','recompensa')}: {rewardText(q.reward)}</small>{q.hintKey && <p className="town-small">💡 {t(q.hintKey)}</p>}</div>; })())}
      {trackCards.length + otherCards.length === 0 && <p className="town-small">{tl('Every milestone so far is done. The next opens as your money grows.','Todos los hitos hasta ahora están logrados. El siguiente se abre a medida que crece tu dinero.')}</p>}
      {onOpenQuests && <button className="town-text-button" onClick={onOpenQuests}>{tl('See the whole track →','Ver todo el camino →')}</button>}
    </section>
    <button className="town-primary" disabled={disabled} onClick={onNextMonth}>{tl('Close the month & judge →','Cerrar el mes y evaluar →')}</button>
  </>;
}
