import React, { useState } from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHARACTERS, CAREER_PATHS, DIFFICULTY_SETTINGS } from '../constants';
import { GameState } from '../types';
import { I18nProvider } from '../i18n';
import { applyCareerSalaryGrowth, calculateEffectiveMonthlySalary, checkPromotion, clearSimSeed, getCourseRaiseMultiplier, processTurn } from '../services/gameLogic';
import { COURSE_RAISE_PCT, COURSE_RETAKE_FEE, chargeRetakeFee, grantCourseRaise, recordMiss } from '../services/courseRewards';
import { freedomPace } from '../services/freedomPace';
import { payStub, promotionOutlook } from '../services/townWork';
import { loadAdultGame, saveAdultGame } from '../services/storageService';
import SalesCertificationPanel from '../components/SalesCertificationPanel';
import { SALES_ACCELERATOR_QUIZ, SALES_ACCELERATOR_QUIZ_META } from '../data/salesAcceleratorQuiz';
import { startState } from './strategyHarness';

// Build 55: the Self Learn certifications pay a lasting raise instead of one-time cash ($50k / $25k / $25k),
// and a third miss costs a small retake fee instead of $25k (or a $10k fee plus a demotion for EQ).
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); clearSimSeed(); });
const alex = CHARACTERS.find(c => c.id === 'alex')!;
const CARD_ID = 'credit-card';

describe('the certification raise', () => {
  it('raises pay once per course and stacks across courses', () => {
    const s = startState(alex), pay = calculateEffectiveMonthlySalary(s);
    const once = grantCourseRaise(s, 'negotiations');
    expect(calculateEffectiveMonthlySalary(once)).toBe(Math.round(pay * 1.05));
    expect(grantCourseRaise(once, 'negotiations')).toBe(once);
    const all = grantCourseRaise(grantCourseRaise(once, 'sales'), 'eq');
    expect(getCourseRaiseMultiplier(all)).toBeCloseTo(1.05 * 1.03 * 1.03, 10);
    expect(all.cash).toBe(s.cash);
  });

  it('gives nothing extra to a save that claimed the old cash bonus', () => {
    const s = { ...startState(alex), negotiationsCourse: { certified: true, rewardClaimed: true, failedAttempts: 0, bestScore: 15 } };
    expect(getCourseRaiseMultiplier(s)).toBe(1);
  });

  it('survives a promotion, unlike a one-off raise to base pay', () => {
    const s0 = startState(alex), next = CAREER_PATHS[alex.careerPath].levels[1];
    const s = grantCourseRaise({ ...s0, career: { ...s0.career!, experience: next.experienceRequired } }, 'negotiations');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { promoted, newState } = checkPromotion(s);
    expect(promoted).toBe(true);
    const newBase = Math.round(next.baseSalary * DIFFICULTY_SETTINGS.NORMAL.salaryMultiplier);
    expect(newState.career!.salary).toBe(newBase);
    // Alex's own perk (+5% for automation) applies on top; the course raise is still there after the promotion.
    const withoutRaise = calculateEffectiveMonthlySalary({ ...newState, courseRaises: undefined });
    expect(Math.abs(calculateEffectiveMonthlySalary(newState) - withoutRaise * 1.05)).toBeLessThanOrEqual(1);
  });

  it('shows on the pay stub, which still adds up to what the turn pays', () => {
    const s = grantCourseRaise(startState(alex), 'eq'), stub = payStub(s);
    const line = stub.lines.find(l => l.label === 'Certification raise')!;
    expect(line.amount).toBe(Math.round(s.career!.salary * .03));
    expect(stub.lines.reduce((n, l) => n + l.amount, 0)).toBe(stub.gross);
    expect(stub.gross).toBe(calculateEffectiveMonthlySalary(s));
  });

  it('brings "free in about N years" closer', () => {
    const s = startState(alex), months = (x: GameState) => { const p = freedomPace(x); return p.status === 'on-track' ? p.months : Infinity; };
    expect(months(grantCourseRaise(s, 'negotiations'))).toBeLessThan(months(s));
  });
});

describe('retakes', () => {
  it('the third miss costs the fee and starts three fresh tries', () => {
    const s = startState(alex);
    const one = recordMiss(s, 0), two = recordMiss(s, 1), three = recordMiss(s, 2);
    expect([one.failedAttempts, one.feeCharged, one.state.cash]).toEqual([1, false, s.cash]);
    expect([two.failedAttempts, two.feeCharged]).toEqual([2, false]);
    expect([three.failedAttempts, three.feeCharged, three.state.cash]).toEqual([0, true, s.cash - COURSE_RETAKE_FEE]);
  });

  it('puts what cash cannot cover on the credit card', () => {
    const s = chargeRetakeFee({ ...startState(alex), cash: 50 });
    expect(s.cash).toBe(0);
    expect(s.liabilities.find(l => l.id === CARD_ID)?.balance).toBe(COURSE_RETAKE_FEE - 50);
  });
});

