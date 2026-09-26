import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  RefreshCw,
  X,
  ShieldAlert,
  Users,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import type { GameState } from '../types';
import { COURSE_ATTEMPTS, COURSE_RAISE_PCT, COURSE_RETAKE_FEE, grantCourseRaise, recordMiss } from '../services/courseRewards';
import { BulletList, CertifiedSeal, CourseMedallion, PhasePanel, QuizFeedback, QuizMeter, QuizOption, QuizOptionState, QuizScoreRing, QuizStep, SceneImage } from './SalesCertificationPanel';

// --- Course tuning ---
const RAISE_PCT = COURSE_RAISE_PCT.negotiations;

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
  const [lastMiss, setLastMiss] = useState(0);
  // The quiz panel stays clickable while it animates out; a second Finish must not count another attempt.
  const finishedRef = useRef(false);

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
    setLastMiss(0);
    finishedRef.current = false;
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

    // Passing always marks certified; the raise only once.
    setGameState((prev) => {
      let next: GameState = {
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
        next = grantCourseRaise(next, 'negotiations');
        next.negotiationsCourse = {
          ...next.negotiationsCourse!,
          rewardClaimed: true,
        };

        if (playMoneyGain) playMoneyGain();
        if (showNotif) {
          showNotif(
            'Master Negotiations — Certified ✅',
            `You negotiated a ${RAISE_PCT}% raise. It stays with you through promotions and job changes, and the deal perks are unlocked.`,
            'success'
          );
        }
      } else if (!alreadyCertified && showNotif) {
        showNotif(
          'Master Negotiations — Certified ✅',
          'Certification saved. This save already claimed the course reward.',
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

    // Local UI state is set here, not inside the game-state updater (that runs while App renders).
    const missNo = (negCourse.failedAttempts ?? 0) + 1;
    setLastMiss(missNo);
    setPenaltyApplied(missNo >= COURSE_ATTEMPTS);

    setGameState((prev) => {
      const prevCourse = prev.negotiationsCourse ?? DEFAULT_COURSE_STATE;
      const miss = recordMiss(prev, prevCourse.failedAttempts ?? 0);
      const fee = formatMoneyFull ? formatMoneyFull(COURSE_RETAKE_FEE) : `$${COURSE_RETAKE_FEE}`;

      const next: GameState = {
        ...miss.state,
        negotiationsCourse: {
          certified: false,
          rewardClaimed: prevCourse.rewardClaimed ?? false,
          failedAttempts: miss.failedAttempts,
          bestScore: Math.max(prevCourse.bestScore ?? 0, finalScore),
        },
      };

      if (miss.feeCharged) {
        if (playMoneyLoss) playMoneyLoss();
        if (setFloatingNumbers) {
          setFloatingNumbers((arr) => [
            ...arr,
            { id: `mn_retake_${Date.now()}`, value: -COURSE_RETAKE_FEE },
          ]);
        }
        if (showNotif) {
          showNotif(
            'Master Negotiations — Retake fee',
            `Third miss: a ${fee} retake fee buys ${COURSE_ATTEMPTS} more tries.`,
            'warning'
          );
        }
      } else {
        if (showNotif) {
          showNotif(
            'Master Negotiations — Not certified yet',
            `Try ${miss.failedAttempts} of ${COURSE_ATTEMPTS}. You need 100% to pass.`,
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

    // Finish (once per run)
    if (finishedRef.current) return;
    finishedRef.current = true;
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

  const passedRun = lastOutcome === 'pass';

  return (
    <div className="space-y-4">
      <div className="surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <CourseMedallion tone="blue" size="lg">
              <Users size={26} strokeWidth={2.3} />
            </CourseMedallion>
            <div className="min-w-0">
              <h2 className="t-title-2 text-white">Master Negotiations</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-400">
                Learn a repeatable deal framework, then pass the certification quiz.
              </p>
            </div>
          </div>

          {certified ? (
            <CertifiedSeal label="Certified" />
          ) : (
            <span className="ds-badge ds-badge--neutral !text-[12px]"><Award size={13} /> Not certified</span>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <div className="flex items-center gap-2.5 text-white">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><DollarSign size={16} /></span>
              <p className="text-[15px] font-semibold">Pass reward</p>
            </div>
            <p className="mt-2.5 text-[14px] leading-snug text-slate-300">Get 100% and earn a <span className="font-semibold text-emerald-300">{RAISE_PCT}% raise</span> that stays with you (once per save).</p>
          </div>

          <div className="rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <div className="flex items-center gap-2.5 text-white">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/15 text-sky-300"><TrendingUp size={16} /></span>
              <p className="text-[15px] font-semibold">Permanent perks</p>
            </div>
            <p className="mt-2.5 text-[14px] leading-snug text-slate-300">
              After certification: <span className="font-semibold text-emerald-300">5% cheaper</span> property and business buys, <span className="font-semibold text-emerald-300">3% higher</span> sale proceeds, and better yearly raises and promotion odds.
            </p>
          </div>

          <div className="rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <div className="flex items-center gap-2.5 text-white">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400/15 text-orange-300"><ShieldAlert size={16} /></span>
              <p className="text-[15px] font-semibold">Retakes</p>
            </div>
            <p className="mt-2.5 text-[14px] leading-snug text-slate-300"><span className="font-semibold text-rose-300">{COURSE_ATTEMPTS} tries</span> included. After a third miss, a <span className="num font-semibold text-rose-300">${COURSE_RETAKE_FEE} retake fee</span> buys {COURSE_ATTEMPTS} more.</p>
          </div>
        </div>
      </div>

      {phase === 'intro' && (
        <PhasePanel key="intro">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="overflow-hidden rounded-[20px] bg-black/30 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                <img
                  src="/event-images/salary_negotiation.webp"
                  alt="Negotiation hero"
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
                Negotiation is a money skill. Mastering anchors, trades, and calm communication improves your deals across the entire game.
              </p>

              <div className="mt-4 rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                <div className="flex items-center gap-2">
                  <Users size={17} className="text-sky-300" />
                  <p className="text-[15px] font-semibold text-white">Quick checklist</p>
                </div>
                <BulletList tone="green" items={[
                  'Pass requires 100% correct',
                  'Questions + answer letters shuffle each run',
                  'After you’re certified: practice is free'
                ]} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={17} className="text-sky-300" />
                <p className="text-[15px] font-semibold text-white">What you’ll learn</p>
              </div>

              <ol className="list-group mt-3">
                {MODULES.map((m) => (
                  <li key={m.title} className="list-row block py-3.5">
                    <p className="text-[15px] font-semibold text-white">{m.title}</p>
                    <BulletList items={m.bullets} className="mt-2" />
                    <p className="mt-2.5 text-[13px] leading-snug text-slate-400"><span className="font-semibold text-sky-300">Micro-drill:</span> {m.microDrill}</p>
                  </li>
                ))}
              </ol>

              <p className="mt-3 text-[13px] text-slate-400">
                Tip: once you’re certified, practice is free — no fees, no extra rewards.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => resetRun()}
              className="btn-primary ds-button--lg"
            >
              Start Negotiation Certification
            </button>
            {certified && (
              <button
                onClick={() => resetRun()}
                className="btn-secondary ds-button--lg"
              >
                Practice Mode
              </button>
            )}
          </div>
        </PhasePanel>
      )}

      {phase === 'quiz' && (
        <PhasePanel key="quiz">
          <div className="space-y-2.5">
            <div className="num flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-semibold text-slate-300">Question {idx + 1} of {total}</p>
              <p className="text-[13px] text-slate-400">Score: {score}/{total}</p>
            </div>
            <QuizMeter value={idx + 1} total={total} tone="blue" />
          </div>

          <QuizStep stepKey={current.id} className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <SceneImage src={current.image} alt="Negotiation question" aspect="aspect-video" />
              <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{current.scenario}</p>
              <p className="mt-2 text-[19px] font-semibold leading-[1.35] tracking-[-0.015em] text-white">{current.question}</p>
            </div>

            <div className="space-y-2.5">
              {current.options.map((opt, i) => {
                const isCorrect = answered && i === current.correctIndex;
                const isWrong = answered && selected === i && i !== current.correctIndex;
                const state: QuizOptionState = isCorrect ? 'correct' : isWrong ? 'wrong' : answered ? 'muted' : 'idle';
                return (
                  <QuizOption key={i} letter={String.fromCharCode(65 + i)} state={state} onClick={() => onSelect(i)} disabled={answered}>
                    {opt}
                  </QuizOption>
                );
              })}

              <QuizFeedback
                show={answered}
                correct={selected === current.correctIndex}
                title={<>{selected === current.correctIndex ? 'Nice.' : 'Not quite.'} <span className="font-medium text-slate-400">{current.skill}</span></>}
                footer={(
                  <div className="mt-4 flex gap-2.5">
                    <button
                      onClick={onNext}
                      className="btn-primary ds-button--md min-w-[104px]"
                    >
                      {idx === total - 1 ? 'Finish' : 'Next'}
                    </button>
                    <button
                      onClick={() => { setPhase('intro'); }}
                      className="btn-secondary ds-button--md"
                    >
                      Quit
                    </button>
                  </div>
                )}
              >
                {current.explanation}
              </QuizFeedback>
            </div>
          </QuizStep>
        </PhasePanel>
      )}

      {phase === 'results' && (
        <PhasePanel key="results">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <QuizScoreRing
                score={score}
                total={total}
                passed={passedRun}
                size={104}
                centre={passedRun ? <Check size={34} strokeWidth={3} className="text-emerald-300" /> : <X size={34} strokeWidth={3} className="text-rose-300" />}
              />
              <div>
                <p className="eyebrow">Result</p>
                <p className="num t-title-1 text-white">{percent}%</p>
                <p className="num text-[15px] text-slate-400">Score: {score}/{total}</p>
              </div>
            </div>
            <div className={`rounded-[18px] px-4 py-3 ${passedRun ? 'bg-emerald-500/[0.14] text-emerald-100' : 'bg-rose-500/[0.14] text-rose-100'}`}>
              <p className="text-[15px] font-semibold">
                {passedRun ? 'Certified ✅' : 'Not certified ❌'}
              </p>
              <p className="text-[12px] opacity-80">{passedRun ? 'Rewards applied (if eligible)' : 'You must restart to retry'}</p>
            </div>
          </div>

          {passedRun ? (
            <div className="mt-5 rounded-[18px] bg-emerald-500/[0.08] p-4">
              <p className="text-[15px] font-semibold text-white">Rewards & perks</p>
              <BulletList tone="green" items={[
                `A ${RAISE_PCT}% raise that stays through promotions and job changes (once per save)`,
                'Permanent: better yearly raises and promotion odds',
                'Permanent: 5% cheaper property and business buys',
                'Permanent: 3% higher property and business sale proceeds',
                'Networking +10, Happiness +4, Stress −6, Energy +2, Fulfillment +4'
              ]} />
            </div>
          ) : (
            <div className="mt-5 flex items-start gap-3 rounded-[18px] bg-orange-500/[0.08] p-4">
              <ShieldAlert className="mt-0.5 shrink-0 text-orange-300" size={18} />
              <div>
                <p className="text-[15px] font-semibold text-orange-200">Certification requires 100%</p>
                <p className="mt-1 text-[14px] text-slate-300">Retakes must start from Question 1.</p>
                {!certified && lastMiss > 0 && (
                  <p className="num mt-2 text-[12px] text-slate-400">Miss {lastMiss} of {COURSE_ATTEMPTS}</p>
                )}
                {penaltyApplied && !certified && (
                  <p className="num mt-2 text-[14px] font-semibold text-rose-300">Retake fee: −${COURSE_RETAKE_FEE}. You have {COURSE_ATTEMPTS} more tries.</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => { setPhase('intro'); }}
              className="btn-secondary ds-button--md"
            >
              Back
            </button>

            {lastOutcome === 'fail' && (
              <button
                onClick={() => resetRun()}
                className="btn-primary ds-button--md"
              >
                <RefreshCw size={16} /> Start over
              </button>
            )}
            {lastOutcome === 'pass' && (
              <button
                onClick={() => resetRun()}
                className="btn-secondary ds-button--md"
              >
                <RefreshCw size={16} /> Practice again
              </button>
            )}
          </div>
        </PhasePanel>
      )}
    </div>
  );
}
