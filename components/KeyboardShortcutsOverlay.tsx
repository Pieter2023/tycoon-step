import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { ShortcutConfig } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutConfig[];
}

const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({
  isOpen,
  onClose,
  shortcuts,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-8 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-emerald-400" />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {shortcuts.map((shortcut) => (
                <div
                  key={(shortcut.modifier || '') + shortcut.key + shortcut.description}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <span className="text-slate-300 text-sm">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-emerald-300 font-mono">
                    {(shortcut.modifier ? `${shortcut.modifier.toUpperCase()}+` : '') +
                      (shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="text-center text-slate-500 text-sm mt-6">
              Press <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-emerald-300 font-mono">ESC</kbd> to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsOverlay;
