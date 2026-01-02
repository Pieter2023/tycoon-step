// Kids Mode - Money Quest! (Ages 8-10)
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  KidsGameState, KidsCharacter, KidsLifeEvent, KidsCollectible, KidsSavingsGoal,
  INITIAL_KIDS_STATE 
} from './kidsTypes';
import { 
  KIDS_CHARACTERS, KIDS_CAREERS, KIDS_SIDE_HUSTLES, KIDS_LIFE_EVENTS,
  KIDS_COLLECTIBLES, KIDS_SAVINGS_GOALS, KIDS_DIFFICULTIES, KIDS_ACHIEVEMENTS,
  WEEKLY_TIPS
} from './kidsConstants';
import { saveKidsGame, loadKidsGame, getSaveSummaries, deleteSaveSlot, renameSaveSlot, SaveSlotId, SaveSummary } from './services/storageService';
import {Star, Heart, Zap, PiggyBank, Gift, ShoppingBag, Target, Trophy, ArrowRight, Sparkles, Volume2, VolumeX, X, Save as SaveIcon, FolderOpen as FolderOpenIcon, Trash2} from 'lucide-react';

interface KidsAppProps {
  onBackToMenu: () => void;
  initialGameState?: KidsGameState;
}

const KidsApp: React.FC<KidsAppProps> = ({ onBackToMenu, initialGameState }) => {
  const isResumingFromSave = !!initialGameState && !!initialGameState.character;
  const [gameState, setGameState] = useState<KidsGameState>(initialGameState || INITIAL_KIDS_STATE);
  const [gameStarted, setGameStarted] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(!isResumingFromSave);
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialGameState?.difficulty || 'NORMAL');
  const [activeTab, setActiveTab] = useState<'home' | 'earn' | 'spend' | 'goals'>('home');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Save / Load
  const SAVE_SLOTS: SaveSlotId[] = ['autosave', 'slot1', 'slot2', 'slot3'];
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [saveSummaries, setSaveSummaries] = useState<SaveSummary[]>([]);

  const formatDateTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return '';
    }
  };

  const refreshSaveSummaries = () => {
    setSaveSummaries(getSaveSummaries('kids'));
  };

  const openSaveManager = () => {
    refreshSaveSummaries();
    setShowSaveManager(true);
  };

  const handleSaveToSlot = (slotId: SaveSlotId) => {
    saveKidsGame(gameState, slotId);
    refreshSaveSummaries();
    setShowCelebration(`Saved! (${slotId === 'autosave' ? 'Autosave' : slotId})`);
    setTimeout(() => setShowCelebration(null), 1500);
  };

  const handleLoadFromSlot = (slotId: SaveSlotId) => {
    const loaded = loadKidsGame(slotId);
    if (!loaded) {
      setShowCelebration(`No save in ${slotId}`);
      setTimeout(() => setShowCelebration(null), 1500);
      return;
    }
    setGameState(loaded);
    setShowCharacterSelect(false);
    setShowSaveManager(false);
    setShowCelebration(`Loaded! (${slotId === 'autosave' ? 'Autosave' : slotId})`);
    setTimeout(() => setShowCelebration(null), 1500);
  };

  const handleDeleteSlot = (slotId: SaveSlotId) => {
    deleteSaveSlot('kids', slotId);
    refreshSaveSummaries();
    setShowCelebration(`Deleted ${slotId}`);
    setTimeout(() => setShowCelebration(null), 1500);
  };

  const handleRenameSlot = (slotId: SaveSlotId) => {
    const current = saveSummaries.find(s => s.slotId === slotId)?.label || '';
    const newLabel = window.prompt('Name this save slot:', current);
    if (!newLabel) return;
    renameSaveSlot('kids', slotId, newLabel);
    refreshSaveSummaries();
  };

  // Autosave (debounced)
  useEffect(() => {
    if (showCharacterSelect) return;
    if (!gameState.character) return;
    const t = setTimeout(() => {
      saveKidsGame(gameState, 'autosave');
    }, 250);
    return () => clearTimeout(t);
  }, [gameState, showCharacterSelect]);


  // Format money for kids
  const formatMoney = (amount: number) => `$${amount.toFixed(0)}`;

  // Play celebration
  const celebrate = useCallback((type: 'small' | 'big' | 'goal') => {
    if (type === 'goal') {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    } else if (type === 'big') {
      confetti({ particleCount: 80, spread: 70 });
    } else {
      confetti({ particleCount: 30, spread: 50 });
    }
  }, []);

  // Start game with character
  const handleStartGame = useCallback((char: KidsCharacter) => {
    const diff = KIDS_DIFFICULTIES[selectedDifficulty];
    const tip = WEEKLY_TIPS[Math.floor(Math.random() * WEEKLY_TIPS.length)];
    
    setGameState({
      ...INITIAL_KIDS_STATE,
      character: char,
      difficulty: selectedDifficulty,
      cash: diff.startingCash,
      careerPath: char.careerPath,
      weeklyTip: tip,
      happiness: 80,
      energy: 5
    });
    
    setShowCharacterSelect(false);
    setGameStarted(true);
    celebrate('small');
  }, [selectedDifficulty, celebrate]);

  // Process weekly turn
  const handleNextWeek = useCallback(() => {
    if (isProcessing || gameState.pendingEvent) return;
    setIsProcessing(true);

    setTimeout(() => {
      setGameState(prev => {
        const diff = KIDS_DIFFICULTIES[prev.difficulty];
        const career = KIDS_CAREERS[prev.careerPath];
        let newState = { ...prev, week: prev.week + 1 };

        // Weekly allowance
        const allowance = Math.round((career.baseAllowance + career.levels[prev.careerLevel].weeklyBonus) * diff.allowanceMultiplier);
        newState.cash += allowance;
        newState.totalEarned += allowance;

        // Side hustle earnings
        let hustleEarnings = 0;
        for (const hustleId of prev.activeHustles) {
          const hustle = KIDS_SIDE_HUSTLES.find(h => h.id === hustleId);
          if (hustle && newState.energy > 0) {
            const earnings = Math.floor(Math.random() * (hustle.earnRange.max - hustle.earnRange.min + 1)) + hustle.earnRange.min;
            hustleEarnings += earnings;
            newState.energy = Math.max(0, newState.energy - hustle.energyCost);
          }
        }
        newState.cash += hustleEarnings;
        newState.totalEarned += hustleEarnings;

        // Restore energy
        newState.energy = Math.min(5, newState.energy + 2);

        // Update collectible values (small random changes)
        newState.collectibles = prev.collectibles.map(c => ({
          ...c,
          currentValue: Math.max(1, Math.round(c.currentValue * (0.95 + Math.random() * 0.15)))
        }));

        // Check for skill level up
        if (prev.skillPoints >= (prev.careerLevel + 1) * 10 && prev.careerLevel < 3) {
          newState.careerLevel = prev.careerLevel + 1;
          newState.skillPoints = 0;
        }

        // Update savings goal progress
        if (newState.savingsGoal && !newState.savingsGoal.completed) {
          if (newState.cash >= newState.savingsGoal.targetAmount) {
            newState.savingsGoal = { ...newState.savingsGoal, savedAmount: newState.cash, completed: true };
            newState.completedGoals = [...prev.completedGoals, newState.savingsGoal.id];
            newState.hasWon = true;
          } else {
            newState.savingsGoal = { ...newState.savingsGoal, savedAmount: newState.cash };
          }
        }

        // Check achievements
        const cashAchievements = [
          { id: 'first_save', threshold: 10 },
          { id: 'fifty_club', threshold: 50 },
          { id: 'hundred_hero', threshold: 100 },
          { id: 'money_master', threshold: 200 },
          { id: 'super_saver', threshold: 300 }
        ];
        for (const ach of cashAchievements) {
          if (newState.cash >= ach.threshold && !prev.achievements.find(a => a.id === ach.id)) {
            const achData = KIDS_ACHIEVEMENTS.find(a => a.id === ach.id);
            if (achData) {
              newState.achievements = [...newState.achievements, { ...achData, unlockedWeek: newState.week }];
            }
          }
        }

        // Random event
        const eventChance = 0.25 * diff.eventChanceMultiplier;
        if (Math.random() < eventChance) {
          const eligibleEvents = KIDS_LIFE_EVENTS.filter(e => {
            if (e.minWeek > newState.week) return false;
            if (e.requiresHustle && !prev.activeHustles.includes(e.requiresHustle)) return false;
            return true;
          });
          if (eligibleEvents.length > 0) {
            const totalWeight = eligibleEvents.reduce((sum, e) => sum + e.weight, 0);
            let rand = Math.random() * totalWeight;
            for (const event of eligibleEvents) {
              rand -= event.weight;
              if (rand <= 0) {
                newState.pendingEvent = event;
                break;
              }
            }
          }
        }

        // New weekly tip
        newState.weeklyTip = WEEKLY_TIPS[Math.floor(Math.random() * WEEKLY_TIPS.length)];

        return newState;
      });

      setIsProcessing(false);
    }, 500);
  }, [isProcessing, gameState.pendingEvent]);

  // Handle event choice
  const handleEventChoice = useCallback((optionIndex: number) => {
    if (!gameState.pendingEvent) return;

    const option = gameState.pendingEvent.options[optionIndex];
    const outcome = option.outcome;

    setGameState(prev => {
      let newState = { ...prev };
      
      newState.cash = Math.max(0, prev.cash + outcome.cashChange);
      if (outcome.cashChange > 0) {
        newState.totalEarned += outcome.cashChange;
      }
      
      if (outcome.happinessChange) {
        newState.happiness = Math.min(100, Math.max(0, prev.happiness + outcome.happinessChange));
      }
      
      if (outcome.energyChange) {
        newState.energy = Math.min(5, Math.max(0, prev.energy + outcome.energyChange));
      }
      
      if (outcome.skillBoost) {
        newState.skillPoints = prev.skillPoints + 3;
      }

      newState.eventHistory = [
        { week: prev.week, title: prev.pendingEvent!.title, result: outcome.message },
        ...prev.eventHistory.slice(0, 9)
      ];

      newState.pendingEvent = null;

      return newState;
    });

    if (outcome.cashChange > 0) {
      celebrate('small');
    }
  }, [gameState.pendingEvent, celebrate]);

  // Start side hustle
  const handleStartHustle = useCallback((hustleId: string) => {
    const hustle = KIDS_SIDE_HUSTLES.find(h => h.id === hustleId);
    if (!hustle) return;

    if (gameState.cash < hustle.startupCost) {
      setShowCelebration(`Need ${formatMoney(hustle.startupCost)} to start!`);
      setTimeout(() => setShowCelebration(null), 2000);
      return;
    }

    if (gameState.activeHustles.includes(hustleId)) {
      setShowCelebration('Already doing this!');
      setTimeout(() => setShowCelebration(null), 2000);
      return;
    }

    setGameState(prev => ({
      ...prev,
      cash: prev.cash - hustle.startupCost,
      activeHustles: [...prev.activeHustles, hustleId]
    }));

    celebrate('small');
  }, [gameState.cash, gameState.activeHustles, celebrate]);

  // Buy collectible
  const handleBuyCollectible = useCallback((item: typeof KIDS_COLLECTIBLES[0]) => {
    if (gameState.cash < item.price) {
      setShowCelebration(`Need ${formatMoney(item.price)} to buy!`);
      setTimeout(() => setShowCelebration(null), 2000);
      return;
    }

    const newCollectible: KidsCollectible = {
      id: item.id + '-' + Date.now(),
      name: item.name,
      emoji: item.emoji,
      purchasePrice: item.price,
      currentValue: item.price,
      purchaseWeek: gameState.week
    };

    setGameState(prev => ({
      ...prev,
      cash: prev.cash - item.price,
      collectibles: [...prev.collectibles, newCollectible]
    }));

    celebrate('small');
  }, [gameState.cash, gameState.week, celebrate]);

  // Set savings goal
  const handleSetGoal = useCallback((goal: typeof KIDS_SAVINGS_GOALS[0]) => {
    if (gameState.completedGoals.includes(goal.id)) {
      setShowCelebration('Already completed this goal!');
      setTimeout(() => setShowCelebration(null), 2000);
      return;
    }

    const newGoal: KidsSavingsGoal = {
      id: goal.id,
      name: goal.name,
      emoji: goal.emoji,
      targetAmount: goal.price,
      savedAmount: gameState.cash,
      completed: false
    };

    setGameState(prev => ({ ...prev, savingsGoal: newGoal }));
    celebrate('small');
  }, [gameState.completedGoals, gameState.cash, celebrate]);

  // Win celebration effect
  useEffect(() => {
    if (gameState.hasWon) {
      celebrate('goal');
    }
  }, [gameState.hasWon, celebrate]);

  // ========== CHARACTER SELECT SCREEN ==========
  if (showCharacterSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button onClick={onBackToMenu} className="mb-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold transition-all">
            ← Back to Menu
          </button>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 mb-2">
              🎮 Money Quest! 🎮
            </h1>
            <p className="text-xl text-white/80">Learn to save and earn!</p>
          </motion.div>

          {/* Difficulty Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white text-center mb-4">Choose Your Challenge</h2>
            <div className="flex justify-center gap-4 flex-wrap">
              {Object.entries(KIDS_DIFFICULTIES).map(([key, diff]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDifficulty(key)}
                  className={`px-6 py-3 rounded-2xl font-bold text-lg transition-all ${
                    selectedDifficulty === key
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg shadow-orange-500/50'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {diff.emoji} {diff.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Character Selection */}
          <h2 className="text-2xl font-bold text-white text-center mb-4">Pick Your Character!</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {KIDS_CHARACTERS.map((char, i) => (
              <motion.button
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStartGame(char)}
                className={`p-5 rounded-3xl bg-gradient-to-br ${char.color} shadow-lg text-white text-left relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                <div className="text-5xl mb-2">{char.emoji}</div>
                <h3 className="text-xl font-bold">{char.name}</h3>
                <p className="text-sm opacity-80 mb-2">{char.description}</p>
                <div className="text-xs bg-white/20 rounded-full px-2 py-1 inline-block">
                  ⭐ {char.specialty}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========== WIN SCREEN ==========
  if (gameState.hasWon) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-500 via-orange-500 to-pink-500 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
          className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl"
        >
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mb-4">
            YOU DID IT!
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            You saved {formatMoney(gameState.savingsGoal?.targetAmount || 0)} for your {gameState.savingsGoal?.emoji} {gameState.savingsGoal?.name}!
          </p>
          <p className="text-lg text-gray-600 mb-6">
            It took you {gameState.week} weeks!
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setGameState(INITIAL_KIDS_STATE);
                setShowCharacterSelect(true);
                setGameStarted(false);
              }}
              className="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              🎮 Play Again!
            </button>
            <button
              onClick={onBackToMenu}
              className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
            >
              ← Back to Menu
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========== MAIN GAME ==========
  const career = KIDS_CAREERS[gameState.careerPath];
  const currentLevel = career.levels[gameState.careerLevel];
  const weeklyEarnings = Math.round((career.baseAllowance + currentLevel.weeklyBonus) * KIDS_DIFFICULTIES[gameState.difficulty].allowanceMultiplier);
  const progressToNextLevel = gameState.careerLevel < 3 ? (gameState.skillPoints / ((gameState.careerLevel + 1) * 10)) * 100 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600">
      {/* Save Manager */}
      <AnimatePresence>
        {showSaveManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-500 to-pink-500">
                <div>
                  <h2 className="text-white font-bold text-lg">💾 Save & Load</h2>
                  <p className="text-white/80 text-xs">Autosaves often • Use slots to save special moments</p>
                </div>
                <button
                  onClick={() => setShowSaveManager(false)}
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {SAVE_SLOTS.map(slotId => {
                  const summary = saveSummaries.find(s => s.slotId === slotId);
                  const isEmpty = !summary;
                  const title = slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`;

                  return (
                    <div key={slotId} className="border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800">{title}</p>
                            {summary?.label && slotId !== 'autosave' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{summary.label}</span>
                            )}
                          </div>

                          {isEmpty ? (
                            <p className="text-gray-500 text-sm mt-1">Empty</p>
                          ) : (
                            <div className="text-sm mt-1 text-gray-700">
                              <p className="text-xs text-gray-500">Last saved: {formatDateTime(summary.updatedAt)}</p>
                              <p className="mt-1">Week {summary.week} • Cash {formatMoney(summary.cashOnHand || 0)}</p>
                              {summary.savingsGoalName && (
                                <p className="text-xs text-gray-600">Goal: {summary.savingsGoalName} ({formatMoney(summary.savingsGoalTarget || 0)})</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleSaveToSlot(slotId)}
                            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2"
                          >
                            <SaveIcon size={16} /> Save
                          </button>

                          <button
                            disabled={isEmpty}
                            onClick={() => handleLoadFromSlot(slotId)}
                            className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm flex items-center gap-2"
                          >
                            <FolderOpenIcon size={16} /> Load
                          </button>

                          <div className="flex gap-2">
                            <button
                              disabled={slotId === 'autosave' || isEmpty}
                              onClick={() => handleRenameSlot(slotId)}
                              className="flex-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 text-xs"
                            >
                              Rename
                            </button>
                            <button
                              disabled={isEmpty}
                              onClick={() => handleDeleteSlot(slotId)}
                              className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-50 disabled:text-gray-400 text-white text-xs flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowSaveManager(false)}
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="bg-black/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{gameState.character?.emoji}</span>
            <div>
              <h1 className="text-white font-bold text-lg">{gameState.character?.name}</h1>
              <p className="text-white/70 text-sm">{currentLevel.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Money */}
            <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-xl flex items-center gap-2">
              <PiggyBank size={24} />
              {formatMoney(gameState.cash)}
            </div>
            
            {/* Week */}
            <div className="bg-white/20 text-white px-3 py-2 rounded-full font-bold">
              Week {gameState.week}
            </div>

            {/* Menu */}
            <button
              onClick={() => {
                saveKidsGame(gameState, 'autosave');
                onBackToMenu();
              }}
              className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
              title="Back to Menu"
            >
              ←
            </button>

            {/* Save / Load */}
            <button
              onClick={openSaveManager}
              className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
              title="Save / Load"
            >
              <SaveIcon size={20} />
            </button>

            {/* Sound Toggle */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-black/10 p-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Happiness */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">😊</span>
            <div className="w-24 h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all"
                style={{ width: `${gameState.happiness}%` }}
              />
            </div>
          </div>

          {/* Energy Hearts */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart 
                key={i}
                size={24}
                className={i < gameState.energy ? 'text-red-400 fill-red-400' : 'text-white/30'}
              />
            ))}
          </div>

          {/* Skill Progress */}
          <div className="flex items-center gap-2">
            <Star className="text-yellow-400" size={24} />
            <div className="w-24 h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Savings Goal Progress */}
      {gameState.savingsGoal && (
        <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between text-white mb-2">
              <span className="font-bold flex items-center gap-2">
                <Target size={18} />
                Goal: {gameState.savingsGoal.emoji} {gameState.savingsGoal.name}
              </span>
              <span>{formatMoney(gameState.cash)} / {formatMoney(gameState.savingsGoal.targetAmount)}</span>
            </div>
            <div className="w-full h-4 bg-white/30 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (gameState.cash / gameState.savingsGoal.targetAmount) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white/10 p-2">
        <div className="max-w-4xl mx-auto flex justify-center gap-2">
          {[
            { id: 'home', label: 'Home', emoji: '🏠' },
            { id: 'earn', label: 'Earn', emoji: '💰' },
            { id: 'spend', label: 'Shop', emoji: '🛍️' },
            { id: 'goals', label: 'Goals', emoji: '🎯' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2 rounded-full font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {/* Event Modal */}
          {gameState.pendingEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">{gameState.pendingEvent.title}</h2>
                  <p className="text-gray-600 mt-2">{gameState.pendingEvent.description}</p>
                </div>
                <div className="space-y-3">
                  {gameState.pendingEvent.options.map((option, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEventChoice(i)}
                      className={`flex w-full p-4 rounded-2xl font-bold text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] ${
                        option.outcome.cashChange >= 0
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 focus:ring-green-500 focus:ring-offset-white'
                          : 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 focus:ring-orange-500 focus:ring-offset-white'
                      }`}
                    >
                      <div className="flex w-full justify-between items-center">
                        <span>{option.label}</span>
                        <span className={`flex-shrink-0 ${option.outcome.cashChange >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {option.outcome.cashChange >= 0 ? '+' : ''}{formatMoney(option.outcome.cashChange)}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {/* Weekly Tip */}
              <div className="bg-white/20 rounded-2xl p-4 mb-4 text-white text-center">
                <Sparkles className="inline mr-2" size={20} />
                {gameState.weeklyTip}
              </div>

              {/* Next Week Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNextWeek}
                disabled={isProcessing || !!gameState.pendingEvent}
                className="w-full py-5 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white font-bold text-2xl rounded-2xl shadow-lg shadow-orange-500/30 mb-6 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? '⏳ Loading...' : '▶️ Next Week!'} 
                <ArrowRight size={28} />
              </motion.button>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-1">💵</div>
                  <div className="text-2xl font-bold text-green-600">{formatMoney(weeklyEarnings)}</div>
                  <div className="text-sm text-gray-500">per week</div>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-1">📊</div>
                  <div className="text-2xl font-bold text-purple-600">{formatMoney(gameState.totalEarned)}</div>
                  <div className="text-sm text-gray-500">total earned</div>
                </div>
              </div>

              {/* Active Side Hustles */}
              {gameState.activeHustles.length > 0 && (
                <div className="bg-white rounded-2xl p-4 mb-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Zap className="text-yellow-500" size={20} />
                    Your Jobs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {gameState.activeHustles.map(id => {
                      const hustle = KIDS_SIDE_HUSTLES.find(h => h.id === id);
                      return hustle ? (
                        <span key={id} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          {hustle.emoji} {hustle.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {gameState.achievements.length > 0 && (
                <div className="bg-white rounded-2xl p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} />
                    Achievements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {gameState.achievements.map(ach => (
                      <span key={ach.id} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {ach.emoji} {ach.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* EARN TAB */}
          {activeTab === 'earn' && (
            <motion.div key="earn" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="text-2xl font-bold text-white mb-4">💰 Ways to Earn Money</h2>
              <div className="grid gap-4">
                {KIDS_SIDE_HUSTLES.map(hustle => {
                  const isActive = gameState.activeHustles.includes(hustle.id);
                  const canAfford = gameState.cash >= hustle.startupCost;
                  
                  return (
                    <motion.div
                      key={hustle.id}
                      whileHover={{ scale: 1.01 }}
                      className={`bg-white rounded-2xl p-4 ${isActive ? 'ring-2 ring-green-400' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{hustle.emoji}</span>
                          <div>
                            <h3 className="font-bold text-gray-800">{hustle.name}</h3>
                            <p className="text-sm text-gray-500">{hustle.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs">
                              <span className="text-green-600 font-medium">
                                Earns: ${hustle.earnRange.min}-${hustle.earnRange.max}/week
                              </span>
                              <span className="text-red-500 flex items-center gap-1">
                                <Heart size={12} className="fill-red-500" /> -{hustle.energyCost}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartHustle(hustle.id)}
                          disabled={isActive || !canAfford}
                          className={`px-4 py-2 rounded-xl font-bold transition-all ${
                            isActive
                              ? 'bg-green-100 text-green-600'
                              : canAfford
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:shadow-lg'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isActive ? '✓ Active' : hustle.startupCost > 0 ? `Start (${formatMoney(hustle.startupCost)})` : 'Start Free!'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SPEND TAB */}
          {activeTab === 'spend' && (
            <motion.div key="spend" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="text-2xl font-bold text-white mb-4">🛍️ Collectibles Shop</h2>
              
              {/* Owned collectibles */}
              {gameState.collectibles.length > 0 && (
                <div className="bg-white/20 rounded-2xl p-4 mb-4">
                  <h3 className="font-bold text-white mb-2">Your Collection</h3>
                  <div className="flex flex-wrap gap-2">
                    {gameState.collectibles.map(c => (
                      <span key={c.id} className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm">
                        {c.emoji} {c.name} ({formatMoney(c.currentValue)})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {KIDS_COLLECTIBLES.map(item => {
                  const canAfford = gameState.cash >= item.price;
                  
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-2xl p-4 text-center"
                    >
                      <div className="text-4xl mb-2">{item.emoji}</div>
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                      <button
                        onClick={() => handleBuyCollectible(item)}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded-xl font-bold transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:shadow-lg'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {formatMoney(item.price)}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* GOALS TAB */}
          {activeTab === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="text-2xl font-bold text-white mb-4">🎯 Savings Goals</h2>
              
              {gameState.savingsGoal ? (
                <div className="bg-white rounded-2xl p-6 mb-4 text-center">
                  <div className="text-5xl mb-2">{gameState.savingsGoal.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-800">{gameState.savingsGoal.name}</h3>
                  <div className="text-3xl font-bold text-purple-600 my-2">
                    {formatMoney(gameState.cash)} / {formatMoney(gameState.savingsGoal.targetAmount)}
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                      style={{ width: `${Math.min(100, (gameState.cash / gameState.savingsGoal.targetAmount) * 100)}%` }}
                    />
                  </div>
                  <p className="text-gray-500 mt-2">
                    {formatMoney(gameState.savingsGoal.targetAmount - gameState.cash)} more to go!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {KIDS_SAVINGS_GOALS.map(goal => {
                    const completed = gameState.completedGoals.includes(goal.id);
                    
                    return (
                      <motion.div
                        key={goal.id}
                        whileHover={{ scale: 1.01 }}
                        className={`bg-white rounded-2xl p-4 ${completed ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{goal.emoji}</span>
                            <div>
                              <h3 className="font-bold text-gray-800">{goal.name}</h3>
                              <p className="text-sm text-gray-500">{goal.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSetGoal(goal)}
                            disabled={completed}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${
                              completed
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg'
                            }`}
                          >
                            {completed ? '✓ Done!' : formatMoney(goal.price)}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full font-bold"
          >
            {showCelebration}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KidsApp;
