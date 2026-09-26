import React, { useMemo, useState } from 'react';
import { BadgeCheck, GraduationCap, Sparkles } from 'lucide-react';
import { GameState } from '../types';
import { CertifiedSeal, CourseMedallion, QuizFeedback, QuizMeter, QuizOption, QuizOptionState, QuizScoreRing, QuizStep } from './SalesCertificationPanel';

type CompoundInterestCoursePanelProps = {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  formatMoney: (value: number) => string;
};

type QuizPhase = 'intro' | 'quiz' | 'results';

const DEFAULT_COURSE = {
  failedAttempts: 0,
  bestScore: 0,
  certified: false,
  rewardClaimed: false
};

const COURSE = {
  title: 'Compound Interest Mastery',
  tagline: 'Turn small deposits into unstoppable wealth engines.',
  coverImage: {
    src: '/images/compound-interest/glowing_glass_jar.webp',
    alt: 'Compound Interest Mastery hero'
  },
  modules: [
    {
      title: 'The Snowball Effect',
      summary: 'Why time beats timing — and how compounding turns patience into power.',
      image: '/images/compound-interest/golden_coin_snowball.webp'
    },
    {
      title: 'Rate × Time × Habit',
      summary: 'Lock in a rate, automate deposits, and let the curve do the heavy lifting.',
      image: '/images/compound-interest/futuristic_calendar_percentage_dial.webp'
    },
    {
      title: 'Risk & Resilience',
      summary: 'Balance growth and stability so your compounding survives rough markets.',
      image: '/images/compound-interest/balanced_scale_shield_growth_arrow.webp'
    }
  ]
};

// Image prompts (16:9, high-quality 3D Pixar style):
// 1) Cover: "A glowing glass jar filled with compounding coins spiraling upward, neon streaks showing growth,
// soft cinematic lighting, warm teal + gold palette, premium fintech vibe, depth of field, 16:9."
// 2) Module 1: "A playful snowball made of golden coins rolling downhill, growing larger with each rotation,
// soft neon highlights, cinematic depth of field, premium fintech mood, 16:9."
// 3) Module 2: "A futuristic calendar and percentage dial merging into a rising curve, floating savings coins,
// warm teal and gold glow, clean 3D Pixar style, 16:9."
// 4) Module 3: "A balanced scale holding a shield and growth arrow, representing risk and resilience,
// soft rim lighting, premium fintech atmosphere, 16:9."

const QUIZ = [
  {
    id: 'ci-1',
    question: 'What makes compound interest more powerful than simple interest?',
    options: [
      { id: 'a', label: 'It only grows when you add new money' },
      { id: 'b', label: 'It earns interest on both principal and past interest' },
      { id: 'c', label: 'It ignores the interest rate' },
      { id: 'd', label: 'It never fluctuates' }
    ],
    correct: 'b',
    explanation: 'Compound interest stacks growth on growth — past interest earns interest too.'
  },
  {
    id: 'ci-2',
    question: 'Which has the biggest impact on long-term compounding?',
    options: [
      { id: 'a', label: 'Starting earlier' },
      { id: 'b', label: 'Checking prices daily' },
      { id: 'c', label: 'Skipping small deposits' },
      { id: 'd', label: 'Switching strategies weekly' }
    ],
    correct: 'a',
    explanation: 'Time is the strongest multiplier — earlier starts compound the longest.'
  },
  {
    id: 'ci-3',
    question: 'Doubling time rule: with a 10% annual return, your money doubles in about…',
    options: [
      { id: 'a', label: '3–4 years' },
      { id: 'b', label: '7–8 years' },
      { id: 'c', label: '12–13 years' },
      { id: 'd', label: '20+ years' }
    ],
    correct: 'b',
    explanation: 'Rule of 72: 72 / 10 ≈ 7.2 years.'
  },
  {
    id: 'ci-4',
    question: 'A steady monthly contribution helps compounding because it…',
    options: [
      { id: 'a', label: 'Raises the principal consistently' },
      { id: 'b', label: 'Removes the need for interest' },
      { id: 'c', label: 'Stops market volatility' },
      { id: 'd', label: 'Only works in recessions' }
    ],
    correct: 'a',
    explanation: 'Regular contributions increase the base that future interest multiplies.'
  },
  {
    id: 'ci-5',
    question: 'What is the best way to protect compounding during downturns?',
    options: [
      { id: 'a', label: 'Panic sell everything' },
      { id: 'b', label: 'Diversify and keep contributing' },
      { id: 'c', label: 'Stop all deposits' },
      { id: 'd', label: 'Ignore risk management' }
    ],
    correct: 'b',
    explanation: 'Diversification plus consistent contributions keeps the compounding engine alive.'
  }
];

