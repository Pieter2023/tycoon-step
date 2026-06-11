import React from 'react';
import { BriefcaseBusiness, Ellipsis, GraduationCap, HeartPulse, LayoutGrid, Play, WalletCards } from 'lucide-react';

type MobilePath = '/play' | '/money' | '/career' | '/learn' | '/life';

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
  activePath: MobilePath;
  onNavigatePath: (path: MobilePath) => void;
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
  activePath,
  onNavigatePath,
  activeTab,
  onSelectTab,
  children
}) => {
  const navItems: Array<{ path: MobilePath; label: string; icon: React.ElementType }> = [
    { path: '/play', label: 'Play', icon: LayoutGrid },
    { path: '/money', label: 'Money', icon: WalletCards },
    { path: '/career', label: 'Career', icon: BriefcaseBusiness },
    { path: '/learn', label: 'Learn', icon: GraduationCap },
    { path: '/life', label: 'Life', icon: HeartPulse }
  ];

  return (
    <div className="min-h-screen pb-24 text-white md:hidden">
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.6rem)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${avatarColor || 'from-slate-500 to-slate-600'} text-xl`}>
            {avatarImage ? (
              <img src={avatarImage} alt={playerName} className="h-full w-full object-cover" />
            ) : (
              avatarEmoji || '👤'
            )}
          </div>
          <div className="min-w-0 flex-1">
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
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.28)] disabled:opacity-60"
            title="Next Month (N)"
          >
            {isProcessing ? <Play size={16} className="animate-spin" /> : <Play size={16} />}
            <span className="hidden min-[390px]:inline">Next</span>
          </button>
          <button
            type="button"
            onClick={onOpenOverflow}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70"
            aria-label="More options"
          >
            <Ellipsis size={18} />
          </button>
        </div>
      </header>

      <main className="px-3 py-4 sm:px-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/70 bg-slate-950/90 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-slate-500">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  onNavigatePath(item.path);
                  if (item.path === '/play') onSelectTab(activeTab === 'more' ? 'dashboard' : activeTab);
                }}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 transition ${
                  isActive ? 'border-emerald-400/30 bg-emerald-400 text-slate-950' : 'border-transparent text-slate-500'
                }`}
              >
                <Icon size={16} />
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
