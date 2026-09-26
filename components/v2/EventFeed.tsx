import React from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  Car,
  CircleDot,
  Heart,
  House,
  LineChart,
  Newspaper,
  OctagonAlert,
  Receipt,
  Scale,
  ShieldAlert,
  Signpost,
  Sparkles,
  Stethoscope,
  Store,
  TriangleAlert,
  Trophy,
  Users
} from 'lucide-react';
import { LifeEvent } from '../../types';
import { useI18n } from '../../i18n';
import { MOTION_DISABLED, riseIn, stagger } from '../ui/motion';

type EventFeedProps = {
  events: LifeEvent[];
  limit?: number;
};

type Glyph = { icon: React.ReactNode; tone: string };

// Small tinted glyphs: the kind of event at a glance, coloured by what it means for the player.
const TONE = {
  green: 'bg-[#30d158]/[0.16] text-[#30d158]',
  cyan: 'bg-[#64d2ff]/[0.16] text-[#64d2ff]',
  blue: 'bg-[#0a84ff]/[0.2] text-[#409cff]',
  orange: 'bg-[#ff9f0a]/[0.16] text-[#ff9f0a]',
  red: 'bg-[#ff453a]/[0.16] text-[#ff6961]',
  pink: 'bg-[#ff375f]/[0.16] text-[#ff6482]',
  purple: 'bg-[#bf5af2]/[0.18] text-[#da8fff]',
  indigo: 'bg-[#5e5ce6]/[0.22] text-[#8e8cff]',
  yellow: 'bg-[#ffd60a]/[0.14] text-[#ffd60a]',
  gray: 'bg-white/[0.08] text-slate-400'
};

const glyphFor = (event: LifeEvent): Glyph => {
  const size = 14;
  const byType = (): Glyph => {
    switch (event.type) {
      case 'WINDFALL': return { icon: <Sparkles size={size} />, tone: TONE.green };
      case 'ACHIEVEMENT':
      case 'MILESTONE': return { icon: <Trophy size={size} />, tone: TONE.yellow };
      case 'WARNING': return { icon: <TriangleAlert size={size} />, tone: TONE.orange };
      case 'BANKRUPTCY': return { icon: <OctagonAlert size={size} />, tone: TONE.red };
      case 'DECISION': return { icon: <Signpost size={size} />, tone: TONE.blue };
      case 'NEWS': return { icon: <Newspaper size={size} />, tone: TONE.cyan };
      case 'TAX': return { icon: <Receipt size={size} />, tone: TONE.orange };
      case 'LEGAL': return { icon: <Scale size={size} />, tone: TONE.indigo };
      case 'FAMILY_EMERGENCY': return { icon: <Users size={size} />, tone: TONE.pink };
      case 'MEDICAL': return { icon: <Stethoscope size={size} />, tone: TONE.pink };
      case 'ECONOMIC': return { icon: <LineChart size={size} />, tone: TONE.cyan };
      case 'VEHICLE': return { icon: <Car size={size} />, tone: TONE.orange };
      case 'CAREER': return { icon: <BriefcaseBusiness size={size} />, tone: TONE.blue };
      case 'RELATIONSHIP': return { icon: <Heart size={size} />, tone: TONE.pink };
      case 'HOUSING': return { icon: <House size={size} />, tone: TONE.cyan };
      case 'AI_DISRUPTION': return { icon: <Bot size={size} />, tone: TONE.purple };
      case 'BUSINESS': return { icon: <Store size={size} />, tone: TONE.green };
      case 'CRIME': return { icon: <ShieldAlert size={size} />, tone: TONE.red };
      case 'SOCIAL': return { icon: <Users size={size} />, tone: TONE.cyan };
      default: return { icon: <CircleDot size={size} />, tone: TONE.gray };
    }
  };
  const glyph = byType();
  // A signed money impact outranks the category: green when it helped, red when it cost.
  if (typeof event.impact === 'number' && event.impact !== 0) {
    return { ...glyph, tone: event.impact > 0 ? TONE.green : TONE.red };
  }
  return glyph;
};

/** Recent life events as a timeline: tinted glyphs on a hairline rail, no boxes. */
const EventFeed: React.FC<EventFeedProps> = ({ events, limit = 10 }) => {
  const { t } = useI18n();
  const items = events.slice(0, limit);

  return (
    <div className="max-h-64 overflow-y-auto pr-1 glass-scroll">
      {items.length === 0 ? (
        <div className="flex items-center gap-3 py-1">
          <span aria-hidden className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONE.gray}`}><CalendarClock size={14} /></span>
          <p className="text-sm text-slate-400">{t('shell.eventFeed.advance_a_month_to_trigger')}</p>
        </div>
      ) : (
        <motion.ol
          className="relative"
          variants={stagger(0.045)}
          initial={MOTION_DISABLED ? false : 'hidden'}
          animate="show"
        >
          {items.map((event, index) => {
            const glyph = glyphFor(event);
            const last = index === items.length - 1;
            return (
              <motion.li key={event.id} variants={riseIn} className={`relative flex gap-3 ${last ? '' : 'pb-4'}`}>
                {!last && <span aria-hidden className="absolute bottom-0 left-[13.5px] top-8 w-px bg-white/[0.09]" />}
                <span aria-hidden className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${glyph.tone}`}>{glyph.icon}</span>
                <div className="min-w-0 flex-1 pt-[3px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold leading-5 text-white">{t(event.title)}</p>
                    <span className="num shrink-0 text-xs text-slate-500">M{event.month}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-[18px] text-slate-400">{t(event.description)}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      )}
    </div>
  );
};

export default EventFeed;
