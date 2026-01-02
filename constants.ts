// Tycoon: Financial Freedom - Game Constants v3.4.3
// Complete with Life Events, Marriage, Children, Recessions

import { 
  GameState, Character, MarketItem, AssetType, Lifestyle, CareerPath, 
  EducationOption, SideHustle, MortgageOption, Scenario, CareerPathInfo,
  PlayerStats, Vehicle, QuestDefinition, QuestState, LifeEventCategory
} from './types';
import eventLibrary from './data/events.json';

// ============================================
// DIFFICULTY SETTINGS
// ============================================
export const DIFFICULTY_SETTINGS = {
  EASY: {
    label: '😊 Easy',
    description: 'Perfect for learning. Higher starting cash, better yields.',
    startingCash: 15000,
    salaryMultiplier: 1.2,
    expenseMultiplier: 0.8,
    assetYieldBonus: 0.02,
    volatilityMultiplier: 0.7,
    eventFrequency: 0.7,
    aiDisruptionSpeed: 0.5
  },
  NORMAL: {
    label: '😐 Normal',
    description: 'Balanced experience for most players.',
    startingCash: 8000,
    salaryMultiplier: 1.0,
    expenseMultiplier: 1.0,
    assetYieldBonus: 0,
    volatilityMultiplier: 1.0,
    eventFrequency: 1.0,
    aiDisruptionSpeed: 1.0
  },
  HARD: {
    label: '😤 Hard',
    description: 'Tighter margins. Requires careful planning.',
    startingCash: 4000,
    salaryMultiplier: 0.9,
    expenseMultiplier: 1.15,
    assetYieldBonus: -0.01,
    volatilityMultiplier: 1.3,
    eventFrequency: 1.3,
    aiDisruptionSpeed: 1.5
  },
  EXPERT: {
    label: '🔥 Expert',
    description: 'For experienced players. Start with debt.',
    startingCash: 2000,
    startingDebt: 8000,
    salaryMultiplier: 0.85,
    expenseMultiplier: 1.25,
    assetYieldBonus: -0.02,
    volatilityMultiplier: 1.5,
    eventFrequency: 1.5,
    aiDisruptionSpeed: 2.0
  },
  IMPOSSIBLE: {
    label: '💀 Impossible',
    description: 'Maximum challenge. Good luck.',
    startingCash: 500,
    startingDebt: 20000,
    salaryMultiplier: 0.75,
    expenseMultiplier: 1.4,
    assetYieldBonus: -0.03,
    volatilityMultiplier: 2.0,
    eventFrequency: 2.0,
    aiDisruptionSpeed: 3.0
  }
};

// ============================================
// FINANCIAL FREEDOM TARGET
// ============================================
// Passive income must cover this % of monthly expenses to win.
// 1.1 = 110% buffer to encourage a safety margin.
export const FINANCIAL_FREEDOM_TARGET_MULTIPLIER = 1.1;

export const getFinancialFreedomTarget = (monthlyExpenses: number): number => {
  return Math.ceil(monthlyExpenses * FINANCIAL_FREEDOM_TARGET_MULTIPLIER);
};

// ============================================
// CHARACTERS
// ============================================
export const CHARACTERS: Character[] = [
  {
    id: 'alex',
    name: 'Alex Chen',
    backstory: 'Software engineer at a startup. Good salary but no savings yet.',
    avatarEmoji: '👨‍💻',
    avatarColor: 'from-blue-500 to-cyan-500',
    careerPath: 'TECH',
    startingBonus: { type: 'cash', amount: 2000 },
    traits: ['Analytical', 'Tech-savvy'],
    perk: {
      id: 'automation_edge',
      name: 'Automation Edge',
      description: 'Earn 5% more salary from workflow automation.',
      effects: { salaryMultiplier: 1.05 }
    }
  },
  {
    id: 'maria',
    name: 'Maria Santos',
    backstory: 'Registered nurse with steady income and student loans.',
    avatarEmoji: '👩‍⚕️',
    avatarColor: 'from-pink-500 to-rose-500',
    careerPath: 'HEALTHCARE',
    startingBonus: { type: 'cash', amount: -25000 },
    traits: ['Caring', 'Resilient'],
    perk: {
      id: 'resilient_care',
      name: 'Resilient Care',
      description: 'Medical event costs are 15% lower.',
      effects: { medicalCostMultiplier: 0.85 }
    }
  },
  {
    id: 'james',
    name: 'James Wilson',
    backstory: 'Junior financial analyst with dreams of Wall Street.',
    avatarEmoji: '👨‍💼',
    avatarColor: 'from-emerald-500 to-green-500',
    careerPath: 'FINANCE',
    startingBonus: { type: 'cash', amount: 5000 },
    traits: ['Ambitious', 'Numbers-driven'],
    perk: {
      id: 'rate_savvy',
      name: 'Rate Savvy',
      description: 'Negotiations start with a +8% success edge.',
      effects: { negotiationBonus: 0.08 }
    }
  },
  {
    id: 'sarah',
    name: 'Sarah Miller',
    backstory: 'Licensed electrician. Skilled trade, no debt.',
    avatarEmoji: '👷‍♀️',
    avatarColor: 'from-amber-500 to-yellow-500',
    careerPath: 'TRADES',
    startingBonus: { type: 'cash', amount: 8000 },
    traits: ['Practical', 'Independent'],
    perk: {
      id: 'hands_on_fixer',
      name: 'Hands-On Fixer',
      description: 'Business maintenance costs are 15% lower.',
      effects: { businessMaintenanceCostMultiplier: 0.85 }
    }
  },
  {
    id: 'devon',
    name: 'Devon Brooks',
    backstory: 'Freelance graphic designer building a creative business.',
    avatarEmoji: '🎨',
    avatarColor: 'from-purple-500 to-violet-500',
    careerPath: 'CREATIVE',
    startingBonus: { type: 'cash', amount: 1000 },
    traits: ['Creative', 'Adaptable'],
    perk: {
      id: 'brand_builder',
      name: 'Brand Builder',
      description: 'Side hustle income is 6% higher.',
      effects: { sideHustleIncomeMultiplier: 1.06 }
    }
  },
  {
    id: 'marcus',
    name: 'Marcus Johnson',
    backstory: 'Serial entrepreneur. High risk, high reward mentality.',
    avatarEmoji: '🚀',
    avatarColor: 'from-orange-500 to-red-500',
    careerPath: 'ENTREPRENEUR',
    startingBonus: { type: 'cash', amount: -5000 },
    traits: ['Risk-taker', 'Visionary'],
    perk: {
      id: 'risk_operator',
      name: 'Risk Operator',
      description: 'Business income volatility is reduced by 10%.',
      effects: { businessVolatilityMultiplier: 0.9 }
    }
  },
  {
    id: 'linda',
    name: 'Linda Park',
    backstory: 'Government employee with pension and job security.',
    avatarEmoji: '🏛️',
    avatarColor: 'from-slate-500 to-gray-500',
    careerPath: 'GOVERNMENT',
    startingBonus: { type: 'cash', amount: 6000 },
    traits: ['Stable', 'Patient'],
    perk: {
      id: 'stability_buffer',
      name: 'Stability Buffer',
      description: 'Recession salary penalty is reduced.',
      effects: { recessionSalaryMultiplier: 0.98 }
    }
  },
  {
    id: 'tyler',
    name: 'Tyler Reed',
    backstory: 'Sales rep with commission potential. Income varies wildly.',
    avatarEmoji: '📊',
    avatarColor: 'from-teal-500 to-cyan-500',
    careerPath: 'SALES',
    startingBonus: { type: 'cash', amount: 3000 },
    traits: ['Persuasive', 'Competitive'],
    perk: {
      id: 'sales_momentum',
      name: 'Sales Momentum',
      description: 'Career salary growth is slightly faster.',
      effects: { salaryGrowthBonus: 0.0006 }
    }
  }
];

// ============================================
// CAREER PATHS
// ============================================
export const CAREER_PATHS: { [key in CareerPath]: CareerPathInfo } = {
  TECH: {
    name: 'Technology',
    icon: '💻',
    aiVulnerability: 0.40,
    futureProofScore: 65,
    specialMechanic: 'AI helps your work but may replace junior roles',
    levels: [
      { title: 'Junior Developer', baseSalary: 5500, experienceRequired: 0 },
      { title: 'Developer', baseSalary: 7500, experienceRequired: 24 },
      { title: 'Senior Developer', baseSalary: 10000, experienceRequired: 48 },
      { title: 'Staff Engineer', baseSalary: 14000, experienceRequired: 84, educationRequired: 'BACHELOR', educationCategory: 'STEM' },
      { title: 'Principal Engineer', baseSalary: 18000, experienceRequired: 120 },
      { title: 'VP of Engineering', baseSalary: 25000, experienceRequired: 180 }
    ]
  },
  FINANCE: {
    name: 'Finance',
    icon: '💰',
    aiVulnerability: 0.60,
    futureProofScore: 45,
    specialMechanic: 'Robo-advisors are taking over retail finance',
    levels: [
      { title: 'Financial Analyst', baseSalary: 5000, experienceRequired: 0 },
      { title: 'Senior Analyst', baseSalary: 7000, experienceRequired: 24 },
      { title: 'Finance Manager', baseSalary: 9500, experienceRequired: 48 },
      { title: 'Director', baseSalary: 13000, experienceRequired: 84 },
      { title: 'VP of Finance', baseSalary: 18000, experienceRequired: 120, educationRequired: 'MBA', educationCategory: 'BUSINESS' },
      { title: 'CFO', baseSalary: 30000, experienceRequired: 180 }
    ]
  },
  HEALTHCARE: {
    name: 'Healthcare',
    icon: '🏥',
    aiVulnerability: 0.15,
    futureProofScore: 95,
    specialMechanic: 'Human care is irreplaceable. Very stable.',
    levels: [
      { title: 'Medical Assistant', baseSalary: 3000, experienceRequired: 0 },
      { title: 'Registered Nurse', baseSalary: 5500, experienceRequired: 24 },
      { title: 'Senior Nurse', baseSalary: 7000, experienceRequired: 48 },
      { title: 'Nurse Practitioner', baseSalary: 9500, experienceRequired: 84, educationRequired: 'MASTER', educationCategory: 'HEALTHCARE' },
      { title: 'Clinical Director', baseSalary: 12000, experienceRequired: 120 },
      { title: 'Physician', baseSalary: 22000, experienceRequired: 180, educationRequired: 'MEDICAL', educationCategory: 'HEALTHCARE' }
    ]
  },
  TRADES: {
    name: 'Skilled Trades',
    icon: '🔧',
    aiVulnerability: 0.10,
    futureProofScore: 98,
    specialMechanic: 'Robots cannot fix pipes or wire houses. Very safe.',
    levels: [
      { title: 'Apprentice', baseSalary: 3500, experienceRequired: 0 },
      { title: 'Journeyman', baseSalary: 5000, experienceRequired: 24 },
      { title: 'Licensed Tradesman', baseSalary: 6500, experienceRequired: 48 },
      { title: 'Master Tradesman', baseSalary: 8500, experienceRequired: 84 },
      { title: 'Contractor', baseSalary: 11000, experienceRequired: 120 },
      { title: 'Business Owner', baseSalary: 15000, experienceRequired: 180 }
    ]
  },
  CREATIVE: {
    name: 'Creative',
    icon: '🎨',
    aiVulnerability: 0.50,
    futureProofScore: 55,
    specialMechanic: 'AI generates content but humans still curate',
    levels: [
      { title: 'Junior Designer', baseSalary: 3500, experienceRequired: 0 },
      { title: 'Designer', baseSalary: 5000, experienceRequired: 24 },
      { title: 'Senior Designer', baseSalary: 7000, experienceRequired: 48 },
      { title: 'Art Director', baseSalary: 9000, experienceRequired: 84 },
      { title: 'Creative Director', baseSalary: 12000, experienceRequired: 120 },
      { title: 'Chief Creative Officer', baseSalary: 18000, experienceRequired: 180 }
    ]
  },
  ENTREPRENEUR: {
    name: 'Entrepreneur',
    icon: '🚀',
    aiVulnerability: 0.20,
    futureProofScore: 85,
    specialMechanic: 'AI is your workforce multiplier. High ceiling.',
    levels: [
      { title: 'Startup Founder', baseSalary: 2000, experienceRequired: 0 },
      { title: 'Small Business Owner', baseSalary: 5000, experienceRequired: 24 },
      { title: 'Growing Business', baseSalary: 8000, experienceRequired: 48 },
      { title: 'Established Business', baseSalary: 12000, experienceRequired: 84 },
      { title: 'Multi-Business Owner', baseSalary: 20000, experienceRequired: 120 },
      { title: 'Serial Entrepreneur', baseSalary: 35000, experienceRequired: 180 }
    ]
  },
  GOVERNMENT: {
    name: 'Government',
    icon: '🏛️',
    aiVulnerability: 0.35,
    futureProofScore: 70,
    specialMechanic: 'Slow to change. Good benefits and pension.',
    levels: [
      { title: 'Entry Clerk', baseSalary: 3500, experienceRequired: 0 },
      { title: 'Specialist', baseSalary: 4500, experienceRequired: 24 },
      { title: 'Senior Specialist', baseSalary: 5500, experienceRequired: 48 },
      { title: 'Supervisor', baseSalary: 7000, experienceRequired: 84 },
      { title: 'Manager', baseSalary: 8500, experienceRequired: 120 },
      { title: 'Director', baseSalary: 11000, experienceRequired: 180 }
    ]
  },
  SALES: {
    name: 'Sales',
    icon: '📈',
    aiVulnerability: 0.55,
    futureProofScore: 50,
    specialMechanic: 'Transactional sales automated. Relationship sales safe.',
    levels: [
      { title: 'Sales Rep', baseSalary: 3500, experienceRequired: 0 },
      { title: 'Account Executive', baseSalary: 5500, experienceRequired: 24 },
      { title: 'Senior AE', baseSalary: 8000, experienceRequired: 48 },
      { title: 'Sales Manager', baseSalary: 10000, experienceRequired: 84 },
      { title: 'Regional Director', baseSalary: 14000, experienceRequired: 120 },
      { title: 'VP of Sales', baseSalary: 22000, experienceRequired: 180 }
    ]
  }
};

// ============================================
// LIFESTYLE OPTIONS
// ============================================
export const LIFESTYLE_OPTS: { [key in Lifestyle]: { cost: number; happiness: number; description: string; icon: string } } = {
  FRUGAL: { cost: 1500, happiness: -10, description: 'Minimal spending. Roommates, rice & beans.', icon: '🏚️' },
  MODEST: { cost: 2500, happiness: 0, description: 'Basic apartment, cooking at home.', icon: '🏠' },
  COMFORTABLE: { cost: 4000, happiness: 10, description: 'Nice place, occasional dining out.', icon: '🏡' },
  AFFLUENT: { cost: 6500, happiness: 20, description: 'Upscale living, travel, fine dining.', icon: '🏢' },
  LUXURIOUS: { cost: 12000, happiness: 25, description: 'Premium everything. Live like royalty.', icon: '🏰' }
};

