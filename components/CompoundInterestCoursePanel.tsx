import React, { useMemo, useState } from 'react';
import { BadgeCheck, GraduationCap, Sparkles } from 'lucide-react';
import { GameState } from '../types';

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

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
          <Sparkles size={14} className="text-amber-300" />
          New Course
        </div>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">{COURSE.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{COURSE.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">+{rewards.financialIQ} Financial IQ</span>
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-200">+{rewards.credit} Credit Score</span>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">+{rewards.happiness} Happiness</span>
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-purple-200">{formatMoney(rewards.cash)} Bonus</span>
            </div>
          </div>
          <div className="w-full md:w-56">
            {showCoverImage ? (
              <img
                src={COURSE.coverImage.src}
                alt={COURSE.coverImage.alt}
                className="h-32 w-full rounded-2xl object-cover border border-slate-700/70"
              />
            ) : (
              <div className="h-32 w-full rounded-2xl border border-dashed border-slate-600/70 bg-slate-900/60 flex items-center justify-center text-xs text-slate-400">
                Cover image placeholder
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COURSE.modules.map((module) => {
          const showModuleImage = !module.image.includes('__IMAGE_PLACEHOLDER__');
          return (
          <div key={module.title} className="glass-tile p-4">
            <div className="text-sm font-semibold text-white">{module.title}</div>
            <p className="mt-2 text-xs text-slate-400">{module.summary}</p>
            {showModuleImage ? (
              <img
                src={module.image}
                alt={`${module.title} illustration`}
                className="mt-3 h-24 w-full rounded-xl object-cover border border-slate-700/70"
              />
            ) : (
              <div className="mt-3 h-24 rounded-xl border border-dashed border-slate-700/70 bg-slate-900/60 flex items-center justify-center text-[11px] text-slate-500">
                Image placeholder
              </div>
            )}
          </div>
          );
        })}
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <GraduationCap size={16} className="text-emerald-300" />
            Certification
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BadgeCheck size={14} className={courseState.certified ? 'text-emerald-300' : 'text-slate-500'} />
            {courseState.certified ? 'Certified' : `Attempts left: ${attemptsLeft}`}
          </div>
        </div>

        {phase === 'intro' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Complete a short assessment to unlock permanent perks and a cash bonus.
            </p>
            <button
              type="button"
              onClick={startQuiz}
              disabled={!canStart}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                canStart ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Start assessment
            </button>
          </div>
        )}

        {phase === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Question {questionIndex + 1} / {totalQuestions}</span>
              <span>Score: {scoreSoFar}</span>
            </div>
            <div className="text-base font-semibold text-white">{currentQuestion.question}</div>
            <div className="grid gap-2">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                const isCorrect = opt.id === currentQuestion.correct;
                const showCorrect = showFeedback && isCorrect;
                const showWrong = showFeedback && isSelected && !isCorrect;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      showCorrect
                        ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100'
                        : showWrong
                        ? 'border-rose-400/60 bg-rose-500/10 text-rose-100'
                        : isSelected
                        ? 'border-sky-400/60 bg-sky-500/10 text-sky-100'
                        : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {showFeedback && (
              <div className="text-xs text-slate-400">{currentQuestion.explanation}</div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                {questionIndex >= totalQuestions - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="space-y-3">
            <div className="text-lg font-semibold text-white">
              Score {scoreSoFar} / {totalQuestions}
            </div>
            <div className="text-sm text-slate-300">
              {scoreSoFar >= 4 ? 'Certification unlocked. Rewards applied.' : 'Not quite. Review the modules and try again.'}
            </div>
            <button
              type="button"
              onClick={() => resetQuiz('intro')}
              className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              Back to course
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompoundInterestCoursePanel;
