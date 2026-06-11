import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  adoptSyncCode,
  fetchCloudSave,
  getSyncCode,
  isCloudSyncEnabled,
  isValidSyncCode,
  setCloudSyncEnabled,
  uploadCloudSave
} from './cloudSave';
import { GameState } from '../types';

const VALID_CODE = '12345678-abcd-4ef0-8123-456789abcdef';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('sync code lifecycle', () => {
  it('generates a valid code once and persists it', () => {
    const code = getSyncCode();
    expect(isValidSyncCode(code)).toBe(true);
    expect(getSyncCode()).toBe(code);
  });

  it('adopts a restored code (normalized) and rejects junk', () => {
    adoptSyncCode(`  ${VALID_CODE.toUpperCase()}  `);
    expect(getSyncCode()).toBe(VALID_CODE);
    adoptSyncCode('drop table cloud_saves');
    expect(getSyncCode()).toBe(VALID_CODE);
  });

  it('validates code format', () => {
    expect(isValidSyncCode(VALID_CODE)).toBe(true);
    expect(isValidSyncCode('not-a-code')).toBe(false);
    expect(isValidSyncCode('')).toBe(false);
  });
});

describe('cloud sync preference', () => {
  it('defaults off and toggles', () => {
    expect(isCloudSyncEnabled()).toBe(false);
    setCloudSyncEnabled(true);
    expect(isCloudSyncEnabled()).toBe(true);
    setCloudSyncEnabled(false);
    expect(isCloudSyncEnabled()).toBe(false);
  });
});

describe('uploadCloudSave', () => {
  it('posts the state with this device\'s code and returns the timestamp', async () => {
    adoptSyncCode(VALID_CODE);
    const fn = vi.fn().mockResolvedValue({ ok: true, json: async () => '2026-06-11T18:00:00Z' });
    vi.stubGlobal('fetch', fn);
    const stamp = await uploadCloudSave({ month: 42 } as unknown as GameState, { name: 'Alex', month: 42 });
    expect(stamp).toBe('2026-06-11T18:00:00Z');
    const body = JSON.parse(fn.mock.calls[0][1].body);
    expect(body.code).toBe(VALID_CODE);
    expect(body.save.month).toBe(42);
    expect(body.save_summary.name).toBe('Alex');
  });

  it('returns null on API failure or network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    expect(await uploadCloudSave({} as GameState)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await uploadCloudSave({} as GameState)).toBeNull();
  });
});

describe('fetchCloudSave', () => {
  it('returns the save behind a code', async () => {
    const cloud = { state: { month: 42 }, summary: { name: 'Alex' }, updated_at: '2026-06-11T18:00:00Z' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => cloud }));
    const result = await fetchCloudSave(VALID_CODE);
    expect(result?.state.month).toBe(42);
  });

  it('returns null for unknown codes, invalid codes, and failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => null }));
    expect(await fetchCloudSave(VALID_CODE)).toBeNull();
    expect(await fetchCloudSave('garbage')).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await fetchCloudSave(VALID_CODE)).toBeNull();
  });
});
