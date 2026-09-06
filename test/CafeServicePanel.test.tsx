import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CafeServicePanel from '../components/town/CafeServicePanel';
import { INITIAL_GAME_STATE } from '../constants';
import { GameState } from '../types';
import { createCafeService } from '../services/cafeService';
const state={...INITIAL_GAME_STATE,cash:100,month:4,cafe:{openedMonth:1,seats:false,machine:false,plan:{price:6,stock:400,helper:false,open:true}}} as GameState;
const props=()=>({state,practice:false,disabled:false,unavailable:false,onPractice:vi.fn(),onStart:vi.fn(),onResume:vi.fn(),onExitPractice:vi.fn()});
afterEach(cleanup);
it('allows harmless practice during an event but blocks owner spending',()=>{
 const p=props();render(<CafeServicePanel {...p} disabled/>);
 expect(screen.getByRole('button',{name:/Open owner shift/})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:/Try a practice/}));expect(p.onPractice).toHaveBeenCalledOnce();expect(p.onStart).not.toHaveBeenCalled();
});
it('does not charge for a shift when the 3D renderer is unavailable',()=>{
 render(<CafeServicePanel {...props()} unavailable/>);
 expect(screen.getByRole('button',{name:/Open owner shift/})).toBeDisabled();expect(screen.getByRole('button',{name:/Try a practice/})).toBeDisabled();
});
it('resumes a saved active shift instead of offering another purchase',()=>{
 const p=props();render(<CafeServicePanel {...p} shift={createCafeService(4,{price:4,stock:3,helper:false,pace:'relaxed'},state.cafe!)}/>);
 expect(screen.queryByRole('button',{name:/Open owner shift/})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:/Resume serving/}));expect(p.onResume).toHaveBeenCalledOnce();expect(p.onStart).not.toHaveBeenCalled();
});
