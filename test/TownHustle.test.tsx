import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { INITIAL_GAME_STATE, CHARACTERS, SIDE_HUSTLES } from '../constants';
import { GameState } from '../types';
import { hustleCards, hustleDeskSummary, hustleMonthly, nextMilestone } from '../services/townHustle';
import { getMonthlyActionsSummary } from '../services/monthlyActions';
import HomePanel from '../components/town/HomePanel';
import { createTownHome } from '../components/town/townHome';

const base = (o: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 4, career: { path: 'TECH', title: 'Junior Developer', salary: 5500, level: 1, experience: 6, skills: {}, aiVulnerability: .4, futureProofScore: 65 }, ...o });
const delivery = SIDE_HUSTLES.find(h => h.id === 'delivery')!, dev = SIDE_HUSTLES.find(h => h.id === 'freelance_dev')!;
afterEach(cleanup);

describe('the side-hustle desk', () => {
  it('prices every hustle on the teaching estimate and explains what blocks it', () => {
    const cards = hustleCards(base());
    expect(cards.length).toBe(SIDE_HUSTLES.length);
    const food = cards.find(c => c.hustle.id === 'delivery')!; expect(food.canStart).toBe(true); expect(food.monthly).toBeGreaterThan(0); expect(food.monthly).toBe(hustleMonthly(base(), { ...delivery, upgrades: [] }));
    const web = cards.find(c => c.hustle.id === 'freelance_dev')!; expect(web.canStart).toBe(false); expect(web.reason).toMatch(/qualification/); expect(web.requirement).toMatch(/education/);
    expect(hustleCards(base({ cash: 100 })).find(c => c.hustle.startupCost > 100 && !c.hustle.requiredEducation?.length)?.reason).toMatch(/Needs \$/);
    const running = base({ activeSideHustles: [{ ...delivery, isActive: true, monthsActive: 2, upgrades: [] }] });
    const card = hustleCards(running).find(c => c.hustle.id === 'delivery')!; expect(card.active).toBeDefined(); expect(card.reason).toMatch(/Already/); expect(card.nextMilestoneIn).toBe(delivery.milestones?.length ? Math.max(0, delivery.milestones[0].monthsRequired - 2) : undefined);
    const staged = SIDE_HUSTLES.find(h => h.milestones?.length)!; expect(nextMilestone({ ...staged, monthsActive: 99, upgrades: [] })?.monthsLeft).toBe(0); expect(nextMilestone({ ...delivery, monthsActive: 99, upgrades: [] })).toBeNull();
    const summary = hustleDeskSummary(running); expect(summary.count).toBe(1); expect(summary.hours).toBe(delivery.hoursPerWeek); expect(summary.monthly).toBeGreaterThan(0); expect(summary.exposure).toBe(delivery.aiVulnerability);
    expect(hustleDeskSummary(base()).monthly).toBe(0);
  });
  it('renders the desk with start, stop, sprint and the milestone prompt', () => {
    const onStart = vi.fn(), onStop = vi.fn(), onChoose = vi.fn(), onAct = vi.fn();
    const s = base({ activeSideHustles: [{ ...delivery, isActive: true, monthsActive: 1, upgrades: [] }], pendingSideHustleUpgrade: { hustleId: 'delivery', milestoneIndex: 0 }, monthlyActionsRemaining: 3 });
    render(<HomePanel state={s} disabled={false} onStartHustle={onStart} onStopHustle={onStop} onChooseUpgrade={onChoose} workActions={getMonthlyActionsSummary(s, false)} onMonthlyAction={onAct} />);
    expect(document.body.textContent).toMatch(/Side-hustle desk/);
    fireEvent.click(screen.getByRole('button', { name: 'Stop this hustle' })); expect(onStop).toHaveBeenCalledWith('delivery');
    fireEvent.click(screen.getByRole('button', { name: /Choose the upgrade/ })); expect(onChoose).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sprint this month' })); expect(onAct).toHaveBeenCalledWith('HUSTLE_SPRINT');
    const starts = screen.getAllByRole('button', { name: /^Start/ }); fireEvent.click(starts.find(b => !(b as HTMLButtonElement).disabled)!); expect(onStart).toHaveBeenCalled();
  });
  it('shows the hustle corner at home only while a hustle runs', () => {
    const home = createTownHome(); home.root.visible = true; const corner = () => { let visible = 0; home.root.traverse(o => { if (o instanceof THREE.Mesh && o.visible && o.parent?.visible && o.parent?.parent?.visible) visible++; }); return visible; };
    const before = corner(); home.setHustles(1); expect(corner()).toBeGreaterThan(before); home.setHustles(2); const two = corner(); expect(two).toBeGreaterThan(before); home.setHustles(0); expect(corner()).toBe(before);
  });
});
