import React from 'react';
import Modal from '../Modal';

// Confirmation dialog (prevents costly mis-clicks). The config carries its
// own callbacks; the dialog closes itself before invoking them so a callback
// that opens another modal doesn't race the close.
export type ConfirmDialogConfig = {
  title: string;
  description: string;
  details?: { label: string; value: string }[];
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

interface ConfirmDialogModalProps {
  config: ConfirmDialogConfig;
  onClose: () => void;
}

const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({ config, onClose }) => (
  <Modal
    isOpen
    onClose={onClose}
    ariaLabel="Confirmation"
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
        <h2 className="text-lg font-bold text-white">{config.title}</h2>
        <p className="text-slate-400 text-sm mt-1">{config.description}</p>
      </div>
    </div>
    <div className="p-5 space-y-4">
      {config.details && config.details.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="space-y-2">
            {config.details.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-300">{d.label}</span>
                <span className="text-slate-200 font-semibold text-right">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => {
            const onCancel = config.onCancel;
            onClose();
            onCancel?.();
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold touch-target"
        >
          {config.cancelLabel || 'Cancel'}
        </button>
        <button
          onClick={() => {
            const onConfirm = config.onConfirm;
            onClose();
            onConfirm();
          }}
          className={`w-full sm:flex-1 px-5 py-3 rounded-xl text-white font-semibold touch-target ${
            config.danger
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {config.confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialogModal;
