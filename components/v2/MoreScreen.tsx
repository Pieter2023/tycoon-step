import React from 'react';
import { BookOpen, Heart, LayoutGrid, Save, Settings, TrendingUp, Trophy, Volume2, VolumeX, Briefcase } from 'lucide-react';

type MoreScreenProps = {
  onNavigate: (path: string) => void;
  onOpenSaveManager: () => void;
  onOpenQuests: () => void;
  onOpenGlossary: () => void;
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
  onOpenQuests,
  onOpenGlossary,
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
  return (
    <div className="space-y-5">
      <section className="glass-panel px-4 py-4 space-y-2">
        <h2 className="text-lg font-semibold text-white">Explore</h2>
        <div className="grid gap-2">
          <button type="button" onClick={() => onNavigate('/money')} className="glass-tile flex items-center gap-3 px-4 py-3">
            <TrendingUp size={18} className="text-emerald-300" />
            <span className="text-sm font-semibold text-white">Money</span>
          </button>
          <button type="button" onClick={() => onNavigate('/career')} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Briefcase size={18} className="text-blue-300" />
            <span className="text-sm font-semibold text-white">Career</span>
          </button>
          <button type="button" onClick={() => onNavigate('/learn')} className="glass-tile flex items-center gap-3 px-4 py-3">
            <BookOpen size={18} className="text-amber-300" />
            <span className="text-sm font-semibold text-white">Learn</span>
          </button>
          <button type="button" onClick={() => onNavigate('/life')} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Heart size={18} className="text-rose-300" />
            <span className="text-sm font-semibold text-white">Life</span>
          </button>
        </div>
      </section>

      <section className="glass-panel px-4 py-4 space-y-2">
        <h3 className="text-sm font-semibold text-white">Utilities</h3>
        <div className="grid gap-2">
          <button type="button" onClick={onOpenSaveManager} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Save size={18} className="text-cyan-300" />
            <span className="text-sm font-semibold text-white">Save / Load</span>
          </button>
          <button type="button" onClick={onOpenQuests} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Trophy size={18} className="text-amber-300" />
            <span className="text-sm font-semibold text-white">Quests</span>
          </button>
          <button type="button" onClick={onOpenGlossary} className="glass-tile flex items-center gap-3 px-4 py-3">
            <LayoutGrid size={18} className="text-emerald-300" />
            <span className="text-sm font-semibold text-white">Glossary</span>
          </button>
          <button type="button" onClick={onOpenAccessibility} className="glass-tile flex items-center gap-3 px-4 py-3">
            <Settings size={18} className="text-purple-300" />
            <span className="text-sm font-semibold text-white">Accessibility</span>
          </button>
        </div>
      </section>

      <section className="glass-panel px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Autoplay</span>
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
          <span className="text-sm text-slate-300">Sound</span>
          <button
            type="button"
            onClick={onToggleSound}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs text-slate-200"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {soundEnabled ? 'Mute' : 'Unmute'}
          </button>
        </div>
        <label className="flex items-center justify-between text-sm text-slate-300">
          <span>Show month preview</span>
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
