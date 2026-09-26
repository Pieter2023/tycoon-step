import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { PURCHASE_PRICE, PURCHASE_URL, setAccessTier, validateAccessCode } from '../services/accessControl';
import { track } from '../services/analytics';
import { materialize, springs } from './ui/motion';
import { SheetEmblem, SheetItem, SheetStagger, useSheetReducedMotion } from './modals/sheet';

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
  // Buying is the primary action; the access-code field is the secondary path
  // (for classroom codes and for buyers pasting the Gumroad license key they
  // just received). Keep it tucked away until asked for.
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const reduce = useSheetReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidating) return;
    setIsValidating(true);
    setError('');
    const ok = await validateAccessCode(code);
    setIsValidating(false);
    if (ok) {
      setAccessTier('full');
      track('purchase_unlocked');
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
          animate={{ opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-[6px]"
        >
          <motion.div
            variants={reduce ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } } : materialize}
            initial="hidden"
            animate="show"
            exit="exit"
            className="mat-sheet relative my-auto w-full max-w-md overflow-hidden rounded-[28px]"
          >
            {/* A soft green glow behind the lock: the full game is one step away. */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(90%_80%_at_50%_0%,rgb(48_209_88/0.2),rgb(100_210_255/0.06)_55%,transparent_80%)]" />

            <SheetStagger className="relative px-6 pb-6 pt-8" gap={0.05} delay={0.06}>
              <SheetItem className="text-center">
                <SheetEmblem className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-b from-emerald-400/[0.28] to-emerald-400/[0.12] text-emerald-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_10px_30px_-12px_rgb(48_209_88/0.6)]">
                  <Lock size={28} strokeWidth={2.2} />
                </SheetEmblem>
                <h2 className="t-title-2 mt-4 text-white text-balance">{title}</h2>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-snug text-slate-400">{description}</p>
              </SheetItem>

              {perks && perks.length > 0 && (
                <SheetItem className="mt-5">
                  <ul className="list-group">
                    {perks.map(perk => (
                      <li key={perk} className="list-row min-h-[44px] gap-3 py-2.5 text-[15px] text-slate-200">
                        <span aria-hidden className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[#03170a]">
                          <Check size={14} strokeWidth={3} />
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </SheetItem>
              )}

              {/* Price + primary buy action — never hide the price behind a click-out. */}
              {PURCHASE_URL && (
                <SheetItem className="mt-6">
                  <div className="mb-3 flex items-baseline justify-center gap-2">
                    <span className="num font-display text-[40px] font-bold leading-none tracking-[-0.03em] text-white">{PURCHASE_PRICE}</span>
                    <span className="text-[14px] text-slate-400">one-time · yours forever · no subscription</span>
                  </div>
                  <a
                    href={PURCHASE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('gumroad_click')}
                    className="btn-primary min-h-[52px] w-full px-5 text-[17px]"
                  >
                    Get the full game — {PURCHASE_PRICE}
                  </a>
                </SheetItem>
              )}

              {/* Secondary: access-code entry (classroom codes / Gumroad license key). */}
              <SheetItem>
                {!showCodeEntry ? (
                  <button
                    type="button"
                    onClick={() => setShowCodeEntry(true)}
                    className="pressable mx-auto mt-3 flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-medium text-[#0a84ff] hover:bg-[rgb(118_118_128/0.18)]"
                  >
                    I already have an access code →
                  </button>
                ) : (
                  <motion.form
                    onSubmit={handleSubmit}
                    className="mt-4"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduce ? { duration: 0.2 } : springs.smooth}
                  >
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Paste your access or license code…"
                      autoFocus
                      className="mb-3 w-full rounded-[14px] bg-[rgb(118_118_128/0.2)] px-4 py-3 text-[16px] sm:text-[15px] text-white placeholder-slate-500"
                    />

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 text-center text-[14px] text-red-300"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={isValidating || !code.trim()}
                      className="btn-secondary min-h-[48px] w-full px-5 text-[16px]"
                    >
                      {isValidating ? 'Checking…' : 'Unlock with code'}
                    </button>
                  </motion.form>
                )}
              </SheetItem>

              {onClose && (
                <SheetItem>
                  <button
                    onClick={onClose}
                    className="pressable mx-auto mt-1 block rounded-full px-4 py-2 text-[15px] text-slate-400 hover:text-slate-200"
                  >
                    Not now
                  </button>
                </SheetItem>
              )}
            </SheetStagger>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnlockModal;
