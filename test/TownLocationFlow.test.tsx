import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import TownModal from '../components/town/TownModal';
import { createTownScene } from '../components/town/createTownScene';
vi.mock('../components/town/createTownScene',()=>({createTownScene:vi.fn()}));
afterEach(()=>{cleanup();vi.resetAllMocks();});
function mount(){
 let callbacks:any;const calls:Record<string,any>={};
 const controller=new Proxy({}, {get:(_,key:string)=>calls[key]??(calls[key]=vi.fn())});
 vi.mocked(createTownScene).mockImplementation((...args:any[])=>{callbacks=args[6];args[5]?.();return controller as any;});
 render(<I18nProvider><TownModal state={{...structuredClone(INITIAL_GAME_STATE),character:CHARACTERS[0],cash:10000}} disabled={false} reduceMotion onBuy={vi.fn()} onClose={vi.fn()} onOpenMoney={vi.fn()} onNextMonth={vi.fn()} onBackup={vi.fn()}/></I18nProvider>);
 return {callbacks,calls};
}
it('explains a manually entered room and walks to its action before opening transactions',()=>{
 const {callbacks,calls}=mount();act(()=>callbacks.onRoom('property'));
 expect(screen.getByText('Become a landlord')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Talk to the agent →'}));
 expect(calls.walkToAgent).toHaveBeenCalled();
 expect(screen.getByLabelText('Location opportunities')).not.toBeVisible();
 act(()=>callbacks.onSpot('agent'));
 expect(screen.getByLabelText('Location opportunities')).toBeVisible();
 expect(screen.getByText('Become a landlord')).not.toBeVisible();
});
it('can reopen a room guide at the current desk without getting stuck',()=>{
 const {callbacks}=mount();act(()=>{callbacks.onRoom('home');callbacks.onSpot('desk');});
 fireEvent.click(screen.getByRole('button',{name:'Use your desk →'}));
 expect(screen.getByLabelText('Location opportunities')).toBeVisible();
 expect(screen.getByText(/On the fridge/)).toBeVisible();
});
it('does not freeze a notice-board walk by opening its panel early',()=>{
 const {callbacks,calls}=mount();
 fireEvent.click(screen.getByRole('button',{name:"Notice board: this month's challenges"}));
 expect(calls.walkToBoard).toHaveBeenCalled();
 expect(screen.getByLabelText('Location opportunities')).not.toBeVisible();
 act(()=>callbacks.onSpot('board'));
 expect(screen.getByLabelText('Location opportunities')).toBeVisible();
});
it('lets the café navigation leave its welcome guide and open the actual shift tools',()=>{
 const {callbacks}=mount();act(()=>callbacks.onRoom('cafe'));
 fireEvent.click(screen.getByRole('button',{name:'Play a shift',exact:true}));
 expect(screen.getByRole('button',{name:'Try a practice shift · no money changes'})).toBeVisible();
});