// ============================================
// MARKET ITEMS (INVESTMENTS)
// ============================================
export const MARKET_ITEMS: MarketItem[] = [
  // SAVINGS
  { id: 'hysa', name: 'High-Yield Savings', type: AssetType.SAVINGS, price: 1000, expectedYield: 0.045, volatility: 0, risk: 'VERY_LOW', description: 'FDIC insured savings account', educationalNote: 'Start here! Safe and liquid.', industry: 'banking' },
  { id: 'cd', name: '12-Month CD', type: AssetType.SAVINGS, price: 5000, expectedYield: 0.05, volatility: 0, risk: 'VERY_LOW', description: 'Certificate of deposit, locked for 1 year', industry: 'banking' },
  { id: 'mma', name: 'Money Market Account', type: AssetType.SAVINGS, price: 2500, expectedYield: 0.042, volatility: 0.01, risk: 'VERY_LOW', description: 'Higher yield than basic savings', industry: 'banking' },
  
  // BONDS
  { id: 'tbill', name: 'Treasury Bills', type: AssetType.BOND, price: 1000, expectedYield: 0.05, volatility: 0.02, risk: 'VERY_LOW', description: 'US Government short-term debt', educationalNote: 'Backed by US Government. Very safe.', industry: 'government' },
  { id: 'ibond', name: 'I-Bonds', type: AssetType.BOND, price: 1000, expectedYield: 0.055, volatility: 0.01, risk: 'VERY_LOW', description: 'Inflation-protected savings bonds', industry: 'government' },
  { id: 'corpbond', name: 'Corporate Bond Fund', type: AssetType.BOND, price: 2000, expectedYield: 0.065, volatility: 0.05, risk: 'LOW', description: 'Diversified corporate bonds', industry: 'diversified' },
  { id: 'muni', name: 'Municipal Bonds', type: AssetType.BOND, price: 5000, expectedYield: 0.04, volatility: 0.03, risk: 'LOW', description: 'Tax-advantaged local government bonds', industry: 'government' },
  
  // INDEX FUNDS
  { id: 'sp500', name: 'S&P 500 Index', type: AssetType.INDEX_FUND, price: 500, expectedYield: 0.10, volatility: 0.15, risk: 'MEDIUM', description: 'Top 500 US companies', educationalNote: 'Best long-term investment for most people.', industry: 'diversified' },
  { id: 'total', name: 'Total Stock Market', type: AssetType.INDEX_FUND, price: 400, expectedYield: 0.095, volatility: 0.16, risk: 'MEDIUM', description: 'Entire US stock market', industry: 'diversified' },
  { id: 'intl', name: 'International Index', type: AssetType.INDEX_FUND, price: 300, expectedYield: 0.08, volatility: 0.18, risk: 'MEDIUM', description: 'Non-US developed markets', industry: 'international' },
  { id: 'emerging', name: 'Emerging Markets', type: AssetType.INDEX_FUND, price: 250, expectedYield: 0.11, volatility: 0.25, risk: 'HIGH', description: 'Developing economies', industry: 'international' },
  { id: 'reit', name: 'REIT Index Fund', type: AssetType.INDEX_FUND, price: 500, expectedYield: 0.08, volatility: 0.18, risk: 'MEDIUM', description: 'Real estate investment trusts', industry: 'real_estate' },
  
  // STOCKS
  { id: 'techgiant', name: 'Tech Giant Stock', type: AssetType.STOCK, price: 3500, expectedYield: 0.12, volatility: 0.25, risk: 'HIGH', description: 'Major technology company', industry: 'technology' },
  { id: 'dividend', name: 'Dividend Aristocrat', type: AssetType.STOCK, price: 1500, expectedYield: 0.08, volatility: 0.12, risk: 'MEDIUM', description: '25+ years of dividend growth', educationalNote: 'Stable income from established companies.', industry: 'diversified' },
  { id: 'growth', name: 'Growth Stock', type: AssetType.STOCK, price: 800, expectedYield: 0.15, volatility: 0.35, risk: 'HIGH', description: 'High-growth potential company', industry: 'technology' },
  { id: 'biotech', name: 'Biotech Stock', type: AssetType.STOCK, price: 600, expectedYield: 0.18, volatility: 0.45, risk: 'VERY_HIGH', description: 'Cutting-edge medical research', industry: 'healthcare' },
  { id: 'energy', name: 'Energy Stock', type: AssetType.STOCK, price: 1200, expectedYield: 0.09, volatility: 0.30, risk: 'HIGH', description: 'Oil & gas company', industry: 'energy' },
  { id: 'bank', name: 'Bank Stock', type: AssetType.STOCK, price: 900, expectedYield: 0.07, volatility: 0.22, risk: 'MEDIUM', description: 'Major financial institution', industry: 'banking' },

  // ==============================
  // Mid-tier diversification picks
  // ==============================
  { id: 'bond_ladder_mid', name: 'Bond Ladder (5-year)', type: AssetType.BOND, price: 8000, expectedYield: 0.075, volatility: 0.04, risk: 'LOW', tier: 'MID', riskRating: 'LOW', description: 'Staggered bond maturities for steadier income', educationalNote: 'Smooths interest rate risk.', industry: 'diversified' },
  { id: 'private_credit', name: 'Private Credit Fund', type: AssetType.BOND, price: 15000, expectedYield: 0.11, volatility: 0.08, risk: 'HIGH', tier: 'MID', riskRating: 'HIGH', description: 'Higher yield lending to mid-market firms', educationalNote: 'Illiquid but strong cash flow.', industry: 'diversified' },
  { id: 'reit_lite', name: 'REIT-lite Basket', type: AssetType.INDEX_FUND, price: 9000, expectedYield: 0.085, volatility: 0.14, risk: 'MEDIUM', tier: 'MID', riskRating: 'MEDIUM', description: 'Smaller REIT bundle focused on rentals', industry: 'real_estate' },
  { id: 'dividend_etf', name: 'Dividend ETF', type: AssetType.INDEX_FUND, price: 6000, expectedYield: 0.075, volatility: 0.12, risk: 'MEDIUM', tier: 'MID', riskRating: 'MEDIUM', description: 'Income-focused equity fund', industry: 'diversified' },
  { id: 'fractional_rental', name: 'Fractional Rental Share', type: AssetType.REAL_ESTATE, price: 20000, expectedYield: 0.09, volatility: 0.10, risk: 'MEDIUM', tier: 'MID', riskRating: 'MEDIUM', description: 'Own part of a rental property portfolio', educationalNote: 'Real estate cashflow without a mortgage.', industry: 'real_estate' },
  { id: 'micro_saas', name: 'Micro-SaaS Revenue Share', type: AssetType.BUSINESS, price: 12000, expectedYield: 0.14, volatility: 0.28, volatilityRange: { min: 0.2, max: 0.4 }, risk: 'HIGH', tier: 'MID', riskRating: 'HIGH', description: 'Revenue share in a niche software product', educationalNote: 'Great upside, but churn risk.', industry: 'technology' },
  { id: 'community_solar', name: 'Community Solar Share', type: AssetType.BUSINESS, price: 9000, expectedYield: 0.10, volatility: 0.12, risk: 'MEDIUM', tier: 'MID', riskRating: 'MEDIUM', description: 'Small stake in a local solar array', industry: 'energy' },
  { id: 'farmland_share', name: 'Farmland Share', type: AssetType.COMMODITY, price: 11000, expectedYield: 0.07, volatility: 0.16, risk: 'MEDIUM', tier: 'MID', riskRating: 'MEDIUM', description: 'Income from crop leases and land appreciation', industry: 'commodities' },

  // Education-locked opportunities
  { id: 'angel_syndicate', name: 'Angel Syndicate Access', type: AssetType.BUSINESS, price: 40000, expectedYield: 0.13, volatility: 0.35, risk: 'HIGH', tier: 'ADVANCED', riskRating: 'HIGH', description: 'Access to early-stage startup deal flow', educationalNote: 'Unlocked with an MBA or advanced business education.', industry: 'technology', requiredEducationCategory: ['BUSINESS'], requiredEducationLevel: 'MBA' },
  { id: 'medtech_royalty', name: 'MedTech Royalty Stream', type: AssetType.STOCK, price: 28000, expectedYield: 0.11, volatility: 0.22, risk: 'MEDIUM', tier: 'ADVANCED', riskRating: 'MEDIUM', description: 'Royalty participation in approved medical devices', educationalNote: 'Unlocked with a healthcare master\'s level education.', industry: 'healthcare', requiredEducationCategory: ['HEALTHCARE'], requiredEducationLevel: 'MASTER' },

  // CRYPTO
  { id: 'btc', name: 'Bitcoin', type: AssetType.CRYPTO, price: 500, expectedYield: 0.20, volatility: 0.60, risk: 'VERY_HIGH', description: 'Digital gold', educationalNote: 'Extremely volatile. Only invest what you can lose.', industry: 'crypto' },
  { id: 'eth', name: 'Ethereum', type: AssetType.CRYPTO, price: 300, expectedYield: 0.25, volatility: 0.70, risk: 'EXTREME', description: 'Smart contract platform', industry: 'crypto' },
  { id: 'altcoin', name: 'Altcoin Basket', type: AssetType.CRYPTO, price: 100, expectedYield: 0.30, volatility: 0.85, risk: 'EXTREME', description: 'Mix of alternative cryptos', industry: 'crypto' },
  
  // COMMODITIES
  { id: 'gold', name: 'Gold ETF', type: AssetType.COMMODITY, price: 2000, expectedYield: 0.04, volatility: 0.12, risk: 'MEDIUM', description: 'Physical gold exposure', educationalNote: 'Hedge against inflation and uncertainty.', industry: 'commodities' },
  { id: 'silver', name: 'Silver ETF', type: AssetType.COMMODITY, price: 500, expectedYield: 0.05, volatility: 0.20, risk: 'MEDIUM', description: 'Industrial and precious metal', industry: 'commodities' },
  
  // REAL ESTATE (can be mortgaged)
  { id: 'starter_home', name: 'Starter Home', type: AssetType.REAL_ESTATE, price: 180000, expectedYield: 0.06, volatility: 0.08, risk: 'MEDIUM', description: '2BR/1BA starter home', educationalNote: 'Build equity instead of paying rent.', industry: 'real_estate', canMortgage: true, mortgageOptions: ['conventional_20', 'conventional_10', 'fha'] },
  { id: 'condo', name: 'Investment Condo', type: AssetType.REAL_ESTATE, price: 250000, expectedYield: 0.07, volatility: 0.10, risk: 'MEDIUM', description: 'Rental condo in growing area', industry: 'real_estate', canMortgage: true, mortgageOptions: ['conventional_20', 'investment_25', 'investment_20'] },
  { id: 'duplex', name: 'Duplex', type: AssetType.REAL_ESTATE, price: 350000, expectedYield: 0.08, volatility: 0.10, risk: 'MEDIUM', description: 'House hack - live in one, rent the other', educationalNote: 'Great way to start in real estate!', industry: 'real_estate', canMortgage: true, mortgageOptions: ['conventional_20', 'fha', 'investment_25'] },
  { id: 'sfh_rental', name: 'Single Family Rental', type: AssetType.REAL_ESTATE, price: 280000, expectedYield: 0.075, volatility: 0.09, risk: 'MEDIUM', description: 'Traditional rental property', industry: 'real_estate', canMortgage: true, mortgageOptions: ['conventional_20', 'investment_25', 'investment_20'] },
  { id: 'small_apt', name: 'Small Apartment Building', type: AssetType.REAL_ESTATE, price: 800000, expectedYield: 0.09, volatility: 0.12, risk: 'HIGH', description: '6-unit apartment building', industry: 'real_estate', canMortgage: true, mortgageOptions: ['investment_25', 'investment_20'] },
  { id: 'commercial', name: 'Commercial Property', type: AssetType.REAL_ESTATE, price: 1200000, expectedYield: 0.10, volatility: 0.15, risk: 'HIGH', description: 'Retail/office space', industry: 'real_estate', canMortgage: true, mortgageOptions: ['investment_25'] },
  
  // BUSINESSES
  { id: 'vending', name: 'Vending Route', type: AssetType.BUSINESS, price: 15000, expectedYield: 0.15, volatility: 0.20, risk: 'MEDIUM', description: '10 vending machines', educationalNote: 'Semi-passive income. Requires restocking.', industry: 'retail' },
  { id: 'laundromat', name: 'Laundromat', type: AssetType.BUSINESS, price: 200000, expectedYield: 0.18, volatility: 0.15, risk: 'MEDIUM', description: 'Self-service laundry facility', industry: 'services' },
  { id: 'carwash', name: 'Car Wash', type: AssetType.BUSINESS, price: 350000, expectedYield: 0.16, volatility: 0.18, risk: 'HIGH', description: 'Automated car wash business', industry: 'services' },
  { id: 'franchise', name: 'Fast Food Franchise', type: AssetType.BUSINESS, price: 500000, expectedYield: 0.14, volatility: 0.20, risk: 'HIGH', description: 'Established brand franchise', industry: 'food' },
  { id: 'ecommerce', name: 'E-Commerce Store', type: AssetType.BUSINESS, price: 50000, expectedYield: 0.25, volatility: 0.40, risk: 'HIGH', description: 'Online retail business', industry: 'technology' },
  { id: 'saas', name: 'SaaS Startup', type: AssetType.BUSINESS, price: 100000, expectedYield: 0.35, volatility: 0.50, risk: 'VERY_HIGH', description: 'Software as a service company', industry: 'technology' }
];

// ============================================
// MORTGAGE OPTIONS
// ============================================
export const MORTGAGE_OPTIONS: MortgageOption[] = [
  { id: 'conventional_20', name: 'Conventional 20% Down', downPaymentPercent: 20, interestRateSpread: 0, termYears: 30, description: 'Best rates, no PMI', requirements: { netWorth: 50000 } },
  { id: 'conventional_10', name: 'Conventional 10% Down', downPaymentPercent: 10, interestRateSpread: 0.0025, termYears: 30, description: 'Lower down payment, PMI required', requirements: { netWorth: 25000 } },
  { id: 'fha', name: 'FHA Loan (3.5% Down)', downPaymentPercent: 3.5, interestRateSpread: 0.005, termYears: 30, description: 'Government-backed, first-time buyers' },
  { id: 'investment_25', name: 'Investment Property 25%', downPaymentPercent: 25, interestRateSpread: 0.0075, termYears: 30, description: 'For rental properties', requirements: { netWorth: 100000, income: 5000 } },
  { id: 'investment_20', name: 'Investment Property 20%', downPaymentPercent: 20, interestRateSpread: 0.01, termYears: 30, description: 'Investment with lower down', requirements: { netWorth: 75000, income: 4000 } }
];

// ============================================
// EDUCATION OPTIONS
// ============================================
export const EDUCATION_OPTIONS: EducationOption[] = [
  // STEM
  { id: 'coding_bootcamp', name: 'Coding Bootcamp', icon: '💻', category: 'STEM', level: 'CERTIFICATE', cost: 15000, duration: 6, salaryBoost: 1.15, description: 'Intensive programming training', relevantCareers: ['TECH', 'ENTREPRENEUR'] },
  { id: 'bs_cs', name: 'BS Computer Science', icon: '🎓', category: 'STEM', level: 'BACHELOR', cost: 80000, duration: 48, salaryBoost: 1.45, description: 'Four-year computer science degree', relevantCareers: ['TECH', 'ENTREPRENEUR'] },
  { id: 'ms_cs', name: 'MS Computer Science', icon: '🎓', category: 'STEM', level: 'MASTER', cost: 60000, duration: 24, salaryBoost: 1.25, description: 'Advanced CS degree', relevantCareers: ['TECH'], requirements: ['BACHELOR'] },
  { id: 'bs_engineering', name: 'BS Engineering', icon: '⚙️', category: 'STEM', level: 'BACHELOR', cost: 90000, duration: 48, salaryBoost: 1.40, description: 'Engineering degree', relevantCareers: ['TECH', 'TRADES', 'ENTREPRENEUR'] },
  { id: 'data_science_cert', name: 'Data Science Certificate', icon: '📊', category: 'STEM', level: 'CERTIFICATE', cost: 12000, duration: 6, salaryBoost: 1.12, description: 'Data analysis and ML basics', relevantCareers: ['TECH', 'FINANCE'] },
  { id: 'aiml_cert', name: 'AI/ML Certificate', icon: '🤖', category: 'STEM', level: 'CERTIFICATE', cost: 18000, duration: 9, salaryBoost: 1.18, description: 'Artificial intelligence specialization', relevantCareers: ['TECH'] },
  
  // BUSINESS
  { id: 'bs_business', name: 'BS Business Admin', icon: '📈', category: 'BUSINESS', level: 'BACHELOR', cost: 60000, duration: 48, salaryBoost: 1.30, description: 'Business administration degree', relevantCareers: ['FINANCE', 'SALES', 'ENTREPRENEUR', 'GOVERNMENT'] },
  { id: 'bs_finance', name: 'BS Finance', icon: '💰', category: 'BUSINESS', level: 'BACHELOR', cost: 70000, duration: 48, salaryBoost: 1.35, description: 'Finance degree', relevantCareers: ['FINANCE', 'ENTREPRENEUR'] },
  { id: 'mba', name: 'MBA', icon: '🎯', category: 'BUSINESS', level: 'MBA', cost: 120000, duration: 24, salaryBoost: 1.75, description: 'Master of Business Administration', relevantCareers: ['FINANCE', 'SALES', 'ENTREPRENEUR', 'TECH', 'GOVERNMENT'], requirements: ['BACHELOR'] },
  { id: 'cfa', name: 'CFA Certification', icon: '📜', category: 'BUSINESS', level: 'CERTIFICATE', cost: 8000, duration: 18, salaryBoost: 1.20, description: 'Chartered Financial Analyst', relevantCareers: ['FINANCE'] },
  
  // HEALTHCARE
  { id: 'med_assistant', name: 'Medical Assistant Cert', icon: '🩺', category: 'HEALTHCARE', level: 'CERTIFICATE', cost: 8000, duration: 12, salaryBoost: 1.10, description: 'Entry-level healthcare', relevantCareers: ['HEALTHCARE'] },
  { id: 'adn', name: 'Associate Nursing', icon: '👩‍⚕️', category: 'HEALTHCARE', level: 'ASSOCIATE', cost: 25000, duration: 24, salaryBoost: 1.25, description: 'RN qualification', relevantCareers: ['HEALTHCARE'] },
  { id: 'bsn', name: 'BSN Nursing', icon: '🏥', category: 'HEALTHCARE', level: 'BACHELOR', cost: 80000, duration: 48, salaryBoost: 1.40, description: 'Bachelor of Science in Nursing', relevantCareers: ['HEALTHCARE'] },
  { id: 'md', name: 'Medical Degree (MD)', icon: '⚕️', category: 'HEALTHCARE', level: 'MEDICAL', cost: 300000, duration: 96, salaryBoost: 3.0, description: 'Become a physician', relevantCareers: ['HEALTHCARE'], requirements: ['BACHELOR'] },
  
  // TRADES
  { id: 'hvac_cert', name: 'HVAC Certification', icon: '❄️', category: 'TRADES', level: 'CERTIFICATE', cost: 5000, duration: 6, salaryBoost: 1.15, description: 'Heating and cooling systems', relevantCareers: ['TRADES'] },
  { id: 'electrician', name: 'Electrician Apprenticeship', icon: '⚡', category: 'TRADES', level: 'CERTIFICATE', cost: 3000, duration: 12, salaryBoost: 1.20, description: 'Licensed electrician training', relevantCareers: ['TRADES'] },
  { id: 'plumbing', name: 'Plumbing License', icon: '🔧', category: 'TRADES', level: 'CERTIFICATE', cost: 4000, duration: 12, salaryBoost: 1.18, description: 'Licensed plumber training', relevantCareers: ['TRADES'] },
  { id: 'contractor', name: 'General Contractor License', icon: '🏗️', category: 'TRADES', level: 'CERTIFICATE', cost: 8000, duration: 6, salaryBoost: 1.30, description: 'Run your own contracting business', relevantCareers: ['TRADES', 'ENTREPRENEUR'], requirements: ['CERTIFICATE'] },
  
  // CREATIVE
  { id: 'graphic_design', name: 'Graphic Design Cert', icon: '🎨', category: 'CREATIVE', level: 'CERTIFICATE', cost: 10000, duration: 6, salaryBoost: 1.12, description: 'Visual design fundamentals', relevantCareers: ['CREATIVE'] },
  { id: 'ba_design', name: 'BA Design', icon: '✏️', category: 'CREATIVE', level: 'BACHELOR', cost: 70000, duration: 48, salaryBoost: 1.30, description: 'Design degree', relevantCareers: ['CREATIVE'] },
  { id: 'mfa', name: 'MFA Fine Arts', icon: '🖼️', category: 'CREATIVE', level: 'MASTER', cost: 80000, duration: 24, salaryBoost: 1.20, description: 'Master of Fine Arts', relevantCareers: ['CREATIVE'], requirements: ['BACHELOR'] },
  
  // LIBERAL ARTS
  { id: 'ba_psychology', name: 'BA Psychology', icon: '🧠', category: 'LIBERAL_ARTS', level: 'BACHELOR', cost: 55000, duration: 48, salaryBoost: 1.10, description: 'Psychology degree', relevantCareers: ['HEALTHCARE', 'GOVERNMENT'] },
  { id: 'ba_english', name: 'BA English', icon: '📚', category: 'LIBERAL_ARTS', level: 'BACHELOR', cost: 50000, duration: 48, salaryBoost: 1.05, description: 'English degree', relevantCareers: ['CREATIVE'] },
  
  // LAW
  { id: 'jd', name: 'Law Degree (JD)', icon: '⚖️', category: 'LAW', level: 'LAW', cost: 180000, duration: 36, salaryBoost: 1.80, description: 'Juris Doctor degree', relevantCareers: ['GOVERNMENT', 'FINANCE', 'ENTREPRENEUR'], requirements: ['BACHELOR'] }
];

// ============================================
// SIDE HUSTLES
// ============================================
export const SIDE_HUSTLES: SideHustle[] = [
  { id: 'rideshare', name: 'Rideshare Driver', icon: '🚗', description: 'Drive for Uber/Lyft', incomeRange: { min: 800, max: 2000 }, hoursPerWeek: 15, startupCost: 0, energyCost: 15, stressIncrease: 10, aiVulnerability: 0.70 },
  { id: 'delivery', name: 'Food Delivery', icon: '🍔', description: 'DoorDash, UberEats, etc.', incomeRange: { min: 600, max: 1500 }, hoursPerWeek: 12, startupCost: 0, energyCost: 12, stressIncrease: 8, aiVulnerability: 0.60 },
  { id: 'freelance_writing', name: 'Freelance Writing', icon: '✍️', description: 'Content writing and copywriting', incomeRange: { min: 500, max: 3000 }, hoursPerWeek: 10, startupCost: 0, energyCost: 10, stressIncrease: 12, aiVulnerability: 0.80 },
  { id: 'freelance_dev', name: 'Freelance Web Dev', icon: '💻', description: 'Build websites and apps', incomeRange: { min: 1500, max: 5000 }, hoursPerWeek: 15, startupCost: 500, energyCost: 15, stressIncrease: 15, aiVulnerability: 0.50, requiredEducation: ['STEM'],
    milestones: [
      {
        monthsRequired: 3,
        options: [
          { id: 'AUTOMATE', label: 'Automate delivery', description: 'Templates, scripts, and AI tooling reduce your workload.', cost: 1200, effects: { energyMultiplier: 0.75, stressMultiplier: 0.9, incomeMultiplier: 1.05 } },
          { id: 'HIRE_HELP', label: 'Hire a VA', description: 'Delegate admin work; some income becomes passive.', cost: 2000, effects: { incomeMultiplier: 0.9, passiveIncomeShare: 0.35 } },
          { id: 'MANUAL', label: 'Stay hands-on', description: 'Keep it manual for higher active income.', cost: 0, effects: { incomeMultiplier: 1.15 } }
        ]
      },
      {
        monthsRequired: 6,
        options: [
          { id: 'AUTOMATE', label: 'Productized pipeline', description: 'Standardize delivery with strong systems.', cost: 3200, effects: { energyMultiplier: 0.65, stressMultiplier: 0.85, incomeMultiplier: 1.08 } },
          { id: 'HIRE_HELP', label: 'Hire a contractor', description: 'Offload delivery; more income becomes passive.', cost: 6500, effects: { incomeMultiplier: 0.9, passiveIncomeShare: 0.55 } },
          { id: 'MANUAL', label: 'Stay boutique', description: 'Charge premium rates and do the work yourself.', cost: 0, effects: { incomeMultiplier: 1.2, stressMultiplier: 1.05 } }
        ]
      }
    ] },
  { id: 'tutoring', name: 'Online Tutoring', icon: '📖', description: 'Teach students online', incomeRange: { min: 800, max: 2500 }, hoursPerWeek: 10, startupCost: 0, energyCost: 8, stressIncrease: 5, aiVulnerability: 0.40 },
  { id: 'handyman', name: 'Handyman Services', icon: '🔨', description: 'Home repairs and fixes', incomeRange: { min: 1000, max: 3000 }, hoursPerWeek: 12, startupCost: 500, energyCost: 18, stressIncrease: 8, aiVulnerability: 0.05 },
  { id: 'photography', name: 'Event Photography', icon: '📸', description: 'Weddings and events', incomeRange: { min: 1000, max: 4000 }, hoursPerWeek: 8, startupCost: 2000, energyCost: 10, stressIncrease: 12, aiVulnerability: 0.30 },
  { id: 'consulting', name: 'Business Consulting', icon: '💼', description: 'Advise small businesses', incomeRange: { min: 2000, max: 8000 }, hoursPerWeek: 10, startupCost: 0, energyCost: 12, stressIncrease: 15, aiVulnerability: 0.35, requiredEducation: ['BUSINESS'] },
  { id: 'exec_coaching', name: 'Executive Coaching', icon: '🧭', description: 'Coach teams and founders', incomeRange: { min: 3000, max: 9000 }, hoursPerWeek: 8, startupCost: 500, energyCost: 10, stressIncrease: 12, aiVulnerability: 0.25, requiredCareerLevel: 4 },
  { id: 'ecommerce', name: 'E-Commerce Store', icon: '🛒', description: 'Sell products online', incomeRange: { min: 200, max: 5000 }, hoursPerWeek: 15, startupCost: 1000, energyCost: 12, stressIncrease: 18, aiVulnerability: 0.25,
    milestones: [
      {
        monthsRequired: 3,
        options: [
          { id: 'AUTOMATE', label: 'Automate ops', description: 'Order automation reduces your time cost.', cost: 800, effects: { energyMultiplier: 0.8, stressMultiplier: 0.9, incomeMultiplier: 1.03 } },
          { id: 'HIRE_HELP', label: 'Hire fulfillment help', description: 'Delegate packing; some income turns passive.', cost: 1500, effects: { incomeMultiplier: 0.92, passiveIncomeShare: 0.3 } },
          { id: 'MANUAL', label: 'Stay manual', description: 'More hands-on effort, higher active income.', cost: 0, effects: { incomeMultiplier: 1.12 } }
        ]
      },
      {
        monthsRequired: 6,
        options: [
          { id: 'AUTOMATE', label: 'Marketing automation', description: 'Optimized ads and funnels reduce time cost.', cost: 2600, effects: { energyMultiplier: 0.7, stressMultiplier: 0.85, incomeMultiplier: 1.06 } },
          { id: 'HIRE_HELP', label: 'Outsource fulfillment', description: 'Partner with a 3PL for passive-heavy income.', cost: 4800, effects: { incomeMultiplier: 0.9, passiveIncomeShare: 0.55 } },
          { id: 'MANUAL', label: 'Stay hands-on', description: 'Higher margin from direct involvement.', cost: 0, effects: { incomeMultiplier: 1.2, stressMultiplier: 1.05 } }
        ]
      }
    ] },
  { id: 'content', name: 'Content Creator', icon: '🎬', description: 'YouTube, TikTok, streaming', incomeRange: { min: 0, max: 10000 }, hoursPerWeek: 20, startupCost: 1500, energyCost: 18, stressIncrease: 20, aiVulnerability: 0.20 },
  { id: 'petsitting', name: 'Pet Sitting/Walking', icon: '🐕', description: 'Care for pets', incomeRange: { min: 500, max: 2000 }, hoursPerWeek: 10, startupCost: 0, energyCost: 10, stressIncrease: 3, aiVulnerability: 0.02 },
  { id: 'real_estate_agent', name: 'Part-Time Real Estate', icon: '🏠', description: 'Help people buy/sell homes', incomeRange: { min: 0, max: 8000 }, hoursPerWeek: 15, startupCost: 2000, energyCost: 15, stressIncrease: 18, aiVulnerability: 0.45 }
];

