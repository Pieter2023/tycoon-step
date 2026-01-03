import React from 'react';
import { FastForward, Pause, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui';

type PageHeaderProps = {
  playerName: string;
  year: number;
  month: number;
  avatarColor?: string;
  avatarImage?: string;
  avatarEmoji?: string;
  isProcessing: boolean;
  nextMonthDisabled: boolean;
  onNextMonth: () => void;
  autoplayEnabled: boolean;
  autoplayLabel: string;
  autoplayTooltip: string;
  autoplaySpeed: number | null;
  autoplaySpeedOptions: number[];
  autoplaySpeedLabels: Record<number, string>;
  onToggleAutoplay: () => void;
  onSetAutoplaySpeed: (speed: number) => void;
};

const PageHeader: React.FC<PageHeaderProps> = ({
  playerName,
  year,
  month,
  avatarColor,
  avatarImage,
  avatarEmoji,
  isProcessing,
  nextMonthDisabled,
  onNextMonth,
  autoplayEnabled,
  autoplayLabel,
  autoplayTooltip,
  autoplaySpeed,
  autoplaySpeedOptions,
  autoplaySpeedLabels,
  onToggleAutoplay,
  onSetAutoplaySpeed
}) => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-2xl overflow-hidden`}>
          {avatarImage ? (
            <img src={avatarImage} alt={playerName} className="h-full w-full object-cover" />
          ) : (
            avatarEmoji || '👤'
          )}
        </div>
        <div>
          <p className="text-sm text-slate-400">Player</p>
          <h2 className="text-lg font-semibold text-white">{playerName}</h2>
          <p className="text-xs text-slate-500">Year {year} • Month {month}</p>
        </div>
      </div>

      <div className="flex flex-1 justify-center">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="primary"
            size="lg"
            onClick={onNextMonth}
            disabled={nextMonthDisabled}
            className="px-6"
            title="Next Month (N)"
          >
            {isProcessing ? <Pause size={18} className="animate-spin" /> : <Play size={18} />}
            <span>Next Month</span>
          </Button>
        </motion.div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleAutoplay}
          title={`${autoplayTooltip} • Shortcut: T`}
          aria-label="Autoplay toggle"
          aria-pressed={autoplayEnabled}
          className={autoplayEnabled ? 'border-amber-500/40 text-amber-200 bg-amber-600/20' : ''}
        >
          {autoplayEnabled ? <FastForward size={16} /> : <Pause size={16} />}
          <span className="text-sm font-semibold">Autoplay</span>
          <span className={`text-xs font-semibold ${autoplayEnabled ? 'text-amber-200' : 'text-slate-400'}`}>
            {autoplayLabel}
          </span>
        </Button>
        <div className="flex flex-wrap gap-1">
          {autoplaySpeedOptions.map((speed) => {
            const label = autoplaySpeedLabels[speed] || '1x';
            const isActive = autoplaySpeed === speed;
            return (
              <button
                key={speed}
                onClick={() => onSetAutoplaySpeed(speed)}
                disabled={!autoplayEnabled}
                aria-pressed={isActive}
                className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  !autoplayEnabled
                    ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    : isActive
                      ? 'bg-amber-600/30 border-amber-500/50 text-amber-100'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
