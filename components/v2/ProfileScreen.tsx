import { useI18n } from '../../i18n';
import React from 'react';
import { Briefcase, GraduationCap, HeartPulse, Sparkles } from 'lucide-react';
import { calculateEffectiveMonthlySalary } from '../../services/gameLogic';
import { GameState } from '../../types';
import SignalsStack from './SignalsStack';

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

const StatRow: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone }) => {
  const { t } = useI18n();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{clamped}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-800/70">
        <div className={`h-2 rounded-full ${tone || 'bg-emerald-400'}`} style={{ width: `${clamped}%` }} />
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

  return (
    <div className="space-y-5">
      <section className="glass-panel px-4 py-4">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-2xl overflow-hidden border border-white/10`}>
            {avatarImage ? (
              <img src={avatarImage} alt={playerName} className="h-full w-full object-cover" />
            ) : (
              avatarEmoji || '👤'
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{playerName}</p>
            <p className="text-xs text-slate-400">{jobTitle}</p>
            <p className="text-xs text-emerald-200">{formatMoney(salary)} / mo</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-700/70 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
              <Sparkles size={12} className="text-amber-300" /> {careerPath}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel px-4 py-4 space-y-3">
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <HeartPulse size={16} className="text-rose-300" />{t('shell.profileScreen.core_stats')}
        </div>
        <div className="space-y-3">
          <StatRow label={t('shell.profileScreen.energy')} value={stats.energy ?? 0} tone="bg-cyan-400" />
          <StatRow label={t('shell.profileScreen.stress')} value={stats.stress ?? 0} tone="bg-rose-400" />
          <StatRow label={t('shell.profileScreen.happiness')} value={stats.happiness ?? 0} tone="bg-emerald-400" />
          <StatRow label={t('shell.profileScreen.health')} value={stats.health ?? 0} tone="bg-amber-400" />
        </div>
      </section>

      <section className="glass-panel px-4 py-4">
        <SignalsStack
          gameState={gameState}
          creditScore={creditScore}
          creditTier={creditTier}
          getCreditTierColor={getCreditTierColor}
          aiImpact={aiImpact}
          careerPath={careerPath}
          getAIRiskColor={getAIRiskColor}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigate('/career')}
          className="glass-tile flex items-center justify-between px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-white">{t('shell.profileScreen.career')}</p>
            <p className="text-xs text-slate-400">{t('shell.profileScreen.promotions_milestones')}</p>
          </div>
          <Briefcase size={18} className="text-emerald-300" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/learn')}
          className="glass-tile flex items-center justify-between px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-white">{t('shell.profileScreen.learning')}</p>
            <p className="text-xs text-slate-400">{t('shell.profileScreen.certifications_rewards')}</p>
          </div>
          <GraduationCap size={18} className="text-amber-300" />
        </button>
      </section>
    </div>
  );
};

export default ProfileScreen;