// ============================================
// AI CAREER IMPACT
// ============================================
export const AI_CAREER_IMPACT: { [key in CareerPath]: { vulnerability: number; futureProofScore: number; phases: { year: number; impact: number; message: string }[]; adaptations: string[] } } = {
  TECH: {
    vulnerability: 0.40,
    futureProofScore: 65,
    phases: [
      { year: 2025, impact: 1.0, message: 'AI assists coding' },
      { year: 2027, impact: 0.95, message: 'Junior roles shrinking' },
      { year: 2030, impact: 0.85, message: 'AI handles routine development' },
      { year: 2035, impact: 0.75, message: 'Only senior/architect roles safe' }
    ],
    adaptations: ['Learn AI/ML', 'Focus on architecture', 'Move to management']
  },
  FINANCE: {
    vulnerability: 0.60,
    futureProofScore: 45,
    phases: [
      { year: 2025, impact: 0.95, message: 'AI assists analysis' },
      { year: 2028, impact: 0.75, message: 'Robo-advisors dominate retail' },
      { year: 2032, impact: 0.55, message: 'AI handles most trading' },
      { year: 2035, impact: 0.40, message: 'Only relationship roles remain' }
    ],
    adaptations: ['Focus on relationships', 'Move to private wealth', 'Learn fintech']
  },
  HEALTHCARE: {
    vulnerability: 0.15,
    futureProofScore: 95,
    phases: [
      { year: 2025, impact: 1.0, message: 'AI assists diagnostics' },
      { year: 2030, impact: 1.05, message: 'Demand increases' },
      { year: 2035, impact: 1.10, message: 'Human care premium' }
    ],
    adaptations: ['Specialize', 'Move to administration', 'Telemedicine']
  },
  TRADES: {
    vulnerability: 0.10,
    futureProofScore: 98,
    phases: [
      { year: 2025, impact: 1.0, message: 'Robots cant fix pipes' },
      { year: 2030, impact: 1.10, message: 'Shortage drives wages up' },
      { year: 2035, impact: 1.20, message: 'Essential workers premium' }
    ],
    adaptations: ['Get licensed', 'Start own business', 'Specialize in smart home']
  },
  CREATIVE: {
    vulnerability: 0.50,
    futureProofScore: 55,
    phases: [
      { year: 2025, impact: 0.90, message: 'AI generates content' },
      { year: 2028, impact: 0.75, message: 'Commoditization of design' },
      { year: 2032, impact: 0.60, message: 'Only human creativity valued' }
    ],
    adaptations: ['Focus on strategy', 'Build personal brand', 'Learn AI tools']
  },
  ENTREPRENEUR: {
    vulnerability: 0.20,
    futureProofScore: 85,
    phases: [
      { year: 2025, impact: 1.0, message: 'AI multiplies productivity' },
      { year: 2028, impact: 1.10, message: 'Smaller teams, bigger output' },
      { year: 2032, impact: 1.20, message: 'One-person unicorns possible' }
    ],
    adaptations: ['Leverage AI tools', 'Focus on unique value', 'Build AI-native businesses']
  },
  GOVERNMENT: {
    vulnerability: 0.35,
    futureProofScore: 70,
    phases: [
      { year: 2025, impact: 1.0, message: 'Slow to change' },
      { year: 2030, impact: 0.95, message: 'Some automation of admin' },
      { year: 2035, impact: 0.85, message: 'Efficiency mandates hit' }
    ],
    adaptations: ['Move to policy roles', 'Tech modernization', 'Public-private bridge']
  },
  SALES: {
    vulnerability: 0.55,
    futureProofScore: 50,
    phases: [
      { year: 2025, impact: 0.95, message: 'AI handles lead gen' },
      { year: 2028, impact: 0.80, message: 'Transactional sales automated' },
      { year: 2032, impact: 0.60, message: 'Only complex B2B safe' }
    ],
    adaptations: ['Move to enterprise sales', 'Focus on relationships', 'Learn consultative selling']
  }
};

