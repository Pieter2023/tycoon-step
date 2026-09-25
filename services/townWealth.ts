import { AssetType, GameState } from '../types';
import { calculateAssetCashPayment, calculateMonthlyCashFlowEstimate, financialFreedom } from './gameLogic';
import { tl } from '../i18n/town';
import type { TownPlaceId } from '../components/town/townWorld';

// Wealth you can see (Phase 1, slice 1): the shop windows on Main Street show the player's own money, and
// the fountain runs fuller as they near financial freedom. Everything here is derived from the game state.
export type WindowDisplay = { title: string; value: string; note: string; lit: boolean };

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
const MARKET: AssetType[] = [AssetType.INDEX_FUND, AssetType.STOCK, AssetType.BOND, AssetType.CRYPTO, AssetType.COMMODITY];

export function windowDisplays(state: GameState): Record<TownPlaceId, WindowDisplay> {
  const held = (types: AssetType[]) => (state.assets || []).filter(a => a.quantity > 0 && types.includes(a.type));
  const value = (list: GameState['assets']) => list.reduce((n, a) => n + a.value * a.quantity, 0);
  const pays = (list: GameState['assets']) => list.reduce((n, a) => n + calculateAssetCashPayment(state, a, true), 0);

  const savings = held([AssetType.SAVINGS]);
  const market = held(MARKET), marketNow = value(market);
  // This month's move: each holding's last two recorded prices, weighted by what is held now.
  const marketBefore = market.reduce((n, a) => { const h = a.priceHistory; const prev = h.length > 1 ? h[h.length - 2].value : a.value; return n + prev * a.quantity; }, 0);
  const move = marketBefore > 0 ? (marketNow - marketBefore) / marketBefore : 0;
  const businesses = held([AssetType.BUSINESS]), units = businesses.reduce((n, a) => n + a.quantity, 0) + (state.cafe ? 1 : 0);
  const property = held([AssetType.REAL_ESTATE]), homes = property.reduce((n, a) => n + a.quantity, 0);

  return {
    bank: savings.length
      ? { title: tl('YOUR SAVINGS', 'TUS AHORROS'), value: money(value(savings)), note: `+${money(pays(savings))} ${tl('interest a month', 'de interés al mes')}`, lit: true }
      : { title: tl('YOUR SAVINGS', 'TUS AHORROS'), value: '$0', note: tl('A reserve buys breathing room', 'Una reserva te da margen'), lit: false },
    exchange: market.length
      ? { title: tl('YOUR PORTFOLIO', 'TU PORTAFOLIO'), value: money(marketNow), note: `${move >= 0 ? '▲' : '▼'} ${Math.abs(move * 100).toFixed(1)}% ${tl('this month', 'este mes')}`, lit: true }
      : { title: tl('YOUR PORTFOLIO', 'TU PORTAFOLIO'), value: '$0', note: tl('Own a slice of the market', 'Ten una parte del mercado'), lit: false },
    business: units
      ? { title: tl('YOUR BUSINESSES', 'TUS NEGOCIOS'), value: `${units} ${units === 1 ? tl('business', 'negocio') : tl('businesses', 'negocios')}`, note: `${money(pays(businesses))} ${tl('profit a month', 'de ganancia al mes')}`, lit: true }
      : { title: tl('YOUR BUSINESSES', 'TUS NEGOCIOS'), value: tl('None yet', 'Ninguno aún'), note: tl('Start small, keep a reserve', 'Empieza en pequeño, con reserva'), lit: false },
    property: homes
      ? { title: tl('YOUR PROPERTIES', 'TUS PROPIEDADES'), value: `${homes} ${homes === 1 ? tl('property', 'propiedad') : tl('properties', 'propiedades')}`, note: `${money(pays(property))} ${tl('rent a month after upkeep', 'de renta al mes tras mantenimiento')}`, lit: true }
      : { title: tl('YOUR PROPERTIES', 'TUS PROPIEDADES'), value: tl('None yet', 'Ninguna aún'), note: tl('Can you carry it in a bad month?', '¿Podrías sostenerla en un mal mes?'), lit: false },
  };
}

/** How full the Freedom Fountain runs: the share of the way to financial freedom, 0 to 1. */
export function fountainLevel(state: GameState): number {
  if (state.hasWon) return 1;
  return Math.max(0, Math.min(1, financialFreedom(state, calculateMonthlyCashFlowEstimate(state)).coverage));
}
