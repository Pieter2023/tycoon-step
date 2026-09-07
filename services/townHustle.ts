import type { GameState, SideHustle } from '../types';
import { SIDE_HUSTLES, EDUCATION_OPTIONS } from '../constants';
import { calculateSideHustleIncomeEstimate } from './gameLogic';
import { tl } from '../i18n/town';

// The side-hustle desk at home. Reads the same catalogue, state and income model as the Life tab
// and explains each hustle in the city's terms: what it pays a month on the teaching estimate,
// what it costs in hours, energy and stress, how exposed it is to automation, and why it cannot
// be started yet. Starting and stopping go through App's existing handlers.
export type HustleCard = { hustle: SideHustle; active?: SideHustle; monthly: number; canStart: boolean; reason?: string; requirement?: string; nextMilestoneIn?: number };
const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export const hustleMonthly = (state: GameState, hustle: SideHustle) => calculateSideHustleIncomeEstimate({ ...state, activeSideHustles: [hustle], tempSideHustleMultiplier: 1 });
export const nextMilestone = (hustle: SideHustle): { index: number; monthsLeft: number } | null => {
  const index = (hustle.upgrades ?? []).length, milestone = (hustle.milestones ?? [])[index];
  return milestone ? { index, monthsLeft: Math.max(0, milestone.monthsRequired - (hustle.monthsActive ?? 0)) } : null;
};
export function hustleCards(state: GameState): HustleCard[] {
  const level = state.career?.level ?? state.playerJob?.level ?? 0, degrees = state.education.degrees.map(id => EDUCATION_OPTIONS.find(e => e.id === id)?.category).filter(Boolean);
  return SIDE_HUSTLES.map(hustle => {
    const active = state.activeSideHustles.find(h => h.id === hustle.id);
    const requirement = [hustle.requiredEducation?.length ? `${tl('needs', 'requiere')} ${hustle.requiredEducation.map(r => r.replace(/_/g, ' ').toLowerCase()).join(` ${tl('or', 'o')} `)} ${tl('education', 'estudios')}` : '', hustle.requiredCareerLevel ? `${tl('career level', 'nivel de carrera')} ${hustle.requiredCareerLevel}+` : '', hustle.requiredCareerPath?.length ? `${tl('for', 'para')} ${hustle.requiredCareerPath.map(p => p.toLowerCase()).join('/')}` : ''].filter(Boolean).join(' · ') || undefined;
    let reason: string | undefined;
    if (active) reason = tl('Already running.', 'Ya está en marcha.');
    else if (state.cash < hustle.startupCost) reason = `${tl('Needs', 'Necesita')} ${money(hustle.startupCost)} ${tl('to start.', 'para empezar.')}`;
    else if (hustle.requiredEducation?.length && !hustle.requiredEducation.some(r => degrees.includes(r))) reason = tl('Needs a relevant qualification first.', 'Primero necesita un título relevante.');
    else if (hustle.requiredCareerLevel && level < hustle.requiredCareerLevel) reason = `${tl('Unlocks at career level', 'Se desbloquea en el nivel de carrera')} ${hustle.requiredCareerLevel}.`;
    else if (hustle.requiredCareerPath?.length && (!state.career?.path || !hustle.requiredCareerPath.includes(state.career.path))) reason = tl('Only for a specific career path.', 'Solo para una carrera específica.');
    else if (state.stats.energy < hustle.energyCost) reason = tl('Not enough energy this month.', 'No tienes energía suficiente este mes.');
    return { hustle, active, monthly: hustleMonthly(state, active ?? { ...hustle, upgrades: [] }), canStart: !reason, reason, requirement, nextMilestoneIn: active ? nextMilestone(active)?.monthsLeft : undefined };
  });
}
export function hustleDeskSummary(state: GameState) {
  const active = state.activeSideHustles;
  return { count: active.length, hours: active.reduce((s, h) => s + h.hoursPerWeek, 0), monthly: calculateSideHustleIncomeEstimate(state), energyCost: active.reduce((s, h) => s + h.energyCost, 0), stressCost: active.reduce((s, h) => s + h.stressIncrease, 0), exposure: active.length ? active.reduce((s, h) => s + h.aiVulnerability, 0) / active.length : 0 };
}
