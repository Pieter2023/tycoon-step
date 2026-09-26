import React from 'react';
import { Save as SaveIcon, FolderOpen as FolderOpenIcon, Trash2, RefreshCw, History } from 'lucide-react';
import Modal from '../Modal';
import { SaveSlotId, SaveSummary } from '../../services/storageService';
import { useI18n, formatCurrencyCompactValue, formatDateTimeValue } from '../../i18n';
import { SheetItem, SheetStagger } from './sheet';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

const fieldClass =
  'rounded-[12px] bg-[rgb(118_118_128/0.18)] px-3 py-2 text-[16px] sm:text-[14px] text-white placeholder:text-slate-500';

// In-game save manager: slots + export/import. Controlled — slot drafts and
// import state live in App because handleImportSave/refresh read them there.
interface SaveManagerModalProps {
  saveSlots: SaveSlotId[];
  saveSummaries: SaveSummary[];
  saveLabelDrafts: Record<SaveSlotId, string>;
  setSaveLabelDrafts: React.Dispatch<React.SetStateAction<Record<SaveSlotId, string>>>;
  exportSlotId: SaveSlotId;
  setExportSlotId: (slotId: SaveSlotId) => void;
  importSlotId: SaveSlotId;
  setImportSlotId: (slotId: SaveSlotId) => void;
  importPayload: string;
  setImportPayload: (payload: string) => void;
  importError: string | null;
  onSaveToSlot: (slotId: SaveSlotId, label?: string) => void;
  onLoadFromSlot: (slotId: SaveSlotId) => void;
  onDeleteSlot: (slotId: SaveSlotId) => void;
  onRenameSlot: (slotId: SaveSlotId, label: string) => void;
  onExportSlot: (slotId: SaveSlotId, mode: 'copy' | 'download') => void;
  onImport: () => void;
  onRefresh: () => void;
  onClose: () => void;
}

