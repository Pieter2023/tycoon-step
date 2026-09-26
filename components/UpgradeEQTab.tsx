import React, { useMemo, useRef, useState } from 'react';
import { Award, Check, HeartPulse, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { GameState } from '../types';
import { COURSE_ATTEMPTS, COURSE_RAISE_PCT, COURSE_RETAKE_FEE, grantCourseRaise, recordMiss } from '../services/courseRewards';
import { BulletList, CertifiedSeal, CourseMedallion, PhasePanel, QuizFeedback, QuizMeter, QuizOption, QuizOptionState, QuizScoreRing, QuizStep, SceneImage } from './SalesCertificationPanel';

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
  const passedRun = lastOutcome === 'pass';

  return (
    <div className="space-y-4">
      <div className="surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <CourseMedallion tone="pink" size="lg">
              <HeartPulse size={26} strokeWidth={2.3} />
            </CourseMedallion>
            <div className="min-w-0">
              <h2 className="t-title-2 text-white">Upgrade your EQ</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-400">
                Get certified in people-skills. Win more deals. Get promoted faster. Avoid becoming the villain in your own group chat.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end sm:text-right">
            {certified ? (
              <CertifiedSeal label="Certified" />
            ) : (
              <span className="ds-badge ds-badge--neutral !text-[12px]"><Award size={13} /> Not certified</span>
            )}
            {!certified && (
              <p className="text-[13px] text-slate-400">
                Tries left before the retake fee: <span className="num font-semibold text-white">{attemptInfo.remaining}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {phase === 'intro' && (
        <PhasePanel key="intro">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-[15px] text-slate-200">
                <span className="font-semibold text-white">Rule:</span> You must score <span className="num font-semibold text-emerald-300">100% (15/15)</span> to earn the rewards.
              </p>
              <div className="rounded-[18px] bg-emerald-500/[0.08] p-4">
                <p className="text-[15px] font-semibold text-emerald-200">If you pass (100%)</p>
                <BulletList tone="green" items={[
                  `A ${RAISE_PCT}% raise that stays through promotions and job changes (once per save)`,
                  'Career experience builds 1.5× faster, so promotions come sooner',
                  'Bonus stats: Networking +12, Happiness +6, Stress −10, Energy +4, Fulfillment +5'
                ]} />
              </div>
              <div className="rounded-[18px] bg-orange-500/[0.08] p-4">
                <p className="text-[15px] font-semibold text-orange-200">If you fail (anything less than 100%)</p>
                <BulletList tone="orange" items={[
                  'You can retry, but you must start from Question 1.',
                  `${COURSE_ATTEMPTS} tries included. After a third miss, a $${COURSE_RETAKE_FEE} retake fee buys ${COURSE_ATTEMPTS} more.`
                ]} />
              </div>
            </div>
            <div className="self-start rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
              <p className="t-headline text-white">Your progress</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-[14px] bg-white/[0.05] p-3">
                  <p className="text-[12px] text-slate-400">Best score</p>
                  <p className="num text-[22px] font-bold text-white">{eqCourse.bestScore}/{total}</p>
                  <QuizMeter value={eqCourse.bestScore} total={total} tone="pink" className="mt-2" />
                </div>
                <div className="rounded-[14px] bg-white/[0.05] p-3">
                  <p className="text-[12px] text-slate-400">Failed attempts</p>
                  <p className="num text-[22px] font-bold text-white">{certified ? '—' : eqCourse.failedAttempts}</p>
                </div>
              </div>
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
              Start EQ Certification
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
            <QuizMeter value={idx + 1} total={total} tone="pink" />
          </div>

          <QuizStep stepKey={current.id} className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <SceneImage src={current.image} alt="EQ question" />
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
                title={<>{selected === current.correctIndex ? 'Nice.' : 'Oof.'} <span className="font-medium text-slate-400">{current.skill}</span></>}
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
              <p className="text-[15px] font-semibold text-white">Rewards</p>
              <BulletList tone="green" items={[
                `A ${RAISE_PCT}% raise that stays through promotions and job changes (once per save)`,
                'Career experience builds 1.5× faster (earlier promotions)',
                'Networking +12, Happiness +6, Stress −10, Energy +4, Fulfillment +5'
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
