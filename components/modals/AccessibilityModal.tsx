import React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import Modal from '../Modal';
import { SegmentedControl } from '../ui';
import { useI18n } from '../../i18n';
import { SheetItem, SheetStagger, Switch } from './sheet';

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

/** One Settings row: title and a footnote on the left, the switch on the right; the whole row toggles. */
const SwitchRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ title, description, checked, onChange }) => (
  <label className="list-row cursor-pointer select-none items-center py-3 transition-colors hover:bg-white/[0.03]">
    <div className="min-w-0 flex-1">
      <div className="text-[15px] font-medium leading-snug text-white">{title}</div>
      <div className="mt-0.5 text-[13px] leading-snug text-slate-400">{description}</div>
    </div>
    <Switch checked={checked} onChange={onChange} />
  </label>
);

const SHORTCUTS: [string, string][] = [
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
];

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
      overlayClassName="bg-black/60"
      overlayStyle={{
        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
        paddingRight: 'calc(env(safe-area-inset-right) + 1rem)'
      }}
      contentClassName="max-w-lg"
      closeOnOverlayClick
      closeOnEsc
    >
      <SheetStagger className="px-5 pb-5 pt-6 sm:px-6" gap={0.035}>
        <SheetItem className="pr-10">
          <h2 className="t-title-2 text-white">{t('settings.accessibility.title')}</h2>
          <p className="mt-1 text-[15px] leading-snug text-slate-400">{t('settings.accessibility.subtitle')}</p>
        </SheetItem>

        {/* Language: a Settings row with the value on the right. */}
        <SheetItem className="mt-5">
          <div className="list-group">
            <div className="list-row py-2.5">
              <label className="flex-1 text-[15px] font-medium text-white" htmlFor="language-select">
                {t('settings.language.label')}
              </label>
              <div className="relative">
                <select
                  id="language-select"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as typeof locale)}
                  className="cursor-pointer appearance-none rounded-[10px] bg-transparent py-1.5 pl-3 pr-7 text-right text-[15px] text-slate-400 outline-none transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06]"
                >
                  <option value="en">{t('language.en')}</option>
                  <option value="es">{t('language.es')}</option>
                </select>
                <ChevronsUpDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
              </div>
            </div>
          </div>
          <p className="mt-1.5 px-4 text-[13px] text-slate-500">{t('settings.language.helper')}</p>
        </SheetItem>

        <SheetItem className="mt-5">
          <div className="list-group">
            <SwitchRow
              title={t('settings.accessibility.largeText.title')}
              description={t('settings.accessibility.largeText.description')}
              checked={prefs.largeText}
              onChange={(e) => setPrefs((p) => ({ ...p, largeText: e.target.checked }))}
            />
            <SwitchRow
              title={t('settings.accessibility.highContrast.title')}
              description={t('settings.accessibility.highContrast.description')}
              checked={prefs.highContrast}
              onChange={(e) => setPrefs((p) => ({ ...p, highContrast: e.target.checked }))}
            />
            <SwitchRow
              title={t('settings.accessibility.reduceMotion.title')}
              description={t('settings.accessibility.reduceMotion.description')}
              checked={prefs.reduceMotion}
              onChange={(e) => setPrefs((p) => ({ ...p, reduceMotion: e.target.checked }))}
            />
            <SwitchRow
              title={t('settings.accessibility.disableConfetti.title')}
              description={t('settings.accessibility.disableConfetti.description')}
              checked={prefs.disableConfetti}
              onChange={(e) => setPrefs((p) => ({ ...p, disableConfetti: e.target.checked }))}
            />
          </div>
        </SheetItem>

        <SheetItem className="mt-5">
          <div className="list-group">
            <SwitchRow
              title={t('settings.accessibility.disableVideoPreload.title')}
              description={t('settings.accessibility.disableVideoPreload.description')}
              checked={prefs.disableVideoPreload}
              onChange={(e) => setPrefs((p) => ({ ...p, disableVideoPreload: e.target.checked }))}
            />
            <SwitchRow
              title={t('settings.tutorialPopups.title')}
              description={t('settings.tutorialPopups.description')}
              checked={autoTutorialPopups}
              onChange={(e) => setAutoTutorialPopups(e.target.checked)}
            />
          </div>
        </SheetItem>

        {/* View Mode Toggle */}
        <SheetItem className="mt-6">
          <div className="mb-2 px-4 text-[15px] font-semibold text-white">Dashboard View Mode</div>
          <SegmentedControl
            role="group"
            fill
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'expanded', label: 'Expanded' }
            ]}
          />
          <p className="mt-2 px-4 text-[13px] text-slate-400">
            {viewMode === 'compact'
              ? 'Collapsible sections to reduce information overwhelm'
              : 'All sections expanded with full details visible'}
          </p>
        </SheetItem>

        <SheetItem className="mt-6">
          <h3 className="px-4 text-[15px] font-semibold text-white">Keyboard shortcuts</h3>
          <p className="mt-0.5 px-4 text-[13px] text-slate-400">Press a key to jump without clicking.</p>
          <div className="list-group mt-2.5 grid grid-cols-1 sm:grid-cols-2">
            {SHORTCUTS.map(([key, label]) => (
              <div key={key} className="flex min-h-[40px] items-center justify-between gap-3 border-white/[0.06] px-4 py-2 text-[14px] [&:not(:last-child)]:border-b sm:odd:border-r">
                <span className="text-slate-300">{label}</span>
                <kbd className="inline-flex h-[24px] min-w-[24px] items-center justify-center rounded-[6px] bg-white/[0.1] px-1.5 font-sans text-[12px] font-semibold text-white shadow-[inset_0_-1px_0_rgb(0_0_0/0.35),0_1px_0_rgb(255_255_255/0.06)]">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </SheetItem>

        <SheetItem className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              setPrefs({
                largeText: false,
                highContrast: false,
                reduceMotion: false,
                disableConfetti: false,
                disableVideoPreload: false
              })
            }
            className="btn-secondary min-h-[46px] w-full px-5 text-[15px] sm:w-auto"
          >
            {t('actions.reset')}
          </button>
          <button type="button" onClick={onClose} className="btn-primary min-h-[46px] w-full px-5 text-[15px] sm:flex-1">
            {t('actions.done')}
          </button>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default AccessibilityModal;
