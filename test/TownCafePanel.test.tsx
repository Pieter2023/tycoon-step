import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CafePanel from '../components/town/CafePanel';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { resolveCafeAction } from '../services/townCafe';
import { AssetType, GameState } from '../types';
const state=():GameState=>({...structuredClone(INITIAL_GAME_STATE),character:CHARACTERS[0],month:2,cash:10000,townProgress:{permitMonth:1,firstShiftMonth:1},assets:[{id:'cart',marketItemId:'coffee_cart',name:'Cart',type:AssetType.BUSINESS,quantity:1,value:1500,costBasis:1500,cashFlow:30,volatility:0,appreciationRate:0,priceHistory:[]}]});
afterEach(cleanup);
it('requires saving a changed plan before advancing or buying furnishings',()=>{
 const s=resolveCafeAction(state(),{type:'lease'}), action=vi.fn(), advance=vi.fn();render(<CafePanel state={s} disabled={false} onAction={action} onNextMonth={advance}/>);
 fireEvent.click(screen.getByRole('button',{name:'700 cups · $1400'}));
 expect(screen.getByRole('button',{name:'Review next month →'})).toBeDisabled();expect(screen.getByRole('button',{name:'Install · $650'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Save next month’s plan'}));expect(action).toHaveBeenCalledWith({type:'plan',plan:{price:6,stock:700,helper:false,open:true}});expect(advance).not.toHaveBeenCalled();
});
it('allows reading and exploration but blocks café spending during an event',()=>{
 const s=resolveCafeAction(state(),{type:'lease'});render(<CafePanel state={s} disabled onAction={vi.fn()} onNextMonth={vi.fn()}/>);
 expect(screen.getByRole('button',{name:'Install · $650'})).toBeDisabled();expect(screen.getByRole('button',{name:'Review next month →'})).toBeDisabled();expect(screen.getByRole('button',{name:'Consider ending the lease'})).toBeDisabled();
});
it('shows the exact resale amount before ending a lease',()=>{
 const s=resolveCafeAction(state(),{type:'lease'}),action=vi.fn();render(<CafePanel state={s} disabled={false} onAction={action} onNextMonth={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'Consider ending the lease'}));expect(screen.getByText('End the lease for $1,800 back?')).toBeInTheDocument();expect(action).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'End lease & return keys'}));expect(action).toHaveBeenCalledWith({type:'close'});
});
