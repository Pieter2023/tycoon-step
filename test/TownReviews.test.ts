import { describe, it, expect, afterEach, vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState } from '../types';
import { performanceReview, applyPerformanceReview, reviewPromotionBonus, layoffHazard, applyLayoff, jobSearchOdds, jobSearch, switchCareer, LAYOFF_MONTHS, gradeFor } from '../services/townCareer';
import { processTurn, clearSimSeed, applyMonthlyAction } from '../services/gameLogic';
import { promotionOutlook } from '../services/townWork';

const career = (o: Partial<NonNullable<GameState['career']>> = {}): NonNullable<GameState['career']> => ({ path: 'TECH', title: 'Junior Developer', salary: 5500, level: 1, experience: 12, skills: {}, aiVulnerability: .4, futureProofScore: 65, ...o });
const base = (o: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 12, career: career(), playerJob: { title: 'Junior Developer', salary: 5500, level: 1, experience: 12 }, ...o });
afterEach(() => { vi.restoreAllMocks(); clearSimSeed(); });

describe('performance reviews', () => {
  it('grades the year from stress, network, desk actions and months between jobs, and pays a bonus for A and B', () => {
    const calm = base({ stats: { ...INITIAL_GAME_STATE.stats, stress: 20, networking: 80, energy: 80, happiness: 75, financialIQ: 70 }, yearStats: { startNetWorth: 0, marketGains: 0, passiveIncome: 0, hindsights: [], workActions: { overtime: 4, network: 3, training: 2 } } });
    const review = performanceReview(calm)!; expect(review.grade).toBe('A'); expect(review.bonus).toBe(Math.round(5500 * .6)); expect(review.factors.some(f => f.id === 'overtime' && f.delta === 12)).toBe(true);
    const rough = performanceReview(base({ stats: { ...INITIAL_GAME_STATE.stats, stress: 90, networking: 20, energy: 20, happiness: 20 }, yearStats: { startNetWorth: 0, marketGains: 0, passiveIncome: 0, hindsights: [], monthsUnemployed: 3 } }))!;
    expect(rough.grade).toBe('D'); expect(rough.bonus).toBe(0);
    expect(gradeFor(62)).toBe('B'); expect(gradeFor(61)).toBe('C');
    expect(performanceReview(base({ jobLossMonthsRemaining: 2 }))).toBeNull();
    const applied = { ...calm, ...applyPerformanceReview(calm) };
    expect(applied.cash).toBe(9000 + review.bonus); expect(applied.townProgress?.lastReview?.grade).toBe('A'); expect(applied.events[0].title).toBe('Performance review: A');
    expect(reviewPromotionBonus(applied)).toBe(.1); expect(reviewPromotionBonus({ ...applied, month: applied.month + 12 })).toBe(0);
    expect(promotionOutlook({ ...applied, career: career({ experience: 30 }) }).boosters.some(b => /last review/i.test(b))).toBe(true);
  });
  it('lands in January inside processTurn and shows up in the annual report', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const s = base({ month: 12, stats: { ...INITIAL_GAME_STATE.stats, stress: 20, networking: 80 }, yearStats: { startNetWorth: 1000, marketGains: 0, passiveIncome: 0, hindsights: [], workActions: { overtime: 2, network: 1, training: 1 } } });
    const { newState } = processTurn(s);
    expect(newState.townProgress?.lastReview?.month).toBe(13); // the January it lands in expect(newState.annualReport?.city?.review?.grade).toBe(newState.townProgress?.lastReview?.grade);
    expect(newState.events.some(e => /Performance review/.test(e.title))).toBe(true);
    expect(newState.yearStats?.workActions).toBeUndefined(); // counters reset with the year
  });
  it('counts desk actions for the review', () => {
    const s = base({ stats: { ...INITIAL_GAME_STATE.stats, energy: 90 }, monthlyActionsRemaining: 3 });
    const { newState } = applyMonthlyAction(s, 'OVERTIME');
    expect(newState.yearStats?.workActions?.overtime).toBe(1);
  });
});

describe('layoffs and the job search', () => {
  it('sets the hazard from exposure, recession and the last review, and never fires while between jobs', () => {
    const tech = layoffHazard(base()); expect(tech.monthly).toBeGreaterThan(0); expect(tech.factors[0].multiplier).toBeCloseTo(.5 + .4 * 2.5, 5);
    const nurse = layoffHazard(base({ career: career({ path: 'HEALTHCARE' }) })); expect(nurse.monthly).toBeLessThan(tech.monthly);
    expect(layoffHazard(base({ economy: { ...INITIAL_GAME_STATE.economy, recession: true } })).monthly).toBeCloseTo(tech.monthly * 2, 6);
    const onNotice = base({ townProgress: { lastReview: { month: 12, year: 1, score: 30, grade: 'D', bonus: 0, factors: [] } } });
    expect(layoffHazard(onNotice).monthly).toBeCloseTo(tech.monthly * 2.5, 6);
    expect(layoffHazard(base({ jobLossMonthsRemaining: 2 })).monthly).toBe(0);
    expect(applyLayoff(base(), .99)).toEqual({});
    const cut = { ...base(), ...applyLayoff(base(), 0) };
    expect(cut.jobLossMonthsRemaining).toBe(LAYOFF_MONTHS); expect(cut.cash).toBe(9000 + Math.round(5500 * 1)); expect(cut.events[0].title).toBe('Laid off'); expect(cut.townProgress?.laidOffMonth).toBe(12);
  });
  it('lets the player search once a month and change path while unemployed', () => {
    const idle = base({ jobLossMonthsRemaining: 3 });
    expect(jobSearchOdds(base()).eligible).toBe(false);
    const odds = jobSearchOdds(idle); expect(odds.eligible).toBe(true); expect(odds.chance).toBeGreaterThan(.1);
    const miss = jobSearch(idle, () => .99); expect(miss.success).toBe(false); expect(miss.state.jobLossMonthsRemaining).toBe(3); expect(jobSearchOdds(miss.state).eligible).toBe(false);
    const hit = jobSearch({ ...idle, month: 13 }, () => 0); expect(hit.success).toBe(true); expect(hit.state.jobLossMonthsRemaining).toBe(0); expect(hit.state.events[0].title).toMatch(/offer accepted/);
    const switched = switchCareer(idle, 'HEALTHCARE'); expect(switched.career?.path).toBe('HEALTHCARE'); expect(switched.jobLossMonthsRemaining).toBe(1);
  });
});
