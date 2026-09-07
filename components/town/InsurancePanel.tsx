import React, { useState } from 'react';
import type { GameState } from '../../types';
import { tl } from '../../i18n/town';
import { offers, ledger, money, type PolicyId } from '../../services/townInsurance';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';

type Props = { state: GameState; disabled: boolean; onBuyPolicy?: (id: PolicyId, deductible: number) => void; onCancelPolicy?: (id: PolicyId) => void };

// The insurance desk inside the bank: three policies priced on the player's own life, each with
// the biggest bill it covers shown with and without cover, and a ledger that tells the truth:
// most months the premium is money gone, and that is the point.
export default function InsurancePanel({ state, disabled, onBuyPolicy, onCancelPolicy }: Props) {
  const list = offers(state), book = ledger(state), flow = calculateMonthlyCashFlowEstimate(state);
  const [choice, setChoice] = useState<Partial<Record<PolicyId, number>>>({});
  const runway = Math.floor(state.cash / Math.max(1, flow.expenses));
  return <>
    <div className="town-lesson"><strong>{tl('Insurance is a bet you hope to lose.','El seguro es una apuesta que esperas perder.')}</strong><p>{tl('You pay a small amount every month so that one bad month cannot take everything. Most years the premium is money gone; the year it is not, it is the difference between a setback and a bankruptcy. Cover the bills you could not survive; self-insure the ones you could.','Pagas un poco cada mes para que un mal mes no se lo lleve todo. La mayoría de los años la prima es dinero perdido; el año que no lo es, marca la diferencia entre un tropiezo y una quiebra. Asegura las cuentas que no podrías sobrevivir; autoasegura las que sí.')} {tl('Your cash covers about','Tu efectivo cubre unos')} {runway} {tl(runway === 1 ? 'month of bills.' : 'months of bills.', runway === 1 ? 'mes de facturas.' : 'meses de facturas.')}</p></div>
    {list.map(o => { const picked = choice[o.id] ?? o.held?.deductible ?? o.options[0].deductible, pickedPremium = o.options.find(x => x.deductible === picked)?.premium ?? o.premium; return <div key={o.id} className="town-job" aria-label={o.name}>
      <strong>🛡️ {o.name} {o.held ? <span className="town-tag town-tag-good">{money(o.premium)}/{tl('mo','mes')} · {tl('since month','desde el mes')} {o.held.since}</span> : !o.available ? <span className="town-tag">{tl('Needs a business','Requiere un negocio')}</span> : null}</strong>
      <p className="town-small">{o.blurb}{o.loading > 0 ? ` ${tl('Premium loaded','Prima recargada')} +${Math.round(o.loading * 100)}% ${tl('after recent claims.','por reclamaciones recientes.')}` : ''}</p>
      {o.example.loss > 0 && <p className="town-small">{tl('Worst covered bill in the game','La peor cuenta cubierta del juego')}: {o.example.title} · {money(o.example.loss)}. {tl('With cover you pay','Con seguro pagas')} <strong>{money(o.example.withCover)}</strong>; {tl('without,','sin él,')} {money(o.example.loss)}.</p>}
      {o.held ? <div className="town-actions"><button disabled={disabled || !onCancelPolicy} onClick={() => onCancelPolicy?.(o.id)}>{tl('Cancel this cover','Cancelar este seguro')}</button></div> : o.available ? <>
        {o.options.length > 1 && <div className="town-tabs" aria-label={tl('Deductible','Deducible')}>{o.options.map(x => <button key={x.deductible} aria-pressed={picked === x.deductible} onClick={() => setChoice(c => ({ ...c, [o.id]: x.deductible }))}>{money(x.deductible)} {tl('deductible','deducible')} · {money(x.premium)}/{tl('mo','mes')}</button>)}</div>}
        <div className="town-actions"><button className="town-primary" disabled={disabled || !onBuyPolicy} onClick={() => onBuyPolicy?.(o.id, picked)}>{tl('Take out cover','Contratar')} · {money(pickedPremium)}/{tl('mo','mes')}</button></div>
      </> : null}
      <details className="town-catalogue"><summary>{tl('What it covers','Qué cubre')} ({o.covers.length})</summary><ul className="town-list">{o.covers.map(t => <li key={t}>{t}</li>)}</ul><p className="town-small">{tl('Events that already offer an insured option price it themselves; the policy pays on the others.','Los eventos que ya ofrecen una opción asegurada la cotizan por su cuenta; la póliza paga en los demás.')}</p></details>
    </div>; })}
    <div className="town-lesson"><strong>{tl('Your ledger','Tu registro')}</strong>
      <dl className="town-bills"><div><dt>{tl('Premiums now','Primas ahora')}</dt><dd>{money(book.monthly)}/{tl('mo','mes')}</dd></div><div><dt>{tl('Premiums paid so far','Primas pagadas hasta ahora')}</dt><dd>{money(book.premiumsPaid)}</dd></div><div><dt>{tl('Claims paid to you','Reclamaciones pagadas')}</dt><dd>{money(book.claimsPaid)}</dd></div></dl>
      {book.claims.length ? <ul className="town-list">{book.claims.map((c, i) => <li key={i}>{tl('Month','Mes')} {c.month}: {c.event} · {money(c.paid)} {tl('of','de')} {money(c.loss)}</li>)}</ul> : <p className="town-small">{tl('No claims yet. That is the normal state of an insured life.','Sin reclamaciones todavía. Ese es el estado normal de una vida asegurada.')}</p>}
    </div>
  </>;
}
