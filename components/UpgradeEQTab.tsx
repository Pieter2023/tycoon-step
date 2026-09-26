import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, RefreshCw, ShieldAlert, Trophy } from 'lucide-react';
import { GameState } from '../types';
import { COURSE_ATTEMPTS, COURSE_RAISE_PCT, COURSE_RETAKE_FEE, grantCourseRaise, recordMiss } from '../services/courseRewards';

const RAISE_PCT = COURSE_RAISE_PCT.eq;

type Props = {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;

  // Optional integration hooks (App passes these in)
  saveGame?: (state: GameState) => void;
  showNotif?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  setFloatingNumbers?: React.Dispatch<React.SetStateAction<Array<{ id: string; value: number }>>>;
  formatMoneyFull?: (amount: number) => string;
  playMoneyGain?: () => void;
  playMoneyLoss?: () => void;
};

type EQQuestion = {
  id: string;
  image: string; // public path
  scenario: string;
  question: string;
  options: string[];
  correctIndex: number;
  skill: string;
  explanation: string;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const DEFAULT_EQ_COURSE = { failedAttempts: 0, bestScore: 0, certified: false, rewardClaimed: false };

const EQ_QUESTIONS: EQQuestion[] = [
  {
    id: 'q1',
    image: '/eq-images/1_nervous_seller.webp',
    scenario: "You’re closing a small business purchase. The seller is nervous and keeps repeating: ‘I just don’t want to be taken advantage of.’",
    question: 'What’s your best EQ move?',
    options: [
      'Say: “Relax, I’m fair. Trust me.”',
      'Re-explain the offer, louder, with a bonus spreadsheet.',
      'Mirror it: “Totally fair. What would ‘protected’ look like to you?”',
      'Tell them: “That’s not rational — the numbers are the numbers.”'
    ],
    correctIndex: 2,
    skill: 'Mirror + Clarify',
    explanation: 'When someone repeats a fear, it’s not a logic problem — it’s a safety problem. Mirror the emotion, then ask a clarifying question so they can define what a “win” looks like.'
  },
  {
    id: 'q2',
    image: '/eq-images/2_tenant_heater_issue.webp',
    scenario: 'A tenant messages: “The heater is acting up again 🙄.” You’re busy, but you want them calm and cooperative.',
    question: 'Which reply boosts trust fastest?',
    options: [
      '“Ok.” (no emoji, no plan, no mercy).',
      '“It’s winter. Heaters do that.”',
      '“Ugh, that’s annoying. What’s it doing now? I’ll book someone today.”',
      'Ignore it for hours, then send a three-paragraph explanation.'
    ],
    correctIndex: 2,
    skill: 'Validate First, Fix Second',
    explanation: 'A tiny bit of validation lowers the temperature instantly. Then you move into action with one simple question and a clear commitment.'
  },
  {
    id: 'q3',
    image: '/eq-images/3_networking_monologue.webp',
    scenario: 'At a networking event, someone launches into a 7‑minute monologue about their app, their old app, and their future app’s app.',
    question: 'What’s the smooth EQ play?',
    options: [
      'Interrupt: “Cool. Anyway, here’s what I do…”',
      'Ask one focused question: “What problem are people paying to solve?”',
      'Nod silently until your face cramps, then flee to the snack table.',
      'Give unsolicited advice: “You should pivot to AI.”'
    ],
    correctIndex: 1,
    skill: 'Curiosity With Direction',
    explanation: 'Curiosity builds rapport, but direction builds usefulness. One well‑aimed question makes them feel heard and moves the conversation to substance.'
  },
  {
    id: 'q4',
    image: '/eq-images/4_sparkly_kitchen_appreciation.webp',
    scenario: 'Your partner cleaned the house. It looks amazing. They look tired (the classic combo).',
    question: 'Which response gives the biggest relationship ROI?',
    options: [
      '“Thanks.” (said while scrolling).',
      'Say nothing, because breathing is a love language.',
      '“This looks incredible. I see the effort. What can I take tonight so you can switch off?”',
      '“Wow. Finally.” (says every healthy partner, never).'
    ],
    correctIndex: 2,
    skill: 'Specific Appreciation + Offer Relief',
    explanation: 'Specific appreciation lands. Offering relief converts “seen” into “supported.” That’s EQ on easy mode.'
  },
  {
    id: 'q5',
    image: '/eq-images/5_cant_afford_it.webp',
    scenario: 'A client says: “I’m not sure I can afford this.” You suspect they can, but they’re anxious.',
    question: 'What’s the best next step?',
    options: [
      '“You can. Trust me.”',
      'Ask: “When you say ‘afford,’ is it cashflow, risk, or not loving the price?”',
      'Immediately discount without asking anything.',
      'Say: “Lots of people are buying, so…”'
    ],
    correctIndex: 1,
    skill: 'Name the Real Constraint',
    explanation: '“I can’t afford it” can mean cashflow, risk tolerance, priorities, or uncertainty. Clarify before you solve.'
  },
  {
    id: 'q6',
    image: '/eq-images/6_angry_customer_email.webp',
    scenario: 'A customer emails: “Your team messed this up. Unacceptable.” You can fix it, but they’re heated.',
    question: 'What’s your best first reply?',
    options: [
      '“Actually, you filled out the form wrong.”',
      '“Please calm down.” (the universal de-escalator).',
      '“You’re right to be upset. Here’s what I’m doing now and when you’ll get an update.”',
      'Forward it to someone else and pretend you never saw it.'
    ],
    correctIndex: 2,
    skill: 'Take Heat, Add Clarity',
    explanation: 'The fastest de‑escalator is: validate + concrete next steps + a timeline. Don’t debate blame while the person is in volcano mode.'
  },
  {
    id: 'q7',
    image: '/eq-images/7_late_partner_protein_shaker.webp',
    scenario: 'Your business partner keeps arriving late and starts meetings with a protein powder review.',
    question: 'Which approach is firm and relationship‑safe?',
    options: [
      'Publicly roast them in the group chat.',
      'Say nothing and simmer quietly for six months.',
      'Private + direct: “When you’re late, we lose momentum. Can we agree on a start‑time rule and backup?”',
      'Schedule meetings earlier to “trick” them.'
    ],
    correctIndex: 2,
    skill: 'Boundary + Agreement',
    explanation: 'EQ isn’t avoiding hard conversations — it’s being clear without being cruel. Describe impact, then co‑create a rule.'
  },
  {
    id: 'q8',
    image: '/eq-images/8_barking_dog_complaint.webp',
    scenario: 'A tenant’s dog is barking all night. The neighbor demands you “fix it TODAY.”',
    question: 'What’s the best response plan?',
    options: [
      'Tell the neighbor: “Not my problem.”',
      'Message the tenant: “Stop it or else.”',
      'Acknowledge the neighbor, then contact the tenant with a request + deadline + policy-based consequences.',
      'Ignore both until someone moves out.'
    ],
    correctIndex: 2,
    skill: 'Two‑Sided Calm',
    explanation: 'Manage both emotions and process. Validate the complainant, then use clear steps with the tenant that match your policy.'
  },
  {
    id: 'q9',
    image: '/eq-images/9_after_hours_calls.webp',
    scenario: 'A client keeps calling after hours. You want to be helpful… but you also like sleeping.',
    question: 'What’s the highest‑EQ boundary?',
    options: [
      'Stop answering forever and hope they get the hint.',
      'Reply once: “Do not call me after hours.”',
      'Set expectations: “My hours are X–Y. If it’s urgent, text ‘URGENT’ and I’ll respond by ___.”',
      'Answer every time and slowly become a ghost of yourself.'
    ],
    correctIndex: 2,
    skill: 'Warm Boundary',
    explanation: 'A boundary with a path feels respectful: clear hours + what “urgent” means + a predictable response.'
  },
  {
    id: 'q10',
    image: '/eq-images/10_supplier_price_increase.webp',
    scenario: 'A supplier says: “Prices went up. Take it or leave it.” You need them, but you also need margins.',
    question: 'What’s the best move?',
    options: [
      'Threaten to “go viral” on social media.',
      'Say: “Fine.” Then resent them forever.',
      'Stay calm: “What’s driving the increase? If we adjust volume/terms/timing, can we get closer to the prior rate?”',
      'Send a 2‑page rant email at 1:13 AM.'
    ],
    correctIndex: 2,
    skill: 'Curious Negotiation',
    explanation: 'Ask what’s driving the change, then explore levers (volume, terms, timing). Curiosity keeps the door open.'
  },
  {
    id: 'q11',
    image: '/eq-images/11_great_with_clients_messy_reports.webp',
    scenario: 'Your employee is great with clients but their reports look like they were written during a rollercoaster ride.',
    question: 'What’s the best way to start feedback?',
    options: [
      '“Your reports are terrible. Fix it.”',
      '“You’re great with clients. Let’s bring that care into reports — here’s a template and we’ll review one together.”',
      'Send a passive‑aggressive message with a thumbs‑down emoji.',
      'Rewrite their reports forever and accept your fate.'
    ],
    correctIndex: 1,
    skill: 'Strength → Bridge → Support',
    explanation: 'Start with a real strength, bridge to the gap, then offer tools. Dignity stays intact; outcomes improve.'
  },
  {
    id: 'q12',
    image: '/eq-images/12_new_software_resistance.webp',
    scenario: 'You roll out new software. One teammate hates change and declares: “The old way works.”',
    question: 'What’s the most effective approach?',
    options: [
      'Force it with threats and dramatic speeches.',
      'Ask: “What part worries you most?” Solve that first and give a small win task.',
      'Ignore their resistance and hope culture fixes it.',
      'Publicly point out they’re the only one complaining.'
    ],
    correctIndex: 1,
    skill: 'Find the Fear, Create a Win',
    explanation: 'Resistance usually hides fear (looking incompetent, losing speed, losing control). Address the fear and give a confidence‑building win.'
  },
  {
    id: 'q13',
    image: '/eq-images/13_junior_mistake.webp',
    scenario: 'A junior teammate made a mistake that cost you money. You’re annoyed. They’re embarrassed.',
    question: 'What’s the best leadership response?',
    options: [
      '“How could you do this?” and let silence do the rest.',
      '“It happens. Don’t worry.” with zero follow‑up.',
      '“Let’s review what happened, fix the system, add one safeguard, and move forward. You’re valued here.”',
      'Bring it up in a team meeting as a “learning moment.”'
    ],
    correctIndex: 2,
    skill: 'Blame Less, Learn More',
    explanation: 'Protect psychological safety while improving the process. People grow fastest when coached, not shamed.'
  },
  {
    id: 'q14',
    image: '/eq-images/14_nobody_wants_documentation.webp',
    scenario: 'You need someone to own documentation. Nobody volunteers because nobody’s eyeballs are that brave.',
    question: 'What’s the best influence move?',
    options: [
      'Assign it randomly and disappear.',
      'Offer meaning + credit: “This reduces chaos. If you own it, you set the standard and get credit.”',
      'Say: “If nobody does it, I’m cancelling Friday.”',
      'Do it yourself at midnight while whisper‑crying.'
    ],
    correctIndex: 1,
    skill: 'Attach Status + Purpose',
    explanation: 'People avoid boring work when it feels invisible. Make it meaningful and visible, with ownership and credit.'
  },
  {
    id: 'q15',
    image: '/eq-images/15_strategy_argument.webp',
    scenario: 'Your team is arguing about strategy. Two camps form. Tension rises. Someone says “I’m just being honest.”',
    question: 'What’s the best move as the leader?',
    options: [
      'Pick a side immediately to end it fast.',
      'Pause: “What do we all agree the goal is?” Then list tradeoffs in neutral language.',
      'Let them fight it out — “pressure makes diamonds.”',
      'Change the topic to weekend plans.'
    ],
    correctIndex: 1,
    skill: 'Reset to Shared Goal',
    explanation: 'When debates get personal, reset to shared goals and neutral tradeoffs. You turn “me vs you” into “us vs the problem.”'
  }
];

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildAttemptQuestions(base: EQQuestion[]): EQQuestion[] {
  // Shuffles question order + option order, while preserving correctIndex mapping.
  const qs = base.map((q) => {
    const paired = q.options.map((text, originalIdx) => ({ text, originalIdx }));
    shuffleInPlace(paired);

    const options = paired.map((p) => p.text);
    const correctIndex = paired.findIndex((p) => p.originalIdx === q.correctIndex);

    return { ...q, options, correctIndex };
  });

  shuffleInPlace(qs);
  return qs;
}


export default function UpgradeEQTab({ gameState, setGameState }: Props) {
  const eqCourse = gameState.eqCourse ?? DEFAULT_EQ_COURSE;
  const certified = !!eqCourse.certified;

  const [phase, setPhase] = useState<'intro' | 'quiz' | 'results'>('intro');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [responses, setResponses] = useState<{ selected: number; correct: number }[]>([]);
  const [lastOutcome, setLastOutcome] = useState<'pass' | 'fail' | null>(null);
  const [penaltyApplied, setPenaltyApplied] = useState(false);
  const [lastMiss, setLastMiss] = useState(0);
  // The quiz panel stays clickable while it animates out; a second Finish must not count another attempt.
  const finishedRef = useRef(false);

  const [questions, setQuestions] = useState<EQQuestion[]>(() => buildAttemptQuestions(EQ_QUESTIONS));

  const total = questions.length;
  const current = questions[idx];

  const attemptInfo = useMemo(() => {
    const remaining = certified ? null : Math.max(0, 3 - eqCourse.failedAttempts);
    return { remaining };
  }, [certified, eqCourse.failedAttempts]);

  const resetRun = () => {
    setQuestions(buildAttemptQuestions(EQ_QUESTIONS));
    setIdx(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setResponses([]);
    setLastOutcome(null);
    setPenaltyApplied(false);
    setLastMiss(0);
    finishedRef.current = false;
    setPhase('quiz');
  };

  const applyPassRewardsIfEligible = () => {
    setGameState(prev => {
      const prevEq = prev.eqCourse ?? DEFAULT_EQ_COURSE;
      const alreadyRewarded = !!prevEq.rewardClaimed;
      const nextEq = {
        ...prevEq,
        certified: true,
        rewardClaimed: true,
        failedAttempts: 0,
        bestScore: Math.max(prevEq.bestScore ?? 0, total)
      };

      const nextPerks = {
        careerXpMultiplier: 1.5,
        careerXpCarry: prev.eqPerks?.careerXpCarry ?? 0
      };

      // Always mark certified + enable perk; only grant the raise/stats once.
      let stats = { ...prev.stats };
      let courseRaises = prev.courseRaises;

      if (!alreadyRewarded) {
        courseRaises = grantCourseRaise(prev, 'eq').courseRaises;
        stats = {
          ...stats,
          networking: clamp((stats.networking ?? 0) + 12, 0, 100),
          happiness: clamp((stats.happiness ?? 0) + 6, 0, 100),
          stress: clamp((stats.stress ?? 0) - 10, 0, 100),
          energy: clamp((stats.energy ?? 0) + 4, 0, 100),
          fulfillment: clamp((stats.fulfillment ?? 0) + 5, 0, 100)
        };
      }

      return {
        ...prev,
        stats,
        courseRaises,
        eqCourse: nextEq,
        eqPerks: nextPerks
      };
    });
  };

  const applyFailProgressAndMaybePenalty = (finalScore: number) => {
    setGameState(prev => {
      const prevEq = prev.eqCourse ?? DEFAULT_EQ_COURSE;
      const nextFailed = (prevEq.failedAttempts ?? 0) + 1;
      const nextBest = Math.max(prevEq.bestScore ?? 0, finalScore);

      // If already certified, failing in practice mode has no consequences.
      if (prevEq.certified) {
        return { ...prev, eqCourse: { ...prevEq, bestScore: nextBest } };
      }

      // A third miss costs the retake fee and starts a fresh set of tries.
      const miss = recordMiss(prev, prevEq.failedAttempts ?? 0);
      if (miss.feeCharged) {
        return { ...miss.state, eqCourse: { ...prevEq, failedAttempts: 0, bestScore: nextBest } };
      }

      return {
        ...prev,
        eqCourse: {
          ...prevEq,
          failedAttempts: nextFailed,
          bestScore: nextBest
        }
      };
    });
  };

  const onSelect = (choiceIdx: number) => {
    if (answered) return;
    setSelected(choiceIdx);
    setAnswered(true);
    const isCorrect = choiceIdx === current.correctIndex;
    const nextScore = score + (isCorrect ? 1 : 0);
    setScore(nextScore);
    setResponses(prev => [...prev, { selected: choiceIdx, correct: current.correctIndex }]);
  };

  const onNext = () => {
    if (!answered) return;
    if (idx < total - 1) {
      setIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }
    // Finish (once per run)
    if (finishedRef.current) return;
    finishedRef.current = true;
    const final = score;
    const passed = final === total;
    setLastOutcome(passed ? 'pass' : 'fail');
    setPhase('results');
    if (passed) {
      applyPassRewardsIfEligible();
    } else {
      applyFailProgressAndMaybePenalty(final);
      // We can’t know if the fee applied until state update; track separately for UI hints.
      const nextFailed = (eqCourse.failedAttempts ?? 0) + 1;
      setLastMiss(nextFailed);
      setPenaltyApplied(!certified && nextFailed >= COURSE_ATTEMPTS);
    }
  };

  const percent = Math.round((score / total) * 100);

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-emerald-300" size={20} /> Upgrade your EQ
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Get certified in people-skills. Win more deals. Get promoted faster. Avoid becoming the villain in your own group chat.
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border ${certified ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-200' : 'bg-slate-900/40 border-slate-700 text-slate-300'}`}>
              <Award size={16} /> {certified ? 'Certified' : 'Not certified'}
            </div>
            {!certified && (
              <p className="text-xs text-slate-400 mt-2">
                Tries left before the retake fee: <span className="text-white font-semibold">{attemptInfo.remaining}</span>
              </p>
            )}
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
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-white">Rule:</span> You must score <span className="font-semibold text-emerald-200">100% (15/15)</span> to earn the rewards.
                </p>
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-white">If you pass (100%)</p>
                  <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
                    <li>A {RAISE_PCT}% raise that stays through promotions and job changes (once per save)</li>
                    <li>Career experience builds 1.5× faster, so promotions come sooner</li>
                    <li>Bonus stats: Networking +12, Happiness +6, Stress −10, Energy +4, Fulfillment +5</li>
                  </ul>
                </div>
                <div className="bg-slate-900/40 border border-amber-700/40 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-amber-200">If you fail (anything less than 100%)</p>
                  <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
                    <li>You can retry, but you must start from Question 1.</li>
                    <li>{COURSE_ATTEMPTS} tries included. After a third miss, a ${COURSE_RETAKE_FEE} retake fee buys {COURSE_ATTEMPTS} more.</li>
                  </ul>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-4">
                <p className="text-sm font-semibold text-white">Your progress</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
                    <p className="text-xs text-slate-400">Best score</p>
                    <p className="text-lg font-bold text-white">{eqCourse.bestScore}/{total}</p>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
                    <p className="text-xs text-slate-400">Failed attempts</p>
                    <p className="text-lg font-bold text-white">{certified ? '—' : eqCourse.failedAttempts}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Tip: once you’re certified, practice is free — no fees, no extra rewards.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => resetRun()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Start EQ Certification
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
                    alt="EQ question"
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
                        {selected === current.correctIndex ? 'Nice.' : 'Oof.'} <span className="text-slate-300">{current.skill}</span>
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
                <p className="text-sm font-semibold text-white">Rewards</p>
                <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
                  <li>A {RAISE_PCT}% raise that stays through promotions and job changes (once per save)</li>
                  <li>Career experience builds 1.5× faster (earlier promotions)</li>
                  <li>Networking +12, Happiness +6, Stress −10, Energy +4, Fulfillment +5</li>
                </ul>
              </div>
            ) : (
              <div className="mt-4 bg-slate-900/40 border border-amber-700/40 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="text-amber-200 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">Certification requires 100%</p>
                    <p className="text-sm text-slate-300 mt-1">Retakes must start from Question 1.</p>
                    {!certified && lastMiss > 0 && (
                      <p className="text-xs text-slate-400 mt-2">Miss {lastMiss} of {COURSE_ATTEMPTS}</p>
                    )}
                    {penaltyApplied && !certified && (
                      <p className="text-sm text-rose-200 mt-2 font-semibold">Retake fee: −${COURSE_RETAKE_FEE}. You have {COURSE_ATTEMPTS} more tries.</p>
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
