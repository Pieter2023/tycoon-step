import React from 'react';

type DesktopShellProps = {
  title: string;
  subtitle?: string;
  navItems: { label: string; path: string }[];
  activePath: string;
  onNavigate: (path: string) => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

const DesktopShell: React.FC<DesktopShellProps> = ({
  title,
  subtitle,
  navItems,
  activePath,
  onNavigate,
  headerActions,
  children
}) => {
  return (
    <div className="hidden md:block min-h-screen text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
          <div className="min-w-[200px]">
            {subtitle && <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{subtitle}</p>}
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
          </div>
          <nav className="flex items-center gap-3">
            {navItems.map((item) => {
              const isActive = item.path === activePath;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'border-white/70 bg-white/90 text-slate-950 shadow-[0_0_25px_rgba(255,255,255,0.2)]'
                      : 'border-slate-700/60 text-slate-200 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default DesktopShell;
