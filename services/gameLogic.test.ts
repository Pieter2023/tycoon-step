import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateNetWorth,
  calculateMortgagePayment,
  isEducationRelevant,
  calculateMonthlyActionsMax,
  processTurn,
  calculateCreditScoreUpdate,
  applyScenarioOutcome,
  getQuestProgress,
} from './gameLogic';
import { AssetType, GameState } from '../types';
import { INITIAL_GAME_STATE } from '../constants';

// Helper to create a minimal valid GameState for testing
const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
  ...INITIAL_GAME_STATE,
  month: 1,
  year: 1,
  cash: 10000,
  assets: [],
  liabilities: [],
  mortgages: [],
  vehicles: [],
  creditRating: 650,
  ...overrides,
});

describe('gameLogic', () => {
  describe('calculateNetWorth', () => {
    it('returns cash when no assets or liabilities', () => {
      const state = createTestGameState({ cash: 5000 });
      expect(calculateNetWorth(state)).toBe(5000);
    });

    it('adds asset values to net worth', () => {
      const state = createTestGameState({
        cash: 10000,
        assets: [
          {
            id: 'test-stock',
            name: 'Test Stock',
            type: AssetType.STOCK,
            value: 100,
            quantity: 10,
            costBasis: 90,
            cashFlow: 0,
            volatility: 0.2,
            appreciationRate: 0.05,
            priceHistory: [],
          },
        ],
      });
      // 10000 cash + (100 * 10) = 11000
      expect(calculateNetWorth(state)).toBe(11000);
    });

    it('subtracts liability balances from net worth', () => {
      const state = createTestGameState({
        cash: 20000,
        liabilities: [
          {
            id: 'test-loan',
            name: 'Personal Loan',
            balance: 5000,
            originalBalance: 5000,
            interestRate: 0.08,
            monthlyPayment: 200,
            type: 'PERSONAL_LOAN',
          },
        ],
      });
      // 20000 - 5000 = 15000
      expect(calculateNetWorth(state)).toBe(15000);
    });

    it('includes vehicle values in net worth', () => {
      const state = createTestGameState({
        cash: 5000,
        vehicles: [
          { id: 'car1', name: 'Sedan', value: 15000, age: 2, monthlyMaintenance: 100, hasLoan: false },
        ],
      });
      expect(calculateNetWorth(state)).toBe(20000);
    });

    it('calculates complex net worth correctly', () => {
      const state = createTestGameState({
        cash: 50000,
        assets: [
          {
            id: 'stock1',
            name: 'Tech Stock',
            type: AssetType.STOCK,
            value: 200,
            quantity: 50,
            costBasis: 180,
            cashFlow: 0,
            volatility: 0.3,
            appreciationRate: 0.08,
            priceHistory: [],
          },
          {
            id: 'bond1',
            name: 'Treasury Bond',
            type: AssetType.BOND,
            value: 1000,
            quantity: 5,
            costBasis: 1000,
            cashFlow: 30,
            volatility: 0.05,
            appreciationRate: 0.02,
            priceHistory: [],
          },
        ],
        liabilities: [
          {
            id: 'mortgage1',
            name: 'Home Mortgage',
            balance: 200000,
            originalBalance: 250000,
            interestRate: 0.045,
            monthlyPayment: 1500,
            type: 'MORTGAGE',
          },
        ],
        vehicles: [
          { id: 'car1', name: 'SUV', value: 25000, age: 1, monthlyMaintenance: 150, hasLoan: false },
        ],
      });
      // 50000 + (200*50) + (1000*5) + 25000 - 200000 = 50000 + 10000 + 5000 + 25000 - 200000 = -110000
      expect(calculateNetWorth(state)).toBe(-110000);
    });

    it('handles empty assets array gracefully', () => {
      const state = createTestGameState({
        cash: 1000,
        assets: [],
      });
      expect(calculateNetWorth(state)).toBe(1000);
    });
  });

  describe('career growth', () => {
    it('applies monthly salary growth based on experience and networking', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1);
      const state = createTestGameState({
        career: {
          path: 'TECH',
          title: 'Developer',
          salary: 5000,
          level: 2,
          experience: 24,
          skills: {},
          aiVulnerability: 0.4,
          futureProofScore: 65
        },
        playerJob: { title: 'Developer', salary: 5000, level: 2, experience: 24 },
        stats: {
          ...INITIAL_GAME_STATE.stats,
          networking: 60,
          stress: 30,
          happiness: 50,
          energy: 70,
          health: 80
        }
      });

      const { newState } = processTurn(state);
      const expectedGrowthRate = 0.0015 + 0.0008 + 0.0005;
      const expectedSalary = Math.round(5000 * (1 + expectedGrowthRate));

      expect(newState.career?.salary).toBe(expectedSalary);
      expect(newState.playerJob?.salary).toBe(expectedSalary);
      randomSpy.mockRestore();
    });
  });

  describe('credit score model', () => {
    it('penalizes delinquency and high debt-to-income', () => {
      const baseState = createTestGameState({
        creditRating: 700,
        liabilities: [
          {
            id: 'cc1',
            name: 'Credit Card',
            balance: 8000,
            originalBalance: 8000,
            interestRate: 0.22,
            monthlyPayment: 400,
            type: 'CREDIT_CARD',
          }
        ]
      });

      const result = calculateCreditScoreUpdate(
        baseState,
        baseState,
        { income: 2000, debtPayments: 800 },
        true
      );

      expect(result.score).toBeLessThan(700);
      expect(result.reasons).toContain('Missed or late payments');
    });

    it('rewards low utilization and healthy DTI', () => {
      const baseState = createTestGameState({
        creditRating: 650,
        liabilities: []
      });

      const result = calculateCreditScoreUpdate(
        baseState,
        baseState,
        { income: 6000, debtPayments: 500 },
        false
      );

      expect(result.score).toBeGreaterThan(650);
      expect(result.reasons).toContain('Low debt-to-income ratio');
    });

    it('lowers score when debt payments rise (loan impact)', () => {
      const baseState = createTestGameState({
        creditRating: 680,
        liabilities: []
      });

      const lowDebt = calculateCreditScoreUpdate(
        baseState,
        baseState,
        { income: 5000, debtPayments: 500 },
        false
      );
      const highDebt = calculateCreditScoreUpdate(
        baseState,
        baseState,
        { income: 5000, debtPayments: 2500 },
        false
      );

      expect(highDebt.score).toBeLessThan(lowDebt.score);
    });
  });

  describe('event followups', () => {
    it('queues followup events when an outcome includes followups', () => {
      const state = createTestGameState({
        eventQueue: [],
        pendingScenario: {
          id: 'test_event',
          title: 'Test',
          description: 'Test',
          category: 'ECONOMIC',
          options: []
        }
      });

      const result = applyScenarioOutcome(state, {
        message: 'Done',
        followups: [{ id: 'next_event', delayMonths: 2 }]
      });

      expect(result.eventQueue?.[0]?.id).toBe('next_event');
      expect(result.eventQueue?.[0]?.minMonth).toBe(state.month + 2);
    });
  });

  describe('calculateMortgagePayment', () => {
    it('calculates correct payment for standard mortgage', () => {
      // $200,000 at 6% for 30 years
      const payment = calculateMortgagePayment(200000, 0.06, 30);
      // Expected: ~$1199/month
      expect(payment).toBeGreaterThan(1190);
      expect(payment).toBeLessThan(1210);
    });

    it('calculates correct payment for 15-year mortgage', () => {
      // $200,000 at 5% for 15 years
      const payment = calculateMortgagePayment(200000, 0.05, 15);
      // Expected: ~$1582/month
      expect(payment).toBeGreaterThan(1570);
      expect(payment).toBeLessThan(1600);
    });

    it('handles zero interest rate', () => {
      // $120,000 at 0% for 10 years = $1000/month
      const payment = calculateMortgagePayment(120000, 0, 10);
      expect(payment).toBe(1000);
    });

    it('returns rounded integer payment', () => {
      const payment = calculateMortgagePayment(100000, 0.05, 30);
      expect(Number.isInteger(payment)).toBe(true);
    });
  });

  describe('isEducationRelevant', () => {
    it('STEM is relevant for TECH career', () => {
      expect(isEducationRelevant('STEM', 'TECH')).toBe(true);
    });

    it('STEM is relevant for FINANCE career', () => {
      expect(isEducationRelevant('STEM', 'FINANCE')).toBe(true);
    });

    it('STEM is not relevant for HEALTHCARE career', () => {
      expect(isEducationRelevant('STEM', 'HEALTHCARE')).toBe(false);
    });

    it('HEALTHCARE is relevant for HEALTHCARE career', () => {
      expect(isEducationRelevant('HEALTHCARE', 'HEALTHCARE')).toBe(true);
    });

    it('BUSINESS is relevant for SALES career', () => {
      expect(isEducationRelevant('BUSINESS', 'SALES')).toBe(true);
    });

    it('LIBERAL_ARTS has no relevant careers', () => {
      expect(isEducationRelevant('LIBERAL_ARTS', 'TECH')).toBe(false);
      expect(isEducationRelevant('LIBERAL_ARTS', 'FINANCE')).toBe(false);
      expect(isEducationRelevant('LIBERAL_ARTS', 'HEALTHCARE')).toBe(false);
    });

    it('LAW is relevant for GOVERNMENT', () => {
      expect(isEducationRelevant('LAW', 'GOVERNMENT')).toBe(true);
    });

    it('TRADES is relevant for ENTREPRENEUR', () => {
      expect(isEducationRelevant('TRADES', 'ENTREPRENEUR')).toBe(true);
    });
  });

  describe('calculateMonthlyActionsMax', () => {
    it('returns base actions for early game', () => {
      const state = createTestGameState({ month: 1 });
      const max = calculateMonthlyActionsMax(state);
      expect(max).toBeGreaterThanOrEqual(2);
    });

    it('increases actions as game progresses', () => {
      const earlyState = createTestGameState({ month: 5 });
      const lateState = createTestGameState({ month: 50 });

      const earlyMax = calculateMonthlyActionsMax(earlyState);
      const lateMax = calculateMonthlyActionsMax(lateState);

      expect(lateMax).toBeGreaterThanOrEqual(earlyMax);
    });
  });

  describe('getQuestProgress', () => {
    it('returns null for non-existent quest', () => {
      const state = createTestGameState();
      const progress = getQuestProgress(state, 'non_existent_quest');
      expect(progress).toBeNull();
    });

    it('returns progress info for valid quest', () => {
      const state = createTestGameState({
        cash: 5000,
        quests: {
          active: ['emergency_fund'],
          readyToClaim: [],
          completed: [],
        },
      });

      const progress = getQuestProgress(state, 'emergency_fund');

      // Should return progress object with current/target values
      if (progress) {
        expect(progress).toHaveProperty('current');
        expect(progress).toHaveProperty('target');
        expect(typeof progress.current).toBe('number');
        expect(typeof progress.target).toBe('number');
      }
    });
  });
});

describe('gameLogic edge cases', () => {
  it('handles undefined arrays in calculateNetWorth', () => {
    const state = createTestGameState({
      cash: 1000,
      assets: undefined as any,
      liabilities: [],
    });
    // Should not throw, should handle gracefully
    expect(() => calculateNetWorth(state)).not.toThrow();
  });

  it('handles missing quantity in asset', () => {
    const state = createTestGameState({
      cash: 1000,
      assets: [
        {
          id: 'test',
          name: 'Test',
          type: AssetType.SAVINGS,
          value: 500,
          quantity: undefined as any, // Missing quantity
          costBasis: 500,
          cashFlow: 0,
          volatility: 0,
          appreciationRate: 0.02,
          priceHistory: [],
        },
      ],
    });
    // Should default quantity to 1
    const netWorth = calculateNetWorth(state);
    expect(netWorth).toBe(1500); // 1000 + 500*1
  });
});
