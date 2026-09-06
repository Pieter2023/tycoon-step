import type { ActiveJourney } from '../../services/townJourney';
import type { TownPlaceId } from './townWorld';
import type { TownSpot } from './createTownScene';
import type { GameState } from '../../types';
import { cafeWeather } from '../../services/townCafe';

// The caption over the 3D view: what kind of day it is and one line of colour. Financial freedom
// turns every day into Freedom Day until the player closes the game.
export function cityCaption(state: Pick<GameState, 'month' | 'hasWon' | 'cafe'>, room: string): { day: string; note: string } {
  const rainy = cafeWeather(state.month);
  if (state.hasWon) return { day: 'FREEDOM DAY', note: room === 'city' ? 'Passive income covers your life · the square is celebrating you' : 'Financially free · come outside for the fireworks' };
  if (room === 'cafe') return { day: rainy ? 'RAIN' : 'MARKET DAY', note: state.cafe?.plan.open ? 'Trading plan saved · staff at work' : 'Your next chapter' };
  return rainy ? { day: 'RAIN', note: 'Rainy afternoon · quieter streets' } : { day: 'MARKET DAY', note: 'Market day · neighbours out and about' };
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
    if (room === 'cafe') return serviceActive ? 'Back to serving' : hasCafe ? 'Manage your café' : showDetails ? 'Start a practice shift' : 'Try a practice shift';
    if (atBusiness) return hasCafe ? 'Enter your café' : 'Enter the café';
    return hasCafe ? 'Visit your café' : 'View the café space';
  }
  if (journey.action === 'exchange' || journey.action === 'invest') {
    if (room === 'exchange') return spot === 'broker' ? (showDetails ? (journey.action === 'invest' ? 'Buy an index fund below' : 'Read the market mood') : 'Talk to the broker') : 'Walk to the broker';
    return near === 'exchange' ? 'Enter the Exchange' : journey.button;
  }
  if (journey.action === 'bank') {
    if (room === 'bank') return spot === 'teller' ? (showDetails ? 'Confirm my cash reserve' : 'Talk to teller') : 'Walk to teller';
    return near === 'bank' ? 'Enter the bank' : journey.button;
  }
  if (journey.action === 'business') return atBusiness ? (showDetails ? 'Buy the coffee cart' : 'View the coffee cart') : journey.button;
  if (journey.action === 'cart') return spot === 'cart' ? (showDetails ? (journey.step === 2 ? 'Pay the $60 permit' : journey.button) : 'Open your cart') : journey.button;
  if (journey.action === 'finish') return journal && showDetails ? (journey.stage === 3 ? 'Complete my neighbourhood tour ✦' : journey.stage === 2 ? 'Complete my investor journey ✦' : 'Complete my opening journey ✦') : journey.button;
  if (journey.action === 'work') { if (room === 'work') return spot === 'manager' ? (showDetails ? 'Read your pay stub' : 'Talk to your manager') : 'Walk to your manager'; return room === 'city' && spot === 'work' ? 'Enter the office' : journey.button; }
  if (journey.action === 'home') { if (room === 'home') return spot === 'desk' ? (showDetails ? 'Read your bills' : 'Sit at your desk') : 'Walk to your desk'; return room === 'city' && spot === 'home' ? 'Enter your place' : journey.button; }
  if (journey.action === 'rosa') return room === 'city' && spot === 'rosa' ? (showDetails ? 'Listen to Rosa' : 'Talk to Rosa') : journey.button;
  if (journey.action === 'board') return room === 'city' && spot === 'board' ? (showDetails ? 'Close the month & judge' : 'Read the board') : journey.button;
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
