import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { it, expect, vi, afterEach } from 'vitest';
import { I18nProvider } from '../i18n';
import TownModal from '../components/town/TownModal';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { createCafeService } from '../services/cafeService';
import type { TownSceneOptions } from '../components/town/createTownScene';
const scene=vi.hoisted(()=>({pause:vi.fn(),options:undefined as TownSceneOptions|undefined}));
vi.mock('../components/town/createTownScene',()=>({createTownScene:(_host:unknown,_near:unknown,_inspect:unknown,_fail:unknown,_motion:unknown,ready:()=>void,options:TownSceneOptions)=>{
 scene.options=options;ready();return {pause:scene.pause,setOwned:vi.fn(),setCafeService:vi.fn(),dispose:vi.fn()};
}}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('keeps city walking available while a restored café shift waits for resume',()=>{
 const cafe={openedMonth:1,seats:true,machine:true,plan:{price:6 as const,stock:400 as const,helper:false,open:true}};
 const state={...structuredClone(INITIAL_GAME_STATE),character:CHARACTERS[0],month:4,cafe:{...cafe,service:createCafeService(4,{price:4,stock:3,helper:false,pace:'relaxed'},cafe)}};
 render(<I18nProvider><TownModal state={state} disabled={false} reduceMotion={false} onBuy={vi.fn()} onClose={vi.fn()} onOpenMoney={vi.fn()} onNextMonth={vi.fn()} onBackup={vi.fn()}/></I18nProvider>);
 expect(scene.pause).toHaveBeenLastCalledWith(false);
 act(()=>scene.options?.onRoom?.('cafe'));expect(scene.pause).toHaveBeenLastCalledWith(true);
 act(()=>scene.options?.onRoom?.('city'));expect(scene.pause).toHaveBeenLastCalledWith(false);
});
