import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { PURCHASE_URL, setAccessTier, validateAccessCode } from '../services/accessControl';

interface UnlockModalProps {
  open: boolean;
  title: string;
  description: string;
  perks?: string[];
  onUnlocked: () => void;
  onClose?: () => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ open, title, description, perks, onUnlocked, onClose }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidating) return;
    setIsValidating(true);
    setError('');
    const ok = await validateAccessCode(code);
    setIsValidating(false);
    if (ok) {
      setAccessTier('full');
      setCode('');
      onUnlocked();
    } else {
      setError("That code didn't work. Check it and try again.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Lock className="text-emerald-400" size={22} />
              </div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-slate-400 text-sm mt-2">{description}</p>
            </div>

            {perks && perks.length > 0 && (
              <ul className="mb-4 space-y-1.5">
                {perks.map(perk => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-slate-300">
                    <Sparkles size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your access code..."
                autoFocus
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all mb-3"
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center mb-3"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isValidating || !code.trim()}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? 'Checking…' : 'Unlock Full Game'}
              </button>
            </form>

            {PURCHASE_URL && (
              <a
                href={PURCHASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-emerald-400 hover:text-emerald-300 text-sm mt-4"
              >
                Don't have a code? Get one here →
              </a>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="block w-full text-center text-slate-500 hover:text-slate-300 text-sm mt-3 transition-colors"
              >
                Not now
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnlockModal;
