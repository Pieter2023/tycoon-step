import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Briefcase,
  Brain,
  Heart,
  ChevronRight,
  Check,
  Bot,
} from 'lucide-react';
import { Character, DIFFICULTY_SETTINGS } from '../constants';
import { CareerPath } from '../types';

interface CharacterSelectProps {
  characters: Character[];
  selectedDifficulty: keyof typeof DIFFICULTY_SETTINGS;
  onSelectDifficulty: (diff: keyof typeof DIFFICULTY_SETTINGS) => void;
  onSelectCharacter: (char: Character) => void;
  onCreateCustom: () => void;
  formatMoney: (val: number) => string;
}

const careerIcons: Record<CareerPath, typeof TrendingUp> = {
  TECH: Zap,
  FINANCE: TrendingUp,
  HEALTHCARE: Heart,
  TRADES: Shield,
  CREATIVE: Sparkles,
  ENTREPRENEUR: Briefcase,
  GOVERNMENT: Users,
  SALES: Brain,
};

const difficultyColors = {
  EASY: 'from-emerald-500 to-teal-500',
  NORMAL: 'from-blue-500 to-cyan-500',
  HARD: 'from-amber-500 to-orange-500',
  EXPERT: 'from-rose-500 to-pink-500',
};

const CharacterSelect: React.FC<CharacterSelectProps> = ({
  characters,
  selectedDifficulty,
  onSelectDifficulty,
  onSelectCharacter,
  onCreateCustom,
  formatMoney,
}) => {
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const diffSettings = DIFFICULTY_SETTINGS[selectedDifficulty];

  const handleSelect = (char: Character) => {
    setSelectedChar(char.id);
    setTimeout(() => {
      onSelectCharacter(char);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            💰
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Choose Your Path</h1>
          <p className="text-slate-400 text-lg">Select a character to begin your journey to financial freedom</p>
        </motion.div>

        {/* Difficulty Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Select Difficulty</p>
            <div className="flex gap-3 flex-wrap justify-center">
              {(Object.keys(DIFFICULTY_SETTINGS) as Array<keyof typeof DIFFICULTY_SETTINGS>).map((diff) => (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectDifficulty(diff)}
                  className={`relative px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedDifficulty === diff
                      ? `bg-gradient-to-r ${difficultyColors[diff]} text-white shadow-lg shadow-${diff.toLowerCase()}-500/30`
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {selectedDifficulty === diff && (
                    <motion.div
                      layoutId="difficulty-indicator"
                      className="absolute inset-0 bg-white/20 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{DIFFICULTY_SETTINGS[diff].label}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-sm text-slate-500 max-w-md text-center">
              {diffSettings.description}
            </p>
          </div>
        </motion.div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {/* Custom Character Option */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateCustom}
            className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 cursor-pointer hover:border-emerald-400 transition-all flex flex-col items-center justify-center text-center min-h-[320px]"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition-colors">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Create Custom</h3>
            <p className="text-sm text-slate-400 mb-4">Build your own avatar and backstory</p>
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 text-sm font-medium border border-emerald-500/30">
              Optional
            </div>
          </motion.div>

          {/* Character Cards */}
          {characters.map((char, index) => {
            const CareerIcon = careerIcons[char.careerPath];
            const isHovered = hoveredChar === char.id;
            const isSelected = selectedChar === char.id;
            const futureProof = 85; // This would come from CAREER_PATHS
            const startingCash =
              diffSettings.startingCash +
              (char.startingBonus.type === 'cash' && char.startingBonus.amount > 0
                ? char.startingBonus.amount
                : 0);
            const hasDebt = char.startingBonus.amount < 0;

            return (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) + 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredChar(char.id)}
                onHoverEnd={() => setHoveredChar(null)}
                onClick={() => handleSelect(char)}
                className={`group relative bg-gradient-to-br from-slate-800/80 to-slate-900/60 border rounded-2xl p-6 cursor-pointer transition-all min-h-[320px] flex flex-col ${
                  isSelected
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'border-slate-700 hover:border-emerald-500/50'
                }`}
              >
                {/* Selected Indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Avatar */}
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${char.avatarColor} flex items-center justify-center text-3xl mb-4 mx-auto shadow-lg transition-transform group-hover:scale-110`}
                >
                  {char.avatarEmoji}
                </div>

                {/* Name & Career */}
                <h3 className="text-xl font-bold text-white text-center mb-1">{char.name}</h3>
                <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3">
                  <CareerIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{char.careerPath}</span>
                </div>

                {/* Backstory */}
                <p className="text-slate-400 text-sm text-center mb-4 line-clamp-2 flex-1">
                  {char.backstory}
                </p>

                {/* Perk */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Special Perk</p>
                  <p className="text-sm text-slate-200 font-medium">{char.perk.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{char.perk.description}</p>
                </div>

                {/* AI-Proof Rating */}
                <div
                  className={`rounded-lg p-2.5 mb-3 ${
                    futureProof >= 80
                      ? 'bg-emerald-900/30 border border-emerald-700/50'
                      : futureProof >= 50
                      ? 'bg-amber-900/30 border border-amber-700/50'
                      : 'bg-rose-900/30 border border-rose-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Bot className="w-4 h-4 text-slate-400" />
                    <span
                      className={`text-sm font-semibold ${
                        futureProof >= 80
                          ? 'text-emerald-400'
                          : futureProof >= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      AI-Proof: {futureProof}%
                    </span>
                  </div>
                </div>

                {/* Starting Stats */}
                <div className="text-center text-sm">
                  <span className="text-slate-500">Starting: </span>
                  <span className="text-white font-medium">{formatMoney(startingCash)}</span>
                  {hasDebt && (
                    <span className="text-rose-400 ml-1">
                      + {formatMoney(Math.abs(char.startingBonus.amount))} debt
                    </span>
                  )}
                </div>

                {/* Hover CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                  className="absolute inset-x-4 bottom-4"
                >
                  <div className="bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-center flex items-center justify-center gap-2">
                    Select Character
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-slate-500 text-sm"
        >
          <p>Each character has unique perks and starting conditions that affect your gameplay.</p>
          <p className="mt-1">AI-Proof rating indicates how vulnerable this career is to automation.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default CharacterSelect;
