import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ModeSelector from './ModeSelector';
import ErrorBoundary from './components/ErrorBoundary';
import { I18nProvider } from './i18n';
import NewUiRoot from './components/NewUiRoot';

const UI_V2_STORAGE_KEY = 'tycoon_ui_v2';

const normalizeFlag = (value?: string | null) => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const getUiV2Enabled = () => {
  try {
    const stored = localStorage.getItem(UI_V2_STORAGE_KEY);
    if (stored !== null) return normalizeFlag(stored);
  } catch (err) {
    // Ignore storage access errors.
  }
  return normalizeFlag(import.meta.env.VITE_UI_V2);
};

const AppRoot: React.FC = () => {
  const [uiV2Enabled, setUiV2Enabled] = useState(() => getUiV2Enabled());
  const isProd = import.meta.env.PROD;

  const toggleUi = () => {
    setUiV2Enabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(UI_V2_STORAGE_KEY, next ? '1' : '0');
      } catch (err) {
        // Ignore storage access errors.
      }
      return next;
    });
  };

  useEffect(() => {
    if (isProd) return undefined;
    const handler = (event: KeyboardEvent) => {
      if (event.shiftKey && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'u') {
        event.preventDefault();
        toggleUi();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isProd]);

  const RootComponent = useMemo(() => (uiV2Enabled ? NewUiRoot : ModeSelector), [uiV2Enabled]);

  return (
    <>
      <RootComponent />
      {!isProd && (
        <button
          onClick={toggleUi}
          className="fixed bottom-4 right-4 z-[90] rounded-full border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-200 shadow-lg hover:bg-slate-800"
        >
          UI v2: {uiV2Enabled ? 'On' : 'Off'}
        </button>
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary onReset={() => window.location.reload()}>
      <I18nProvider>
        <AppRoot />
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
