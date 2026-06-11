import React from 'react';
import Modal from '../Modal';
import { useI18n } from '../../i18n';

export type AccessibilityPrefs = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  disableConfetti: boolean;
  disableVideoPreload: boolean;
};

// Accessibility & display settings: language, text/contrast/motion prefs,
// tutorial popups, dashboard view mode, keyboard shortcut reference.
interface AccessibilityModalProps {
  prefs: AccessibilityPrefs;
  setPrefs: React.Dispatch<React.SetStateAction<AccessibilityPrefs>>;
  autoTutorialPopups: boolean;
  setAutoTutorialPopups: (value: boolean) => void;
  viewMode: 'compact' | 'expanded';
  setViewMode: (mode: 'compact' | 'expanded') => void;
  onClose: () => void;
}

const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  prefs,
  setPrefs,
  autoTutorialPopups,
  setAutoTutorialPopups,
  viewMode,
  setViewMode,
  onClose
}) => {
  const { t, locale, setLocale } = useI18n();
  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel={t('settings.accessibility.ariaLabel')}
      overlayClassName="bg-black/80 backdrop-blur-sm"
      overlayStyle={{
        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
        paddingRight: 'calc(env(safe-area-inset-right) + 1rem)'
      }}
      contentClassName="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
      contentStyle={{ maxHeight: 'calc(100dvh - 2rem)' }}
      closeOnOverlayClick
      closeOnEsc
    >
      <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-700/60">
        <div>
          <h2 className="text-lg font-bold text-white">{t('settings.accessibility.title')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('settings.accessibility.subtitle')}</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-white font-semibold" htmlFor="language-select">
            {t('settings.language.label')}
          </label>
          <select
            id="language-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
          >
            <option value="en">{t('language.en')}</option>
            <option value="es">{t('language.es')}</option>
          </select>
          <p className="text-slate-400 text-sm">{t('settings.language.helper')}</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={prefs.largeText}
            onChange={(e) => setPrefs((p) => ({ ...p, largeText: e.target.checked }))}
            className="mt-1"
          />
          <div>
            <div className="text-white font-semibold">{t('settings.accessibility.largeText.title')}</div>
            <div className="text-slate-400 text-sm">{t('settings.accessibility.largeText.description')}</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={prefs.highContrast}
            onChange={(e) => setPrefs((p) => ({ ...p, highContrast: e.target.checked }))}
            className="mt-1"
          />
          <div>
            <div className="text-white font-semibold">{t('settings.accessibility.highContrast.title')}</div>
            <div className="text-slate-400 text-sm">{t('settings.accessibility.highContrast.description')}</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={prefs.reduceMotion}
            onChange={(e) => setPrefs((p) => ({ ...p, reduceMotion: e.target.checked }))}
            className="mt-1"
          />
          <div>
            <div className="text-white font-semibold">{t('settings.accessibility.reduceMotion.title')}</div>
            <div className="text-slate-400 text-sm">{t('settings.accessibility.reduceMotion.description')}</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={prefs.disableConfetti}
            onChange={(e) => setPrefs((p) => ({ ...p, disableConfetti: e.target.checked }))}
            className="mt-1"
          />
          <div>
            <div className="text-white font-semibold">{t('settings.accessibility.disableConfetti.title')}</div>
            <div className="text-slate-400 text-sm">{t('settings.accessibility.disableConfetti.description')}</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={prefs.disableVideoPreload}
            onChange={(e) => setPrefs((p) => ({ ...p, disableVideoPreload: e.target.checked }))}
            className="mt-1"
          />
          <div>
            <div className="text-white font-semibold">{t('settings.accessibility.disableVideoPreload.title')}</div>
            <div className="text-slate-400 text-sm">{t('settings.accessibility.disableVideoPreload.description')}</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoTutorialPopups}
            onChange={(e) => setAutoTutorialPopups(e.target.checked)}
            className="mt-1"
          />
          <div>
            <div className="text-white font-semibold">{t('settings.tutorialPopups.title')}</div>
            <div className="text-slate-400 text-sm">{t('settings.tutorialPopups.description')}</div>
          </div>
        </label>

        {/* View Mode Toggle */}
        <div className="border-t border-slate-700/50 pt-4 mt-4">
          <div className="text-white font-semibold mb-2">Dashboard View Mode</div>
          <div className="flex bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => setViewMode('compact')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all ${
                viewMode === 'compact'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setViewMode('expanded')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all ${
                viewMode === 'expanded'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expanded
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            {viewMode === 'compact'
              ? 'Collapsible sections to reduce information overwhelm'
              : 'All sections expanded with full details visible'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Keyboard shortcuts</h3>
          <p className="text-xs text-slate-400 mt-1">Press a key to jump without clicking.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
            {[
              ['N', 'Next Month'],
              ['T', 'Toggle Autoplay'],
              ['A', 'Actions'],
              ['I', 'Invest'],
              ['P', 'Portfolio'],
              ['B', 'Bank'],
              ['C', 'Career'],
              ['E', 'Education'],
              ['S', 'Side Hustles'],
              ['L', 'Lifestyle'],
              ['?', 'Shortcuts']
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/40 px-3 py-2">
                <span className="text-slate-300">{label}</span>
                <span className="text-xs font-semibold text-emerald-300">{key}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() =>
              setPrefs({
                largeText: false,
                highContrast: false,
                reduceMotion: false,
                disableConfetti: false,
                disableVideoPreload: false
              })
            }
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold"
          >
            {t('actions.reset')}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            {t('actions.done')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AccessibilityModal;
