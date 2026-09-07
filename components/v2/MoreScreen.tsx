import { useI18n } from '../../i18n';
import React from 'react';
import { BookOpen, Heart, LayoutGrid, LineChart, Play, Save, Settings, TrendingUp, Trophy, Volume2, VolumeX, Briefcase } from 'lucide-react';

type MoreScreenProps = {
  onNavigate: (path: string) => void;
  onOpenSaveManager: () => void;
  onOpenRunCard?: () => void;
  onOpenQuests: () => void;
  onOpenGlossary: () => void;
  onOpenTutorials?: () => void;
  onOpenAccessibility: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  showNextMonthPreview: boolean;
  onToggleMonthPreview: (value: boolean) => void;
  autoplayEnabled: boolean;
  autoplayLabel: string;
  autoplaySpeed: number | null;
  autoplaySpeedOptions: number[];
  autoplaySpeedLabels: Record<number, string>;
  onToggleAutoplay: () => void;
  onSetAutoplaySpeed: (speed: number) => void;
};

const MoreScreen: React.FC<MoreScreenProps> = ({
  onNavigate,
  onOpenSaveManager,
  onOpenRunCard,
  onOpenQuests,
  onOpenGlossary,
  onOpenTutorials,
  onOpenAccessibility,
  onToggleSound,
  soundEnabled,
  showNextMonthPreview,
  onToggleMonthPreview,
  autoplayEnabled,
  autoplayLabel,
  autoplaySpeed,
  autoplaySpeedOptions,
  autoplaySpeedLabels,
  onToggleAutoplay,
  onSetAutoplaySpeed
}) => {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <section className="glass-panel px-4 py-4 space-y-2">
        <h2 className="text-lg font-semibold text-white">{t('shell.moreScreen.explore')}</h2>
        <div className="grid gap-2">
          <button type="button" onClick={() => onNavigate('/money')} className="glass-tile flex items-center gap-3 px-4 py-3">
            <TrendingUp size={18} className="text-emerald-300" />
            <span className="text-sm font-semibold text-white">{t('shell.moreScreen.money')}</span>
          </button>
          <button type="button" onClick={() => onNavigate('/career')} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Briefcase size={18} className="text-blue-300" />
            <span className="text-sm font-semibold text-white">{t('shell.moreScreen.career')}</span>
          </button>
          <button type="button" onClick={() => onNavigate('/learn')} className="glass-tile flex items-center gap-3 px-4 py-3">
            <BookOpen size={18} className="text-amber-300" />
            <span className="text-sm font-semibold text-white">{t('shell.moreScreen.learn')}</span>
          </button>
          <button type="button" onClick={() => onNavigate('/life')} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Heart size={18} className="text-rose-300" />
            <span className="text-sm font-semibold text-white">{t('shell.moreScreen.life')}</span>
          </button>
        </div>
      </section>

      <section className="glass-panel px-4 py-4 space-y-2">
        <h3 className="text-sm font-semibold text-white">{t('shell.moreScreen.utilities')}</h3>
        <div className="grid gap-2">
          <button type="button" onClick={onOpenSaveManager} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Save size={18} className="text-cyan-300" />
            <span className="text-sm font-semibold text-white">{t('shell.moreScreen.save_load')}</span>
          </button>
          {onOpenRunCard && (
            <button type="button" onClick={onOpenRunCard} className="glass-tile flex items-center gap-3 px-4 py-3">
              <LineChart size={18} className="text-violet-300" />
              <span className="text-sm font-semibold text-white">{t('shell.moreScreen.run_summary_card')}</span>
            </button>
          )}
          <button type="button" onClick={onOpenQuests} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Trophy size={18} className="text-amber-300" />
            <span className="text-sm font-semibold text-white">{t('shell.moreScreen.quests')}</span>
          </button>
          <button type="button" onClick={onOpenGlossary} className="glass-tile flex items-center gap-3 px-4 py-3">
            <LayoutGrid size={18} className="text-emerald-300" />
            <span className="text-sm font-semibold text-white">{t('shell.moreScreen.glossary')}</span>
          </button>
          {onOpenTutorials && (
            <button type="button" onClick={onOpenTutorials} className="glass-tile flex items-center gap-3 px-4 py-3">
              <Play size={18} className="text-sky-300" />
              <span className="text-sm font-semibold text-white">{t('shell.moreScreen.tutorial_videos')}</span>
            </button>
          )}
          <button type="button" onClick={onOpenAccessibility} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Settings size={18} className="text-purple-300" />
            <span className="text-sm font-semibold text-white">{t('shell.moreScreen.accessibility')}</span>
          </button>
        </div>
      </section>

      <section className="glass-panel px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">{t('shell.moreScreen.autoplay')}</span>
          <button
            type="button"
            onClick={onToggleAutoplay}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
              autoplayEnabled
                ? 'border-amber-400/70 bg-amber-400/10 text-amber-200'
                : 'border-slate-700/70 text-slate-200'
            }`}
          >
            {autoplayLabel}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {autoplaySpeedOptions.map((speed) => {
            const label = autoplaySpeedLabels[speed] || '1x';
            const isActive = autoplaySpeed === speed;
            return (
              <button
                key={speed}
                type="button"
                onClick={() => onSetAutoplaySpeed(speed)}
                disabled={!autoplayEnabled}
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${
                  !autoplayEnabled
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : isActive
                      ? 'border-amber-400/70 bg-amber-400/10 text-amber-200'
                      : 'border-slate-700/70 text-slate-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">{t('shell.moreScreen.sound')}</span>
          <button
            type="button"
            onClick={onToggleSound}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs text-slate-200"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {soundEnabled ? t('shell.moreScreen.mute') : t('shell.moreScreen.unmute')}
          </button>
        </div>
        <label className="flex items-center justify-between text-sm text-slate-300">
          <span>{t('shell.moreScreen.show_month_preview')}</span>
          <input
            type="checkbox"
            className="rounded border-slate-600 bg-slate-900"
            checked={showNextMonthPreview}
            onChange={(e) => onToggleMonthPreview(e.target.checked)}
          />
        </label>
      </section>
    </div>
  );
};

export default MoreScreen;
