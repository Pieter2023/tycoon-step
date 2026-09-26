import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { ShortcutConfig } from '../hooks/useKeyboardShortcuts';
import { materialize } from './ui/motion';
import { useSheetReducedMotion } from './modals/sheet';

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutConfig[];
}

/** A key drawn like a Mac keycap: a raised gray cap with a darker lower lip, in the system font. */
const Keycap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-[7px] bg-[rgb(118_118_128/0.3)] px-2 font-sans text-[12px] font-semibold text-white shadow-[inset_0_-1.5px_0_rgb(0_0_0/0.4),inset_0_1px_0_rgb(255_255_255/0.1)]">
    {children}
  </kbd>
);

const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({
  isOpen,
  onClose,
  shortcuts,
}) => {
  const reduce = useSheetReducedMotion();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-[6px]"
          onClick={onClose}
        >
          <motion.div
            variants={reduce ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } } : materialize}
            initial="hidden"
            animate="show"
            exit="exit"
            className="mat-sheet relative my-auto w-full max-w-2xl rounded-[28px] px-5 pb-6 pt-6 sm:px-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="t-title-2 flex items-center gap-3 text-white">
                <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-emerald-400/[0.16] text-emerald-300">
                  <Keyboard className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                Keyboard Shortcuts
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="pressable group -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 hover:text-white"
              >
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[rgb(118_118_128/0.28)] transition-colors group-hover:bg-[rgb(118_118_128/0.42)]">
                  <X size={15} strokeWidth={2.6} />
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={(shortcut.modifier || '') + shortcut.key + shortcut.description}
                  className="flex min-h-[44px] items-center justify-between gap-3 border-b border-[rgb(84_84_88/0.4)] py-2"
                >
                  <span className="text-[15px] text-slate-200">{shortcut.description}</span>
                  <Keycap>
                    {(shortcut.modifier ? `${shortcut.modifier.toUpperCase()}+` : '') +
                      (shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)}
                  </Keycap>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-[13px] text-slate-500">
              Press <Keycap>ESC</Keycap> to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsOverlay;
