import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createEventStage, EVENT_STAGE, DOORSTEP_LETTER } from '../components/town/townEventStage';
import { eventPlace, type EventPlace } from '../services/townEvents';
import { isWalkable } from '../components/town/townNavigation';
import TownModal from '../components/town/TownModal';
import { createTownScene } from '../components/town/createTownScene';
import { CHARACTERS, INITIAL_GAME_STATE } from '../constants';
import { GameState, LifeEventCategory } from '../types';
import { I18nProvider } from '../i18n';
vi.mock('../components/town/createTownScene', () => ({ createTownScene: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

// Phase 1 polish: while a life event waits, the city stages it where it happens (townEventStage.ts).
const CATEGORIES: LifeEventCategory[] = ['VEHICLE', 'HOUSING', 'FAMILY_EMERGENCY', 'RELATIONSHIP', 'MEDICAL', 'TAX', 'LEGAL', 'CAREER', 'AI_DISRUPTION', 'ECONOMIC', 'BUSINESS', 'WINDFALL', 'CRIME', 'SOCIAL'];
const letterOf = (root: THREE.Object3D) => root.getObjectByName('event-letter')!;

describe('the event stage', () => {
  it('has a spot for every place an event can happen, with its ring on walkable pavement', () => {
    const places = new Set(CATEGORIES.map(c => eventPlace(c).place));
    for (const place of places) {
      const spot = EVENT_STAGE[place];
      expect(spot, place).toBeDefined();
      expect(isWalkable({ x: spot.ring[0], z: spot.ring[1] }) || place === 'garage', place).toBe(true);
    }
  });

  it('lays a letter on the doorstep for tax and legal mail, and clears it when the event is answered', () => {
    const stage = createEventStage(false);
    stage.set(eventPlace('TAX').place);
    expect(stage.root.visible).toBe(true);
    expect(letterOf(stage.root).visible).toBe(true);
    expect(letterOf(stage.root).position.toArray()).toEqual(DOORSTEP_LETTER);
    stage.set(eventPlace('CAREER').place);
    expect(letterOf(stage.root).visible).toBe(false);
    stage.set(null);
    expect(stage.root.visible).toBe(false);
  });

  it('blinks the parked car’s hazard lights for car trouble, and puts them back afterwards', () => {
    const lamp = new THREE.MeshStandardMaterial({ name: 'lamp' });
    const stage = createEventStage(false);
    stage.set('garage', [lamp]);
    stage.update(.1);
    expect(lamp.emissiveIntensity).toBeGreaterThan(1);
    stage.update(.6);
    expect(lamp.emissiveIntensity).toBe(0);
    stage.update(1.1);
    expect(lamp.emissiveIntensity).toBeGreaterThan(1);
    stage.set(null);
    // Back to what it was (three's default: black emissive at intensity 1, no glow).
    expect(lamp.emissiveIntensity).toBe(1);
    expect(lamp.emissive.getHexString()).toBe('000000');
    // A lamp that glowed before (a tail light at night) gets its own glow back.
    const tail = new THREE.MeshStandardMaterial({ name: 'tail', emissive: '#ff2200', emissiveIntensity: .6 });
    stage.set('garage', [tail]); stage.update(.1); stage.set(null);
    expect(tail.emissiveIntensity).toBe(.6);
    expect(tail.emissive.getHexString()).toBe('ff2200');
  });

  it('holds still under reduced motion: no bob, no pulse, steady hazards', () => {
    const lamp = new THREE.MeshStandardMaterial({ name: 'lamp' });
    const stage = createEventStage(true);
    stage.set('garage', [lamp]);
    const badge = stage.root.children.find(c => c instanceof THREE.Sprite)!;
    stage.update(.3); const y = badge.position.y;
    stage.update(.9);
    expect(badge.position.y).toBe(y);
    expect(lamp.emissiveIntensity).toBeGreaterThan(1);
  });
});

describe('the city stages the waiting event', () => {
  it('tells the scene where the event is, and clears it once answered', () => {
    const calls: Record<string, ReturnType<typeof vi.fn>> = {};
    const controller = new Proxy({}, { get: (_, key: string) => calls[key] ?? (calls[key] = vi.fn()) });
    vi.mocked(createTownScene).mockImplementation((...args: any[]) => { args[5]?.(); return controller as any; });
    const state = (pending?: GameState['pendingScenario']): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 10000, pendingScenario: pending });
    const breakdown = { id: 'car-trouble', title: 'Car trouble', description: 'The car will not start.', category: 'VEHICLE' as const, options: [{ label: 'Tow it', outcome: { cashChange: -150, message: 'Towed.' } }] };
    const props = { disabled: false, reduceMotion: true, onBuy: vi.fn(), onClose: vi.fn(), onOpenMoney: vi.fn(), onNextMonth: vi.fn(), onBackup: vi.fn() };
    const { rerender } = render(<I18nProvider><TownModal state={state(breakdown)} {...props} /></I18nProvider>);
    expect(calls.stageEvent).toHaveBeenLastCalledWith('garage' satisfies EventPlace);
    rerender(<I18nProvider><TownModal state={state(undefined)} {...props} /></I18nProvider>);
    expect(calls.stageEvent).toHaveBeenLastCalledWith(null);
  });
});
