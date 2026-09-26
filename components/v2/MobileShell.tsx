import { useI18n } from '../../i18n';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BriefcaseBusiness, Ellipsis, GraduationCap, HeartPulse, LayoutGrid, Play, WalletCards } from 'lucide-react';
import { MOTION_DISABLED, springs } from '../ui/motion';
import { RollingDate } from './DesktopShell';

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
  const { t } = useI18n();
  const navItems: Array<{ path: MobilePath; label: string; icon: React.ElementType; tint: string }> = [
    { path: '/play', label: t('shell.mobileShell.play'), icon: LayoutGrid, tint: 'text-[#30d158]' },
    { path: '/money', label: t('shell.mobileShell.money'), icon: WalletCards, tint: 'text-[#0a84ff]' },
    { path: '/career', label: t('shell.mobileShell.career'), icon: BriefcaseBusiness, tint: 'text-[#ff9f0a]' },
    { path: '/learn', label: t('shell.mobileShell.learn'), icon: GraduationCap, tint: 'text-[#bf5af2]' },
    { path: '/life', label: t('shell.mobileShell.life'), icon: HeartPulse, tint: 'text-[#ff375f]' }
  ];

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pageKey = `${activePath}:${activePath === '/play' ? activeTab : ''}`;

  return (
    <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+6.5rem)] text-white md:hidden">
      <header
        className={`sticky top-0 z-40 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.6rem)] transition-shadow duration-300 mat-bar ${
          scrolled ? 'shadow-[0_1px_0_rgb(255_255_255/0.08)]' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Tap your avatar for your profile, as in iOS apps. */}
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            aria-label={t('shell.mobileShell.open_profile')}
            aria-pressed={activePath === '/play' && activeTab === 'profile'}
            className={`pressable flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${avatarColor || 'from-slate-500 to-slate-600'} text-lg transition-shadow ${
              activePath === '/play' && activeTab === 'profile' ? 'shadow-[0_0_0_2px_#30d158]' : 'shadow-[0_0_0_1.5px_rgb(255_255_255/0.12)]'
            }`}
          >
            {avatarImage ? (
              <img src={avatarImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>{avatarEmoji || '👤'}</span>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-5 tracking-[-0.012em] text-white">{playerName}</p>
            <RollingDate text={t('shell.mobileShell.year_month', { year, month })} className="num text-[12px] leading-4 text-slate-400" />
            {(perkLabel || aiRiskLabel) && (
              <div className="mt-1 flex items-center gap-1.5 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(90deg,#000_85%,transparent)]">
                {perkLabel && (
                  <span className="ds-badge ds-badge--neutral shrink-0 !text-[10px]" title={perkDescription}>
                    {perkLabel}
                  </span>
                )}
                {aiRiskLabel && (
                  <span className={`ds-badge shrink-0 !text-[10px] ${aiRiskTone || 'ds-badge--neutral'}`}>
                    {t('shell.mobileShell.ai_risk', { level: aiRiskLabel })}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={nextMonthDisabled}
            className="btn-primary flex h-10 shrink-0 items-center gap-1.5 px-4 text-[14px]"
            title={t('shell.mobileShell.next_month_shortcut')}
          >
            <Play size={15} fill="currentColor" className={isProcessing ? 'animate-pulse' : ''} />
            <span className="hidden min-[390px]:inline">{t('shell.mobileShell.next')}</span>
          </button>
          <button
            type="button"
            onClick={onOpenOverflow}
            className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgb(118_118_128/0.24)] text-slate-100"
            aria-label={t('shell.mobileShell.more_options')}
          >
            <Ellipsis size={19} />
          </button>
        </div>
      </header>

      <main className="px-3 py-4 sm:px-4">
        {MOTION_DISABLED ? (
          children
        ) : (
          <motion.div key={pageKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}>
            {children}
          </motion.div>
        )}
      </main>

      {/* Floating tab bar: a glass capsule over the content, with a selection blob that springs
          between tabs (a little bounce — the finger threw it there). */}
      <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.6rem)] z-40">
        <div className="mat-chrome grid grid-cols-5 gap-0.5 rounded-[28px] border border-white/[0.1] p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_18px_40px_-10px_rgb(0_0_0/0.8)]">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  onNavigatePath(item.path);
                  // Play always lands on the dashboard (the profile is one tap away on the avatar).
                  if (item.path === '/play') onSelectTab('dashboard');
                }}
                className="pressable relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[22px] px-1 py-1.5"
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-tab-selection"
                    transition={springs.bouncy}
                    className="absolute inset-0 rounded-[22px] bg-white/[0.12] shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]"
                    aria-hidden
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} className={`relative transition-colors duration-200 ${isActive ? item.tint : 'text-slate-400'}`} />
                <span className={`relative text-[10px] font-semibold tracking-[0.005em] transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileShell;
