import React from 'react';
import Modal from '../Modal';
import { SheetItem, SheetStagger } from './sheet';

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

// Drawn as an Apple alert: compact and centred, the question first, the figures in a quiet inset
// list, and two capsule buttons (Cancel on the left, the action on the right; red when destructive).
const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({ config, onClose }) => (
  <Modal
    isOpen
    onClose={onClose}
    ariaLabel="Confirmation"
    overlayClassName="bg-black/60"
    overlayStyle={{
      paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
      paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
      paddingRight: 'calc(env(safe-area-inset-right) + 1rem)'
    }}
    contentClassName="max-w-[23.5rem]!"
    closeOnOverlayClick
    closeOnEsc
    showCloseButton={false}
  >
    <SheetStagger className="px-5 pb-5 pt-6 text-center" gap={0.04} delay={0.04}>
      <SheetItem>
        <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.013em] text-white text-balance">{config.title}</h2>
        <p className="mx-auto mt-1.5 max-w-[20rem] text-[13px] leading-[1.4] text-slate-400 text-pretty">{config.description}</p>
      </SheetItem>

      {config.details && config.details.length > 0 && (
        <SheetItem className="mt-4">
          <div className="list-group text-left">
            {config.details.map((d) => (
              <div key={d.label} className="list-row min-h-[40px] justify-between py-2 text-[14px]">
                <span className="text-slate-400">{d.label}</span>
                <span className="num text-right font-semibold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </SheetItem>
      )}

      <SheetItem className="mt-5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => {
            const onCancel = config.onCancel;
            onClose();
            onCancel?.();
          }}
          className="btn-secondary touch-target min-h-[46px] w-full px-4 text-[15px]"
        >
          {config.cancelLabel || 'Cancel'}
        </button>
        <button
          type="button"
          onClick={() => {
            const onConfirm = config.onConfirm;
            onClose();
            onConfirm();
          }}
          className={`touch-target min-h-[46px] w-full px-4 text-[15px] ${
            config.danger
              ? 'btn-primary bg-[#ff453a] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_22px_-10px_rgb(255_69_58/0.7)] hover:bg-[#ff5b51]'
              : 'btn-primary'
          }`}
        >
          {config.confirmLabel}
        </button>
      </SheetItem>
    </SheetStagger>
  </Modal>
);

export default ConfirmDialogModal;
