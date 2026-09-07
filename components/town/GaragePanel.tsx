import React from 'react';
import type { GameState } from '../../types';
import { tl } from '../../i18n/town';
import { garage, money, AUTO_TERM, AUTO_APR, DEALER_HAIRCUT } from '../../services/townGarage';

type Props = { state: GameState; disabled: boolean; onBuyVehicle?: (listingId: string, finance: boolean) => void; onSellVehicle?: (vehicleId: string) => void };

// The parking bay: what the car really costs each month, what it is worth today and in five years,
// the loan if there is one, and a small lot to buy from, cash or financed.
export default function GaragePanel({ state, disabled, onBuyVehicle, onSellVehicle }: Props) {
  const g = garage(state);
  return <>
    <p className="town-eyebrow">{tl('PARKING BAY · 12 SQUARE ST','COCHERA · 12 SQUARE ST')}</p><h3>{g.headline}</h3>
    <div className="town-lesson"><strong>{tl('A car is the one big thing most people buy that loses money every month it exists.','Un auto es la única cosa grande que la mayoría compra y que pierde dinero cada mes que existe.')}</strong><p>{tl('It sits on your net worth today, and it is worth less every month. The true cost is upkeep plus lost value plus loan interest, not the payment. Buy the cheapest car that does the job, keep it a long time, and never borrow for the difference between fine and shiny.','Está en tu patrimonio hoy, y vale menos cada mes. El costo real es mantenimiento más valor perdido más interés del préstamo, no la cuota. Compra el auto más barato que haga el trabajo, consérvalo mucho tiempo y nunca pidas prestado por la diferencia entre bien y reluciente.')}</p></div>
    {g.cars.map(c => <section key={c.vehicle.id} className="town-work-block" aria-label={c.vehicle.name}>
      <h4>🚗 {c.vehicle.name} <span className="town-tag">{money(c.vehicle.value)} · {Math.floor(c.vehicle.age)} {tl('years old','años')}</span></h4>
      <dl className="town-bills"><div><dt>{tl('Upkeep','Mantenimiento')}</dt><dd>−{money(c.vehicle.monthlyMaintenance)}/{tl('mo','mes')}</dd></div><div><dt>{tl('Value lost this month','Valor perdido este mes')}</dt><dd>−{money(c.depreciation)}</dd></div>{c.loan && <><div><dt>{tl('Loan balance','Saldo del préstamo')}</dt><dd>{money(c.loan.balance)} @ {(c.loan.interestRate * 100).toFixed(1)}%</dd></div><div><dt>{tl('Of the payment, interest','De la cuota, interés')}</dt><dd>−{money(c.interest)}/{tl('mo','mes')}</dd></div></>}<div><dt><strong>{tl('True monthly cost','Costo mensual real')}</strong></dt><dd><strong>−{money(c.trueCost)}</strong></dd></div><div><dt>{tl('Worth in five years','Valor en cinco años')}</dt><dd>{money(c.inFiveYears)}</dd></div><div><dt>{tl('Dealer would pay today','Lo que pagaría un concesionario hoy')}</dt><dd>{money(c.resale)}{c.loan ? ` → ${money(c.equity)} ${tl('after the loan','tras el préstamo')}` : ''}</dd></div></dl>
      <p className="town-small">{c.share >= 100 ? tl('This car is worth more than everything else you own put together, and it loses value every month.','Este auto vale más que todo lo demás que posees junto, y pierde valor cada mes.') : c.share >= 30 ? `${c.share}% ${tl('of your net worth is parked here, losing value.','de tu patrimonio está estacionado aquí, perdiendo valor.')}` : `${c.share}% ${tl('of your net worth.','de tu patrimonio.')}`}</p>
      <div className="town-actions"><button disabled={disabled || !c.canSell || !onSellVehicle} onClick={() => onSellVehicle?.(c.vehicle.id)}>{tl('Sell to the dealer','Vender al concesionario')} · {money(c.resale)}</button>{c.sellReason && <p className="town-small">{c.sellReason}</p>}</div>
    </section>)}
    {g.carFree && <p className="town-small">{tl('Rideshare and delivery hustles in this game do not need your own car; the bay is optional.','Los ingresos extra de transporte y reparto en este juego no requieren auto propio; la cochera es opcional.')}</p>}
    <section className="town-work-block" aria-label={tl('The lot','El lote')}>
      <h4>{tl('The lot','El lote')}</h4>
      <p className="town-small">{tl('Financing:','Financiamiento:')} {Math.round(100 * .1)}% {tl('down, the rest over','de enganche, el resto en')} {AUTO_TERM} {tl('months at','meses al')} {(AUTO_APR * 100).toFixed(1)}%. {tl('The dealer buys back at','El concesionario recompra al')} {Math.round(DEALER_HAIRCUT * 100)}% {tl('under book value.','por debajo del valor en libros.')}</p>
      {g.offers.map(o => <div key={o.listing.id} className="town-job" aria-label={o.name}><strong>🚙 {o.name} · {money(o.listing.price)}</strong>
        <p className="town-small">{o.listing.blurb()} {tl('Upkeep','Mantenimiento')} {money(o.listing.maintenance)}/{tl('mo','mes')} · {tl('five-year cost about','costo a cinco años unos')} {money(o.fiveYearCost)} {tl('(upkeep plus lost value)','(mantenimiento más valor perdido)')}.</p>
        <div className="town-actions"><button className="town-primary" disabled={disabled || !o.canBuyCash || !onBuyVehicle} onClick={() => onBuyVehicle?.(o.listing.id, false)}>{tl('Buy for cash','Comprar de contado')}</button><button disabled={disabled || !o.canFinance || !onBuyVehicle} onClick={() => onBuyVehicle?.(o.listing.id, true)}>{tl('Finance','Financiar')} · {money(o.down)} {tl('down','de enganche')}, {money(o.payment)}/{tl('mo','mes')} (+{money(o.totalInterest)} {tl('interest','de interés')})</button></div>
        {o.reason && <p className="town-small">{o.reason}</p>}
      </div>)}
    </section>
  </>;
}
