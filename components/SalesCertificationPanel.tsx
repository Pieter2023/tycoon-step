import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CheckCircle, X, XCircle, Zap } from 'lucide-react';
import { GameState } from '../types';
import Modal from './Modal';
import { SALES_ACCELERATOR_QUIZ, SALES_ACCELERATOR_QUIZ_META } from '../data/salesAcceleratorQuiz';
import { useI18n } from '../i18n';
import { COURSE_RAISE_PCT, COURSE_RETAKE_FEE, grantCourseRaise, recordMiss } from '../services/courseRewards';
import ActivityRing from './ui/ActivityRing';
import { MOTION_DISABLED, springs } from './ui/motion';

type SalesCertificationPanelProps = {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  formatMoney: (value: number) => string;
};

const SalesCertificationPanel: React.FC<SalesCertificationPanelProps> = ({
  gameState,
  setGameState,
  formatMoney
}) => {
  const { t } = useI18n();

  const resolveText = (key: string | undefined, fallback: string | undefined) => {
    if (!key) return fallback ?? '';
    const value = t(key);
    return value === key ? (fallback ?? key) : value;
  };

  const quizRules = SALES_ACCELERATOR_QUIZ_META.rules;
  const quizQuestions = useMemo(
    () => SALES_ACCELERATOR_QUIZ.slice(0, quizRules.questionCount),
    [quizRules.questionCount]
  );
  const [quizPhase, setQuizPhase] = useState<'intro' | 'quiz' | 'results'>('intro');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [rewardGranted, setRewardGranted] = useState(false);
  const [attemptsAfterRun, setAttemptsAfterRun] = useState<number | null>(null);
  const [feeCharged, setFeeCharged] = useState(false);
  const [showSalesQuiz, setShowSalesQuiz] = useState(false);

  const courseState = gameState.salesAcceleratorCourse ?? {
    failedAttempts: 0,
    bestScore: 0,
    certified: false,
    rewardClaimed: false
  };
  const attemptsLeft = Math.max(0, quizRules.attemptsAllowed - courseState.failedAttempts);
  const canStartQuiz = courseState.certified || attemptsLeft > 0;

  const clampStat = (value: number) => Math.max(0, Math.min(100, value));

  const getCorrectOptionId = (question: (typeof SALES_ACCELERATOR_QUIZ)[number]) =>
    question.options.find(opt => 'correct' in opt && opt.correct)?.id || '';

  const getOptionText = (question: (typeof SALES_ACCELERATOR_QUIZ)[number], optionId: string, fallback: string) => {
    const key = question.i18n?.optionKeys?.[optionId as 'a' | 'b' | 'c' | 'd'];
    return resolveText(key, fallback);
  };

  const resetQuiz = (phase: 'intro' | 'quiz') => {
    setQuizPhase(phase);
    setQuizIndex(0);
    setQuizAnswers({});
    setShowFeedback(false);
    setSelectedOption(null);
    setFinalScore(null);
    setQuizPassed(false);
    setRewardGranted(false);
    setAttemptsAfterRun(null);
    setFeeCharged(false);
  };

  const closeQuiz = () => {
    setShowSalesQuiz(false);
    resetQuiz('intro');
  };

  const openQuiz = () => {
    setShowSalesQuiz(true);
    resetQuiz('intro');
  };

  const startQuiz = () => {
    if (!canStartQuiz) return;
    resetQuiz('quiz');
  };

  const finishQuiz = (answers: Record<string, string>) => {
    const total = quizQuestions.length;
    const correctCount = quizQuestions.reduce((sum, question) => {
      const correctId = getCorrectOptionId(question);
      return sum + (answers[question.id] === correctId ? 1 : 0);
    }, 0);
    const passed = quizRules.passCondition === 'allCorrect'
      ? correctCount === total
      : (correctCount / total) * 100 >= quizRules.passPercentage;

    setFinalScore(correctCount);
    setQuizPassed(passed);
    const shouldGrantReward = passed && !courseState.rewardClaimed;
    const missed = !passed && !courseState.certified;
    // A third miss pays the retake fee and starts a fresh set of tries.
    const chargesFee = missed && attemptsLeft <= 1;
    setRewardGranted(shouldGrantReward);
    setFeeCharged(chargesFee);
    setAttemptsAfterRun(!missed ? attemptsLeft : chargesFee ? quizRules.attemptsAllowed : attemptsLeft - 1);
    setQuizPhase('results');

    setGameState(prev => {
      const current = prev.salesAcceleratorCourse ?? {
        failedAttempts: 0,
        bestScore: 0,
        certified: false,
        rewardClaimed: false
      };
      const nextCourse = {
        ...current,
        bestScore: Math.max(current.bestScore, correctCount),
        certified: current.certified || passed,
        rewardClaimed: current.rewardClaimed || (passed && !current.rewardClaimed)
      };

      let nextState: GameState = { ...prev, salesAcceleratorCourse: nextCourse };
      if (!passed && !current.certified) {
        const miss = recordMiss(nextState, current.failedAttempts);
        nextState = { ...miss.state, salesAcceleratorCourse: { ...nextCourse, failedAttempts: miss.failedAttempts } };
      }
      if (passed && !current.rewardClaimed) {
        const reward = SALES_ACCELERATOR_QUIZ_META.rewards.onPass;
        nextState = {
          ...grantCourseRaise(nextState, 'sales'),
          stats: {
            ...nextState.stats,
            financialIQ: clampStat((nextState.stats?.financialIQ ?? 0) + reward.fiq),
            happiness: clampStat((nextState.stats?.happiness ?? 0) + reward.happiness)
          }
        };
      } else if (!passed) {
        const penalty = SALES_ACCELERATOR_QUIZ_META.rules.onFail;
        if (penalty.stressDelta) {
          nextState = {
            ...nextState,
            stats: {
              ...nextState.stats,
              stress: clampStat((nextState.stats?.stress ?? 0) + penalty.stressDelta)
            }
          };
        }
      }

      return nextState;
    });
  };

  const handleSelectOption = (optionId: string) => {
    if (showFeedback) return;
    const currentQuestion = quizQuestions[quizIndex];
    const nextAnswers = { ...quizAnswers, [currentQuestion.id]: optionId };
    setQuizAnswers(nextAnswers);
    setSelectedOption(optionId);
    if (quizRules.showExplanationAfterAnswer) {
      setShowFeedback(true);
      return;
    }
    if (quizIndex >= quizQuestions.length - 1) {
      finishQuiz(nextAnswers);
    } else {
      setQuizIndex((idx) => idx + 1);
      setShowFeedback(false);
      setSelectedOption(null);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex >= quizQuestions.length - 1) {
      finishQuiz(quizAnswers);
      return;
    }
    setQuizIndex((idx) => idx + 1);
    setShowFeedback(false);
    setSelectedOption(null);
  };

  const currentQuestion = quizQuestions[quizIndex];
  const currentCorrectId = currentQuestion ? getCorrectOptionId(currentQuestion) : '';
  const scoreSoFar = quizQuestions.reduce((sum, question) => {
    const correctId = getCorrectOptionId(question);
    return sum + (quizAnswers[question.id] === correctId ? 1 : 0);
  }, 0);
  const showCoverImage = !SALES_ACCELERATOR_QUIZ_META.ui.coverImage.src.includes('__IMAGE_PLACEHOLDER__');
  const showQuestionImage = currentQuestion
    ? !currentQuestion.media.image.src.includes('__IMAGE_PLACEHOLDER__')
    : false;

  const quizTitle = resolveText(SALES_ACCELERATOR_QUIZ_META.titleKey, SALES_ACCELERATOR_QUIZ_META.title);
  const quizDescription = resolveText(SALES_ACCELERATOR_QUIZ_META.descriptionKey, SALES_ACCELERATOR_QUIZ_META.description);
  const quizEntryLabel = resolveText(
    SALES_ACCELERATOR_QUIZ_META.ui.entryPointLabelKey,
    SALES_ACCELERATOR_QUIZ_META.ui.entryPointLabel
  );
  const quizQuickTips = SALES_ACCELERATOR_QUIZ_META.ui.quickTips.map((tip, idx) =>
    resolveText(SALES_ACCELERATOR_QUIZ_META.ui.quickTipsKeys?.[idx], tip)
  );

  const certified = courseState.certified;
  const reviewItems = quizQuestions.map((question) => {
    const correctId = getCorrectOptionId(question);
    const chosen = quizAnswers[question.id];
    const correctOption = question.options.find(opt => opt.id === correctId);
    const correctText = correctOption ? getOptionText(question, correctId, correctOption.text) : '';
    const chosenOption = question.options.find(opt => opt.id === chosen);
    const chosenText = chosenOption ? getOptionText(question, chosenOption.id, chosenOption.text) : t('salesQuiz.ui.noAnswer');
    return { question, isCorrect: chosen === correctId, correctText, chosenText };
  });
  const resultImage = quizPassed ? SALES_ACCELERATOR_QUIZ_META.ui.resultImages.pass : SALES_ACCELERATOR_QUIZ_META.ui.resultImages.fail;

  return (
    <div className="surface overflow-hidden">
      {/* Cover art: the course's own illustration, fading into the card like an Apple Books cover. */}
      {showCoverImage && (
        <div className="relative aspect-[5/2] overflow-hidden sm:aspect-[7/2]">
          <img
            src={SALES_ACCELERATOR_QUIZ_META.ui.coverImage.src}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            style={{ WebkitMaskImage: 'linear-gradient(to bottom, #000 45%, transparent)', maskImage: 'linear-gradient(to bottom, #000 45%, transparent)' }}
          />
        </div>
      )}
      <div className={`relative p-5 sm:p-6 ${showCoverImage ? '-mt-14' : ''}`}>
        <CourseMedallion tone="orange">
          <Zap size={20} strokeWidth={2.4} />
        </CourseMedallion>
        <h3 className="t-title-2 mt-3 text-white">{quizTitle}</h3>
        <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-slate-400">{quizDescription}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {certified ? (
            <CertifiedSeal label={t('salesQuiz.ui.certified')} />
          ) : (
            <span className="num text-[13px] text-slate-400">{t('salesQuiz.ui.attemptsLeft', { count: attemptsLeft })}</span>
          )}
          <button type="button" onClick={openQuiz} className="btn-primary ds-button--lg">
            {quizEntryLabel}
          </button>
        </div>

        <ol className="list-group mt-5">
          {quizQuickTips.map((tip, idx) => (
            <li key={tip} className="list-row text-[14px] leading-snug text-slate-300">
              <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-[12px] font-bold text-orange-300">
                {idx + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-center gap-3">
          <span className="num shrink-0 text-[13px] text-slate-400">
            {t('salesQuiz.ui.bestScore', { score: courseState.bestScore, total: quizQuestions.length })}
          </span>
          <QuizMeter value={courseState.bestScore} total={quizQuestions.length} tone={certified ? 'green' : 'orange'} className="flex-1" />
        </div>
        {!canStartQuiz && (
          <p className="mt-2 text-[13px] text-rose-300">
            {t('salesQuiz.ui.attemptsUsed')}
          </p>
        )}
      </div>

      {showSalesQuiz && (
        <Modal
          isOpen={showSalesQuiz}
          onClose={closeQuiz}
          ariaLabel="Sales Accelerator quiz"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="!max-w-4xl w-full p-5 sm:p-7"
        >
          {quizPhase === 'intro' && (
            <div className="space-y-5">
              <header className="pr-10">
                <p className="eyebrow">{t('salesQuiz.ui.certificationLabel')}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-3">
                  <h2 className="t-title-2 text-white">{quizTitle}</h2>
                  {certified && <CertifiedSeal label={t('salesQuiz.ui.certified')} />}
                </div>
              </header>
              <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
                <div className="overflow-hidden rounded-[20px] bg-white/[0.045] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                  {showCoverImage ? (
                    <img
                      src={SALES_ACCELERATOR_QUIZ_META.ui.coverImage.src}
                      alt={SALES_ACCELERATOR_QUIZ_META.ui.coverImage.alt}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center bg-white/[0.03] text-sm text-slate-500">
                      {t('salesQuiz.ui.coverPlaceholder')}
                    </div>
                  )}
                  <div className="space-y-3 p-4">
                    <p className="text-[15px] leading-relaxed text-slate-300">{quizDescription}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="chip">
                        {quizRules.passCondition === 'allCorrect'
                          ? t('salesQuiz.ui.passingAllCorrect')
                          : t('salesQuiz.ui.passingPercentage', { count: quizRules.passPercentage })}
                      </span>
                      {!certified && <span className="chip num">{t('salesQuiz.ui.attemptsLeft', { count: attemptsLeft })}</span>}
                    </div>
                    {!certified && (
                      <p className="text-[13px] leading-snug text-slate-400">{t('salesQuiz.ui.stakes', { raise: COURSE_RAISE_PCT.sales, fee: formatMoney(COURSE_RETAKE_FEE), count: quizRules.attemptsAllowed })}</p>
                    )}
                  </div>
                </div>
                <div className="rounded-[20px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                  <p className="t-headline text-white">{t('salesQuiz.ui.quickTips')}</p>
                  <ul className="mt-3 space-y-3">
                    {quizQuickTips.map((tip, idx) => (
                      <li key={tip} className="flex gap-3 text-[15px] leading-snug text-slate-300">
                        <span className="num mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-[12px] font-bold text-orange-300">
                          {idx + 1}
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[13px] text-slate-400">
                    {t('salesQuiz.ui.questionCount', { count: quizRules.questionCount })}
                  </p>
                </div>
              </div>
              {!canStartQuiz && !certified && (
                <div className="rounded-2xl bg-rose-500/[0.12] p-3.5 text-sm text-rose-200">
                  {t('salesQuiz.ui.noAttempts')}
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2.5">
                <button type="button" onClick={closeQuiz} className="btn-secondary ds-button--md">
                  {t('salesQuiz.ui.close')}
                </button>
                <button type="button" onClick={startQuiz} disabled={!canStartQuiz} className="btn-primary ds-button--md">
                  {certified ? t('salesQuiz.ui.practiceMode') : t('salesQuiz.ui.startCertification')}
                </button>
              </div>
            </div>
          )}

          {quizPhase === 'quiz' && currentQuestion && (
            <div className="space-y-5">
              <header className="space-y-2.5 pr-10">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="num text-[13px] font-semibold text-slate-300">{t('salesQuiz.ui.questionLabel', { index: quizIndex + 1, total: quizQuestions.length })}</p>
                  <p className="num text-[13px] text-slate-400">{t('salesQuiz.ui.scoreLabel', { score: scoreSoFar, total: quizQuestions.length })}</p>
                </div>
                <QuizMeter value={quizIndex + 1} total={quizQuestions.length} tone="orange" />
              </header>

              <QuizStep stepKey={currentQuestion.id} className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <div>
                  {showQuestionImage ? (
                    <img
                      src={currentQuestion.media.image.src}
                      alt={currentQuestion.media.image.alt}
                      className="aspect-[3/2] w-full rounded-[20px] object-cover shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]"
                    />
                  ) : (
                    <div className="flex aspect-[3/2] items-center justify-center rounded-[20px] bg-white/[0.04] text-sm text-slate-500">
                      {t('salesQuiz.ui.questionPlaceholder')}
                    </div>
                  )}
                  <p className="mt-4 text-[19px] font-semibold leading-[1.35] tracking-[-0.015em] text-white">
                    {resolveText(currentQuestion.i18n?.promptKey, currentQuestion.prompt)}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrect = showFeedback && option.id === currentCorrectId;
                    const isWrong = showFeedback && isSelected && option.id !== currentCorrectId;
                    const state: QuizOptionState = isCorrect ? 'correct' : isWrong ? 'wrong' : showFeedback ? 'muted' : isSelected ? 'selected' : 'idle';
                    return (
                      <QuizOption
                        key={option.id}
                        letter={option.id.toUpperCase()}
                        state={state}
                        onClick={() => handleSelectOption(option.id)}
                        disabled={showFeedback}
                      >
                        {getOptionText(currentQuestion, option.id, option.text)}
                      </QuizOption>
                    );
                  })}

                  <QuizFeedback show={showFeedback} correct={selectedOption === currentCorrectId} title={selectedOption === currentCorrectId ? t('salesQuiz.ui.correct') : t('salesQuiz.ui.incorrect')}>
                    {(() => {
                      const correctOption = currentQuestion.options.find(opt => opt.id === currentCorrectId);
                      const feedbackKey = (correctOption as { feedbackKey?: string } | undefined)?.feedbackKey;
                      const feedbackText = (correctOption as { feedback?: string } | undefined)?.feedback;
                      return resolveText(
                        feedbackKey,
                        feedbackText || resolveText(currentQuestion.i18n?.explanationKey, currentQuestion.explanation)
                      );
                    })()}
                  </QuizFeedback>
                </div>
              </QuizStep>

              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={closeQuiz} className="btn-secondary ds-button--md">
                  {t('salesQuiz.ui.exit')}
                </button>
                <button type="button" onClick={handleNextQuestion} disabled={!showFeedback} className="btn-primary ds-button--md min-w-[112px]">
                  {quizIndex >= quizQuestions.length - 1 ? t('salesQuiz.ui.finish') : t('salesQuiz.ui.next')}
                </button>
              </div>
            </div>
          )}

          {quizPhase === 'results' && (
            <div className="space-y-5">
              <div className="relative -mx-5 -mt-5 overflow-hidden rounded-t-[28px] sm:-mx-7 sm:-mt-7">
                <img src={resultImage.src} alt="" aria-hidden className="aspect-[5/2] w-full object-cover" style={{ WebkitMaskImage: 'linear-gradient(to bottom, #000 45%, transparent)', maskImage: 'linear-gradient(to bottom, #000 45%, transparent)' }} />
              </div>
              <header className="relative -mt-16 flex flex-wrap items-center gap-5 pr-10">
                <QuizScoreRing score={finalScore ?? 0} total={quizQuestions.length} passed={quizPassed} />
                <div className="min-w-0">
                  <p className="eyebrow">{t('salesQuiz.ui.resultsLabel')}</p>
                  <h2 className="t-title-2 text-white">
                    {quizPassed ? t('salesQuiz.ui.resultsPassed') : t('salesQuiz.ui.resultsFailed')}
                  </h2>
                  <span className={`ds-badge mt-2 ${quizPassed ? 'ds-badge--low' : 'ds-badge--high'}`}>
                    {quizPassed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    <span className="num">{t('salesQuiz.ui.scoreLabel', { score: finalScore ?? 0, total: quizQuestions.length })}</span>
                  </span>
                </div>
              </header>

              {quizPassed && rewardGranted && (
                <div className="rounded-2xl bg-emerald-500/[0.12] p-3.5 text-[15px] leading-snug text-emerald-100">
                  {t('salesQuiz.ui.rewardEarned', {
                    raise: COURSE_RAISE_PCT.sales,
                    fiq: SALES_ACCELERATOR_QUIZ_META.rewards.onPass.fiq,
                    happiness: SALES_ACCELERATOR_QUIZ_META.rewards.onPass.happiness
                  })}
                </div>
              )}

              {!quizPassed && !certified && (
                <div className="space-y-1 rounded-2xl bg-rose-500/[0.12] p-3.5 text-[15px] leading-snug text-rose-100">
                  {feeCharged && <p>{t('salesQuiz.ui.retakeFeeCharged', { fee: formatMoney(COURSE_RETAKE_FEE), count: quizRules.attemptsAllowed })}</p>}
                  {t('salesQuiz.ui.attemptsLeft', { count: attemptsAfterRun ?? Math.max(0, attemptsLeft - 1) })}
                </div>
              )}

              {quizRules.allowReviewAtEnd && (
                <div>
                  <p className="t-headline mb-2 text-white">{t('salesQuiz.ui.reviewTitle')}</p>
                  <div className="list-group max-h-72 overflow-y-auto">
                    {reviewItems.map(({ question, isCorrect, correctText, chosenText }) => (
                      <div key={question.id} className="list-row items-start text-[13px]">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isCorrect ? 'bg-emerald-400 text-black' : 'bg-rose-500 text-white'}`}>
                          {isCorrect ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-semibold text-slate-100">
                            {resolveText(question.i18n?.promptKey, question.prompt)}
                          </p>
                          <p className={isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                            {t('salesQuiz.ui.yourAnswer', { answer: chosenText })}
                          </p>
                          {!isCorrect && (
                            <p className="text-slate-400">{t('salesQuiz.ui.correctAnswer', { answer: correctText })}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2.5">
                <button type="button" onClick={closeQuiz} className="btn-secondary ds-button--md">
                  {t('salesQuiz.ui.close')}
                </button>
                <button type="button" onClick={startQuiz} disabled={!canStartQuiz} className="btn-primary ds-button--md">
                  {certified ? t('salesQuiz.ui.practiceAgain') : t('salesQuiz.ui.retry')}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default SalesCertificationPanel;

/* ---------------------------------------------------------------------------------------------
 * Course & quiz parts shared by the four Self Learn courses (Sales, Compound Interest, EQ,
 * Negotiations). Purely presentational: every handler stays in the course that owns the quiz.
 * ------------------------------------------------------------------------------------------- */

const MEDALLION_TONES = {
  orange: 'from-orange-400 to-amber-500 shadow-[0_8px_20px_-8px_rgb(255_159_10/0.7)]',
  green: 'from-emerald-400 to-teal-500 shadow-[0_8px_20px_-8px_rgb(48_209_88/0.7)]',
  pink: 'from-pink-400 to-rose-500 shadow-[0_8px_20px_-8px_rgb(255_55_95/0.7)]',
  blue: 'from-sky-400 to-blue-500 shadow-[0_8px_20px_-8px_rgb(10_132_255/0.7)]',
  purple: 'from-purple-400 to-indigo-500 shadow-[0_8px_20px_-8px_rgb(191_90_242/0.7)]'
} as const;

export type MedallionTone = keyof typeof MEDALLION_TONES;

/** A tinted, SF-Symbols-style icon tile (the squircle an Apple app would put an icon in). */
export const CourseMedallion: React.FC<{ tone: MedallionTone; size?: 'md' | 'lg'; children: React.ReactNode; className?: string }> = ({
  tone,
  size = 'md',
  children,
  className = ''
}) => (
  <span
    aria-hidden
    className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br text-white ${MEDALLION_TONES[tone]} ${
      size === 'lg' ? 'h-14 w-14 rounded-[16px]' : 'h-11 w-11 rounded-[13px]'
    } shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] ${className}`}
  >
    {children}
  </span>
);

/** Green checkmark seal for a finished certification. */
export const CertifiedSeal: React.FC<{ label: React.ReactNode }> = ({ label }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/[0.16] py-1 pl-1 pr-3 text-[13px] font-semibold text-emerald-300">
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-black">
      <Check size={12} strokeWidth={3.2} />
    </span>
    {label}
  </span>
);

const METER_TONES = {
  green: 'bg-gradient-to-r from-emerald-400 to-teal-400',
  orange: 'bg-gradient-to-r from-orange-400 to-amber-300',
  blue: 'bg-gradient-to-r from-blue-500 to-sky-400',
  pink: 'bg-gradient-to-r from-rose-500 to-pink-400'
} as const;

/** The thin progress track used for quiz position and best scores (its width springs in CSS). */
export const QuizMeter: React.FC<{ value: number; total: number; tone?: keyof typeof METER_TONES; className?: string }> = ({
  value,
  total,
  tone = 'green',
  className = ''
}) => {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <div className={`meter ${className}`} aria-hidden>
      <div className={`meter-fill ${METER_TONES[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

export type QuizOptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'muted';

const OPTION_ROW: Record<QuizOptionState, string> = {
  idle: 'bg-white/[0.05] text-slate-100 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] hover:bg-white/[0.085]',
  selected: 'bg-blue-500/[0.16] text-white shadow-[inset_0_0_0_1.5px_rgb(10_132_255/0.65)]',
  correct: 'bg-emerald-500/[0.14] text-white shadow-[inset_0_0_0_1.5px_rgb(48_209_88/0.6),0_10px_28px_-14px_rgb(48_209_88/0.6)]',
  wrong: 'bg-rose-500/[0.14] text-white shadow-[inset_0_0_0_1.5px_rgb(255_69_58/0.6)]',
  muted: 'bg-white/[0.03] text-slate-400 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04)]'
};

const OPTION_BADGE: Record<QuizOptionState, string> = {
  idle: 'bg-white/[0.09] text-slate-300',
  selected: 'bg-blue-500 text-white',
  correct: 'bg-emerald-400 text-black',
  wrong: 'bg-rose-500 text-white',
  muted: 'bg-white/[0.05] text-slate-500'
};

/**
 * A big tappable answer row. It presses in on pointer-down; the right answer rises with a gentle
 * pop and the wrong one shakes once (the way a wrong passcode does). The letter stays a <div> —
 * the Sales test finds options by it.
 */
export const QuizOption: React.FC<{
  letter: string;
  state: QuizOptionState;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ letter, state, onClick, disabled, children }) => {
  const animate =
    state === 'correct' ? { scale: [1, 1.022, 1], x: 0 } : state === 'wrong' ? { x: [0, -8, 7, -5, 3, 0], scale: 1 } : { scale: 1, x: 0 };
  const transition =
    state === 'correct'
      ? { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const }
      : state === 'wrong'
        ? { duration: 0.42, ease: 'easeOut' as const }
        : springs.snappy;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      animate={MOTION_DISABLED ? undefined : animate}
      transition={transition}
      className={`flex min-h-[56px] w-full items-center gap-3.5 rounded-[18px] px-4 py-3 text-left transition-[background-color,box-shadow,color,scale] duration-200 ease-out enabled:active:scale-[0.985] enabled:active:duration-75 disabled:cursor-default ${OPTION_ROW[state]}`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors duration-200 ${OPTION_BADGE[state]}`}>
        {letter}
      </div>
      <span className="flex-1 text-[15px] leading-snug">{children}</span>
      <AnimatePresence initial={false}>
        {(state === 'correct' || state === 'wrong') && (
          <motion.span
            key={state}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={springs.snappy}
            className={state === 'correct' ? 'text-emerald-300' : 'text-rose-300'}
            aria-hidden
          >
            {state === 'correct' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

/** The explanation that rises in under the answers once one is chosen. */
export const QuizFeedback: React.FC<{ show: boolean; correct: boolean; title?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }> = ({
  show,
  correct,
  title,
  children,
  footer
}) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        initial={MOTION_DISABLED ? false : { opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={springs.smooth}
        className={`rounded-[18px] p-4 ${correct ? 'bg-emerald-500/[0.1]' : 'bg-rose-500/[0.1]'}`}
      >
        {title ? (
          <>
            <p className={`flex items-center gap-2 text-[15px] font-semibold ${correct ? 'text-emerald-300' : 'text-rose-300'}`}>
              {correct ? <CheckCircle size={17} /> : <XCircle size={17} />}
              {title}
            </p>
            <div className="mt-1.5 text-[14px] leading-relaxed text-slate-300">{children}</div>
          </>
        ) : (
          <div className="flex gap-2.5 text-[14px] leading-relaxed text-slate-300">
            <span className={`mt-0.5 shrink-0 ${correct ? 'text-emerald-300' : 'text-rose-300'}`}>
              {correct ? <CheckCircle size={17} /> : <XCircle size={17} />}
            </span>
            <div>{children}</div>
          </div>
        )}
        {footer}
      </motion.div>
    )}
  </AnimatePresence>
);

/** Each new question slides in from the direction the quiz is moving (a fade under reduced motion). */
export const QuizStep: React.FC<{ stepKey: string | number; className?: string; children: React.ReactNode }> = ({ stepKey, className, children }) => (
  <motion.div
    key={stepKey}
    initial={MOTION_DISABLED ? false : { opacity: 0, x: 28 }}
    animate={{ opacity: 1, x: 0 }}
    transition={springs.smooth}
    className={className}
  >
    {children}
  </motion.div>
);

/** Activity-style ring for a finished run: green when it passed, orange-red when it didn't. */
export const QuizScoreRing: React.FC<{ score: number; total: number; passed: boolean; size?: number; centre?: React.ReactNode }> = ({
  score,
  total,
  passed,
  size = 104,
  centre
}) => (
  <ActivityRing
    progress={total > 0 ? score / total : 0}
    size={size}
    stroke={Math.round(size / 9)}
    colors={passed ? ['#30d158', '#64d2ff'] : ['#ff9f0a', '#ff453a']}
    className="rounded-full bg-[rgb(22_22_24/0.85)] shadow-[0_12px_30px_-12px_rgb(0_0_0/0.8)]"
  >
    {centre ?? (
      <>
        <span className="num text-[26px] font-bold leading-none text-white">{score}</span>
        <span className="num mt-0.5 text-[11px] text-slate-400">/ {total}</span>
      </>
    )}
  </ActivityRing>
);

/** A course phase (intro, quiz, results) arriving: it rises in; the old one simply gives way. */
export const PhasePanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div
    initial={MOTION_DISABLED ? false : { opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={springs.smooth}
    className={`surface p-5 sm:p-6 ${className}`}
  >
    {children}
  </motion.div>
);

/** A scene illustration of any shape, letterboxed over a soft blur of itself (nothing is cropped). */
export const SceneImage: React.FC<{ src: string; alt: string; aspect?: string }> = ({ src, alt, aspect = 'aspect-[16/10]' }) => (
  <div className={`relative overflow-hidden rounded-[20px] bg-black/40 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] ${aspect}`}>
    <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" loading="lazy" />
    <img src={src} alt={alt} className="relative h-full w-full object-contain" loading="lazy" />
  </div>
);

const BULLET_TONES = {
  green: 'bg-emerald-400 text-black',
  orange: 'bg-orange-400/20 text-orange-300',
  neutral: 'bg-white/10 text-slate-300'
} as const;

/** A calm bullet list: green check seals for rewards, soft dots for everything else. */
export const BulletList: React.FC<{ items: React.ReactNode[]; tone?: keyof typeof BULLET_TONES; className?: string }> = ({
  items,
  tone = 'neutral',
  className = 'mt-2.5'
}) => (
  <ul className={`space-y-2 ${className}`}>
    {items.map((item, i) => (
      <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-slate-300">
        <span aria-hidden className={`mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${BULLET_TONES[tone]}`}>
          {tone === 'green' ? <Check size={10} strokeWidth={3.6} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
