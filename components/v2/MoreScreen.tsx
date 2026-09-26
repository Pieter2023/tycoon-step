import { useI18n } from '../../i18n';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  FastForward,
  GraduationCap,
  HeartPulse,
  LineChart,
  Play,
  Save,
  Settings,
  Trophy,
  Volume2,
  VolumeX,
  WalletCards
} from 'lucide-react';
import SegmentedControl from '../ui/SegmentedControl';
import { MOTION_DISABLED, riseIn, stagger } from '../ui/motion';

type MoreScreenProps = {
  onNavigate: (path: string) => void;
  onOpenSaveManager: () => void;
  onOpenRunCard?: () => void;
  onOpenQuests: () => void;
  onOpenGlossary: () => void;
  onOpenTutorials?: () => void;
  onOpenAccessibility: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  showNextMonthPreview: boolean;
  onToggleMonthPreview: (value: boolean) => void;
  autoplayEnabled: boolean;
  autoplayLabel: string;
  autoplaySpeed: number | null;
  autoplaySpeedOptions: number[];
  autoplaySpeedLabels: Record<number, string>;
  onToggleAutoplay: () => void;
  onSetAutoplaySpeed: (speed: number) => void;
};

/** iOS Settings glyph: a solid rounded square with a white symbol. */
const Glyph: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span
    aria-hidden
    className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[8px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] transition-colors duration-300"
    style={{ background: color }}
  >
    {children}
  </span>
);

const NavRow: React.FC<{ color: string; icon: React.ReactNode; label: string; onClick: () => void }> = ({ color, icon, label, onClick }) => (
  <button type="button" onClick={onClick} className="list-row w-full text-left">
    <Glyph color={color}>{icon}</Glyph>
    <span className="flex-1 text-[15px] font-medium tracking-[-0.01em] text-white">{label}</span>
    <ChevronRight size={16} className="text-slate-600" aria-hidden />
  </button>
);

/**
 * An iOS switch: 51×31 capsule, the knob springs across, and it stretches toward the far side while
 * pressed (the response starts on pointer-down, not on release).
 */
