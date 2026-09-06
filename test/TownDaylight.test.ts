import { describe, it, expect } from 'vitest';
import { daylight, dayPhase, openingPhase, DAY_SECONDS } from '../components/town/townDaylight';

describe('day-night cycle', () => {
  it('is bright at noon, warm at sunset and dark with lamps and windows on at midnight', () => {
    const noon = daylight(.25), sunset = daylight(.5), midnight = daylight(.75);
    expect(noon.sunIntensity).toBeGreaterThan(3); expect(noon.lamps).toBe(0); expect(noon.windows).toBe(0); expect(noon.label).toBe('MIDDAY'); expect(noon.night).toBe(false);
    expect(sunset.sunColor).not.toBe(noon.sunColor); expect(sunset.lamps).toBeGreaterThan(0); expect(sunset.label).toBe('EVENING');
    expect(midnight.sunIntensity).toBeLessThan(.5); expect(midnight.lamps).toBe(1); expect(midnight.windows).toBe(1); expect(midnight.night).toBe(true); expect(midnight.label).toBe('NIGHT');
    expect(midnight.background).not.toBe(noon.background); expect(midnight.ambient).toBeLessThan(noon.ambient / 3); expect(midnight.skyIntensity).toBeLessThan(noon.skyIntensity); expect(Number(midnight.exposure)).toBeLessThan(Number(noon.exposure));
    expect(daylight(.08).label).toBe('MORNING');
  });
  it('dims and greys the sun in rain without turning day into night', () => {
    const dry = daylight(.25), wet = daylight(.25, true);
    expect(wet.sunIntensity).toBeLessThan(dry.sunIntensity); expect(wet.lamps).toBe(0); expect(wet.background).not.toBe(dry.background);
  });
  it('opens each month in daylight, reaches sunset within a few minutes, and holds still under reduced motion', () => {
    for (let month = 1; month <= 24; month++) { const phase = openingPhase(month); expect(phase).toBeGreaterThanOrEqual(.08); expect(phase).toBeLessThan(.35); expect(daylight(phase).lamps).toBe(0); }
    const toSunset = (.5 - openingPhase(2)) * DAY_SECONDS; expect(toSunset).toBeGreaterThan(90); expect(toSunset).toBeLessThan(260);
    expect(dayPhase(2, 0)).toBe(openingPhase(2)); expect(dayPhase(2, DAY_SECONDS)).toBeCloseTo(openingPhase(2));
    expect(dayPhase(9, 5000, true)).toBe(.2);
  });
});
