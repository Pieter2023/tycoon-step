import { describe, it, expect } from 'vitest';
import { createQualityGovernor, initialQuality, readQualityMode, saveQualityMode, QUALITY_SETTINGS, WINDOW_MS, WARMUP_MS, FAST_WINDOWS, COOLDOWN_MS } from '../components/town/townQuality';

const feed = (g: ReturnType<typeof createQualityGovernor>, ms: number, totalMs: number) => { let changed: string | null = null; for (let t = 0; t < totalMs; t += ms) changed = g.sample(ms) ?? changed; return changed; };

describe('town graphics quality', () => {
  it('guesses a starting tier from the device and honours a fixed choice', () => {
    expect(initialQuality('auto', { cores: 10, pixelRatio: 2, coarsePointer: false })).toBe('high');
    expect(initialQuality('auto', { cores: 4 })).toBe('medium');
    expect(initialQuality('auto', { cores: 8, pixelRatio: 3, coarsePointer: true })).toBe('medium');
    expect(initialQuality('low', { cores: 16 })).toBe('low');
    expect(QUALITY_SETTINGS.low.shadows).toBe(false); expect(QUALITY_SETTINGS.high.pixelRatioCap).toBeGreaterThan(QUALITY_SETTINGS.medium.pixelRatioCap);
  });
  it('remembers the choice and falls back to auto', () => {
    const store = new Map<string, string>(); const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); } };
    expect(readQualityMode(storage)).toBe('auto');
    saveQualityMode('low', storage); expect(readQualityMode(storage)).toBe('low');
    store.set('tycoon_town_quality', 'ultra'); expect(readQualityMode(storage)).toBe('auto');
    expect(readQualityMode({ getItem: () => { throw new Error('blocked'); } })).toBe('auto');
  });
  it('steps down after two seconds of slow frames, ignoring warm-up and tab switches', () => {
    const g = createQualityGovernor('high');
    expect(feed(g, 40, WARMUP_MS - 40)).toBeNull();                 // warm-up: slow frames do not count
    expect(feed(g, 40, WINDOW_MS + 40)).toBe('medium');             // then one slow window drops a tier
    expect(g.sample(900)).toBeNull(); expect(g.level).toBe('medium'); // a tab switch is not a slow frame
    expect(feed(g, 40, WINDOW_MS + 40)).toBe('low');
    expect(feed(g, 40, WINDOW_MS * 3)).toBeNull(); expect(g.level).toBe('low'); // cannot go lower
  });
  it('promotes only after a long run of fast frames and not straight back into a tier it just left', () => {
    const g = createQualityGovernor('high'); feed(g, 8, WARMUP_MS);
    feed(g, 40, WINDOW_MS + 40); expect(g.level).toBe('medium');
    expect(feed(g, 8, WINDOW_MS * (FAST_WINDOWS + 2))).toBeNull();   // fast, but high was left seconds ago
    expect(feed(g, 8, COOLDOWN_MS)).toBe('high');                    // after the cooldown it climbs back
    const fresh = createQualityGovernor('low'); feed(fresh, 8, WARMUP_MS);
    expect(feed(fresh, 8, WINDOW_MS * (FAST_WINDOWS - 1))).toBeNull();
    expect(feed(fresh, 8, WINDOW_MS * 2)).toBe('medium');
    fresh.set('high', false); expect(feed(fresh, 60, WINDOW_MS * 4)).toBeNull(); expect(fresh.level).toBe('high'); // a fixed choice is never overridden
  });
});
