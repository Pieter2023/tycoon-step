import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ModeSelector from './ModeSelector';
import ErrorBoundary from './components/ErrorBoundary';
import { I18nProvider } from './i18n';

const AppRoot: React.FC = () => {
  return (
    <ModeSelector />
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
