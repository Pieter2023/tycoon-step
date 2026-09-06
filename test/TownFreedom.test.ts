import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState } from '../types';
import { yieldTo, YIELD_SIDE } from '../components/town/townResidents';
import { createFireworks, burstOrigin, BURST_EVERY, BURST_LIFE } from '../components/town/townLife';
import { cityCaption } from '../components/town/townGuide';
import { adviseFrom } from '../services/townAdvisor';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 3 });

describe('residents make room for the player', () => {
  it('sidesteps away from the player, waits when blocked, and recovers once the path is clear', () => {
    const state = { side: 0, wait: 0 };
    for (let i = 0; i < 40; i++) yieldTo({ x: 0, z: 6.35, forward: true }, { x: 20, z: 6.35 }, .05, state);
    expect(state.side).toBeCloseTo(0, 3); expect(state.wait).toBe(0);                   // far away: nothing
    for (let i = 0; i < 40; i++) yieldTo({ x: 0, z: 6.35, forward: true }, { x: 1.2, z: 6.6 }, .05, state);
    expect(state.side).toBeLessThan(-YIELD_SIDE * .9);                                   // player slightly to +z: step to -z
    const blocked = { side: 0, wait: 0 }; yieldTo({ x: 0, z: 6.35, forward: true }, { x: .5, z: 6.35 }, .1, blocked);
    expect(blocked.wait).toBeGreaterThan(0);                                             // standing right in front: pause
    const behind = { side: 0, wait: 0 }; yieldTo({ x: 0, z: 6.35, forward: true }, { x: -.5, z: 6.35 }, .1, behind);
    expect(behind.wait).toBe(0);                                                         // behind the walker: no pause
    for (let i = 0; i < 60; i++) yieldTo({ x: 0, z: 6.35, forward: true }, { x: 30, z: 0 }, .05, state);
    expect(Math.abs(state.side)).toBeLessThan(.02);                                      // back in lane
  });
});

describe('freedom day', () => {
  it('launches deterministic fireworks only while celebrating and never under reduced motion', () => {
    const show = createFireworks(false);
    expect(show.update(.016, 0, false)).toBe(false); expect(show.root.visible).toBe(false);
    let bursts = 0; for (let t = 1; t < 1 + BURST_EVERY * 3.5; t += .05) if (show.update(.05, t, true)) bursts++;
    expect(bursts).toBe(4); expect(show.launched).toBe(4); expect(show.root.visible).toBe(true);
    const shell = show.shells[0]; expect(shell.points.visible).toBe(false);                // first shell already faded after BURST_LIFE
    expect(show.shells[3].points.visible).toBe(true); expect((show.shells[3].points.material as THREE.PointsMaterial).opacity).toBeGreaterThan(0);
    expect(burstOrigin(3)).toEqual(burstOrigin(3)); expect(burstOrigin(1).x).not.toBe(burstOrigin(2).x);
    expect(BURST_LIFE).toBeLessThan(BURST_EVERY * 4);
    const quiet = createFireworks(true); quiet.update(.05, 5, true); expect(quiet.root.visible).toBe(false); expect(quiet.launched).toBe(0);
  });
  it('captions the day and lets Rosa say it first', () => {
    const won = { ...base(), hasWon: true };
    expect(cityCaption(won, 'city')).toEqual({ day: 'FREEDOM DAY', note: 'Passive income covers your life · the square is celebrating you' });
    expect(cityCaption(won, 'bank').note).toMatch(/fireworks/);
    expect(cityCaption({ ...base(), month: 3 }, 'city').day).toMatch(/MARKET DAY|RAIN/);
    expect(cityCaption({ ...base(), cafe: { openedMonth: 1, seats: false, machine: false, plan: { price: 6, stock: 400, helper: false, open: true } } }, 'cafe').note).toBe('Trading plan saved · staff at work');
    expect(adviseFrom(won)[0].id).toBe('won'); expect(adviseFrom({ ...won, cash: 100 })[0].id).toBe('won');
    expect(adviseFrom(base()).some(a => a.id === 'won')).toBe(false);
  });
});
