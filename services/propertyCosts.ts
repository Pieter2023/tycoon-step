// The costs of owning property, in one place (assessment §1's smaller issues, 2026-09-25). Simplified US
// averages used as teaching assumptions: upkeep, property tax and homeowner's insurance every month;
// closing costs when you buy; mortgage insurance on loans with less than 20% down.
export const UPKEEP_RATE = .01;           // a year, of the property's value
export const PROPERTY_TAX_RATE = .011;    // a year (US average effective rate is about 1.1%)
export const HOME_INSURANCE_RATE = .0035; // a year
export const OWNERSHIP_COST_RATE = UPKEEP_RATE + PROPERTY_TAX_RATE + HOME_INSURANCE_RATE;
export const CLOSING_COST_RATE = .03;     // of the price, paid in cash at purchase
export const PMI_RATE = .005;             // a year, of the loan, when less than 20% is put down
export const PMI_ENDS_AT = .78;           // conventional PMI stops once the balance falls to 78% of the price

/** Upkeep, property tax and insurance for a month. */
export const ownershipCostMonthly = (value: number): number => Math.max(0, Math.round(value * OWNERSHIP_COST_RATE / 12));
export const closingCosts = (price: number): number => Math.round(price * CLOSING_COST_RATE);
export const pmiMonthly = (loan: number, downPercent: number): number => downPercent < 20 ? Math.round(loan * PMI_RATE / 12) : 0;

/**
 * A lender's decision for this property this month: the same answer however often the player asks
 * (asking again next month, after paying debt down or with a better score, is a new application).
 */
export function approvalDraw(month: number, key: string): number {
  let h = 0x811c9dc5;
  for (const ch of `${month}:${key}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}
