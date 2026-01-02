// Kids Mode Types - Simplified for Ages 8-10

export interface KidsCharacter {
  id: string;
  name: string;
  emoji: string;
  description: string;
  careerPath: string;
  startingCash: number;
  specialty: string;
  color: string;
}

export interface KidsCareer {
  name: string;
  icon: string;
  description: string;
  baseAllowance: number;
  levels: { title: string; weeklyBonus: number }[];
}

export interface KidsSideHustle {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earnRange: { min: number; max: number };
  energyCost: number;
  startupCost: number;
}

export interface KidsAsset {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: 'COLLECTION' | 'ENTERTAINMENT';
  description: string;
}

export interface KidsEventOutcome {
  cashChange: number;
  message: string;
  happinessChange?: number;
  energyChange?: number;
  skillBoost?: boolean;
}

export interface KidsEventOption {
  label: string;
  outcome: KidsEventOutcome;
}

export interface KidsLifeEvent {
  id: string;
  title: string;
  description: string;
  category: 'WINDFALL' | 'ACHIEVEMENT' | 'CHALLENGE' | 'CHOICE' | 'BUSINESS' | 'OPPORTUNITY';
  options: KidsEventOption[];
  weight: number;
  minWeek: number;
  requiresHustle?: string;
}

export interface KidsDifficulty {
  name: string;
  emoji: string;
  description: string;
  allowanceMultiplier: number;
  eventChanceMultiplier: number;
  startingCash: number;
}

export interface KidsCollectible {
  id: string;
  name: string;
  emoji: string;
  purchasePrice: number;
  currentValue: number;
  purchaseWeek: number;
}

export interface KidsSavingsGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  completed: boolean;
}

export interface KidsAchievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockedWeek?: number;
}

export interface KidsGameState {
  // Basic info
  week: number;
  cash: number;
  totalEarned: number;
  totalSaved: number;
  
  // Character
  character: KidsCharacter | null;
  difficulty: string;
  
  // Career
  careerPath: string;
  careerLevel: number;
  skillPoints: number;
  
  // Stats (simplified)
  happiness: number; // 0-100
  energy: number; // 0-5 (like hearts in a game)
  
  // Side hustles
  activeHustles: string[];
  
  // Collections
  collectibles: KidsCollectible[];
  
  // Goals
  savingsGoal: KidsSavingsGoal | null;
  completedGoals: string[];
  
  // Achievements
  achievements: KidsAchievement[];
  
  // Events
  pendingEvent: KidsLifeEvent | null;
  eventHistory: { week: number; title: string; result: string }[];
  
  // Game state
  hasWon: boolean;
  weeklyTip: string;
}

export const INITIAL_KIDS_STATE: KidsGameState = {
  week: 1,
  cash: 20,
  totalEarned: 0,
  totalSaved: 0,
  character: null,
  difficulty: 'NORMAL',
  careerPath: 'CREATIVE',
  careerLevel: 0,
  skillPoints: 0,
  happiness: 80,
  energy: 5,
  activeHustles: [],
  collectibles: [],
  savingsGoal: null,
  completedGoals: [],
  achievements: [],
  pendingEvent: null,
  eventHistory: [],
  hasWon: false,
  weeklyTip: ''
};
