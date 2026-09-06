import { beforeEach, describe, expect, it } from 'vitest';
import { captureAccessInvite, clearPendingAccessInvite, getAccessInvite, getPendingAccessInvite } from './accessControl';

describe('getAccessInvite', () => {
  beforeEach(() => {
    clearPendingAccessInvite();
    window.history.replaceState(null, '', '/');
  });

  it('reads an access code from the URL fragment and returns a clean URL', () => {
    expect(getAccessInvite('https://tycoon.example/play?ref=friend#access=HOGUN-123')).toEqual({
      code: 'HOGUN-123',
      cleanUrl: '/play?ref=friend'
    });
  });

  it('preserves unrelated fragment parameters', () => {
    expect(getAccessInvite('https://tycoon.example/#access=HOGUN-123&mode=adult')).toEqual({
      code: 'HOGUN-123',
      cleanUrl: '/#mode=adult'
    });
  });

  it('ignores URLs without a non-empty access code', () => {
    expect(getAccessInvite('https://tycoon.example/#mode=adult')).toBeNull();
    expect(getAccessInvite('not a URL')).toBeNull();
  });

  it('captures and removes an invite before the app loads', () => {
    window.history.replaceState(null, '', '/?ref=friend#access=HOGUN-123&mode=adult');

    captureAccessInvite();

    expect(getPendingAccessInvite()).toBe('HOGUN-123');
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe('/?ref=friend#mode=adult');

    clearPendingAccessInvite();
    expect(getPendingAccessInvite()).toBeNull();
  });
});
