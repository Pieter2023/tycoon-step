import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  RefreshCw,
  ShieldAlert,
  Users,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import type { GameState } from '../types';

// --- Course tuning ---
const PASS_BONUS = 50_000;
const FAIL_3X_PENALTY = 25_000;

// Permanent perks (real gameplay impact)
const DEAL_DISCOUNT_PCT = 0.05; // 5% cheaper REAL_ESTATE + BUSINESS purchases
const SALE_BONUS_PCT = 0.03; // 3% better REAL_ESTATE + BUSINESS sale proceeds

type Phase = 'intro' | 'quiz' | 'results';

type QuizQuestion = {
  id: string;
  image: string;
  skill: string;
  scenario: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type BaseQuestion = Omit<QuizQuestion, 'options' | 'correctIndex'> & {
  options: string[];
  correctIndex: number;
};

const MODULES: Array<{ title: string; bullets: string[]; microDrill: string }> = [
  {
    title: '1) Prep like a pro (BATNA + walk-away)',
    bullets: [
      'Define your BATNA (best alternative) before you speak to anyone.',
      'Set a walk-away number and write it down (no “vibes-based” decisions).',
      'Collect objective anchors: comps, quotes, invoices, market rates.',
    ],
    microDrill: 'Write your BATNA + walk-away in one sentence. If you can’t, you’re not ready.',
  },
  {
    title: '2) Anchor & frame (start strong, stay calm)',
    bullets: [
      'Anchor early with a justified number (never apologize for an anchor).',
      'Frame in packages: price + timeline + terms.',
      'Use neutral language: “Based on comparable deals…”',
    ],
    microDrill: 'Practice a 10-second anchor: number + 1 justification + pause.',
  },
  {
    title: '3) Concessions are trades (never give for free)',
    bullets: [
      'Concede slowly and label your concessions (“If I do X, can you do Y?”).',
      'Trade low-cost items for high-value items (timing, deposit, add-ons).',
      'Keep a “give list” and a “get list”.',
    ],
    microDrill: 'Rewrite 3 “discount” requests as trades (price ↔ terms).',
  },
  {
    title: '4) Emotional control & rapport',
    bullets: [
      'Listen first: summarize their position before you counter.',
      'Separate people from the problem (respect the person, challenge the terms).',
      'Use questions to move the deal: “Help me understand…”',
    ],
    microDrill: 'Use this script once today: “It sounds like… Did I get that right?”',
  },
  {
    title: '5) Close & protect the win',
    bullets: [
      'Confirm the full agreement (price, timeline, scope, responsibilities).',
      'Get it in writing fast — recap email / contract draft.',
      'Create next steps and deadlines so momentum doesn’t die.',
    ],
    microDrill: 'Write a 4-line recap: “We agreed on… Next step… Owner… Deadline…”',
  },
];

// Note: We reuse existing high-quality 16:9 “Pixar-style” game art from /eq-images
// so this tab immediately matches the game aesthetic.
const QUESTION_BANK: BaseQuestion[] = [
  {
    id: 'mn_q1',
    image: '/event-images/supplier_price_increase.webp',
    skill: 'Prep & objective criteria',
    scenario:
      'A supplier just announced a sudden 12% price increase. You still want to keep the relationship, but your margins can’t absorb it.',
    question: 'What is your best opening move?',
    options: [
      'Threaten to cancel on the spot so they panic and fold.',
      'Ask for their rationale, pull benchmarks, and counter with objective data.',
      'Accept the increase and promise yourself you will fix it later.',
      'Complain about fairness and demand they “be reasonable.”',
    ],
    correctIndex: 1,
    explanation:
      'Start by understanding their drivers, then anchor with objective criteria (comparable quotes, volume history, payment terms). This protects the relationship and strengthens your leverage.',
  },
  {
    id: 'mn_q2',
    image: '/event-images/salary_negotiation.webp',
    skill: 'Anchoring',
    scenario:
      'You’re buying a property. The seller is nervous and keeps asking what you “can do today.” You have done your comps and know the fair range.',
    question: 'How should you present your first number?',
    options: [
      'Open with a justified anchor, then pause and let the silence work.',
      'Ask for their best price and keep repeating “What’s your lowest?”',
      'Offer your max immediately to “win the deal quickly.”',
      'Avoid numbers and talk about how the home makes you feel.',
    ],
    correctIndex: 0,
    explanation:
      'A calm, justified anchor sets the frame. Silence is a tool — don’t negotiate against yourself.',
  },
  {
    id: 'mn_q3',
    image: '/event-images/contract_dispute.webp',
    skill: 'Concession trading',
    scenario:
      'The other party demands a discount and says, “If you want this deal, you must drop your price.”',
    question: 'What’s the most effective response?',
    options: [
      '“No. Final.”',
      '“Okay, I’ll drop it… just sign.”',
      '“If I reduce price, what can you improve on your side (timeline, volume, payment terms)?”',
      'Ignore it and continue talking about features.',
    ],
    correctIndex: 2,
    explanation:
      'Concessions should be traded, not given. You protect value and move toward agreement by swapping variables.',
  },
  {
    id: 'mn_q4',
    image: '/event-images/medical_bill_negotiation.webp',
    skill: 'De-escalation & control',
    scenario:
      'A client is angry and sends a harsh email threatening to leave. You’re in the right, but the relationship matters.',
    question: 'What is the best first reply?',
    options: [
      'Respond immediately with a detailed defense and attach screenshots proving you’re right.',
      'Acknowledge their frustration, summarize the issue, and propose a short call.',
      'Ignore it for a day so they cool down.',
      'Tell them they are being unreasonable and you won’t tolerate it.',
    ],
    correctIndex: 1,
    explanation:
      'Rapport first. Emotional control prevents escalation and creates space to negotiate the solution.',
  },
  {
    id: 'mn_q5',
    image: '/event-images/property_dispute.webp',
    skill: 'BATNA & walk-away',
    scenario:
      'A deal is close, but the numbers no longer work. You feel pressure because you already invested time and energy.',
    question: 'What should guide your decision?',
    options: [
      'Your sunk cost — you’ve already spent time, so you must finish.',
      'Your walk-away number and BATNA (your best alternative).',
      'The other person’s emotions — keep them happy at all costs.',
      'A coin flip so you don’t have to decide.',
    ],
    correctIndex: 1,
    explanation:
      'Sunk costs are irrelevant. Walk-away and BATNA protect you from bad deals and regret.',
  },
  {
    id: 'mn_q6',
    image: '/event-images/job_offer_relocation.webp',
    skill: 'Relationship leverage',
    scenario:
      'You want better terms, but you’re negotiating with someone who doesn’t fully trust you yet.',
    question: 'Which action strengthens your position the most?',
    options: [
      'Build rapport by asking smart questions, showing reliability, and creating small wins.',
      'Talk about yourself nonstop so they see you’re impressive.',
      'Push hard immediately so they know you’re “not to be messed with.”',
      'Avoid all conversation and only send numbers.',
    ],
    correctIndex: 0,
    explanation:
      'Trust creates flexibility. Strong relationships expand the deal pie and reduce friction on terms.',
  },
  {
    id: 'mn_q7',
    image: '/event-images/business_partner_dispute.webp',
    skill: 'Framing your offer',
    scenario:
      'You’re about to present your offer to a group. You know your number is fair, but you worry they’ll react emotionally.',
    question: 'What’s the best framing tactic?',
    options: [
      'Start with your number + objective justification + benefits, then stop talking.',
      'Start by saying “I know this is low, sorry…” so they don’t get mad.',
      'Avoid the number until the end so they can’t judge you.',
      'Use vague language and hope they guess what you want.',
    ],
    correctIndex: 0,
    explanation:
      'Lead with confident structure: number, justification, value. Apologies weaken your anchor.',
  },
  {
    id: 'mn_q8',
    image: '/event-images/rent_increase.webp',
    skill: 'Avoiding urgency traps',
    scenario:
      'They say: “This offer expires today — decide now or lose it.” You feel the pressure.',
    question: 'What is the smartest move?',
    options: [
      'Say yes immediately so you don’t miss out.',
      'Slow down, check your BATNA, and ask what changes if you decide tomorrow.',
      'Insult them for using pressure tactics.',
      'Ghost them and hope they come back with a better deal.',
    ],
    correctIndex: 1,
    explanation:
      'Urgency is often a tactic. You keep control by slowing down, validating alternatives, and negotiating the timeline/terms.',
  },
  {
    id: 'mn_q9',
    image: '/event-images/landlord_dispute.webp',
    skill: 'Internal negotiation',
    scenario:
      'Your team is overloaded. A stakeholder wants “just one more feature” with no extra time or budget.',
    question: 'What is the best negotiation approach?',
    options: [
      'Agree, then push the team harder.',
      'Refuse without explanation.',
      'Offer choices: keep scope but extend timeline, or keep timeline but reduce scope.',
      'Complain about the stakeholder to your team.',
    ],
    correctIndex: 2,
    explanation:
      'Trade-offs are the currency of negotiation. Presenting options keeps collaboration while protecting constraints.',
  },
  {
    id: 'mn_q10',
    image: '/event-images/key_client_leaves.webp',
    skill: 'Confidence under comparison',
    scenario:
      'You learn your competitor “supposedly” offered a better price. The other side uses it to pressure you.',
    question: 'What’s the best response?',
    options: [
      'Immediately match or beat the price with no questions.',
      'Ask for specifics (scope/terms) and re-anchor to value + objective comparisons.',
      'Call the competitor dishonest.',
      'End the negotiation and walk away forever.',
    ],
    correctIndex: 1,
    explanation:
      'Clarify the real comparison. Competitor claims are often vague. Re-anchor to terms, value, and objective criteria.',
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildAttemptQuestions(): QuizQuestion[] {
  const shuffledOrder = shuffleArray(QUESTION_BANK);
  return shuffledOrder.map((q) => {
    const indexed = q.options.map((text, idx) => ({ text, idx }));
    const shuffled = shuffleArray(indexed);
    const newCorrectIndex = shuffled.findIndex((o) => o.idx === q.correctIndex);
    return {
      ...q,
      options: shuffled.map((o) => o.text),
      correctIndex: newCorrectIndex,
    };
  });
}

const DEFAULT_COURSE_STATE = {
  certified: false,
  rewardClaimed: false,
  failedAttempts: 0,
  bestScore: 0,
} as const;

interface Props {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  // Optional integration hooks (App already has these in the EQ tab)
  saveGame?: (state: GameState) => void;
  showNotif?: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  setFloatingNumbers?: React.Dispatch<React.SetStateAction<Array<{ id: string; value: number }>>>;
  formatMoneyFull?: (amount: number) => string;
  playMoneyGain?: () => void;
  playMoneyLoss?: () => void;
}

export default function MasterNegotiationsTab({
  gameState,
  setGameState,
  saveGame,
  showNotif,
  setFloatingNumbers,
  formatMoneyFull,
  playMoneyGain,
  playMoneyLoss,
}: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [attemptQuestions, setAttemptQuestions] = useState<QuizQuestion[]>(() => buildAttemptQuestions());
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<'pass' | 'fail' | null>(null);
  const [penaltyApplied, setPenaltyApplied] = useState(false);

  const negCourse = gameState.negotiationsCourse ?? DEFAULT_COURSE_STATE;
  const certified = !!negCourse.certified;

  const total = attemptQuestions.length;
  const current = attemptQuestions[idx];

  const percent = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  }, [score, total]);

  function resetRun() {
    setAttemptQuestions(buildAttemptQuestions());
    setIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setLastOutcome(null);
    setPenaltyApplied(false);
    setPhase('quiz');
  }

  function onSelect(i: number) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);

    const correct = i === current.correctIndex;
    if (correct) {
      setScore((s) => s + 1);
    }
  }

  function applyPassRewardsIfEligible() {
    // Only award once per save.
    const alreadyClaimed = !!(gameState.negotiationsCourse?.rewardClaimed);
    const alreadyCertified = !!(gameState.negotiationsCourse?.certified);

    // Passing always marks certified; cash bonus only once.
    setGameState((prev) => {
      const next: GameState = {
        ...prev,
        negotiationsCourse: {
          certified: true,
          rewardClaimed: prev.negotiationsCourse?.rewardClaimed ?? false,
          failedAttempts: 0,
          bestScore: Math.max(prev.negotiationsCourse?.bestScore ?? 0, total),
        },
        negotiationsPerks: {
          dealDiscountPct: DEAL_DISCOUNT_PCT,
          saleBonusPct: SALE_BONUS_PCT,
        },
        stats: {
          ...prev.stats,
          networking: Math.min(100, (prev.stats?.networking ?? 50) + 10),
          happiness: Math.min(100, (prev.stats?.happiness ?? 50) + 4),
          stress: Math.max(0, (prev.stats?.stress ?? 50) - 6),
          energy: Math.min(100, (prev.stats?.energy ?? 50) + 2),
          fulfillment: Math.min(100, (prev.stats?.fulfillment ?? 50) + 4),
        },
      };

      if (!alreadyClaimed) {
        next.cash = Math.max(0, (prev.cash ?? 0) + PASS_BONUS);
        next.negotiationsCourse = {
          ...next.negotiationsCourse!,
          rewardClaimed: true,
        };

        if (playMoneyGain) playMoneyGain();
        if (setFloatingNumbers) {
          setFloatingNumbers((arr) => [
            ...arr,
            { id: `mn_bonus_${Date.now()}`, value: PASS_BONUS },
          ]);
        }
        if (showNotif) {
          showNotif(
            'Master Negotiations — Certified ✅',
            `Bonus awarded: +${formatMoneyFull ? formatMoneyFull(PASS_BONUS) : '$50,000'} (one-time). Permanent deal perks unlocked.`,
            'success'
          );
        }
      } else if (!alreadyCertified && showNotif) {
        showNotif(
          'Master Negotiations — Certified ✅',
          'Certification saved. Bonus was already claimed in this save slot.',
          'info'
        );
      }

      // Persist the updated state right away (optional hook)
      if (saveGame) saveGame(next);

      return next;
    });
  }

  function applyFailProgressAndMaybePenalty(finalScore: number) {
    // Certified players can practice: no penalties.
    if (certified) {
      setGameState((prev) => {
        const next: GameState = {
          ...prev,
          negotiationsCourse: {
            ...(prev.negotiationsCourse ?? DEFAULT_COURSE_STATE),
            bestScore: Math.max(prev.negotiationsCourse?.bestScore ?? 0, finalScore),
          },
        };
        if (saveGame) saveGame(next);
        return next;
      });
      return;
    }

    setGameState((prev) => {
      const prevCourse = prev.negotiationsCourse ?? DEFAULT_COURSE_STATE;
      const nextFailed = (prevCourse.failedAttempts ?? 0) + 1;
      const triggersPenalty = nextFailed >= 3;

      const next: GameState = {
        ...prev,
        negotiationsCourse: {
          certified: false,
          rewardClaimed: prevCourse.rewardClaimed ?? false,
          failedAttempts: triggersPenalty ? 0 : nextFailed,
          bestScore: Math.max(prevCourse.bestScore ?? 0, finalScore),
        },
      };

      if (triggersPenalty) {
        next.cash = Math.max(0, (prev.cash ?? 0) - FAIL_3X_PENALTY);
        setPenaltyApplied(true);
        if (playMoneyLoss) playMoneyLoss();
        if (setFloatingNumbers) {
          setFloatingNumbers((arr) => [
            ...arr,
            { id: `mn_penalty_${Date.now()}`, value: -FAIL_3X_PENALTY },
          ]);
        }
        if (showNotif) {
          showNotif(
            'Master Negotiations — Penalty applied',
            `You failed 3 times. Penalty: -${formatMoneyFull ? formatMoneyFull(FAIL_3X_PENALTY) : '$25,000'}.`,
            'warning'
          );
        }
      } else {
        if (showNotif) {
          showNotif(
            'Master Negotiations — Not certified yet',
            `Attempt ${nextFailed}/3. You need 100% to pass.`,
            'info'
          );
        }
      }

      if (saveGame) saveGame(next);
      return next;
    });
  }

  function onNext() {
    if (!answered) return;

    const isLast = idx >= total - 1;
    if (!isLast) {
      setIdx((n) => n + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }

    // Finish
    const finalScore = score;
    const isPerfect = finalScore === total;
    setLastOutcome(isPerfect ? 'pass' : 'fail');
    setPhase('results');

    if (isPerfect) {
      applyPassRewardsIfEligible();
    } else {
      applyFailProgressAndMaybePenalty(finalScore);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-white">Master Negotiations</h2>
            <p className="text-sm text-slate-300 mt-1">
              Learn a repeatable deal framework, then pass the certification quiz.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-2 rounded-xl border ${certified ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-100' : 'bg-slate-800/60 border-slate-700 text-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Award size={16} />
                <span className="text-sm font-semibold">{certified ? 'Certified' : 'Not certified'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <DollarSign size={18} />
              <p className="text-sm font-semibold">Pass reward</p>
            </div>
            <p className="text-sm text-slate-300 mt-2">Get 100% and earn <span className="text-emerald-200 font-semibold">+$50,000</span> (once per save).</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <TrendingUp size={18} />
              <p className="text-sm font-semibold">Permanent perks</p>
            </div>
            <p className="text-sm text-slate-300 mt-2">
              After certification: <span className="text-emerald-200 font-semibold">5% cheaper</span> REAL_ESTATE/BUSINESS buys and <span className="text-emerald-200 font-semibold">3% higher</span> sale proceeds.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <ShieldAlert size={18} />
              <p className="text-sm font-semibold">Fail rule</p>
            </div>
            <p className="text-sm text-slate-300 mt-2">If you fail <span className="text-rose-200 font-semibold">3 times</span>, you lose <span className="text-rose-200 font-semibold">$25,000</span>.</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5"
          >
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="aspect-video bg-slate-950/30">
                  <img
                    src="/event-images/salary_negotiation.webp"
                    alt="Negotiation hero"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    Negotiation is a money skill. Mastering anchors, trades, and calm communication improves your deals across the entire game.
                  </p>

                  <div className="mt-4 bg-slate-950/30 border border-slate-700 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-slate-200" />
                      <p className="text-sm font-semibold text-white">Quick checklist</p>
                    </div>
                    <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
                      <li>Pass requires 100% correct</li>
                      <li>Questions + answer letters shuffle each run</li>
                      <li>After you’re certified: practice mode has no penalties</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-slate-200" />
                  <p className="text-sm font-semibold text-white">What you’ll learn</p>
                </div>

                <div className="space-y-2">
                  {MODULES.map((m) => (
                    <div key={m.title} className="bg-slate-900/40 border border-slate-700 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-white">{m.title}</p>
                      <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
                        {m.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-slate-400 mt-3"><span className="text-slate-300 font-semibold">Micro-drill:</span> {m.microDrill}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-400">
                  Tip: If you’re already certified, you can still practice — no penalties, no extra rewards.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => resetRun()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Start Negotiation Certification
              </button>
              {certified && (
                <button
                  onClick={() => resetRun()}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold"
                >
                  Practice Mode
                </button>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">Question {idx + 1} of {total}</p>
                <p className="text-sm font-semibold text-white">Score: {score}/{total}</p>
              </div>
              <div className="w-48 bg-slate-900/50 border border-slate-700 rounded-full overflow-hidden h-2">
                <div
                  className="h-2 bg-gradient-to-r from-emerald-600 to-emerald-400"
                  style={{ width: `${((idx + 1) / total) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid lg:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="aspect-video bg-slate-950/30">
                  <img
                    src={current.image}
                    alt="Negotiation question"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-200 leading-relaxed">{current.scenario}</p>
                  <p className="text-base font-semibold text-white mt-3">{current.question}</p>
                </div>
              </div>

              <div className="space-y-3">
                {current.options.map((opt, i) => {
                  const isCorrect = answered && i === current.correctIndex;
                  const isWrong = answered && selected === i && i !== current.correctIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => onSelect(i)}
                      disabled={answered}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-100'
                          : isWrong
                            ? 'bg-rose-600/15 border-rose-500/40 text-rose-100'
                            : 'bg-slate-900/40 border-slate-700 text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isCorrect ? 'bg-emerald-500/20 text-emerald-200' : isWrong ? 'bg-rose-500/20 text-rose-200' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{opt}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <AnimatePresence>
                  {answered && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className={`rounded-2xl border p-4 ${selected === current.correctIndex ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-rose-600/10 border-rose-500/30'}`}
                    >
                      <p className="text-sm font-semibold text-white">
                        {selected === current.correctIndex ? 'Nice.' : 'Not quite.'} <span className="text-slate-300">{current.skill}</span>
                      </p>
                      <p className="text-sm text-slate-200 mt-2 leading-relaxed">{current.explanation}</p>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={onNext}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        >
                          {idx === total - 1 ? 'Finish' : 'Next'}
                        </button>
                        <button
                          onClick={() => { setPhase('intro'); }}
                          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold"
                        >
                          Quit
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-slate-400">Result</p>
                <p className="text-2xl font-bold text-white mt-1">{percent}%</p>
                <p className="text-sm text-slate-300 mt-1">Score: {score}/{total}</p>
              </div>
              <div className={`px-4 py-2 rounded-2xl border ${lastOutcome === 'pass' ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-100' : 'bg-rose-600/15 border-rose-500/30 text-rose-100'}`}>
                <p className="text-sm font-semibold">
                  {lastOutcome === 'pass' ? 'Certified ✅' : 'Not certified ❌'}
                </p>
                <p className="text-xs opacity-90">{lastOutcome === 'pass' ? 'Rewards applied (if eligible)' : 'You must restart to retry'}</p>
              </div>
            </div>

            {lastOutcome === 'pass' ? (
              <div className="mt-4 bg-slate-900/40 border border-emerald-700/30 rounded-2xl p-4">
                <p className="text-sm font-semibold text-white">Rewards & perks</p>
                <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
                  <li>+${PASS_BONUS.toLocaleString()} cash (once per save)</li>
                  <li>Permanent: 5% cheaper REAL_ESTATE & BUSINESS buys</li>
                  <li>Permanent: 3% higher REAL_ESTATE & BUSINESS sale proceeds</li>
                  <li>Networking +10, Happiness +4, Stress −6, Energy +2, Fulfillment +4</li>
                </ul>
              </div>
            ) : (
              <div className="mt-4 bg-slate-900/40 border border-amber-700/40 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="text-amber-200 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">Certification requires 100%</p>
                    <p className="text-sm text-slate-300 mt-1">Retakes must start from Question 1.</p>
                    {!certified && (
                      <p className="text-xs text-slate-400 mt-2">Failed attempts: {negCourse.failedAttempts + 1} / 3</p>
                    )}
                    {penaltyApplied && !certified && (
                      <p className="text-sm text-rose-200 mt-2 font-semibold">Penalty applied: −$25,000.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => { setPhase('intro'); }}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold"
              >
                Back
              </button>

              {lastOutcome === 'fail' && (
                <button
                  onClick={() => resetRun()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Start over
                </button>
              )}
              {lastOutcome === 'pass' && (
                <button
                  onClick={() => resetRun()}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Practice again
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
