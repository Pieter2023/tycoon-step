import type { ActiveJourney } from '../../services/townJourney';
import type { TownPlaceId } from './townWorld';
import type { TownSpot } from './createTownScene';
import type { GameState } from '../../types';
import { cafeWeather } from '../../services/townCafe';
import { tl } from '../../i18n/town';

// The caption over the 3D view: what kind of day it is and one line of colour. Financial freedom
// turns every day into Freedom Day until the player closes the game.
export function cityCaption(state: Pick<GameState, 'month' | 'hasWon' | 'cafe'>, room: string): { day: string; note: string } {
  const rainy = cafeWeather(state.month);
  if (state.hasWon) return { day: tl('FREEDOM DAY','DÍA DE LA LIBERTAD'), note: room === 'city' ? tl('Passive income covers your life · the square is celebrating you','Los ingresos pasivos cubren tu vida · la plaza te celebra') : tl('Financially free · come outside for the fireworks','Libre financieramente · sal a ver los fuegos artificiales') };
  if (room === 'cafe') return { day: rainy ? tl('RAIN','LLUVIA') : tl('MARKET DAY','DÍA DE MERCADO'), note: state.cafe?.plan.open ? tl('Trading plan saved · staff at work','Plan de ventas guardado · el personal trabaja') : tl('Your next chapter','Tu siguiente capítulo') };
  return rainy ? { day: tl('RAIN','LLUVIA'), note: tl('Rainy afternoon · quieter streets','Tarde lluviosa · calles más tranquilas') } : { day: tl('MARKET DAY','DÍA DE MERCADO'), note: tl('Market day · neighbours out and about','Día de mercado · vecinos por la calle') };
}

export type GuideTarget = 'teller' | 'business' | 'cart' | 'cafe' | 'broker' | 'manager' | 'desk' | 'rosa' | 'board';
export type GuideContext = {
  journey: Pick<ActiveJourney, 'completed' | 'action' | 'button' | 'step'> & { stage?: 1 | 2 | 3 };
  room: 'city' | 'bank' | 'cafe' | 'exchange' | 'property' | 'home' | 'work';
  near: TownPlaceId | null;
  spot: TownSpot;
  showDetails: boolean;
  journal: boolean;
  serviceActive: boolean;
  hasCafe: boolean;
};

