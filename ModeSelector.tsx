// Mode Selector with Multiplayer Support - v3.4.3
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from 'framer-motion';
import { ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, Check, ChevronRight, CloudDownload, LineChart, Lock, Sparkles, Trophy, Users, WalletCards } from 'lucide-react';
import App from './App';
import KidsApp from './KidsApp';
import { KidsGameState } from './kidsTypes';
import { getSaveSummary, getSaveSummaries, loadAdultGame, loadKidsGame, deleteSaveSlot, saveAdultGame, SaveSlotId, SaveSummary } from './services/storageService';
import { GameState, CareerPath, PlayerConfig, MultiplayerState } from './types';
import { CAREER_PATHS, CHARACTERS, DIFFICULTY_SETTINGS, INITIAL_GAME_STATE } from './constants';
import { calculateMonthlyCashFlowEstimate, calculateNetWorth } from './services/gameLogic';
import { useI18n } from './i18n';
import CustomAvatarBuilder, { CustomAvatarResult } from './components/customAvatar/CustomAvatarBuilder';
import UnlockModal from './components/UnlockModal';
import AnimatedNumber from './components/ui/AnimatedNumber';
import { MOTION_DISABLED, materialize, riseIn, springs, stagger } from './components/ui/motion';
import { AccessTier, PURCHASE_PRICE, clearPendingAccessInvite, getAccessTier, getPendingAccessInvite, setAccessTier, validateAccessCode } from './services/accessControl';
import { createDailyChallengeState, getDailyChallengeId, getDailyCharacter, getDailySeed, getDailyStreak, getPreviousChallengeId, recordDailyChallengePlayed } from './services/dailyChallenge';
import { adoptSyncCode, fetchAccountSave, fetchCloudSave, getSyncCode, isCloudSyncEnabled, isValidSyncCode, setCloudSyncEnabled, uploadCloudSave } from './services/cloudSave';
import { AccountInfo, ensureSignedIn, getAccount, linkEmail, signInWithEmail, signOut } from './services/auth';
import { track } from './services/analytics';

type GameMode = 'select' | 'adult' | 'kids' | 'daily' | 'multiplayer-setup' | 'multiplayer-game';

// Whole-dollar money with the sign before the currency symbol (a save summary can be negative).
const formatSigned = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
const formatWholeDollars = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
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

/* =====================================================================
   Presentation helpers (landing only — no game logic lives here)
   ===================================================================== */

/** OS "reduce motion" is honoured on this screen too (App's own MotionConfig isn't mounted yet). */
const withMotion = (node: React.ReactNode) => <MotionConfig reducedMotion="user">{node}</MotionConfig>;

/** The headline arrives with a slightly longer rise than body copy. */
const riseInLarge: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { ...springs.smooth, duration: 0.55 } }
};

/** The hero product shot settles up into place (no blur: it's a large layer). */
const shotIn: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.965 },
  show: { opacity: 1, y: 0, scale: 1, transition: { ...springs.smooth, duration: 0.7 } }
};

/** `riseIn` that waits a beat (a variant's own transition wins over a `transition` prop). */
const riseInAfter = (delay: number): Variants => ({
  hidden: riseIn.hidden,
  show: { opacity: 1, y: 0, transition: { ...springs.smooth, delay } }
});

/** Glass chips floating over the product shot arrive just after it. */
const floatIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ...springs.smooth, delay: 0.22 } }
};

type Tint = 'green' | 'purple' | 'blue' | 'orange';

// Full class strings (not interpolated) so Tailwind sees every one of them.
const TINTS: Record<Tint, { glow: string; hoverBorder: string; text: string; check: string; medallion: string }> = {
  green: {
    glow: 'glow-green',
    hoverBorder: 'hover:border-[#30D158]/50',
    text: 'text-[#4CE07A]',
    check: 'text-[#30D158]',
    medallion: 'linear-gradient(150deg, #7BEFA6 0%, #30D158 46%, #1C9A44 100%)'
  },
  purple: {
    glow: 'glow-purple',
    hoverBorder: 'hover:border-[#BF5AF2]/50',
    text: 'text-[#D59BFF]',
    check: 'text-[#C77DFF]',
    medallion: 'linear-gradient(150deg, #E7B4FF 0%, #BF5AF2 48%, #8436C9 100%)'
  },
  blue: {
    glow: 'glow-blue',
    hoverBorder: 'hover:border-[#0A84FF]/50',
    text: 'text-[#70D7FF]',
    check: 'text-[#64D2FF]',
    medallion: 'linear-gradient(150deg, #9BE7FF 0%, #40C8E0 42%, #0A84FF 100%)'
  },
  orange: {
    glow: 'glow-yellow',
    hoverBorder: 'hover:border-[#FFD60A]/50',
    text: 'text-[#FFC04D]',
    check: 'text-[#FFB020]',
    medallion: 'linear-gradient(150deg, #FFE27A 0%, #FFB21E 48%, #FF8A00 100%)'
  }
};

