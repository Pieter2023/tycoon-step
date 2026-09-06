import { AssetType, GameState, MarketItem } from '../../types';
import { nominalPrice } from '../../services/investmentModel';

export type TownPlaceId = 'bank' | 'exchange' | 'business' | 'property';
export type TownPoint = { x: number; z: number };
export const TOWN_PLACES: { id: TownPlaceId; name: string; sign: string; x: number; color: string; items: string[]; lesson: string; question: string }[] = [
  { id: 'bank', name: 'Community Bank', sign: 'BANK', x: -10.5, color: '#82c8b4', items: ['hysa', 'tbill'], question: 'How much cash should stay within reach?', lesson: 'A reserve buys breathing room when a bill arrives. Compare interest with access to your money before chasing a higher rate.' },
  { id: 'exchange', name: 'Stock Exchange', sign: 'EXCHANGE', x: -3.5, color: '#88b9df', items: ['sp500', 'dividend', 'btc'], question: 'Price growth or money in your pocket?', lesson: 'Dividends are cash payments. A rising share price is a paper gain until you sell. Spot Bitcoin pays no income here, and its price can fall sharply.' },
  { id: 'business', name: 'Main Street Businesses', sign: 'BUSINESSES', x: 3.5, color: '#efa66e', items: ['coffee_cart', 'vending', 'laundromat'], question: 'Will the business pay its own way?', lesson: 'Sales are not profit. Restocking, staff and quieter months matter. Compare operating income with the cash you commit; the model uses simplified costs.' },
  { id: 'property', name: 'Property Office', sign: 'PROPERTY', x: 10.5, color: '#c7a8d8', items: ['fractional_rental', 'starter_home'], question: 'Can you carry the property in a bad month?', lesson: 'Rent is only the starting point. Maintenance and any loan repayments reduce what you keep. Leave room for repairs and vacancies.' }
];
export const clampTownPoint = (p: TownPoint): TownPoint => ({ x: Math.max(-16, Math.min(16, p.x)), z: Math.max(-1.4, Math.min(10, p.z)) });
export const nearbyPlace = (point: TownPoint): TownPlaceId | null => TOWN_PLACES.find(place => Math.hypot(point.x - place.x, point.z + 1.1) < 1.8)?.id ?? null;
// Every entrance faces the same accessible pavement. Routing along it avoids
// cutting through buildings and gives touch and keyboard players the same access.
export const routeToPlace = (from: TownPoint, id: TownPlaceId): TownPoint[] => {
  const place = TOWN_PLACES.find(p => p.id === id)!;
  return [{ x: from.x, z: 1 }, { x: place.x, z: 1 }, { x: place.x, z: -1.1 }];
};
export const townPrice = (item: MarketItem, state: GameState): number => {
  const price = nominalPrice(item, state.month, state.economy.inflationRate);
  const discount = state.negotiationsPerks?.dealDiscountPct ?? 0;
  return discount > 0 && [AssetType.BUSINESS, AssetType.REAL_ESTATE].includes(item.type) ? Math.round(price * (1 - discount)) : price;
};
