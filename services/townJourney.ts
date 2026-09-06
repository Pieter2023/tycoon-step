import { GameState } from '../types';
import { coffeeCart } from './townProgress';
export type JourneyAction = 'event' | 'bank' | 'business' | 'cart' | 'review' | 'finish' | 'journal';
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
