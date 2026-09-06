import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState } from '../types';
import { mentorTalk, proposeRecoveryPlan, acceptRecoveryPlan, planProgress, judgeRecoveryPlan, performanceReview, layoffHazard, noticeLifted, PLAN_MONTHS, PLAN_CREDIT } from '../services/townCareer';
import { processTurn, clearSimSeed, applyMonthlyAction } from '../services/gameLogic';
import WorkPanel from '../components/town/WorkPanel';

const career = (o: Partial<NonNullable<GameState['career']>> = {}): NonNullable<GameState['career']> => ({ path: 'TECH', title: 'Junior Developer', salary: 5500, level: 1, experience: 12, skills: {}, aiVulnerability: .4, futureProofScore: 65, ...o });
const base = (o: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 5, career: career(), playerJob: { title: 'Junior Developer', salary: 5500, level: 1, experience: 12 }, ...o });
const dReview = { month: 1, year: 1, score: 30, grade: 'D' as const, bonus: 0, factors: [{ id: 'stress' as const, delta: -12 }, { id: 'network' as const, delta: -10 }, { id: 'overtime' as const, delta: 3 }] };
afterEach(() => { cleanup(); vi.restoreAllMocks(); clearSimSeed(); });

describe('the one-on-one', () => {
  it('explains the weakest factors of the last review with a cause and a fix, and projects the grade', () => {
    const talk = mentorTalk(base({ townProgress: { lastReview: dReview } }));
    expect(talk.opener).toMatch(/hard to write/); expect(talk.points.map(p => p.id)).toEqual(['stress', 'network']); expect(talk.points[0].fix).toMatch(/recovery month/);
    expect(talk.projected?.grade).toBeDefined();
    const fresh = mentorTalk(base({ stats: { ...INITIAL_GAME_STATE.stats, stress: 20, networking: 70 } }));
    expect(fresh.opener).toMatch(/No review on file/); expect(fresh.points.length).toBeGreaterThan(0);
    expect(mentorTalk(base({ jobLossMonthsRemaining: 2 })).opener).toMatch(/Losing a role/);
  });
  it('proposes goals from the weak spots, tracks them through the cumulative log and judges the plan when it ends', () => {
    const stressed = base({ stats: { ...INITIAL_GAME_STATE.stats, stress: 80, networking: 30, energy: 30 } });
    const goals = proposeRecoveryPlan(stressed); expect(goals.map(g => g.id)).toEqual(['stress-down', 'network-up', 'recover']);
    const agreed = acceptRecoveryPlan(stressed); const plan = agreed.townProgress!.recoveryPlan!;
    expect(plan.endMonth).toBe(5 + PLAN_MONTHS); expect(agreed.events[0].title).toBe('Recovery plan agreed'); expect(acceptRecoveryPlan(agreed)).toBe(agreed);
    const { newState: rested } = applyMonthlyAction({ ...agreed, monthlyActionsRemaining: 3 }, 'RECOVER');
    expect(rested.townProgress?.workLog?.recover).toBe(1);
    const progress = planProgress(rested); expect(progress.find(p => p.goal.id === 'recover')?.done).toBe(true);
    expect(judgeRecoveryPlan(rested)).toEqual({});
    const finished = { ...rested, month: plan.endMonth, stats: { ...rested.stats, stress: 40, networking: 45 } };
    const judged = { ...finished, ...judgeRecoveryPlan(finished) };
    expect(judged.townProgress?.recoveryPlan?.result).toBe('completed'); expect(judged.townProgress?.recoveryCredit?.points).toBe(PLAN_CREDIT); expect(judged.events[0].title).toBe('Recovery plan completed');
    expect(performanceReview(judged)?.factors.some(f => f.id === 'recovery' && f.delta === PLAN_CREDIT)).toBe(true);
    const missed = { ...rested, month: plan.endMonth, stats: { ...rested.stats, stress: 90 } };
    expect(judgeRecoveryPlan(missed).townProgress?.recoveryPlan?.result).toBe('missed');
  });
  it('lifts a D notice when the plan completes, and the turn judges it', () => {
    const onNotice = base({ month: 3, townProgress: { lastReview: dReview, recoveryPlan: { startMonth: 1, endMonth: 3, goals: [{ id: 'training', target: 1 }], startLog: { overtime: 0, network: 0, training: 0, recover: 0 }, startNetworking: 40 }, workLog: { training: 1 } } });
    const before = layoffHazard(onNotice).monthly;
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const { newState } = processTurn(onNotice);
    expect(newState.townProgress?.recoveryPlan?.result).toBe('completed'); expect(noticeLifted(newState)).toBe(true);
    expect(layoffHazard(newState).monthly).toBeLessThan(before);
  });
  it('renders the conversation and the plan offer', () => {
    const onAcceptPlan = vi.fn();
    render(<WorkPanel state={base({ stats: { ...INITIAL_GAME_STATE.stats, stress: 80 } })} disabled={false} onAcceptPlan={onAcceptPlan} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask how you are doing' }));
    expect(document.body.textContent).toMatch(/No review on file yet/);
    fireEvent.click(screen.getByRole('button', { name: /Agree a 3-month plan/ })); expect(onAcceptPlan).toHaveBeenCalledTimes(1);
  });
});
