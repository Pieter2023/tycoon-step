import { getLocale, type Locale } from './index';
import { QUALITY_SETTINGS, type QualityLevel } from '../components/town/townQuality';

// Bilingual copy for the 3D city. The city's panels and services build sentences from live
// numbers, so instead of key lookups each string carries its English and Spanish side by side:
// tl('Walk to teller', 'Ir al cajero'). English is returned unless the game locale is Spanish,
// so every existing English test and receipt stays exact. Services that produce copy for the
// city (journeys, advisor, challenges, incidents, workplace) read the locale at call time, which
// keeps them pure functions of state and deterministic for the daily challenge.
let override: Locale | null = null;
// Tests and tools can pin the city locale without mounting the provider.
export const setTownLocaleOverride = (locale: Locale | null) => { override = locale; };
export const townLocale = (): Locale => override ?? getLocale();
export const tl = (en: string, es: string): string => (townLocale() === 'es' ? es : en);
export const isSpanish = () => townLocale() === 'es';

// Labels that come from data tables rather than sentences.
export const seasonName = (season: string) => ({ WINTER: tl('WINTER', 'INVIERNO'), SPRING: tl('SPRING', 'PRIMAVERA'), SUMMER: tl('SUMMER', 'VERANO'), AUTUMN: tl('AUTUMN', 'OTOÑO') } as Record<string, string>)[season.toUpperCase()] ?? season;
export const timeOfDayName = (label: string) => ({ MORNING: tl('MORNING', 'MAÑANA'), MIDDAY: tl('MIDDAY', 'MEDIODÍA'), EVENING: tl('EVENING', 'ATARDECER'), NIGHT: tl('NIGHT', 'NOCHE') } as Record<string, string>)[label.toUpperCase()] ?? label;
export const qualityName = (level: QualityLevel) => ({ high: tl('Detailed', 'Detallado'), medium: tl('Balanced', 'Equilibrado'), low: tl('Smooth', 'Fluido') })[level];
export const qualityDetail = (level: QualityLevel) => ({ high: tl(QUALITY_SETTINGS.high.detail, 'Resolución completa y sombras suaves.'), medium: tl(QUALITY_SETTINGS.medium.detail, 'Menos resolución, sombras más simples.'), low: tl(QUALITY_SETTINGS.low.detail, 'Sin sombras; lo más estable en teléfonos antiguos.') })[level];

// The four shopfronts come from a data table in townWorld.ts; their Spanish copy lives here.
const PLACE_ES: Record<string, { name: string; question: string; lesson: string }> = {
  bank: { name: 'Banco Comunitario', question: '¿Cuánto efectivo debe quedar a la mano?', lesson: 'Una reserva compra margen cuando llega una factura. Compara el interés con el acceso a tu dinero antes de perseguir una tasa mayor.' },
  exchange: { name: 'Bolsa de Valores', question: '¿Crecimiento del precio o dinero en tu bolsillo?', lesson: 'Los dividendos son pagos en efectivo. Un precio que sube es una ganancia en papel hasta que vendes. Aquí el Bitcoin no paga ingresos y su precio puede caer con fuerza.' },
  business: { name: 'Negocios de Main Street', question: '¿El negocio se pagará solo?', lesson: 'Las ventas no son ganancia. Reabastecer, el personal y los meses flojos importan. Compara el ingreso operativo con el efectivo que comprometes; el modelo usa costos simplificados.' },
  property: { name: 'Inmobiliaria', question: '¿Puedes sostener la propiedad en un mal mes?', lesson: 'La renta es solo el punto de partida. El mantenimiento y los pagos del préstamo reducen lo que conservas. Deja margen para reparaciones y vacancias.' },
};
export const placeName = (id: string, fallback: string) => (isSpanish() ? PLACE_ES[id]?.name : undefined) ?? fallback;
export const placeQuestion = (id: string, fallback: string) => (isSpanish() ? PLACE_ES[id]?.question : undefined) ?? fallback;
export const placeLesson = (id: string, fallback: string) => (isSpanish() ? PLACE_ES[id]?.lesson : undefined) ?? fallback;