// The single guide button always names the very next tap. Labels track where the
// player actually stands so "Go to the teller" becomes "Enter the bank", "Talk to
// teller" and finally "Confirm my cash reserve" without a stale label in between.
export function guideLabel(c: GuideContext): string {
  const { journey, room, near, spot, showDetails, journal, serviceActive, hasCafe } = c;
  const atBusiness = room === 'city' && near === 'business' && spot !== 'cart';
  if (journey.completed) {
    if (room === 'cafe') return serviceActive ? tl('Back to serving','Volver a atender') : hasCafe ? tl('Manage your café','Administrar tu café') : showDetails ? tl('Start a practice shift','Empezar un turno de práctica') : tl('Try a practice shift','Probar un turno de práctica');
    if (atBusiness) return hasCafe ? tl('Enter your café','Entrar a tu café') : tl('Enter the café','Entrar al café');
    return hasCafe ? tl('Visit your café','Visitar tu café') : tl('View the café space','Ver el local del café');
  }
  if (journey.action === 'exchange' || journey.action === 'invest') {
    if (room === 'exchange') return spot === 'broker' ? (showDetails ? (journey.action === 'invest' ? tl('Buy an index fund below','Comprar un fondo indexado abajo') : tl('Read the market mood','Leer el ánimo del mercado')) : tl('Talk to the broker','Hablar con el corredor')) : tl('Walk to the broker','Ir con el corredor');
    return near === 'exchange' ? tl('Enter the Exchange','Entrar a la Bolsa') : journey.button;
  }
  if (journey.action === 'bank') {
    if (room === 'bank') return spot === 'teller' ? (showDetails ? tl('Confirm my cash reserve','Confirmar mi reserva de efectivo') : tl('Talk to teller','Hablar con el cajero')) : tl('Walk to teller','Ir al cajero');
    return near === 'bank' ? tl('Enter the bank','Entrar al banco') : journey.button;
  }
  if (journey.action === 'business') return atBusiness ? (showDetails ? tl('Buy the coffee cart','Comprar el carrito de café') : tl('View the coffee cart','Ver el carrito de café')) : journey.button;
  if (journey.action === 'cart') return spot === 'cart' ? (showDetails ? (journey.step === 2 ? tl('Pay the $60 permit','Pagar el permiso de $60') : journey.button) : tl('Open your cart','Abrir tu carrito')) : journey.button;
  if (journey.action === 'finish') return journal && showDetails ? (journey.stage === 3 ? tl('Complete my neighbourhood tour ✦','Completar mi recorrido del barrio ✦') : journey.stage === 2 ? tl('Complete my investor journey ✦','Completar mi recorrido del inversor ✦') : tl('Complete my opening journey ✦','Completar mi recorrido inicial ✦')) : journey.button;
  if (journey.action === 'work') { if (room === 'work') return spot === 'manager' ? (showDetails ? tl('Read your pay stub','Leer tu recibo de sueldo') : tl('Talk to your manager','Hablar con tu jefe')) : tl('Walk to your manager','Ir con tu jefe'); return room === 'city' && spot === 'work' ? tl('Enter the office','Entrar a la oficina') : journey.button; }
  if (journey.action === 'home') { if (room === 'home') return spot === 'desk' ? (showDetails ? tl('Read your bills','Leer tus facturas') : tl('Sit at your desk','Sentarte en tu escritorio')) : tl('Walk to your desk','Ir a tu escritorio'); return room === 'city' && spot === 'home' ? tl('Enter your place','Entrar a tu casa') : journey.button; }
  if (journey.action === 'rosa') return room === 'city' && spot === 'rosa' ? (showDetails ? tl('Listen to Rosa','Escuchar a Rosa') : tl('Talk to Rosa','Hablar con Rosa')) : journey.button;
  if (journey.action === 'board') return room === 'city' && spot === 'board' ? (showDetails ? tl('Close the month & judge','Cerrar el mes y evaluar') : tl('Read the board','Leer el tablón')) : journey.button;
  return journey.button;
}

// After a guided walk arrives, the next hop happens without another tap: through the
// bank door, up to the teller, into the café. Returns what to do now, or null to wait.
export function guideNextHop(target: GuideTarget, c: Pick<GuideContext, 'room' | 'near' | 'spot'>): 'enterBank' | 'walkToTeller' | 'enterCafe' | 'enterExchange' | 'walkToBroker' | 'enterWork' | 'walkToManager' | 'enterHome' | 'walkToDesk' | 'arrived' | null {
  const { room, near, spot } = c;
  if (target === 'manager') { if (room === 'city') return spot === 'work' ? 'enterWork' : null; if (room === 'work') return spot === 'manager' ? 'arrived' : 'walkToManager'; return null; }
  if (target === 'desk') { if (room === 'city') return spot === 'home' ? 'enterHome' : null; if (room === 'home') return spot === 'desk' ? 'arrived' : 'walkToDesk'; return null; }
  if (target === 'rosa') return room === 'city' && spot === 'rosa' ? 'arrived' : null;
  if (target === 'board') return room === 'city' && spot === 'board' ? 'arrived' : null;
  if (target === 'broker') {
    if (room === 'city') return near === 'exchange' ? 'enterExchange' : null;
    if (room === 'exchange') return spot === 'broker' ? 'arrived' : 'walkToBroker';
    return null;
  }
  if (target === 'teller') {
    if (room === 'city') return near === 'bank' ? 'enterBank' : null;
    if (room === 'bank') return spot === 'teller' ? 'arrived' : 'walkToTeller';
    return null;
  }
  if (target === 'business') return room === 'city' && near === 'business' && spot !== 'cart' ? 'arrived' : null;
  if (target === 'cart') return room === 'city' && spot === 'cart' ? 'arrived' : null;
  if (room === 'city') return near === 'business' && spot !== 'cart' ? 'enterCafe' : null;
  return room === 'cafe' ? 'arrived' : null;
}
