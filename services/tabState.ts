export type InvestmentTierFilter = 'ALL' | 'STARTER' | 'MID' | 'ADVANCED';

export type TabUiState = {
  scrollY: number;
  investmentFilter: string;
  investmentTierFilter: InvestmentTierFilter;
  investmentSearch: string;
};

export const DEFAULT_TAB_UI_STATE: TabUiState = {
  scrollY: 0,
  investmentFilter: 'ALL',
  investmentTierFilter: 'ALL',
  investmentSearch: ''
};

export const clampScrollY = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
};

export const hydrateTabUiState = (partial?: Partial<TabUiState>): TabUiState => ({
  ...DEFAULT_TAB_UI_STATE,
  ...partial,
  scrollY: clampScrollY(partial?.scrollY ?? 0)
});
