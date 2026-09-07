import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { INITIAL_KIDS_STATE, type KidsGameState } from '../kidsTypes';
import { KIDS_CHARACTERS, KIDS_SIDE_HUSTLES, KIDS_COLLECTIBLES, KIDS_SAVINGS_GOALS, KIDS_DIFFICULTIES } from '../kidsConstants';
import { I18nProvider } from '../i18n';
import { weeklyAllowance, energyHearts, hustleCards, weeklyHustleEnergy, toyCards, collectionValue, valueArrow, goalCards, goalProgress, STOP_PLACE, PLACE_STOP } from '../services/kidsSquare';
import KidsSquareModal from '../components/town/KidsSquareModal';
import { createTownScene } from '../components/town/createTownScene';
vi.mock('../components/town/createTownScene', () => ({ createTownScene: vi.fn() }));

const kid = (o: Partial<KidsGameState> = {}): KidsGameState => ({ ...structuredClone(INITIAL_KIDS_STATE), character: KIDS_CHARACTERS[0], difficulty: Object.keys(KIDS_DIFFICULTIES)[1], careerPath: KIDS_CHARACTERS[0].careerPath, cash: 20, energy: 4, week: 3, ...o });
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe('Money Quest square', () => {
  it('maps four kid-sized stops onto the square and prices everything in the kids rules', () => {
    expect(Object.values(STOP_PLACE).sort()).toEqual(['bank', 'business', 'exchange', 'property']); expect(PLACE_STOP.bank).toBe('piggy');
    const s = kid(); expect(weeklyAllowance(s)).toBeGreaterThan(0); expect(energyHearts(s)).toBe('⚡⚡⚡⚡·');
    const jobs = hustleCards(s); expect(jobs.length).toBe(KIDS_SIDE_HUSTLES.length);
    const dog = jobs.find(j => j.id === 'dogwalk')!; expect(dog.canStart).toBe(true); expect(dog.cost).toBe(0);
    const bake = jobs.find(j => j.id === 'cookies')!; expect(bake.canStart).toBe(true);
    expect(hustleCards(kid({ cash: 2 })).find(j => j.id === 'cookies')?.reason).toMatch(/Save up \$8/);
    expect(hustleCards(kid({ activeHustles: ['dogwalk'] })).find(j => j.id === 'dogwalk')?.active).toBe(true);
    expect(weeklyHustleEnergy(kid({ activeHustles: ['dogwalk', 'carwash'] }))).toBe(5);
    const toys = toyCards(kid({ cash: 10 })); expect(toys.find(t => t.item.id === 'comics')?.canBuy).toBe(true); expect(toys.find(t => t.item.id === 'lego')?.reason).toMatch(/Save up \$15/);
    const owned = kid({ collectibles: [{ id: 'c1', name: 'Comic Book', emoji: '📚', purchasePrice: 5, currentValue: 7, purchaseWeek: 1 }, { id: 'c2', name: 'Cards', emoji: '🃏', purchasePrice: 8, currentValue: 6, purchaseWeek: 2 }] });
    expect(collectionValue(owned)).toBe(13); expect(valueArrow(owned.collectibles[0])).toBe('📈'); expect(valueArrow(owned.collectibles[1])).toBe('📉');
    const goals = goalCards(kid({ cash: 60 })); expect(goals.find(g => g.goal.id === 'art')?.weeksAway).toBe(0); expect(goals.find(g => g.goal.id === 'bike')?.weeksAway).toBeGreaterThan(0);
    expect(goalProgress(kid({ cash: 75, savingsGoal: { id: 'bike', name: 'New Bike', emoji: '🚲', targetAmount: 150, savedAmount: 75, completed: false } }))).toBe(50);
  });
  it('opens each stop in the no-WebGL fallback and wires the kids handlers', () => {
    vi.mocked(createTownScene).mockImplementation(() => { throw new Error('No WebGL'); });
    const onStartHustle = vi.fn(), onBuy = vi.fn(), onSetGoal = vi.fn(), onNextWeek = vi.fn();
    render(<I18nProvider><KidsSquareModal state={kid({ cash: 30 })} processing={false} onClose={vi.fn()} onStartHustle={onStartHustle} onBuy={onBuy} onSetGoal={onSetGoal} onNextWeek={onNextWeek} /></I18nProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Lemonade stand/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /^Start/ })[0]); expect(onStartHustle).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Toy shop/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /^Buy · \$5$/ })[0]); expect(onBuy).toHaveBeenCalledWith(KIDS_COLLECTIBLES.find(i => i.price === 5));
    fireEvent.click(screen.getByRole('button', { name: /Goal jar/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Save for this' })[0]); expect(onSetGoal).toHaveBeenCalledWith(KIDS_SAVINGS_GOALS[0]);
    fireEvent.click(screen.getByRole('button', { name: /Piggy bank/ }));
    expect(document.body.textContent).toMatch(/Allowance next week/);
    fireEvent.click(screen.getAllByRole('button', { name: /Next week/ })[0]); expect(onNextWeek).toHaveBeenCalled();
  });
});
