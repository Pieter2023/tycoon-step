// Kids Mode Constants - Age 8-10 Friendly Version
import { KidsCharacter, KidsCareer, KidsSideHustle, KidsLifeEvent, KidsAsset, KidsDifficulty } from './kidsTypes';

export const KIDS_CHARACTERS: KidsCharacter[] = [
  {
    id: 'alex',
    name: 'Alex the Artist',
    emoji: '🎨',
    description: 'Loves drawing and making crafts to sell!',
    careerPath: 'CREATIVE',
    startingCash: 20,
    specialty: 'Art supplies cost less',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'sam',
    name: 'Sam the Scientist',
    emoji: '🔬',
    description: 'Always experimenting and inventing cool stuff!',
    careerPath: 'INVENTOR',
    startingCash: 15,
    specialty: 'Earns bonus from science projects',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'jordan',
    name: 'Jordan the Athlete',
    emoji: '⚽',
    description: 'Super sporty and loves helping with sports camps!',
    careerPath: 'SPORTS',
    startingCash: 18,
    specialty: 'Extra energy every week',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'taylor',
    name: 'Taylor the Tech Kid',
    emoji: '💻',
    description: 'Great with computers and helping neighbors!',
    careerPath: 'TECH',
    startingCash: 15,
    specialty: 'Tech jobs pay more',
    color: 'from-indigo-500 to-violet-500'
  },
  {
    id: 'riley',
    name: 'Riley the Pet Lover',
    emoji: '🐕',
    description: 'Best friends with every animal in the neighborhood!',
    careerPath: 'PETS',
    startingCash: 20,
    specialty: 'Pet-sitting pays double',
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'casey',
    name: 'Casey the Chef',
    emoji: '🧁',
    description: 'Makes the yummiest treats and lemonade!',
    careerPath: 'FOOD',
    startingCash: 18,
    specialty: 'Bake sales earn more',
    color: 'from-rose-500 to-red-500'
  }
];

export const KIDS_CAREERS: { [key: string]: KidsCareer } = {
  CREATIVE: {
    name: 'Artist',
    icon: '🎨',
    description: 'Make art and crafts to sell!',
    baseAllowance: 5,
    levels: [
      { title: 'Beginner Artist', weeklyBonus: 0 },
      { title: 'Cool Artist', weeklyBonus: 2 },
      { title: 'Super Artist', weeklyBonus: 5 },
      { title: 'Master Artist', weeklyBonus: 10 }
    ]
  },
  INVENTOR: {
    name: 'Inventor',
    icon: '🔬',
    description: 'Create cool science projects!',
    baseAllowance: 5,
    levels: [
      { title: 'Junior Scientist', weeklyBonus: 0 },
      { title: 'Cool Scientist', weeklyBonus: 2 },
      { title: 'Super Scientist', weeklyBonus: 5 },
      { title: 'Genius Inventor', weeklyBonus: 10 }
    ]
  },
  SPORTS: {
    name: 'Sports Helper',
    icon: '⚽',
    description: 'Help out at sports events!',
    baseAllowance: 5,
    levels: [
      { title: 'Team Helper', weeklyBonus: 0 },
      { title: 'Assistant Coach', weeklyBonus: 2 },
      { title: 'Sports Star', weeklyBonus: 5 },
      { title: 'Champion Helper', weeklyBonus: 10 }
    ]
  },
  TECH: {
    name: 'Tech Helper',
    icon: '💻',
    description: 'Help people with technology!',
    baseAllowance: 5,
    levels: [
      { title: 'Tech Beginner', weeklyBonus: 0 },
      { title: 'Computer Whiz', weeklyBonus: 2 },
      { title: 'Tech Expert', weeklyBonus: 5 },
      { title: 'Tech Genius', weeklyBonus: 10 }
    ]
  },
  PETS: {
    name: 'Pet Helper',
    icon: '🐕',
    description: 'Take care of cute animals!',
    baseAllowance: 5,
    levels: [
      { title: 'Pet Friend', weeklyBonus: 0 },
      { title: 'Pet Buddy', weeklyBonus: 2 },
      { title: 'Pet Expert', weeklyBonus: 5 },
      { title: 'Pet Whisperer', weeklyBonus: 10 }
    ]
  },
  FOOD: {
    name: 'Junior Chef',
    icon: '🧁',
    description: 'Make yummy treats!',
    baseAllowance: 5,
    levels: [
      { title: 'Helper Chef', weeklyBonus: 0 },
      { title: 'Cool Chef', weeklyBonus: 2 },
      { title: 'Super Chef', weeklyBonus: 5 },
      { title: 'Master Chef', weeklyBonus: 10 }
    ]
  }
};