describe('perks that now work as promised', () => {
  it('EQ certification earns career experience 1.5× as fast', () => {
    let s: GameState = { ...startState(alex), eqPerks: { careerXpMultiplier: 1.5, careerXpCarry: 0 } };
    vi.spyOn(Math, 'random').mockReturnValue(.999);
    const start = s.career!.experience;
    for (let i = 0; i < 4; i++) s = processTurn(s).newState;
    expect(s.career!.experience - start).toBe(6);
    expect(s.playerJob!.experience - start).toBe(6);
  });

  it('EQ-certified players see the shorter wait for a promotion', () => {
    const s = startState(alex), need = CAREER_PATHS[alex.careerPath].levels[1].experienceRequired;
    const eq = { ...s, eqPerks: { careerXpMultiplier: 1.5, careerXpCarry: 0 } };
    expect(promotionOutlook(eq).monthsShort).toBe(Math.ceil(need / 1.5));
    expect(promotionOutlook(s).monthsShort).toBe(need);
  });

  it('the negotiation bonus adds yearly raises, not 2% a month', () => {
    const s = { ...startState(alex), negotiationsCourse: { certified: true, rewardClaimed: false, failedAttempts: 0, bestScore: 15 } };
    let x: GameState = s;
    for (let i = 0; i < 12; i++) x = applyCareerSalaryGrowth(x);
    const year = x.career!.salary / s.career!.salary - 1;
    expect(year).toBeGreaterThan(.03);   // better than an uncertified player's ~1.8%
    expect(year).toBeLessThan(.05);      // it compounded to ~27% before build 55
  });
});

describe('older saves', () => {
  it('keep valid raises, drop junk, and reopen a Sales course locked by three misses', () => {
    const s = { ...startState(alex), courseRaises: { negotiations: 5, sales: 'x', eq: 500, bogus: 3 } as unknown as GameState['courseRaises'], salesAcceleratorCourse: { failedAttempts: 3, bestScore: 7, certified: false, rewardClaimed: false } };
    saveAdultGame(s);
    const loaded = loadAdultGame()!;
    expect(loaded.courseRaises).toEqual({ negotiations: 5 });
    expect(loaded.salesAcceleratorCourse?.failedAttempts).toBe(0);
    expect(loaded.salesAcceleratorCourse?.bestScore).toBe(7);
  });
});

describe('Sales Accelerator panel', () => {
  const correctId = (q: (typeof SALES_ACCELERATOR_QUIZ)[number]) => q.options.find(o => 'correct' in o && o.correct)!.id;
  const wrongId = (q: (typeof SALES_ACCELERATOR_QUIZ)[number]) => q.options.find(o => !('correct' in o && o.correct))!.id;
  let latest: GameState;
  const Harness = ({ initial }: { initial: GameState }) => {
    const [gameState, setGameState] = useState(initial);
    latest = gameState;
    return <SalesCertificationPanel gameState={gameState} setGameState={setGameState} formatMoney={n => `$${Math.round(n).toLocaleString('en-US')}`} />;
  };
  const takeQuiz = (pick: (q: (typeof SALES_ACCELERATOR_QUIZ)[number]) => string, onIntro?: () => void) => {
    fireEvent.click(screen.getAllByRole('button', { name: /start certification/i })[0]);
    onIntro?.();
    fireEvent.click(screen.getAllByRole('button', { name: /^start certification$/i }).at(-1)!);
    for (const q of SALES_ACCELERATOR_QUIZ.slice(0, SALES_ACCELERATOR_QUIZ_META.rules.questionCount)) {
      const letter = pick(q).toUpperCase();
      fireEvent.click(screen.getAllByText(letter, { selector: 'div' })[0].closest('button')!);
      fireEvent.click(screen.getByRole('button', { name: /^(next|finish)$/i }));
    }
  };
  const renderPanel = (s: GameState) => render(<I18nProvider><Harness initial={s} /></I18nProvider>);

  it('a pass pays the raise, not cash', () => {
    const s = startState(alex);
    renderPanel(s);
    takeQuiz(correctId, () => expect(screen.getByText(/pass for a 3% raise that stays with you\. 3 tries included; after a third miss, a \$150 retake fee/i)).toBeTruthy());
    expect(screen.getByText(/a 3% raise that stays with you/i)).toBeTruthy();
    expect(latest.cash).toBe(s.cash);
    expect(latest.courseRaises).toEqual({ sales: COURSE_RAISE_PCT.sales });
    expect(latest.salesAcceleratorCourse).toMatchObject({ certified: true, rewardClaimed: true });
  });

  it('three misses cost the retake fee once, and the course stays open', () => {
    const s = startState(alex);
    renderPanel(s);
    for (let i = 0; i < 3; i++) {
      takeQuiz(wrongId);
      if (i < 2) expect(latest.cash).toBe(s.cash);
      fireEvent.click(screen.getAllByRole('button', { name: /close/i }).at(-1)!);
    }
    expect(latest.cash).toBe(s.cash - COURSE_RETAKE_FEE);
    expect(latest.salesAcceleratorCourse?.failedAttempts).toBe(0);
    expect(screen.getByText('Attempts left: 3')).toBeTruthy();
  });
});
