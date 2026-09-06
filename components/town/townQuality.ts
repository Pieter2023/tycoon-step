// Rendering quality for the 3D city. Three fixed tiers (resolution cap, shadows, shadow-map size)
// and a governor that watches real frame times: it steps down when frames stay slow, steps back up
// only after a long run of fast frames, and never bounces straight back into a tier it just left.
export type QualityLevel = 'low' | 'medium' | 'high';
export type QualityMode = 'auto' | QualityLevel;
export const QUALITY_STORAGE_KEY = 'tycoon_town_quality';
export const QUALITY_ORDER: QualityLevel[] = ['low', 'medium', 'high'];
export const QUALITY_MODES: QualityMode[] = ['auto', 'high', 'medium', 'low'];
export const QUALITY_SETTINGS: Record<QualityLevel, { label: string; pixelRatioCap: number; shadows: boolean; shadowMap: number; detail: string }> = {
  high: { label: 'Detailed', pixelRatioCap: 1.6, shadows: true, shadowMap: 2048, detail: 'Full resolution and soft shadows.' },
  medium: { label: 'Balanced', pixelRatioCap: 1.15, shadows: true, shadowMap: 1024, detail: 'Lighter resolution, simpler shadows.' },
  low: { label: 'Smooth', pixelRatioCap: .85, shadows: false, shadowMap: 512, detail: 'No shadows; steadiest on older phones.' },
};

export const readQualityMode = (storage?: Pick<Storage, 'getItem'>): QualityMode => {
  try { const value = (storage ?? localStorage).getItem(QUALITY_STORAGE_KEY); return QUALITY_MODES.includes(value as QualityMode) ? value as QualityMode : 'auto'; } catch { return 'auto'; }
};
export const saveQualityMode = (mode: QualityMode, storage?: Pick<Storage, 'setItem'>) => { try { (storage ?? localStorage).setItem(QUALITY_STORAGE_KEY, mode); } catch { /* private mode */ } };

// Auto starts one tier down on devices that look like phones (few cores, touch, dense screen) so the
// first seconds are smooth; the governor can promote it later if the frames are fast.
export type DeviceHints = { pixelRatio?: number; cores?: number; coarsePointer?: boolean };
export const initialQuality = (mode: QualityMode, device: DeviceHints = {}): QualityLevel => {
  if (mode !== 'auto') return mode;
  const cores = device.cores ?? 8, pixelRatio = device.pixelRatio ?? 1;
  return cores <= 4 || (device.coarsePointer && pixelRatio >= 2) ? 'medium' : 'high';
};

export const WINDOW_MS = 2000, SLOW_MS = 26, FAST_MS = 11, FAST_WINDOWS = 6, COOLDOWN_MS = 90000, WARMUP_MS = 3000, GAP_MS = 250;
export function createQualityGovernor(level: QualityLevel, automatic = true) {
  let sum = 0, count = 0, fastWindows = 0, clock = 0;
  const demotedFrom: Partial<Record<QualityLevel, number>> = {};
  return {
    get level() { return level; },
    get automatic() { return automatic; },
    set(next: QualityLevel, auto: boolean) { level = next; automatic = auto; sum = count = fastWindows = 0; },
    // Feed one frame's duration in ms. Returns the new tier when the governor changes it, else null.
    sample(frameMs: number): QualityLevel | null {
      clock += frameMs;
      if (!automatic || clock < WARMUP_MS || frameMs > GAP_MS) { sum = count = 0; return null; }   // shader warm-up and tab switches are not evidence
      sum += frameMs; count++; if (sum < WINDOW_MS) return null;
      const average = sum / count; sum = count = 0;
      const index = QUALITY_ORDER.indexOf(level);
      if (average > SLOW_MS && index > 0) { demotedFrom[level] = clock; fastWindows = 0; level = QUALITY_ORDER[index - 1]; return level; }
      if (average < FAST_MS && index < QUALITY_ORDER.length - 1) {
        const up = QUALITY_ORDER[index + 1], left = demotedFrom[up];
        if (++fastWindows >= FAST_WINDOWS && (left === undefined || clock - left > COOLDOWN_MS)) { fastWindows = 0; level = up; return level; }
      } else fastWindows = 0;
      return null;
    },
  };
}
