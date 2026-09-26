import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type TooltipProps = {
  content: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

const Tooltip: React.FC<TooltipProps> = ({ content, className = '', children }) => {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className}`.trim()}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
      >
        {children}
      </span>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.26 }}
            style={{ transformOrigin: 'top right' }}
            className="ds-tooltip top-full mt-2 right-0"
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

export default Tooltip;
