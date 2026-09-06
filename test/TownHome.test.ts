import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState } from '../types';
import { clampHomePoint, homeSpot, tierIndex, TIERS } from '../components/town/townHome';
import HomePanel from '../components/town/HomePanel';
import AdvisorPanel from '../components/town/AdvisorPanel';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 3 });
afterEach(cleanup);

describe('your place', () => {
  it('keeps the flat walkable and recognises the desk and exit', () => {
    expect(clampHomePoint({ x: 9, z: -3 })).toEqual({ x: 2.6, z: .4 });
    expect(homeSpot({ x: .2, z: .9 })).toBe('desk'); expect(homeSpot({ x: 0, z: 6.2 })).toBe('exit'); expect(homeSpot({ x: 2, z: 3 })).toBeNull();
    expect(TIERS.map(tierIndex)).toEqual([0, 1, 2, 3, 4]);
  });
  it('furnishes by lifestyle tier when a WebGL-free scene is built', async () => {
    const { createTownHome } = await import('../components/town/townHome');
    const home = createTownHome();
    const visibleMeshes = () => { let n = 0; home.root.traverse(o => { if (o instanceof THREE.Mesh && o.visible && (!o.parent || o.parent.visible)) n++; }); return n; };
    home.setLifestyle('FRUGAL'); const frugal = visibleMeshes();
    home.setLifestyle('LUXURIOUS'); const luxe = visibleMeshes();
    expect(luxe).toBeGreaterThan(frugal);
  });
  it('wraps the apartment door in a townhouse whose windows glow and whose walls block the camera', async () => {
    const { createHomeFacade } = await import('../components/town/townHome');
    const facade = createHomeFacade({ x: -14.4, z: 5.2 });
    let meshes = 0; facade.root.traverse(o => { if (o instanceof THREE.Mesh) meshes++; });
    expect(meshes).toBeGreaterThan(20);
    expect(facade.bounds.containsPoint(new THREE.Vector3(-16.5, 3, 5.2))).toBe(true);   // inside the body
    expect(facade.bounds.containsPoint(new THREE.Vector3(-14.4, 1, 5.2))).toBe(false);  // the doorstep stays walkable
    facade.glass.emissiveIntensity = .9; expect(facade.glass.emissive.getHexString()).toBe('ffc985');
  });
  it('shows the bills, mail, a move chooser that asks the app to confirm, and Rosa\'s note', () => {
    const onChangeLifestyle = vi.fn(), onGo = vi.fn();
    const s = { ...base(), events: [{ id: 'e1', month: 3, title: 'Coffee cart licensed', description: 'Paid the permit.', type: 'DECISION' as const }] };
    render(React.createElement(HomePanel, { state: s, disabled: false, onChangeLifestyle, onGo }));
    expect(screen.getByText(/YOUR PLACE · MODEST/)).toBeInTheDocument();
    expect(screen.getByText('Coffee cart licensed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /\$4,000/ })); expect(onChangeLifestyle).toHaveBeenCalledWith('COMFORTABLE');
    expect(document.body.textContent).toMatch(/Rosa left a note/);
  });
  it('lets Rosa point the player somewhere', () => {
    const onGo = vi.fn();
    render(React.createElement(AdvisorPanel, { state: { ...base(), cash: 500 }, onGo }));
    expect(document.body.textContent).toMatch(/thinner than one month/);
    fireEvent.click(screen.getAllByRole('button', { name: /Show me/ })[0]); expect(onGo).toHaveBeenCalledWith('bank');
  });
});
