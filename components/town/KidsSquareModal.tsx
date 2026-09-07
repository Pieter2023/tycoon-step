import React, { useEffect, useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import Modal from '../Modal';
import type { KidsGameState, KidsCollectible } from '../../kidsTypes';
import { KIDS_COLLECTIBLES, KIDS_SAVINGS_GOALS } from '../../kidsConstants';
import { createTownScene, type TownController } from './createTownScene';
import type { TownPlaceId } from './townWorld';
import { characterSex } from './townResidents';
import { readQualityMode } from './townQuality';
import { KidsStop, STOP_PLACE, PLACE_STOP, stopName, stopEmoji, stopHint, weeklyAllowance, energyHearts, hustleCards, weeklyHustleEnergy, toyCards, collectionValue, valueArrow, goalCards, goalProgress } from '../../services/kidsSquare';
import { tl } from '../../i18n/town';
import './town.css';

type Props = { state: KidsGameState; onClose: () => void; onStartHustle: (id: string) => void; onBuy: (item: (typeof KIDS_COLLECTIBLES)[number]) => void; onSetGoal: (goal: (typeof KIDS_SAVINGS_GOALS)[number]) => void; onNextWeek: () => void; processing: boolean };
const money = (n: number) => `$${Math.round(n)}`;

// Money Quest's square: the same neighbourhood, four kid-sized stops, big buttons and short words.
export default function KidsSquareModal({ state, onClose, onStartHustle, onBuy, onSetGoal, onNextWeek, processing }: Props) {
  const host = useRef<HTMLDivElement>(null), controller = useRef<TownController | null>(null);
  const [near, setNear] = useState<TownPlaceId | null>(null), [open, setOpen] = useState<KidsStop | null>(null), [loading, setLoading] = useState(true), [unavailable, setUnavailable] = useState(false), [sound, setSound] = useState(false);
  const stick = useRef<number | null>(null), [thumb, setThumb] = useState({ x: 0, z: 0 });
  const stop = near ? PLACE_STOP[near] : null;
  useEffect(() => {
    if (!host.current) return;
    try {
      controller.current = createTownScene(host.current, id => { setNear(id); if (!id) setOpen(null); }, () => { const s = near ? PLACE_STOP[near] : null; if (s) setOpen(s); }, () => { setUnavailable(true); setLoading(false); }, false, () => setLoading(false), { playerSex: characterSex(state.character ? { id: state.character.id, name: state.character.name, avatarEmoji: state.character.emoji } : null), playerScale: .78, quality: readQualityMode() });
    } catch { setUnavailable(true); setLoading(false); }
    return () => { controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setBusiness(state.activeHustles.includes('lemonade'), true, false); controller.current?.setNeighbourhood?.(state.week, undefined, !!state.hasWon); }, [state.activeHustles, state.week, state.hasWon, loading]);
  useEffect(() => { if (state.pendingEvent) onClose(); }, [state.pendingEvent]);
  const go = (s: KidsStop) => { if (unavailable) { setNear(STOP_PLACE[s]); setOpen(s); return; } setOpen(null); controller.current?.walkTo(STOP_PLACE[s]); };
  const moveStick = (e: React.PointerEvent<HTMLDivElement>) => { if (stick.current !== e.pointerId) return; const r = e.currentTarget.getBoundingClientRect(); const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dz = (e.clientY - (r.top + r.height / 2)) / (r.height / 2); const len = Math.hypot(dx, dz) || 1, k = Math.min(1, len); setThumb({ x: dx / len * k, z: dz / len * k }); controller.current?.move(dx / len * k, dz / len * k); };
  const releaseStick = () => { stick.current = null; setThumb({ x: 0, z: 0 }); controller.current?.move(0, 0); };
  const allowance = weeklyAllowance(state), progress = goalProgress(state);
  return <Modal isOpen onClose={onClose} ariaLabel={tl('Your square', 'Tu plaza')} showCloseButton={false} overlayStyle={{ padding: 0 }} contentStyle={{ maxWidth: 1500, width: '100%' }} contentClassName="town-modal town-kids">
    <header className="town-header">
      <div><p className="town-eyebrow">{tl('Money Quest', 'Money Quest')} · {tl('week', 'semana')} {state.week}</p><h2>{state.character?.emoji} {tl('Your square', 'Tu plaza')}</h2></div>
      <div className="town-balance"><span>{tl('Coins', 'Monedas')} · {energyHearts(state)}</span><strong>{money(state.cash)}</strong></div>
      <button className="town-icon-button" onClick={onClose} aria-label={tl('Back to Money Quest', 'Volver a Money Quest')}><X size={22} /></button>
    </header>
    <nav className="town-destinations" aria-label={tl('Walk to a stop', 'Caminar a una parada')}>
      {(['piggy', 'lemonade', 'toys', 'goal'] as KidsStop[]).map(s => <button key={s} aria-pressed={stop === s} onClick={() => go(s)}><span className="town-dot" />{stopEmoji(s)} {stopName(s)}</button>)}
      <button className="town-guide-next" disabled={processing || !!state.pendingEvent} onClick={onNextWeek}>▶️ {tl('Next week', 'Próxima semana')}</button>
      <button className="town-sound" aria-pressed={sound} onClick={() => { const on = !sound; controller.current?.setSound(on); setSound(on); }}>{tl('Sound', 'Sonido')} {sound ? tl('on', 'sí') : tl('off', 'no')}</button>
    </nav>
    <div className={`town-body${open ? ' town-details-open' : ''}`}>
      <section className="town-viewport" aria-label={tl('Square', 'Plaza')}>
        <div className="town-canvas" ref={host} />
        {loading && <div className="town-loading" role="status"><span className="town-loading-orbit" /><strong>{tl('Opening your square…', 'Abriendo tu plaza…')}</strong></div>}
        {unavailable ? <div className="town-fallback"><h3>{tl('Use the buttons above to visit each stop', 'Usa los botones de arriba para visitar cada parada')}</h3></div> : <>
          <div className="town-world-caption"><span className="town-live-dot" /> {tl('WEEK', 'SEMANA')} {state.week}{state.hasWon ? ` · 🎉 ${tl('GOAL REACHED', 'META LOGRADA')}` : ''}<span>{tl('Tap a stop or the ground to walk.', 'Toca una parada o el suelo para caminar.')}</span></div>
          <button className="town-reset-camera" aria-label={tl('Reset camera', 'Reiniciar cámara')} onClick={() => controller.current?.resetView()}><RotateCcw size={18} /></button>
          <div className="town-location" role="status">{stop ? <button onClick={() => setOpen(stop)}><strong>{stopEmoji(stop)} {stopName(stop)}</strong><span>{stopHint(stop)} →</span></button> : <><strong>{tl('Where to?', '¿A dónde vamos?')}</strong><span>{tl('Pick a stop above.', 'Elige una parada arriba.')}</span></>}</div>
          <div className="town-joystick" role="group" aria-label={tl('Move', 'Mover')} tabIndex={0} onPointerDown={e => { e.preventDefault(); stick.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); moveStick(e); }} onPointerMove={moveStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}>
            <div className="town-joystick-cross" /><span className="town-joystick-thumb" style={{ transform: `translate(${thumb.x * 30}px, ${thumb.z * 30}px)` }} /><span className="town-joystick-label">{tl('MOVE', 'MOVER')}</span>
          </div>
        </>}
      </section>
      <aside className="town-details" aria-label={tl('Stop', 'Parada')} style={{ display: open ? 'block' : 'none' }}>
        <button className="town-close-details" aria-label={tl('Close', 'Cerrar')} onClick={() => setOpen(null)}><X size={18} /></button>
        {open === 'piggy' && <>
          <p className="town-eyebrow">🐷 {tl('PIGGY BANK', 'ALCANCÍA')}</p><h3>{money(state.cash)} {tl('in coins', 'en monedas')}</h3>
          <div className="town-lesson"><strong>{tl('Allowance next week', 'Mesada de la próxima semana')}: {money(allowance)}</strong><p>{tl('Saving means keeping coins for later instead of spending them now. The more you keep, the sooner you reach your goal.', 'Ahorrar es guardar monedas para después en lugar de gastarlas ahora. Cuanto más guardes, antes llegas a tu meta.')}</p></div>
          {state.savingsGoal && !state.savingsGoal.completed && <div className="town-lesson"><strong>{state.savingsGoal.emoji} {state.savingsGoal.name}: {progress}%</strong><div className="town-meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><p>{money(state.cash)} {tl('of', 'de')} {money(state.savingsGoal.targetAmount)}.</p></div>}
          <div className="town-lesson"><strong>{tl('Energy', 'Energía')} {energyHearts(state)}</strong><p>{tl('Jobs use energy. You get 2 back every week. Rest makes room for more jobs.', 'Los trabajos usan energía. Recuperas 2 cada semana. Descansar deja espacio para más trabajos.')}</p></div>
          <button className="town-primary" disabled={processing || !!state.pendingEvent} onClick={onNextWeek}>▶️ {tl('Next week', 'Próxima semana')}</button>
        </>}
        {open === 'lemonade' && <>
          <p className="town-eyebrow">🍋 {tl('LEMONADE STAND', 'PUESTO DE LIMONADA')}</p><h3>{tl('Earn coins with a job', 'Gana monedas con un trabajo')}</h3>
          <p className="town-small">{tl('Every job earns coins each week and uses energy. You have', 'Cada trabajo gana monedas cada semana y usa energía. Tienes')} {energyHearts(state)}{state.activeHustles.length ? ` · ${tl('your jobs use', 'tus trabajos usan')} ${weeklyHustleEnergy(state)} ⚡ ${tl('a week', 'por semana')}` : ''}.</p>
          {hustleCards(state).map(h => <div key={h.id} className="town-job"><strong>{h.emoji} {h.name} {h.active && <span className="town-tag town-tag-good">{tl('doing it', 'lo haces')}</span>}</strong><p className="town-small">{h.description} · {money(h.min)}–{money(h.max)} {tl('a week', 'por semana')} · {h.energy} ⚡{h.cost ? ` · ${tl('costs', 'cuesta')} ${money(h.cost)} ${tl('to start', 'para empezar')}` : ''}</p>{h.reason && !h.active && <p className="town-small town-caution">{h.reason}</p>}{!h.active && <button className="town-primary" disabled={!h.canStart || processing} onClick={() => onStartHustle(h.id)}>{tl('Start', 'Empezar')}{h.cost ? ` · ${money(h.cost)}` : ''}</button>}</div>)}
        </>}
        {open === 'toys' && <>
          <p className="town-eyebrow">🧸 {tl('TOY SHOP', 'JUGUETERÍA')}</p><h3>{tl('Wants and needs', 'Deseos y necesidades')}</h3>
          <p className="town-small">{tl('Buying is fun, and it moves coins away from your goal. Some things are worth more later, some less. Check your shelf each week.', 'Comprar es divertido, y aleja monedas de tu meta. Algunas cosas valen más después, otras menos. Revisa tu estante cada semana.')}</p>
          {state.collectibles.length > 0 && <div className="town-lesson"><strong>{tl('Your shelf', 'Tu estante')}: {money(collectionValue(state))}</strong><ul className="town-list">{state.collectibles.map((c: KidsCollectible) => <li key={c.id}>{c.emoji} {c.name} · {tl('paid', 'pagaste')} {money(c.purchasePrice)} · {tl('now', 'ahora')} {money(c.currentValue)} {valueArrow(c)}</li>)}</ul></div>}
          {toyCards(state).map(t => <div key={t.item.id} className="town-job"><strong>{t.item.emoji} {t.item.name} · {money(t.item.price)}</strong><p className="town-small">{t.item.description}</p>{t.reason && <p className="town-small town-caution">{t.reason}</p>}<button disabled={!t.canBuy || processing} onClick={() => onBuy(t.item)}>{tl('Buy', 'Comprar')} · {money(t.item.price)}</button></div>)}
        </>}
        {open === 'goal' && <>
          <p className="town-eyebrow">🎯 {tl('GOAL JAR', 'FRASCO DE METAS')}</p><h3>{state.hasWon ? `🎉 ${tl('You did it!', '¡Lo lograste!')}` : state.savingsGoal ? `${state.savingsGoal.emoji} ${state.savingsGoal.name}: ${progress}%` : tl('Pick something big to save for', 'Elige algo grande para ahorrar')}</h3>
          {state.savingsGoal && !state.savingsGoal.completed && <div className="town-meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>}
          <p className="town-small">{tl('A goal is a promise to yourself. Every coin you keep is a step closer.', 'Una meta es una promesa contigo. Cada moneda que guardas es un paso más cerca.')}</p>
          {goalCards(state).map(g => <div key={g.goal.id} className="town-job"><strong>{g.goal.emoji} {g.goal.name} · {money(g.goal.price)} {g.chosen && <span className="town-tag town-tag-good">{tl('my goal', 'mi meta')}</span>}{g.done && <span className="town-tag town-tag-good">✓ {tl('done', 'logrado')}</span>}</strong><p className="town-small">{g.goal.description}{g.weeksAway !== null && !g.done ? ` · ${g.weeksAway === 0 ? tl('you can afford it now!', '¡ya te alcanza!') : `${tl('about', 'unas')} ${g.weeksAway} ${tl(g.weeksAway === 1 ? 'week of allowance away' : 'weeks of allowance away', g.weeksAway === 1 ? 'semana de mesada' : 'semanas de mesada')}`}` : ''}</p>{!g.done && !g.chosen && <button className="town-primary" disabled={processing} onClick={() => onSetGoal(g.goal)}>{tl('Save for this', 'Ahorrar para esto')}</button>}</div>)}
        </>}
      </aside>
    </div>
  </Modal>;
}
