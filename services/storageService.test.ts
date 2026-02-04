import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveAdultGame,
  loadAdultGame,
  getSaveSummaries,
  deleteSaveSlot,
  renameSaveSlot,
  exportSaveSlot,
  importSavePayload,
} from './storageService';
import { GameState } from '../types';
import { INITIAL_GAME_STATE } from '../constants';

// Helper to create a minimal test game state
const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
  ...INITIAL_GAME_STATE,
  month: 5,
  year: 1,
  cash: 15000,
  assets: [],
  liabilities: [],
  mortgages: [],
  vehicles: [],
  creditRating: 700,
  ...overrides,
} as GameState);

describe('storageService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('saveAdultGame and loadAdultGame', () => {
    it('saves and loads game state correctly', () => {
      const state = createTestGameState({ cash: 25000, month: 10 });

      saveAdultGame(state, 'slot1');
      const loaded = loadAdultGame('slot1');

      expect(loaded).not.toBeNull();
      expect(loaded?.cash).toBe(25000);
      expect(loaded?.month).toBe(10);
    });

    it('saves to autosave slot by default', () => {
      const state = createTestGameState();

      saveAdultGame(state);
      const loaded = loadAdultGame('autosave');

      expect(loaded).not.toBeNull();
    });

    it('returns null for non-existent save slot', () => {
      const loaded = loadAdultGame('slot3');
      expect(loaded).toBeNull();
    });

    it('overwrites existing save in same slot', () => {
      const state1 = createTestGameState({ cash: 1000 });
      const state2 = createTestGameState({ cash: 2000 });

      saveAdultGame(state1, 'slot1');
      saveAdultGame(state2, 'slot1');

      const loaded = loadAdultGame('slot1');
      expect(loaded?.cash).toBe(2000);
    });

    it('preserves data integrity after multiple saves', () => {
      const state = createTestGameState({
        cash: 50000,
        month: 24,
        year: 2,
        creditRating: 750,
      });

      // Save multiple times
      saveAdultGame(state, 'autosave');
      saveAdultGame(state, 'slot1');
      saveAdultGame(state, 'slot2');

      // Verify all slots have correct data
      expect(loadAdultGame('autosave')?.cash).toBe(50000);
      expect(loadAdultGame('slot1')?.month).toBe(24);
      expect(loadAdultGame('slot2')?.creditRating).toBe(750);
    });
  });

  describe('getSaveSummaries', () => {
    it('returns empty array when no saves exist', () => {
      const summaries = getSaveSummaries('adult');
      expect(summaries).toEqual([]);
    });

    it('returns summaries for existing saves', () => {
      const state = createTestGameState({ cash: 10000, month: 5 });
      saveAdultGame(state, 'slot1');

      const summaries = getSaveSummaries('adult');

      expect(summaries.length).toBeGreaterThan(0);
      const slot1Summary = summaries.find((s) => s.slotId === 'slot1');
      expect(slot1Summary).toBeDefined();
      expect(slot1Summary?.cash).toBe(10000);
      expect(slot1Summary?.month).toBe(5);
      expect(slot1Summary?.difficulty).toBe(state.difficulty);
    });

    it('includes updatedAt timestamp', () => {
      const before = Date.now();
      const state = createTestGameState();
      saveAdultGame(state, 'slot1');
      const after = Date.now();

      const summaries = getSaveSummaries('adult');
      const slot1Summary = summaries.find((s) => s.slotId === 'slot1');

      expect(slot1Summary?.updatedAt).toBeGreaterThanOrEqual(before);
      expect(slot1Summary?.updatedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('deleteSaveSlot', () => {
    it('removes save from specified slot', () => {
      const state = createTestGameState();
      saveAdultGame(state, 'slot1');

      expect(loadAdultGame('slot1')).not.toBeNull();

      deleteSaveSlot('adult', 'slot1');

      expect(loadAdultGame('slot1')).toBeNull();
    });

    it('does not affect other save slots', () => {
      const state1 = createTestGameState({ cash: 1000 });
      const state2 = createTestGameState({ cash: 2000 });

      saveAdultGame(state1, 'slot1');
      saveAdultGame(state2, 'slot2');

      deleteSaveSlot('adult', 'slot1');

      expect(loadAdultGame('slot1')).toBeNull();
      expect(loadAdultGame('slot2')?.cash).toBe(2000);
    });
  });

  describe('renameSaveSlot', () => {
    it('updates save slot label', () => {
      const state = createTestGameState();
      saveAdultGame(state, 'slot1', 'Old Name');

      renameSaveSlot('adult', 'slot1', 'New Name');

      const summaries = getSaveSummaries('adult');
      const slot1Summary = summaries.find((s) => s.slotId === 'slot1');
      expect(slot1Summary?.label).toBe('New Name');
    });

    it('preserves game state when renaming', () => {
      const state = createTestGameState({ cash: 99999 });
      saveAdultGame(state, 'slot1');

      renameSaveSlot('adult', 'slot1', 'Renamed Save');

      const loaded = loadAdultGame('slot1');
      expect(loaded?.cash).toBe(99999);
    });
  });

  describe('export/import', () => {
    it('exports and imports a save payload', () => {
      const state = createTestGameState({ cash: 4242, month: 9 });
      saveAdultGame(state, 'slot1', 'Primary Save');

      const payload = exportSaveSlot('adult', 'slot1');
      expect(payload).not.toBeNull();

      importSavePayload(payload, 'adult', 'slot2', 'Imported Save');
      const loaded = loadAdultGame('slot2');

      expect(loaded?.cash).toBe(4242);
      expect(loaded?.month).toBe(9);
    });

    it('imports raw state payloads', () => {
      const state = createTestGameState({ cash: 7777, month: 3 });
      const summary = importSavePayload(state, 'adult', 'slot3', 'Raw Import');

      expect(summary).not.toBeNull();
      expect(loadAdultGame('slot3')?.cash).toBe(7777);
    });
  });
});

describe('storageService edge cases', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles corrupted localStorage data gracefully', () => {
    // Manually insert invalid JSON
    localStorage.setItem('tycoon_saves_v2', 'not valid json');

    // Should not throw, should return null
    expect(() => loadAdultGame('autosave')).not.toThrow();
    expect(loadAdultGame('autosave')).toBeNull();
  });

  it('handles localStorage quota exceeded', () => {
    const state = createTestGameState();

    // Mock localStorage.setItem to throw quota error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw, should fail gracefully
    expect(() => saveAdultGame(state, 'slot1')).not.toThrow();

    // Restore original
    localStorage.setItem = originalSetItem;
  });
});
