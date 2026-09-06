import { GameState } from '../types';
import { tl } from '../i18n/town';
import { coffeeCart } from './townProgress';
export type JourneyAction = 'event' | 'bank' | 'business' | 'cart' | 'review' | 'finish' | 'journal' | 'exchange' | 'invest' | 'work' | 'home' | 'rosa' | 'board';
export function townJourney(state: GameState) {
  const firstShift = state.townProgress?.firstShiftMonth ?? state.townProgress?.lastShift?.month;
  const completed = state.townProgress?.journeyCompletedMonth !== undefined;
  const milestones = [
    { title:tl('Plan your safety net','Planea tu red de seguridad'), done:!!state.townProgress?.reserveConfirmed },
    { title:tl('Buy your coffee cart','Compra tu carrito de café'), done:!!coffeeCart(state) },
    { title:tl('License your business','Licencia tu negocio'), done:state.townProgress?.permitMonth!==undefined },
    { title:tl('Run an owner’s shift','Haz un turno de dueño'), done:firstShift!==undefined },
    { title:tl('Review a trading month','Revisa un mes de ventas'), done:completed },
  ];
  const step=completed?5:milestones.findIndex(m=>!m.done);
  let title='', detail='', button='', action:JourneyAction='journal';
  if(completed){title=tl('Neighbourhood entrepreneur','Emprendedor del barrio');detail=tl('You planned a reserve, opened a business and reviewed the results. Your next goal: build a reliable profit before growing.','Planeaste una reserva, abriste un negocio y revisaste los resultados. Tu siguiente meta: lograr una ganancia confiable antes de crecer.');button=tl('View your journey','Ver tu recorrido');}
  else if(step===0){title=tl('Start with a safety net','Empieza con una red de seguridad');detail=tl('Walk inside the bank and talk to the teller. Keep one month of expenses in spending cash, then confirm your reserve plan.','Entra al banco y habla con el cajero. Mantén un mes de gastos en efectivo disponible y confirma tu plan de reserva.');button=tl('Go to the teller','Ir al cajero');action='bank';}
  else if(step===1){title=tl('Make your first business yours','Haz tuyo tu primer negocio');detail=tl('Visit Main Street and compare the cart’s price with the cash you need for bills. Buy when you can afford the trade-off.','Visita Main Street y compara el precio del carrito con el efectivo que necesitas para las facturas. Compra cuando puedas permitirte el trato.');button=tl('Go to Main Street','Ir a Main Street');action='business';}
  else if(step===2){title=tl('Get ready to open','Prepárate para abrir');detail=tl('Your cart needs a one-time $60 permit. Pay it before your first trading shift.','Tu carrito necesita un permiso único de $60. Págalo antes de tu primer turno de ventas.');button=tl('Go to your cart','Ir a tu carrito');action='cart';}
  else if(step===3){title=tl('Serve your first customers','Atiende a tus primeros clientes');detail=tl('Choose a price and fresh stock at your cart. Check the break-even point, then run a shift and read the receipt.','Elige un precio y surtido fresco en tu carrito. Revisa el punto de equilibrio, haz un turno y lee el recibo.');button=tl('Run your first shift','Haz tu primer turno');action='cart';}
  else {
    const canReview=firstShift!==undefined&&(state.lastMonthlyReport?.month??0)>firstShift;
    title=canReview?tl('See what your decisions earned','Mira lo que ganaron tus decisiones'):tl('Let the month play out','Deja que el mes transcurra');
    detail=canReview?tl('Review the month’s income and costs below, then complete your opening journey.','Revisa abajo los ingresos y costos del mes y completa tu recorrido inicial.'):tl('Your shift is recorded. Advance a month to compare regular business income with your expenses.','Tu turno quedó registrado. Avanza un mes para comparar el ingreso normal del negocio con tus gastos.');
    button=canReview?tl('Review & finish','Revisar y terminar'):tl('Preview next month','Vista previa del próximo mes');action=canReview?'finish':'review';
  }
  if(state.pendingScenario&&!completed){detail=tl('A decision is waiting. Resolve it first so you can make financial choices in the city.','Hay una decisión pendiente. Resuélvela primero para poder tomar decisiones financieras en la ciudad.');button=tl('Resolve the waiting event','Resolver el evento pendiente');action='event';}
  return {step,completed,milestones,title,detail,button,action};
}

export function completeTownJourney(state:GameState):GameState {
  if(state.pendingScenario||state.hasWon||state.isBankrupt||townJourney(state).action!=='finish')return state;
  return {...state,townProgress:{...state.townProgress,journeyCompletedMonth:state.month},events:[{
    id:`town-journey-${state.month}`,month:state.month,title:'Neighbourhood entrepreneur',
    description:'Planned a reserve, bought and licensed a coffee cart, ran an owner’s shift and reviewed a trading month. Earned a milestone badge; no cash bonus.',type:'ACHIEVEMENT',
  },...state.events]};
}

