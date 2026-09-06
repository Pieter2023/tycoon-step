import type { ActiveJourney } from '../../services/townJourney';
import type { TownPlaceId } from './townWorld';
import type { TownSpot } from './createTownScene';

export type GuideTarget = 'teller' | 'business' | 'cart' | 'cafe' | 'broker';
export type GuideContext = {
  journey: Pick<ActiveJourney, 'completed' | 'action' | 'button' | 'step'> & { stage?: 1 | 2 };
  room: 'city' | 'bank' | 'cafe' | 'exchange' | 'property' | 'home';
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
  if (journey.action === 'finish') return journal && showDetails ? (journey.stage === 2 ? 'Complete my investor journey ✦' : 'Complete my opening journey ✦') : journey.button;
  return journey.button;
}

// After a guided walk arrives, the next hop happens without another tap: through the
// bank door, up to the teller, into the café. Returns what to do now, or null to wait.
export function guideNextHop(target: GuideTarget, c: Pick<GuideContext, 'room' | 'near' | 'spot'>): 'enterBank' | 'walkToTeller' | 'enterCafe' | 'enterExchange' | 'walkToBroker' | 'arrived' | null {
  const { room, near, spot } = c;
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
