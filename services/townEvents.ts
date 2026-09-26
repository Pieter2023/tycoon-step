import type { LifeEventCategory } from '../types';
import { tl } from '../i18n/town';

// Events happen in the world (Phase 1, slice 3): when a life event arrives while the player is in the
// city, its card opens over the city, framed by where in town it happens. The choice and its outcome are
// unchanged; only where it appears changes.
export type EventPlace = 'garage' | 'home' | 'doormat' | 'work' | 'exchange' | 'business' | 'property' | 'bank' | 'square' | 'rosa';

const PLACES: Record<LifeEventCategory, EventPlace> = {
  VEHICLE: 'garage', HOUSING: 'home', FAMILY_EMERGENCY: 'home', RELATIONSHIP: 'home', MEDICAL: 'home',
  TAX: 'doormat', LEGAL: 'doormat', CAREER: 'work', AI_DISRUPTION: 'work', ECONOMIC: 'exchange',
  BUSINESS: 'business', WINDFALL: 'bank', CRIME: 'square', SOCIAL: 'rosa',
};

/**
 * Events that happen somewhere other than their category's usual place, by event id. The phone check on
 * 2026-09-26 found an office birthday collection framed as "Rosa knocks on your door" (every SOCIAL event
 * went to Rosa). Every other event follows its category.
 */
export const EVENT_PLACES: Record<string, EventPlace> = {
  // Social life happens all over town.
  coworker_birthday: 'work', friend_wedding: 'doormat', reunion: 'doormat', viral_moment: 'square',
  avocado_toast: 'business', coffee_addiction: 'business', splitting_bill: 'business',
  impulse_purchase: 'home', online_dating: 'home', sales_emails: 'home', vacation_opportunity: 'home',
  // The player's rental properties are managed at Property & Co., not at home.
  rental_tenant_nonpayment: 'property', rental_major_maintenance: 'property', rental_vacancy: 'property', rental_tenant_dispute: 'property',
  landlord_screening: 'property', landlord_tenant_good: 'property', landlord_tenant_issue: 'property', landlord_eviction: 'property',
  // Money and trouble that come from work, the mail or the street.
  work_bonus: 'work', major_bonus: 'work', stock_options_vest: 'work', layoff_wave: 'work', job_loss: 'work',
  tax_refund: 'doormat', insurance_discount: 'doormat', rent_increase: 'doormat',
  lottery_small: 'square', lottery_win: 'square', phone_screen_crack: 'square',
  biz_partner_dispute: 'business', owned_business_fraud: 'business', owned_business_lawsuit: 'business', owned_business_regulatory_fine: 'business',
  home_break_in: 'home', parking_ticket: 'garage', mystery_charge: 'bank',
};

export function eventPlace(category?: LifeEventCategory | string, eventId?: string): { place: EventPlace; label: string } {
  const place = (eventId && EVENT_PLACES[eventId]) || PLACES[category as LifeEventCategory] || 'square';
  const label = {
    garage: tl('At the garage bay', 'En el garaje'),
    home: tl('At home, 12 Square St', 'En casa, 12 Square St'),
    doormat: tl('A letter on your doormat', 'Una carta en tu felpudo'),
    work: tl('At the office', 'En la oficina'),
    exchange: tl('News from the Exchange', 'Noticias de la Bolsa'),
    business: tl('On Main Street', 'En Main Street'),
    property: tl('At Property & Co.', 'En Property & Co.'),
    bank: tl('A letter from the Community Bank', 'Una carta del Banco Comunitario'),
    square: tl('On Freedom Square', 'En la Plaza de la Libertad'),
    rosa: tl('Rosa knocks on your door', 'Rosa toca a tu puerta'),
  }[place];
  return { place, label };
}
