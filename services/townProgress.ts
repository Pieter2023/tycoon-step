import { GameState, AssetType } from '../types';
import { calculateMonthlyCashFlowEstimate } from './gameLogic';
export type TownAction = 'reserve' | 'permit' | 'upgrade';
export const CART_PERMIT = 60;
export const CART_UPGRADE = 350;
export const coffeeCart = (state:GameState) => state.assets.find(a=>a.marketItemId==='coffee_cart'&&a.quantity>0);
export function townMission(state:GameState) {
  if(!state.townProgress?.reserveConfirmed)return {step:1,title:'Protect your safety net',detail:'Keep one month of expenses in cash, then confirm your reserve at the bank.',place:'bank' as const};
  if(!coffeeCart(state))return {step:2,title:'Open your first business',detail:'Visit Main Street to buy a coffee cart. Keep your reserve intact.',place:'business' as const};
  if(state.townProgress?.permitMonth===undefined)return {step:3,title:'Get ready to trade',detail:'Pay the one-time $60 trading permit at Main Street. The cart earns nothing until it is licensed.',place:'business' as const};
  if(state.month<=state.townProgress.permitMonth)return {step:4,title:'See your first trading month',detail:'Review next month to see actual income, costs and changes in value.',place:'business' as const};
  return {step:5,title:'Your first business is trading',detail:'Review what it earned. Grow carefully: a bigger business also carries bigger risks.',place:'business' as const};
}
export function resolveTownAction(state:GameState,action:TownAction):GameState {
  if(state.pendingScenario||state.hasWon||state.isBankrupt)return state;
  let next=state,description='';
  if(action==='reserve'){
    if(state.townProgress?.reserveConfirmed||state.cash<calculateMonthlyCashFlowEstimate(state).expenses)return state;
    next={...state,townProgress:{...state.townProgress,reserveConfirmed:true}};
    description='Protected one month of expenses in cash. This is a plan, not extra money; keep checking the buffer.';
  }else{
    const cart=coffeeCart(state);if(!cart)return state;
    if(action==='permit'){
      if(state.townProgress?.permitMonth!==undefined||state.cash<CART_PERMIT)return state;
      next={...state,cash:state.cash-CART_PERMIT,townProgress:{...state.townProgress,permitMonth:state.month}};
      description='Paid the $60 one-time trading permit. The coffee cart can now earn operating profit; daily supplies are already included in that profit estimate.';
    }else{
      if(cart.opsUpgrade||state.cash<CART_UPGRADE||state.townProgress?.permitMonth===undefined)return state;
      next={...state,cash:state.cash-CART_UPGRADE,assets:state.assets.map(a=>a.id===cart.id?{...a,opsUpgrade:true}:a)};
      description='Paid $350 for weather cover and organised storage. This reduces income swings and maintenance odds; it does not guarantee more profit.';
    }
  }
  return {...next,events:[{id:`town-${action}-${state.month}`,month:state.month,title:action==='reserve'?'Safety net planned':action==='permit'?'Coffee cart licensed':'Coffee cart upgraded',description,type:'DECISION'},...state.events]};
}
