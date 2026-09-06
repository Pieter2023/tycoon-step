import { describe, it, expect } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState } from '../types';
import { tourJourney, completeTourJourney, activeJourney, completeActiveJourney } from '../services/townJourney';
import { resolveTownAction } from '../services/townProgress';
import { guideLabel, guideNextHop } from '../components/town/townGuide';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 8, townProgress: { journeyCompletedMonth: 3, investorCompletedMonth: 7 } });

describe('neighbourhood tour (third guided arc)', () => {
  it('starts once the investor journey is done and walks office → home → Rosa → board → finish', () => {
    let s = base(); expect(activeJourney(s).stage).toBe(3); expect(tourJourney(s).action).toBe('work');
    s = resolveTownAction(s, 'visit-work'); expect(tourJourney(s).action).toBe('home'); expect(resolveTownAction(s, 'visit-work')).toBe(s);
    s = resolveTownAction(s, 'visit-home'); expect(tourJourney(s).action).toBe('rosa');
    s = resolveTownAction(s, 'visit-rosa'); expect(tourJourney(s).action).toBe('board'); expect(completeTourJourney(s)).toBe(s);
    s = { ...s, townProgress: { ...s.townProgress, challengeLog: [{ month: 8, completed: ['reserve'], total: 3 }] } };
    expect(tourJourney(s).action).toBe('finish');
    const done = completeActiveJourney(s);
    expect(done.cash).toBe(s.cash); expect(tourJourney(done).completed).toBe(true); expect(done.events[0].title).toBe('Settled in'); expect(activeJourney(done).completed).toBe(true);
    expect(completeTourJourney(done)).toBe(done);
    expect(activeJourney({ ...base(), townProgress: { journeyCompletedMonth: 3 } }).stage).toBe(2);
    expect(activeJourney({ ...base(), townProgress: {} }).stage).toBe(1);
  });
  it('labels the guide button for each stop and chains through doors to the manager and the desk', () => {
    const j = (action: 'work' | 'home' | 'rosa' | 'board') => ({ completed: false, action, button: 'Go', step: 0, stage: 3 as const });
    const ctx = { near: null, showDetails: false, journal: false, serviceActive: false, hasCafe: false } as const;
    expect(guideLabel({ ...ctx, journey: j('work'), room: 'city', spot: 'work' })).toBe('Enter the office');
    expect(guideLabel({ ...ctx, journey: j('work'), room: 'work', spot: null })).toBe('Walk to your manager');
    expect(guideLabel({ ...ctx, journey: j('work'), room: 'work', spot: 'manager', showDetails: true })).toBe('Read your pay stub');
    expect(guideLabel({ ...ctx, journey: j('home'), room: 'home', spot: 'desk' })).toBe('Sit at your desk');
    expect(guideLabel({ ...ctx, journey: j('rosa'), room: 'city', spot: 'rosa' })).toBe('Talk to Rosa');
    expect(guideLabel({ ...ctx, journey: j('board'), room: 'city', spot: 'board', showDetails: true })).toBe('Close the month & judge');
    expect(guideLabel({ ...ctx, journey: j('board'), room: 'bank', spot: null })).toBe('Go');
    expect(guideNextHop('manager', { room: 'city', near: null, spot: 'work' })).toBe('enterWork');
    expect(guideNextHop('manager', { room: 'work', near: null, spot: null })).toBe('walkToManager');
    expect(guideNextHop('manager', { room: 'work', near: null, spot: 'manager' })).toBe('arrived');
    expect(guideNextHop('desk', { room: 'city', near: null, spot: 'home' })).toBe('enterHome');
    expect(guideNextHop('desk', { room: 'home', near: null, spot: 'exit' })).toBe('walkToDesk');
    expect(guideNextHop('rosa', { room: 'city', near: null, spot: 'rosa' })).toBe('arrived');
    expect(guideNextHop('board', { room: 'city', near: null, spot: null })).toBeNull();
  });
});
