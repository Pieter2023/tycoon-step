// Mode Selector with Multiplayer Support - v3.4.3
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, BriefcaseBusiness, LineChart, ShieldCheck, Trophy, Users, WalletCards } from 'lucide-react';
import App from './App';
import KidsApp from './KidsApp';
import { KidsGameState } from './kidsTypes';
import { getSaveSummary, getSaveSummaries, loadAdultGame, loadKidsGame, deleteSaveSlot, SaveSlotId, SaveSummary } from './services/storageService';
import { GameState, CareerPath, PlayerConfig, MultiplayerState } from './types';
import { CAREER_PATHS, CHARACTERS, DIFFICULTY_SETTINGS, INITIAL_GAME_STATE } from './constants';
import { calculateMonthlyCashFlowEstimate, calculateNetWorth } from './services/gameLogic';
import { useI18n } from './i18n';
import CustomAvatarBuilder, { CustomAvatarResult } from './components/customAvatar/CustomAvatarBuilder';
import UnlockModal from './components/UnlockModal';
import { AccessTier, getAccessTier, setAccessTier, validateAccessCode } from './services/accessControl';

type GameMode = 'select' | 'adult' | 'kids' | 'multiplayer-setup' | 'multiplayer-game';

const AUTH_KEY = 'tycoon_authenticated';

const PLAYER_COLORS = [
  { bg: 'from-emerald-500 to-teal-600', border: 'border-emerald-500' },
  { bg: 'from-blue-500 to-indigo-600', border: 'border-blue-500' },
  { bg: 'from-amber-500 to-orange-600', border: 'border-amber-500' },
  { bg: 'from-pink-500 to-rose-600', border: 'border-pink-500' },
];

const AVATAR_EMOJIS = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍⚕️', '👩‍⚕️', '👨‍🔧', '👩‍🔧', '🧑‍💼', '🧑‍💻'];

// Safe localStorage helpers (prevents crashes in privacy-restricted browsers)
const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage.getItem failed:', key, e);
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage.setItem failed:', key, e);
  }
};

const safeLocalStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('localStorage.removeItem failed:', key, e);
  }
};