// ============================================
// LIFE EVENTS / SCENARIOS
// ============================================
export const LIFE_EVENTS: Scenario[] = [
  // === TAX EVENTS ===
  {
    id: 'annual_taxes',
    image: '/event-images/annual_taxes.webp',
    title: '📋 Tax Season: The Reckoning',
    description: 'April 15th approaches. The IRS is waiting. Your receipts are... somewhere. Maybe in that shoebox?',
    category: 'TAX',
    isRecurring: true,
    weight: 100,
    options: [
      { label: 'Pay in full like a responsible adult 💳', outcome: { cashChange: -1, message: 'Taxes paid! The IRS sends their regards. (Just kidding, they never send anything nice.)', statChanges: { stress: -5 } } },
      { label: 'Payment plan (+10% penalty) 📅', outcome: { cashChange: -1, message: 'Payment plan approved! You and the IRS are now on monthly talking terms.', statChanges: { stress: 5 } } }
    ],
    conditions: { minMonth: 4 }
  },
  {
    id: 'tax_audit',
    image: '/event-images/tax_audit.webp',
    title: '🔍 The IRS Would Like a Word',
    description: 'Congratulations! You\'ve been "randomly" selected for an audit. Your search history for "is X tax deductible" did NOT go unnoticed.',
    category: 'TAX',
    weight: 5,
    options: [
      { label: 'Hire a professional ($2,000) 🧑‍💼', outcome: { cashChange: -2000, message: 'Your accountant speaks fluent IRS. Crisis averted. They also judged your receipts organization system.', statChanges: { stress: 10 } } },
      { label: 'DIY: How hard can it be? 🤷', outcome: { cashChange: -5000, message: 'Turns out, pretty hard. The IRS found "creative interpretations" of tax law. Penalties applied.', statChanges: { stress: 25, financialIQ: 5 } } }
    ],
    conditions: { minMonth: 24, minNetWorth: 50000 }
  },
  
  // === LEGAL ISSUES ===
  {
    id: 'fender_bender_lawsuit',
    title: '⚖️ Surprise! You\'re Being Sued!',
    description: 'Remember that minor fender bender? The other driver now has "chronic pain" and a lawyer cousin. Cool.',
    image: '/event-images/fender_bender_lawsuit.webp',
    category: 'LEGAL',
    weight: 8,
    options: [
      { label: 'Settle for $5K to make it go away 💰', outcome: { cashChange: -5000, message: 'Settled. Their "chronic pain" was miraculously cured the moment the check cleared.', statChanges: { stress: 10 } } },
      { label: 'See you in court! ⚔️', outcome: { cashChange: -8000, message: 'You won! Justice prevailed! Legal fees... did not care about justice.', statChanges: { stress: 20, happiness: 5 } } },
      { label: 'Let insurance deal with it 📋', outcome: { cashChange: -1000, message: 'Insurance handled it. Your premiums are now higher. They remember. They always remember.', statChanges: { stress: 5 } } }
    ],
    conditions: { minMonth: 12, requiresVehicle: true }
  },
  {
    id: 'contract_dispute',
    image: '/event-images/contract_dispute.webp',
    title: '📜 Blast from the Past',
    description: 'Remember that guy from 3 years ago? Neither do you. But he has paperwork. And lawyers.',
    category: 'LEGAL',
    weight: 6,
    options: [
      { label: 'Hire lawyer and fight ($10,000)', outcome: { cashChange: -10000, message: 'Case dismissed. Reputation intact.', statChanges: { stress: 15, networking: 5 } } },
      { label: 'Settle for $15,000', outcome: { cashChange: -15000, message: 'Paid to make it go away.', statChanges: { stress: 10 } } },
      { label: 'Ignore it', outcome: { cashChange: -25000, message: 'Default judgment against you.', statChanges: { stress: 30, networking: -10 } } }
    ],
    conditions: { minMonth: 36, careers: ['ENTREPRENEUR', 'SALES'] }
  },
  {
    id: 'property_dispute',
    image: '/event-images/property_dispute.webp',
    title: '🏠 Property Line Dispute',
    description: 'Your neighbor claims your fence is on their property and is threatening legal action.',
    category: 'LEGAL',
    weight: 5,
    options: [
      { label: 'Get survey and settle ($3,000)', outcome: { cashChange: -3000, message: 'Survey resolved the dispute.', statChanges: { stress: 5 } } },
      { label: 'Move the fence ($1,500)', outcome: { cashChange: -1500, message: 'Moved fence to avoid conflict.', statChanges: { stress: 3, happiness: -5 } } }
    ],
    conditions: { minNetWorth: 100000 }
  },
  
  // === FAMILY EMERGENCIES ===
  {
    id: 'parent_illness',
    image: '/event-images/parent_illness.webp',
    title: '🏥 Parent Hospitalized',
    description: 'Your parent had a health scare. They\'re okay but the hospital bill looks like a phone number. With a country code.',
    category: 'FAMILY_EMERGENCY',
    weight: 12,
    options: [
      { label: 'Cover the bills ($8,000) 💝', outcome: { cashChange: -8000, message: 'Mom is recovering and already asking when you\'re getting married. Some things never change.', statChanges: { happiness: 10, stress: 15, fulfillment: 15 } } },
      { label: 'Help what you can ($4,000) 🤝', outcome: { cashChange: -4000, message: 'Partial help provided. Dad said "thanks" which is basically a declaration of love from him.', statChanges: { happiness: 5, stress: 10, fulfillment: 5 } } },
      { label: 'Can\'t afford it right now 😔', outcome: { cashChange: 0, message: 'Guilt hits different at 3am. Your therapy bills may increase.', statChanges: { happiness: -15, stress: 20, fulfillment: -10 } } }
    ],
    conditions: { minMonth: 24 }
  },
  {
    id: 'sibling_trouble',
    image: '/event-images/sibling_trouble.webp',
    title: '👨‍👩‍👧 Sibling SOS',
    description: 'Your sibling lost their job and is about to be evicted. They promise to pay you back. They also promised to return your hoodie in 2016.',
    category: 'FAMILY_EMERGENCY',
    weight: 10,
    options: [
      { label: 'Loan them $5,000 💸', outcome: { cashChange: -5000, message: 'Family first! They\'ll totally pay you back. (Narrator: They would not pay them back. At least not for a while.)', statChanges: { fulfillment: 10, happiness: 5 } } },
      { label: 'Gift $2,000 (realistic expectations) 🎁', outcome: { cashChange: -2000, message: 'Called it a gift. No awkward Thanksgiving conversations about repayment. Big brain move.', statChanges: { fulfillment: 5, financialIQ: 5 } } },
      { label: 'Can\'t do it. Sorry. 🙁', outcome: { cashChange: 0, message: 'They\'re disappointed. Christmas dinner will be... interesting this year.', statChanges: { happiness: -5, stress: 10 } } }
    ],
    conditions: { minMonth: 18 }
  },
  {
    id: 'funeral',
    image: '/event-images/funeral.webp',
    title: '⚰️ Family Funeral',
    description: 'A family member passed away. Time to travel, grieve, and explain to distant relatives why you\'re still not married.',
    category: 'FAMILY_EMERGENCY',
    weight: 8,
    options: [
      { label: 'Cover full costs ($6,000) 🕊️', outcome: { cashChange: -6000, message: 'Honored their memory. Uncle Jerry still cornered you about his MLM business at the wake though.', statChanges: { happiness: -10, fulfillment: 15, stress: 15 } } },
      { label: 'Contribute what you can ($2,000) 🤝', outcome: { cashChange: -2000, message: 'Family pooled resources. Someone made a spreadsheet. Of course someone made a spreadsheet.', statChanges: { happiness: -10, fulfillment: 5, stress: 10 } } }
    ],
    conditions: { minMonth: 12 }
  },
  
  // === MEDICAL EMERGENCIES ===
  {
    id: 'appendicitis',
    image: '/event-images/appendicitis.webp',
    title: '🚑 Surprise! Your Organs Hate You!',
    description: 'Your appendix decided to self-destruct. Very dramatic. Zero warning. Now you have a fun hospital story!',
    category: 'MEDICAL',
    weight: 8,
    options: [
      { label: 'Use insurance ($3,000 deductible) 🏥', outcome: { cashChange: -3000, message: 'Surgery successful! You now have a cool scar and 2 weeks of guilt-free Netflix binging.', statChanges: { health: -10, energy: -20, stress: 15 } } },
      { label: 'No insurance - pay full ($25,000) 💀', outcome: { cashChange: -25000, message: 'Surgery successful! Your bank account, however, did not survive. RIP savings.', statChanges: { health: -10, energy: -20, stress: 30 }, addLiability: { name: 'Medical Debt', balance: 25000, originalBalance: 25000, interestRate: 0.08, monthlyPayment: 500, type: 'MEDICAL_DEBT' } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'sports_injury',
    image: '/event-images/sports_injury.webp',
    title: '🤕 Your Body Has Betrayed You',
    description: 'You said "I\'m not as young as I used to be" but your brain disagreed. Torn ACL at the company softball game. Worth it? No.',
    category: 'MEDICAL',
    weight: 6,
    options: [
      { label: 'Get surgery ($5,000 after insurance) 🏥', outcome: { cashChange: -5000, message: 'Surgery scheduled. You now have a legitimate excuse to skip sports forever. Silver lining!', statChanges: { health: -15, energy: -25, stress: 10 } } },
      { label: 'Physical therapy only ($2,000) 💪', outcome: { cashChange: -2000, message: 'Managing with PT. Your knee now predicts rain. You\'re basically a wizard.', statChanges: { health: -25, energy: -10, stress: 5 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'dental_emergency',
    title: '🦷 Dental Disaster!',
    description: 'You bit into a "soft" granola bar and your tooth said "peace out." The crunch was NOT the granola. Now you look like a hockey player.',
    category: 'MEDICAL',
    weight: 7,
    image: '/event-dental.png',
    options: [
      { label: 'Get the crown ($2,500) 👑', outcome: { cashChange: -2500, message: 'Your dentist is now driving a new BMW. He named it after you. "Thanks for the down payment!"', statChanges: { health: 5, stress: 5, happiness: 5 } } },
      { label: 'Just yank it ($500) 🔧', outcome: { cashChange: -500, message: 'The dentist had a little too much fun with those pliers. Your Tinder profile just got... interesting.', statChanges: { health: -5, happiness: -10 } } },
      { label: 'Super glue it yourself ($5) 🤡', outcome: { cashChange: -5, message: 'It worked! For 3 hours. Then it didn\'t. You\'re now eating soup for a week. Worth it? Debatable.', statChanges: { health: -15, happiness: -15, stress: 10, financialIQ: -5 } } }
    ],
    conditions: { minMonth: 12, maxOccurrences: 2 }
  },
  {
    id: 'wisdom_teeth',
    title: '🦷 Wisdom Teeth Rebellion',
    description: 'Your wisdom teeth have decided to throw a party and everyone\'s invited... except your jaw. And your sleep. And your will to live.',
    category: 'MEDICAL',
    weight: 5,
    image: '/event-dental.png',
    options: [
      { label: 'Remove all four ($3,000) 🏥', outcome: { cashChange: -3000, message: 'You now look like a chipmunk storing nuts for winter. Your friends have MANY jokes. So many jokes.', statChanges: { health: 10, stress: 10 } } },
      { label: 'Just the painful ones ($1,500) 💉', outcome: { cashChange: -1500, message: 'Saved money now, but those other teeth are plotting revenge... you can feel them judging you.', statChanges: { health: 5, stress: 5 } } },
      { label: 'Pain meds and prayers ($50) 🙏', outcome: { cashChange: -50, message: 'You\'ve mastered the art of chewing on one side. Your jaw is now lopsided. You tell people it\'s "character."', statChanges: { health: -10, stress: 15, happiness: -5 } } }
    ],
    conditions: { minMonth: 6, maxOccurrences: 1 }
  },
  {
    id: 'root_canal',
    title: '🦷 Root Canal Time!',
    description: 'That tooth you\'ve been ignoring? It\'s no longer ignoring you. The pain has achieved consciousness.',
    category: 'MEDICAL',
    weight: 5,
    image: '/event-dental.png',
    options: [
      { label: 'Root canal + crown ($3,500) 😬', outcome: { cashChange: -3500, message: 'Three hours in the chair. You now know your dentist\'s entire life story. His divorce was messy.', statChanges: { health: 10, stress: 15, happiness: 5 } } },
      { label: 'Just pull it ($600) 🦷', outcome: { cashChange: -600, message: 'Gone forever. You raise a glass (carefully) to your fallen soldier. RIP, molar.', statChanges: { health: 0, happiness: -5 } } },
      { label: 'More ibuprofen. It\'ll be fine. 💊', outcome: { cashChange: -20, message: 'Spoiler: it will not be fine. You\'ll be back. They always come back.', statChanges: { health: -10, stress: 10 } } }
    ],
    conditions: { minMonth: 24, maxOccurrences: 1 }
  },
  {
    id: 'mental_health_crisis',
    image: '/event-images/mental_health_crisis.webp',
    title: '🧠 The Burnout is Real',
    description: 'Your brain has filed a formal complaint. The Sunday Scaries are now the Every-Day Scaries. Time to address this.',
    category: 'MEDICAL',
    weight: 15,
    isRecurring: true,
    options: [
      { label: 'Start therapy ($300/mo) 🛋️', outcome: { cashChange: -900, message: 'Your therapist is great. You now have coping mechanisms AND someone who has to listen to your rants. Win-win!', statChanges: { happiness: 15, stress: -20, energy: 10 } } },
      { label: 'Take a break (2 weeks unpaid) 🏖️', outcome: { cashChange: -1, message: 'You watched an entire TV series. Slept. Actually SLEPT. You forgot what that felt like. Revolutionary.', statChanges: { happiness: 10, stress: -30, energy: 25 } } },
      { label: 'Just push through 💪', outcome: { cashChange: 0, message: 'You said you\'re fine. You\'re not fine. The twitch in your eye has entered the chat.', statChanges: { happiness: -15, stress: 20, health: -10, energy: -15 } } }
    ],
    conditions: { minMonth: 18 }
  },
  
  // === ECONOMIC EVENTS ===
  {
    id: 'recession_starts',
    title: '📉 It\'s Happening!',
    description: 'The economy has officially entered a recession. Markets are down 25%. Your coworker who only talks about crypto is suspiciously quiet.',
    image: '/event-images/recession_starts.webp',
    category: 'ECONOMIC',
    weight: 8,
    options: [
      { label: 'Stay the course 💎', outcome: { cashChange: 0, message: 'Holding steady! Your financial advisor says "long-term perspective." You say "I\'m panicking internally."', statChanges: { stress: 15, financialIQ: 5 } } },
      { label: 'Panic sell everything 📉', outcome: { cashChange: 0, message: 'Sold at the bottom. You\'ll see memes about people like you in 3 years. Congrats.', statChanges: { stress: 25, financialIQ: -5 } } },
      { label: 'BUY THE DIP! 🚀', outcome: { cashChange: -5000, message: 'Either future you will thank present you, or future you will write a cautionary blog post. Time will tell!', statChanges: { stress: 10, financialIQ: 10 } } }
    ],
    conditions: { minMonth: 24 }
  },
  {
    id: 'layoff_wave',
    image: '/event-images/layoff_wave.webp',
    title: '🏢 The Chopping Block',
    description: 'Your company is laying off 20% of staff. HR sent a "we need to talk" meeting invite. For 4pm Friday. Ominous.',
    category: 'ECONOMIC',
    weight: 12,
    options: [
      { label: 'Work 80-hour weeks 💪', outcome: { cashChange: 0, message: 'Survived! You now have a nervous twitch and a coffee dependency that could concern doctors. Worth it?', statChanges: { stress: 25, energy: -20, happiness: 5 } } },
      { label: 'Update LinkedIn at 2am 🔍', outcome: { cashChange: 0, message: 'Found a new job! Your boss\'s face when you resigned was... interesting. Very satisfying.', statChanges: { stress: 15, networking: 10 } } },
      { label: 'Vibes. Just vibes. 🧘', outcome: { cashChange: 0, message: 'Somehow survived. You don\'t know how. Nobody knows how. You might be unkillable.', statChanges: { stress: 20, happiness: 5 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'job_loss',
    image: '/event-images/layoff_wave.webp',
    title: '📎 Position Eliminated',
    description: 'It\'s official: your role was eliminated. No salary income for the next 4 months. This is why emergency funds exist.',
    category: 'ECONOMIC',
    weight: 7,
    options: [
      {
        label: 'Accept severance (2 weeks pay) + file for unemployment 🧾',
        outcome: {
          jobLossMonths: 4,
          cashChangeSalaryMonths: 0.5,
          message: 'You were laid off. You got a small severance and filed the paperwork. Your salary will be $0 for 4 months — protect your runway.',
          statChanges: { stress: 18, happiness: -12, energy: -6 }
        }
      },
      {
        label: 'Negotiate a better severance package 🤝',
        outcome: {
          jobLossMonths: 4,
          cashChangeSalaryMonths: 1,
          message: 'You negotiated a better severance. Your salary will be $0 for 4 months — keep expenses tight and avoid new debt if you can.',
          statChanges: { stress: 22, happiness: -8, networking: 6 }
        }
      },
      {
        label: 'Start gig work immediately to bridge the gap ☕',
        outcome: {
          jobLossMonths: 4,
          cashChange: 1200,
          message: 'You picked up short-term gigs (+$1,200). Your main salary will still be $0 for 4 months — build (or preserve) your emergency fund.',
          statChanges: { stress: 12, energy: -12, happiness: -6 }
        }
      }
    ],
    conditions: { minMonth: 12, maxOccurrences: 2 }
  },
  {
    id: 'inflation_spike',
    image: '/event-images/inflation_spike.webp',
    title: '💸 Everything is Expensive Now',
    description: 'Inflation hit 8%. Your grocery bill looks like a mortgage payment. An avocado costs $4. AN AVOCADO.',
    category: 'ECONOMIC',
    weight: 8,
    options: [
      { label: 'Rice and beans lifestyle 🫘', outcome: { cashChange: 0, message: 'Your meal prep game is now legendary. Your Instagram is just pictures of rice.', statChanges: { happiness: -5, stress: 5 } } },
      { label: 'March into boss\'s office 💼', outcome: { cashChange: 0, message: 'Got a 5% raise! Still doesn\'t cover inflation but... moral victory?', statChanges: { happiness: 5, stress: 5 } } },
      { label: 'Credit cards go brrrr 💳', outcome: { cashChange: 0, message: 'Future you is going to have FEELINGS about this decision.', statChanges: { stress: 15 }, addLiability: { name: 'Credit Card', balance: 5000, originalBalance: 5000, interestRate: 0.22, monthlyPayment: 200, type: 'CREDIT_CARD' } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'market_crash',
    image: '/event-images/market_crash.webp',
    title: '💥 Markets Go BRRR (Downward)',
    description: 'Stock market dropped 35%. Your portfolio looks like a crime scene. Financial news anchors are stress-sweating.',
    category: 'ECONOMIC',
    weight: 3,
    options: [
      { label: 'Diamond hands! 💎🙌', outcome: { cashChange: 0, message: 'Didn\'t sell. Either you\'re a genius or you just forgot your password. Time will tell.', statChanges: { stress: 20, financialIQ: 10 } } },
      { label: 'Sell half, sleep better 😴', outcome: { cashChange: 0, message: 'Reduced exposure. Your therapist is proud. Your portfolio... less so.', statChanges: { stress: 15 } } },
      { label: 'BUY THE DIP! 📈', outcome: { cashChange: -10000, message: 'You either catch a falling knife or you catch a falling opportunity. Results pending.', statChanges: { stress: 25, financialIQ: 5 } } }
    ],
    conditions: { minMonth: 48, minNetWorth: 50000 }
  },
  {
    id: 'housing_bubble',
    image: '/event-images/housing_bubble.webp',
    title: '🏠 Housing Market Oopsie',
    description: 'Real estate prices just fell 20%. Your home value dropped. Your Zillow refresh addiction isn\'t helping.',
    category: 'ECONOMIC',
    weight: 4,
    options: [
      { label: 'It\'s fine. Everything is fine. 🔥', outcome: { cashChange: 0, message: 'Long-term holder energy. You can\'t lose if you never sell, right? RIGHT?', statChanges: { stress: 15 } } },
      { label: 'TIME TO BUY MORE! 🏘️', outcome: { cashChange: -50000, message: 'Either brilliant or delusional. Real estate investors say the same thing about themselves.', statChanges: { stress: 20, financialIQ: 10 } } }
    ],
    conditions: { minMonth: 60, minNetWorth: 200000 }
  },
  
  // === VEHICLE ISSUES ===
  {
    id: 'car_breakdown',
    title: '🚗 Car Has Left the Chat',
    description: 'Your car made a sound like a dying whale playing a saxophone, then smoke, then silence. The mechanic laughed. Actually LAUGHED. Then called his buddies to come look.',
    image: '/event-images/car_breakdown.webp',
    category: 'VEHICLE',
    weight: 45,
    isRecurring: true,
    options: [
      { label: 'Repair it ($3,500) 🔧', outcome: { cashChange: -3500, message: 'Fixed! The mechanic named your car "Money Pit." He has a framed photo of it in his shop. Says he\'ll see you soon. Ominous.', statChanges: { stress: 10 } } },
      { label: 'Buy a used car ($8,000) 🚙', outcome: { cashChange: -8000, message: 'It\'s "pre-loved!" The previous owner left a McDonald\'s receipt from 2019, three hair ties, and a self-help audiobook in the glovebox. Character!', statChanges: { stress: 5, happiness: 5 } } },
      { label: 'Finance a new car ($25,000) ✨', outcome: { cashChange: -2500, message: 'That new car smell! You drove 10 under the speed limit for a week. Made a "no eating" rule. Broke it on day 3.', statChanges: { happiness: 10 }, addLiability: { name: 'Car Loan', balance: 22500, originalBalance: 22500, interestRate: 0.07, monthlyPayment: 450, type: 'CAR_LOAN' } } },
      { label: 'Public transit life 🚌', outcome: { cashChange: 0, message: 'You now know every bus driver by name. Jerry shares his lunch. Karen tells you about her cats. It\'s oddly fulfilling.', statChanges: { happiness: -10, energy: -10, stress: 10, networking: 5 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'flat_tire',
    title: '🛞 Flat Tire Fiasco',
    description: 'Your tire decided to quit without two weeks notice. Very unprofessional. You\'re on the side of the highway. In the rain. Of course it\'s raining.',
    image: '/event-images/flat_tire.webp',
    category: 'VEHICLE',
    weight: 40,
    isRecurring: true,
    options: [
      { label: 'Call roadside assistance ($150) 📞', outcome: { cashChange: -150, message: 'Help arrived in 2 hours. You befriended three passing truckers and a confused deer in that time.', statChanges: { stress: 10, networking: 5 } } },
      { label: 'Change it yourself (free but risky) 💪', outcome: { cashChange: 0, message: 'You did it! You\'re filthy. Your clothes are ruined. But you feel ALIVE. Take THAT, AAA!', statChanges: { stress: 15, happiness: 10, health: -5, fulfillment: 10 } } },
      { label: 'Uber home, deal with it tomorrow ($80) 🚕', outcome: { cashChange: -80, message: 'The Uber driver had OPINIONS about your life choices. 1 star. But you\'re home and dry.', statChanges: { stress: 5 } } }
    ],
    conditions: { minMonth: 3 }
  },
  {
    id: 'car_accident',
    title: '💥 Bumper Kissing Incident',
    description: 'Someone rear-ended you at a stoplight. They were texting. About their car insurance. The irony is not lost on you.',
    image: '/event-images/car_accident.webp',
    category: 'VEHICLE',
    weight: 20,
    options: [
      { label: 'Their insurance covers it 📋', outcome: { cashChange: 0, message: 'Insurance handled it! You got a rental. It\'s a Kia Soul. You\'re 28. The hamster commercials haunt you.', statChanges: { stress: 10 } } },
      { label: 'They were uninsured ($4,000) 😱', outcome: { cashChange: -4000, message: 'They had an "I ❤️ MY CAR" bumper sticker. They did not, apparently, love car insurance. Or math.', statChanges: { stress: 20, happiness: -10 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'car_theft',
    image: '/event-images/car_theft.webp',
    title: '🚨 Grand Theft Auto: Your Life',
    description: 'Your car was stolen. The thief left the aux cord. And your gym bag. That\'s somehow more insulting than the theft.',
    category: 'VEHICLE',
    weight: 10,
    options: [
      { label: 'File insurance claim 📝', outcome: { cashChange: 0, message: 'Insurance paying out in 30 days. Currently driving your mom\'s car. It has a "My Kid is an Honor Student" bumper sticker. You\'re 34.', statChanges: { stress: 25 } } },
      { label: 'No insurance - total loss 😭', outcome: { cashChange: 0, message: 'They found your car. In a lake. With a mannequin in the driver seat. HOW? WHY? The mystery haunts you at 3am.', statChanges: { stress: 35, happiness: -20 } } }
    ],
    conditions: { minMonth: 12 }
  },
  
  // === RELATIONSHIP / MARRIAGE ===
  {
    id: 'meet_partner',
    image: '/event-images/meet_partner.webp',
    title: '💕 Plot Twist: Love Interest Appears',
    description: 'You\'ve met someone who actually laughs at your jokes. They might be "the one." Or they\'re just really polite.',
    category: 'RELATIONSHIP',
    weight: 15,
    options: [
      { label: 'Invest in the relationship 💝', outcome: { cashChange: -500, message: 'Fancy dinners, thoughtful gifts, matching pajamas. You\'re now one of THOSE couples. You\'re happy though!', statChanges: { happiness: 20, fulfillment: 15, stress: -5 }, startRelationship: true } },
      { label: 'Keep it casual 🤷', outcome: { cashChange: -200, message: 'Taking it slow. You\'ve perfected the "what are we?" conversation avoidance technique.', statChanges: { happiness: 10, fulfillment: 5 }, startRelationship: true } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'proposal',
    title: '💍 The Big Question',
    description: 'Your relationship has reached the "sharing Netflix passwords" level of serious. Time to make it official?',
    image: '/event-images/proposal.webp',
    category: 'RELATIONSHIP',
    weight: 10,
    options: [
      { label: 'Go big! ($5,000 ring) 💎', outcome: { cashChange: -5000, message: 'They said YES! The ring could be seen from space. Your bank account wept quietly.', statChanges: { happiness: 30, fulfillment: 25, stress: 10 }, marriageChange: true } },
      { label: 'Modest but meaningful ($1,500) 💕', outcome: { cashChange: -1500, message: 'They said YES! They loved that you didn\'t go into debt. Keeper confirmed.', statChanges: { happiness: 25, fulfillment: 20, stress: 5 }, marriageChange: true } },
      { label: 'Not ready yet 😅', outcome: { cashChange: 0, message: 'Still dating. Your mom is "not pressuring you, just asking." Every. Single. Call.', statChanges: { happiness: -5 } } }
    ],
    conditions: { minMonth: 36, requiresMarriage: false }
  },
  {
    id: 'wedding_planning',
    image: '/event-images/wedding_planning.webp',
    title: '💒 Wedding: The Expensive Episode',
    description: 'Time to plan the wedding! Pinterest has taken over your life. Your partner has opinions. Your mother has MORE opinions.',
    category: 'RELATIONSHIP',
    weight: 100,
    options: [
      { label: 'Dream wedding ($35,000) ✨', outcome: { cashChange: -35000, message: 'Ice sculptures! Live band! A cake taller than your uncle! Worth every penny (you keep telling yourself).', statChanges: { happiness: 25, fulfillment: 20, stress: 20 } } },
      { label: 'Nice wedding ($15,000) 🎉', outcome: { cashChange: -15000, message: 'Beautiful celebration! Only minor drama with the seating chart. Nobody talked about the chicken vs fish debate. Much.', statChanges: { happiness: 20, fulfillment: 15, stress: 10 } } },
      { label: 'Simple ceremony ($3,000)', outcome: { cashChange: -3000, message: 'Intimate and meaningful.', statChanges: { happiness: 15, fulfillment: 15, stress: 5 } } },
      { label: 'Courthouse ($500)', outcome: { cashChange: -500, message: 'Officially married! Saved a fortune.', statChanges: { happiness: 10, fulfillment: 10, financialIQ: 5 } } }
    ],
    conditions: { requiresMarriage: true }
  },
  {
    id: 'spouse_job_change',
    title: '💼 Spouse Career Change',
    description: 'Your spouse has an opportunity for a new job.',
    image: '/event-images/spouse_job_change.webp',
    category: 'RELATIONSHIP',
    weight: 10,
    options: [
      { label: 'Support the change', outcome: { cashChange: 0, message: 'New job means higher family income!', statChanges: { happiness: 10, fulfillment: 5 } } },
      { label: 'They stay at current job', outcome: { cashChange: 0, message: 'Stability maintained.', statChanges: { happiness: 0 } } }
    ],
    conditions: { requiresMarriage: true, minMonth: 12 }
  },
  
  // === CHILDREN ===
  {
    id: 'expecting_child',
    image: '/event-images/expecting_child.webp',
    title: '👶 Baby on the Way!',
    description: 'Congratulations! You\'re expecting a baby in 9 months!',
    category: 'RELATIONSHIP',
    weight: 12,
    options: [
      { label: 'Celebrate and prepare!', outcome: { cashChange: -3000, message: 'Nursery ready! So excited!', statChanges: { happiness: 25, fulfillment: 30, stress: 15 }, childChange: 1 } }
    ],
    conditions: { requiresMarriage: true, minMonth: 24 }
  },
  {
    id: 'child_sick',
    image: '/event-images/child_sick.webp',
    title: '🤒 Child is Sick',
    description: 'Your child is sick and needs to see the doctor.',
    category: 'FAMILY_EMERGENCY',
    weight: 15,
    options: [
      { label: 'Doctor visit ($200 copay)', outcome: { cashChange: -200, message: 'Just a bug. Medicine prescribed.', statChanges: { stress: 10, happiness: -5 } } },
      { label: 'ER visit - seems serious ($800)', outcome: { cashChange: -800, message: 'All clear, but better safe than sorry.', statChanges: { stress: 20, happiness: -10 } } }
    ],
    conditions: { requiresChildren: true }
  },
  {
    id: 'child_school',
    title: '🎒 School Shopping: The Reckoning',
    description: 'Your child needs 47 specific folders, 3 types of scissors, and something called a "protractor." For first grade.',
    image: '/event-images/child_school.webp',
    category: 'RELATIONSHIP',
    weight: 10,
    options: [
      { label: 'Private school ($1,500/mo) 🎩', outcome: { cashChange: -1500, message: 'The other parents drive Teslas. They have opinions about quinoa. You fit right in. (You don\'t.)', statChanges: { fulfillment: 10, networking: 10 } } },
      { label: 'Public school (free) 📚', outcome: { cashChange: 0, message: 'Good schools! Your kid made 3 friends on day one. They\'re already planning a band. It\'s called "The Screaming Potatoes."', statChanges: { fulfillment: 5, happiness: 5 } } }
    ],
    conditions: { requiresChildren: true }
  },
  {
    id: 'child_activities',
    image: '/event-images/child_activities.webp',
    title: '⚽ The Activity Arms Race',
    description: 'Your kid wants to do soccer. And ballet. And piano. And coding. And interpretive dance. They\'re 6.',
    category: 'RELATIONSHIP',
    weight: 12,
    options: [
      { label: 'Sign up for everything ($400/mo) 🏃', outcome: { cashChange: -400, message: 'You now live in your car, shuttling between activities. You\'ve mastered the art of eating dinner at 4pm. Or 9pm. Time is meaningless.', statChanges: { happiness: 10, fulfillment: 15, energy: -15 } } },
      { label: 'Pick ONE activity ($100/mo) 🎯', outcome: { cashChange: -100, message: 'They chose underwater basket weaving. It\'s... not a thing. But they\'re happy!', statChanges: { happiness: 5, fulfillment: 10 } } },
      { label: 'Backyard Olympics (free) 🏅', outcome: { cashChange: 0, message: 'You invented 12 new sports. "Extreme Hopscotch" is now a family tradition. Patent pending.', statChanges: { happiness: 5, fulfillment: 5 } } }
    ],
    conditions: { requiresChildren: true }
  },
  {
    id: 'child_college',
    title: '🎓 Empty Nest: Loading...',
    description: 'Your child got into college! They\'re excited. You\'re crying. This is fine.',
    image: '/event-images/child_college.webp',
    category: 'RELATIONSHIP',
    weight: 8,
    options: [
      { label: 'Pay full tuition ($25,000/yr) 💳', outcome: { cashChange: -25000, message: 'They called to thank you. Then asked for grocery money. Then "fun money." Then textbook money. The calls continue.', statChanges: { fulfillment: 25, happiness: 15 } } },
      { label: 'Help with half 🤝', outcome: { cashChange: -12500, message: 'Fair is fair. They got a part-time job at Starbucks. You get free coffee now. The system works.', statChanges: { fulfillment: 15, happiness: 10, financialIQ: 5 } } },
      { label: 'They take loans 📋', outcome: { cashChange: 0, message: 'Teaching financial responsibility! (That\'s what you tell yourself at 3am.)', statChanges: { fulfillment: 5, happiness: -5 } } }
    ],
    conditions: { requiresChildren: true, minMonth: 216 }
  },
  
  // === WINDFALLS ===
  {
    id: 'inheritance',
    title: '📜 Surprise Inheritance!',
    description: 'Your great-aunt Mildred (who you met once at a wedding in 1997) has left you money. You were her "favorite."',
    image: '/event-images/inheritance.webp',
    category: 'WINDFALL',
    weight: 4,
    options: [
      { label: 'Accept inheritance 💰', outcome: { cashChange: 25000, message: 'Thanks, Aunt Mildred! Turns out she was impressed when you helped her find the bathroom. Small gestures matter.', statChanges: { happiness: 10, fulfillment: 5 } } }
    ],
    conditions: { minMonth: 36 }
  },
  {
    id: 'lottery_small',
    title: '🎰 Scratch Ticket Victory!',
    description: 'You bought a scratch ticket ironically. You won... UN-ironically.',
    image: '/event-images/lottery_small.webp',
    category: 'WINDFALL',
    weight: 3,
    options: [
      { label: 'Collect $5,000!', outcome: { cashChange: 5000, message: 'Lucky day!', statChanges: { happiness: 15 } } }
    ]
  },
  {
    id: 'work_bonus',
    title: '🎉 Surprise Bonus',
    description: 'Your company had a great quarter and is giving out bonuses!',
    image: '/event-images/work_bonus.webp',
    category: 'WINDFALL',
    weight: 10,
    options: [
      { label: 'Accept bonus', outcome: { cashChange: 5000, message: 'Hard work paid off!', statChanges: { happiness: 10, fulfillment: 5 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'tax_refund',
    title: '💵 Tax Refund',
    description: 'You overpaid taxes last year. Here\'s your refund!',
    image: '/event-images/tax_refund.webp',
    category: 'WINDFALL',
    weight: 15,
    options: [
      { label: 'Direct deposit please!', outcome: { cashChange: 2500, message: 'Refund received!', statChanges: { happiness: 5 } } }
    ],
    conditions: { minMonth: 6 }
  },
  
  // === AI DISRUPTION ===
  {
    id: 'ai_restructure',
    title: '🤖 AI Restructuring',
    description: 'Your company is replacing some roles with AI. Restructuring announced.',
    image: '/event-images/ai_restructure.webp',
    category: 'AI_DISRUPTION',
    weight: 10,
    options: [
      { label: 'Embrace AI - learn to use it', outcome: { cashChange: -1000, message: 'Became the AI expert on your team!', statChanges: { financialIQ: 10, happiness: 5 } } },
      { label: 'Hope your job is safe', outcome: { cashChange: 0, message: 'Survived this round...', statChanges: { stress: 20 } } },
      { label: 'Start job hunting', outcome: { cashChange: 0, message: 'Found a more stable position.', statChanges: { stress: 15, networking: 5 } } }
    ],
    conditions: { aiDisruptionLevel: 30, careers: ['TECH', 'FINANCE', 'CREATIVE', 'SALES'] }
  },
  {
    id: 'ai_opportunity',
    title: '🚀 AI Creates Opportunity',
    description: 'AI tools are making workers more productive. Your output has doubled!',
    image: '/event-images/ai_opportunity.webp',
    category: 'AI_DISRUPTION',
    weight: 8,
    options: [
      { label: 'Ask for raise', outcome: { cashChange: 0, message: 'Got a 15% raise!', statChanges: { happiness: 15, fulfillment: 10 } } },
      { label: 'Take on more clients (side hustle)', outcome: { cashChange: 2000, message: 'Doubled your freelance income!', statChanges: { energy: -15, happiness: 10 } } }
    ],
    conditions: { aiDisruptionLevel: 20, careers: ['TECH', 'ENTREPRENEUR', 'CREATIVE'] }
  },
  {
    id: 'trades_boom',
    title: '🔧 Trades Shortage Crisis',
    description: 'White-collar jobs being automated, but no one can find a plumber! Rates soaring.',
    image: '/event-images/trades_boom.webp',
    category: 'AI_DISRUPTION',
    weight: 8,
    options: [
      { label: 'Enjoy the demand!', outcome: { cashChange: 3000, message: 'Premium rates for your skills!', statChanges: { happiness: 15, fulfillment: 10 } } }
    ],
    conditions: { aiDisruptionLevel: 40, careers: ['TRADES'] }
  },
  
  // === HOUSING ===
  {
    id: 'rent_increase',
    image: '/event-images/rent_increase.webp',
    title: '📈 Rent Increase',
    description: 'Your landlord is raising rent by 15%.',
    category: 'HOUSING',
    weight: 12,
    options: [
      { label: 'Accept the increase', outcome: { cashChange: 0, message: 'Rent now higher. Budget adjusted.', statChanges: { stress: 10, happiness: -5 } } },
      { label: 'Negotiate (risky)', outcome: { cashChange: 0, message: 'Negotiated 8% instead!', statChanges: { stress: 5, networking: 5 } } },
      { label: 'Move out ($3,000 moving costs)', outcome: { cashChange: -3000, message: 'New place! Fresh start.', statChanges: { stress: 15, energy: -15 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'home_repair',
    title: '🏠 Home Repair Needed',
    description: 'Your roof is leaking. Needs immediate repair.',
    image: '/event-images/home_repair.webp',
    category: 'HOUSING',
    weight: 10,
    options: [
      { label: 'Full roof replacement ($12,000)', outcome: { cashChange: -12000, message: 'New roof. Good for 25 years.', statChanges: { stress: 10 } } },
      { label: 'Patch job ($2,000)', outcome: { cashChange: -2000, message: 'Fixed for now. May need more work later.', statChanges: { stress: 5 } } }
    ],
    conditions: { minNetWorth: 100000 }
  },
  {
    id: 'hvac_failure',
    title: '❄️ AC/Heater Broke',
    description: 'Your HVAC system died. It\'s the worst season for this.',
    image: '/event-images/hvac_failure.webp',
    category: 'HOUSING',
    weight: 10,
    options: [
      { label: 'Replace entire system ($8,000)', outcome: { cashChange: -8000, message: 'New efficient system installed.', statChanges: { stress: 10, happiness: 5 } } },
      { label: 'Repair old system ($1,500)', outcome: { cashChange: -1500, message: 'Patched up. May fail again.', statChanges: { stress: 5 } } },
      { label: 'Window units/space heaters ($500)', outcome: { cashChange: -500, message: 'Uncomfortable but functional.', statChanges: { happiness: -10, energy: -10 } } }
    ],
    conditions: { minNetWorth: 50000 }
  },
  
  // === BIG IMPACTFUL EVENTS ===
  {
    id: 'inheritance',
    title: '💰 Inheritance',
    description: 'A distant relative passed away and left you money in their will.',
    image: '/event-images/inheritance.webp',
    category: 'WINDFALL',
    weight: 3,
    options: [
      { label: 'Accept the inheritance', outcome: { cashChange: 50000, message: 'Received $50,000 inheritance!', statChanges: { happiness: 15, stress: -10 } } }
    ],
    conditions: { minMonth: 36 }
  },
  {
    id: 'lottery_win',
    title: '🎰 Lucky Lottery!',
    description: 'You bought a scratch ticket and won big!',
    image: '/event-images/lottery_win.webp',
    category: 'WINDFALL',
    weight: 1,
    options: [
      { label: 'Cash it in!', outcome: { cashChange: 25000, message: 'Won $25,000! Lucky day!', statChanges: { happiness: 30 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'major_bonus',
    title: '🎯 Major Work Bonus',
    description: 'Your company had a record year and is distributing bonuses!',
    image: '/event-images/major_bonus.webp',
    category: 'WINDFALL',
    weight: 5,
    options: [
      { label: 'Collect bonus', outcome: { cashChange: 15000, message: 'Received $15,000 bonus!', statChanges: { happiness: 20, fulfillment: 10 } } }
    ],
    conditions: { minMonth: 24 }
  },
  {
    id: 'stock_options_vest',
    title: '📈 Stock Options Vested',
    description: 'Your company stock options have vested and the stock is up!',
    image: '/event-images/stock_options_vest.webp',
    category: 'WINDFALL',
    weight: 4,
    options: [
      { label: 'Exercise and sell', outcome: { cashChange: 30000, message: 'Cashed out $30,000 in stock options!', statChanges: { happiness: 15, financialIQ: 5 } } },
      { label: 'Hold for more gains (risky)', outcome: { cashChange: 0, message: 'Holding for potential upside. Risky!', statChanges: { stress: 10 } } }
    ],
    conditions: { minMonth: 48, careers: ['TECH', 'FINANCE'] }
  },
  {
    id: 'business_opportunity',
    title: '🚀 Business Opportunity',
    description: 'A friend offers you equity in their startup that just got funded.',
    image: '/event-images/business_opportunity.webp',
    category: 'CAREER',
    weight: 3,
    options: [
      { label: 'Invest $20,000 for equity', outcome: { cashChange: -20000, message: 'Invested in startup. Could be big!', statChanges: { stress: 15, financialIQ: 10 } } },
      { label: 'Pass on it', outcome: { cashChange: 0, message: 'Declined the opportunity.', statChanges: { stress: 0 } } }
    ],
    conditions: { minMonth: 36, minNetWorth: 50000 }
  },
  {
    id: 'major_lawsuit',
    title: '⚖️ Sued for $100K',
    description: 'You\'re being sued for a significant amount. A business dispute has escalated.',
    image: '/event-images/major_lawsuit.webp',
    category: 'LEGAL',
    weight: 2,
    options: [
      { label: 'Settle for $40,000', outcome: { cashChange: -40000, message: 'Settled out of court. Painful but over.', statChanges: { stress: 30, happiness: -20 } } },
      { label: 'Fight it ($25K legal fees)', outcome: { cashChange: -25000, message: 'Won the case! But legal fees hurt.', statChanges: { stress: 40, happiness: 10 } } },
      { label: 'Countersue (risky $50K)', outcome: { cashChange: -50000, message: 'Long legal battle. Stressful victory.', statChanges: { stress: 50, happiness: 5, networking: 10 } } }
    ],
    conditions: { minMonth: 60, minNetWorth: 200000 }
  },
  {
    id: 'identity_theft',
    title: '🔓 Identity Stolen!',
    description: 'Someone stole your identity and racked up charges. Banks are investigating.',
    image: '/event-images/identity_theft.webp',
    category: 'LEGAL',
    weight: 5,
    options: [
      { label: 'Hire fraud specialist ($5,000)', outcome: { cashChange: -5000, message: 'Specialist recovered most losses.', statChanges: { stress: 25 } } },
      { label: 'Handle it yourself', outcome: { cashChange: -15000, message: 'Months of stress. Partial recovery.', statChanges: { stress: 40, energy: -20, happiness: -15 } } }
    ],
    conditions: { minMonth: 24 }
  },
  {
    id: 'major_surgery',
    image: '/event-images/major_surgery.webp',
    title: '🏥 Major Surgery Needed',
    description: 'You need surgery. Even with insurance, out-of-pocket costs are high.',
    category: 'MEDICAL',
    weight: 4,
    options: [
      { label: 'Top surgeon ($20,000 OOP)', outcome: { cashChange: -20000, message: 'Best care. Full recovery.', statChanges: { health: 20, stress: 20, energy: -30 } } },
      { label: 'In-network surgeon ($8,000)', outcome: { cashChange: -8000, message: 'Surgery successful. Recovering well.', statChanges: { health: 10, stress: 15, energy: -20 } } },
      { label: 'Delay surgery (risky)', outcome: { cashChange: 0, message: 'Condition worsening. May cost more later.', statChanges: { health: -15, stress: 25 } } }
    ],
    conditions: { minMonth: 36 }
  },
  {
    id: 'chronic_illness_diagnosis',
    image: '/event-images/chronic_illness_diagnosis.webp',
    title: '💊 Chronic Illness Diagnosis',
    description: 'You\'ve been diagnosed with a chronic condition requiring ongoing treatment.',
    category: 'MEDICAL',
    weight: 3,
    options: [
      { label: 'Premium treatment plan ($1,000/mo)', outcome: { cashChange: -12000, message: 'Annual cost for best management.', statChanges: { health: 5, stress: 20, happiness: -10 } } },
      { label: 'Standard treatment ($400/mo)', outcome: { cashChange: -4800, message: 'Managing condition adequately.', statChanges: { health: 0, stress: 15 } } },
      { label: 'Lifestyle changes only', outcome: { cashChange: 0, message: 'Trying natural approach.', statChanges: { health: -10, stress: 10, energy: -15 } } }
    ],
    conditions: { minMonth: 60 }
  },
  {
    id: 'car_totaled',
    image: '/event-images/car_totaled.webp',
    title: '🚗💥 Car Totaled',
    description: 'Your car was in a major accident. Insurance is paying out but you need a new car.',
    category: 'VEHICLE',
    weight: 4,
    options: [
      { label: 'Buy new car ($35,000)', outcome: { cashChange: -35000, message: 'New reliable car purchased.', statChanges: { stress: 20 } } },
      { label: 'Buy used car ($15,000)', outcome: { cashChange: -15000, message: 'Used car gets the job done.', statChanges: { stress: 15 } } },
      { label: 'Get a beater ($5,000)', outcome: { cashChange: -5000, message: 'Cheap but unreliable. High maintenance.', statChanges: { stress: 10, happiness: -10 } } }
    ],
    conditions: { minMonth: 12, requiresVehicle: true }
  },
  {
    id: 'market_crash_opportunity',
    title: '📉 Market Crash - Buy Opportunity?',
    description: 'Market just crashed 40%. Everything is on sale. But scary!',
    image: '/event-images/market_crash_opportunity.webp',
    category: 'ECONOMIC',
    weight: 2,
    options: [
      { label: 'Go all in! Invest $50,000', outcome: { cashChange: -50000, message: 'Bought at the bottom (hopefully)!', statChanges: { stress: 35, financialIQ: 15 } } },
      { label: 'Invest moderately ($20,000)', outcome: { cashChange: -20000, message: 'Cautious opportunistic buying.', statChanges: { stress: 15, financialIQ: 10 } } },
      { label: 'Stay in cash', outcome: { cashChange: 0, message: 'Cash is king in uncertain times.', statChanges: { stress: 10 } } }
    ],
    conditions: { minMonth: 36, minCash: 50000 }
  },
  {
    id: 'divorce',
    title: '💔 Divorce',
    description: 'Your marriage has ended. Time to divide assets and move on.',
    image: '/event-images/divorce.webp',
    category: 'RELATIONSHIP',
    weight: 2,
    options: [
      { label: 'Amicable split ($15,000 legal)', outcome: { cashChange: -15000, message: 'Clean split. Both moving on.', statChanges: { stress: 40, happiness: -30, fulfillment: -20 } } },
      { label: 'Contested divorce ($50,000)', outcome: { cashChange: -50000, message: 'Brutal fight. Financially devastating.', statChanges: { stress: 60, happiness: -40, energy: -30 } } }
    ],
    conditions: { minMonth: 48, requiresMarriage: true }
  },
  {
    id: 'job_offer_relocation',
    title: '✈️ Dream Job - Requires Moving',
    description: 'Your dream job offer came in! 50% salary increase but requires relocation.',
    image: '/event-images/job_offer_relocation.webp',
    category: 'CAREER',
    weight: 4,
    options: [
      { label: 'Take it! Move! ($15,000 cost)', outcome: { cashChange: -15000, message: 'New city, new adventure! Salary boost coming.', statChanges: { happiness: 20, stress: 25, energy: -20, fulfillment: 20 } } },
      { label: 'Negotiate remote work', outcome: { cashChange: 0, message: 'Got hybrid! 25% raise instead.', statChanges: { happiness: 15, stress: 10, fulfillment: 15 } } },
      { label: 'Decline - family here', outcome: { cashChange: 0, message: 'Stayed for loved ones. No regrets.', statChanges: { happiness: 5, fulfillment: 10, stress: -10 } } }
    ],
    conditions: { minMonth: 36 }
  },
  {
    id: 'tech_layoff',
    title: '📦 Laid Off - Tech Downturn',
    description: 'Company is cutting 20% of staff. You got the email.',
    image: '/event-images/tech_layoff.webp',
    category: 'CAREER',
    weight: 5,
    options: [
      { label: 'Take severance, find new job', outcome: { cashChange: 15000, message: '3 months severance. Job hunting begins.', statChanges: { stress: 40, happiness: -20, energy: -20 } } },
      { label: 'Negotiate extended severance', outcome: { cashChange: 25000, message: 'Negotiated 5 months! Good cushion.', statChanges: { stress: 30, happiness: -10, networking: 10 } } },
      { label: 'Start your own thing', outcome: { cashChange: 10000, message: 'Taking severance and going entrepreneur!', statChanges: { stress: 50, happiness: 10, fulfillment: 20 } } }
    ],
    conditions: { minMonth: 24, careers: ['TECH', 'FINANCE'] }
  },
  {
    id: 'spouse_job_loss',
    title: '👔 Spouse Lost Job',
    description: 'Your spouse was laid off. Income cut significantly.',
    image: '/event-images/spouse_job_loss.webp',
    category: 'FAMILY_EMERGENCY',
    weight: 5,
    options: [
      { label: 'Support while they job hunt', outcome: { cashChange: 0, message: 'Tight budget for 3-6 months.', statChanges: { stress: 25, happiness: -10 } } },
      { label: 'They start a side business', outcome: { cashChange: -5000, message: 'Startup costs for their venture.', statChanges: { stress: 30, fulfillment: 10 } } }
    ],
    conditions: { requiresMarriage: true, minMonth: 24 }
  },
  {
    id: 'parent_nursing_home',
    title: '👴 Parent Needs Care',
    description: 'Your elderly parent can no longer live independently.',
    image: '/event-images/parent_nursing_home.webp',
    category: 'FAMILY_EMERGENCY',
    weight: 4,
    options: [
      { label: 'Nursing home ($5,000/mo)', outcome: { cashChange: -60000, message: 'Quality care. Annual cost.', statChanges: { stress: 25, happiness: -15, fulfillment: 10 } } },
      { label: 'Move in with you', outcome: { cashChange: -10000, message: 'Home modifications. Extra expenses.', statChanges: { stress: 35, happiness: -10, energy: -20, fulfillment: 20 } } },
      { label: 'In-home caregiver ($3,000/mo)', outcome: { cashChange: -36000, message: 'Annual caregiver cost.', statChanges: { stress: 20, fulfillment: 15 } } }
    ],
    conditions: { minMonth: 60 }
  },
  {
    id: 'child_college_decision',
    title: '🎓 Child\'s College Costs',
    description: 'Your child got into their dream school. It\'s expensive.',
    image: '/event-images/child_college_decision.webp',
    category: 'FAMILY_EMERGENCY',
    weight: 3,
    options: [
      { label: 'Pay full tuition ($60,000/yr)', outcome: { cashChange: -60000, message: 'No debt for them. Big sacrifice.', statChanges: { stress: 20, happiness: 15, fulfillment: 25 } } },
      { label: 'Split costs with them', outcome: { cashChange: -30000, message: 'They\'ll take loans for half.', statChanges: { stress: 10, happiness: 10, fulfillment: 15 } } },
      { label: 'Community college first', outcome: { cashChange: -5000, message: 'Frugal approach. 2 years then transfer.', statChanges: { stress: 5, fulfillment: 10 } } }
    ],
    conditions: { minMonth: 180, requiresChildren: true }
  },
  
  // === BUSINESS / ENTREPRENEUR EVENTS ===
  {
    id: 'employee_strike',
    title: '👷 Employee Strike',
    description: 'Your employees are demanding higher wages and threatening to strike.',
    image: '/event-images/employee_strike.webp',
    category: 'BUSINESS',
    weight: 8,
    options: [
      { label: 'Negotiate raise (10% increase)', outcome: { cashChange: -5000, message: 'Raised wages. Happy workers.', statChanges: { stress: 15, happiness: 5 }, negotiateType: 'wage_negotiation' } },
      { label: 'Refuse demands', outcome: { cashChange: 0, message: 'Strike begins. Production halted.', statChanges: { stress: 30, happiness: -15 } } },
      { label: 'Replace workers ($8,000 hiring)', outcome: { cashChange: -8000, message: 'New team hired. Productivity down temporarily.', statChanges: { stress: 25, networking: -10 } } }
    ],
    conditions: { minMonth: 24, careers: ['ENTREPRENEUR'] }
  },
  {
    id: 'business_slow_season',
    title: '📉 Business Slow Season',
    description: 'Economic slowdown is affecting your business. Revenue down 30%.',
    image: '/event-images/business_slow_season.webp',
    category: 'BUSINESS',
    weight: 10,
    options: [
      { label: 'Cut costs aggressively', outcome: { cashChange: 0, message: 'Trimmed expenses. Survived the downturn.', statChanges: { stress: 20, happiness: -10 } } },
      { label: 'Invest in marketing ($5,000)', outcome: { cashChange: -5000, message: 'Marketing brought in new customers!', statChanges: { stress: 15, financialIQ: 5 } } },
      { label: 'Diversify offerings ($10,000)', outcome: { cashChange: -10000, message: 'New revenue streams emerging.', statChanges: { stress: 25, fulfillment: 10 } } }
    ],
    conditions: { minMonth: 18, careers: ['ENTREPRENEUR', 'SALES'] }
  },
  {
    id: 'supplier_price_increase',
    title: '📦 Supplier Price Hike',
    description: 'Your main supplier is raising prices by 25%. Margins will suffer.',
    image: '/event-images/supplier_price_increase.webp',
    category: 'BUSINESS',
    weight: 12,
    options: [
      { label: 'Negotiate better terms', outcome: { cashChange: 0, message: 'Negotiating...', statChanges: { stress: 10 }, negotiateType: 'supplier_negotiation' } },
      { label: 'Find new supplier ($3,000 setup)', outcome: { cashChange: -3000, message: 'New supplier found. Better prices!', statChanges: { stress: 15, networking: 5 } } },
      { label: 'Raise your prices', outcome: { cashChange: 0, message: 'Passed costs to customers. Some left.', statChanges: { stress: 10, happiness: -5 } } }
    ],
    conditions: { minMonth: 12, careers: ['ENTREPRENEUR', 'SALES'] }
  },
  {
    id: 'equipment_failure',
    title: '⚙️ Major Equipment Failure',
    description: 'Critical business equipment has broken down. Operations halted.',
    image: '/event-images/equipment_failure.webp',
    category: 'BUSINESS',
    weight: 8,
    options: [
      { label: 'Replace with new ($15,000)', outcome: { cashChange: -15000, message: 'New equipment. Better efficiency!', statChanges: { stress: 15, fulfillment: 5 } } },
      { label: 'Repair existing ($5,000)', outcome: { cashChange: -5000, message: 'Repaired. May fail again.', statChanges: { stress: 20 } } },
      { label: 'Lease equipment ($800/mo)', outcome: { cashChange: -2400, message: 'Leasing for now. Quarterly cost.', statChanges: { stress: 10 } } }
    ],
    conditions: { minMonth: 24, careers: ['ENTREPRENEUR', 'TRADES'] }
  },
  {
    id: 'key_client_leaves',
    title: '💼 Key Client Leaving',
    description: 'Your biggest client (30% of revenue) is considering leaving for a competitor.',
    image: '/event-images/key_client_leaves.webp',
    category: 'BUSINESS',
    weight: 8,
    options: [
      { label: 'Offer discount to retain', outcome: { cashChange: -3000, message: 'Negotiating retention...', statChanges: { stress: 20 }, negotiateType: 'client_retention' } },
      { label: 'Let them go, find new clients', outcome: { cashChange: -2000, message: 'Lost client. Hustling for new business.', statChanges: { stress: 25, networking: 10 } } },
      { label: 'Match competitor offer exactly', outcome: { cashChange: -5000, message: 'Matched offer. Client stays but margins hurt.', statChanges: { stress: 15, happiness: -5 } } }
    ],
    conditions: { minMonth: 18, careers: ['ENTREPRENEUR', 'SALES'] }
  },
  {
    id: 'business_expansion_opportunity',
    title: '🚀 Expansion Opportunity',
    description: 'Perfect location for a second location just opened up!',
    image: '/event-images/business_expansion_opportunity.webp',
    category: 'BUSINESS',
    weight: 5,
    options: [
      { label: 'Open second location ($50,000)', outcome: { cashChange: -50000, message: 'Expansion underway! Risky but exciting.', statChanges: { stress: 35, fulfillment: 20, energy: -20 } } },
      { label: 'Franchise model ($20,000)', outcome: { cashChange: -20000, message: 'Franchising your concept!', statChanges: { stress: 20, financialIQ: 10 } } },
      { label: 'Focus on current business', outcome: { cashChange: 0, message: 'Staying lean. Maybe next time.', statChanges: { stress: 5 } } }
    ],
    conditions: { minMonth: 48, careers: ['ENTREPRENEUR'], minNetWorth: 100000 }
  },
  {
    id: 'business_partner_dispute',
    title: '🤝 Partner Disagreement',
    description: 'You and your business partner disagree on the company direction.',
    image: '/event-images/business_partner_dispute.webp',
    category: 'BUSINESS',
    weight: 6,
    options: [
      { label: 'Buy them out ($30,000)', outcome: { cashChange: -30000, message: 'Full ownership! Freedom to decide.', statChanges: { stress: 25, fulfillment: 15, happiness: 10 } } },
      { label: 'Sell your share ($25,000)', outcome: { cashChange: 25000, message: 'Cashed out. Moving on.', statChanges: { stress: -10, fulfillment: -20, happiness: 5 } } },
      { label: 'Mediation ($5,000)', outcome: { cashChange: -5000, message: 'Working through differences.', statChanges: { stress: 20, networking: 5 } } }
    ],
    conditions: { minMonth: 36, careers: ['ENTREPRENEUR'] }
  },
  


  // === ASSET OWNER RISKS (Business + Real Estate) ===
  // These scenarios are designed to trigger when the player OWNS the relevant asset type
  // (regardless of their career path). Some details are dynamically tailored at runtime.
  {
    id: 'owned_business_strike',
    title: '🪧 Strike Threat at Your Business',
    description: 'Workers at one of your businesses are threatening a strike. Revenue could take a serious hit.',
    image: '/event-images/owned_business_strike.webp',
    category: 'BUSINESS',
    weight: 5,
    options: [
      { label: 'Negotiate and improve conditions', outcome: { cashChange: -2500, message: 'You negotiate to prevent the strike.', statChanges: { stress: 15, financialIQ: 3 } } },
      { label: 'Hold the line (risk shutdown)', outcome: { cashChange: 0, message: 'You refuse. The situation escalates.', statChanges: { stress: 25, happiness: -8 } } },
      { label: 'Bring in temporary staff', outcome: { cashChange: -6000, message: 'You hire temporary workers to keep operating.', statChanges: { stress: 20, networking: -5 } } }
    ],
    conditions: { minMonth: 18, maxOccurrences: 3 }
  },
  {
    id: 'owned_business_fraud',
    title: '🕵️ Fraud in the Books',
    description: 'You discover suspicious transactions. It looks like someone has been siphoning money from a business you own.',
    image: '/event-images/owned_business_fraud.webp',
    category: 'CRIME',
    weight: 4,
    options: [
      { label: 'Hire forensic audit + report it', outcome: { cashChange: -4000, message: 'You investigate and report the fraud.', statChanges: { stress: 20, financialIQ: 5 } } },
      { label: 'Handle it quietly (settle)', outcome: { cashChange: -8000, message: 'You quietly settle to avoid public drama.', statChanges: { stress: 15, happiness: -5 } } },
      { label: 'Ignore for now', outcome: { cashChange: 0, message: 'You ignore it. The risk may grow.', statChanges: { stress: 10, financialIQ: -5 } } }
    ],
    conditions: { minMonth: 24, maxOccurrences: 2 }
  },
  {
    id: 'owned_business_lawsuit',
    title: '⚖️ Major Lawsuit',
    description: 'A serious legal claim is filed related to one of your businesses. Legal fees can spiral fast.',
    image: '/event-images/owned_business_lawsuit.webp',
    category: 'LEGAL',
    weight: 3,
    options: [
      { label: 'Lawyer up and fight', outcome: { cashChange: -12000, message: 'You hire a strong legal team.', statChanges: { stress: 25, financialIQ: 3 } } },
      { label: 'Settle quickly', outcome: { cashChange: -20000, message: 'You settle to stop the bleeding.', statChanges: { stress: 15, happiness: -5 } } },
      { label: 'Try mediation first', outcome: { cashChange: -6000, message: 'You attempt mediation to reduce costs.', statChanges: { stress: 15, networking: 5 } } }
    ],
    conditions: { minMonth: 36, maxOccurrences: 2 }
  },
  {
    id: 'owned_business_regulatory_fine',
    title: '🏛️ Regulatory Fine',
    description: 'A regulator flags compliance issues in a business you own. Fixing it costs money and time.',
    image: '/event-images/owned_business_regulatory_fine.webp',
    category: 'LEGAL',
    weight: 4,
    options: [
      { label: 'Pay fine + fix immediately', outcome: { cashChange: -8000, message: 'You pay and remediate quickly.', statChanges: { stress: 15, financialIQ: 5 } } },
      { label: 'Appeal the fine', outcome: { cashChange: -2500, message: 'You appeal. It may work, or cost more later.', statChanges: { stress: 20 } } },
      { label: 'Delay fixes (risky)', outcome: { cashChange: 0, message: 'You delay. This may worsen penalties later.', statChanges: { stress: 20, financialIQ: -5 } } }
    ],
    conditions: { minMonth: 30, maxOccurrences: 2 }
  },
  {
    id: 'rental_tenant_nonpayment',
    title: '🏠 Tenant Stops Paying',
    description: 'A tenant in one of your rental properties stops paying. Your cashflow is about to feel it.',
    image: '/event-images/rental_tenant_nonpayment.webp',
    category: 'HOUSING',
    weight: 6,
    options: [
      { label: 'Start eviction process', outcome: { cashChange: -1200, message: 'You begin the eviction process.', statChanges: { stress: 20 } } },
      { label: 'Offer payment plan', outcome: { cashChange: -300, message: 'You offer a payment plan to keep occupancy.', statChanges: { stress: 10, networking: 3 } } },
      { label: 'Sell the property', outcome: { cashChange: 0, message: 'You consider selling to reduce stress.', statChanges: { stress: -5 } } }
    ],
    conditions: { minMonth: 24, maxOccurrences: 4 }
  },
  {
    id: 'rental_major_maintenance',
    title: '🛠️ Major Property Maintenance',
    description: 'A big maintenance issue hits one of your rental properties. Ignore it and the damage worsens.',
    image: '/event-images/rental_major_maintenance.webp',
    category: 'HOUSING',
    weight: 5,
    options: [
      { label: 'Fix it properly now', outcome: { cashChange: -5000, message: 'You fix the issue properly.', statChanges: { stress: 10 } } },
      { label: 'Cheap temporary fix', outcome: { cashChange: -1500, message: 'You patch it for now.', statChanges: { stress: 15 } } },
      { label: 'Delay repairs', outcome: { cashChange: 0, message: 'You delay repairs. Tenants are unhappy.', statChanges: { stress: 25, happiness: -5 } } }
    ],
    conditions: { minMonth: 18, maxOccurrences: 4 }
  },
  {
    id: 'rental_tenant_dispute',
    title: '🧾 Tenant Dispute',
    description: 'A tenant disputes charges and threatens legal action. Time, money, and stress are on the line.',
    image: '/event-images/rental_tenant_dispute.webp',
    category: 'LEGAL',
    weight: 4,
    options: [
      { label: 'Mediation + compromise', outcome: { cashChange: -800, message: 'You mediate and settle the dispute.', statChanges: { stress: 10, networking: 3 } } },
      { label: 'Lawyer up', outcome: { cashChange: -3000, message: 'You hire a lawyer and prepare to fight.', statChanges: { stress: 20 } } },
      { label: 'Give in and move on', outcome: { cashChange: -1500, message: 'You pay to end it quickly.', statChanges: { stress: 8, happiness: -3 } } }
    ],
    conditions: { minMonth: 24, maxOccurrences: 3 }
  },
  {
    id: 'rental_vacancy',
    title: '🕳️ Vacancy Period',
    description: 'A rental unit goes vacant unexpectedly. No tenant means no rent (but the bills keep coming).',
    image: '/event-images/rental_vacancy.webp',
    category: 'HOUSING',
    weight: 5,
    options: [
      { label: 'Reduce rent to fill faster', outcome: { cashChange: 0, message: 'You lower rent to attract tenants quickly.', statChanges: { stress: 10 } } },
      { label: 'Renovate to increase demand', outcome: { cashChange: -4000, message: 'You renovate to raise future rent.', statChanges: { stress: 15, financialIQ: 3 } } },
      { label: 'Wait it out', outcome: { cashChange: 0, message: 'You wait. Vacancy costs may add up.', statChanges: { stress: 15 } } }
    ],
    conditions: { minMonth: 18, maxOccurrences: 5 }
  },

  // === EVENTS WITH NEGOTIATION OPTIONS ===
  {
    id: 'salary_negotiation',
    title: '💰 Salary Review',
    description: 'Annual review time. You feel underpaid compared to market rates.',
    image: '/event-images/salary_negotiation.webp',
    category: 'CAREER',
    weight: 15,
    options: [
      { label: 'Ask for 15% raise', outcome: { cashChange: 0, message: 'Negotiating raise...', statChanges: { stress: 15 }, negotiateType: 'salary_raise_15' } },
      { label: 'Ask for 8% raise', outcome: { cashChange: 0, message: 'Modest request being considered...', statChanges: { stress: 10 }, negotiateType: 'salary_raise_8' } },
      { label: 'Accept current salary', outcome: { cashChange: 0, message: 'Staying quiet. Safe but stagnant.', statChanges: { happiness: -5, stress: 5 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'landlord_dispute',
    title: '🏠 Landlord Conflict',
    description: 'Your landlord refuses to fix the broken heating. Winter is coming.',
    image: '/event-images/landlord_dispute.webp',
    category: 'HOUSING',
    weight: 10,
    options: [
      { label: 'Negotiate repair timeline', outcome: { cashChange: 0, message: 'Negotiating with landlord...', statChanges: { stress: 15 }, negotiateType: 'landlord_repair' } },
      { label: 'Fix it yourself ($2,000)', outcome: { cashChange: -2000, message: 'Fixed it. Will deduct from rent.', statChanges: { stress: 10, happiness: 5 } } },
      { label: 'Report to housing authority', outcome: { cashChange: 0, message: 'Filed complaint. May take months.', statChanges: { stress: 25, networking: -5 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'insurance_claim_dispute',
    title: '📋 Insurance Claim Denied',
    description: 'Your insurance company denied your claim. They say it is not covered.',
    image: '/event-images/insurance_claim_dispute.webp',
    category: 'LEGAL',
    weight: 8,
    options: [
      { label: 'Appeal the decision', outcome: { cashChange: -500, message: 'Appealing decision...', statChanges: { stress: 20 }, negotiateType: 'insurance_appeal' } },
      { label: 'Hire lawyer ($3,000)', outcome: { cashChange: -3000, message: 'Lawyer reviewing case.', statChanges: { stress: 25 } } },
      { label: 'Accept denial and move on', outcome: { cashChange: -8000, message: 'Paying out of pocket. Frustrating.', statChanges: { stress: 15, happiness: -15 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'medical_bill_negotiation',
    title: '🏥 Surprise Medical Bill',
    description: 'Received a $12,000 medical bill. Insurance covered less than expected.',
    image: '/event-images/medical_bill_negotiation.webp',
    category: 'MEDICAL',
    weight: 10,
    options: [
      { label: 'Negotiate bill reduction', outcome: { cashChange: 0, message: 'Negotiating with billing dept...', statChanges: { stress: 20 }, negotiateType: 'medical_bill' } },
      { label: 'Set up payment plan', outcome: { cashChange: 0, message: 'Monthly payments of $400 for 30 months.', statChanges: { stress: 15 }, addLiability: { name: 'Medical Bill Payment', balance: 12000, originalBalance: 12000, interestRate: 0, monthlyPayment: 400, type: 'MEDICAL_DEBT' } } },
      { label: 'Pay in full for discount', outcome: { cashChange: -9000, message: 'Paid $9,000 for 25% cash discount.', statChanges: { stress: 10, financialIQ: 5 } } }
    ],
    conditions: { minMonth: 12 }
  },
  
  // === MORE DIVERSE EVERYDAY EVENTS ===
  {
    id: 'pet_emergency',
    image: '/event-images/pet_emergency.webp',
    title: '🐕 Pet Has Eaten Something Concerning',
    description: 'Your pet swallowed a sock. An entire sock. They seem proud of themselves.',
    category: 'MEDICAL',
    weight: 10,
    options: [
      { label: 'Emergency surgery ($4,000) 🏥', outcome: { cashChange: -4000, message: 'Sock successfully retrieved! The vet framed it. Your pet is recovering and eyeing another sock as we speak.', statChanges: { stress: 20, happiness: 10, fulfillment: 15 } } },
      { label: 'Wait and see ($500 for x-ray) 🤞', outcome: { cashChange: -500, message: 'Good news! The sock... passed. You will never unsee what you saw. Your pet is unfazed.', statChanges: { stress: 15, happiness: -5 } } },
      { label: 'Say goodbye ($200) 💔', outcome: { cashChange: -200, message: 'The hardest decision. They were the goodest. Rest easy, sock-eater.', statChanges: { stress: 10, happiness: -25, fulfillment: -15 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'appliance_breakdown',
    title: '🧊 Fridge Has Abandoned You',
    description: 'Your fridge made a concerning noise at 3am, then went silent. The milk is getting suspicious.',
    image: '/event-images/appliance_breakdown.webp',
    category: 'HOUSING',
    weight: 15,
    options: [
      { label: 'Buy new ($1,200) ❄️', outcome: { cashChange: -1200, message: 'New fridge! It has an ice maker. You\'ve never felt more adult in your life.', statChanges: { stress: 5, happiness: 5 } } },
      { label: 'Buy used ($400) 🔄', outcome: { cashChange: -400, message: 'It hums ominously, but it works! Previous owner left a magnet that says "Wine O\'Clock." You\'re keeping it.', statChanges: { stress: 5 } } },
      { label: 'YouTube repair ($150) 🔧', outcome: { cashChange: -150, message: 'You fixed it! You are basically an engineer now. (It\'s held together with duct tape and hope.)', statChanges: { stress: 10, financialIQ: 5 } } }
    ]
  },
  {
    id: 'phone_stolen',
    title: '📱 Phone Gone. Panic Mode.',
    description: 'You patted your pocket. Nothing. Patted again. Still nothing. Existential crisis engaged.',
    category: 'CRIME',
    weight: 12,
    options: [
      { label: 'Latest model ($1,200) 📲', outcome: { cashChange: -1200, message: 'It\'s an upgrade! You told yourself this was meant to be. The universe works in mysterious ways.', statChanges: { happiness: 5, stress: 10 } } },
      { label: 'Budget phone ($300) 📱', outcome: { cashChange: -300, message: 'It makes calls. That\'s... that\'s what phones do, right? Your camera now has 3 pixels.', statChanges: { stress: 10 } } },
      { label: 'Found it in your other pocket 😅', outcome: { cashChange: 0, message: 'It was there the whole time. The panic was free. You don\'t tell anyone about this.', statChanges: { stress: 5, happiness: 5 } } }
    ]
  },
  {
    id: 'home_break_in',
    title: '🚨 Someone Broke In!',
    description: 'Your home was burglarized. They took the TV but left your collection of participation trophies. Rude.',
    image: '/event-images/home_break_in.webp',
    category: 'CRIME',
    weight: 5,
    options: [
      { label: 'File insurance claim ($1,000 deductible) 📋', outcome: { cashChange: -1000, message: 'Claim processed! You now have 47 photos of every item you own. "For insurance." You\'re one step from spreadsheets.', statChanges: { stress: 30, happiness: -20 } } },
      { label: 'Install security system ($2,000) 🔐', outcome: { cashChange: -2000, message: 'You now get alerts when a leaf falls in your driveway. Sleep peacefully (when the sensors stop going off).', statChanges: { stress: 25, happiness: -15, fulfillment: 5 } } },
      { label: 'Replace stolen items ($5,000) 💸', outcome: { cashChange: -5000, message: 'New stuff! Some of it is nicer than what was stolen. Silver lining? Silver lining.', statChanges: { stress: 25, happiness: -10 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'friend_wedding',
    image: '/event-images/friend_wedding.webp',
    title: '💒 Friend\'s Wedding: Your Wallet\'s Nightmare',
    description: 'Your best friend is getting married. You\'re in the wedding party. Your credit card is already crying.',
    category: 'SOCIAL',
    weight: 15,
    options: [
      { label: 'Full participation ($2,500) 🎊', outcome: { cashChange: -2500, message: 'Bachelor/ette party in Vegas. Custom outfit you\'ll wear once. Gift registry item. Open bar made it worth it.', statChanges: { happiness: 15, energy: -15, fulfillment: 10, networking: 10 } } },
      { label: 'Just attend wedding ($500) 🎉', outcome: { cashChange: -500, message: 'Caught the bouquet/garter. Now everyone\'s looking at you expectantly. Great.', statChanges: { happiness: 10, fulfillment: 5, networking: 5 } } },
      { label: 'Send regrets and a Venmo 📱', outcome: { cashChange: -100, message: 'You "had a conflict." The conflict was your savings account. They understand. (They don\'t.)', statChanges: { happiness: -10, fulfillment: -10, networking: -15 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'vacation_opportunity',
    title: '🏖️ "Treat Yourself" Emergency',
    description: 'Found an insane deal on your dream vacation. 70% off! Today only! Your mouse hovers over "Book Now."',
    image: '/event-images/vacation_opportunity.webp',
    category: 'SOCIAL',
    weight: 12,
    options: [
      { label: 'BOOK IT. YOLO. ($5,000) ✈️', outcome: { cashChange: -5000, message: 'Best. Decision. Ever. You touched a dolphin. You have 847 photos. Your Instagram has peaked.', statChanges: { happiness: 25, stress: -20, energy: 20, fulfillment: 15 } } },
      { label: 'Budget version ($2,000) 🎒', outcome: { cashChange: -2000, message: 'Hostel vibes! Met interesting people. Only got slightly lost. Memories: priceless. Photos: blurry but authentic.', statChanges: { happiness: 15, stress: -15, energy: 15 } } },
      { label: 'Close the tab. Walk away. 💻', outcome: { cashChange: 0, message: 'You saved money! You also think about that deal every night at 2am. What if...', statChanges: { happiness: -5, stress: 5 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'annual_checkup',
    image: '/event-images/annual_checkup.webp',
    title: '🩺 Doctor Wants to "Chat"',
    description: 'Time for your yearly physical. The doctor says you need to "make some changes." Your fries feel judged.',
    category: 'MEDICAL',
    weight: 20,
    options: [
      { label: 'Full checkup + all the tests ($300) 🔬', outcome: { cashChange: -300, message: 'Clean bill of health! You celebrated with cake. The doctor would not approve.', statChanges: { health: 10, stress: -5, happiness: 5 } } },
      { label: 'Basic checkup ($100) ✅', outcome: { cashChange: -100, message: 'Vitals are fine! Doctor mentioned vegetables. You nodded and forgot immediately.', statChanges: { health: 5, stress: -3 } } },
      { label: 'Skip it. I feel fine. 🤷', outcome: { cashChange: 0, message: 'What you don\'t know can\'t hurt you! (This is not medically accurate.)', statChanges: { stress: 5 } } }
    ],
    conditions: { minMonth: 12 }
  },
  
  // === FUNNY EVENTS ===
  {
    id: 'ikea_adventure',
    image: '/event-images/ikea_adventure.webp',
    title: '🪑 IKEA Expedition',
    description: 'You went to IKEA for a $5 plant. That was 4 hours ago. Your cart is now full.',
    category: 'HOUSING',
    weight: 18,
    options: [
      { label: 'Buy everything ($800) 🛒', outcome: { cashChange: -800, message: 'You now own 47 things you didn\'t know existed. Assembly required: 6-8 hours.', statChanges: { happiness: 10, stress: 15, energy: -20 } } },
      { label: 'Just the plant and meatballs ($25) 🌱', outcome: { cashChange: -25, message: 'Escaped with your wallet intact! The Swedish meatballs were worth the journey.', statChanges: { happiness: 10, stress: -5 } } },
      { label: 'Abandon cart and flee! 🏃', outcome: { cashChange: 0, message: 'You made it out! But you forgot where you parked...', statChanges: { stress: 10, energy: -15 } } }
    ]
  },
  {
    id: 'streaming_subscriptions',
    image: '/event-images/streaming_subscriptions.webp',
    title: '📺 Subscription Apocalypse',
    description: 'You just realized you\'re paying for 8 streaming services and only watching one.',
    category: 'HOUSING',
    weight: 20,
    options: [
      { label: 'Keep all of them ($150/mo) 🤷', outcome: { cashChange: -450, message: 'You MIGHT watch that documentary series someday. You won\'t. But you might.', statChanges: { happiness: 5, financialIQ: -5 } } },
      { label: 'Cancel most, keep 2 ($30/mo)', outcome: { cashChange: 0, message: 'Your ex\'s Netflix password is still technically active. Not all heroes wear capes.', statChanges: { happiness: 5, financialIQ: 10, stress: -5 } } },
      { label: 'Cancel all. Read books. 📚', outcome: { cashChange: 150, message: 'You lasted 3 days before re-subscribing. But hey, those 3 days were growth.', statChanges: { happiness: -10, financialIQ: 5, stress: 10 } } }
    ],
    isRecurring: true
  },
  {
    id: 'coworker_birthday',
    image: '/event-images/coworker_birthday.webp',
    title: '🎂 Office Birthday Collection',
    description: 'Karen is collecting for Steve\'s birthday. Steve is that guy who microwaves fish.',
    category: 'SOCIAL',
    weight: 22,
    options: [
      { label: 'Chip in $20 like a team player 💰', outcome: { cashChange: -20, message: 'Steve\'s birthday was lovely. He microwaved fish at the party.', statChanges: { networking: 5, happiness: -5 } } },
      { label: 'I have exact change ($5) 🪙', outcome: { cashChange: -5, message: 'Karen gave you "the look." Worth it.', statChanges: { networking: -5, happiness: 5, financialIQ: 5 } } },
      { label: 'Pretend to be on a call 📱', outcome: { cashChange: 0, message: 'You hid in the bathroom for 20 minutes. Karen knows. Karen always knows.', statChanges: { networking: -10, stress: 5 } } }
    ],
    isRecurring: true
  },
  {
    id: 'gym_membership',
    title: '💪 Gym Membership Guilt',
    description: 'You\'ve been paying $50/month for 8 months. You\'ve gone twice. The gym sent a "we miss you" email.',
    image: '/event-images/gym_membership.webp',
    category: 'MEDICAL',
    weight: 18,
    options: [
      { label: 'Cancel it. Accept who you are. 🍕', outcome: { cashChange: 0, message: 'Freedom! You celebrated with pizza. No regrets.', statChanges: { happiness: 10, health: -5, stress: -10 } } },
      { label: 'Double down! Personal trainer ($200/mo) 🏋️', outcome: { cashChange: -600, message: 'You now have abs. Also debt. But ABS!', statChanges: { health: 20, happiness: 10, stress: 10 } } },
      { label: 'Keep paying. Keep not going. 🤷', outcome: { cashChange: -150, message: 'It\'s basically a donation to other people\'s fitness. You\'re a philanthropist.', statChanges: { financialIQ: -5, stress: 5 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'impulse_purchase',
    title: '🛍️ 3 AM Shopping Decision',
    description: 'You were half-asleep scrolling your phone. Now a 6-foot inflatable dinosaur costume is arriving Tuesday.',
    image: '/event-images/impulse_purchase.webp',
    category: 'SOCIAL',
    weight: 15,
    options: [
      { label: 'Embrace your destiny ($89) 🦖', outcome: { cashChange: -89, message: 'Best. Purchase. Ever. You wore it to your nephew\'s birthday. Legendary uncle status achieved.', statChanges: { happiness: 20, fulfillment: 15 } } },
      { label: 'Return it (free)', outcome: { cashChange: 0, message: 'You returned it. But you still think about it sometimes. What could have been...', statChanges: { happiness: -5, stress: -5 } } },
      { label: 'Buy the matching T-Rex for your partner ($89) 🦕', outcome: { cashChange: -178, message: 'You are now THAT couple. Halloween will never be the same. Worth every penny.', statChanges: { happiness: 25, fulfillment: 20, financialIQ: -5 } } }
    ]
  },
  {
    id: 'avocado_toast',
    title: '🥑 Millennial Financial Crisis',
    description: 'You just spent $18 on avocado toast. Your parents think this is why you can\'t afford a house.',
    image: '/event-images/avocado_toast.webp',
    category: 'SOCIAL',
    weight: 20,
    options: [
      { label: 'Worth it. It was artisanal. 🤌', outcome: { cashChange: -18, message: 'The toast was life-changing. Your Instagram got 47 likes. FORTY-SEVEN.', statChanges: { happiness: 15, fulfillment: 5, financialIQ: -3 } } },
      { label: 'Make your own toast ($2)', outcome: { cashChange: -2, message: 'It was... fine. The avocado was brown. You added too much salt. But you\'re SAVING.', statChanges: { happiness: -5, financialIQ: 10, stress: 5 } } },
      { label: 'Call your parents and apologize 📞', outcome: { cashChange: 0, message: 'They sent you a home-buying article from 1985. "We bought our house for $30,000!" Thanks, mom.', statChanges: { stress: 15, happiness: -10 } } }
    ],
    isRecurring: true
  },
  {
    id: 'parking_ticket',
    title: '🎫 Parking Ticket Surprise',
    description: 'You were parked for 3 minutes. The meter maid has the reflexes of a cheetah.',
    image: '/event-images/parking_ticket.webp',
    category: 'LEGAL',
    weight: 20,
    options: [
      { label: 'Pay the $75 ticket 😤', outcome: { cashChange: -75, message: 'You paid it while making intense eye contact with the meter maid. Small victories.', statChanges: { stress: 10, happiness: -5 } } },
      { label: 'Contest it in court ($0 or $150)', outcome: { cashChange: -75, message: 'You lost. The judge had the same parking ticket on their car. No mercy.', statChanges: { stress: 20, happiness: -10 } } },
      { label: 'Write a strongly worded letter 📝', outcome: { cashChange: -75, message: 'Your letter was beautiful. Shakespearean even. They didn\'t care. Ticket still due.', statChanges: { stress: 5, happiness: -5, fulfillment: 5 } } }
    ],
    isRecurring: true
  },
  {
    id: 'coffee_addiction',
    title: '☕ Coffee Crisis',
    description: 'You just did the math on your daily $7 coffee habit. You\'ve spent enough for a vacation.',
    image: '/event-images/coffee_addiction.webp',
    category: 'SOCIAL',
    weight: 18,
    options: [
      { label: 'Keep the habit. Coffee is life. ☕', outcome: { cashChange: -210, message: 'The barista knows your name. Your order. Your hopes and dreams. Worth it.', statChanges: { happiness: 15, energy: 10, financialIQ: -5 } } },
      { label: 'Buy a fancy home machine ($300)', outcome: { cashChange: -300, message: 'You now make terrible espresso at home. But it\'s YOUR terrible espresso.', statChanges: { happiness: 5, financialIQ: 10, stress: 5 } } },
      { label: 'Switch to instant coffee 💀', outcome: { cashChange: 90, message: 'Your coworkers staged an intervention. They said you seemed "different." Sadder. Weaker.', statChanges: { happiness: -20, energy: -10, stress: 20 } } }
    ]
  },
  {
    id: 'phone_screen_crack',
    title: '📱 Gravity Test Failed',
    description: 'Your phone hit the ground screen-first. The spider web crack pattern is oddly beautiful.',
    image: '/event-images/phone_screen_crack.webp',
    category: 'VEHICLE',
    weight: 18,
    options: [
      { label: 'Professional repair ($200)', outcome: { cashChange: -200, message: 'Good as new! You immediately dropped it again. It bounced. BOUNCED.', statChanges: { stress: 5, happiness: 5 } } },
      { label: 'New phone time! ($1,200)', outcome: { cashChange: -1200, message: 'You told yourself it\'s an investment. It\'s not. But the camera is SO good now.', statChanges: { happiness: 15, stress: -5, financialIQ: -5 } } },
      { label: 'It still works. Character! 🤷', outcome: { cashChange: 0, message: 'You cut your thumb twice. But you saved money! Priorities.', statChanges: { health: -3, stress: 10, financialIQ: 5 } } }
    ],
    isRecurring: true
  },
  {
    id: 'sales_emails',
    title: '📧 Unsubscribe or Succumb?',
    description: 'Your inbox has 2,847 unread "FINAL SALE! LAST CHANCE!" emails. One of them might be important.',
    image: '/event-images/sales_emails.webp',
    category: 'SOCIAL',
    weight: 15,
    options: [
      { label: 'Click on "just one" sale... 🛒', outcome: { cashChange: -350, message: 'You bought things you don\'t need at prices you couldn\'t resist. Marketing wins again.', statChanges: { happiness: 10, stress: 5, financialIQ: -5 } } },
      { label: 'Mass unsubscribe (2 hours of your life)', outcome: { cashChange: 0, message: 'Freedom! For about a week. Then they found you again. They always find you.', statChanges: { stress: -10, happiness: 5, energy: -10 } } },
      { label: 'Declare email bankruptcy 💥', outcome: { cashChange: 0, message: 'You marked all as read. Chaos. But liberating chaos.', statChanges: { stress: -15, happiness: 10, financialIQ: 3 } } }
    ],
    isRecurring: true
  },
  {
    id: 'warranty_expired',
    title: '📅 Warranty Just Expired',
    description: 'Your laptop broke. It\'s been 367 days since purchase. The warranty was 365 days. Of course.',
    image: '/event-images/warranty_expired.webp',
    category: 'HOUSING',
    weight: 12,
    options: [
      { label: 'Repair it ($400)', outcome: { cashChange: -400, message: 'The repair tech looked at you with pity. "This happens a lot." Sure it does.', statChanges: { stress: 15, happiness: -10 } } },
      { label: 'New laptop ($1,500)', outcome: { cashChange: -1500, message: 'You got the extended warranty this time. Growth.', statChanges: { happiness: 5, stress: 5, financialIQ: 5 } } },
      { label: 'YouTube repair tutorial 🔧', outcome: { cashChange: -30, message: 'You fixed it! Then it caught fire. Then you fixed that too. You\'re basically Tony Stark now.', statChanges: { happiness: 15, stress: 20, financialIQ: 10 } } }
    ]
  },
  {
    id: 'extended_warranty',
    title: '📞 Extended Warranty Call',
    description: 'Your car\'s extended warranty IS about to expire. Wait, you actually answered that call?',
    image: '/event-images/extended_warranty.webp',
    category: 'VEHICLE',
    weight: 12,
    options: [
      { label: 'Buy the warranty ($2,000)', outcome: { cashChange: -2000, message: 'Plot twist: it\'s actually legit. You use it 3 times. You win this round, warranty call.', statChanges: { stress: -5, financialIQ: 5 } } },
      { label: 'Waste their time for 20 minutes 📱', outcome: { cashChange: 0, message: 'You asked about warranties for your hovercraft. Your yacht. Your submarine. Heroic work.', statChanges: { happiness: 20, fulfillment: 10, stress: -5 } } },
      { label: 'Hang up like a normal person', outcome: { cashChange: 0, message: 'They\'ll call back. They always call back. No one escapes the warranty calls.', statChanges: { stress: 5 } } }
    ],
    isRecurring: true
  },
  {
    id: 'splitting_bill',
    title: '🍽️ Restaurant Bill Drama',
    description: 'One person had a salad. One had lobster. Karen wants to "just split it evenly."',
    image: '/event-images/splitting_bill.webp',
    category: 'SOCIAL',
    weight: 20,
    options: [
      { label: 'Sure, split it ($85) 🙄', outcome: { cashChange: -85, message: 'You had soup. SOUP. And you paid for Karen\'s lobster tower. Never again. (Until next time.)', statChanges: { stress: 15, happiness: -10, networking: 5 } } },
      { label: 'Actually, let me just pay my share ($28)', outcome: { cashChange: -28, message: 'Karen looked betrayed. The table went silent. But you kept $57. Math is math.', statChanges: { happiness: 5, stress: 10, networking: -10, financialIQ: 10 } } },
      { label: 'Leave cash and disappear ($35)', outcome: { cashChange: -35, message: 'You Irish-exited from a dinner. Legendary. Karen is still texting about it.', statChanges: { happiness: 10, stress: -5, networking: -5 } } }
    ],
    isRecurring: true
  },
  {
    id: 'online_dating',
    title: '💘 Dating App Adventures',
    description: 'You matched with someone who seems perfect. Their profile says they love "laughing, traveling, and The Office." Revolutionary.',
    image: '/event-images/online_dating.webp',
    category: 'SOCIAL',
    weight: 18,
    options: [
      { label: 'Fancy date ($150) 🍽️', outcome: { cashChange: -150, message: 'Great conversation! They laughed at your jokes. Either they\'re the one or they\'re really polite. Either way: progress!', statChanges: { happiness: 15, stress: -5, fulfillment: 10 } } },
      { label: 'Coffee date ($12) ☕', outcome: { cashChange: -12, message: 'Low investment, high return. You talked for 3 hours. Lost your parking spot. Worth it.', statChanges: { happiness: 10, stress: -3 } } },
      { label: 'Ghost them (anxiety won) 👻', outcome: { cashChange: 0, message: 'You convinced yourself they were too good for you. Your therapist has thoughts about this.', statChanges: { happiness: -10, stress: 15 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'work_drama',
    title: '🏢 Office Politics: Season 47',
    description: 'Someone threw you under the bus in a meeting. The bus was metaphorical but the betrayal was VERY real.',
    image: '/event-images/work_drama.webp',
    category: 'CAREER',
    weight: 20,
    isRecurring: true,
    options: [
      { label: 'Take the high road 😇', outcome: { cashChange: 0, message: 'You smiled and moved on. HR noticed your professionalism. Your reputation increased. Karma is patient.', statChanges: { happiness: -5, stress: 10, networking: 10 } } },
      { label: 'Document EVERYTHING 📝', outcome: { cashChange: 0, message: 'You now have a folder. A detailed folder. If they come for you again, you\'re READY.', statChanges: { stress: 15, fulfillment: 5, financialIQ: 5 } } },
      { label: 'Strategic revenge (legally) 🎯', outcome: { cashChange: 0, message: 'You CC\'d their boss on their mistake. Professionally. With receipts. *chef\'s kiss*', statChanges: { happiness: 20, stress: -5, networking: -10 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'home_improvement',
    title: '🔨 DIY: How Hard Can It Be?',
    description: 'You watched ONE YouTube video and now you\'re confident you can install a ceiling fan. The ceiling fan disagrees.',
    image: '/event-images/home_improvement.webp',
    category: 'HOUSING',
    weight: 18,
    isRecurring: true,
    options: [
      { label: 'Hire a professional ($400) 👷', outcome: { cashChange: -400, message: 'They fixed it in 20 minutes. Made it look easy. Your ego is bruised but your ceiling is intact.', statChanges: { stress: -5, happiness: 5 } } },
      { label: 'Keep trying (you\'ve got this!) 💪', outcome: { cashChange: -50, message: 'It took 6 hours, 3 trips to Home Depot, and some light crying. BUT IT WORKS. You are a GOD.', statChanges: { happiness: 20, stress: 15, fulfillment: 15 } } },
      { label: 'Call dad for help 📞', outcome: { cashChange: 0, message: 'He fixed it while lecturing you about "kids these days." Worth the emotional price.', statChanges: { happiness: 5, stress: 5 } } }
    ],
    conditions: { minMonth: 12 }
  },
  {
    id: 'viral_moment',
    title: '📱 You Went Viral!',
    description: 'Someone filmed you doing something mildly embarrassing. It now has 2 million views. Your mom has seen it.',
    category: 'SOCIAL',
    weight: 8,
    options: [
      { label: 'Lean into it! 🎬', outcome: { cashChange: 500, message: 'You made merch. MERCH. Of your embarrassing moment. This is called "turning lemons into content."', statChanges: { happiness: 15, networking: 15, fulfillment: 10 } } },
      { label: 'Hide from the internet 🙈', outcome: { cashChange: 0, message: 'You deleted all your socials for a week. It was actually kind of peaceful. Maybe the virus was the friends you didn\'t make.', statChanges: { happiness: 5, stress: -10 } } },
      { label: 'Blame your friend who posted it 😤', outcome: { cashChange: 0, message: 'They said "any publicity is good publicity." Your friendship has been updated to "acquaintance."', statChanges: { happiness: -5, networking: -10, stress: 10 } } }
    ],
    conditions: { minMonth: 6 }
  },
  {
    id: 'mystery_charge',
    title: '💳 The Mystery Charge',
    description: 'There\'s a $49.99 charge on your card from "DGTLSVC LLC." You have no memory of this. Neither does Google.',
    image: '/event-images/mystery_charge.webp',
    category: 'LEGAL',
    weight: 15,
    isRecurring: true,
    options: [
      { label: 'Dispute it with the bank 🏦', outcome: { cashChange: 50, message: 'Got your money back! Turns out it was a subscription you forgot about from 2021. To a meditation app. Ironic.', statChanges: { happiness: 10, financialIQ: 5 } } },
      { label: 'Investigate (2 hours of your life) 🔍', outcome: { cashChange: 0, message: 'It was a free trial you forgot to cancel. From 6 months ago. You\'ve paid $300 for a service you never used.', statChanges: { stress: 15, happiness: -10, financialIQ: 10 } } },
      { label: 'Just cancel the card (nuclear option) 💥', outcome: { cashChange: -25, message: 'New card fee paid. But now you have to update 47 websites with your new card number. Worth it? Maybe.', statChanges: { stress: 20, happiness: -5 } } }
    ]
  },
  {
    id: 'neighbor_drama',
    title: '🏡 Neighbor Wars',
    description: 'Your neighbor\'s dog keeps barking at 6am. Your neighbor thinks it\'s "character." You think it\'s assault.',
    image: '/event-images/neighbor_drama.webp',
    category: 'HOUSING',
    weight: 15,
    isRecurring: true,
    options: [
      { label: 'Talk to them nicely 🤝', outcome: { cashChange: 0, message: 'They apologized! Got the dog a trainer. You\'re invited to their BBQ now. Adulting achieved.', statChanges: { happiness: 10, networking: 10, stress: -10 } } },
      { label: 'Passive aggressive note 📝', outcome: { cashChange: 0, message: 'The note escalated things. Now they mow their lawn at 7am on Sundays. Regret.', statChanges: { stress: 20, happiness: -10 } } },
      { label: 'Noise-canceling headphones ($300) 🎧', outcome: { cashChange: -300, message: 'Problem... not solved, but ignored. You now listen to podcasts about boundary-setting. Full circle.', statChanges: { happiness: 5, stress: -5 } } }
    ]
  },
  {
    id: 'reunion',
    title: '🎓 High School Reunion',
    description: 'Your 10-year reunion is coming up. Time to either flex your success or make peace with your journey.',
    image: '/event-images/reunion.webp',
    category: 'SOCIAL',
    weight: 10,
    options: [
      { label: 'Go all out! ($500) ✨', outcome: { cashChange: -500, message: 'New outfit, professional photos, rented a nice car. Brad who peaked in gym class looked impressed. VICTORY.', statChanges: { happiness: 15, networking: 15, stress: 10 } } },
      { label: 'Go and be genuine 💕', outcome: { cashChange: -50, message: 'Had real conversations. Reconnected with old friends. Realized everyone\'s just figuring it out. Wholesome.', statChanges: { happiness: 20, fulfillment: 15, networking: 10 } } },
      { label: 'Skip it entirely 🏃', outcome: { cashChange: 0, message: 'You watched the chaos unfold on social media instead. Zero regrets. Some mysteries are better unsolved.', statChanges: { happiness: 5, stress: -10 } } }
    ],
    conditions: { minMonth: 60, maxOccurrences: 1 }
  }
];

type EventLibraryChoice = {
  label?: string;
  labelKey?: string;
  effects: Scenario['options'][number]['outcome'] & { messageKey?: string };
  followups?: { id: string; delayMonths?: number }[];
};

type EventLibraryItem = {
  id: string;
  title?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  category: LifeEventCategory;
  art?: string | null;
  tags?: string[];
  characterIds?: string[];
  cooldown?: number;
  choices: EventLibraryChoice[];
};

const EVENT_LIBRARY: Scenario[] = (eventLibrary as EventLibraryItem[]).map(item => ({
  id: item.id,
  title: item.titleKey || item.title || '',
  description: item.descriptionKey || item.description || '',
  category: item.category,
  options: item.choices.map(choice => {
    const { messageKey, message, ...restEffects } = choice.effects;
    return {
      label: choice.labelKey || choice.label || '',
      outcome: {
        ...restEffects,
        message: messageKey || message || '',
        followups: choice.followups
      }
    };
  }),
  image: item.art || undefined,
  tags: item.tags,
  characterIds: item.characterIds,
  cooldownMonths: item.cooldown
}));

export const ALL_LIFE_EVENTS = [...LIFE_EVENTS, ...EVENT_LIBRARY];

// AI-specific scenarios (imported into main events)
export const AI_SCENARIOS = ALL_LIFE_EVENTS.filter(e => e.category === 'AI_DISRUPTION');

// ============================================
// GOALS / QUESTS (Adult mode)
// ============================================
// A small questline to keep players focused on short-term objectives while learning.
// Only a few are active at once (see INITIAL_QUEST_STATE).

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  // ==============================
  // Core / Foundation questline
  // ==============================
  {
    id: 'Q_BUFFER_2K',
    title: 'quests.Q_BUFFER_2K.title',
    description: 'quests.Q_BUFFER_2K.description',
    category: 'FOUNDATION',
    difficulty: 'EASY',
    metric: 'CASH_AMOUNT',
    target: 2000,
    reward: { cash: 200, stats: { financialIQ: 2 } },
    hint: 'quests.Q_BUFFER_2K.hint'
  },
  {
    id: 'Q_FIRST_INVESTMENT',
    title: 'quests.Q_FIRST_INVESTMENT.title',
    description: 'quests.Q_FIRST_INVESTMENT.description',
    category: 'INVESTING',
    difficulty: 'EASY',
    metric: 'OWN_ASSET_COUNT',
    target: 1,
    reward: { cash: 150, stats: { financialIQ: 3 } },
    hint: 'quests.Q_FIRST_INVESTMENT.hint'
  },
  {
    id: 'Q_FIRST_HUSTLE',
    title: 'quests.Q_FIRST_HUSTLE.title',
    description: 'quests.Q_FIRST_HUSTLE.description',
    category: 'HUSTLES',
    difficulty: 'EASY',
    metric: 'ACTIVE_SIDE_HUSTLES',
    target: 1,
    reward: { cash: 150, stats: { networking: 5, happiness: 2 } },
    hint: 'quests.Q_FIRST_HUSTLE.hint'
  },
  {
    id: 'Q_INVESTED_10K',
    title: 'quests.Q_INVESTED_10K.title',
    description: 'quests.Q_INVESTED_10K.description',
    category: 'INVESTING',
    difficulty: 'MEDIUM',
    metric: 'TOTAL_INVESTED',
    target: 10000,
    reward: { stats: { financialIQ: 4 }, creditRating: 10 },
    unlockAfter: ['Q_FIRST_INVESTMENT'],
    hint: 'quests.Q_INVESTED_10K.hint'
  },
  {
    id: 'Q_DIVERSIFY_3',
    title: 'quests.Q_DIVERSIFY_3.title',
    description: 'quests.Q_DIVERSIFY_3.description',
    category: 'RISK',
    difficulty: 'MEDIUM',
    metric: 'DIVERSIFY_ASSET_TYPES',
    target: 3,
    reward: { stats: { financialIQ: 4, happiness: 2 } },
    unlockAfter: ['Q_INVESTED_10K'],
    hint: 'quests.Q_DIVERSIFY_3.hint'
  },
  {
    id: 'Q_PASSIVE_500',
    title: 'quests.Q_PASSIVE_500.title',
    description: 'quests.Q_PASSIVE_500.description',
    category: 'INVESTING',
    difficulty: 'MEDIUM',
    metric: 'PASSIVE_INCOME',
    target: 500,
    reward: { cash: 500, stats: { happiness: 5 } },
    unlockAfter: ['Q_DIVERSIFY_3'],
    hint: 'quests.Q_PASSIVE_500.hint'
  },
  {
    id: 'Q_EMERGENCY_3MO',
    title: 'quests.Q_EMERGENCY_3MO.title',
    description: 'quests.Q_EMERGENCY_3MO.description',
    category: 'FOUNDATION',
    difficulty: 'HARD',
    metric: 'CASH_RESERVE_MONTHS',
    target: 3,
    reward: { creditRating: 25, stats: { financialIQ: 3, stress: -8, happiness: 3 } },
    unlockAfter: ['Q_PASSIVE_500'],
    hint: 'quests.Q_EMERGENCY_3MO.hint'
  },
  {
    id: 'Q_CAREER_LEVEL_3',
    title: 'quests.Q_CAREER_LEVEL_3.title',
    description: 'quests.Q_CAREER_LEVEL_3.description',
    category: 'CAREER',
    difficulty: 'MEDIUM',
    metric: 'CAREER_LEVEL',
    target: 3,
    reward: { cash: 300, stats: { fulfillment: 5, happiness: 2 } },
    unlockAfter: ['Q_FIRST_HUSTLE'],
    hint: 'quests.Q_CAREER_LEVEL_3.hint'
  },
  {
    id: 'Q_CREDIT_720',
    title: 'quests.Q_CREDIT_720.title',
    description: 'quests.Q_CREDIT_720.description',
    category: 'CREDIT',
    difficulty: 'HARD',
    metric: 'CREDIT_RATING',
    target: 720,
    reward: { cash: 700, stats: { networking: 5, happiness: 3 } },
    unlockAfter: ['Q_EMERGENCY_3MO'],
    hint: 'quests.Q_CREDIT_720.hint'
  },

  // ==============================
  // Branching tracks (Step 6)
  // These unlock based on your playstyle.
  // ==============================

  // ---- Investor Track ----
  {
    id: 'Q_INVESTOR_25K',
    title: 'quests.Q_INVESTOR_25K.title',
    description: 'quests.Q_INVESTOR_25K.description',
    category: 'INVESTING',
    difficulty: 'MEDIUM',
    track: 'INVESTOR',
    metric: 'TOTAL_INVESTED',
    target: 25000,
    reward: { cash: 500, stats: { financialIQ: 5, happiness: 2 } },
    unlockAfter: ['Q_INVESTED_10K'],
    hint: 'quests.Q_INVESTOR_25K.hint'
  },
  {
    id: 'Q_INVESTOR_DIVERSIFY_4',
    title: 'quests.Q_INVESTOR_DIVERSIFY_4.title',
    description: 'quests.Q_INVESTOR_DIVERSIFY_4.description',
    category: 'RISK',
    difficulty: 'HARD',
    track: 'INVESTOR',
    metric: 'DIVERSIFY_ASSET_TYPES',
    target: 4,
    reward: { stats: { financialIQ: 4, stress: -5 } },
    unlockAfter: ['Q_DIVERSIFY_3'],
    hint: 'quests.Q_INVESTOR_DIVERSIFY_4.hint'
  },
  {
    id: 'Q_INVESTOR_PASSIVE_1000',
    title: 'quests.Q_INVESTOR_PASSIVE_1000.title',
    description: 'quests.Q_INVESTOR_PASSIVE_1000.description',
    category: 'INVESTING',
    difficulty: 'HARD',
    track: 'INVESTOR',
    metric: 'PASSIVE_INCOME',
    target: 1000,
    reward: { cash: 1000, stats: { happiness: 6 } },
    unlockAfter: ['Q_PASSIVE_500'],
    hint: 'quests.Q_INVESTOR_PASSIVE_1000.hint'
  },

  // ---- Entrepreneur Track ----
  {
    id: 'Q_ENTREPRENEUR_HUSTLES_2',
    title: 'quests.Q_ENTREPRENEUR_HUSTLES_2.title',
    description: 'quests.Q_ENTREPRENEUR_HUSTLES_2.description',
    category: 'HUSTLES',
    difficulty: 'MEDIUM',
    track: 'ENTREPRENEUR',
    metric: 'ACTIVE_SIDE_HUSTLES',
    target: 2,
    reward: { cash: 400, stats: { networking: 8, stress: 3, fulfillment: 3 } },
    unlockAfter: ['Q_FIRST_HUSTLE'],
    hint: 'quests.Q_ENTREPRENEUR_HUSTLES_2.hint'
  },
  {
    id: 'Q_ENTREPRENEUR_BUSINESS_1',
    title: 'quests.Q_ENTREPRENEUR_BUSINESS_1.title',
    description: 'quests.Q_ENTREPRENEUR_BUSINESS_1.description',
    category: 'HUSTLES',
    difficulty: 'HARD',
    track: 'ENTREPRENEUR',
    metric: 'OWN_BUSINESS_COUNT',
    target: 1,
    reward: { cash: 600, stats: { fulfillment: 6, financialIQ: 2 } },
    unlockAfter: ['Q_ENTREPRENEUR_HUSTLES_2'],
    hint: 'quests.Q_ENTREPRENEUR_BUSINESS_1.hint'
  },

  // ---- Debt Crusher Track ----
  {
    id: 'Q_DEBTCRUSHER_REPAID_3K',
    title: 'quests.Q_DEBTCRUSHER_REPAID_3K.title',
    description: 'quests.Q_DEBTCRUSHER_REPAID_3K.description',
    category: 'CREDIT',
    difficulty: 'MEDIUM',
    track: 'DEBT_CRUSHER',
    metric: 'DEBT_REPAID_TOTAL',
    target: 3000,
    reward: { cash: 250, creditRating: 15, stats: { stress: -6, financialIQ: 2 } },
    unlockAfter: ['Q_BUFFER_2K'],
    hint: 'quests.Q_DEBTCRUSHER_REPAID_3K.hint'
  },
  {
    id: 'Q_DEBTCRUSHER_REPAID_10K',
    title: 'quests.Q_DEBTCRUSHER_REPAID_10K.title',
    description: 'quests.Q_DEBTCRUSHER_REPAID_10K.description',
    category: 'CREDIT',
    difficulty: 'HARD',
    track: 'DEBT_CRUSHER',
    metric: 'DEBT_REPAID_TOTAL',
    target: 10000,
    reward: { cash: 600, creditRating: 25, stats: { stress: -10, happiness: 3 } },
    unlockAfter: ['Q_DEBTCRUSHER_REPAID_3K'],
    hint: 'quests.Q_DEBTCRUSHER_REPAID_10K.hint'
  },
  {
    id: 'Q_DEBTCRUSHER_CREDIT_740',
    title: 'quests.Q_DEBTCRUSHER_CREDIT_740.title',
    description: 'quests.Q_DEBTCRUSHER_CREDIT_740.description',
    category: 'CREDIT',
    difficulty: 'HARD',
    track: 'DEBT_CRUSHER',
    metric: 'CREDIT_RATING',
    target: 740,
    reward: { cash: 800, stats: { happiness: 4, networking: 4 } },
    unlockAfter: ['Q_CREDIT_720'],
    hint: 'quests.Q_DEBTCRUSHER_CREDIT_740.hint'
  },

  // ==============================
  // Character-specific questlines
  // ==============================
  {
    id: 'Q_ALEX_AUTOMATION',
    title: 'quests.Q_ALEX_AUTOMATION.title',
    description: 'quests.Q_ALEX_AUTOMATION.description',
    category: 'CAREER',
    difficulty: 'EASY',
    characterId: 'alex',
    metric: 'CAREER_LEVEL',
    target: 2,
    reward: { cash: 200, stats: { financialIQ: 3 } },
    hint: 'quests.Q_ALEX_AUTOMATION.hint'
  },
  {
    id: 'Q_ALEX_SIDE_PROJECT',
    title: 'quests.Q_ALEX_SIDE_PROJECT.title',
    description: 'quests.Q_ALEX_SIDE_PROJECT.description',
    category: 'INVESTING',
    difficulty: 'MEDIUM',
    characterId: 'alex',
    metric: 'PASSIVE_INCOME',
    target: 250,
    reward: { cash: 300, stats: { financialIQ: 3, happiness: 2 } },
    unlockAfter: ['Q_ALEX_AUTOMATION'],
    hint: 'quests.Q_ALEX_SIDE_PROJECT.hint'
  },
  {
    id: 'Q_MARIA_BUFFER',
    title: 'quests.Q_MARIA_BUFFER.title',
    description: 'quests.Q_MARIA_BUFFER.description',
    category: 'FOUNDATION',
    difficulty: 'EASY',
    characterId: 'maria',
    metric: 'CASH_RESERVE_MONTHS',
    target: 1,
    reward: { stats: { stress: -5, health: 3 } },
    hint: 'quests.Q_MARIA_BUFFER.hint'
  },
  {
    id: 'Q_MARIA_STABILITY',
    title: 'quests.Q_MARIA_STABILITY.title',
    description: 'quests.Q_MARIA_STABILITY.description',
    category: 'INVESTING',
    difficulty: 'MEDIUM',
    characterId: 'maria',
    metric: 'PASSIVE_INCOME',
    target: 300,
    reward: { cash: 250, stats: { happiness: 2, health: 2 } },
    unlockAfter: ['Q_MARIA_BUFFER'],
    hint: 'quests.Q_MARIA_STABILITY.hint'
  },
  {
    id: 'Q_JAMES_MARKET_ENTRY',
    title: 'quests.Q_JAMES_MARKET_ENTRY.title',
    description: 'quests.Q_JAMES_MARKET_ENTRY.description',
    category: 'INVESTING',
    difficulty: 'EASY',
    characterId: 'james',
    metric: 'TOTAL_INVESTED',
    target: 5000,
    reward: { cash: 200, stats: { financialIQ: 3 } },
    hint: 'quests.Q_JAMES_MARKET_ENTRY.hint'
  },
  {
    id: 'Q_JAMES_RISK_BALANCE',
    title: 'quests.Q_JAMES_RISK_BALANCE.title',
    description: 'quests.Q_JAMES_RISK_BALANCE.description',
    category: 'RISK',
    difficulty: 'MEDIUM',
    characterId: 'james',
    metric: 'DIVERSIFY_ASSET_TYPES',
    target: 2,
    reward: { stats: { financialIQ: 4, stress: -2 } },
    unlockAfter: ['Q_JAMES_MARKET_ENTRY'],
    hint: 'quests.Q_JAMES_RISK_BALANCE.hint'
  },
  {
    id: 'Q_SARAH_TOOLKIT',
    title: 'quests.Q_SARAH_TOOLKIT.title',
    description: 'quests.Q_SARAH_TOOLKIT.description',
    category: 'FOUNDATION',
    difficulty: 'EASY',
    characterId: 'sarah',
    metric: 'CASH_AMOUNT',
    target: 5000,
    reward: { cash: 200, stats: { fulfillment: 2 } },
    hint: 'quests.Q_SARAH_TOOLKIT.hint'
  },
  {
    id: 'Q_SARAH_FIRST_PROPERTY',
    title: 'quests.Q_SARAH_FIRST_PROPERTY.title',
    description: 'quests.Q_SARAH_FIRST_PROPERTY.description',
    category: 'INVESTING',
    difficulty: 'MEDIUM',
    characterId: 'sarah',
    metric: 'OWN_REAL_ESTATE_COUNT',
    target: 1,
    reward: { cash: 500, stats: { financialIQ: 2, happiness: 2 } },
    unlockAfter: ['Q_SARAH_TOOLKIT'],
    hint: 'quests.Q_SARAH_FIRST_PROPERTY.hint'
  },
  {
    id: 'Q_DEVON_CLIENT_BASE',
    title: 'quests.Q_DEVON_CLIENT_BASE.title',
    description: 'quests.Q_DEVON_CLIENT_BASE.description',
    category: 'HUSTLES',
    difficulty: 'EASY',
    characterId: 'devon',
    metric: 'ACTIVE_SIDE_HUSTLES',
    target: 1,
    reward: { cash: 150, stats: { networking: 4, happiness: 2 } },
    hint: 'quests.Q_DEVON_CLIENT_BASE.hint'
  },
  {
    id: 'Q_DEVON_PASSIVE',
    title: 'quests.Q_DEVON_PASSIVE.title',
    description: 'quests.Q_DEVON_PASSIVE.description',
    category: 'INVESTING',
    difficulty: 'MEDIUM',
    characterId: 'devon',
    metric: 'PASSIVE_INCOME',
    target: 200,
    reward: { cash: 200, stats: { financialIQ: 2 } },
    unlockAfter: ['Q_DEVON_CLIENT_BASE'],
    hint: 'quests.Q_DEVON_PASSIVE.hint'
  },
  {
    id: 'Q_MARCUS_HUSTLE_2',
    title: 'quests.Q_MARCUS_HUSTLE_2.title',
    description: 'quests.Q_MARCUS_HUSTLE_2.description',
    category: 'HUSTLES',
    difficulty: 'MEDIUM',
    characterId: 'marcus',
    metric: 'ACTIVE_SIDE_HUSTLES',
    target: 2,
    reward: { cash: 300, stats: { networking: 6, stress: 2 } },
    hint: 'quests.Q_MARCUS_HUSTLE_2.hint'
  },
  {
    id: 'Q_MARCUS_BUSINESS',
    title: 'quests.Q_MARCUS_BUSINESS.title',
    description: 'quests.Q_MARCUS_BUSINESS.description',
    category: 'HUSTLES',
    difficulty: 'HARD',
    characterId: 'marcus',
    metric: 'OWN_BUSINESS_COUNT',
    target: 1,
    reward: { cash: 700, stats: { fulfillment: 6, financialIQ: 2 } },
    unlockAfter: ['Q_MARCUS_HUSTLE_2'],
    hint: 'quests.Q_MARCUS_BUSINESS.hint'
  },
  {
    id: 'Q_LINDA_BUFFER_2',
    title: 'quests.Q_LINDA_BUFFER_2.title',
    description: 'quests.Q_LINDA_BUFFER_2.description',
    category: 'FOUNDATION',
    difficulty: 'EASY',
    characterId: 'linda',
    metric: 'CASH_RESERVE_MONTHS',
    target: 2,
    reward: { stats: { stress: -6, happiness: 2 } },
    hint: 'quests.Q_LINDA_BUFFER_2.hint'
  },
  {
    id: 'Q_LINDA_PROMOTION',
    title: 'quests.Q_LINDA_PROMOTION.title',
    description: 'quests.Q_LINDA_PROMOTION.description',
    category: 'CAREER',
    difficulty: 'MEDIUM',
    characterId: 'linda',
    metric: 'CAREER_LEVEL',
    target: 2,
    reward: { cash: 250, stats: { fulfillment: 3 } },
    unlockAfter: ['Q_LINDA_BUFFER_2'],
    hint: 'quests.Q_LINDA_PROMOTION.hint'
  },
  {
    id: 'Q_TYLER_PIPELINE',
    title: 'quests.Q_TYLER_PIPELINE.title',
    description: 'quests.Q_TYLER_PIPELINE.description',
    category: 'FOUNDATION',
    difficulty: 'EASY',
    characterId: 'tyler',
    metric: 'CASH_AMOUNT',
    target: 6000,
    reward: { cash: 200, stats: { networking: 4 } },
    hint: 'quests.Q_TYLER_PIPELINE.hint'
  },
  {
    id: 'Q_TYLER_CREDIT',
    title: 'quests.Q_TYLER_CREDIT.title',
    description: 'quests.Q_TYLER_CREDIT.description',
    category: 'CREDIT',
    difficulty: 'MEDIUM',
    characterId: 'tyler',
    metric: 'CREDIT_RATING',
    target: 680,
    reward: { cash: 300, creditRating: 10 },
    unlockAfter: ['Q_TYLER_PIPELINE'],
    hint: 'quests.Q_TYLER_CREDIT.hint'
  }
];

export const getQuestById = (id: string): QuestDefinition | undefined => {
  return QUEST_DEFINITIONS.find(q => q.id === id);
};

const getStartingQuestIds = (characterId?: string): string[] => {
  const starters = QUEST_DEFINITIONS.filter(q => !q.unlockAfter || q.unlockAfter.length === 0);
  const characterStarters = characterId ? starters.filter(q => q.characterId === characterId) : [];
  const globalStarters = starters.filter(q => !q.characterId);
  const selected = [
    ...characterStarters.slice(0, 1),
    ...globalStarters.slice(0, Math.max(0, 3 - characterStarters.length))
  ];
  return selected.slice(0, 3).map(q => q.id);
};

export const getInitialQuestState = (characterId?: string): QuestState => ({
  active: getStartingQuestIds(characterId),
  readyToClaim: [],
  completed: [],
  track: undefined
});

export const INITIAL_QUEST_STATE: QuestState = getInitialQuestState();

// ============================================
// INITIAL GAME STATE
// ============================================
const defaultStats: PlayerStats = {
  happiness: 50,
  health: 80,
  energy: 70,
  stress: 30,
  networking: 20,
  financialIQ: 30,
  fulfillment: 40
};

export const INITIAL_GAME_STATE: GameState = {
  month: 1,
  year: 2025,
  cash: 8000,
  assets: [],
  liabilities: [],
  mortgages: [],netWorthHistory: [],
  lifestyle: 'MODEST',
  character: null,
  difficulty: 'NORMAL',
  playerJob: { title: 'Employee', salary: 4500, level: 1, experience: 0 },
  career: null,
  jobLossMonthsRemaining: 0,
  education: { level: 'HIGH_SCHOOL', degrees: [], currentlyEnrolled: undefined },
  activeSideHustles: [],
  family: { children: [], isEngaged: false },
  vehicles: [{ id: 'starter-car', name: 'Used Car', value: 8000, age: 5, monthlyMaintenance: 100, hasLoan: false }],
  stats: defaultStats,
  quests: { ...INITIAL_QUEST_STATE, active: [...INITIAL_QUEST_STATE.active], readyToClaim: [], completed: [], track: undefined },
  events: [],
  eventTracker: { taxesPaidThisYear: false, lastTaxMonth: 0, occurrences: {}, lastOccurrence: {}, lastEventMonth: 0, recentEventIds: [] },
  economy: {
    inflationRate: 0.03,
    interestRate: 0.065,
    unemploymentRate: 0.04,
    marketTrend: 'STABLE',
    recession: false,
    recessionMonths: 0,
    sectorPerformance: { technology: 1.0, healthcare: 1.0, real_estate: 1.0, energy: 1.0, banking: 1.0, diversified: 1.0, crypto: 1.0, government: 1.0 }
  },
  marketCycle: { phase: 'EXPANSION', monthsInPhase: 0, intensity: 0.5, nextPhaseIn: 24 },
  aiDisruption: { disruptionLevel: 0, year: 2025, affectedIndustries: {} },
  pendingScenario: null,
  eventQueue: [],
  pendingSideHustleUpgrade: null,
  hasWon: false,
  prestige: { lifetimeEarnings: 0, totalGamesWon: 0, highestNetWorth: 0, unlockedCharacters: [] },
  spouseIncome: 0,
  soundEnabled: true,// Monthly Actions (Adult mode)
  creditRating: 650,
  creditHistory: [{ month: 1, score: 650, reasons: ['Starting credit profile'] }],
  creditLastChangeReasons: ['Starting credit profile'],
  monthlyActionsMax: 2,
  monthlyActionsRemaining: 2,
  tempSalaryBonus: 0,
  tempSideHustleMultiplier: 1,
  salesAcceleratorCourse: {
    failedAttempts: 0,
    bestScore: 0,
    certified: false,
    rewardClaimed: false
  },
};