export const KIDS_SIDE_HUSTLES: KidsSideHustle[] = [
  { id: 'lemonade', name: 'Lemonade Stand', emoji: '🍋', description: 'Sell refreshing lemonade!', earnRange: { min: 3, max: 8 }, energyCost: 1, startupCost: 5 },
  { id: 'dogwalk', name: 'Dog Walking', emoji: '🐕', description: 'Walk neighborhood dogs', earnRange: { min: 4, max: 7 }, energyCost: 2, startupCost: 0 },
  { id: 'carwash', name: 'Car Wash Helper', emoji: '🚗', description: 'Help wash cars', earnRange: { min: 5, max: 10 }, energyCost: 3, startupCost: 3 },
  { id: 'yardwork', name: 'Yard Helper', emoji: '🍂', description: 'Rake leaves and help in gardens', earnRange: { min: 4, max: 8 }, energyCost: 3, startupCost: 0 },
  { id: 'babysit', name: 'Mother\'s Helper', emoji: '👶', description: 'Help watch younger kids', earnRange: { min: 5, max: 10 }, energyCost: 2, startupCost: 0 },
  { id: 'crafts', name: 'Craft Sales', emoji: '🎨', description: 'Make and sell crafts', earnRange: { min: 2, max: 12 }, energyCost: 1, startupCost: 5 },
  { id: 'cookies', name: 'Bake Sale', emoji: '🍪', description: 'Bake and sell treats', earnRange: { min: 5, max: 15 }, energyCost: 2, startupCost: 8 },
  { id: 'tutoring', name: 'Homework Helper', emoji: '📚', description: 'Help younger kids with homework', earnRange: { min: 3, max: 6 }, energyCost: 1, startupCost: 0 },
  { id: 'petcare', name: 'Pet Sitting', emoji: '🐱', description: 'Take care of pets', earnRange: { min: 5, max: 12 }, energyCost: 2, startupCost: 0 },
  { id: 'recycling', name: 'Recycling Collector', emoji: '♻️', description: 'Collect cans and bottles', earnRange: { min: 2, max: 5 }, energyCost: 2, startupCost: 0 }
];

export const KIDS_COLLECTIBLES: KidsAsset[] = [
  { id: 'comics', name: 'Comic Book', emoji: '📚', price: 5, category: 'COLLECTION', description: 'Cool comics that might be worth more later!' },
  { id: 'cards', name: 'Trading Cards Pack', emoji: '🃏', price: 8, category: 'COLLECTION', description: 'Rare cards could be super valuable!' },
  { id: 'lego', name: 'LEGO Set', emoji: '🧱', price: 25, category: 'COLLECTION', description: 'Build something awesome!' },
  { id: 'plushie', name: 'Collectible Plushie', emoji: '🧸', price: 15, category: 'COLLECTION', description: 'A special stuffed animal!' },
  { id: 'game', name: 'Video Game', emoji: '🎮', price: 30, category: 'ENTERTAINMENT', description: 'Fun to play and might become a classic!' },
  { id: 'book', name: 'Special Book', emoji: '📖', price: 12, category: 'COLLECTION', description: 'A book that could become rare!' },
  { id: 'figure', name: 'Action Figure', emoji: '🦸', price: 20, category: 'COLLECTION', description: 'Collectible action figure!' },
  { id: 'puzzle', name: 'Rare Puzzle', emoji: '🧩', price: 18, category: 'ENTERTAINMENT', description: 'A challenging puzzle to enjoy!' }
];

export const KIDS_SAVINGS_GOALS = [
  { id: 'bike', name: 'New Bike', emoji: '🚲', price: 150, description: 'A shiny new bicycle!' },
  { id: 'console', name: 'Gaming Console', emoji: '🎮', price: 300, description: 'The coolest gaming system!' },
  { id: 'phone', name: 'First Phone', emoji: '📱', price: 200, description: 'Your very own phone!' },
  { id: 'pet', name: 'Pet Supplies', emoji: '🐹', price: 100, description: 'Everything for a new pet!' },
  { id: 'camp', name: 'Summer Camp', emoji: '🏕️', price: 250, description: 'An awesome summer adventure!' },
  { id: 'laptop', name: 'Laptop', emoji: '💻', price: 400, description: 'Your own computer!' },
  { id: 'skateboard', name: 'Skateboard', emoji: '🛹', price: 80, description: 'Learn cool tricks!' },
  { id: 'art', name: 'Art Kit', emoji: '🎨', price: 60, description: 'Professional art supplies!' }
];