const ModeSelector: React.FC = () => {
  const { t, formatNumber, formatCurrency, formatDateTime } = useI18n();
  const [mode, setMode] = useState<GameMode>('select');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [accessTier, setAccessTierState] = useState<AccessTier>(() => getAccessTier());
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
  // Multiplayer state
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([]);
  const [setupStep, setSetupStep] = useState<'count' | 'configure'>('count');
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerState | null>(null);
  const [customAvatarPlayerIndex, setCustomAvatarPlayerIndex] = useState<number | null>(null);

  // Save / Load (single player)
  const SAVE_SLOTS: SaveSlotId[] = ['autosave', 'slot1', 'slot2', 'slot3'];
  const [adultResumeState, setAdultResumeState] = useState<GameState | null>(null);
  const [kidsResumeState, setKidsResumeState] = useState<KidsGameState | null>(null);
  const [adultAutosave, setAdultAutosave] = useState<SaveSummary | null>(null);
  const [kidsAutosave, setKidsAutosave] = useState<SaveSummary | null>(null);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [saveSummaries, setSaveSummaries] = useState<SaveSummary[]>([]);

  useEffect(() => {
    const auth = safeLocalStorageGet(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (customAvatarPlayerIndex === null) return;
    if (!playerConfigs[customAvatarPlayerIndex]) {
      setCustomAvatarPlayerIndex(null);
    }
  }, [customAvatarPlayerIndex, playerConfigs]);

  const refreshSaves = () => {
    try {
      setAdultAutosave(getSaveSummary('adult', 'autosave'));
      setKidsAutosave(getSaveSummary('kids', 'autosave'));
      setSaveSummaries(getSaveSummaries());
    } catch (e) {
      console.warn('Failed to refresh save summaries:', e);
    }
  };

  useEffect(() => {
    if (mode === 'select') {
      refreshSaves();
    }
  }, [mode]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidating) return;
    setIsValidating(true);
    setError('');
    const ok = await validateAccessCode(password);
    setIsValidating(false);
    if (ok) {
      safeLocalStorageSet(AUTH_KEY, 'true');
      setAccessTier('full');
      setAccessTierState('full');
      setIsAuthenticated(true);
    } else {
      setError(t('modeSelector.auth.incorrectPassword'));
      setPassword('');
    }
  };

  const handleDemoStart = () => {
    safeLocalStorageSet(AUTH_KEY, 'true');
    setAccessTier('demo');
    setAccessTierState('demo');
    setIsAuthenticated(true);
  };

  const handleUnlocked = () => {
    setAccessTierState('full');
    setShowUnlockModal(false);
  };

  const handleLogout = () => {
    safeLocalStorageRemove(AUTH_KEY);
    setIsAuthenticated(false);
    setAdultResumeState(null);
    setKidsResumeState(null);
    setShowSaveManager(false);
    setMode('select');
    setMultiplayerState(null);
    setPlayerConfigs([]);
    setSetupStep('count');
  };

  const initializePlayerConfigs = (count: number) => {
    const configs: PlayerConfig[] = [];
    for (let i = 0; i < count; i++) {
      configs.push({
        id: `player-${i + 1}`,
        name: '',
        careerPath: 'TECH',
        difficulty: 'NORMAL',
        color: PLAYER_COLORS[i].bg,
        avatarEmoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
        avatarImage: undefined,
      });
    }
    setPlayerConfigs(configs);
    setSetupStep('configure');
  };

  const updatePlayerConfig = (index: number, updates: Partial<PlayerConfig>) => {
    setPlayerConfigs(prev => {
      const newConfigs = [...prev];
      newConfigs[index] = { ...newConfigs[index], ...updates };
      return newConfigs;
    });
  };

  const startMultiplayerGame = () => {
    // Validate all players have names
    if (playerConfigs.some(p => !p.name.trim())) {
      setError(t('modeSelector.multiplayer.allPlayersNeedNames'));
      return;
    }

    // Initialize game states for each player
    const gameStates: { [playerId: string]: GameState } = {};
    
    const fallbackPerk = CHARACTERS[0]?.perk ?? {
      id: 'perk_generalist',
      name: 'Generalist',
      description: 'No perk applied.'
    };

    playerConfigs.forEach(player => {
      const diffSettings = DIFFICULTY_SETTINGS[player.difficulty as keyof typeof DIFFICULTY_SETTINGS] || DIFFICULTY_SETTINGS.NORMAL;
      const careerInfo = CAREER_PATHS[player.careerPath];
      const startingLevel = careerInfo.levels[0];
      
      const playerGameState: GameState = {
        ...INITIAL_GAME_STATE,
        character: {
          id: player.id,
          name: player.name,
          backstory: '',
          avatarEmoji: player.avatarEmoji,
          avatarImage: player.avatarImage,
          avatarColor: player.color,
          careerPath: player.careerPath,
          startingBonus: { type: 'cash', amount: 0 },
          traits: [],
          perk: fallbackPerk,
        },
        difficulty: player.difficulty,
        cash: diffSettings.startingCash,
        career: {
          path: player.careerPath,
          level: 0,
          experience: 0,
          title: startingLevel.title,
          salary: Math.round(startingLevel.baseSalary * diffSettings.salaryMultiplier),
          skills: {},
          aiVulnerability: careerInfo.aiVulnerability,
          futureProofScore: careerInfo.futureProofScore,
        },
        netWorthHistory: [],
        family: { children: [], isEngaged: false },
        liabilities: [],
        assets: [],
        mortgages: [],
        vehicles: [],
        activeSideHustles: [],
        events: [],
      };
      
      gameStates[player.id] = playerGameState;
    });

    const mpState: MultiplayerState = {
      players: playerConfigs,
      currentPlayerIndex: 0,
      gameStates,
      turnsPerRound: 3,
      currentTurnInRound: 0,
      gameStarted: true,
      winner: null,
    };

    setMultiplayerState(mpState);
    setMode('multiplayer-game');
    setError('');
  };

  const handlePlayerTurnComplete = (playerId: string, newGameState: GameState) => {
    if (!multiplayerState) return;

    const updatedGameStates = {
      ...multiplayerState.gameStates,
      [playerId]: newGameState,
    };

    // Check if this player won
    let winner = multiplayerState.winner;
    if (newGameState.hasWon && !winner) {
      winner = playerId;
    }

    // Move to next player
    const nextPlayerIndex = (multiplayerState.currentPlayerIndex + 1) % multiplayerState.players.length;

    setMultiplayerState({
      ...multiplayerState,
      gameStates: updatedGameStates,
      currentPlayerIndex: nextPlayerIndex,
      winner,
    });
  };

  // Calculate player financial stats for winner screen
  const getPlayerStats = (playerId: string) => {
    if (!multiplayerState) return null;
    const gs = multiplayerState.gameStates[playerId];
    const cashFlow = calculateMonthlyCashFlowEstimate(gs);
    const netWorth = calculateNetWorth(gs);
    
    const totalExpenses = cashFlow.lifestyleCost + cashFlow.childrenExpenses + 
                         cashFlow.vehicleCosts + cashFlow.debtPayments + cashFlow.educationPayment;
    const surplus = cashFlow.passive - totalExpenses;
    
    return {
      passiveIncome: cashFlow.passive,
      totalExpenses,
      surplus,
      netWorth,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">{t('modeSelector.loading')}</div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <img src="/favicon.svg" alt="Tycoon" className="w-24 h-24 mx-auto rounded-xl shadow-2xl mb-4" 
                 onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-green-300 to-cyan-300 mb-2">
              {t('modeSelector.title')}
            </h1>
            <p className="text-lg text-white/70">{t('modeSelector.subtitle')}</p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold text-white">{t('modeSelector.auth.title')}</h2>
              <p className="text-slate-400 text-sm mt-1">{t('modeSelector.auth.subtitle')}</p>
            </div>

            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('modeSelector.auth.placeholder')}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all mb-4"
                autoFocus
              />
              
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center mb-4"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={isValidating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {isValidating ? t('modeSelector.auth.checking') : t('modeSelector.auth.enter')}
              </motion.button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-500 text-xs uppercase tracking-wider">{t('modeSelector.auth.or')}</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            <button
              type="button"
              onClick={handleDemoStart}
              className="w-full py-3 bg-slate-700/60 border border-slate-600 text-white font-bold rounded-xl hover:bg-slate-700 transition-all"
            >
              {t('modeSelector.auth.tryDemo')}
            </button>
            <p className="text-slate-500 text-xs text-center mt-2">{t('modeSelector.auth.demoHint')}</p>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            {t('modeSelector.createdBy')} <span className="text-slate-400">Pieter van der Walt</span>
          </p>
        </motion.div>
      </div>
    );
  }

  // Multiplayer Game
  if (mode === 'multiplayer-game' && multiplayerState) {
    const currentPlayer = multiplayerState.players[multiplayerState.currentPlayerIndex];
    const currentGameState = multiplayerState.gameStates[currentPlayer.id];

    return (
      <div className="relative">
        {/* Player Turn Indicator */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentPlayer.color} flex items-center justify-center text-xl overflow-hidden`}>
                {currentPlayer.avatarImage ? (
                  <img
                    src={currentPlayer.avatarImage}
                    alt={currentPlayer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentPlayer.avatarEmoji
                )}
              </div>
              <div>
                <p className="text-white font-bold">
                  {t('modeSelector.multiplayer.turnLabel', { name: currentPlayer.name })}
                </p>
                <p className="text-slate-400 text-xs">
                  {t(DIFFICULTY_SETTINGS[currentPlayer.difficulty as keyof typeof DIFFICULTY_SETTINGS]?.label || 'difficulty.normal')}
                </p>
              </div>
            </div>
            
            {/* Leaderboard Mini */}
            <div className="flex items-center gap-3">
              {multiplayerState.players.map((player, idx) => {
                const stats = getPlayerStats(player.id);
                const isActive = idx === multiplayerState.currentPlayerIndex;
                return (
                  <div key={player.id} className={`text-center px-3 py-1 rounded-lg ${isActive ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-800/50'}`}>
                    <p className="text-xs text-slate-400">{player.name}</p>
                    <p className={`text-sm font-bold ${(stats?.surplus || 0) > 0 ? 'text-emerald-400' : 'text-white'}`}>
                      ${stats?.passiveIncome || 0}/mo
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setMode('select');
                setMultiplayerState(null);
                setPlayerConfigs([]);
                setSetupStep('count');
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-all"
            >
              {t('modeSelector.multiplayer.exit')}
            </button>
          </div>
        </div>

        {/* Winner Banner */}
        {multiplayerState.winner && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 rounded-3xl p-8 text-center max-w-lg w-full mx-4"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-6xl mb-4"
              >🏆</motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {multiplayerState.players.find(p => p.id === multiplayerState.winner)?.name} Wins!
              </h2>
              <p className="text-white/90 mb-2">🎉 Achieved Financial Freedom!</p>
              <p className="text-white/70 text-sm italic mb-6">
                {(() => {
                  const loserCount = multiplayerState.players.length - 1;
                  const funMessages = [
                    `${loserCount === 1 ? 'Your opponent is' : 'All opponents are'} now questioning their life choices. 🤔`,
                    `The rat race just got a lot lonelier for everyone else! 🐀`,
                    `Someone's about to retire on a yacht while the others row to work. ⛵`,
                    `Achievement unlocked: Making friends feel poor since ${new Date().getFullYear()}! 💸`,
                    `${loserCount === 1 ? 'They\'re' : 'They\'re all'} going to need financial therapy. 📊`,
                  ];
                  return funMessages[Math.floor(Math.random() * funMessages.length)];
                })()}
              </p>
              
              {/* Winner Stats */}
              {(() => {
                const winnerStats = getPlayerStats(multiplayerState.winner);
                return winnerStats && (
                  <div className="bg-black/20 rounded-xl p-4 mb-4">
                    <h3 className="text-white font-bold mb-2">🎯 Victory Stats</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-left text-white/70">Passive Income:</div>
                      <div className="text-right text-emerald-300 font-bold">${winnerStats.passiveIncome.toLocaleString()}/mo</div>
                      <div className="text-left text-white/70">Total Expenses:</div>
                      <div className="text-right text-red-300 font-bold">${winnerStats.totalExpenses.toLocaleString()}/mo</div>
                      <div className="text-left text-white/70 font-bold">Monthly Surplus:</div>
                      <div className="text-right text-yellow-300 font-bold">+${winnerStats.surplus.toLocaleString()}/mo</div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Final Standings - The Hall of Financial Shame */}
              <div className="bg-black/20 rounded-xl p-4 mb-6">
                <h3 className="text-white font-bold mb-3">📊 The Financial Scoreboard</h3>
                {multiplayerState.players
                  .map(player => {
                    const stats = getPlayerStats(player.id);
                    return { 
                      ...player, 
                      surplus: stats?.surplus || 0,
                      netWorth: stats?.netWorth || 0,
                      passiveIncome: stats?.passiveIncome || 0,
                      totalExpenses: stats?.totalExpenses || 0,
                    };
                  })
                  .sort((a, b) => b.surplus - a.surplus)
                  .map((player, idx) => (
                    <div key={player.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🦆'}</span>
                        <span className="text-white">{player.name}</span>
                        {idx === 0 && <span className="text-xs bg-amber-600 px-2 py-0.5 rounded-full">Winner!</span>}
                        {player.surplus < 0 && idx > 0 && <span className="text-xs bg-red-600/50 px-2 py-0.5 rounded-full">Still Working 😅</span>}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${player.surplus > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                          {player.surplus >= 0 ? '+' : ''}${player.surplus.toLocaleString()}/mo
                        </p>
                        <p className="text-xs text-white/60">Net Worth: ${player.netWorth >= 1000000 ? `${(player.netWorth/1000000).toFixed(1)}M` : `${(player.netWorth/1000).toFixed(0)}K`}</p>
                      </div>
                    </div>
                  ))}
              </div>
              
              <button
                onClick={() => {
                  setMode('select');
                  setMultiplayerState(null);
                  setPlayerConfigs([]);
                  setSetupStep('count');
                }}
                className="px-6 py-3 bg-white text-amber-600 font-bold rounded-xl hover:bg-white/90 transition-all"
              >
                Back to Menu
              </button>
            </motion.div>
          </div>
        )}

        {/* Game Instance */}
        <div className="pt-16">
          <App
            key={currentPlayer.id}
            initialGameState={currentGameState}
            playerConfig={currentPlayer}
            isMultiplayer={true}
            onTurnComplete={(newState) => handlePlayerTurnComplete(currentPlayer.id, newState)}
            onBackToMenu={() => {
              setMode('select');
              setMultiplayerState(null);
            }}
          />
        </div>
      </div>
    );
  }

  // Multiplayer Setup
  if (mode === 'multiplayer-setup') {
    if (customAvatarPlayerIndex !== null) {
      const player = playerConfigs[customAvatarPlayerIndex];
      if (player) {
        return (
          <CustomAvatarBuilder
            initialName={player.name}
            initialCareerPath={player.careerPath}
            onCancel={() => setCustomAvatarPlayerIndex(null)}
            onComplete={(result: CustomAvatarResult) => {
              updatePlayerConfig(customAvatarPlayerIndex, {
                name: result.name,
                careerPath: result.careerPath,
                avatarImage: result.avatarImage
              });
              setCustomAvatarPlayerIndex(null);
            }}
          />
        );
      }
    }
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-green-300 to-cyan-300 mb-2">
              👥 Multiplayer Setup
            </h1>
            <p className="text-white/70">Set up your game with friends and family</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {setupStep === 'count' ? (
              <motion.div
                key="count"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-8"
              >
                <h2 className="text-xl font-bold text-white mb-6 text-center">How many players?</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[2, 3, 4].map(count => (
                    <motion.button
                      key={count}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNumPlayers(count)}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        numPlayers === count 
                          ? 'border-emerald-500 bg-emerald-500/20' 
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-4xl mb-2">
                        {'👤'.repeat(count)}
                      </div>
                      <p className="text-white font-bold text-lg">{count} Players</p>
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setMode('select')}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => initializePlayerConfigs(numPlayers)}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all"
                  >
                    Continue →
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-center mb-4 bg-red-500/10 border border-red-500/30 rounded-lg py-2"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="space-y-6">
                  {playerConfigs.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-gradient-to-r ${PLAYER_COLORS[index].bg} p-1 rounded-2xl`}
                    >
                      <div className="bg-slate-800 rounded-xl p-6">
                        {/* Name and Avatar */}
                        <div className="flex items-center gap-4 mb-4">
                          <button
                            onClick={() => {
                              if (player.avatarImage) {
                                setCustomAvatarPlayerIndex(index);
                                return;
                              }
                              const currentIdx = AVATAR_EMOJIS.indexOf(player.avatarEmoji);
                              const nextIdx = (currentIdx + 1) % AVATAR_EMOJIS.length;
                              updatePlayerConfig(index, { avatarEmoji: AVATAR_EMOJIS[nextIdx] });
                            }}
                            className={`w-14 h-14 rounded-full bg-gradient-to-br ${PLAYER_COLORS[index].bg} flex items-center justify-center text-3xl hover:scale-110 transition-transform overflow-hidden`}
                            title={player.avatarImage ? 'Click to edit custom avatar' : 'Click to change avatar'}
                          >
                            {player.avatarImage ? (
                              <img src={player.avatarImage} alt={player.name || 'Avatar'} className="w-full h-full object-cover" />
                            ) : (
                              player.avatarEmoji
                            )}
                          </button>
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => updatePlayerConfig(index, { name: e.target.value })}
                            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:border-emerald-500"
                            placeholder="Enter your name..."
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <button
                            onClick={() => setCustomAvatarPlayerIndex(index)}
                            className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                          >
                            {player.avatarImage ? 'Edit Custom Avatar' : 'Create Custom Avatar'}
                          </button>
                          {player.avatarImage && (
                            <button
                              onClick={() => updatePlayerConfig(index, { avatarImage: undefined })}
                              className="px-3 py-1 rounded-full bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 hover:bg-slate-600 transition-all"
                            >
                              Use Emoji
                            </button>
                          )}
                        </div>

                        {/* Career Selection */}
                        <div className="mb-4">
                          <p className="text-slate-400 text-sm mb-2">Choose Your Career:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(Object.keys(CAREER_PATHS) as CareerPath[]).map(careerKey => {
                              const career = CAREER_PATHS[careerKey];
                              return (
                                <button
                                  key={careerKey}
                                  onClick={() => updatePlayerConfig(index, { careerPath: careerKey })}
                                  className={`p-3 rounded-lg border-2 transition-all ${
                                    player.careerPath === careerKey
                                      ? 'border-emerald-500 bg-emerald-500/20'
                                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                                  }`}
                                >
                                  <div className="text-2xl text-center mb-1">{career.icon}</div>
                                  <p className="text-white text-sm text-center font-medium">{career.name}</p>
                                  <p className="text-slate-400 text-xs text-center">AI-Proof: {career.futureProofScore}%</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Difficulty Selection */}
                        <div>
                          <p className="text-slate-400 text-sm mb-2">Difficulty Level:</p>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {Object.entries(DIFFICULTY_SETTINGS).map(([key, settings]) => (
                              <button
                                key={key}
                                onClick={() => updatePlayerConfig(index, { difficulty: key })}
                                className={`p-2 rounded-lg border-2 transition-all ${
                                  player.difficulty === key
                                    ? 'border-emerald-500 bg-emerald-500/20'
                                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                                }`}
                              >
                                <p className="text-white text-sm font-medium">{settings.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setSetupStep('count')}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={startMultiplayerGame}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all"
                  >
                    🎮 Start Game!
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center mt-8">
            <button
              onClick={() => setMode('select')}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Back to Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game modes
  if (mode === 'adult') {
    return (
      <App
        onBackToMenu={() => { setAccessTierState(getAccessTier()); setMode('select'); }}
        initialGameState={adultResumeState || undefined}
        accessTier={accessTier}
      />
    );
  }

  if (mode === 'kids') {
    return (
      <KidsApp
        onBackToMenu={() => setMode('select')}
        initialGameState={kidsResumeState || undefined}
      />
    );
  }

  const launchStats = [
    { label: 'Financial systems', value: '45+', icon: WalletCards },
    { label: 'Life events', value: '80+', icon: ShieldCheck },
    { label: 'Skill paths', value: '4', icon: BookOpen }
  ];

  const modeCards = [
    {
      title: 'Adult Simulation',
      eyebrow: 'Full Experience',
      body: 'Build income, manage debt, invest through cycles, and beat career disruption.',
      Icon: BriefcaseBusiness,
      onClick: () => { setAdultResumeState(null); setMode('adult'); },
      cta: 'Start adult game',
      image: '/event-images/ai_opportunity.webp',
      tone: 'border-emerald-400/25 hover:border-emerald-300/70',
      iconTone: 'bg-emerald-400 text-slate-950',
      bullets: ['Command center', 'Investing engine', 'Career and lifestyle pressure']
    },
    {
      title: 'Kids Mode',
      eyebrow: 'Ages 8-10',
      body: 'A simpler financial game focused on saving, goals, and money basics.',
      Icon: BookOpen,
      onClick: () => { setKidsResumeState(null); setMode('kids'); },
      cta: 'Start kids game',
      image: '/event-images/child_school.webp',
      tone: 'border-cyan-400/25 hover:border-cyan-300/70',
      iconTone: 'bg-cyan-300 text-slate-950',
      bullets: ['Simple choices', 'Goal saving', 'Family friendly pacing']
    },
    {
      title: 'Multiplayer',
      eyebrow: '2-4 Players',
      body: 'Run the race with different careers, difficulties, and strategy styles.',
      Icon: Users,
      onClick: () => {
        if (accessTier === 'demo') {
          setShowUnlockModal(true);
          return;
        }
        setMode('multiplayer-setup');
      },
      cta: accessTier === 'demo' ? 'Unlock to play' : 'Set up match',
      image: '/event-images/business_opportunity.webp',
      tone: 'border-amber-400/25 hover:border-amber-300/70',
      iconTone: 'bg-amber-300 text-slate-950',
      bullets: ['Shared table play', 'Different starts', 'First to freedom wins']
    }
  ];

  // Mode Selection Screen
  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid flex-1 items-center gap-8 py-6 lg:grid-cols-[1.08fr_0.92fr]"
        >
          <section>
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              <LineChart size={15} />
              Financial freedom simulator
            </div>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Build the life, not just the balance sheet.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Tycoon turns investing, career risk, debt, education, and life events into one clear decision loop. Make the next month matter.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {launchStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between">
                      <Icon size={17} className="text-emerald-300" />
                      <span className="text-2xl font-black text-white">{stat.value}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 shadow-[0_28px_70px_rgba(0,0,0,0.35)]">
            <div className="relative h-72">
              <img
                src="/event-images/market_crash_opportunity.webp"
                alt="Tycoon market opportunity"
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Core loop</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-200">
                  <div className="rounded-md border border-white/10 bg-white/10 px-2 py-2">Earn</div>
                  <div className="rounded-md border border-white/10 bg-white/10 px-2 py-2">Invest</div>
                  <div className="rounded-md border border-white/10 bg-white/10 px-2 py-2">Advance</div>
                </div>
              </div>
            </div>
          </section>
        </motion.div>

        {/* Demo banner */}
        {accessTier === 'demo' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-5 py-4"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Demo mode</p>
              <p className="text-sm text-slate-300 mt-1">You're playing the free demo — 3 in-game years of the adult simulation. Unlock the full game for unlimited play and multiplayer.</p>
            </div>
            <button
              onClick={() => setShowUnlockModal(true)}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white transition hover:from-emerald-600 hover:to-cyan-600"
            >
              Unlock Full Game
            </button>
          </motion.div>
        )}

        <UnlockModal
          open={showUnlockModal}
          title="Unlock the Full Game"
          description="Enter your access code to remove all limits."
          perks={['Unlimited in-game years', 'Multiplayer for 2-4 players', 'All future updates']}
          onUnlocked={handleUnlocked}
          onClose={() => setShowUnlockModal(false)}
        />

        {/* Continue Panel */}
        {(adultAutosave || kidsAutosave) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Resume</p>
                <h3 className="mt-1 text-lg font-bold text-white">Continue where you left off</h3>
                <p className="text-sm text-slate-400">Autosave resumes your last session. Manage Saves lets you load manual slots.</p>
              </div>
              <button
                onClick={() => { refreshSaves(); setShowSaveManager(true); }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:border-slate-500"
              >
                Manage Saves
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {adultAutosave && (
                <button
                  onClick={() => {
                    const loaded = loadAdultGame('autosave');
                    if (!loaded) return;
                    setAdultResumeState(loaded);
                    setMode('adult');
                  }}
                  className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-left transition hover:border-emerald-300/70"
                >
                  <p className="flex items-center gap-2 font-bold text-white"><ArrowRight size={16} /> Continue Adult</p>
                  <p className="text-slate-300 text-sm mt-1">Year {Math.ceil((adultAutosave.month || 1) / 12)} • Month {(((adultAutosave.month || 1) - 1) % 12) + 1}</p>
                  <p className="text-slate-400 text-xs mt-1">Cash: ${(adultAutosave.cash || 0).toLocaleString()} • Net Worth: ${(adultAutosave.netWorth || 0).toLocaleString()}</p>
                </button>
              )}

              {kidsAutosave && (
                <button
                  onClick={() => {
                    const loaded = loadKidsGame('autosave');
                    if (!loaded) return;
                    setKidsResumeState(loaded);
                    setMode('kids');
                  }}
                  className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 p-4 text-left transition hover:border-cyan-300/70"
                >
                  <p className="flex items-center gap-2 font-bold text-white"><ArrowRight size={16} /> Continue Kids</p>
                  <p className="text-slate-300 text-sm mt-1">Week {kidsAutosave.week || 1}</p>
                  <p className="text-slate-400 text-xs mt-1">Cash: ${(kidsAutosave.cashOnHand || 0).toLocaleString()} {kidsAutosave.savingsGoalName ? `• Goal: ${kidsAutosave.savingsGoalName}` : ''}</p>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Save Manager Modal */}
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
                className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                  <div>
                    <h2 className="text-white font-bold text-lg">💾 Manage Saves</h2>
                    <p className="text-slate-400 text-xs">Load or delete Autosave and manual slots.</p>
                  </div>
                  <button
                    onClick={() => setShowSaveManager(false)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {(['adult','kids'] as const).map(m => (
                    <div key={m}>
                      <h3 className="text-white font-bold mb-3">{m === 'adult' ? 'Adult Mode' : 'Kids Mode'}</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {SAVE_SLOTS.map(slotId => {
                          const summary = saveSummaries.find(s => s.mode === m && s.slotId === slotId);
                          const isEmpty = !summary;
                          const title = slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot','')}`;

                          return (
                            <div key={slotId} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-white font-bold">{title}</p>
                                  {isEmpty ? (
                                    <p className="text-slate-400 text-sm">Empty</p>
                                  ) : (
                                    <p className="text-slate-300 text-sm">Last saved: {new Date(summary.updatedAt).toLocaleString()}</p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button
                                    disabled={isEmpty}
                                    onClick={() => {
                                      if (m === 'adult') {
                                        const loaded = loadAdultGame(slotId);
                                        if (!loaded) return;
                                        setAdultResumeState(loaded);
                                        setMode('adult');
                                      } else {
                                        const loaded = loadKidsGame(slotId);
                                        if (!loaded) return;
                                        setKidsResumeState(loaded);
                                        setMode('kids');
                                      }
                                      setShowSaveManager(false);
                                    }}
                                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium"
                                  >
                                    Load
                                  </button>
                                  <button
                                    disabled={isEmpty}
                                    onClick={() => {
                                      deleteSaveSlot(m, slotId);
                                      refreshSaves();
                                    }}
                                    className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button
                      onClick={() => refreshSaves()}
                      className="text-slate-400 hover:text-white text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Choose a mode</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Start with the version that fits the table.</h2>
            </div>
            <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex">
              <Trophy size={15} className="text-amber-300" />
              Progress saves automatically
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {modeCards.map((card, index) => {
              const Icon = card.Icon;
              return (
                <motion.button
                  key={card.title}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={card.onClick}
                  className={`group overflow-hidden rounded-lg border bg-slate-900/70 text-left shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition ${card.tone}`}
                >
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={card.image}
                      alt=""
                      className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                    <div className={`absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg ${card.iconTone}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{card.eyebrow}</p>
                    <h3 className="mt-2 text-xl font-bold text-white">{card.title}</h3>
                    <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-300">{card.body}</p>
                    <div className="mt-4 space-y-2">
                      {card.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          {bullet}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white">
                      {card.cta}
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-slate-500 text-sm mb-2">
            Created by <span className="text-slate-400 font-medium">Pieter van der Walt</span>
          </p>
          <button
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
          >
            Logout
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ModeSelector;
