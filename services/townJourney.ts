import { GameState } from '../types';
import { coffeeCart } from './townProgress';
export type JourneyAction = 'event' | 'bank' | 'business' | 'cart' | 'review' | 'finish' | 'journal' | 'exchange' | 'invest';
export function townJourney(state: GameState) {
  const firstShift = state.townProgress?.firstShiftMonth ?? state.townProgress?.lastShift?.month;
  const completed = state.townProgress?.journeyCompletedMonth !== undefined;
  const milestones = [
    { title:'Plan your safety net', done:!!state.townProgress?.reserveConfirmed },
    { title:'Buy your coffee cart', done:!!coffeeCart(state) },
    { title:'License your business', done:state.townProgress?.permitMonth!==undefined },
    { title:'Run an owner’s shift', done:firstShift!==undefined },
    { title:'Review a trading month', done:completed },
  ];
  const step=completed?5:milestones.findIndex(m=>!m.done);
  let title='', detail='', button='', action:JourneyAction='journal';
  if(completed){title='Neighbourhood entrepreneur';detail='You planned a reserve, opened a business and reviewed the results. Your next goal: build a reliable profit before growing.';button='View your journey';}
  else if(step===0){title='Start with a safety net';detail='Walk inside the bank and talk to the teller. Keep one month of expenses in spending cash, then confirm your reserve plan.';button='Go to the teller';action='bank';}
  else if(step===1){title='Make your first business yours';detail='Visit Main Street and compare the cart’s price with the cash you need for bills. Buy when you can afford the trade-off.';button='Go to Main Street';action='business';}
  else if(step===2){title='Get ready to open';detail='Your cart needs a one-time $60 permit. Pay it before your first trading shift.';button='Go to your cart';action='cart';}
  else if(step===3){title='Serve your first customers';detail='Choose a price and fresh stock at your cart. Check the break-even point, then run a shift and read the receipt.';button='Run your first shift';action='cart';}
  else {
    const canReview=firstShift!==undefined&&(state.lastMonthlyReport?.month??0)>firstShift;
    title=canReview?'See what your decisions earned':'Let the month play out';
    detail=canReview?'Review the month’s income and costs below, then complete your opening journey.':'Your shift is recorded. Advance a month to compare regular business income with your expenses.';
    button=canReview?'Review & finish':'Preview next month';action=canReview?'finish':'review';
  }
  if(state.pendingScenario&&!completed){detail='A decision is waiting. Resolve it first so you can make financial choices in the city.';button='Resolve the waiting event';action='event';}
  return {step,completed,milestones,title,detail,button,action};
}

export function completeTownJourney(state:GameState):GameState {
  if(state.pendingScenario||state.hasWon||state.isBankrupt||townJourney(state).action!=='finish')return state;
  return {...state,townProgress:{...state.townProgress,journeyCompletedMonth:state.month},events:[{
    id:`town-journey-${state.month}`,month:state.month,title:'Neighbourhood entrepreneur',
    description:'Planned a reserve, bought and licensed a coffee cart, ran an owner’s shift and reviewed a trading month. Earned a milestone badge; no cash bonus.',type:'ACHIEVEMENT',
  },...state.events]};
}

export const INDEX_FUND_IDS = ['sp500', 'total', 'intl', 'emerging', 'reit'];
export const HOLD_MONTHS = 3;
export const firstIndexMonth = (state: GameState): number | undefined => {
  const months = state.assets.filter(a => a.quantity > 0 && INDEX_FUND_IDS.includes(a.marketItemId ?? '')).map(a => a.priceHistory?.[0]?.month ?? state.month);
  return months.length ? Math.min(...months) : undefined;
};
// Second arc: learn the market by owning a slice of it and sitting through a few months.
export function investorJourney(state: GameState) {
  const visited = state.townProgress?.exchangeVisitedMonth !== undefined;
  const bought = firstIndexMonth(state);
  const held = bought !== undefined && state.month >= bought + HOLD_MONTHS;
  const completed = state.townProgress?.investorCompletedMonth !== undefined;
  const milestones = [
    { title: 'Read the market mood at the Exchange', done: visited },
    { title: 'Own a slice of the whole market', done: bought !== undefined },
    { title: `Hold it for ${HOLD_MONTHS} months`, done: held },
    { title: 'Compare growth with cash income', done: completed },
  ];
  const step = completed ? 4 : milestones.findIndex(m => !m.done);
  let title = '', detail = '', button = '', action: JourneyAction = 'journal';
  if (completed) { title = 'Patient investor'; detail = 'You bought a piece of the whole market and held it through the noise. Keep adding a little every month.'; button = 'View your journey'; }
  else if (step === 0) { title = 'Meet the market'; detail = 'Walk into the Exchange and talk to the broker. The ticker shows whether the cycle is expanding or contracting.'; button = 'Go to the Exchange'; action = 'exchange'; }
  else if (step === 1) { title = 'Buy your first index fund'; detail = 'An index fund owns hundreds of companies at once. Buy what you can spare after your reserve; its price can fall.'; button = 'Buy an index fund'; action = 'invest'; }
  else if (step === 2) { const left = Math.max(0, (bought ?? state.month) + HOLD_MONTHS - state.month); title = 'Let it ride'; detail = `Hold for ${left} more month${left === 1 ? '' : 's'}. Watch the price move and notice that nothing is spendable until you sell.`; button = 'Preview next month'; action = 'review'; }
  else { title = 'What did the market do for you?'; detail = 'Compare the index fund’s price change with the cash your cart and café paid. Growth builds wealth; income pays bills.'; button = 'Review & finish'; action = 'finish'; }
  if (state.pendingScenario && !completed) { detail = 'A decision is waiting. Resolve it first so you can make financial choices in the city.'; button = 'Resolve the waiting event'; action = 'event'; }
  return { stage: 2 as const, step, completed, milestones, title, detail, button, action };
}
export function completeInvestorJourney(state: GameState): GameState {
  if (state.pendingScenario || state.hasWon || state.isBankrupt || investorJourney(state).action !== 'finish') return state;
  return { ...state, townProgress: { ...state.townProgress, investorCompletedMonth: state.month }, events: [{
    id: `investor-journey-${state.month}`, month: state.month, title: 'Patient investor',
    description: `Visited the Exchange, bought an index fund and held it for ${HOLD_MONTHS} months while comparing growth with cash income. Earned a milestone badge; no cash bonus.`, type: 'ACHIEVEMENT',
  }, ...state.events] };
}
// The journey the city guide shows right now: the opening arc, then the investor arc.
export type ActiveJourney = (ReturnType<typeof townJourney> & { stage: 1 }) | ReturnType<typeof investorJourney>;
export const activeJourney = (state: GameState): ActiveJourney => {
  const opening = townJourney(state);
  return opening.completed ? investorJourney(state) : { ...opening, stage: 1 as const };
};
export const completeActiveJourney = (state: GameState): GameState => townJourney(state).completed ? completeInvestorJourney(state) : completeTownJourney(state);
