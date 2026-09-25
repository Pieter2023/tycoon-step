import type { LifeEventCategory } from '../types';
import { tl } from '../i18n/town';

// Events happen in the world (Phase 1, slice 3): when a life event arrives while the player is in the
// city, its card opens over the city, framed by where in town it happens. The choice and its outcome are
// unchanged; only where it appears changes.
export type EventPlace = 'garage' | 'home' | 'doormat' | 'work' | 'exchange' | 'business' | 'bank' | 'square' | 'rosa';

const PLACES: Record<LifeEventCategory, EventPlace> = {
  VEHICLE: 'garage', HOUSING: 'home', FAMILY_EMERGENCY: 'home', RELATIONSHIP: 'home', MEDICAL: 'home',
  TAX: 'doormat', LEGAL: 'doormat', CAREER: 'work', AI_DISRUPTION: 'work', ECONOMIC: 'exchange',
  BUSINESS: 'business', WINDFALL: 'bank', CRIME: 'square', SOCIAL: 'rosa',
};

export function eventPlace(category?: LifeEventCategory | string): { place: EventPlace; label: string } {
  const place = PLACES[category as LifeEventCategory] ?? 'square';
  const label = {
    garage: tl('At the garage bay', 'En el garaje'),
    home: tl('At home, 12 Square St', 'En casa, 12 Square St'),
    doormat: tl('A letter on your doormat', 'Una carta en tu felpudo'),
    work: tl('At the office', 'En la oficina'),
    exchange: tl('News from the Exchange', 'Noticias de la Bolsa'),
    business: tl('On Main Street', 'En Main Street'),
    bank: tl('A letter from the Community Bank', 'Una carta del Banco Comunitario'),
    square: tl('On Freedom Square', 'En la Plaza de la Libertad'),
    rosa: tl('Rosa knocks on your door', 'Rosa toca a tu puerta'),
  }[place];
  return { place, label };
}