export const KIDS_LIFE_EVENTS: KidsLifeEvent[] = [
  // Good Events (more common)
  { id: 'birthday', title: '🎂 Happy Birthday!', description: 'It\'s your birthday! Family gives you money!', category: 'WINDFALL', options: [
    { label: 'Save it all!', outcome: { cashChange: 25, message: 'Smart choice! You saved $25!', happinessChange: 5 } },
    { label: 'Save half, spend half', outcome: { cashChange: 12, message: 'You saved $12 and had fun!', happinessChange: 10 } }
  ], weight: 15, minWeek: 1 },
  
  { id: 'tooth', title: '🦷 Lost a Tooth!', description: 'The Tooth Fairy visited!', category: 'WINDFALL', options: [
    { label: 'Put it in savings', outcome: { cashChange: 5, message: 'Added $5 to your piggy bank!', happinessChange: 3 } }
  ], weight: 10, minWeek: 1 },
  
  { id: 'grandparents', title: '👴 Grandparent Visit!', description: 'Grandma and Grandpa came to visit!', category: 'WINDFALL', options: [
    { label: 'Thank them!', outcome: { cashChange: 15, message: 'They gave you $15!', happinessChange: 10 } }
  ], weight: 12, minWeek: 1 },
  
  { id: 'good_grades', title: '📝 Great Report Card!', description: 'You got awesome grades!', category: 'ACHIEVEMENT', options: [
    { label: 'Collect your reward!', outcome: { cashChange: 10, message: 'Parents gave you $10 bonus!', happinessChange: 15, skillBoost: true } }
  ], weight: 10, minWeek: 4 },
  
  { id: 'found_money', title: '💰 Found Money!', description: 'You found some money on the ground!', category: 'WINDFALL', options: [
    { label: 'Lucky day!', outcome: { cashChange: 3, message: 'You found $3!', happinessChange: 5 } }
  ], weight: 8, minWeek: 1 },
  
  { id: 'holiday', title: '🎄 Holiday Gift!', description: 'You received holiday money!', category: 'WINDFALL', options: [
    { label: 'Add to savings', outcome: { cashChange: 30, message: 'Added $30 to your savings!', happinessChange: 15 } },
    { label: 'Buy something fun', outcome: { cashChange: 10, message: 'Saved $10, bought something cool!', happinessChange: 20 } }
  ], weight: 8, minWeek: 8 },
  
  { id: 'chore_bonus', title: '⭐ Extra Chore Bonus!', description: 'You did extra chores without being asked!', category: 'ACHIEVEMENT', options: [
    { label: 'Collect bonus!', outcome: { cashChange: 5, message: 'Earned $5 extra!', happinessChange: 8 } }
  ], weight: 12, minWeek: 1 },
  
  { id: 'lemonade_rush', title: '🍋 Busy Day!', description: 'So many customers at your stand!', category: 'BUSINESS', options: [
    { label: 'Work extra hard!', outcome: { cashChange: 12, message: 'Earned $12 from all the customers!', happinessChange: 10, energyChange: -2 } }
  ], weight: 8, minWeek: 4, requiresHustle: 'lemonade' },
  
  { id: 'pet_bonus', title: '🐕 Happy Pet Owner!', description: 'A pet owner loved your work!', category: 'BUSINESS', options: [
    { label: 'Accept the tip!', outcome: { cashChange: 8, message: 'Got an $8 tip!', happinessChange: 10 } }
  ], weight: 8, minWeek: 4, requiresHustle: 'dogwalk' },
  
  // Challenges (less common, teach lessons)
  { id: 'rain', title: '🌧️ Rainy Day', description: 'Rain canceled your outdoor plans!', category: 'CHALLENGE', options: [
    { label: 'Stay inside and save energy', outcome: { cashChange: 0, message: 'You rested up!', energyChange: 2, happinessChange: -2 } },
    { label: 'Work on indoor projects', outcome: { cashChange: 3, message: 'Made $3 doing indoor crafts!', happinessChange: 3 } }
  ], weight: 6, minWeek: 1 },
  
  { id: 'broken_toy', title: '😢 Broken Toy', description: 'One of your favorite things broke!', category: 'CHALLENGE', options: [
    { label: 'Try to fix it ($0)', outcome: { cashChange: 0, message: 'You fixed it yourself! Good job!', happinessChange: 5, skillBoost: true } },
    { label: 'Buy a new one', outcome: { cashChange: -10, message: 'Bought a replacement', happinessChange: 0 } }
  ], weight: 5, minWeek: 4 },
  
  { id: 'sharing', title: '🤝 Friend Needs Help', description: 'Your friend forgot their lunch money!', category: 'CHOICE', options: [
    { label: 'Share your money', outcome: { cashChange: -5, message: 'You helped a friend!', happinessChange: 10 } },
    { label: 'Sorry, saving for something', outcome: { cashChange: 0, message: 'You stayed focused on your goal', happinessChange: -3 } }
  ], weight: 6, minWeek: 2 },
  
  { id: 'ice_cream', title: '🍦 Ice Cream Truck!', description: 'The ice cream truck is here!', category: 'CHOICE', options: [
    { label: 'Get a treat! ($4)', outcome: { cashChange: -4, message: 'Yummy!', happinessChange: 8 } },
    { label: 'Save my money', outcome: { cashChange: 0, message: 'Stayed strong!', happinessChange: 2 } }
  ], weight: 10, minWeek: 1 },
  
  { id: 'fair', title: '🎡 School Fair!', description: 'The school fair is this week!', category: 'CHOICE', options: [
    { label: 'Go all out! ($15)', outcome: { cashChange: -15, message: 'Best day ever!', happinessChange: 20, energyChange: -2 } },
    { label: 'Small budget ($5)', outcome: { cashChange: -5, message: 'Had fun without spending too much!', happinessChange: 10 } },
    { label: 'Help run a booth (earn!)', outcome: { cashChange: 8, message: 'Earned $8 helping out!', happinessChange: 8, energyChange: -2 } }
  ], weight: 5, minWeek: 6 },
  
  { id: 'charity', title: '💝 Charity Drive', description: 'School is collecting donations!', category: 'CHOICE', options: [
    { label: 'Donate $5', outcome: { cashChange: -5, message: 'You helped others!', happinessChange: 15 } },
    { label: 'Donate $2', outcome: { cashChange: -2, message: 'Every bit helps!', happinessChange: 8 } },
    { label: 'Volunteer time instead', outcome: { cashChange: 0, message: 'Helped without spending!', happinessChange: 10, energyChange: -1 } }
  ], weight: 5, minWeek: 4 },
  
  { id: 'skill_class', title: '📚 Special Class!', description: 'There\'s a cool class you can take!', category: 'OPPORTUNITY', options: [
    { label: 'Take the class ($10)', outcome: { cashChange: -10, message: 'Learned something new!', happinessChange: 5, skillBoost: true } },
    { label: 'Maybe next time', outcome: { cashChange: 0, message: 'Saved your money', happinessChange: 0 } }
  ], weight: 5, minWeek: 8 }
];

