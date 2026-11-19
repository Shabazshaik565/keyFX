import React, { useState } from 'react';
import { Play, Zap, SlidersHorizontal, Radio, Disc3, Sparkles, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { SoundProfile } from '../types';

interface SoundHeroProps {
  currentSound: SoundProfile;
  isEnabled: boolean;
  onTestSound: () => void;
  onOpenTuning: () => void;
  onOpenLibrary?: () => void;
  isKeyActive?: boolean;
}

export const SoundHero: React.FC<SoundHeroProps> = ({
  currentSound,
  isEnabled,
  onTestSound,
  onOpenTuning,
  onOpenLibrary,
  isKeyActive = false,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleTestClick = () => {
    setIsPlayingTest(true);
    onTestSound();
    setTimeout(() => setIsPlayingTest(false), 220);
  };

  const isActivePlayback = isPlayingTest || isKeyActive;

  // Spectrum frequency bar heights
  const SPECTRUM_BARS = [32, 55, 85, 45, 92, 100, 68, 88, 42, 95, 75, 52, 84, 38, 72, 96, 60, 80, 48, 90];

  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel-elevated p-6 border border-white/[0.1] shadow-2xl transition-all">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-neon-cyan/15 to-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-neon-purple/10 to-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Top Luminous RGB Accent Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan/80 to-transparent" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Switch Card & Identity */}
        <div className="flex items-center gap-5">
          {/* Tactile Disc Icon */}
          <div className="relative group flex-shrink-0">
            <motion.div
              animate={{
                scale: isActivePlayback ? [1, 1.08, 1] : 1,
                rotate: isActivePlayback ? [0, -4, 4, 0] : 0,
              }}
              transition={{ duration: 0.2 }}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-neon-cyan/20 via-blue-600/20 to-purple-600/25 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-glow-cyan-sm cursor-pointer overflow-hidden"
              onClick={handleTestClick}
              title="Click to test switch sound"
            >
              <Disc3 className={`w-9 h-9 sm:w-10 sm:h-10 ${isActivePlayback ? 'animate-spin' : ''}`} />
              <div className="absolute inset-0 bg-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            {isEnabled && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-neon-emerald text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-glow-emerald">
                LIVE
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 tracking-wider uppercase font-mono">
                {currentSound.category}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-neon-emerald bg-neon-emerald/10 px-2 py-0.5 rounded-md border border-neon-emerald/25 font-mono">
                <Zap className="w-3 h-3" /> Native &lt; 2ms
              </span>
              {currentSound.isCustom && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neon-purple/20 text-neon-purple border border-neon-purple/35 font-mono">
                  CUSTOM PACK
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {currentSound.name}
            </h2>
            <p className="text-xs text-slate-400 max-w-xl line-clamp-1 leading-relaxed">
              {currentSound.description}
            </p>
          </div>
        </div>

        {/* Dynamic Spectrum Waveform & Action Buttons */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          {/* Animated Waveform Visualizer */}
          <div className="flex items-center gap-1 h-11 px-4 py-2 rounded-xl bg-[#0B0F19]/90 border border-white/[0.08] shadow-inner">
            <Radio className="w-3.5 h-3.5 text-neon-cyan mr-1 animate-pulse" />
            {SPECTRUM_BARS.map((height, idx) => (
              <motion.div
                key={idx}
                animate={{
                  scaleY: isActivePlayback
                    ? [0.25, Math.min(1, (height / 100) * 1.3), 0.25]
                    : isEnabled
                    ? [0.2, height / 100, 0.2]
                    : 0.1,
                }}
                transition={{
                  repeat: isEnabled || isActivePlayback ? Infinity : 0,
                  duration: isActivePlayback ? 0.25 + (idx % 3) * 0.08 : 0.8 + (idx % 4) * 0.2,
                  ease: 'easeInOut',
                }}
                className={`w-1 rounded-full origin-bottom transition-colors ${
                  isActivePlayback
                    ? 'bg-gradient-to-t from-neon-cyan to-white shadow-glow-cyan-sm'
                    : isEnabled
                    ? 'bg-gradient-to-t from-blue-600 to-neon-cyan'
                    : 'bg-slate-700'
                }`}
                style={{ height: '24px' }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestClick}
              className={`relative overflow-hidden group flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 transition-all transform active:scale-95 shadow-lg cursor-pointer ${
                isActivePlayback
                  ? 'bg-white shadow-glow-cyan ring-2 ring-neon-cyan/50 scale-102'
                  : 'bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-400 hover:from-white hover:to-neon-cyan shadow-glow-cyan-sm'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isActivePlayback ? 'fill-current' : ''}`} />
              <span>TEST</span>
              <Sparkles className="w-3 h-3 opacity-80 group-hover:rotate-45 transition-transform" />
            </button>

            {onOpenLibrary && (
              <button
                onClick={onOpenLibrary}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#121826] hover:bg-[#1A2236] border border-white/[0.08] hover:border-neon-cyan/40 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Browse all switch packs in library"
              >
                <Layers className="w-3.5 h-3.5 text-neon-cyan" />
                <span className="hidden sm:inline">Packs</span>
              </button>
            )}

            <button
              onClick={onOpenTuning}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#121826] hover:bg-[#1A2236] border border-white/[0.08] hover:border-neon-cyan/40 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Acoustic tuning (pitch, velocity, speed)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-neon-cyan" />
              <span className="hidden sm:inline">Tune</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
