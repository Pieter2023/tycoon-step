import { useI18n, type Translate } from '../../i18n';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BriefcaseBusiness, GraduationCap, HeartPulse, LayoutDashboard, WalletCards } from 'lucide-react';
import { MOTION_DISABLED, springs } from '../ui/motion';

type DesktopShellProps = {
  title: string;
  subtitle?: string;
  navItems: { label: string; path: string }[];
  activePath: string;
  onNavigate: (path: string) => void;
  headerLeading?: React.ReactNode;
  headerActions?: React.ReactNode;
  year?: number;
  month?: number;
  children: React.ReactNode;
};

// Each section gets a system colour for its icon tile, like the macOS Settings sidebar.
const navMetaFor = (path: string, t: Translate) => {
  switch (path) {
    case '/money':
      return { icon: WalletCards, tile: 'bg-[#0a84ff]', description: t('shell.desktopShell.invest_bank_portfolio') };
    case '/career':
      return { icon: BriefcaseBusiness, tile: 'bg-[#ff9f0a]', description: t('shell.desktopShell.salary_promotion_risk') };
    case '/learn':
      return { icon: GraduationCap, tile: 'bg-[#bf5af2]', description: t('shell.desktopShell.courses_and_credentials') };
    case '/life':
      return { icon: HeartPulse, tile: 'bg-[#ff375f]', description: t('shell.desktopShell.lifestyle_and_side_income') };
    case '/play':
    default:
      return { icon: LayoutDashboard, tile: 'bg-[#30d158]', description: t('shell.desktopShell.command_center') };
  }
};

/** "Year 1 • Month 7" that rolls like an odometer when the month turns. */
export const RollingDate: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (MOTION_DISABLED) return <p className={className}>{text}</p>;
  return (
    <p className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          className="block"
          initial={{ y: '85%', opacity: 0, filter: 'blur(2px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          exit={{ y: '-85%', opacity: 0, filter: 'blur(2px)' }}
          transition={springs.smooth}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </p>
  );
};

const DesktopShell: React.FC<DesktopShellProps> = ({
  title,
  subtitle,
  navItems,
  activePath,
  onNavigate,
  headerLeading,
  headerActions,
  year,
  month,
  children
}) => {
  const { t } = useI18n();
  const activeItem = navItems.find((item) => item.path === activePath) || navItems[0];

  // Scroll edge: the bar only separates itself from the page once content runs under it.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="hidden min-h-screen text-white md:flex">
      <aside className="mat-chrome sticky top-0 flex h-screen w-[264px] shrink-0 flex-col border-r border-white/[0.06] px-3 pb-4 pt-5">
        <div className="flex items-center gap-3 px-2">
          {headerLeading}
          <div className="min-w-0">
            {subtitle && <p className="text-[11px] font-semibold text-emerald-300">{subtitle}</p>}
            <h1 className="truncate text-[17px] font-semibold leading-tight tracking-[-0.015em] text-white">{title}</h1>
          </div>
        </div>

        <nav className="mt-7" aria-label={t('shell.desktopShell.workspace')}>
          <p className="px-3 pb-2 text-[11px] font-semibold text-slate-500">{t('shell.desktopShell.workspace')}</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.path === activePath;
              const meta = navMetaFor(item.path, t);
              const Icon = meta.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  className="pressable group relative flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left"
                >
                  {isActive && (
                    <motion.span
                      layoutId="desktop-nav-selection"
                      transition={springs.glide}
                      className="absolute inset-0 rounded-[12px] bg-white/[0.09] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                      aria-hidden
                    />
                  )}
                  <span className="absolute inset-0 rounded-[12px] bg-white/[0.04] opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden />
                  <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_6px_rgb(0_0_0/0.3)] ${meta.tile}`}>
                    <Icon size={17} strokeWidth={2.2} />
                  </span>
                  <span className="relative min-w-0">
                    <span className={`block text-[14px] font-semibold leading-5 ${isActive ? 'text-white' : 'text-slate-200'}`}>{item.label}</span>
                    <span className="block truncate text-[12px] leading-4 text-slate-500">{meta.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto px-3 pt-4">
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-[11px] font-semibold text-slate-500">{t('shell.desktopShell.loop')}</p>
            <p className="mt-1 text-[13px] font-semibold text-slate-200">{t('shell.desktopShell.plan_act_advance')}</p>
            <p className="mt-1 text-[12px] leading-[1.45] text-slate-500">{t('shell.desktopShell.every_month_should_either_improve')}</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header
          data-scrolled={scrolled || undefined}
          className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ${
            scrolled ? 'mat-bar shadow-[0_1px_0_rgb(255_255_255/0.07)]' : 'bg-transparent'
          }`}
        >
          <div className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-8 transition-[min-height] duration-[530ms] ease-spring ${scrolled ? 'min-h-[60px]' : 'min-h-[80px]'}`}>
            {/* Large title that condenses as the page scrolls under the bar (scale, not font-size, so nothing reflows). */}
            <div className="min-w-0">
              <h2
                className={`t-large-title origin-left leading-[2.4rem] text-white transition-[scale] duration-[530ms] ease-spring ${scrolled ? 'scale-[0.62]' : 'scale-100'}`}
              >
                {activeItem?.label || title}
              </h2>
              {typeof year === 'number' && typeof month === 'number' && (
                <div className={`transition-[margin,opacity] duration-[530ms] ease-spring ${scrolled ? '-mt-[7px] opacity-80' : 'mt-0'}`}>
                  <RollingDate text={t('shell.desktopShell.year_month', { year, month })} className="num text-[13px] font-medium text-slate-400" />
                </div>
              )}
            </div>
            {headerActions && <div className="flex items-center gap-2.5">{headerActions}</div>}
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-8 pb-10 pt-4">
          {MOTION_DISABLED ? (
            children
          ) : (
            <motion.div
              key={activePath}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.smooth}
              className="flex flex-col gap-6"
            >
              {children}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DesktopShell;
