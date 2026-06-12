import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAutoplay, useAutoplayScheduler, AUTOPLAY_SPEED_OPTIONS } from '../hooks/useAutoplay';
import { I18nProvider } from '../i18n';
import { INITIAL_GAME_STATE } from '../constants';
import { GameState, AnnualReport } from '../types';
import { SaveSlotId } from '../services/storageService';

const PREF_KEY = (slot: string) => `tycoon_autoplay_pref_v1_${slot}`;

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nProvider>{children}</I18nProvider>
);

const baseGameState = INITIAL_GAME_STATE as GameState;

describe('useAutoplayScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pauses while blocked and resumes after unblocking', () => {
    const onAdvance = vi.fn();
    const { rerender } = renderHook(
      (props: { blocked: boolean }) =>
        useAutoplayScheduler({ speed: 100, blocked: props.blocked, month: 1, onAdvance }),
      { initialProps: { blocked: true } }
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onAdvance).not.toHaveBeenCalled();

    rerender({ blocked: false });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('does not schedule when speed is null and re-arms when the month ticks', () => {
    const onAdvance = vi.fn();
    const { rerender } = renderHook(
      (props: { speed: number | null; month: number }) =>
        useAutoplayScheduler({ speed: props.speed, blocked: false, month: props.month, onAdvance }),
      { initialProps: { speed: null as number | null, month: 1 } }
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onAdvance).not.toHaveBeenCalled();

    rerender({ speed: 100, month: 1 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);

    // The month tick re-arms the timer for the next advance.
    rerender({ speed: 100, month: 2 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onAdvance).toHaveBeenCalledTimes(2);
  });
});

describe('useAutoplay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderAutoplay = (overrides?: {
    initialSaveSlot?: SaveSlotId;
    currentSaveSlot?: SaveSlotId;
    gameState?: GameState;
  }) =>
    renderHook(
      (props: { initialSaveSlot: SaveSlotId; currentSaveSlot: SaveSlotId; gameState: GameState }) =>
        useAutoplay(props),
      {
        wrapper,
        initialProps: {
          initialSaveSlot: overrides?.initialSaveSlot ?? 'autosave',
          currentSaveSlot: overrides?.currentSaveSlot ?? 'autosave',
          gameState: overrides?.gameState ?? baseGameState
        }
      }
    );

  it('initializes from the per-slot preference and falls back to null', () => {
    localStorage.setItem(PREF_KEY('autosave'), '500');
    const { result } = renderAutoplay();
    expect(result.current.autoPlaySpeed).toBe(500);
    expect(result.current.autoplayEnabled).toBe(true);
    expect(result.current.autoplaySpeedLabel).toBe('2x');

    localStorage.clear();
    const { result: fresh } = renderAutoplay();
    expect(fresh.current.autoPlaySpeed).toBeNull();
    expect(fresh.current.autoplayEnabled).toBe(false);
  });

  it('treats "off" and junk values as disabled, clamps unknown speeds to 1x', () => {
    localStorage.setItem(PREF_KEY('autosave'), 'off');
    expect(renderAutoplay().result.current.autoPlaySpeed).toBeNull();

    localStorage.setItem(PREF_KEY('autosave'), 'not-a-number');
    expect(renderAutoplay().result.current.autoPlaySpeed).toBeNull();

    localStorage.setItem(PREF_KEY('autosave'), '123');
    expect(renderAutoplay().result.current.autoPlaySpeed).toBe(AUTOPLAY_SPEED_OPTIONS[0]);
  });

  it('persists speed changes to the current slot ("off" when disabled)', () => {
    const { result } = renderAutoplay();
    act(() => {
      result.current.setAutoPlaySpeed(250);
    });
    expect(localStorage.getItem(PREF_KEY('autosave'))).toBe('250');

    act(() => {
      result.current.setAutoPlaySpeed(null);
    });
    expect(localStorage.getItem(PREF_KEY('autosave'))).toBe('off');
  });

  it('toggleAutoplay flips between null and the default speed', () => {
    const { result } = renderAutoplay();
    expect(result.current.autoPlaySpeed).toBeNull();

    act(() => {
      result.current.toggleAutoplay();
    });
    expect(result.current.autoPlaySpeed).toBe(AUTOPLAY_SPEED_OPTIONS[0]);

    act(() => {
      result.current.toggleAutoplay();
    });
    expect(result.current.autoPlaySpeed).toBeNull();
  });

  it('carries the current speed over when the save slot changes', () => {
    localStorage.setItem(PREF_KEY('autosave'), '500');
    const { result, rerender } = renderAutoplay();
    expect(result.current.autoPlaySpeed).toBe(500);

    rerender({ initialSaveSlot: 'autosave', currentSaveSlot: 'slot1', gameState: baseGameState });
    // Persist runs before reload on slot switch: the current speed is written
    // into the new slot's key first, then read back — speed carries over.
    expect(localStorage.getItem(PREF_KEY('slot1'))).toBe('500');
    expect(result.current.autoPlaySpeed).toBe(500);
  });

  it('carry-over overwrites the target slot\'s previously stored preference', () => {
    localStorage.setItem(PREF_KEY('autosave'), '500');
    localStorage.setItem(PREF_KEY('slot1'), 'off');
    const { result, rerender } = renderAutoplay();
    expect(result.current.autoPlaySpeed).toBe(500);

    rerender({ initialSaveSlot: 'autosave', currentSaveSlot: 'slot1', gameState: baseGameState });
    // The harsher half of carry-over: the target slot's stored pref is
    // clobbered by the current speed, not honored.
    expect(localStorage.getItem(PREF_KEY('slot1'))).toBe('500');
    expect(result.current.autoPlaySpeed).toBe(500);
  });

  it('resolves the i18n tooltip for both states', () => {
    const { result } = renderAutoplay();
    expect(result.current.autoplayTooltip).toContain('OFF');
    expect(result.current.autoplayTooltip).not.toContain('autoplay.tooltip');

    act(() => {
      result.current.toggleAutoplay();
    });
    expect(result.current.autoplayTooltip).toContain('1x');
    expect(result.current.autoplayTooltip).not.toContain('{speed}');
    expect(result.current.autoplayTooltip).not.toContain('autoplay.tooltip');
  });

  it('pauses (sets speed null) when a year-in-review report lands in a normal game', () => {
    const { result, rerender } = renderAutoplay();
    act(() => {
      result.current.setAutoPlaySpeed(1000);
    });
    expect(result.current.autoPlaySpeed).toBe(1000);

    const report: AnnualReport = {
      year: 1,
      startNetWorth: 0,
      endNetWorth: 1000,
      marketGains: 100,
      passiveIncome: 50,
      hindsights: []
    };
    rerender({
      initialSaveSlot: 'autosave',
      currentSaveSlot: 'autosave',
      gameState: { ...baseGameState, annualReport: report }
    });
    expect(result.current.autoPlaySpeed).toBeNull();
  });

  it('does NOT pause for annual reports during daily challenge runs', () => {
    const challengeState: GameState = {
      ...baseGameState,
      challenge: { id: '2026-06-11', seed: 123, targetMonths: 120 }
    } as GameState;
    const { result, rerender } = renderAutoplay({ gameState: challengeState });
    act(() => {
      result.current.setAutoPlaySpeed(1000);
    });

    const report: AnnualReport = {
      year: 1,
      startNetWorth: 0,
      endNetWorth: 1000,
      marketGains: 100,
      passiveIncome: 50,
      hindsights: []
    };
    rerender({
      initialSaveSlot: 'autosave',
      currentSaveSlot: 'autosave',
      gameState: { ...challengeState, annualReport: report }
    });
    expect(result.current.autoPlaySpeed).toBe(1000);
  });
});