const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  saveSlots,
  saveSummaries,
  saveLabelDrafts,
  setSaveLabelDrafts,
  exportSlotId,
  setExportSlotId,
  importSlotId,
  setImportSlotId,
  importPayload,
  setImportPayload,
  importError,
  onSaveToSlot,
  onLoadFromSlot,
  onDeleteSlot,
  onRenameSlot,
  onExportSlot,
  onImport,
  onRefresh,
  onClose
}) => {
  const { t } = useI18n();
  const formatDateTime = (ts: number) => {
    try {
      return formatDateTimeValue(ts);
    } catch (e) {
      console.debug('Date formatting failed:', e);
      return t('dates.invalid');
    }
  };

  const renderSlot = (slotId: SaveSlotId) => {
    const summary = saveSummaries.find(s => s.slotId === slotId);
    const isEmpty = !summary;
    const isAuto = slotId === 'autosave';
    const title = isAuto ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`;

    return (
      <div key={slotId} className="px-4 py-3.5">
        {/* On phones the actions drop to their own row under the title; from sm up they sit on the right. */}
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2.5 sm:flex-nowrap">
          <span
            aria-hidden
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
              isAuto ? 'bg-emerald-400/[0.18] text-emerald-300' : isEmpty ? 'bg-white/[0.05] text-slate-500' : 'bg-[#0a84ff]/[0.18] text-sky-300'
            }`}
          >
            {isAuto ? <History size={19} strokeWidth={2.2} /> : <span className="num text-[15px] font-bold">{slotId.replace('slot', '')}</span>}
          </span>

          <div className="min-w-0 flex-1 basis-[calc(100%-52px)] sm:basis-auto">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-[16px] font-semibold text-white">{title}</p>
              {summary?.label && !isAuto && (
                <span className="rounded-full bg-emerald-400/[0.15] px-2 py-0.5 text-[12px] font-medium text-emerald-300">
                  {summary.label}
                </span>
              )}
            </div>
            {isEmpty ? (
              <p className="mt-0.5 text-[13px] text-slate-500">Empty</p>
            ) : (
              <p className="num mt-0.5 text-[13px] text-slate-400">Last saved: {formatDateTime(summary.updatedAt)}</p>
            )}
          </div>

          <div className="flex w-full shrink-0 items-center gap-1.5 pl-[52px] sm:w-auto sm:pl-0">
            <button
              type="button"
              onClick={() => onSaveToSlot(slotId, isAuto ? undefined : saveLabelDrafts[slotId])}
              className="pressable inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-400/[0.16] px-3.5 text-[13px] font-semibold text-emerald-300 hover:bg-emerald-400/[0.24]"
            >
              <SaveIcon size={15} strokeWidth={2.3} /> Save
            </button>
            <button
              type="button"
              disabled={isEmpty}
              onClick={() => onLoadFromSlot(slotId)}
              className="pressable inline-flex h-9 items-center gap-1.5 rounded-full bg-[rgb(118_118_128/0.24)] px-3.5 text-[13px] font-semibold text-white hover:bg-[rgb(118_118_128/0.36)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FolderOpenIcon size={15} strokeWidth={2.3} /> Load
            </button>
            <button
              type="button"
              disabled={isEmpty}
              onClick={() => onDeleteSlot(slotId)}
              className="pressable flex h-9 w-9 items-center justify-center rounded-full text-[#ff6961] hover:bg-red-500/[0.16] disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:bg-transparent"
              title="Delete save"
              aria-label={`Delete ${title}`}
            >
              <Trash2 size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {!isEmpty && (
          <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 sm:ml-[52px] sm:grid-cols-5">
            <div>
              <dt className="text-[12px] text-slate-500">Time</dt>
              <dd className="num text-[14px] font-semibold text-white">Y{Math.ceil((summary.month || 1) / 12)} • M{(((summary.month || 1) - 1) % 12) + 1}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-slate-500">Cash</dt>
              <dd className="num text-[14px] font-semibold text-emerald-300">{formatMoney(summary.cash || 0)}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-slate-500">Net Worth</dt>
              <dd className="num text-[14px] font-semibold text-white">{formatMoney(summary.netWorth || 0)}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-slate-500">Passive/mo</dt>
              <dd className="num text-[14px] font-semibold text-amber-300">{formatMoney(summary.passiveIncome || 0)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[12px] text-slate-500">Difficulty</dt>
              <dd className="truncate text-[14px] font-semibold text-white">{summary.difficulty || t('save.unknown')}</dd>
            </div>
          </dl>
        )}

        {!isAuto && (
          <div className="mt-3 flex items-center gap-2 sm:ml-[52px]">
            <input
              type="text"
              value={saveLabelDrafts[slotId] || ''}
              onChange={(e) => setSaveLabelDrafts(prev => ({ ...prev, [slotId]: e.target.value }))}
              placeholder="Name this save"
              className={`${fieldClass} min-w-0 flex-1`}
            />
            <button
              type="button"
              disabled={isEmpty}
              onClick={() => onRenameSlot(slotId, saveLabelDrafts[slotId] || '')}
              className="pressable shrink-0 rounded-full px-3 py-2 text-[13px] font-semibold text-[#0a84ff] hover:bg-[rgb(118_118_128/0.18)] disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:bg-transparent"
            >
              Update label
            </button>
          </div>
        )}
      </div>
    );
  };

  const autoSlots = saveSlots.filter((id) => id === 'autosave');
  const manualSlots = saveSlots.filter((id) => id !== 'autosave');
  const slotName = (slotId: SaveSlotId) => (slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`);

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Save and load"
      overlayClassName="bg-black/60"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="max-w-2xl!"
    >
      <SheetStagger className="px-5 pb-5 pt-6 sm:px-6" gap={0.045}>
        <SheetItem className="pr-10">
          <h2 className="t-title-2 text-white">💾 Save & Load</h2>
          <p className="mt-1 text-[14px] text-slate-400">Autosaves at the end of every month • Use slots for manual saves</p>
        </SheetItem>

        {/* The autosave is the one most players reach for: it gets its own highlighted group. */}
        {autoSlots.length > 0 && (
          <SheetItem className="mt-5">
            <div className="overflow-hidden rounded-[18px] bg-emerald-400/[0.07] ring-1 ring-inset ring-emerald-400/20">
              {autoSlots.map(renderSlot)}
            </div>
          </SheetItem>
        )}

        {manualSlots.length > 0 && (
          <SheetItem className="mt-3">
            <div className="list-group divide-y divide-[rgb(84_84_88/0.45)]">
              {manualSlots.map(renderSlot)}
            </div>
          </SheetItem>
        )}

        <SheetItem className="mt-6">
          <div className="px-4">
            <p className="text-[15px] font-semibold text-white">Export / Import</p>
            <p className="text-[13px] text-slate-400">Keep a backup or move saves between devices.</p>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="surface-inset space-y-2.5 p-3.5">
              <p className="text-[13px] font-medium text-slate-300">Export a save</p>
              <select
                value={exportSlotId}
                onChange={(e) => setExportSlotId(e.target.value as SaveSlotId)}
                className={`${fieldClass} w-full cursor-pointer`}
              >
                {saveSlots.map(slotId => (
                  <option key={`export-${slotId}`} value={slotId}>
                    {slotName(slotId)}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void onExportSlot(exportSlotId, 'copy')}
                  className="btn-secondary min-h-[38px] px-3 text-[13px]"
                >
                  Copy JSON
                </button>
                <button
                  type="button"
                  onClick={() => void onExportSlot(exportSlotId, 'download')}
                  className="btn-secondary min-h-[38px] px-3 text-[13px]"
                >
                  Download
                </button>
              </div>
            </div>

            <div className="surface-inset space-y-2.5 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-slate-300">Import a save</p>
                <select
                  value={importSlotId}
                  onChange={(e) => setImportSlotId(e.target.value as SaveSlotId)}
                  className={`${fieldClass} cursor-pointer py-1 sm:text-[13px]`}
                >
                  {saveSlots.map(slotId => (
                    <option key={`import-${slotId}`} value={slotId}>
                      {slotName(slotId)}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={importPayload}
                onChange={(e) => setImportPayload(e.target.value)}
                placeholder="Paste save JSON here..."
                className={`${fieldClass} block min-h-[84px] w-full resize-y sm:text-[13px]`}
              />
              {importError && <p className="text-[13px] text-red-300">{importError}</p>}
              <button
                type="button"
                onClick={onImport}
                className="btn-primary min-h-[38px] w-full px-3 text-[13px]"
              >
                Import & Load
              </button>
            </div>
          </div>
        </SheetItem>

        <SheetItem className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onRefresh}
            className="pressable inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[15px] font-medium text-[#0a84ff] hover:bg-[rgb(118_118_128/0.18)]"
          >
            <RefreshCw size={15} strokeWidth={2.3} aria-hidden />
            Refresh
          </button>

          <button type="button" onClick={onClose} className="btn-secondary min-h-[42px] px-6 text-[15px]">
            Close
          </button>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default SaveManagerModal;
