import React from 'react';

export type AppShellNavItem = {
  label: string;
  path: string;
};

type AppShellProps = {
  title: string;
  subtitle?: string;
  navItems: AppShellNavItem[];
  activePath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
};

const AppShell: React.FC<AppShellProps> = ({
  title,
  subtitle,
  navItems,
  activePath,
  onNavigate,
  children
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600" />
            <div>
              {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {navItems.map((item) => {
              const isActive = item.path === activePath;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all border ${
                    isActive
                      ? 'bg-white text-slate-900 border-white'
                      : 'border-slate-800 text-slate-200 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
