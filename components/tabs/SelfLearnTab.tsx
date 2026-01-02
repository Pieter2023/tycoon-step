import React, { useState } from 'react';
import { BookOpen, ChevronDown, HeartPulse, Users, Zap } from 'lucide-react';
import { GameState } from '../../types';
import SalesCertificationPanel from '../SalesCertificationPanel';
import UpgradeEQTab from '../UpgradeEQTab';
import MasterNegotiationsTab from '../MasterNegotiationsTab';
import { useI18n } from '../../i18n';

type SelfLearnTabProps = {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  formatMoney: (value: number) => string;
};

type SectionId = 'sales' | 'eq' | 'negotiations';

const SelfLearnTab: React.FC<SelfLearnTabProps> = ({ gameState, setGameState, formatMoney }) => {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<SectionId>('sales');
  const [menuOpen, setMenuOpen] = useState(false);

  const sections: Array<{ id: SectionId; label: string; icon: React.ReactNode }> = [
    { id: 'sales', label: t('selfLearn.salesTraining'), icon: <Zap size={16} /> },
    { id: 'eq', label: t('tabs.upgradeEq'), icon: <HeartPulse size={16} /> },
    { id: 'negotiations', label: t('tabs.negotiations'), icon: <Users size={16} /> },
  ];
  const activeLabel = sections.find((section) => section.id === activeSection)?.label ?? '';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2 text-slate-300 text-xs uppercase tracking-wide">
          <BookOpen size={14} />
          <span>{t('tabs.selfLearn')}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border bg-slate-900/60 border-slate-700 text-slate-200 flex items-center gap-2"
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
          >
            {activeLabel}
            <ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          {menuOpen && (
            <div
              role="listbox"
              className="absolute mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-xl p-2 z-10"
            >
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setMenuOpen(false);
                  }}
                  role="option"
                  aria-selected={activeSection === section.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                    activeSection === section.id
                      ? 'bg-emerald-600/20 text-emerald-100'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeSection === 'sales' && (
        <SalesCertificationPanel
          gameState={gameState}
          setGameState={setGameState}
          formatMoney={formatMoney}
        />
      )}

      {activeSection === 'eq' && (
        <UpgradeEQTab gameState={gameState} setGameState={setGameState} />
      )}

      {activeSection === 'negotiations' && (
        <MasterNegotiationsTab gameState={gameState} setGameState={setGameState} />
      )}
    </div>
  );
};

export default SelfLearnTab;
