import React, { useState } from 'react';

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
      {open && (
        <span className="ds-tooltip top-full mt-2 right-0">
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