const Switch: React.FC<{ checked: boolean; onToggle: () => void; label: string; title?: string }> = ({ checked, onToggle, label, title }) => {
  const [pressed, setPressed] = useState(false);
  const stretch = pressed ? 6 : 0;
  const release = () => setPressed(false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title}
      onClick={onToggle}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onBlur={release}
      className={`relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-[2px] transition-colors duration-300 ease-out ${
        checked ? 'bg-[#30d158]' : 'bg-[rgb(120_120_128/0.32)]'
      }`}
    >
      <motion.span
        aria-hidden
        className="block h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.25),0_1px_1px_rgb(0_0_0/0.16)]"
        initial={false}
        animate={{ width: 27 + stretch, x: checked ? 20 - stretch : 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
      />
    </button>
  );
};

const SectionHeader: React.FC<{ as?: 'h2' | 'h3'; children: React.ReactNode }> = ({ as: Tag = 'h3', children }) => (
  <Tag className="mb-2 px-4 text-[13px] font-semibold text-slate-400">{children}</Tag>
);

const MoreScreen: React.FC<MoreScreenProps> = ({
  onNavigate,
  onOpenSaveManager,
  onOpenRunCard,
  onOpenQuests,
  onOpenGlossary,
  onOpenTutorials,
  onOpenAccessibility,
  onToggleSound,
  soundEnabled,
  showNextMonthPreview,
  onToggleMonthPreview,
  autoplayEnabled,
  autoplayLabel,
  autoplaySpeed,
  autoplaySpeedOptions,
  autoplaySpeedLabels,
  onToggleAutoplay,
  onSetAutoplaySpeed
}) => {
  const { t } = useI18n();
  const enter = MOTION_DISABLED ? { initial: false as const, animate: 'show' } : { initial: 'hidden', animate: 'show' };

  return (
    <motion.div className="space-y-7" variants={stagger(0.05)} {...enter}>
      <motion.section variants={riseIn}>
        <SectionHeader as="h2">{t('shell.moreScreen.explore')}</SectionHeader>
        <div className="list-group list-group--icons">
          <NavRow color="#0a84ff" icon={<WalletCards size={16} />} label={t('shell.moreScreen.money')} onClick={() => onNavigate('/money')} />
          <NavRow color="#ff9f0a" icon={<BriefcaseBusiness size={16} />} label={t('shell.moreScreen.career')} onClick={() => onNavigate('/career')} />
          <NavRow color="#bf5af2" icon={<GraduationCap size={16} />} label={t('shell.moreScreen.learn')} onClick={() => onNavigate('/learn')} />
          <NavRow color="#ff375f" icon={<HeartPulse size={16} />} label={t('shell.moreScreen.life')} onClick={() => onNavigate('/life')} />
        </div>
      </motion.section>

      <motion.section variants={riseIn}>
        <SectionHeader>{t('shell.moreScreen.utilities')}</SectionHeader>
        <div className="list-group list-group--icons">
          <NavRow color="#0a84ff" icon={<Save size={16} />} label={t('shell.moreScreen.save_load')} onClick={onOpenSaveManager} />
          {onOpenRunCard && (
            <NavRow color="#5e5ce6" icon={<LineChart size={16} />} label={t('shell.moreScreen.run_summary_card')} onClick={onOpenRunCard} />
          )}
          <NavRow color="#ff9f0a" icon={<Trophy size={16} />} label={t('shell.moreScreen.quests')} onClick={onOpenQuests} />
          <NavRow color="#30b0c7" icon={<BookOpen size={16} />} label={t('shell.moreScreen.glossary')} onClick={onOpenGlossary} />
          {onOpenTutorials && (
            <NavRow color="#ff453a" icon={<Play size={16} fill="currentColor" />} label={t('shell.moreScreen.tutorial_videos')} onClick={onOpenTutorials} />
          )}
          <NavRow color="#8e8e93" icon={<Settings size={16} />} label={t('shell.moreScreen.accessibility')} onClick={onOpenAccessibility} />
        </div>
      </motion.section>

      <motion.section variants={riseIn}>
        <div className="list-group list-group--icons">
          <div className="list-row">
            <Glyph color={autoplayEnabled ? '#ff9f0a' : '#636366'}>
              <FastForward size={16} fill="currentColor" />
            </Glyph>
            <span className="flex-1 text-[15px] font-medium tracking-[-0.01em] text-white">{t('shell.moreScreen.autoplay')}</span>
            <Switch checked={autoplayEnabled} onToggle={onToggleAutoplay} label={t('shell.moreScreen.autoplay')} title={autoplayLabel} />
          </div>
          <div className={`list-row pl-[57px] transition-opacity duration-300 ${autoplayEnabled ? '' : 'opacity-50'}`}>
            <SegmentedControl<string>
              role="group"
              size="sm"
              fill
              className="flex-1"
              value={autoplaySpeed != null ? String(autoplaySpeed) : ''}
              onChange={(value) => onSetAutoplaySpeed(Number(value))}
              options={autoplaySpeedOptions.map((speed) => ({
                value: String(speed),
                label: autoplaySpeedLabels[speed] || '1x',
                disabled: !autoplayEnabled
              }))}
            />
          </div>
          <div className="list-row">
            <Glyph color={soundEnabled ? '#ff375f' : '#636366'}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </Glyph>
            <span className="flex-1 text-[15px] font-medium tracking-[-0.01em] text-white">{t('shell.moreScreen.sound')}</span>
            <Switch
              checked={soundEnabled}
              onToggle={onToggleSound}
              label={t('shell.moreScreen.sound')}
              title={soundEnabled ? t('shell.moreScreen.mute') : t('shell.moreScreen.unmute')}
            />
          </div>
          <div className="list-row">
            <Glyph color="#30b0c7">
              <CalendarClock size={16} />
            </Glyph>
            <span className="flex-1 text-[15px] font-medium tracking-[-0.01em] text-white">{t('shell.moreScreen.show_month_preview')}</span>
            <Switch
              checked={showNextMonthPreview}
              onToggle={() => onToggleMonthPreview(!showNextMonthPreview)}
              label={t('shell.moreScreen.show_month_preview')}
            />
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default MoreScreen;
