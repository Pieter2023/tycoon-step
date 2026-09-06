import type { GameState, MarketCyclePhase } from '../types';
import { tl } from '../i18n/town';

// Plain-language reading of the market cycle for the Exchange ticker and broker.
// Teaching assumptions only: the phases are the game's own simplified cycle.
export const EXCHANGE_ITEMS = ['sp500', 'dividend', 'btc'] as const;

export function marketMood(phase: MarketCyclePhase, recession = false) {
  if (recession) return { label: tl('Recession','Recesión'), headline: tl('Prices are down and jobs feel shaky.','Los precios bajaron y los empleos se sienten inestables.'), advice: tl('Falling prices are a discount for patient buyers, but keep your reserve: this is when surprise bills bite hardest.','Los precios en baja son un descuento para compradores pacientes, pero conserva tu reserva: es cuando las facturas sorpresa muerden más fuerte.') };
  switch (phase) {
    case 'EXPANSION': return { label: tl('Expansion','Expansión'), headline: tl('Prices are climbing month after month.','Los precios suben mes tras mes.'), advice: tl('Good months make investing feel easy. Buy a little every month rather than everything at the top.','Los meses buenos hacen que invertir parezca fácil. Compra un poco cada mes en lugar de todo en la cima.') };
    case 'PEAK': return { label: tl('Peak','Cima'), headline: tl('Prices are high and gains are slowing.','Los precios están altos y las ganancias se frenan.'), advice: tl('Nobody rings a bell at the top. Keep contributing, but do not borrow to invest.','Nadie toca una campana en la cima. Sigue aportando, pero no pidas prestado para invertir.') };
    case 'CONTRACTION': return { label: tl('Contraction','Contracción'), headline: tl('Prices are falling and headlines are gloomy.','Los precios caen y los titulares son sombríos.'), advice: tl('Selling now locks in the loss. If your bills are covered, falling prices mean the same money buys more units.','Vender ahora fija la pérdida. Si tus facturas están cubiertas, los precios en baja significan que el mismo dinero compra más unidades.') };
    default: return { label: tl('Trough','Valle'), headline: tl('Prices have stopped falling and are waiting.','Los precios dejaron de caer y están a la espera.'), advice: tl('Recoveries start quietly. Time in the market beats timing the market.','Las recuperaciones empiezan en silencio. El tiempo en el mercado le gana a adivinar el momento.') };
  }
}

export const indexChangePct = (history: { month: number; value: number }[] | undefined, months = 12): number | null => {
  if (!history || history.length < 2) return null;
  const last = history[history.length - 1], base = history[Math.max(0, history.length - 1 - months)];
  return base.value ? Math.round((last.value / base.value - 1) * 1000) / 10 : null;
};

export const holdingOf = (state: GameState, itemId: string) => state.assets.find(a => a.marketItemId === itemId && a.quantity > 0 && !a.mortgageId);

// Unrealised change on a holding versus what was paid for it.
export const unrealised = (holding: { value: number; costBasis: number; quantity: number }) => Math.round((holding.value - holding.costBasis) * holding.quantity);

// A plain sentence about how far an asset can fall in a bad year, from its teaching volatility.
export const downsideSentence = (volatility: number) => {
  const drop = Math.round(Math.min(90, volatility * 200));
  return drop >= 60 ? `${tl('A bad year can cut this in half or worse (about','Un mal año puede reducirlo a la mitad o peor (cerca del')} ${drop}%). ${tl('Only money you can afford to lose.','Solo dinero que puedas permitirte perder.')}` : drop >= 25 ? `${tl('A bad year can take about','Un mal año puede quitarle cerca del')} ${drop}% ${tl('off. Expect that at least once a decade.','. Espéralo al menos una vez por década.')}` : `${tl('A bad year might take about','Un mal año podría quitarle cerca del')} ${drop}% ${tl('off. Steady, not guaranteed.','. Estable, no garantizado.')}`;
};
