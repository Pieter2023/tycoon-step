import type { GameState, MarketCyclePhase } from '../types';

// Plain-language reading of the market cycle for the Exchange ticker and broker.
// Teaching assumptions only: the phases are the game's own simplified cycle.
export const EXCHANGE_ITEMS = ['sp500', 'dividend', 'btc'] as const;

export function marketMood(phase: MarketCyclePhase, recession = false) {
  if (recession) return { label: 'Recession', headline: 'Prices are down and jobs feel shaky.', advice: 'Falling prices are a discount for patient buyers, but keep your reserve: this is when surprise bills bite hardest.' };
  switch (phase) {
    case 'EXPANSION': return { label: 'Expansion', headline: 'Prices are climbing month after month.', advice: 'Good months make investing feel easy. Buy a little every month rather than everything at the top.' };
    case 'PEAK': return { label: 'Peak', headline: 'Prices are high and gains are slowing.', advice: 'Nobody rings a bell at the top. Keep contributing, but do not borrow to invest.' };
    case 'CONTRACTION': return { label: 'Contraction', headline: 'Prices are falling and headlines are gloomy.', advice: 'Selling now locks in the loss. If your bills are covered, falling prices mean the same money buys more units.' };
    default: return { label: 'Trough', headline: 'Prices have stopped falling and are waiting.', advice: 'Recoveries start quietly. Time in the market beats timing the market.' };
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
  return drop >= 60 ? `A bad year can cut this in half or worse (about ${drop}%). Only money you can afford to lose.` : drop >= 25 ? `A bad year can take about ${drop}% off. Expect that at least once a decade.` : `A bad year might take about ${drop}% off. Steady, not guaranteed.`;
};
