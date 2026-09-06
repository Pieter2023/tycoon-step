import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { INITIAL_GAME_STATE, CHARACTERS, CAREER_PATHS } from '../constants';
import { GameState } from '../types';
import { payStub, promotionOutlook, jobSecurity, managerLine, workBoard } from '../services/townWork';
import { clampWorkPoint, workSpot, createTownWork } from '../components/town/townWork';
import WorkPanel from '../components/town/WorkPanel';
import { adviseFrom } from '../services/townAdvisor';

const career = (overrides: Partial<NonNullable<GameState['career']>> = {}): NonNullable<GameState['career']> => ({ path: 'TECH', title: 'Junior Developer', salary: 5500, level: 1, experience: 10, skills: {}, aiVulnerability: .4, futureProofScore: 65, ...overrides });
const base = (overrides: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 11, career: career(), ...overrides });
afterEach(cleanup);

describe('Main Street Offices', () => {
  it('reconciles the pay stub to the salary the turn pays and takes tax off it', () => {
    const stub = payStub(base());
    expect(stub.lines.reduce((s, l) => s + l.amount, 0)).toBe(stub.gross);
    expect(stub.gross).toBeGreaterThan(0); expect(stub.tax).toBeGreaterThan(0); expect(stub.net).toBe(stub.gross - stub.tax);
    const laidOff = payStub(base({ jobLossMonthsRemaining: 2 }));
    expect(laidOff.gross).toBe(0); expect(laidOff.unemployed).toBe(true); expect(laidOff.lines.some(l => /Between jobs/.test(l.label))).toBe(true);
    expect(laidOff.lines.reduce((s, l) => s + l.amount, 0)).toBe(0);
    const recession = payStub(base({ economy: { ...INITIAL_GAME_STATE.economy, recession: true } }));
    expect(recession.lines.some(l => /Recession/.test(l.label) && l.amount < 0)).toBe(true);
  });
  it('explains the next title, what blocks it and the odds once eligible', () => {
    const early = promotionOutlook(base());
    expect(early.next?.title).toBe('Developer'); expect(early.monthsShort).toBe(14); expect(early.eligible).toBe(false); expect(early.chance).toBe(0);
    expect(early.blockers[0]).toMatch(/14 more months/);
    const ready = promotionOutlook(base({ career: career({ experience: 30 }) }));
    expect(ready.eligible).toBe(true); expect(ready.chance).toBeGreaterThan(0); expect(ready.expectedMonths).toBeGreaterThanOrEqual(1);
    const downturn = promotionOutlook(base({ career: career({ experience: 30 }), economy: { ...INITIAL_GAME_STATE.economy, recession: true } }));
    expect(downturn.chance).toBeCloseTo(ready.chance / 2, 5); expect(downturn.blockers).toContain('Recession: promotions are half as likely');
    const staff = promotionOutlook(base({ career: career({ level: 3, title: 'Senior Developer', salary: 10000, experience: 90 }) }));
    expect(staff.next?.title).toBe('Staff Engineer'); expect(staff.educationMet).toBe(false); expect(staff.blockers.some(b => /bachelor in stem/.test(b))).toBe(true); expect(staff.eligible).toBe(false);
    const top = promotionOutlook(base({ career: career({ level: CAREER_PATHS.TECH.levels.length, experience: 400 }) }));
    expect(top.top).toBe(true); expect(managerLine(base({ career: career({ level: CAREER_PATHS.TECH.levels.length }) }))).toMatch(/run this place/);
    expect(managerLine(base({ career: career({ experience: 30 }) }))).toMatch(/ready for Developer/);
    expect(managerLine(base())).toMatch(/14 more months/);
  });
  it('has Rosa nudge the player to ask once a promotion is within reach', () => {
    expect(adviseFrom(base()).some(a => a.id === 'promotion')).toBe(false);
    const nudge = adviseFrom(base({ career: career({ experience: 30 }) })).find(a => a.id === 'promotion');
    expect(nudge?.place).toBe('work'); expect(nudge?.title).toMatch(/qualify for Developer/);
  });
  it('rates job security from the career path and lists what shields the player', () => {
    expect(jobSecurity(base()).label).toBe('Exposed');
    expect(jobSecurity(base({ career: career({ path: 'HEALTHCARE' }) })).score).toBe(CAREER_PATHS.HEALTHCARE.futureProofScore);
    expect(jobSecurity(base()).shields[0]).toMatch(/No passive income yet/);
  });
  it('builds the payroll and ladder boards and an office you can walk in', () => {
    const board = workBoard(base());
    expect(board.title).toBe('PAYROLL · JUNIOR DEVELOPER'); expect(board.ladder[0].state).toBe('current'); expect(board.ladder[1].state).toBe('next'); expect(board.ladder[2].state).toBe('later');
    expect(board.lines.at(-1)?.label).toMatch(/Income tax/);
    expect(clampWorkPoint({ x: 9, z: -3 })).toEqual({ x: 2.5, z: .4 }); expect(workSpot({ x: .2, z: .9 })).toBe('manager'); expect(workSpot({ x: 0, z: 6.2 })).toBe('exit'); expect(workSpot({ x: 2, z: 3 })).toBeNull();
    const room = createTownWork(); expect(room.root.visible).toBe(false); let meshes = 0; room.root.traverse(o => { if (o instanceof THREE.Mesh) meshes++; }); expect(meshes).toBeGreaterThan(25);
    expect(() => room.setBoard(board)).not.toThrow();
  });
  it('renders the manager panel with a stub, a gated promotion button and study links', () => {
    const onPromote = vi.fn(), onOpenLife = vi.fn();
    const { rerender } = render(<WorkPanel state={base()} disabled={false} onPromote={onPromote} onOpenLife={onOpenLife} />);
    expect(screen.getByText(/Pay stub · Junior Developer/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask about a promotion' })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: /Study options/ })[0]); expect(onOpenLife).toHaveBeenCalledWith('education');
    rerender(<WorkPanel state={base({ career: career({ experience: 30 }) })} disabled={false} onPromote={onPromote} onOpenLife={onOpenLife} />);
    const ask = screen.getByRole('button', { name: 'Ask about a promotion' }); expect(ask).toBeEnabled(); fireEvent.click(ask); expect(onPromote).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toMatch(/How safe is this job\?/);
  });
});
