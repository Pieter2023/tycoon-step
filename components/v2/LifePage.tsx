import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Home, Users } from 'lucide-react';
import Modal from '../Modal';
import LifestyleTab from '../tabs/LifestyleTab';
import SideHustlesTab from '../tabs/SideHustlesTab';
import { CAREER_PATHS, LIFESTYLE_OPTS } from '../../constants';
import { GameState, SideHustle, TabId, TABS } from '../../types';

type LifePageLayoutProps = {
  gameState: GameState;
  cashFlow: any;
  formatMoney: (value: number) => string;
  handleChangeLifestyle: (value: any) => void;
  coachLifestyleGridRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
  coachHint: any;
  InfoTip: React.FC<{ id: string; text: string }>;
  getHustleUpgradeLabel: (hustle: SideHustle, idx: number, upgradeId: string) => string | null;
  getNextHustleMilestone: (hustle: SideHustle) => any;
  handleStartSideHustle: (hustle: SideHustle) => void;
  handleStopSideHustle: (hustleId: string) => void;
  setShowSideHustleUpgradeModal: (open: boolean) => void;
  coachSideHustlesRef: React.RefObject<HTMLDivElement>;
  forcedTab?: 'lifestyle' | 'sidehustles';
};

export const LifePageLayout: React.FC<LifePageLayoutProps> = ({
  gameState,
  cashFlow,
  formatMoney,
  handleChangeLifestyle,
  coachLifestyleGridRef,
  coachHighlight,
  coachHint,
  InfoTip,
  getHustleUpgradeLabel,
  getNextHustleMilestone,
  handleStartSideHustle,
  handleStopSideHustle,
  setShowSideHustleUpgradeModal,
  coachSideHustlesRef,
  forcedTab
}) => {
  const [activeTab, setActiveTab] = useState<'lifestyle' | 'sidehustles' | 'family'>('lifestyle');
  const [openDetail, setOpenDetail] = useState<'lifestyle' | 'sidehustles' | 'family' | null>(null);

  useEffect(() => {
    if (!forcedTab) return;
    setActiveTab(forcedTab);
  }, [forcedTab]);

  const lifestyle = LIFESTYLE_OPTS[gameState.lifestyle];
  const familySummary = useMemo(() => {
    const spouse = gameState.family?.spouse;
    const childrenCount = gameState.family?.children?.length || 0;
    if (!spouse && !gameState.family?.isEngaged && !gameState.family?.inRelationship) {
      return 'Single';
    }
    if (gameState.family?.isEngaged) return 'Engaged';
    if (spouse) return `Married to ${spouse.name}`;
    if (gameState.family?.inRelationship) return 'In a relationship';
    return 'Family';
  }, [gameState.family]);

  const tabButtonClass = (tab: string) =>
    `rounded-full px-4 py-2 text-xs font-semibold border transition ${
      activeTab === tab
        ? 'border-white/80 bg-white text-slate-900 shadow-[0_0_18px_rgba(255,255,255,0.2)]'
        : 'border-slate-700/70 text-slate-200 hover:border-white/40 hover:text-white'
    }`;

  return (
    <div className="space-y-8">
      <section className="glass-panel p-6">
        <h2 className="text-2xl font-bold">Life</h2>
        <p className="mt-2 text-sm text-slate-400">
          Balance lifestyle, side hustles, and family decisions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Home size={16} className="text-emerald-300" /> Lifestyle
          </div>
          <p className="mt-2 text-lg font-semibold text-white capitalize">{gameState.lifestyle.toLowerCase()}</p>
          <p className="text-xs text-slate-400 mt-1">{formatMoney(lifestyle.cost)}/mo</p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('lifestyle');
              setOpenDetail('lifestyle');
            }}
            className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            View details
          </button>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users size={16} className="text-amber-300" /> Side Hustles
          </div>
          <p className="mt-2 text-lg font-semibold text-white">{gameState.activeSideHustles.length} active</p>
          <p className="text-xs text-slate-400 mt-1">{formatMoney(cashFlow.sideHustleIncome)}/mo income</p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('sidehustles');
              setOpenDetail('sidehustles');
            }}
            className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            View details
          </button>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Heart size={16} className="text-pink-300" /> Family
          </div>
          <p className="mt-2 text-lg font-semibold text-white">{familySummary}</p>
          <p className="text-xs text-slate-400 mt-1">Children: {gameState.family?.children?.length || 0}</p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('family');
              setOpenDetail('family');
            }}
            className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            View details
          </button>
        </div>
      </section>

      <section className="glass-panel p-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button type="button" className={tabButtonClass('lifestyle')} onClick={() => setActiveTab('lifestyle')}>
            Lifestyle
          </button>
          <button type="button" className={tabButtonClass('sidehustles')} onClick={() => setActiveTab('sidehustles')}>
            Side Hustles
          </button>
          <button type="button" className={tabButtonClass('family')} onClick={() => setActiveTab('family')}>
            Family
          </button>
        </div>

        <div className="glass-tile p-4 text-sm text-slate-300 flex items-center justify-between">
          <span>
            {activeTab === 'lifestyle' && 'Lifestyle choices affect expenses, happiness, and stats.'}
            {activeTab === 'sidehustles' && 'Manage side hustles, upgrades, and income.'}
            {activeTab === 'family' && 'Family events and relationships live here.'}
          </span>
          <button
            type="button"
            onClick={() => setOpenDetail(activeTab)}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            Open details
          </button>
        </div>
      </section>

      <Modal
        isOpen={openDetail === 'lifestyle'}
        onClose={() => setOpenDetail(null)}
        ariaLabel="Lifestyle"
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-4xl rounded-none rounded-l-3xl p-6 overflow-y-auto"
      >
        <LifestyleTab
          gameState={gameState}
          formatMoney={formatMoney}
          handleChangeLifestyle={handleChangeLifestyle}
          coachLifestyleGridRef={coachLifestyleGridRef}
          coachHighlight={coachHighlight}
          coachHint={coachHint}
          activeTab={TABS.LIFESTYLE as TabId}
          InfoTip={InfoTip}
        />
      </Modal>

      <Modal
        isOpen={openDetail === 'sidehustles'}
        onClose={() => setOpenDetail(null)}
        ariaLabel="Side Hustles"
        overlayClassName="items-center justify-center"
        contentClassName="h-[90vh] w-[96vw] max-w-6xl rounded-3xl p-6 overflow-y-auto"
      >
        <SideHustlesTab
          gameState={gameState}
          cashFlow={cashFlow}
          formatMoney={formatMoney}
          getHustleUpgradeLabel={getHustleUpgradeLabel}
          getNextHustleMilestone={getNextHustleMilestone}
          handleStartSideHustle={handleStartSideHustle}
          handleStopSideHustle={handleStopSideHustle}
          setShowSideHustleUpgradeModal={setShowSideHustleUpgradeModal}
          coachSideHustlesRef={coachSideHustlesRef}
          coachHighlight={coachHighlight}
        />
      </Modal>

      <Modal
        isOpen={openDetail === 'family'}
        onClose={() => setOpenDetail(null)}
        ariaLabel="Family"
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-3xl rounded-none rounded-l-3xl p-6 overflow-y-auto"
      >
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Family</h3>
          {!gameState.family?.spouse && !gameState.family?.isEngaged && !gameState.family?.inRelationship ? (
            <p className="text-slate-400 text-sm">Single - romance may come your way! 💕</p>
          ) : (
            <div className="space-y-3">
              {gameState.family?.inRelationship && !gameState.family?.isEngaged && !gameState.family?.spouse && (
                <div className="bg-pink-500/20 rounded-lg p-2 text-center">
                  <span className="text-pink-400 font-medium">💕 In a Relationship</span>
                </div>
              )}
              {gameState.family?.isEngaged && !gameState.family?.spouse && (
                <div className="bg-pink-500/20 rounded-lg p-2 text-center">
                  <span className="text-pink-400 font-medium">💍 Engaged!</span>
                </div>
              )}
              {gameState.family?.spouse && (
                <div>
                  <p className="text-white font-medium">👫 Married to {gameState.family.spouse.name}</p>
                  <p className="text-slate-400 text-xs">
                    {CAREER_PATHS[gameState.family.spouse.careerPath]?.icon} {CAREER_PATHS[gameState.family.spouse.careerPath]?.name} • {formatMoney(gameState.family.spouse.income)}/mo
                  </p>
                </div>
              )}
              {gameState.family?.children && gameState.family.children.length > 0 && (
                <div className="border-t border-slate-700 pt-2">
                  <p className="text-slate-400 text-xs mb-2">Children ({gameState.family.children.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {gameState.family.children.map(child => {
                      const ageMonths = gameState.month - child.birthMonth;
                      const isPreBorn = ageMonths < 0;
                      return (
                        <span key={child.id} className="px-2 py-1 bg-slate-700 rounded-full text-xs text-white">
                          {isPreBorn ? '🤰 Due soon' : `👶 ${child.name}, ${child.age}y`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

const LifePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-bold">Life</h2>
        <p className="mt-2 text-sm text-slate-400">
          Lifestyle choices, goals, and life events will be surfaced here.
        </p>
      </section>
    </div>
  );
};

export default LifePage;
