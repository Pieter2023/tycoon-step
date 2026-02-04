import React from 'react';
import { Ellipsis, LayoutGrid, Sparkles, User, MoreHorizontal, Play } from 'lucide-react';

type MobileShellProps = {
  playerName: string;
  year: number;
  month: number;
  avatarColor?: string;
  avatarImage?: string;
  avatarEmoji?: string;
  perkLabel?: string;
  perkDescription?: string;
  aiRiskLabel?: string;
  aiRiskTone?: string;
  isProcessing: boolean;
  nextMonthDisabled: boolean;
  onNextMonth: () => void;
  onOpenOverflow: () => void;
  activeTab: 'dashboard' | 'actions' | 'profile' | 'more';
  onSelectTab: (tab: 'dashboard' | 'actions' | 'profile' | 'more') => void;
  children: React.ReactNode;
};

const MobileShell: React.FC<MobileShellProps> = ({
  playerName,
  year,
  month,
  avatarColor,
  avatarImage,
  avatarEmoji,
  perkLabel,
  perkDescription,
  aiRiskLabel,
  aiRiskTone,
  isProcessing,
  nextMonthDisabled,
  onNextMonth,
  onOpenOverflow,
  activeTab,
  onSelectTab,
  children
}) => {
  return (
    <div className="md:hidden min-h-screen text-white pb-24">
      <header className="sticky top-0 z-40 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-4 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-2xl overflow-hidden border border-white/10`}>
            {avatarImage ? (
              <img src={avatarImage} alt={playerName} className="h-full w-full object-cover" />
            ) : (
              avatarEmoji || '👤'
            )}
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">{playerName}</p>
            <p className="text-xs text-slate-400">Year {year} • Month {month}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {perkLabel && (
                <span
                  className="ds-badge ds-badge--neutral !text-[10px]"
                  title={perkDescription}
                >
                  {perkLabel}
                </span>
              )}
              {aiRiskLabel && (
                <span className={`ds-badge !text-[10px] ${aiRiskTone || 'ds-badge--neutral'}`}>
                  AI Risk: {aiRiskLabel}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={nextMonthDisabled}
            className="flex items-center gap-2 rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.35)] disabled:opacity-60"
            title="Next Month (N)"
          >
            {isProcessing ? <Play size={16} className="animate-spin" /> : <Play size={16} />}
            Next Month
          </button>
          <button
            type="button"
            onClick={onOpenOverflow}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/60"
            aria-label="More options"
          >
            <Ellipsis size={18} />
          </button>
        </div>
      </header>

      <main className="px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/70 bg-slate-950/80 backdrop-blur-xl px-3 py-2">
        <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold text-slate-400">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
            { id: 'actions', label: 'Actions', icon: Sparkles },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'more', label: 'More', icon: MoreHorizontal }
          ] as const).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition ${
                  isActive ? 'bg-white/10 text-white border border-white/10' : 'border border-transparent'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileShell;
