import { describe, it, expect, vi, afterEach } from 'vitest';
import { MARKET_ITEMS, INITIAL_GAME_STATE, CHARACTERS, getInitialQuestState } from '../constants';
import { Asset, AssetType, GameState } from '../types';
import { incomeYield, nominalPrice, migrateInvestmentAssets } from '../services/investmentModel';
import { calculateMonthlyCashFlow, calculateMonthlyCashFlowEstimate, updateAssetPrices, getQuestProgress, clearSimSeed, updateQuests, claimQuestReward } from '../services/gameLogic';
import { resolveFirstRepair, REPAIR_LOAN_PAYMENT } from '../services/firstSteps';
import { saveAdultGame, loadAdultGame, exportCurrentAdultGame, importSavePayload } from '../services/storageService';
const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 10000, reserveBaseline: 10000, firstSteps: {} });
const holding = (name: string, type: AssetType, rate = .2): Asset => ({ id: name, name, type, value: 1000, costBasis: 1000, quantity: 1, cashFlow: 1000 * rate / 12, baseYield: rate, volatility: .8, appreciationRate: .1, priceHistory: [] });
afterEach(() => { vi.restoreAllMocks(); clearSimSeed(); });
describe('financial learning model', () => {
  it('does not award a starter goal for any character before a decision', () => {
    for (const character of CHARACTERS) {
      const state = { ...base(), character, quests: getInitialQuestState(character.id) };
      expect(updateQuests(state).quests!.readyToClaim).toHaveLength(0);
    }
  });
  it('exports the current unsaved state and can restore it', () => {
    localStorage.clear(); const state = base(); saveAdultGame(state);
    const latest = resolveFirstRepair(state, 'cash');
    const backup = exportCurrentAdultGame(latest);
    expect(loadAdultGame()!.cash).toBe(10000);
    expect(importSavePayload(backup, 'adult', 'slot1')).not.toBeNull();
    expect(loadAdultGame('slot1')!.cash).toBe(9600);
    expect(loadAdultGame('slot1')!.firstSteps!.repairChoice).toBe('cash');
  });
  it('separates distributions from total growth assumptions and pays nothing for spot crypto', () => {
    expect(incomeYield(MARKET_ITEMS.find(x => x.id === 'btc')!)).toBe(0);
    expect(incomeYield(MARKET_ITEMS.find(x => x.id === 'sp500')!)).toBe(.015);
    const assets = migrateInvestmentAssets([holding('Bitcoin', AssetType.CRYPTO)], MARKET_ITEMS);
    expect(calculateMonthlyCashFlowEstimate({ ...base(), assets, difficulty: 'EASY' }).passive).toBe(0);
  });
  it('migrates old saves without changing cash, holdings, cost basis or completed rewards', () => {
    localStorage.clear();
    const state = base(); state.assets = [holding('Bitcoin', AssetType.CRYPTO)];
    state.quests!.completed = ['Q_FIRST_INVESTMENT'];
    expect(saveAdultGame(state)).toBe(true);
    const loaded = loadAdultGame()!;
    expect(loaded.cash).toBe(state.cash);
    expect(loaded.assets[0].value).toBe(1000);
    expect(loaded.assets[0].costBasis).toBe(1000);
    expect(loaded.assets[0].cashFlow).toBe(0);
    expect(loaded.quests!.completed).toContain('Q_FIRST_INVESTMENT');
    expect(migrateInvestmentAssets(loaded.assets, MARKET_ITEMS)).toEqual(loaded.assets);
  });
  it('never charges shareholders a negative dividend on harder difficulty', () => {
    const state = { ...base(), difficulty: 'IMPOSSIBLE' as const, assets: [holding('Tech Giant', AssetType.STOCK, .005)] };
    expect(calculateMonthlyCashFlowEstimate(state).passive).toBe(0);
    expect(calculateMonthlyCashFlow(state).passive).toBe(0);
  });
  it('keeps deposit principal stable in a recession and price quotes consistent', () => {
    const state = base(); state.economy.recession = true; state.marketCycle.phase = 'CONTRACTION';
    state.assets = [holding('High-Yield Savings', AssetType.SAVINGS, .045)];
    const updated = updateAssetPrices(state);
    expect(updated.assets[0].value).toBe(1000);
    expect(updated.assets[0].cashFlow).toBe(3.75);
    expect(nominalPrice(MARKET_ITEMS.find(i => i.id === 'hysa')!, 36, .1)).toBe(1000);
  });
  it('allows deep losses on normal difficulty but keeps the disclosed Easy floor', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const state = base(); state.assets = [holding('Bitcoin', AssetType.CRYPTO, 0)];
    state.assets[0].value = 510;
    expect(updateAssetPrices(state).assets[0].value).toBeLessThan(500);
    expect(updateAssetPrices({ ...state, difficulty: 'EASY' }).assets[0].value).toBeGreaterThanOrEqual(500);
  });
  it('does not turn paper gains into cash distributions', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.8);
    const state = base(); state.assets = [holding('Growth Stock', AssetType.STOCK, 0)];
    const next = updateAssetPrices(state);
    expect(next.assets[0].value).toBeGreaterThan(1000);
    expect(next.assets[0].cashFlow).toBe(0);
  });
  it('requires earned progress and refuses to count new borrowing toward the reserve goal', () => {
    const state = base();
    expect(getQuestProgress(state, 'Q_BUFFER_2K')!.complete).toBe(false);
    state.month = 2; state.cash += 2000;
    expect(getQuestProgress(state, 'Q_BUFFER_2K')!.complete).toBe(true);
    state.liabilities = [{ id:'loan', name:'Loan', balance:2000, originalBalance:2000, monthlyPayment:100, interestRate:.1, type:'PERSONAL_LOAN' }];
    expect(getQuestProgress(state, 'Q_BUFFER_2K')!.complete).toBe(false);
  });
  it('requires cash runway for the first investment and applies earned rewards once', () => {
    const state = base(); state.assets = [holding('Index', AssetType.INDEX_FUND, .015)]; state.cash = 100;
    expect(getQuestProgress(state, 'Q_FIRST_INVESTMENT')!.complete).toBe(false);
    state.cash = 10000;
    const ready = updateQuests(state);
    const claimed = claimQuestReward(ready, 'Q_FIRST_INVESTMENT');
    expect(claimed.cash).toBe(10150);
    expect(claimQuestReward(claimed, 'Q_FIRST_INVESTMENT').cash).toBe(10150);
  });
  it('makes the repair choice real, compares borrowing fairly and prevents duplicate purchases', () => {
    const state = base();
    const cash = resolveFirstRepair(state, 'cash');
    expect(cash.cash).toBe(9600); expect(cash.liabilities).toHaveLength(0);
    const loan = resolveFirstRepair(state, 'loan');
    expect(loan.cash).toBe(10000); expect(loan.liabilities[0].balance).toBe(400);
    expect(loan.liabilities[0].monthlyPayment).toBe(REPAIR_LOAN_PAYMENT);
    expect(resolveFirstRepair(loan, 'cash')).toBe(loan);
    expect(resolveFirstRepair({ ...state, cash: 300 }, 'cash').cash).toBe(300);
  });
});
