import { useI18n } from '../../i18n';
import React from 'react';
import { motion } from 'framer-motion';
import { BriefcaseBusiness, ChevronRight, GraduationCap, Sparkles } from 'lucide-react';
import { calculateEffectiveMonthlySalary } from '../../services/gameLogic';
import { GameState } from '../../types';
import SignalsStack from './SignalsStack';
import AnimatedNumber from '../ui/AnimatedNumber';
import { MOTION_DISABLED, riseIn, springs, stagger } from '../ui/motion';
import { VitalGlyph, VitalMeter, formatStat, type VitalKey } from '../tabs/LifestyleTab';

type ProfileScreenProps = {
  playerName: string;
  avatarColor?: string;
  avatarImage?: string;
  avatarEmoji?: string;
  gameState: GameState;
  creditScore: number;
  creditTier: string;
  getCreditTierColor: (tier: string) => string;
  aiImpact: { automationRisk?: string } | undefined;
  careerPath: string;
  getAIRiskColor: (risk: string) => string;
  formatMoney: (value: number) => string;
  onNavigate: (path: string) => void;
};

/** A grouped-list row: glyph, name, value, and a meter that springs to it. */
const StatRow: React.FC<{ label: string; value: number; tone: VitalKey }> = ({ label, value, tone }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="list-row">
      <VitalGlyph tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15px] font-medium tracking-[-0.01em] text-white">{label}</span>
          <span className="num text-[15px] font-semibold text-slate-200">{formatStat(clamped)}</span>
        </div>
        <VitalMeter value={clamped} tone={tone} className="mt-1.5" />
      </div>
    </div>
  );
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  playerName,
  avatarColor,
  avatarImage,
  avatarEmoji,
  gameState,
  creditScore,
  creditTier,
  getCreditTierColor,
  aiImpact,
  careerPath,
  getAIRiskColor,
  formatMoney,
  onNavigate
}) => {
  const { t } = useI18n();
  const jobTitle = gameState.playerJob?.title || gameState.career?.title || t('shell.profileScreen.career_path');
  const salary = calculateEffectiveMonthlySalary(gameState);
  const stats = gameState.stats || {
    happiness: 0,
    health: 0,
    energy: 0,
    stress: 0
  };
  const enter = MOTION_DISABLED ? { initial: false as const, animate: 'show' } : { initial: 'hidden', animate: 'show' };

  return (
    <motion.div className="space-y-7" variants={stagger(0.05)} {...enter}>
      {/* Apple ID style header */}
      <motion.section variants={riseIn} className="flex flex-col items-center px-4 pt-3 text-center">
        <motion.div
          initial={MOTION_DISABLED ? false : { scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.smooth}
          className={`flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${avatarColor || 'from-slate-500 to-slate-600'} text-[46px] shadow-[0_16px_36px_-12px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.18)] ring-1 ring-white/10`}
        >
          {avatarImage ? (
            <img src={avatarImage} alt={playerName} className="h-full w-full object-cover" />
          ) : (
            avatarEmoji || '👤'
          )}
        </motion.div>
        <p className="t-title-2 mt-3.5 text-white">{playerName}</p>
        <p className="mt-0.5 text-[15px] text-slate-400">{jobTitle}</p>
        <p className="mt-1 text-[15px] font-semibold text-emerald-300">
          <AnimatedNumber value={salary} format={formatMoney} /> / mo
        </p>
        <span className="chip mt-3 text-slate-200">
          <Sparkles size={13} className="text-amber-300" aria-hidden /> {careerPath}
        </span>
      </motion.section>

      <motion.section variants={riseIn}>
        <h3 className="mb-2 px-4 text-[13px] font-semibold text-slate-400">{t('shell.profileScreen.core_stats')}</h3>
        <div className="list-group list-group--icons">
          {/* Phase 1 slice 5: energy and stress lead (they set this month's actions); the rest sit one tap away. */}
          <StatRow label={t('shell.profileScreen.energy')} value={stats.energy ?? 0} tone="energy" />
          <StatRow label={t('shell.profileScreen.stress')} value={stats.stress ?? 0} tone="stress" />
          <details className="group">
            <summary className="list-row relative cursor-pointer list-none text-[15px] font-medium text-[#0a84ff] before:absolute before:left-4 before:right-0 before:top-0 before:h-px before:origin-top before:scale-y-50 before:bg-[var(--separator)] before:content-[''] hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{t('shell.profileScreen.more_about_you')}</span>
              <ChevronRight size={16} strokeWidth={2.4} aria-hidden className="text-slate-500 transition-transform duration-[530ms] ease-spring group-open:rotate-90" />
            </summary>
            <StatRow label={t('shell.profileScreen.happiness')} value={stats.happiness ?? 0} tone="happiness" />
            <StatRow label={t('shell.profileScreen.health')} value={stats.health ?? 0} tone="health" />
          </details>
        </div>
      </motion.section>

      <motion.section variants={riseIn} className="[&_h3]:px-1">
        <SignalsStack
          gameState={gameState}
          creditScore={creditScore}
          creditTier={creditTier}
          getCreditTierColor={getCreditTierColor}
          aiImpact={aiImpact}
          careerPath={careerPath}
          getAIRiskColor={getAIRiskColor}
        />
      </motion.section>

      <motion.section variants={riseIn}>
        <div className="list-group list-group--icons">
          <button type="button" onClick={() => onNavigate('/career')} className="list-row w-full text-left">
            <span aria-hidden className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[8px] bg-[#ff9f0a] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22)]">
              <BriefcaseBusiness size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium tracking-[-0.01em] text-white">{t('shell.profileScreen.career')}</span>
              <span className="block text-[13px] text-slate-400">{t('shell.profileScreen.promotions_milestones')}</span>
            </span>
            <ChevronRight size={16} className="text-slate-600" aria-hidden />
          </button>
          <button type="button" onClick={() => onNavigate('/learn')} className="list-row w-full text-left">
            <span aria-hidden className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[8px] bg-[#bf5af2] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22)]">
              <GraduationCap size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium tracking-[-0.01em] text-white">{t('shell.profileScreen.learning')}</span>
              <span className="block text-[13px] text-slate-400">{t('shell.profileScreen.certifications_rewards')}</span>
            </span>
            <ChevronRight size={16} className="text-slate-600" aria-hidden />
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default ProfileScreen;
