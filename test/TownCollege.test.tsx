import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS, EDUCATION_OPTIONS } from '../constants';
import { GameState } from '../types';
import { courseCard, studyPlan, enrolment, registrarLine, certificates, collegeBoard, loanPayment, EXPENSIVE_COURSE } from '../services/townCollege';
import { clampCollegePoint, collegeSpot, createTownCollege, createCollegeFacade } from '../components/town/townCollege';
import { clampTownPoint } from '../components/town/townWorld';
import CollegePanel from '../components/town/CollegePanel';
import { guideNextHop } from '../components/town/townGuide';
import { adviseFrom } from '../services/townAdvisor';
import { resolveTownAction } from '../services/townProgress';

const career = (overrides: Partial<NonNullable<GameState['career']>> = {}): NonNullable<GameState['career']> => ({ path: 'TECH', title: 'Junior Developer', salary: 5500, level: 1, experience: 10, skills: {}, aiVulnerability: .4, futureProofScore: 65, ...overrides });
const base = (overrides: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 20000, month: 11, career: career(), education: { level: 'HIGH_SCHOOL', degrees: [] }, ...overrides });
const edu = (id: string) => EDUCATION_OPTIONS.find(e => e.id === id)!;
afterEach(cleanup);

describe('the college prices courses by payback', () => {
  it('adds a raise only for courses on the career path and counts study time in the payback', () => {
    const s = base();
    const bootcamp = courseCard(s, edu('coding_bootcamp'));
    expect(bootcamp.relevant).toBe(true); expect(bootcamp.gainMonthly).toBeGreaterThan(0);
    expect(bootcamp.salaryAfter).toBe(Math.round(bootcamp.salaryNow * 1.15));
    expect(bootcamp.paybackMonths).toBe(bootcamp.months + Math.ceil(bootcamp.totalCost / bootcamp.gainMonthly));
    expect(bootcamp.deposit).toBe(bootcamp.cost); expect(bootcamp.loan).toBe(0); expect(bootcamp.status).toBe('open');
    const betweenJobs = courseCard(base({ jobLossMonthsRemaining: 3 }), edu('coding_bootcamp'));
    expect(betweenJobs.salaryNow).toBeGreaterThan(0); expect(betweenJobs.gainMonthly).toBeGreaterThan(0); expect(betweenJobs.capped).toBe(false);
    const nursing = courseCard(s, edu('bsn'));
    expect(nursing.relevant).toBe(false); expect(nursing.gainMonthly).toBe(0); expect(nursing.paybackMonths).toBeNull();
  });
  it('uses the enrolment handler\'s deposit and student-loan rules for expensive degrees', () => {
    const degree = courseCard(base(), edu('bs_cs'));
    expect(degree.cost).toBeGreaterThan(EXPENSIVE_COURSE);
    expect(degree.deposit).toBe(Math.round(degree.cost * .1)); expect(degree.loan).toBe(degree.cost - degree.deposit);
    expect(degree.loanPayment).toBe(loanPayment(degree.loan, .065, degree.months));
    expect(degree.totalCost).toBe(degree.deposit + degree.loanPayment * degree.months);
    expect(degree.totalCost).toBeGreaterThan(degree.cost);
  });
  it('reports why a course cannot be started today', () => {
    expect(courseCard(base({ cash: 100 }), edu('coding_bootcamp')).status).toBe('short');
    expect(courseCard(base({ cash: 100 }), edu('coding_bootcamp')).reason).toMatch(/\$15,000/);
    const masters = courseCard(base(), edu('ms_cs'));
    expect(masters.status).toBe('locked'); expect(masters.reason).toMatch(/Bachelor/);
    const withDegree = base({ education: { level: 'BACHELOR', degrees: ['bs_cs'] } });
    expect(courseCard(withDegree, edu('ms_cs')).status).toBe('open');
    expect(courseCard(withDegree, edu('bs_cs')).status).toBe('done');
    const busy = base({ education: { level: 'HIGH_SCHOOL', degrees: [], currentlyEnrolled: { educationId: 'coding_bootcamp', monthsRemaining: 4, monthlyPayment: 0 } } });
    expect(courseCard(busy, edu('coding_bootcamp')).status).toBe('enrolled');
    expect(courseCard(busy, edu('data_science_cert')).status).toBe('busy');
  });
  it('orders the plan quickest payback first and names the best step the registrar can offer', () => {
    const plan = studyPlan(base());
    expect(plan.relevant.every(c => c.relevant)).toBe(true); expect(plan.other.every(c => !c.relevant)).toBe(true);
    const paybacks = plan.relevant.map(c => c.paybackMonths ?? 1e9);
    expect([...paybacks].sort((a, b) => a - b)).toEqual(paybacks);
    expect(plan.best?.status).toBe('open'); expect(plan.best?.id).toBe(plan.relevant.find(c => c.status === 'open')?.id);
    expect(registrarLine(base())).toMatch(new RegExp(`${plan.best!.name}.*${plan.best!.paybackMonths} months`));
    expect(registrarLine(base({ cash: 10 }))).toMatch(/^Save \$/);
    const enrolled = base({ education: { level: 'HIGH_SCHOOL', degrees: [], currentlyEnrolled: { educationId: 'coding_bootcamp', monthsRemaining: 4, monthlyPayment: 0 } }, liabilities: [{ id: 'l', name: 'Coding Bootcamp Student Loan', balance: 9000, originalBalance: 12000, interestRate: .065, monthlyPayment: 300, type: 'STUDENT_LOAN' } as GameState['liabilities'][number]] });
    expect(registrarLine(enrolled)).toMatch(/4 months to go on Coding Bootcamp/);
    const now = enrolment(enrolled)!; expect(now.monthsDone).toBe(2); expect(now.loanBalance).toBe(9000); expect(now.loanPayment).toBe(300);
  });
  it('reads the four self-study certificates and draws the whiteboard from the same numbers', () => {
    const s = base({ eqCourse: { failedAttempts: 0, bestScore: 15, certified: true } as GameState['eqCourse'], compoundInterestCourse: { failedAttempts: 1, bestScore: 6, certified: false } as GameState['compoundInterestCourse'] });
    const certs = certificates(s);
    expect(certs).toHaveLength(4); expect(certs.find(c => c.id === 'eq')?.certified).toBe(true); expect(certs.find(c => c.id === 'compound')?.bestScore).toBe(6);
    const board = collegeBoard(s);
    expect(board.title).toMatch(/STUDY PLAN · /); expect(board.rows.length).toBeGreaterThan(0); expect(board.rows[0].payback).toMatch(/\d+ mo/); expect(board.certified).toBe(1);
    expect(board.headline).toBe(registrarLine(s));
  });
});

