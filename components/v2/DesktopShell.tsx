import React from 'react';
import { BriefcaseBusiness, GraduationCap, HeartPulse, LayoutDashboard, WalletCards } from 'lucide-react';

type DesktopShellProps = {
  title: string;
  subtitle?: string;
  navItems: { label: string; path: string }[];
  activePath: string;
  onNavigate: (path: string) => void;
  headerLeading?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

const navMetaFor = (label: string) => {
  switch (label) {
    case 'Money':
      return { icon: WalletCards, description: 'Invest, bank, portfolio' };
    case 'Career':
      return { icon: BriefcaseBusiness, description: 'Salary, promotion, risk' };
    case 'Learn':
      return { icon: GraduationCap, description: 'Courses and credentials' };
    case 'Life':
      return { icon: HeartPulse, description: 'Lifestyle and side income' };
    case 'Play':
    default:
      return { icon: LayoutDashboard, description: 'Command center' };
  }
};

const DesktopShell: React.FC<DesktopShellProps> = ({
  title,
  subtitle,
  navItems,
  activePath,
  onNavigate,
  headerLeading,
  headerActions,
  children
}) => {
  const activeItem = navItems.find((item) => item.path === activePath) || navItems[0];

  return (
    <div className="hidden min-h-screen text-white md:flex">
      <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col border-r border-slate-800/70 bg-slate-950/85 px-5 py-5 backdrop-blur-xl">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            {headerLeading}
            <div className="min-w-0">
              {subtitle && <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">{subtitle}</p>}
              <h1 className="mt-1 text-xl font-semibold leading-tight text-white">{title}</h1>
            </div>
          </div>
        </div>

        <nav className="mt-6 space-y-2">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Workspace</p>
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = item.path === activePath;
              const meta = navMetaFor(item.label);
              const Icon = meta.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                    isActive
                      ? 'border-emerald-400/35 bg-emerald-400 text-slate-950 shadow-[0_14px_32px_rgba(52,211,153,0.16)]'
                      : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900/70 hover:text-white'
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${isActive ? 'bg-slate-950/10' : 'bg-slate-900'}`}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className={`block text-xs ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{meta.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Loop</p>
          <p className="mt-2 text-sm font-semibold text-white">Plan, act, advance.</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Every month should either improve cash flow, reduce risk, or buy future freedom.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center justify-between gap-5 px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Current View</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{activeItem?.label || title}</h2>
            </div>
            {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DesktopShell;
