import { Asset, AssetType, MarketItem } from '../types';

// Teaching assumptions, not live quotes or promised returns. Cash payments and
// price changes are separate: holding a growth asset does not pay its return out.
const DISTRIBUTIONS: Record<string, number> = {
  sp500: .015, total: .015, intl: .025, emerging: .025, reit: .045,
  techgiant: .005, dividend: .035, growth: 0, biotech: 0, energy: .035,
  bank: .03, reit_lite: .045, dividend_etf: .035, medtech_royalty: .08,
  farmland_share: .04, btc: 0, eth: 0, altcoin: 0, gold: 0, silver: 0
};
export const incomeYield = (item: MarketItem): number => DISTRIBUTIONS[item.id] ?? item.expectedYield;
export const incomeLabel = (type: AssetType, id?: string): string => {
  if (id === 'medtech_royalty') return 'Royalty income';
  if (id === 'farmland_share') return 'Lease income';
  if (type === AssetType.SAVINGS || type === AssetType.BOND) return 'Interest';
  if (type === AssetType.REAL_ESTATE) return 'Gross rent';
  if (type === AssetType.BUSINESS) return 'Operating profit';
  if (type === AssetType.CRYPTO || type === AssetType.COMMODITY) return 'Cash payments';
  return 'Dividends';
};
export const nominalPrice = (item: MarketItem, month: number, inflation: number): number =>
  Math.round(item.price * (item.type === AssetType.SAVINGS || item.type === AssetType.BOND ? 1 : Math.pow(1 + inflation, month / 12)));

export const migrateInvestmentAssets = (assets: Asset[], catalogue: MarketItem[]): Asset[] => assets.map(asset => {
  if (asset.incomeModelVersion === 2) return asset;
  const item = catalogue.find(item => item.id === asset.marketItemId || item.name === asset.name);
  const rate = item ? incomeYield(item) : asset.type === AssetType.CRYPTO ? 0 : asset.baseYield;
  if (rate === undefined) return { ...asset, incomeModelVersion: 2 };
  return { ...asset, marketItemId: item?.id, incomeModelVersion: 2, baseYield: rate,
    cashFlow: asset.costBasis * rate / 12,
    ...(asset.type === AssetType.BUSINESS ? {} : { currentMonthIncome: undefined }) };
});
