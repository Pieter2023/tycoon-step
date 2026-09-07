import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState, Child } from '../types';
import { calculateChildrenExpenses } from '../services/gameLogic';
import { stageOf, STAGE_COST, childCard, household, householdFigures, contributeCollegeFund, remainingToAdulthood, grow, monthlyToReach, COLLEGE_TARGET, ADULT_MONTHS } from '../services/townFamily';
import { savingsBalance } from '../services/townActivities';
import { createTownHome } from '../components/town/townHome';
import HomePanel from '../components/town/HomePanel';
import { adviseFrom } from '../services/townAdvisor';

const child = (name: string, birthMonth: number, extra: Partial<Child> = {}): Child => ({ id: `c-${name}`, name, birthMonth, age: 0, inSchool: false, inCollege: false, ...extra });
const base = (overrides: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 12000, month: 120, ...overrides });
const married = (children: Child[] = []): GameState => base({ family: { spouse: { name: 'Taylor', income: 3200, careerPath: 'HEALTHCARE', marriedMonth: 84 }, children, isEngaged: false } });
afterEach(cleanup);

describe('the family at home', () => {
  it('uses the same age bands and amounts as the monthly children expense', () => {
    const kids = [child('Emma', 129), child('Liam', 110), child('Ava', 90), child('Noah', 12), child('Mia', -50)];
    const s = married(kids);
    expect(household(s).childrenMonthly).toBe(calculateChildrenExpenses(s));
    expect(kids.map(k => stageOf(s.month - k.birthMonth))).toEqual(['expected', 'infant', 'preschool', 'school', 'teen']);
    expect(stageOf(230, true)).toBe('college'); expect(stageOf(230, false)).toBe('independent'); expect(STAGE_COST.independent).toBe(0);
  });
  it('prices a child to adulthood and a college fund at the savings rate', () => {
    const s = married([child('Emma', 120)]);
    const card = childCard(s, s.family.children[0]);
    expect(card.stage).toBe('infant'); expect(card.monthsTo18).toBe(ADULT_MONTHS); expect(card.next).toMatchObject({ stage: 'preschool', inMonths: 24, monthly: 1000 });
    expect(card.remaining).toBe(remainingToAdulthood(0));
    expect(remainingToAdulthood(0)).toBe(24 * 1200 + 36 * 1000 + 84 * 600 + 72 * 800);
    expect(card.fund).toBe(0); expect(card.fundMonthly).toBeGreaterThan(0); expect(card.fundMonthly).toBeLessThan(COLLEGE_TARGET / ADULT_MONTHS);
    expect(grow(1000, 0, 12, 0)).toBe(1000); expect(grow(0, 100, 10, 0)).toBe(1000); expect(monthlyToReach(1200, 0, 12, 0)).toBe(100); expect(monthlyToReach(1000, 1000, 12)).toBe(0);
    const expected = childCard(s, child('Mia', 129)); expect(expected.stage).toBe('expected'); expect(expected.ageYears).toBe(0); expect(expected.next?.inMonths).toBe(9);
    const grown = childCard(s, child('Old', -120)); expect(grown.canFund).toBe(false); expect(grown.remaining).toBe(0);
  });
  it('describes the household and who is at home in the flat', () => {
    expect(household(base()).status).toBe('single'); expect(household(base()).headline).toMatch(/Nobody else/);
    expect(household(base({ family: { children: [], isEngaged: true } })).status).toBe('engaged');
    const couple = household(married());
    expect(couple.status).toBe('married'); expect(couple.spouse).toMatchObject({ name: 'Taylor', job: 'Healthcare', income: 3200, yearsMarried: 3 }); expect(couple.headline).toMatch(/Taylor brings in \$3,200 a month/);
    const family = household(married([child('Emma', 60), child('Liam', 110)]));
    expect(family.headline).toMatch(/2 children cost \$1,800 a month\. Emma turns 18 in 156 months\./); expect(family.taxBreak).toBe(4000);
    expect(householdFigures(married([child('Emma', 110)]))).toEqual({ spouse: true, crib: true, toys: false, children: [] });
    expect(householdFigures(married([child('Emma', 60), child('Liam', 90), child('Ava', -30)]))).toEqual({ spouse: true, crib: false, toys: true, children: [.62, .5, .8] });
    const home = createTownHome(); home.setFamily({ crib: true, toys: false });
    const visible = (color: string) => { let n = 0; home.root.traverse(o => { if (o instanceof THREE.Mesh && o.parent?.visible && (o.material as THREE.MeshStandardMaterial).color?.getHexString() === color) n++; }); return n; };
    expect(visible('e8dccb')).toBeGreaterThan(0); expect(visible('c94f3f')).toBe(0);
  });
  it('moves college money into savings, notes it against the child, and refuses what it cannot do', () => {
    const s = married([child('Emma', 100)]);
    const next = contributeCollegeFund(s, 'c-Emma', 1000);
    expect(next.cash).toBe(11000); expect(savingsBalance(next)).toBeCloseTo(1000, 6); expect(next.townProgress?.collegeFund).toEqual({ 'c-Emma': 1000 }); expect(next.events[0].title).toMatch(/College fund: Emma/);
    expect(childCard(next, next.family.children[0]).fund).toBe(1000);
    expect(contributeCollegeFund(next, 'c-Emma', 250).townProgress?.collegeFund).toEqual({ 'c-Emma': 1250 });
    expect(contributeCollegeFund(s, 'c-Emma', 50000)).toBe(s); expect(contributeCollegeFund(s, 'nobody', 100)).toBe(s); expect(contributeCollegeFund(s, 'c-Emma', 10.5)).toBe(s);
    const grownUp = married([child('Old', -120)]); expect(contributeCollegeFund(grownUp, 'c-Old', 100)).toBe(grownUp);
    expect(adviseFrom(s).some(a => a.id === 'college-fund' && a.place === 'home')).toBe(true);
    expect(adviseFrom(next).some(a => a.id === 'college-fund')).toBe(false);
  });
  it('shows the family at home and puts money aside from the panel', () => {
    const onCollegeFund = vi.fn();
    render(<HomePanel state={married([child('Emma', 60)])} disabled={false} onCollegeFund={onCollegeFund} />);
    const block = screen.getByLabelText('Family');
    expect(block.textContent).toMatch(/Married/); expect(block.textContent).toMatch(/Taylor · Healthcare/); expect(block.textContent).toMatch(/Emma · at school · 5 years old/);
    fireEvent.click(screen.getByText('Put aside $250'));
    expect(onCollegeFund).toHaveBeenCalledWith('c-Emma', 250);
    cleanup();
    render(<HomePanel state={base()} disabled={false} />);
    expect(screen.getByLabelText('Family').textContent).toMatch(/Single/);
  });
});