/** An app-icon style medallion: a squircle of colour with a white glyph. */
const Medallion: React.FC<{ tint: Tint; size?: 'sm' | 'md' | 'lg'; className?: string; children: React.ReactNode }> = ({ tint, size = 'md', className = '', children }) => {
  const dims = size === 'lg' ? 'h-12 w-12 rounded-[14px]' : size === 'sm' ? 'h-8 w-8 rounded-[10px]' : 'h-10 w-10 rounded-[12px]';
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-8px_rgba(0,0,0,0.7)] ${dims} ${className}`}
      style={{ background: TINTS[tint].medallion }}
    >
      {children}
    </span>
  );
};

/**
 * A figure that rolls up from zero when it first appears (a spring, tabular digits). Reduced motion
 * and tests show the final value straight away.
 */
const CountUp: React.FC<{ to: number; format: (n: number) => string; className?: string; delayMs?: number }> = ({ to, format, className, delayMs = 0 }) => {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(() => (MOTION_DISABLED || reduce ? to : 0));
  useEffect(() => {
    if (MOTION_DISABLED || reduce) {
      setValue(to);
      return;
    }
    const id = window.setTimeout(() => setValue(to), delayMs);
    return () => window.clearTimeout(id);
  }, [to, delayMs, reduce]);
  return <AnimatedNumber value={value} format={format} className={className} flash={false} />;
};

/** An image that fades in once decoded, so lazy card art never pops in half-painted. */
const FadeImg: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className = '', onLoad, ...rest }) => {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(MOTION_DISABLED);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <img
      ref={ref}
      {...rest}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
};

/**
 * The hero "product shot": the market-crash key art in a deep, rounded frame with a soft coloured
 * glow and a glass core-loop bar. On a mouse/trackpad it tilts a few degrees towards the pointer
 * (critically damped springs, transforms only); touch and reduced motion get a still image.
 */
const HeroShot: React.FC = () => {
  const reduce = useReducedMotion();
  const [canTilt, setCanTilt] = useState(false);

  useEffect(() => {
    if (MOTION_DISABLED || reduce) {
      setCanTilt(false);
      return;
    }
    const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches ?? false;
    setCanTilt(fine && !document.documentElement.classList.contains('tycoon-reduce-motion'));
  }, [reduce]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const follow = { stiffness: 140, damping: 24, mass: 1 };
  const sx = useSpring(px, follow);
  const sy = useSpring(py, follow);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-4, 4]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [3, -3]);
  const imageX = useTransform(sx, [-0.5, 0.5], [12, -12]);
  const imageY = useTransform(sy, [-0.5, 0.5], [9, -9]);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canTilt || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => {
    px.set(0);
    py.set(0);
  };

  const loop = [
    { label: 'Earn', Icon: WalletCards, tint: 'green' as Tint },
    { label: 'Invest', Icon: LineChart, tint: 'blue' as Tint },
    { label: 'Advance', Icon: Trophy, tint: 'orange' as Tint }
  ];

  return (
    <div className="relative isolate" onPointerMove={handleMove} onPointerLeave={handleLeave}>
      {/* Soft coloured light behind the frame, and a floor shadow under it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-16 -inset-y-14 -z-10"
        style={{
          background:
            'radial-gradient(55% 50% at 30% 55%, rgb(48 209 88 / 0.20), transparent 70%), radial-gradient(50% 50% at 80% 35%, rgb(100 210 255 / 0.16), transparent 70%)'
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 -bottom-8 -z-10 h-16"
        style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgb(0 0 0 / 0.75), transparent 75%)' }}
      />

      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 1400 }}
        className="relative isolate overflow-hidden rounded-[32px] bg-[#111113] shadow-[0_50px_90px_-40px_rgba(0,0,0,0.95),0_20px_40px_-24px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.12]"
      >
        <motion.img
          src="/event-images/market_crash_opportunity.webp"
          alt="Tycoon market opportunity"
          loading="lazy"
          decoding="async"
          style={{ x: imageX, y: imageY, scale: 1.08 }}
          className="aspect-[3/2] w-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {/* Light catching the top edge of the frame. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]" />

        <motion.div
          variants={floatIn}
          className="absolute inset-x-4 bottom-4 rounded-[22px] border border-white/[0.14] bg-[rgb(18_18_20/0.62)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_32px_-18px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <p className="eyebrow text-emerald-300">Core loop</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            {loop.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Medallion tint={step.tint} size="sm">
                    <step.Icon size={16} strokeWidth={2.4} />
                  </Medallion>
                  <span className="truncate text-[15px] font-semibold text-white">{step.label}</span>
                </div>
                {i < loop.length - 1 && <ChevronRight aria-hidden="true" size={16} className="shrink-0 text-white/35" />}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
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

  // Daily challenge (seeded, ephemeral — no saves)
  const [dailyState, setDailyState] = useState<GameState | null>(null);
  const [dailyStreak, setDailyStreak] = useState(() => getDailyStreak());

  // Save / Load (single player)
  const SAVE_SLOTS: SaveSlotId[] = ['autosave', 'slot1', 'slot2', 'slot3'];
  const [adultResumeState, setAdultResumeState] = useState<GameState | null>(null);
  const [kidsResumeState, setKidsResumeState] = useState<KidsGameState | null>(null);
  const [adultAutosave, setAdultAutosave] = useState<SaveSummary | null>(null);
  const [kidsAutosave, setKidsAutosave] = useState<SaveSummary | null>(null);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [saveSummaries, setSaveSummaries] = useState<SaveSummary[]>([]);

  // Cloud sync (account-first with sync-code fallback; see services/cloudSave.ts)
  const [cloudSyncOn, setCloudSyncOn] = useState(() => isCloudSyncEnabled());
  const [cloudStatus, setCloudStatus] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  // Account (anonymous by default; email makes it portable)
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [accountSaveStamp, setAccountSaveStamp] = useState<string | null>(null);

  const refreshAccount = async () => {
    const acct = await getAccount();
    setAccount(acct);
    if (acct) {
      const save = await fetchAccountSave();
      setAccountSaveStamp(save ? save.updated_at : null);
    } else {
      setAccountSaveStamp(null);
    }
  };

  // Pick up magic-link redirects + existing sessions on load.
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLinkEmail = async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    setAccountStatus('Working…');
    // Linking creates the silent account first if this device doesn't have one.
    const result = account ? await linkEmail(accountEmail) : (await ensureSignedIn(), await linkEmail(accountEmail));
    setCloudBusy(false);
    setAccountStatus(result.message);
    if (result.ok) refreshAccount();
  };

  const handleEmailSignIn = async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    setAccountStatus('Working…');
    const result = await signInWithEmail(accountEmail);
    setCloudBusy(false);
    setAccountStatus(result.message);
  };

  const handleAccountRestore = async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    setCloudStatus('Fetching your account save…');
    const cloud = await fetchAccountSave();
    setCloudBusy(false);
    if (!cloud) {
      setCloudStatus('No save stored on this account yet.');
      return;
    }
    saveAdultGame(cloud.state, 'autosave');
    refreshSaves();
    setCloudStatus(`Restored ${cloud.summary?.name || 'save'} (month ${cloud.state.month}) into Autosave — hit Continue Adult to play.`);
  };

  const handleCloudBackup = async () => {
    if (cloudBusy) return;
    const autosave = loadAdultGame('autosave');
    if (!autosave) {
      setCloudStatus('No adult autosave to back up yet — play a month first.');
      return;
    }
    setCloudBusy(true);
    setCloudStatus('Backing up…');
    const stamp = await uploadCloudSave(autosave, {
      name: autosave.character?.name,
      month: autosave.month,
      netWorth: calculateNetWorth(autosave)
    });
    setCloudBusy(false);
    setCloudStatus(stamp ? `Backed up ${new Date(stamp).toLocaleTimeString()}.` : 'Backup failed — check your connection.');
  };

  const handleCloudRestore = async () => {
    if (cloudBusy) return;
    const code = restoreCode.trim().toLowerCase();
    if (!isValidSyncCode(code)) {
      setCloudStatus('That doesn\'t look like a sync code (8-4-4-4-12 characters).');
      return;
    }
    setCloudBusy(true);
    setCloudStatus('Looking up your save…');
    const cloud = await fetchCloudSave(code);
    setCloudBusy(false);
    if (!cloud) {
      setCloudStatus('No save found behind that code.');
      return;
    }
    saveAdultGame(cloud.state, 'autosave');
    adoptSyncCode(code); // future backups from this device go to the same slot
    refreshSaves();
    setRestoreCode('');
    setCloudStatus(`Restored ${cloud.summary?.name || 'save'} (month ${cloud.state.month}) into Autosave — hit Continue Adult to play.`);
  };

  useEffect(() => {
    let cancelled = false;

    const initializeAccess = async () => {
      const inviteCode = getPendingAccessInvite();
      if (inviteCode) {
        const unlocked = await validateAccessCode(inviteCode);
        if (cancelled) return;
        clearPendingAccessInvite();
        if (unlocked) {
          safeLocalStorageSet(AUTH_KEY, 'true');
          setAccessTier('full');
          setAccessTierState('full');
          setIsAuthenticated(true);
          setIsLoading(false);
          track('purchase_unlocked', { source: 'invite_link' });
          return;
        }
      }

      const auth = safeLocalStorageGet(AUTH_KEY);
      if (auth === 'true') {
        setIsAuthenticated(true);
      } else {
        // No password wall for first-time visitors — a stranger who lands here
        // (e.g. from an outreach link) should be playing in one click. Drop them
        // straight into the free demo. The full-version access-code path still
        // lives in the UnlockModal ("I already have an access code"). The old
        // login screen below is retained as a fallback but no longer shown.
        safeLocalStorageSet(AUTH_KEY, 'true');
        setAccessTier('demo');
        setAccessTierState('demo');
        setIsAuthenticated(true);
        track('demo_started', { entry: 'auto' });
      }
      setIsLoading(false);
    };

    void initializeAccess();
    return () => {
      cancelled = true;
    };
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

  // Loading state — normally a single frame, so it stays quiet: the label only fades in if
  // access validation (an invite link) actually takes a moment.
  if (isLoading) {
    return withMotion(
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="text-[15px] font-medium text-slate-500"
        >
          {t('modeSelector.loading')}
        </motion.div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return withMotion(
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          variants={materialize}
          initial="hidden"
          animate="show"
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <img src="/favicon.svg" alt="Tycoon" className="w-20 h-20 mx-auto rounded-[22px] shadow-2xl mb-5"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <h1 className="text-[40px] font-bold leading-tight tracking-[-0.03em] text-white mb-1">
              {t('modeSelector.title')}
            </h1>
            <p className="text-[17px] text-slate-400">{t('modeSelector.subtitle')}</p>
          </div>

          <div className="mat-sheet rounded-[28px] p-7 sm:p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-white">{t('modeSelector.auth.title')}</h2>
              <p className="text-slate-400 text-[15px] mt-1">{t('modeSelector.auth.subtitle')}</p>
            </div>

            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('modeSelector.auth.placeholder')}
                className="w-full px-4 py-3 mb-4 rounded-2xl border border-transparent bg-white/[0.07] text-base text-white placeholder:text-slate-500 outline-none transition-[border-color,box-shadow] focus:border-[#30D158]/60 focus:ring-4 focus:ring-[#30D158]/15"
                autoFocus
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.snappy}
                  className="text-red-400 text-sm text-center mb-4"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isValidating}
                className="btn-primary w-full min-h-[50px] text-[17px] disabled:cursor-wait"
              >
                {isValidating ? t('modeSelector.auth.checking') : t('modeSelector.auth.enter')}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-[13px]">{t('modeSelector.auth.or')}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleDemoStart}
              className="btn-secondary w-full min-h-[50px] text-[17px]"
            >
              {t('modeSelector.auth.tryDemo')}
            </button>
            <p className="text-slate-500 text-[13px] text-center mt-2">{t('modeSelector.auth.demoHint')}</p>
          </div>

          <p className="text-center text-slate-500 text-[13px] mt-6">
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

    return withMotion(
      <div className="relative">
        {/* Player Turn Indicator */}
        <div className="fixed top-0 left-0 right-0 z-50 mat-chrome border-b border-white/[0.08] px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${currentPlayer.color} ring-2 ring-white/10 flex items-center justify-center text-xl overflow-hidden`}>
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
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-white">
                  {t('modeSelector.multiplayer.turnLabel', { name: currentPlayer.name })}
                </p>
                <p className="text-slate-400 text-xs">
                  {t(DIFFICULTY_SETTINGS[currentPlayer.difficulty as keyof typeof DIFFICULTY_SETTINGS]?.label || 'difficulty.normal')}
                </p>
              </div>
            </div>

            {/* Leaderboard Mini */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {multiplayerState.players.map((player, idx) => {
                const stats = getPlayerStats(player.id);
                const isActive = idx === multiplayerState.currentPlayerIndex;
                return (
                  <div key={player.id} className={`shrink-0 text-center px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-emerald-400/15 ring-1 ring-emerald-400/50' : 'bg-white/[0.06]'}`}>
                    <p className="text-[11px] text-slate-400">{player.name}</p>
                    <p className={`num text-[13px] font-semibold ${(stats?.surplus || 0) > 0 ? 'text-emerald-400' : 'text-white'}`}>
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
              className="btn-secondary shrink-0 px-4 py-2 text-sm"
            >
              {t('modeSelector.multiplayer.exit')}
            </button>
          </div>
        </div>

        {/* Winner Banner */}
        {multiplayerState.winner && (
          <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-black/75">
            <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              variants={materialize}
              initial="hidden"
              animate="show"
              className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 p-8 text-center max-w-lg w-full mx-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_40px_80px_-30px_rgba(0,0,0,0.9)]"
            >
              <motion.div
                initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ ...springs.bouncy, delay: 0.15 }}
                className="text-6xl mb-4"
              >🏆</motion.div>
              <h2 className="text-3xl font-bold tracking-[-0.025em] text-white mb-2">
                {multiplayerState.players.find(p => p.id === multiplayerState.winner)?.name} Wins!
              </h2>
              <p className="text-white/90 mb-2">🎉 Achieved Financial Freedom!</p>
              <p className="text-white/75 text-sm italic mb-6">
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
                  <div className="bg-black/20 rounded-[18px] p-4 mb-4">
                    <h3 className="text-white font-semibold mb-2">🎯 Victory Stats</h3>
                    <div className="num grid grid-cols-2 gap-2 text-sm">
                      <div className="text-left text-white/75">Passive Income:</div>
                      <div className="text-right text-emerald-200 font-semibold">${winnerStats.passiveIncome.toLocaleString()}/mo</div>
                      <div className="text-left text-white/75">Total Expenses:</div>
                      <div className="text-right text-red-200 font-semibold">${winnerStats.totalExpenses.toLocaleString()}/mo</div>
                      <div className="text-left text-white/75 font-semibold">Monthly Surplus:</div>
                      <div className="text-right text-yellow-100 font-semibold">+${winnerStats.surplus.toLocaleString()}/mo</div>
                    </div>
                  </div>
                );
              })()}

              {/* Final Standings - The Hall of Financial Shame */}
              <div className="bg-black/20 rounded-[18px] p-4 mb-6">
                <h3 className="text-white font-semibold mb-3">📊 The Financial Scoreboard</h3>
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
                        {idx === 0 && <span className="text-xs bg-black/25 px-2 py-0.5 rounded-full">Winner!</span>}
                        {player.surplus < 0 && idx > 0 && <span className="text-xs bg-red-600/50 px-2 py-0.5 rounded-full">Still Working 😅</span>}
                      </div>
                      <div className="num text-right">
                        <p className={`font-semibold ${player.surplus > 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                          {player.surplus >= 0 ? '+' : ''}${player.surplus.toLocaleString()}/mo
                        </p>
                        <p className="text-xs text-white/65">Net Worth: ${player.netWorth >= 1000000 ? `${(player.netWorth/1000000).toFixed(1)}M` : `${(player.netWorth/1000).toFixed(0)}K`}</p>
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
                className="pressable rounded-full bg-white px-6 py-3 font-semibold text-amber-700 hover:bg-white/90"
              >
                Back to Menu
              </button>
            </motion.div>
            </div>
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
    const optionTile = (selected: boolean) =>
      `pressable rounded-2xl ring-1 transition-[background-color,box-shadow] ${
        selected
          ? 'bg-emerald-400/[0.14] ring-2 ring-emerald-400/70'
          : 'bg-white/[0.045] ring-white/[0.06] hover:bg-white/[0.08]'
      }`;
    return withMotion(
      <div className="min-h-screen px-4 pb-12 pt-10 sm:px-6 sm:pt-14">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            variants={riseInLarge}
            initial="hidden"
            animate="show"
            className="text-center mb-10"
          >
            <h1 className="flex items-center justify-center gap-3 text-[34px] font-bold leading-tight tracking-[-0.03em] text-white sm:text-[44px] mb-2">
              <Medallion tint="orange" size="lg"><span className="text-[22px] leading-none">👥</span></Medallion> Multiplayer Setup
            </h1>
            <p className="text-[17px] text-slate-400">Set up your game with friends and family</p>
          </motion.div>

          <div className="relative">
          <AnimatePresence mode="popLayout" initial={false}>
            {setupStep === 'count' ? (
              <motion.div
                key="count"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0, transition: springs.smooth }}
                exit={{ opacity: 0, x: -24, transition: springs.snappy }}
                className="surface rounded-[28px] p-6 sm:p-8"
              >
                <h2 className="text-[22px] font-bold tracking-[-0.02em] text-white mb-6 text-center">How many players?</h2>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {[2, 3, 4].map(count => (
                    <button
                      key={count}
                      onClick={() => setNumPlayers(count)}
                      className={`relative p-4 sm:p-6 ${optionTile(numPlayers === count)}`}
                    >
                      <div className="text-2xl sm:text-4xl mb-2 truncate">
                        {'👤'.repeat(count)}
                      </div>
                      <p className="text-white font-semibold text-[15px] sm:text-lg">{count} Players</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => setMode('select')}
                    className="btn-secondary flex-1 min-h-[50px] text-[17px]"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => initializePlayerConfigs(numPlayers)}
                    className="btn-primary flex-1 min-h-[50px] text-[17px]"
                  >
                    Continue →
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0, transition: springs.smooth }}
                exit={{ opacity: 0, x: 24, transition: springs.snappy }}
              >
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springs.snappy}
                    className="text-red-300 text-center text-[15px] mb-4 bg-red-500/[0.12] rounded-2xl py-2.5 px-4"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-5">
                  {playerConfigs.map((player, index) => (
                    <motion.div
                      key={player.id}
                      variants={riseIn}
                      className={`bg-gradient-to-br ${PLAYER_COLORS[index].bg} p-px rounded-[26px] shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)]`}
                    >
                      <div className="rounded-[25px] bg-[#161618] p-5 sm:p-6">
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
                            className={`pressable w-14 h-14 shrink-0 rounded-full bg-gradient-to-br ${PLAYER_COLORS[index].bg} ring-2 ring-white/10 flex items-center justify-center text-3xl overflow-hidden`}
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
                            className="min-w-0 flex-1 px-4 py-3 rounded-2xl border border-transparent bg-white/[0.07] text-white text-lg placeholder:text-slate-500 outline-none transition-[border-color,box-shadow] focus:border-[#30D158]/60 focus:ring-4 focus:ring-[#30D158]/15"
                            placeholder="Enter your name..."
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mb-5">
                          <button
                            onClick={() => setCustomAvatarPlayerIndex(index)}
                            className="pressable px-3.5 py-1.5 rounded-full bg-emerald-400/15 text-emerald-300 text-[13px] font-semibold hover:bg-emerald-400/25"
                          >
                            {player.avatarImage ? 'Edit Custom Avatar' : 'Create Custom Avatar'}
                          </button>
                          {player.avatarImage && (
                            <button
                              onClick={() => updatePlayerConfig(index, { avatarImage: undefined })}
                              className="pressable px-3.5 py-1.5 rounded-full bg-white/[0.08] text-slate-200 text-[13px] font-semibold hover:bg-white/[0.14]"
                            >
                              Use Emoji
                            </button>
                          )}
                        </div>

                        {/* Career Selection */}
                        <div className="mb-5">
                          <p className="eyebrow mb-2">Choose Your Career:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(Object.keys(CAREER_PATHS) as CareerPath[]).map(careerKey => {
                              const career = CAREER_PATHS[careerKey];
                              return (
                                <button
                                  key={careerKey}
                                  onClick={() => updatePlayerConfig(index, { careerPath: careerKey })}
                                  className={`p-3 ${optionTile(player.careerPath === careerKey)}`}
                                >
                                  <div className="text-2xl text-center mb-1">{career.icon}</div>
                                  <p className="text-white text-sm text-center font-semibold">{career.name}</p>
                                  <p className="num text-slate-400 text-xs text-center">AI-Proof: {career.futureProofScore}%</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Difficulty Selection */}
                        <div>
                          <p className="eyebrow mb-2">Difficulty Level:</p>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {Object.entries(DIFFICULTY_SETTINGS).map(([key, settings]) => (
                              <button
                                key={key}
                                onClick={() => updatePlayerConfig(index, { difficulty: key })}
                                className={`p-2.5 ${optionTile(player.difficulty === key)}`}
                              >
                                <p className="text-white text-sm font-semibold">{settings.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="flex gap-3 sm:gap-4 mt-8">
                  <button
                    onClick={() => setSetupStep('count')}
                    className="btn-secondary flex-1 min-h-[50px] text-[17px]"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={startMultiplayerGame}
                    className="btn-primary flex-1 min-h-[50px] text-[17px]"
                  >
                    🎮 Start Game!
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setMode('select')}
              className="pressable text-[15px] text-slate-400 hover:text-white transition-colors"
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

  if (mode === 'daily' && dailyState) {
    return (
      <App
        key={dailyState.challenge?.id}
        onBackToMenu={() => { setDailyState(null); setAccessTierState(getAccessTier()); setMode('select'); }}
        initialGameState={dailyState}
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
    { label: 'Financial systems', value: 45, suffix: '+' },
    { label: 'Life events', value: 80, suffix: '+' },
    { label: 'Skill paths', value: 4, suffix: '' }
  ];

  const modeCards = [
    {
      title: 'Adult Simulation',
      eyebrow: 'Full experience',
      body: 'Build income, manage debt, invest through cycles, and beat career disruption.',
      Icon: BriefcaseBusiness,
      onClick: () => { track('mode_selected', { mode: 'adult' }); setAdultResumeState(null); setMode('adult'); },
      cta: 'Start adult game',
      image: '/event-images/ai_opportunity.webp',
      tint: 'green' as Tint,
      locked: false,
      bullets: ['Command center', 'Investing engine', 'Career and lifestyle pressure']
    },
    {
      title: 'Daily Challenge',
      eyebrow: (() => {
        const todayId = getDailyChallengeId();
        if (!dailyStreak) return todayId;
        if (dailyStreak.lastPlayedId === todayId) return `${todayId} · 🔥 ${dailyStreak.streak}-day streak`;
        if (dailyStreak.lastPlayedId === getPreviousChallengeId(todayId)) return `${todayId} · 🔥 keep your ${dailyStreak.streak}-day streak!`;
        return todayId;
      })(),
      body: `Everyone plays the same seeded world today as ${getDailyCharacter(getDailySeed()).name}. 10-year sprint — score is your final net worth.`,
      Icon: CalendarDays,
      onClick: () => {
        track('mode_selected', { mode: 'daily' });
        setDailyStreak(recordDailyChallengePlayed());
        setDailyState(createDailyChallengeState());
        setMode('daily');
      },
      cta: dailyStreak && dailyStreak.lastPlayedId === getPreviousChallengeId(getDailyChallengeId())
        ? 'Keep the streak alive'
        : "Play today's run",
      image: '/event-images/business_expansion_opportunity.webp',
      tint: 'purple' as Tint,
      locked: false,
      bullets: ['Same world for everyone', '~15 minute sprint', 'Share your run card']
    },
    {
      title: 'Kids Mode',
      eyebrow: 'Ages 8-10',
      body: 'A simpler financial game focused on saving, goals, and money basics.',
      Icon: BookOpen,
      onClick: () => { track('mode_selected', { mode: 'kids' }); setKidsResumeState(null); setMode('kids'); },
      cta: 'Start kids game',
      image: '/event-images/child_school.webp',
      tint: 'blue' as Tint,
      locked: false,
      bullets: ['Simple choices', 'Goal saving', 'Family friendly pacing']
    },
    {
      title: 'Multiplayer',
      eyebrow: '2-4 players',
      body: 'Run the race with different careers, difficulties, and strategy styles.',
      Icon: Users,
      onClick: () => {
        track('mode_selected', { mode: 'multiplayer' });
        if (accessTier === 'demo') {
          track('unlock_modal_opened', { source: 'multiplayer' });
          setShowUnlockModal(true);
          return;
        }
        setMode('multiplayer-setup');
      },
      cta: accessTier === 'demo' ? 'Unlock to play' : 'Set up match',
      image: '/event-images/business_opportunity.webp',
      tint: 'orange' as Tint,
      locked: accessTier === 'demo',
      bullets: ['Shared table play', 'Different starts', 'First to freedom wins']
    }
  ];

  const openSaveManager = () => { refreshSaves(); refreshAccount(); setShowSaveManager(true); };

  // Small capsule buttons inside the save sheet.
  const capsule = 'pressable inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-slate-600';
  const sheetInput = 'min-w-0 flex-1 rounded-xl border border-transparent bg-white/[0.07] px-3.5 py-2 text-base text-white placeholder:text-slate-500 outline-none transition-[border-color,box-shadow] focus:border-[#0A84FF]/60 focus:ring-4 focus:ring-[#0A84FF]/15 sm:text-[15px]';

  // Mode Selection Screen
  return withMotion(
    <div className="relative min-h-screen overflow-x-clip px-4 text-white sm:px-6 lg:px-8">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] flex-col">
        {/* Hero */}
        <motion.section
          variants={stagger(0.05)}
          initial="hidden"
          animate="show"
          className="grid items-center gap-10 pb-4 pt-10 sm:pt-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14 lg:pb-6 lg:pt-14"
        >
          <div>
            <motion.p variants={riseIn} className="eyebrow text-emerald-300">
              <LineChart size={15} aria-hidden="true" />
              Financial freedom simulator
            </motion.p>
            <motion.h1
              variants={riseInLarge}
              className="mt-4 max-w-[12.5ch] font-bold text-white"
              style={{ fontSize: 'clamp(2.75rem, 0.9rem + 4.6vw, 4.75rem)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
            >
              <span
                className="block w-fit bg-clip-text pb-[0.04em] text-transparent"
                style={{ backgroundImage: 'linear-gradient(100deg, #5BE584 0%, #30D158 30%, #40C8E0 70%, #64D2FF 100%)' }}
              >
                Build the life,
              </span>{' '}
              not just the balance sheet.
            </motion.h1>
            <motion.p variants={riseIn} className="mt-6 max-w-[34rem] text-[17px] leading-[1.55] text-slate-400 sm:text-[19px] sm:leading-[1.5]">
              Tycoon turns investing, career risk, debt, education, and life events into one clear decision loop. Make the next month matter.
            </motion.p>

            <motion.div variants={riseIn} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button
                onClick={modeCards[0].onClick}
                className="btn-primary group min-h-[52px] px-7 text-[17px] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_14px_34px_-12px_rgba(48,209,88,0.7)]"
              >
                Start a new game
                <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              {/* No local saves yet — still offer cloud restore for returning players on a new device */}
              {!adultAutosave && !kidsAutosave && (
                <button
                  onClick={openSaveManager}
                  className="pressable group inline-flex items-center gap-1.5 rounded-full py-2 text-[15px] font-medium text-[#409CFF] hover:text-[#6CB4FF]"
                >
                  <CloudDownload size={17} aria-hidden="true" />
                  Played before? Restore from Cloud
                  <ChevronRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              )}
            </motion.div>
            <motion.p variants={riseIn} className="mt-3 text-[13px] text-slate-500">One decision to start. Learn the rest as you play.</motion.p>

            <motion.div variants={riseIn} className="mt-10 hidden max-w-[34rem] grid-cols-3 divide-x divide-white/[0.08] sm:grid">
              {launchStats.map((stat, i) => (
                <div key={stat.label} className={i === 0 ? 'pr-5' : 'px-5'}>
                  <p className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-white">
                    <CountUp to={stat.value} format={(n) => `${Math.round(n)}${stat.suffix}`} delayMs={260 + i * 70} />
                  </p>
                  <p className="mt-2 text-[13px] font-medium text-slate-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={shotIn} className="hidden lg:block">
            <HeroShot />
          </motion.div>
        </motion.section>

        {/* Demo banner */}
        {accessTier === 'demo' && (
          <motion.div
            variants={riseInAfter(0.18)}
            initial="hidden"
            animate="show"
            className="surface-card mt-8 flex flex-col gap-4 rounded-[24px] p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <Medallion tint="orange"><Sparkles size={19} strokeWidth={2.2} /></Medallion>
              <div>
                <p className="eyebrow text-amber-300">Demo mode</p>
                <p className="mt-1 max-w-2xl text-[15px] leading-[1.45] text-slate-300">You're playing the free demo — 3 in-game years of the adult simulation. Unlock the full game ({PURCHASE_PRICE} one-time) for unlimited play and multiplayer.</p>
              </div>
            </div>
            <button
              onClick={() => { track('unlock_modal_opened', { source: 'demo_banner' }); setShowUnlockModal(true); }}
              className="pressable num shrink-0 self-start rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-black shadow-[0_10px_24px_-12px_rgba(255,255,255,0.45)] hover:bg-white/90 sm:self-auto"
            >
              Unlock — {PURCHASE_PRICE}
            </button>
          </motion.div>
        )}

        {/* Continue Panel */}
        {(adultAutosave || kidsAutosave) && (
          <motion.section
            variants={stagger(0.06, 0.12)}
            initial="hidden"
            animate="show"
            className="mt-12 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14"
          >
            <motion.div variants={riseIn}>
              <p className="eyebrow text-emerald-300">Resume</p>
              <h3 className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.025em] text-white sm:text-[30px]">Continue where you left off</h3>
              <p className="mt-2 max-w-md text-[15px] leading-[1.45] text-slate-400">Autosave resumes your last session. Manage Saves lets you load manual slots.</p>
              <button
                onClick={openSaveManager}
                className="btn-secondary mt-5 px-4 py-2 text-[15px]"
              >
                Manage Saves
              </button>
            </motion.div>

            <div className={`grid gap-4 ${adultAutosave && kidsAutosave ? 'sm:grid-cols-2 lg:grid-cols-1' : ''}`}>
              {adultAutosave && (
                <motion.button
                  variants={riseIn}
                  onClick={() => {
                    const loaded = loadAdultGame('autosave');
                    if (!loaded) return;
                    setAdultResumeState(loaded);
                    setMode('adult');
                  }}
                  className="mode-tile glow-green group relative overflow-hidden rounded-[26px] border border-white/[0.1] p-5 text-left hover:border-[#30D158]/50 sm:p-6"
                  style={{
                    background:
                      'radial-gradient(120% 95% at 0% 0%, rgb(48 209 88 / 0.30), transparent 55%), radial-gradient(90% 80% at 100% 110%, rgb(64 200 224 / 0.20), transparent 60%), linear-gradient(160deg, #13281b 0%, #0d1510 55%, #0b0b0c 100%)'
                  }}
                >
                  {/* One-shot sheen as the pass arrives. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.09)_50%,transparent_70%)]"
                    style={{ animation: 'ff-sheen 1.5s var(--ease-out) 0.45s 1 both' }}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Medallion tint="green"><BriefcaseBusiness size={19} strokeWidth={2.2} /></Medallion>
                      <div>
                        <p className="text-[17px] font-semibold leading-tight text-white">Continue Adult</p>
                        <p className="num mt-0.5 text-[13px] text-emerald-200/75">Year {Math.ceil((adultAutosave.month || 1) / 12)} · Month {(((adultAutosave.month || 1) - 1) % 12) + 1}</p>
                      </div>
                    </div>
                    <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-white/[0.18]">
                      <ArrowRight size={17} strokeWidth={2.4} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <div className="relative mt-7 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[13px] text-slate-400">Cash</p>
                      <p className="mt-0.5 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[30px]">
                        <CountUp to={adultAutosave.cash || 0} format={formatSigned} delayMs={200} />
                      </p>
                    </div>
                    <div>
                      <p className="text-[13px] text-slate-400">Net Worth</p>
                      <p className="mt-0.5 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[30px]">
                        <CountUp to={adultAutosave.netWorth || 0} format={formatSigned} delayMs={260} />
                      </p>
                    </div>
                  </div>
                </motion.button>
              )}

              {kidsAutosave && (
                <motion.button
                  variants={riseIn}
                  onClick={() => {
                    const loaded = loadKidsGame('autosave');
                    if (!loaded) return;
                    setKidsResumeState(loaded);
                    setMode('kids');
                  }}
                  className="mode-tile glow-blue group relative overflow-hidden rounded-[26px] border border-white/[0.1] p-5 text-left hover:border-[#0A84FF]/50 sm:p-6"
                  style={{
                    background:
                      'radial-gradient(120% 95% at 0% 0%, rgb(64 200 224 / 0.28), transparent 55%), radial-gradient(90% 80% at 100% 110%, rgb(10 132 255 / 0.22), transparent 60%), linear-gradient(160deg, #0f2230 0%, #0c1318 55%, #0b0b0c 100%)'
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.09)_50%,transparent_70%)]"
                    style={{ animation: 'ff-sheen 1.5s var(--ease-out) 0.55s 1 both' }}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Medallion tint="blue"><BookOpen size={19} strokeWidth={2.2} /></Medallion>
                      <div>
                        <p className="text-[17px] font-semibold leading-tight text-white">Continue Kids</p>
                        <p className="num mt-0.5 text-[13px] text-sky-200/75">Week {kidsAutosave.week || 1}</p>
                      </div>
                    </div>
                    <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-white/[0.18]">
                      <ArrowRight size={17} strokeWidth={2.4} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <div className="relative mt-7 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[13px] text-slate-400">Cash</p>
                      <p className="mt-0.5 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[30px]">
                        <CountUp to={kidsAutosave.cashOnHand || 0} format={formatWholeDollars} delayMs={260} />
                      </p>
                    </div>
                    {kidsAutosave.savingsGoalName && (
                      <div className="min-w-0">
                        <p className="text-[13px] text-slate-400">Goal</p>
                        <p className="mt-1.5 truncate text-[17px] font-semibold text-white">{kidsAutosave.savingsGoalName}</p>
                      </div>
                    )}
                  </div>
                </motion.button>
              )}
            </div>
          </motion.section>
        )}

        {/* Modes */}
        <motion.section
          variants={stagger(0.06, 0.16)}
          initial="hidden"
          animate="show"
          className="mt-12"
        >
          <motion.div variants={riseIn} className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Choose a mode</p>
              <h2 className="mt-1 max-w-[22ch] text-[28px] font-bold leading-[1.1] tracking-[-0.028em] text-white sm:max-w-none sm:text-[34px]">Start with the version that fits the table.</h2>
            </div>
            <div className="hidden items-center gap-2 text-[13px] font-medium text-slate-500 sm:flex">
              <Trophy size={15} className="text-amber-300" aria-hidden="true" />
              Progress saves automatically
            </div>
          </motion.div>

          {/* A snap rail on phones (Arcade-style), a grid from tablet up. */}
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-6 pt-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 xl:grid-cols-4">
            {modeCards.map((card) => {
              const Icon = card.Icon;
              const tint = TINTS[card.tint];
              return (
                <motion.button
                  key={card.title}
                  variants={riseIn}
                  onClick={card.onClick}
                  className={`surface-card mode-tile ${tint.glow} ${tint.hoverBorder} group flex w-[84%] max-w-[340px] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] text-left sm:w-auto sm:max-w-none`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/[0.03]">
                    <FadeImg
                      src={card.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-[opacity,scale] duration-500 ease-out group-hover:scale-[1.045]"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#18181a] via-[#18181a]/5 to-transparent" />
                  </div>
                  <div className="relative flex flex-1 flex-col px-5 pb-5">
                    <Medallion tint={card.tint} size="lg" className="-mt-7 mb-3 ring-[3px] ring-[#18181a]">
                      <Icon size={22} strokeWidth={2.2} />
                    </Medallion>
                    <p className="eyebrow">{card.eyebrow}</p>
                    <h3 className="mt-0.5 text-[21px] font-semibold leading-tight tracking-[-0.022em] text-white">{card.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.5] text-slate-400">{card.body}</p>
                    <div className="mt-4 space-y-1.5">
                      {card.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-center gap-2 text-[13px] font-medium text-slate-300">
                          <Check size={14} strokeWidth={3} aria-hidden="true" className={`shrink-0 ${tint.check}`} />
                          {bullet}
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-6">
                      <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-4 py-2 text-[15px] font-semibold transition-colors duration-200 group-hover:bg-white/[0.14] ${tint.text}`}>
                        {card.locked && <Lock size={14} strokeWidth={2.5} aria-hidden="true" />}
                        {card.cta}
                        <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Footer: at least 4rem below the cards, and pinned to the bottom of short pages. */}
        <div aria-hidden="true" className="min-h-16 flex-1" />
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col items-center gap-3 border-t border-white/[0.06] pb-10 pt-6 sm:flex-row sm:justify-between"
        >
          <p className="text-[13px] text-slate-500">
            Created by <span className="font-medium text-slate-400">Pieter van der Walt</span>
          </p>
          <div className="flex items-center justify-center gap-5">
            <a
              href="/educators.html"
              className="text-[13px] text-slate-400 transition-colors hover:text-emerald-300"
            >
              For educators
            </a>
            <button
              onClick={handleLogout}
              className="text-[13px] text-slate-500 transition-colors hover:text-slate-300"
            >
              Logout
            </button>
          </div>
        </motion.footer>
      </div>

      <UnlockModal
        open={showUnlockModal}
        title="Unlock the Full Game"
        description="Unlimited years, multiplayer, and every future update — one payment."
        perks={['Unlimited in-game years', 'Multiplayer for 2-4 players', 'All future updates']}
        onUnlocked={handleUnlocked}
        onClose={() => setShowUnlockModal(false)}
      />

      {/* Save Manager Modal */}
      <AnimatePresence>
        {showSaveManager && (
          <motion.div
            key="save-manager"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-black/70"
          >
            <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
              <motion.div
                variants={materialize}
                initial="hidden"
                animate="show"
                exit="exit"
                className="mat-sheet w-full max-w-2xl overflow-hidden rounded-[28px] bg-[rgb(28_28_30/0.96)]"
              >
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-3 text-[20px] font-semibold tracking-[-0.02em] text-white">
                      <Medallion tint="blue" size="sm"><span className="text-[15px] leading-none">💾</span></Medallion> Manage Saves
                    </h2>
                    <p className="mt-1 text-[13px] text-slate-400">Load or delete Autosave and manual slots.</p>
                  </div>
                  <button
                    onClick={() => setShowSaveManager(false)}
                    className="btn-secondary shrink-0 px-4 py-1.5 text-[15px]"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-7 px-4 py-5 sm:px-6 sm:py-6">
                  {(['adult','kids'] as const).map(m => (
                    <div key={m}>
                      <h3 className="mb-2 px-4 text-[13px] font-semibold text-slate-400">{m === 'adult' ? 'Adult Mode' : 'Kids Mode'}</h3>
                      <div className="list-group">
                        {SAVE_SLOTS.map(slotId => {
                          const summary = saveSummaries.find(s => s.mode === m && s.slotId === slotId);
                          const isEmpty = !summary;
                          const title = slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot','')}`;

                          return (
                            <div key={slotId} className="list-row">
                              <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-semibold text-white">{title}</p>
                                {isEmpty ? (
                                  <p className="text-[13px] text-slate-500">Empty</p>
                                ) : (
                                  <p className="num truncate text-[13px] text-slate-400">Last saved: {new Date(summary.updatedAt).toLocaleString()}</p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
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
                                  className={`${capsule} bg-emerald-400/[0.16] text-emerald-300 hover:bg-emerald-400/25`}
                                >
                                  Load
                                </button>
                                <button
                                  disabled={isEmpty}
                                  onClick={() => {
                                    deleteSaveSlot(m, slotId);
                                    refreshSaves();
                                  }}
                                  className={`${capsule} bg-red-500/[0.14] text-red-400 hover:bg-red-500/25`}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Cloud Sync */}
                  <div>
                    <div className="list-group">
                      <div className="list-row">
                        <div className="min-w-0 flex-1">
                          <h3 className="flex items-center gap-3 text-[15px] font-semibold text-white">
                            <Medallion tint="purple" size="sm"><span className="text-[15px] leading-none">☁️</span></Medallion> Cloud Sync
                          </h3>
                          <p className="mt-1 text-[13px] leading-[1.35] text-slate-400">Back up your adult game and continue on any device with your sync code.</p>
                        </div>
                        <button
                          onClick={() => {
                            const next = !cloudSyncOn;
                            setCloudSyncEnabled(next);
                            setCloudSyncOn(next);
                            setCloudStatus(next ? 'Cloud backup on — autosaves upload automatically.' : 'Cloud backup off.');
                            if (next) ensureSignedIn().then(() => refreshAccount());
                          }}
                          className="pressable flex shrink-0 items-center gap-2 rounded-full py-1 pl-2 text-[13px] font-semibold text-slate-300"
                        >
                          {cloudSyncOn ? 'ON' : 'OFF'}
                          <span
                            aria-hidden="true"
                            className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full p-[2px] transition-colors duration-300 ${cloudSyncOn ? 'bg-[#30D158] justify-end' : 'bg-white/[0.16] justify-start'}`}
                          >
                            <motion.span layout transition={springs.glide} className="h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.16)]" />
                          </span>
                        </button>
                      </div>

                      <div className="list-row flex-wrap">
                        <code className="rounded-lg bg-black/30 px-3 py-2 font-mono text-[12px] text-violet-200">
                          {getSyncCode() || 'unavailable'}
                        </code>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(getSyncCode());
                                setCodeCopied(true);
                                setTimeout(() => setCodeCopied(false), 2000);
                              } catch { /* clipboard unavailable */ }
                            }}
                            className={`${capsule} bg-white/[0.08] text-white hover:bg-white/[0.14]`}
                          >
                            {codeCopied ? 'Copied!' : 'Copy code'}
                          </button>
                          <button
                            onClick={handleCloudBackup}
                            disabled={cloudBusy}
                            className={`${capsule} bg-violet-500/[0.2] text-violet-200 hover:bg-violet-500/30`}
                          >
                            Back up now
                          </button>
                        </div>
                      </div>

                      <div className="list-row flex-wrap">
                        <input
                          type="text"
                          value={restoreCode}
                          onChange={(e) => setRestoreCode(e.target.value)}
                          placeholder="Paste a sync code from another device…"
                          className={`${sheetInput} min-w-[200px]`}
                        />
                        <button
                          onClick={handleCloudRestore}
                          disabled={cloudBusy || !restoreCode.trim()}
                          className={`${capsule} bg-white/[0.08] text-white hover:bg-white/[0.14]`}
                        >
                          Restore
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 px-4">
                      {cloudStatus && <p className="text-[13px] text-slate-300">{cloudStatus}</p>}
                      <p className="text-[12px] text-slate-500">Keep your code private — anyone who has it can load (and overwrite) this backup.</p>
                    </div>

                    {/* Account */}
                    <div className="list-group mt-5">
                      <div className="list-row flex-wrap justify-between">
                        <p className="text-[15px] text-slate-300">
                          {account?.email
                            ? <>Account: <span className="font-semibold text-emerald-300">{account.email}</span></>
                            : account
                              ? 'Account: guest (this device only)'
                              : 'Account: none yet'}
                        </p>
                        {account?.email && (
                          <button
                            onClick={async () => { await signOut(); setAccount(null); setAccountSaveStamp(null); setAccountStatus('Signed out.'); }}
                            className="pressable text-[13px] font-medium text-[#409CFF] hover:text-[#6CB4FF]"
                          >
                            Sign out
                          </button>
                        )}
                      </div>

                      {account?.email ? (
                        <div className="list-row flex-wrap">
                          <button
                            onClick={handleAccountRestore}
                            disabled={cloudBusy}
                            className={`${capsule} bg-emerald-400/[0.16] text-emerald-300 hover:bg-emerald-400/25`}
                          >
                            Restore from my account
                          </button>
                          {accountSaveStamp && (
                            <span className="num text-[12px] text-slate-400">Last backup: {new Date(accountSaveStamp).toLocaleString()}</span>
                          )}
                        </div>
                      ) : (
                        <div className="list-row flex-col items-stretch">
                          <p className="text-[13px] leading-[1.35] text-slate-400">Link an email to carry your save to any device with a magic link — no password.</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="email"
                              value={accountEmail}
                              onChange={(e) => setAccountEmail(e.target.value)}
                              placeholder="you@example.com"
                              className={`${sheetInput} min-w-[200px]`}
                            />
                            <button
                              onClick={handleLinkEmail}
                              disabled={cloudBusy || !accountEmail.trim()}
                              className={`${capsule} bg-emerald-400/[0.16] text-emerald-300 hover:bg-emerald-400/25`}
                            >
                              Link email
                            </button>
                            <button
                              onClick={handleEmailSignIn}
                              disabled={cloudBusy || !accountEmail.trim()}
                              className={`${capsule} bg-white/[0.08] text-white hover:bg-white/[0.14]`}
                              title="Already linked an email on another device? Get a sign-in link."
                            >
                              Sign in instead
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {accountStatus && <p className="mt-2 px-4 text-[13px] text-slate-300">{accountStatus}</p>}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => refreshSaves()}
                      className="pressable rounded-full px-3 py-1.5 text-[15px] font-medium text-[#409CFF] hover:bg-white/[0.06]"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeSelector;
