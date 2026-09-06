import { AssetType, GameState } from '../types';
import { MARKET_ITEMS } from '../constants';
import { incomeYield } from './investmentModel';
import { coffeeCart } from './townProgress';

export type BankTransfer = { direction: 'deposit' | 'withdraw'; amount: number };
export type CartPlan = { price: 3 | 5; stock: 12 | 24 };
export type CartReceipt = CartPlan & { month: number; weather: string; sold: number; revenue: number; costs: number; profit: number };
const blocked = (state: GameState) => !!state.pendingScenario || state.hasWon || state.isBankrupt;
const isSavings = (asset: GameState['assets'][number]) => asset.type === AssetType.SAVINGS && asset.marketItemId === 'hysa';
export const savingsBalance = (state: GameState) => state.assets.filter(isSavings).reduce((sum, asset) => sum + asset.value * asset.quantity, 0);

// Transfers preserve wealth and use the same savings holdings as the portfolio.
export function transferTownSavings(state: GameState, transfer: BankTransfer): GameState {
  const { direction, amount } = transfer;
  if (blocked(state) || !['deposit', 'withdraw'].includes(direction) || !Number.isSafeInteger(amount) || amount <= 0) return state;
  let assets = [...state.assets];
  if (direction === 'deposit') {
    if (amount > state.cash) return state;
    const item = MARKET_ITEMS.find(item => item.id === 'hysa')!;
    // Separate lots avoid changing the cost basis or interest on older holdings.
    assets.push({ id: `teller-${crypto.randomUUID()}`, marketItemId: item.id, incomeModelVersion: 2,
      name: item.name, type: AssetType.SAVINGS, value: item.price, costBasis: item.price,
      quantity: amount / item.price, cashFlow: item.price * incomeYield(item) / 12,
      volatility: 0, appreciationRate: 0, baseYield: incomeYield(item), priceHistory: [{ month: state.month, value: item.price }] });
  } else {
    if (amount > savingsBalance(state) + 1e-8) return state;
    let remaining = amount;
    assets = assets.flatMap(asset => {
      if (!isSavings(asset) || remaining <= 1e-8 || asset.value <= 0) return [asset];
      const taken = Math.min(remaining, asset.value * asset.quantity);
      remaining -= taken;
      const quantity = asset.quantity - taken / asset.value;
      return quantity > 1e-8 ? [{ ...asset, quantity }] : [];
    });
  }
  const cash = state.cash + (direction === 'deposit' ? -amount : amount);
  return { ...state, cash, assets, events: [{ id: `transfer-${crypto.randomUUID()}`, month: state.month,
    title: direction === 'deposit' ? 'Savings deposit' : 'Savings withdrawal',
    description: `Moved $${amount} ${direction === 'deposit' ? 'from cash to savings' : 'from savings to cash'}. This is a transfer, not income.`, type: 'DECISION' }, ...state.events] };
}

export function quoteCartShift(state: GameState, plan: CartPlan): CartReceipt {
  const rainy = state.month % 3 === 0;
  const demand = rainy ? (plan.price === 3 ? 14 : 8) : (plan.price === 3 ? 26 : 18);
  const sold = Math.min(plan.stock, demand + (rainy && coffeeCart(state)?.opsUpgrade ? 4 : 0));
  const costs = plan.stock * 2 + 18;
  const revenue = sold * plan.price;
  return { ...plan, month: state.month, weather: rainy ? 'Rainy afternoon' : 'Busy market afternoon', sold, revenue, costs, profit: revenue - costs };
}

export function runCartShift(state: GameState, plan: CartPlan): GameState {
  if (blocked(state) || !coffeeCart(state) || state.townProgress?.permitMonth === undefined ||
      state.townProgress?.lastShift?.month === state.month || ![3, 5].includes(plan.price) || ![12, 24].includes(plan.stock)) return state;
  const receipt = quoteCartShift(state, plan);
  if (state.cash < receipt.costs) return state;
  return { ...state, cash: state.cash + receipt.profit,
    townProgress: { ...state.townProgress, firstShiftMonth: state.townProgress?.firstShiftMonth ?? state.townProgress?.lastShift?.month ?? state.month, lastShift: receipt },
    events: [{ id: `cart-shift-${state.month}`, month: state.month, title: 'Coffee pop-up shift',
      description: `${receipt.weather}: sold ${receipt.sold} of ${receipt.stock} cups at $${receipt.price}. Sales $${receipt.revenue} − supplies and shift costs $${receipt.costs} = ${receipt.profit < 0 ? 'loss' : 'profit'} $${Math.abs(receipt.profit)}. Extra owner-run shift; regular monthly operations are separate.`, type: 'DECISION' }, ...state.events] };
}
