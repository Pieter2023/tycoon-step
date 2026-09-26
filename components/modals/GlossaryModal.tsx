import React from 'react';
import Modal from '../Modal';
import { GLOSSARY_ENTRIES } from '../../data/learning';
import { SheetItem, SheetStagger } from './sheet';

// Glossary of financial terms, reachable from the learn surfaces.
interface GlossaryModalProps {
  onClose: () => void;
}

const GlossaryModal: React.FC<GlossaryModalProps> = ({ onClose }) => (
  <Modal
    isOpen
    onClose={onClose}
    ariaLabel="Glossary"
    closeOnOverlayClick
    closeOnEsc
    contentClassName="max-w-2xl! overflow-hidden"
  >
    <SheetStagger className="flex flex-col" gap={0.05}>
      <SheetItem className="px-5 pb-3 pr-14 pt-6 sm:px-6">
        <h2 className="t-title-1 text-white">Glossary</h2>
        <p className="mt-1 text-[15px] text-slate-400">
          Quick definitions to help you learn without slowing down gameplay.
        </p>
      </SheetItem>
      <SheetItem>
        {/* The list scrolls under a soft fade rather than a hard divider. */}
        <div
          className="max-h-[60vh] overflow-y-auto overscroll-contain px-5 pb-6 pt-1 sm:px-6"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 20px), transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 20px), transparent 100%)'
          }}
        >
          <dl className="list-group">
            {GLOSSARY_ENTRIES.map((entry) => (
              <div key={entry.term} className="list-row block py-3">
                <dt className="text-[15px] font-semibold text-white">{entry.term}</dt>
                <dd className="mt-0.5 text-[14px] leading-[1.45] text-slate-400">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </SheetItem>
    </SheetStagger>
  </Modal>
);

export default GlossaryModal;