export const KIDS_DIFFICULTIES: { [key: string]: KidsDifficulty } = {
  EASY: {
    name: 'Easy Peasy',
    emoji: '🌟',
    description: 'More money, easier saving!',
    allowanceMultiplier: 1.5,
    eventChanceMultiplier: 0.7,
    startingCash: 30
  },
  NORMAL: {
    name: 'Just Right',
    emoji: '⭐',
    description: 'A good challenge!',
    allowanceMultiplier: 1.0,
    eventChanceMultiplier: 1.0,
    startingCash: 20
  },
  HARD: {
    name: 'Super Saver',
    emoji: '💪',
    description: 'For expert savers!',
    allowanceMultiplier: 0.75,
    eventChanceMultiplier: 1.3,
    startingCash: 15
  }
};

export const KIDS_ACHIEVEMENTS = [
  { id: 'first_save', name: 'First Saver', emoji: '🐷', description: 'Saved your first $10!', requirement: 10 },
  { id: 'fifty_club', name: '$50 Club', emoji: '💰', description: 'Saved $50!', requirement: 50 },
  { id: 'hundred_hero', name: 'Hundred Hero', emoji: '🏆', description: 'Saved $100!', requirement: 100 },
  { id: 'money_master', name: 'Money Master', emoji: '👑', description: 'Saved $200!', requirement: 200 },
  { id: 'super_saver', name: 'Super Saver', emoji: '🦸', description: 'Saved $300!', requirement: 300 },
  { id: 'goal_getter', name: 'Goal Getter', emoji: '🎯', description: 'Reached a savings goal!', requirement: 0 }
];

export const WEEKLY_TIPS = [
  "💡 Saving a little each week adds up to a lot!",
  "💡 Think before you spend - do you really need it?",
  "💡 Helping others feels good AND is the right thing to do!",
  "💡 Starting a small business teaches you a lot!",
  "💡 It's okay to spend some money on fun things too!",
  "💡 Setting goals helps you stay motivated!",
  "💡 Compare prices before buying something!",
  "💡 Earning your own money feels awesome!",
  "💡 Patience is a super power when saving!",
  "💡 Every dollar saved is a step toward your goal!"
];
