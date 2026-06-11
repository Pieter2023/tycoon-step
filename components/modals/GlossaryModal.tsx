import React from 'react';
import Modal from '../Modal';
import { GLOSSARY_ENTRIES } from '../../data/learning';

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
    contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full"
  >
    <h2 className="text-xl font-bold text-white mb-2">Glossary</h2>
    <p className="text-slate-400 text-sm mb-4">
      Quick definitions to help you learn without slowing down gameplay.
    </p>
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {GLOSSARY_ENTRIES.map((entry) => (
        <div key={entry.term} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
          <p className="text-sm font-semibold text-white">{entry.term}</p>
          <p className="text-sm text-slate-300 mt-1">{entry.definition}</p>
        </div>
      ))}
    </div>
  </Modal>
);

export default GlossaryModal;
