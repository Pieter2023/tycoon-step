import { describe, it, expect, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { GameState } from '../types';
import { tl, setTownLocaleOverride, seasonName, qualityName } from '../i18n/town';
import { cityCaption, guideLabel } from '../components/town/townGuide';
import { activeJourney, tourJourney } from '../services/townJourney';
import { monthlyChallenges } from '../services/townChallenges';
import { adviseFrom } from '../services/townAdvisor';
import { marketMood } from '../services/townMarket';
import { managerLine, payStub } from '../services/townWork';
import { reputationLabel } from '../services/townCafe';
import { serviceTask, createCafeService } from '../services/cafeService';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 500, month: 3, career: { path: 'TECH', title: 'Junior Developer', salary: 5500, level: 1, experience: 10, skills: {}, aiVulnerability: .4, futureProofScore: 65 } });
afterEach(() => setTownLocaleOverride(null));

describe('Spanish city copy', () => {
  it('stays exact English by default and switches every layer when the locale is Spanish', () => {
    expect(tl('Bank', 'Banco')).toBe('Bank');
    expect(activeJourney(base()).title).toBe('Start with a safety net');
    setTownLocaleOverride('es');
    expect(tl('Bank', 'Banco')).toBe('Banco');
    expect(activeJourney(base()).title).toBe('Empieza con una red de seguridad');
    expect(tourJourney({ ...base(), townProgress: { journeyCompletedMonth: 1, investorCompletedMonth: 2 } }).milestones[0].title).toMatch(/recibo de sueldo/);
    expect(monthlyChallenges(base())[0].title).toBe('Termina el mes con la reserva completa');
    expect(adviseFrom(base())[0].title).toMatch(/efectivo no cubre/);
    expect(marketMood('EXPANSION', false).label).toBe('Expansión');
    expect(managerLine(base())).toMatch(/meses más y hablamos de Developer/);
    expect(payStub(base()).lines[0].label).toMatch(/sueldo base/);
    expect(reputationLabel(90)).toBe('La sensación del barrio');
    expect(cityCaption({ ...base(), hasWon: true }, 'city').day).toBe('DÍA DE LA LIBERTAD');
    expect(seasonName('WINTER')).toBe('INVIERNO'); expect(qualityName('low')).toBe('Fluido');
    expect(guideLabel({ journey: { completed: false, action: 'bank', button: 'Go', step: 0, stage: 1 }, room: 'city', near: 'bank', spot: null, showDetails: false, journal: false, serviceActive: false, hasCafe: false })).toBe('Entrar al banco');
    const shift = createCafeService(3, { price: 4, stock: 6, helper: false, pace: 'relaxed' }, { seats: false, machine: false });
    expect(serviceTask(shift)?.verb ?? '').not.toMatch(/Take|Next guest|Make/);
  });
});
