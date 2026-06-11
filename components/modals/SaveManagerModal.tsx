import React from 'react';
import { Save as SaveIcon, FolderOpen as FolderOpenIcon, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import { SaveSlotId, SaveSummary } from '../../services/storageService';
import { useI18n, formatCurrencyCompactValue, formatDateTimeValue } from '../../i18n';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

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

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Save and load"
      overlayClassName="bg-black/70"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div>
          <h2 className="text-white font-bold text-lg">💾 Save & Load</h2>
          <p className="text-slate-400 text-xs">Autosaves at the end of every month • Use slots for manual saves</p>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {saveSlots.map(slotId => {
          const summary = saveSummaries.find(s => s.slotId === slotId);
          const isEmpty = !summary;
          const title = slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`;

          return (
            <div key={slotId} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold">{title}</p>
                    {summary?.label && slotId !== 'autosave' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                        {summary.label}
                      </span>
                    )}
                  </div>

                  {isEmpty ? (
                    <p className="text-slate-400 text-sm mt-1">Empty</p>
                  ) : (
                    <div className="text-slate-300 text-sm mt-1 space-y-1">
                      <p className="text-slate-400 text-xs">Last saved: {formatDateTime(summary.updatedAt)}</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        <div className="bg-slate-900/40 rounded-lg p-2">
                          <p className="text-slate-500">Time</p>
                          <p className="text-white font-medium">Y{Math.ceil((summary.month || 1) / 12)} • M{(((summary.month || 1) - 1) % 12) + 1}</p>
                        </div>
                        <div className="bg-slate-900/40 rounded-lg p-2">
                          <p className="text-slate-500">Cash</p>
                          <p className="text-emerald-300 font-medium">{formatMoney(summary.cash || 0)}</p>
                        </div>
                        <div className="bg-slate-900/40 rounded-lg p-2">
                          <p className="text-slate-500">Net Worth</p>
                          <p className="text-white font-medium">{formatMoney(summary.netWorth || 0)}</p>
                        </div>
                        <div className="bg-slate-900/40 rounded-lg p-2">
                          <p className="text-slate-500">Passive/mo</p>
                          <p className="text-amber-300 font-medium">{formatMoney(summary.passiveIncome || 0)}</p>
                        </div>
                        <div className="bg-slate-900/40 rounded-lg p-2">
                          <p className="text-slate-500">Difficulty</p>
                          <p className="text-white font-medium">{summary.difficulty || t('save.unknown')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onSaveToSlot(slotId, slotId === 'autosave' ? undefined : saveLabelDrafts[slotId])}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2"
                  >
                    <SaveIcon size={16} /> Save
                  </button>

                  <button
                    disabled={isEmpty}
                    onClick={() => onLoadFromSlot(slotId)}
                    className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium flex items-center gap-2"
                  >
                    <FolderOpenIcon size={16} /> Load
                  </button>

                  <div className="flex gap-2">
                    <button
                      disabled={isEmpty}
                      onClick={() => onDeleteSlot(slotId)}
                      className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:bg-slate-900 disabled:text-slate-600 text-white text-xs flex items-center gap-1"
                      title="Delete save"
                      aria-label={`Delete ${title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {slotId !== 'autosave' && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={saveLabelDrafts[slotId] || ''}
                    onChange={(e) => setSaveLabelDrafts(prev => ({ ...prev, [slotId]: e.target.value }))}
                    placeholder="Name this save"
                    className="flex-1 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                  <button
                    disabled={isEmpty}
                    onClick={() => onRenameSlot(slotId, saveLabelDrafts[slotId] || '')}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 text-xs"
                  >
                    Update label
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-3">
          <div>
            <p className="text-white font-semibold text-sm">Export / Import</p>
            <p className="text-slate-400 text-xs">Keep a backup or move saves between devices.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3">
              <p className="text-slate-300 text-xs mb-2">Export a save</p>
              <div className="flex items-center gap-2">
                <select
                  value={exportSlotId}
                  onChange={(e) => setExportSlotId(e.target.value as SaveSlotId)}
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-xs text-slate-200"
                >
                  {saveSlots.map(slotId => (
                    <option key={`export-${slotId}`} value={slotId}>
                      {slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void onExportSlot(exportSlotId, 'copy')}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                >
                  Copy JSON
                </button>
                <button
                  onClick={() => void onExportSlot(exportSlotId, 'download')}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                >
                  Download
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 text-xs">Import a save</p>
                <select
                  value={importSlotId}
                  onChange={(e) => setImportSlotId(e.target.value as SaveSlotId)}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200"
                >
                  {saveSlots.map(slotId => (
                    <option key={`import-${slotId}`} value={slotId}>
                      {slotId === 'autosave' ? 'Autosave' : `Slot ${slotId.replace('slot', '')}`}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={importPayload}
                onChange={(e) => setImportPayload(e.target.value)}
                placeholder="Paste save JSON here..."
                className="w-full min-h-[96px] rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500"
              />
              {importError && <p className="text-red-300 text-xs">{importError}</p>}
              <button
                onClick={onImport}
                className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Import & Load
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onRefresh}
            className="text-slate-400 hover:text-white text-sm"
          >
            Refresh
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SaveManagerModal;