describe('the college building', () => {
  it('stands on the south lawn facing the square, off the walkable ground, between the fountain and the east tree', () => {
    const facade = createCollegeFacade({ x: 4.4, z: 10.4 });
    expect(facade.bounds.min.z).toBeGreaterThan(clampTownPoint({ x: 0, z: 99 }).z);
    expect(facade.bounds.min.x).toBeGreaterThan(1.85); expect(facade.bounds.max.x).toBeLessThan(9 - 1.19);
    expect(facade.bounds.min.x).toBeLessThan(4.4); expect(facade.bounds.max.x).toBeGreaterThan(4.4);
    expect(facade.root.children.length).toBeGreaterThan(5);
  });
  it('keeps the same walkable footprint and spots as the other interiors and starts hidden', () => {
    expect(clampCollegePoint({ x: 9, z: -3 })).toEqual({ x: 2.5, z: .4 });
    expect(collegeSpot({ x: 0, z: .8 })).toBe('registrar'); expect(collegeSpot({ x: 0, z: 6.1 })).toBe('exit'); expect(collegeSpot({ x: 2, z: 3 })).toBeNull();
    const room = createTownCollege();
    expect(room.root.visible).toBe(false);
    expect(() => room.setBoard(collegeBoard(base()))).not.toThrow();
  });
  it('guides through the door to the registrar, records the first visit, and Rosa points here', () => {
    expect(guideNextHop('registrar', { room: 'city', near: null, spot: 'college' })).toBe('enterCollege');
    expect(guideNextHop('registrar', { room: 'city', near: null, spot: null })).toBeNull();
    expect(guideNextHop('registrar', { room: 'college', near: null, spot: null })).toBe('walkToRegistrar');
    expect(guideNextHop('registrar', { room: 'college', near: null, spot: 'registrar' })).toBe('arrived');
    const visited = resolveTownAction(base(), 'visit-college');
    expect(visited.townProgress?.collegeVisitedMonth).toBe(11); expect(resolveTownAction(visited, 'visit-college')).toBe(visited);
    const needsDegree = base({ career: career({ path: 'FINANCE', title: 'Director', level: 4, experience: 500, salary: 12000 }) });   // VP of Finance needs an MBA
    const advice = adviseFrom(needsDegree);
    expect(advice.some(a => a.place === 'college')).toBe(true);
  });
});

describe('the registrar panel', () => {
  it('enrols through the handler, explains irrelevant courses, and shows the course in progress', () => {
    const onEnroll = vi.fn(), onOpenLife = vi.fn();
    render(<CollegePanel state={base()} disabled={false} onEnroll={onEnroll} onOpenLife={onOpenLife} />);
    const bootcamp = screen.getByLabelText('Coding Bootcamp');
    expect(bootcamp.textContent).toMatch(/pays for itself in about/);
    fireEvent.click(bootcamp.querySelector('button.town-primary')!);
    expect(onEnroll).toHaveBeenCalledWith(edu('coding_bootcamp'));
    fireEvent.click(screen.getByText('All courses (24)'));
    expect(screen.getByLabelText('BSN Nursing').textContent).toMatch(/Not on your career path/);
    fireEvent.click(screen.getByText('Open the courses →'));
    expect(onOpenLife).toHaveBeenCalledWith('self_learn');
    cleanup();
    render(<CollegePanel state={base({ education: { level: 'HIGH_SCHOOL', degrees: [], currentlyEnrolled: { educationId: 'coding_bootcamp', monthsRemaining: 4, monthlyPayment: 0 } } })} disabled={false} onEnroll={onEnroll} />);
    expect(screen.getByLabelText('Your course').textContent).toMatch(/4 months to go · 2 of 6 done/);
    expect(screen.getByLabelText('Data Science Certificate').querySelector('button.town-primary')).toBeDisabled();
  });
});