export const INDEX_FUND_IDS = ['sp500', 'total', 'intl', 'emerging', 'reit'];
export const HOLD_MONTHS = 3;
export const firstIndexMonth = (state: GameState): number | undefined => {
  const months = state.assets.filter(a => a.quantity > 0 && INDEX_FUND_IDS.includes(a.marketItemId ?? '')).map(a => a.priceHistory?.[0]?.month ?? state.month);
  return months.length ? Math.min(...months) : undefined;
};
// Second arc: learn the market by owning a slice of it and sitting through a few months.
export function investorJourney(state: GameState) {
  const visited = state.townProgress?.exchangeVisitedMonth !== undefined;
  const bought = firstIndexMonth(state);
  const held = bought !== undefined && state.month >= bought + HOLD_MONTHS;
  const completed = state.townProgress?.investorCompletedMonth !== undefined;
  const milestones = [
    { title: tl('Read the market mood at the Exchange','Lee el ánimo del mercado en la Bolsa'), done: visited },
    { title: tl('Own a slice of the whole market','Sé dueño de una parte de todo el mercado'), done: bought !== undefined },
    { title: `${tl('Hold it for','Consérvalo durante')} ${HOLD_MONTHS} ${tl('months','meses')}`, done: held },
    { title: tl('Compare growth with cash income','Compara el crecimiento con el ingreso en efectivo'), done: completed },
  ];
  const step = completed ? 4 : milestones.findIndex(m => !m.done);
  let title = '', detail = '', button = '', action: JourneyAction = 'journal';
  if (completed) { title = tl('Patient investor','Inversor paciente'); detail = tl('You bought a piece of the whole market and held it through the noise. Keep adding a little every month.','Compraste una parte de todo el mercado y la conservaste a pesar del ruido. Sigue agregando un poco cada mes.'); button = tl('View your journey','Ver tu recorrido'); }
  else if (step === 0) { title = tl('Meet the market','Conoce el mercado'); detail = tl('Walk into the Exchange and talk to the broker. The ticker shows whether the cycle is expanding or contracting.','Entra a la Bolsa y habla con el corredor. El ticker muestra si el ciclo se expande o se contrae.'); button = tl('Go to the Exchange','Ir a la Bolsa'); action = 'exchange'; }
  else if (step === 1) { title = tl('Buy your first index fund','Compra tu primer fondo indexado'); detail = tl('An index fund owns hundreds of companies at once. Buy what you can spare after your reserve; its price can fall.','Un fondo indexado posee cientos de empresas a la vez. Compra lo que puedas después de tu reserva; su precio puede bajar.'); button = tl('Buy an index fund','Comprar un fondo indexado'); action = 'invest'; }
  else if (step === 2) { const left = Math.max(0, (bought ?? state.month) + HOLD_MONTHS - state.month); title = tl('Let it ride','Déjalo correr'); detail = `${tl('Hold for','Consérvalo')} ${left} ${tl(left === 1 ? 'more month.' : 'more months.', left === 1 ? 'mes más.' : 'meses más.')} ${tl('Watch the price move and notice that nothing is spendable until you sell.','Observa cómo se mueve el precio y nota que nada se puede gastar hasta vender.')}`; button = tl('Preview next month','Vista previa del próximo mes'); action = 'review'; }
  else { title = tl('What did the market do for you?','¿Qué hizo el mercado por ti?'); detail = tl('Compare the index fund’s price change with the cash your cart and café paid. Growth builds wealth; income pays bills.','Compara el cambio de precio del fondo indexado con el efectivo que pagaron tu carrito y tu café. El crecimiento construye patrimonio; el ingreso paga facturas.'); button = tl('Review & finish','Revisar y terminar'); action = 'finish'; }
  if (state.pendingScenario && !completed) { detail = tl('A decision is waiting. Resolve it first so you can make financial choices in the city.','Hay una decisión pendiente. Resuélvela primero para poder tomar decisiones financieras en la ciudad.'); button = tl('Resolve the waiting event','Resolver el evento pendiente'); action = 'event'; }
  return { stage: 2 as const, step, completed, milestones, title, detail, button, action };
}
export function completeInvestorJourney(state: GameState): GameState {
  if (state.pendingScenario || state.hasWon || state.isBankrupt || investorJourney(state).action !== 'finish') return state;
  return { ...state, townProgress: { ...state.townProgress, investorCompletedMonth: state.month }, events: [{
    id: `investor-journey-${state.month}`, month: state.month, title: 'Patient investor',
    description: `Visited the Exchange, bought an index fund and held it for ${HOLD_MONTHS} months while comparing growth with cash income. Earned a milestone badge; no cash bonus.`, type: 'ACHIEVEMENT',
  }, ...state.events] };
}
// Third arc: settle into the neighbourhood. The places that explain the rest of your money: the
// office (where it comes from), your desk (where it goes), Rosa (a second opinion) and the board
// (a fresh goal every month, judged at month close).
export function tourJourney(state: GameState) {
  const p = state.townProgress, completed = p?.tourCompletedMonth !== undefined;
  const milestones = [
    { title: tl('Read your pay stub with your manager','Lee tu recibo de sueldo con tu jefe'), done: p?.workVisitedMonth !== undefined },
    { title: tl('Check the bills at your desk','Revisa las facturas en tu escritorio'), done: p?.homeVisitedMonth !== undefined },
    { title: tl('Ask Rosa for a second opinion','Pídele a Rosa una segunda opinión'), done: p?.rosaVisitedMonth !== undefined },
    { title: tl('Complete a notice-board challenge','Completa un reto del tablón'), done: (p?.challengeLog ?? []).some(r => r.completed.length > 0) },
    { title: tl('Complete your tour','Completa tu recorrido'), done: completed },
  ];
  const step = completed ? 5 : milestones.findIndex(m => !m.done);
  let title = '', detail = '', button = '', action: JourneyAction = 'journal';
  if (completed) { title = tl('Settled in','Ya eres del barrio'); detail = tl('You know where your money comes from, where it goes and who to ask. The board sets a fresh goal every month.','Sabes de dónde viene tu dinero, a dónde va y a quién preguntar. El tablón pone una meta nueva cada mes.'); button = tl('View your journey','Ver tu recorrido'); }
  else if (step === 0) { title = tl('Clock in','Ficha tu entrada'); detail = tl('Your salary funds everything else. Walk to Main Street Offices and read the pay stub with your manager: what comes off, and what the next title needs.','Tu sueldo financia todo lo demás. Ve a las Oficinas de Main Street y lee el recibo de sueldo con tu jefe: qué se descuenta y qué necesita el siguiente puesto.'); button = tl('Go to work','Ir al trabajo'); action = 'work'; }
  else if (step === 1) { title = tl('Know your bills','Conoce tus facturas'); detail = tl('Go home and sit at your desk. Lifestyle is the one bill you choose; see what share of your pay it takes.','Ve a casa y siéntate en tu escritorio. El estilo de vida es la única factura que eliges; mira qué parte de tu sueldo se lleva.'); button = tl('Go home','Ir a casa'); action = 'home'; }
  else if (step === 2) { title = tl('Get a second opinion','Pide una segunda opinión'); detail = tl('Rosa on the west bench reads your real numbers and says what a sensible friend would. Ask her.','Rosa, en el banco del oeste, lee tus números reales y dice lo que diría una amiga sensata. Pregúntale.'); button = tl('Talk to Rosa','Hablar con Rosa'); action = 'rosa'; }
  else if (step === 3) { title = tl('Take a challenge','Acepta un reto'); detail = tl('The notice board sets three small goals each month and judges them when the month closes. Complete one.','El tablón pone tres metas pequeñas cada mes y las evalúa al cerrar el mes. Completa una.'); button = tl('Read the board','Leer el tablón'); action = 'board'; }
  else { title = tl('You know the neighbourhood','Conoces el barrio'); detail = tl('Pay, bills, advice and a monthly goal: the whole loop in one square. Complete your tour.','Sueldo, facturas, consejo y una meta mensual: todo el ciclo en una plaza. Completa tu recorrido.'); button = tl('Review & finish','Revisar y terminar'); action = 'finish'; }
  if (state.pendingScenario && !completed) { detail = tl('A decision is waiting. Resolve it first so you can make financial choices in the city.','Hay una decisión pendiente. Resuélvela primero para poder tomar decisiones financieras en la ciudad.'); button = tl('Resolve the waiting event','Resolver el evento pendiente'); action = 'event'; }
  return { stage: 3 as const, step, completed, milestones, title, detail, button, action };
}
export function completeTourJourney(state: GameState): GameState {
  if (state.pendingScenario || state.hasWon || state.isBankrupt || tourJourney(state).action !== 'finish') return state;
  return { ...state, townProgress: { ...state.townProgress, tourCompletedMonth: state.month }, events: [{
    id: `tour-journey-${state.month}`, month: state.month, title: 'Settled in',
    description: 'Read a pay stub with the manager, checked the bills at home, asked Rosa for a second opinion and completed a notice-board challenge. Earned a milestone badge; no cash bonus.', type: 'ACHIEVEMENT',
  }, ...state.events] };
}
// The journey the city guide shows right now: the opening arc, then the investor arc, then the tour.
export type ActiveJourney = (ReturnType<typeof townJourney> & { stage: 1 }) | ReturnType<typeof investorJourney> | ReturnType<typeof tourJourney>;
export const activeJourney = (state: GameState): ActiveJourney => {
  const opening = townJourney(state);
  if (!opening.completed) return { ...opening, stage: 1 as const };
  const investor = investorJourney(state);
  return investor.completed ? tourJourney(state) : investor;
};
export const completeActiveJourney = (state: GameState): GameState => !townJourney(state).completed ? completeTownJourney(state) : !investorJourney(state).completed ? completeInvestorJourney(state) : completeTourJourney(state);
