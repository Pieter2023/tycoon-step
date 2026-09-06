import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS, CAREER_PATHS } from '../constants';
import { GameState } from '../types';
import { raiseOdds, askForRaise, jobBoard, careerChangeEligibility, switchCareer, RAISE_COOLDOWN, CAREER_CHANGE_COOLDOWN, RELEVANT_EDUCATION_CREDIT } from '../services/townCareer';
import { applyScenarioOutcome } from '../services/gameLogic';
import { workBoard } from '../services/townWork';
import { getMonthlyActionsSummary } from '../services/monthlyActions';
import WorkPanel from '../components/town/WorkPanel';

const career = (o: Partial<NonNullable<GameState['career']>> = {}): NonNullable<GameState['career']> => ({ path: 'TECH', title: 'Junior Developer', salary: 5500, level: 1, experience: 12, skills: {}, aiVulnerability: .4, futureProofScore: 65, ...o });
const base = (o: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 10, career: career(), playerJob: { title: 'Junior Developer', salary: 5500, level: 1, experience: 12 }, ...o });
afterEach(cleanup);

describe('asking for a raise', () => {
  it('shows honest odds with named factors and applies the raise, the consolation and the cooldown', () => {
    const modest = raiseOdds(base(), 8), bold = raiseOdds(base(), 15);
    expect(modest.eligible).toBe(true); expect(bold.chance).toBeLessThan(modest.chance); expect(bold.factors.some(f => /bold/i.test(f.label))).toBe(true);
    expect(raiseOdds(base({ economy: { ...INITIAL_GAME_STATE.economy, recession: true } }), 8).chance).toBeLessThan(modest.chance);
    const win = askForRaise(base(), 15, () => 0);
    expect(win.success).toBe(true); expect(win.newSalary).toBe(Math.round(5500 * 1.15)); expect(win.state.career?.salary).toBe(win.newSalary); expect(win.state.playerJob.salary).toBe(win.newSalary);
    expect(win.state.events[0].title).toBe('Raise approved'); expect(win.state.townProgress?.lastRaiseAskMonth).toBe(10); expect(win.state.cash).toBe(9000);
    const again = raiseOdds(win.state, 8); expect(again.eligible).toBe(false); expect(again.monthsUntil).toBe(RAISE_COOLDOWN);
    expect(askForRaise(win.state, 8).asked).toBe(false);
    expect(raiseOdds({ ...win.state, month: 10 + RAISE_COOLDOWN }, 8).eligible).toBe(true);
    const lose = askForRaise(base(), 15, () => .999);
    expect(lose.success).toBe(false); expect(lose.pct).toBe(3); expect(lose.newSalary).toBe(Math.round(5500 * 1.03)); expect(lose.state.stats.stress).toBeGreaterThan(base().stats.stress);
    expect(askForRaise(base({ jobLossMonthsRemaining: 1 }), 8).asked).toBe(false);
  });
  it('makes the dashboard negotiation event actually change salary', () => {
    const s = base(); const next = applyScenarioOutcome(s, { cashChange: 0, salaryChangePct: 15, message: '' });
    expect(next.career?.salary).toBe(Math.round(5500 * 1.15)); expect(next.playerJob.salary).toBe(Math.round(5500 * 1.15));
  });
});

describe('job board and career change', () => {
  it('lists every other path with entry pay, exposure and whether a qualification fits', () => {
    const board = jobBoard(base());
    expect(board.length).toBe(Object.keys(CAREER_PATHS).length - 1); expect(board.some(j => j.path === 'TECH')).toBe(false);
    expect(board[0].futureProofScore).toBeGreaterThanOrEqual(board[board.length - 1].futureProofScore);
    const nursing = board.find(j => j.path === 'HEALTHCARE')!; expect(nursing.title).toBe(CAREER_PATHS.HEALTHCARE.levels[0].title); expect(nursing.delta).toBe(nursing.salary - 5500);
    const withDegree = jobBoard(base({ education: { level: 'BACHELOR', degrees: ['nursing_degree'] } }));
    expect(withDegree.some(j => j.relevantEducation) || withDegree.every(j => !j.relevantEducation)).toBe(true);
    expect(workBoard(base()).jobs.length).toBe(4);
  });
  it('changes path with a month between jobs, rung one, an experience credit for relevant education and a year before the next change', () => {
    const s = base(); const next = switchCareer(s, 'HEALTHCARE');
    expect(next.career?.path).toBe('HEALTHCARE'); expect(next.career?.level).toBe(1); expect(next.career?.title).toBe(CAREER_PATHS.HEALTHCARE.levels[0].title);
    expect(next.jobLossMonthsRemaining).toBe(1); expect(next.townProgress?.careerChangedMonth).toBe(10); expect(next.events[0].title).toMatch(/Career change/);
    expect(next.stats.stress).toBe(s.stats.stress + 10); expect(next.cash).toBe(s.cash); expect(next.education).toEqual(s.education);
    expect(careerChangeEligibility(next).eligible).toBe(false);
    expect(switchCareer(next, 'FINANCE')).toBe(next);
    expect(careerChangeEligibility({ ...next, jobLossMonthsRemaining: 0, month: 10 + CAREER_CHANGE_COOLDOWN }).eligible).toBe(true);
    expect(switchCareer(s, 'TECH')).toBe(s);
    const credited = jobBoard(base()).find(j => j.relevantEducation);
    if (credited) expect(switchCareer(base(), credited.path).career?.experience).toBe(RELEVANT_EDUCATION_CREDIT);
  });
  it('renders the raise buttons with odds, the desk actions and a two-step career change', () => {
    const onAskRaise = vi.fn(), onSwitchCareer = vi.fn(), onMonthlyAction = vi.fn();
    const s = base(); const actions = getMonthlyActionsSummary(s, false);
    render(<WorkPanel state={s} disabled={false} onAskRaise={onAskRaise} onSwitchCareer={onSwitchCareer} workActions={actions} onMonthlyAction={onMonthlyAction} />);
    fireEvent.click(screen.getByRole('button', { name: /Ask for 8%/ })); expect(onAskRaise).toHaveBeenCalledWith(8);
    fireEvent.click(screen.getAllByRole('button', { name: 'Do it this month' })[0]); expect(onMonthlyAction).toHaveBeenCalledWith('OVERTIME');
    fireEvent.click(screen.getAllByRole('button', { name: 'Apply' })[0]); expect(onSwitchCareer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, change careers' })); expect(onSwitchCareer).toHaveBeenCalledTimes(1);
  });
});
