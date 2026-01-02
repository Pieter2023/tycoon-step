import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Zap } from 'lucide-react';
import { GameState } from '../types';
import Modal from './Modal';
import { SALES_ACCELERATOR_QUIZ, SALES_ACCELERATOR_QUIZ_META } from '../data/salesAcceleratorQuiz';
import { useI18n } from '../i18n';

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
    setRewardGranted(shouldGrantReward);
    setAttemptsAfterRun(passed || courseState.certified ? attemptsLeft : Math.max(0, attemptsLeft - 1));
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
      if (!passed && !current.certified) {
        nextCourse.failedAttempts = current.failedAttempts + 1;
      }

      let nextState = { ...prev, salesAcceleratorCourse: nextCourse };
      if (passed && !current.rewardClaimed) {
        const reward = SALES_ACCELERATOR_QUIZ_META.rewards.onPass;
        nextState = {
          ...nextState,
          cash: nextState.cash + reward.cash,
          stats: {
            ...nextState.stats,
            financialIQ: clampStat((nextState.stats?.financialIQ ?? 0) + reward.fiq),
            happiness: clampStat((nextState.stats?.happiness ?? 0) + reward.happiness)
          }
        };
      } else if (!passed) {
        const penalty = SALES_ACCELERATOR_QUIZ_META.rules.onFail;
        if (penalty.cashPenalty) {
          nextState = { ...nextState, cash: Math.max(0, nextState.cash - penalty.cashPenalty) };
        }
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

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="text-amber-400" size={18} />
            {quizTitle}
          </h3>
          <p className="text-slate-400 text-sm max-w-2xl">{quizDescription}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {courseState.certified ? (
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle size={14} /> {t('salesQuiz.ui.certified')}
            </span>
          ) : (
            <span className="text-xs text-slate-400">{t('salesQuiz.ui.attemptsLeft', { count: attemptsLeft })}</span>
          )}
          <button
            onClick={openQuiz}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold"
          >
            {quizEntryLabel}
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
        {quizQuickTips.map((tip) => (
          <div key={tip} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
            {tip}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-slate-500">
        {t('salesQuiz.ui.bestScore', { score: courseState.bestScore, total: quizQuestions.length })}
      </div>
      {!canStartQuiz && (
        <p className="mt-2 text-xs text-rose-300">
          {t('salesQuiz.ui.attemptsUsed')}
        </p>
      )}

      {showSalesQuiz && (
        <Modal
          isOpen={showSalesQuiz}
          onClose={closeQuiz}
          ariaLabel="Sales Accelerator quiz"
          closeOnOverlayClick
          closeOnEsc
          contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full"
        >
          {quizPhase === 'intro' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{t('salesQuiz.ui.certificationLabel')}</p>
                  <h2 className="text-xl font-bold text-white">{quizTitle}</h2>
                </div>
                {courseState.certified && (
                  <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle size={14} /> {t('salesQuiz.ui.certified')}
                  </span>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  {showCoverImage ? (
                    <img
                      src={SALES_ACCELERATOR_QUIZ_META.ui.coverImage.src}
                      alt={SALES_ACCELERATOR_QUIZ_META.ui.coverImage.alt}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-40 rounded-lg bg-slate-900/70 border border-slate-700 flex items-center justify-center text-slate-500 text-sm">
                      {t('salesQuiz.ui.coverPlaceholder')}
                    </div>
                  )}
                  <p className="text-sm text-slate-300 mt-3">{quizDescription}</p>
                  <div className="mt-3 text-xs text-slate-400">
                    {quizRules.passCondition === 'allCorrect'
                      ? t('salesQuiz.ui.passingAllCorrect')
                      : t('salesQuiz.ui.passingPercentage', { count: quizRules.passPercentage })}
                  </div>
                  {!courseState.certified && (
                    <div className="mt-1 text-xs text-slate-500">{t('salesQuiz.ui.attemptsLeft', { count: attemptsLeft })}</div>
                  )}
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-semibold text-white mb-2">{t('salesQuiz.ui.quickTips')}</p>
                  <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                    {quizQuickTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                  <div className="mt-4 text-xs text-slate-400">
                    {t('salesQuiz.ui.questionCount', { count: quizRules.questionCount })}
                  </div>
                </div>
              </div>
              {!canStartQuiz && !courseState.certified && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {t('salesQuiz.ui.noAttempts')}
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={closeQuiz}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  {t('salesQuiz.ui.close')}
                </button>
                <button
                  onClick={startQuiz}
                  disabled={!canStartQuiz}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold"
                >
                  {courseState.certified ? t('salesQuiz.ui.practiceMode') : t('salesQuiz.ui.startCertification')}
                </button>
              </div>
            </div>
          )}

          {quizPhase === 'quiz' && currentQuestion && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">{t('salesQuiz.ui.questionLabel', { index: quizIndex + 1, total: quizQuestions.length })}</p>
                  <p className="text-sm text-slate-300">{t('salesQuiz.ui.scoreLabel', { score: scoreSoFar, total: quizQuestions.length })}</p>
                </div>
                <div className="w-40 bg-slate-900/60 border border-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  {showQuestionImage ? (
                    <img
                      src={currentQuestion.media.image.src}
                      alt={currentQuestion.media.image.alt}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="h-40 rounded-lg bg-slate-900/70 border border-slate-700 flex items-center justify-center text-slate-500 text-sm mb-3">
                      {t('salesQuiz.ui.questionPlaceholder')}
                    </div>
                  )}
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {resolveText(currentQuestion.i18n?.promptKey, currentQuestion.prompt)}
                  </p>
                </div>

                <div className="space-y-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrect = showFeedback && option.id === currentCorrectId;
                    const isWrong = showFeedback && isSelected && option.id !== currentCorrectId;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(option.id)}
                        disabled={showFeedback}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          isCorrect
                            ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-100'
                            : isWrong
                              ? 'bg-rose-600/15 border-rose-500/40 text-rose-100'
                              : isSelected
                                ? 'bg-slate-700/60 border-slate-500 text-white'
                                : 'bg-slate-900/50 border-slate-700 text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-slate-800 text-slate-300">
                            {option.id.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">
                              {getOptionText(currentQuestion, option.id, option.text)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {showFeedback && (
                    <div className={`rounded-xl border p-3 ${
                      selectedOption === currentCorrectId ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-rose-600/10 border-rose-500/30'
                    }`}>
                      <p className="text-sm font-semibold text-white mb-1">
                        {selectedOption === currentCorrectId ? t('salesQuiz.ui.correct') : t('salesQuiz.ui.incorrect')}
                      </p>
                      <p className="text-xs text-slate-300">
                        {(() => {
                          const correctOption = currentQuestion.options.find(opt => opt.id === currentCorrectId);
                          const feedbackKey = (correctOption as { feedbackKey?: string } | undefined)?.feedbackKey;
                          const feedbackText = (correctOption as { feedback?: string } | undefined)?.feedback;
                          return resolveText(
                            feedbackKey,
                            feedbackText || resolveText(currentQuestion.i18n?.explanationKey, currentQuestion.explanation)
                          );
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={closeQuiz}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  {t('salesQuiz.ui.exit')}
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={!showFeedback}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold"
                >
                  {quizIndex >= quizQuestions.length - 1 ? t('salesQuiz.ui.finish') : t('salesQuiz.ui.next')}
                </button>
              </div>
            </div>
          )}

          {quizPhase === 'results' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{t('salesQuiz.ui.resultsLabel')}</p>
                  <h2 className="text-xl font-bold text-white">
                    {quizPassed ? t('salesQuiz.ui.resultsPassed') : t('salesQuiz.ui.resultsFailed')}
                  </h2>
                </div>
                <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
                  quizPassed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {quizPassed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {t('salesQuiz.ui.scoreLabel', { score: finalScore ?? 0, total: quizQuestions.length })}
                </div>
              </div>

              {quizPassed && rewardGranted && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  {t('salesQuiz.ui.rewardEarned', {
                    cash: formatMoney(SALES_ACCELERATOR_QUIZ_META.rewards.onPass.cash),
                    fiq: SALES_ACCELERATOR_QUIZ_META.rewards.onPass.fiq,
                    happiness: SALES_ACCELERATOR_QUIZ_META.rewards.onPass.happiness
                  })}
                </div>
              )}

              {!quizPassed && !courseState.certified && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
                  {t('salesQuiz.ui.attemptsLeft', { count: attemptsAfterRun ?? Math.max(0, attemptsLeft - 1) })}
                </div>
              )}

              {quizRules.allowReviewAtEnd && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm font-semibold text-white mb-2">{t('salesQuiz.ui.reviewTitle')}</p>
                  <div className="space-y-3">
                    {quizQuestions.map((question) => {
                      const correctId = getCorrectOptionId(question);
                      const chosen = quizAnswers[question.id];
                      const correctOption = question.options.find(opt => opt.id === correctId);
                      const correctText = correctOption
                        ? getOptionText(question, correctId, correctOption.text)
                        : '';
                      const chosenOption = question.options.find(opt => opt.id === chosen);
                      const chosenText = chosenOption
                        ? getOptionText(question, chosenOption.id, chosenOption.text)
                        : t('salesQuiz.ui.noAnswer');
                      const isCorrect = chosen === correctId;
                      return (
                        <div key={question.id} className="text-xs text-slate-300">
                          <p className="text-slate-200 font-semibold">
                            {resolveText(question.i18n?.promptKey, question.prompt)}
                          </p>
                          <p className={isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                            {t('salesQuiz.ui.yourAnswer', { answer: chosenText })}
                          </p>
                          {!isCorrect && (
                            <p className="text-slate-400">{t('salesQuiz.ui.correctAnswer', { answer: correctText })}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={closeQuiz}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  {t('salesQuiz.ui.close')}
                </button>
                <button
                  onClick={startQuiz}
                  disabled={!canStartQuiz}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold"
                >
                  {courseState.certified ? t('salesQuiz.ui.practiceAgain') : t('salesQuiz.ui.retry')}
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
