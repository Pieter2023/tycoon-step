import React, { useEffect, useMemo, useState } from 'react';
import AppShell, { AppShellNavItem } from './ui/AppShell';
import PlayPage from './v2/PlayPage';
import MoneyPage from './v2/MoneyPage';
import CareerPage from './v2/CareerPage';
import LearnPage from './v2/LearnPage';
import LifePage from './v2/LifePage';

const NAV_ITEMS: AppShellNavItem[] = [
  { label: 'Play', path: '/play' },
  { label: 'Money', path: '/money' },
  { label: 'Career', path: '/career' },
  { label: 'Learn', path: '/learn' },
  { label: 'Life', path: '/life' }
];

const validPaths = new Set(NAV_ITEMS.map((item) => item.path));

const normalizePath = (path: string) => {
  if (!path || path === '/') return '/play';
  if (validPaths.has(path)) return path;
  return '/play';
};

const NewUiRoot: React.FC = () => {
  const [activePath, setActivePath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname);
    if (normalized !== window.location.pathname) {
      window.history.replaceState({}, '', normalized);
      setActivePath(normalized);
    }
    const handler = () => setActivePath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const handleNavigate = (path: string) => {
    if (path === activePath) return;
    window.history.pushState({}, '', path);
    setActivePath(path);
  };

  const ActivePage = useMemo(() => {
    switch (activePath) {
      case '/money':
        return MoneyPage;
      case '/career':
        return CareerPage;
      case '/learn':
        return LearnPage;
      case '/life':
        return LifePage;
      case '/play':
      default:
        return PlayPage;
    }
  }, [activePath]);

  return (
    <AppShell
      title="Financial Freedom"
      subtitle="Tycoon"
      navItems={NAV_ITEMS}
      activePath={activePath}
      onNavigate={handleNavigate}
    >
      <ActivePage />
    </AppShell>
  );
};

export default NewUiRoot;
