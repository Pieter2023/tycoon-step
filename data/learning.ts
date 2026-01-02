export type GlossaryEntry = {
  term: string;
  definition: string;
  short?: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: string;
};

export type QuizDefinition = {
  id: string;
  title: string;
  intro: string;
  questions: QuizQuestion[];
};

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    term: 'Yield',
    definition: 'The annual return you expect from an investment, shown as a percentage of its price.',
    short: 'Expected annual return as a percent of price.'
  },
  {
    term: 'APR',
    definition: 'Annual Percentage Rate. The yearly cost of borrowing, including interest and fees.',
    short: 'Yearly cost of borrowing, including fees.'
  },
  {
    term: 'Diversification',
    definition: 'Spreading investments across different assets to reduce risk.',
    short: 'Spreading risk across different assets.'
  },
  {
    term: 'Volatility',
    definition: 'How much an asset’s price moves up and down. Higher volatility = more risk.',
    short: 'How much price swings over time.'
  },
  {
    term: 'Index Fund',
    definition: 'A fund that tracks a market index, giving broad exposure with low fees.',
    short: 'A fund that tracks a market index.'
  },
  {
    term: 'Cashflow',
    definition: 'Money left after income minus expenses. Positive cashflow builds wealth.',
    short: 'Income minus expenses each month.'
  },
  {
    term: 'Down Payment',
    definition: 'Upfront cash paid when buying a financed asset. The rest is borrowed.',
    short: 'Upfront cash you pay when financing.'
  },
  {
    term: 'Risk',
    definition: 'The chance an investment underperforms or loses value.',
    short: 'Chance of losing value or underperforming.'
  }
];

export const INVEST_QUIZ: QuizQuestion[] = [
  {
    id: 'yield',
    question: 'What does “yield” mean?',
    options: [
      'The total cost of an investment',
      'Expected annual return as a percent of price',
      'How long you hold an asset'
    ],
    correct: 'Expected annual return as a percent of price'
  },
  {
    id: 'diversification',
    question: 'Diversification helps most with:',
    options: [
      'Reducing risk by spreading investments',
      'Increasing fees',
      'Guaranteeing a profit'
    ],
    correct: 'Reducing risk by spreading investments'
  },
  {
    id: 'volatility',
    question: 'High volatility usually means:',
    options: [
      'Smaller price swings',
      'Bigger price swings and higher risk',
      'Guaranteed steady returns'
    ],
    correct: 'Bigger price swings and higher risk'
  },
  {
    id: 'apr',
    question: 'APR is best described as:',
    options: [
      'The yearly cost of borrowing',
      'Monthly rent on a property',
      'The best possible return'
    ],
    correct: 'The yearly cost of borrowing'
  }
];

export const REAL_ESTATE_QUIZ: QuizQuestion[] = [
  {
    id: 'downpayment',
    question: 'A larger down payment usually means:',
    options: [
      'Higher monthly payment',
      'Lower monthly payment and less interest',
      'No effect on the loan'
    ],
    correct: 'Lower monthly payment and less interest'
  },
  {
    id: 'cashflow',
    question: 'Cashflow on a rental is:',
    options: [
      'Rent income minus mortgage and maintenance',
      'Only the rent income',
      'Purchase price divided by months'
    ],
    correct: 'Rent income minus mortgage and maintenance'
  },
  {
    id: 'apr_mortgage',
    question: 'APR tells you:',
    options: [
      'Total yearly cost of borrowing',
      'Guaranteed returns on rent',
      'How fast a home appreciates'
    ],
    correct: 'Total yearly cost of borrowing'
  }
];

export const RISK_QUIZ: QuizQuestion[] = [
  {
    id: 'diversify',
    question: 'Diversification reduces risk by:',
    options: [
      'Owning only one asset',
      'Spreading money across different assets',
      'Buying only high-risk assets'
    ],
    correct: 'Spreading money across different assets'
  },
  {
    id: 'volatility',
    question: 'High volatility means:',
    options: [
      'Prices change a lot',
      'Prices never change',
      'Guaranteed profits'
    ],
    correct: 'Prices change a lot'
  },
  {
    id: 'risk_return',
    question: 'Higher potential returns typically come with:',
    options: [
      'Lower risk',
      'Higher risk',
      'No risk'
    ],
    correct: 'Higher risk'
  }
];

export const QUIZ_DEFINITIONS: Record<string, QuizDefinition> = {
  investBasics: {
    id: 'invest-basics',
    title: 'Investing basics quiz',
    intro: 'Answer a few questions to earn small bonuses.',
    questions: INVEST_QUIZ
  },
  realEstate: {
    id: 'real-estate',
    title: 'Real estate financing quiz',
    intro: 'Understand cashflow and borrowing basics.',
    questions: REAL_ESTATE_QUIZ
  },
  risk: {
    id: 'risk',
    title: 'Risk & diversification quiz',
    intro: 'Quick check on risk and volatility.',
    questions: RISK_QUIZ
  }
};

export const getGlossaryEntry = (term: string) =>
  GLOSSARY_ENTRIES.find((entry) => entry.term.toLowerCase() === term.toLowerCase());

export const getQuizDefinition = (id: string) =>
  Object.values(QUIZ_DEFINITIONS).find((quiz) => quiz.id === id);
