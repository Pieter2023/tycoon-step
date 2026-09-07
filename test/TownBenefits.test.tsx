import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS, LIFE_EVENTS } from '../constants';
import { GameState } from '../types';
import { benefitEligibility, fileUnemploymentClaim, payUnemploymentBenefit, benefitStatus, BENEFIT_CAP, BENEFIT_MONTHS } from '../services/townBenefits';
import { processTurn, clearSimSeed, applyScenarioOutcome } from '../services/gameLogic';
import { applyLayoff, jobSearch } from '../services/townCareer';
import TellerPanel from '../components/town/TellerPanel';

const career = (o: Partial<NonNullable<GameState['career']>> = {}): NonNullable<GameState['career']> => ({ path: 'TECH', title: 'Junior Developer', salary: 4000, level: 1, experience: 12, skills: {}, aiVulnerability: .4, futureProofScore: 65, ...o });
const base = (o: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 5, career: career(), playerJob: { title: 'Junior Developer', salary: 4000, level: 1, experience: 12 }, ...o });
afterEach(() => { cleanup(); vi.restoreAllMocks(); clearSimSeed(); });

describe('unemployment insurance at the bank', () => {
  it('qualifies only an involuntary gap, at half pay up to the cap for up to six months', () => {
    expect(benefitEligibility(base()).eligible).toBe(false);
    const laidOff = { ...base(), ...applyLayoff(base(), 0) };
    const check = benefitEligibility(laidOff); expect(check.eligible).toBe(true); expect(check.monthly).toBe(2000); expect(check.months).toBe(3);
    expect(benefitEligibility(base({ jobLossMonthsRemaining: 2, townProgress: { laidOffMonth: 4, careerChangedMonth: 5 } })).eligible).toBe(false);
    expect(benefitEligibility(base({ jobLossMonthsRemaining: 8, career: career({ salary: 9000 }), townProgress: { laidOffMonth: 5 } })).monthly).toBe(BENEFIT_CAP);
    expect(benefitEligibility(base({ jobLossMonthsRemaining: 8, townProgress: { laidOffMonth: 5 } })).months).toBe(BENEFIT_MONTHS);
    const filed = fileUnemploymentClaim(laidOff);
    expect(filed.townProgress?.unemploymentClaim?.monthly).toBe(2000); expect(filed.events[0].title).toBe('Unemployment claim filed'); expect(fileUnemploymentClaim(filed)).toBe(filed);
    expect(benefitStatus(filed)?.active).toBe(true);
  });
  it('pays from the month after filing while a job application is on record, and closes when work resumes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    let s = fileUnemploymentClaim({ ...base(), ...applyLayoff(base(), 0) });
    const cashAfterFiling = s.cash;
    s = processTurn(s).newState;                                    // month 5 → 6: filing month, no payment yet
    expect(s.townProgress?.unemploymentClaim?.paid).toBe(0); expect(s.jobLossMonthsRemaining).toBe(2);
    s = processTurn(s).newState;                                    // month 6 → 7: no application in month 6 → paused
    expect(s.townProgress?.unemploymentClaim?.paid).toBe(0); expect(s.events.some(e => e.title === 'Benefit paused')).toBe(true);
    s = jobSearch({ ...s, pendingScenario: null }, () => .99).state;  // applied in month 7 (any random event resolved), no offer
    const cashBefore = s.cash; s = processTurn(s).newState;         // month 7 → 8: paid
    expect(s.townProgress?.unemploymentClaim?.paid).toBe(2000); expect(s.cash).toBeGreaterThanOrEqual(cashBefore + 2000 - 20000);
    expect(s.events.some(e => e.title === 'Unemployment benefit paid')).toBe(true); expect(s.jobLossMonthsRemaining).toBe(0);
    s = processTurn(s).newState;                                    // back at work → claim closes
    expect(s.townProgress?.unemploymentClaim?.closedMonth).toBeDefined(); expect(s.events.some(e => e.title === 'Unemployment claim closed')).toBe(true);
    expect(payUnemploymentBenefit(s, s)).toEqual({});
    expect(cashAfterFiling).toBeGreaterThan(9000); // severance was paid by the layoff
  });
  it('files automatically from the dashboard job-loss event option that says so', () => {
    const event = LIFE_EVENTS.find(e => e.id === 'job_loss')!; const option = event.options.find(o => o.outcome.filesUnemployment)!;
    const next = applyScenarioOutcome({ ...base(), pendingScenario: event }, option.outcome);
    expect(next.jobLossMonthsRemaining).toBe(4); expect(next.townProgress?.laidOffMonth).toBe(5); expect(next.townProgress?.unemploymentClaim?.monthly).toBe(2000);
  });
  it('lets the teller file the claim and shows the status', () => {
    const onFileClaim = vi.fn(); const laidOff = { ...base(), ...applyLayoff(base(), 0) };
    render(<TellerPanel state={laidOff} disabled={false} loans={[]} onLoans={vi.fn()} onReserve={vi.fn()} onBusiness={vi.fn()} onFileClaim={onFileClaim} />);
    expect(document.body.textContent).toMatch(/Unemployment insurance/); fireEvent.click(screen.getByRole('button', { name: 'File the claim' })); expect(onFileClaim).toHaveBeenCalled();
    cleanup();
    render(<TellerPanel state={fileUnemploymentClaim(laidOff)} disabled={false} loans={[]} onLoans={vi.fn()} onReserve={vi.fn()} onBusiness={vi.fn()} onFileClaim={onFileClaim} />);
    expect(document.body.textContent).toMatch(/months left/); expect(screen.queryByRole('button', { name: 'File the claim' })).toBeNull();
  });
});