const CompoundInterestCoursePanel: React.FC<CompoundInterestCoursePanelProps> = ({
  gameState,
  setGameState,
  formatMoney
}) => {
  const courseState = gameState.compoundInterestCourse ?? DEFAULT_COURSE;
  const attemptsLeft = Math.max(0, 3 - courseState.failedAttempts);
  const canStart = courseState.certified || attemptsLeft > 0;

  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = QUIZ[questionIndex];
  const totalQuestions = QUIZ.length;
  const scoreSoFar = useMemo(
    () => QUIZ.reduce((sum, q) => sum + (answers[q.id] === q.correct ? 1 : 0), 0),
    [answers]
  );

  const clampStat = (value: number) => Math.max(0, Math.min(100, value));
  const clampCredit = (value: number) => Math.max(300, Math.min(850, value));

  const rewards = {
    cash: 1500,
    financialIQ: 6,
    credit: 15,
    happiness: 4
  };

  const resetQuiz = (nextPhase: QuizPhase) => {
    setPhase(nextPhase);
    setQuestionIndex(0);
    setAnswers({});
    setShowFeedback(false);
  };

  const startQuiz = () => {
    if (!canStart) return;
    resetQuiz('quiz');
  };

  const finishQuiz = (nextAnswers: Record<string, string>) => {
    const correctCount = QUIZ.reduce((sum, q) => sum + (nextAnswers[q.id] === q.correct ? 1 : 0), 0);
    const passed = correctCount >= 4;

    setPhase('results');

    setGameState(prev => {
      const prevCourse = prev.compoundInterestCourse ?? DEFAULT_COURSE;
      const nextCourse = {
        ...prevCourse,
        bestScore: Math.max(prevCourse.bestScore, correctCount),
        certified: prevCourse.certified || passed,
        rewardClaimed: prevCourse.rewardClaimed || (passed && !prevCourse.rewardClaimed)
      };
      if (!passed && !prevCourse.certified) {
        nextCourse.failedAttempts = prevCourse.failedAttempts + 1;
      }

      let nextState = { ...prev, compoundInterestCourse: nextCourse };
      if (passed && !prevCourse.rewardClaimed) {
        nextState = {
          ...nextState,
          cash: nextState.cash + rewards.cash,
          creditRating: clampCredit((nextState.creditRating ?? 650) + rewards.credit),
          stats: {
            ...nextState.stats,
            financialIQ: clampStat((nextState.stats?.financialIQ ?? 0) + rewards.financialIQ),
            happiness: clampStat((nextState.stats?.happiness ?? 0) + rewards.happiness)
          }
        };
      }

      return nextState;
    });
  };

  const handleSelect = (optionId: string) => {
    if (showFeedback) return;
    const nextAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(nextAnswers);
    setShowFeedback(true);
  };

  const handleNext = () => {
    const nextAnswers = { ...answers };
    if (questionIndex >= totalQuestions - 1) {
      finishQuiz(nextAnswers);
      return;
    }
    setQuestionIndex((idx) => idx + 1);
    setShowFeedback(false);
  };

  const showCoverImage = !COURSE.coverImage.src.includes('__IMAGE_PLACEHOLDER__');
  const passed = scoreSoFar >= 4;
  const answeredCurrent = !!answers[currentQuestion.id];

  const REWARD_CHIPS = [
    { label: `+${rewards.financialIQ} Financial IQ`, tone: 'bg-emerald-500/[0.14] text-emerald-200' },
    { label: `+${rewards.credit} Credit Score`, tone: 'bg-sky-500/[0.14] text-sky-200' },
    { label: `+${rewards.happiness} Happiness`, tone: 'bg-amber-500/[0.14] text-amber-200' },
    { label: `${formatMoney(rewards.cash)} Bonus`, tone: 'bg-purple-500/[0.14] text-purple-200' }
  ];

  return (
    <div className="space-y-5">
      <div className="surface overflow-hidden">
        {showCoverImage ? (
          <div className="relative aspect-[5/2] overflow-hidden sm:aspect-[7/2]">
            <img
              src={COURSE.coverImage.src}
              alt={COURSE.coverImage.alt}
              className="h-full w-full object-cover"
              style={{ WebkitMaskImage: 'linear-gradient(to bottom, #000 45%, transparent)', maskImage: 'linear-gradient(to bottom, #000 45%, transparent)' }}
            />
          </div>
        ) : (
          <div className="flex aspect-[3/1] items-center justify-center bg-white/[0.03] text-xs text-slate-500">
            Cover image placeholder
          </div>
        )}
        <div className={`relative p-5 sm:p-6 ${showCoverImage ? '-mt-14' : ''}`}>
          <CourseMedallion tone="green">
            <Sparkles size={20} strokeWidth={2.4} />
          </CourseMedallion>
          <p className="eyebrow mt-3 flex text-emerald-300">New Course</p>
          <h3 className="t-title-2 text-white">{COURSE.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-400">{COURSE.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {REWARD_CHIPS.map((chip) => (
              <span key={chip.label} className={`num rounded-full px-3 py-1 text-[12px] font-semibold ${chip.tone}`}>{chip.label}</span>
            ))}
          </div>
        </div>
      </div>

      <ol className="grid gap-3 md:grid-cols-3">
        {COURSE.modules.map((module, idx) => {
          const showModuleImage = !module.image.includes('__IMAGE_PLACEHOLDER__');
          return (
          <li key={module.title} className="surface-card overflow-hidden">
            {showModuleImage ? (
              <img
                src={module.image}
                alt={`${module.title} illustration`}
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-white/[0.03] text-[11px] text-slate-500">
                Image placeholder
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[12px] font-bold text-emerald-300">{idx + 1}</span>
                <p className="t-headline text-white">{module.title}</p>
              </div>
              <p className="mt-1.5 text-[13px] leading-snug text-slate-400">{module.summary}</p>
            </div>
          </li>
          );
        })}
      </ol>

      <div className="surface space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="t-headline flex items-center gap-2 text-white">
            <GraduationCap size={18} className="text-emerald-300" />
            Certification
          </p>
          {courseState.certified ? (
            <CertifiedSeal label="Certified" />
          ) : (
            <span className="num flex items-center gap-1.5 text-[13px] text-slate-400">
              <BadgeCheck size={15} className="text-slate-500" />
              {`Attempts left: ${attemptsLeft}`}
            </span>
          )}
        </div>

        {phase === 'intro' && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] leading-relaxed text-slate-300">
              Complete a short assessment to unlock permanent perks and a cash bonus.
            </p>
            <button
              type="button"
              onClick={startQuiz}
              disabled={!canStart}
              className="btn-primary ds-button--lg shrink-0"
            >
              Start assessment
            </button>
          </div>
        )}

        {phase === 'quiz' && (
          <div className="space-y-5">
            <div className="space-y-2.5">
              <div className="num flex items-center justify-between text-[13px] text-slate-400">
                <span className="font-semibold text-slate-300">Question {questionIndex + 1} / {totalQuestions}</span>
                <span>Score: {scoreSoFar}</span>
              </div>
              <QuizMeter value={questionIndex + 1} total={totalQuestions} tone="green" />
            </div>
            <QuizStep stepKey={currentQuestion.id} className="space-y-4">
              <div className="text-[19px] font-semibold leading-[1.35] tracking-[-0.015em] text-white">{currentQuestion.question}</div>
              <div className="grid gap-2.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.id;
                  const isCorrect = opt.id === currentQuestion.correct;
                  const showCorrect = showFeedback && isCorrect;
                  const showWrong = showFeedback && isSelected && !isCorrect;
                  const state: QuizOptionState = showCorrect ? 'correct' : showWrong ? 'wrong' : showFeedback ? 'muted' : isSelected ? 'selected' : 'idle';
                  return (
                    <QuizOption key={opt.id} letter={opt.id.toUpperCase()} state={state} onClick={() => handleSelect(opt.id)}>
                      {opt.label}
                    </QuizOption>
                  );
                })}
              </div>
              <QuizFeedback show={showFeedback} correct={answers[currentQuestion.id] === currentQuestion.correct}>
                {currentQuestion.explanation}
              </QuizFeedback>
            </QuizStep>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className={`ds-button--md min-w-[112px] ${answeredCurrent ? 'btn-primary' : 'btn-secondary'}`}
              >
                {questionIndex >= totalQuestions - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <QuizScoreRing score={scoreSoFar} total={totalQuestions} passed={passed} size={96} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="num t-title-3 text-white">
                Score {scoreSoFar} / {totalQuestions}
              </div>
              <div className={`text-[15px] ${passed ? 'text-emerald-300' : 'text-slate-300'}`}>
                {scoreSoFar >= 4 ? 'Certification unlocked. Rewards applied.' : 'Not quite. Review the modules and try again.'}
              </div>
              <button
                type="button"
                onClick={() => resetQuiz('intro')}
                className="btn-secondary ds-button--md !mt-3"
              >
                Back to course
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompoundInterestCoursePanel;
