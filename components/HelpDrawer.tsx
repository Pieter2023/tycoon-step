import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

type HelpDrawerProps = {
  title: string;
  summary?: string;
  content: React.ReactNode;
  isGloballyHidden?: boolean;
};

const HelpDrawer: React.FC<HelpDrawerProps> = ({
  title,
  summary,
  content,
  isGloballyHidden = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isGloballyHidden && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-500 transition"
        aria-label={`Show ${title}`}
      >
        <Info size={16} />
      </button>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-3 text-left ${
          isOpen ? 'px-4 pt-4 pb-3' : 'px-4 py-3'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-center">
            <Info size={16} className="text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            {summary && <p className="text-xs text-slate-400">{summary}</p>}
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          {content}
        </div>
      )}
    </div>
  );
};

export default HelpDrawer;
