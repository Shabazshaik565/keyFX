import React, { useState } from 'react';
import { Play, Zap, SlidersHorizontal, Radio, Disc3, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { SoundProfile } from '../types';

interface SoundHeroProps {
  currentSound: SoundProfile;
  isEnabled: boolean;
  onTestSound: () => void;
  onOpenTuning: () => void;
  isKeyActive?: boolean;
}

export const SoundHero: React.FC<SoundHeroProps> = ({
  currentSound,
  isEnabled,
  onTestSound,
  onOpenTuning,
  isKeyActive = false,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleTestClick = () => {
    setIsPlayingTest(true);
    onTestSound();
    setTimeout(() => setIsPlayingTest(false), 220);
  };

  const isActivePlayback = isPlayingTest || isKeyActive;

  return (
    <div className="relative overflow-hidden rounded-3xl glass-panel-elevated p-6 border border-white/15 shadow-2xl transition-all">
      {/* Dynamic Animated Ambient Glow Background */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/10 blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-600/20 to-neon-emerald/10 blur-3xl pointer-events-none" />

      {/* Top Subtle RGB Light Strip */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rgb-strip opacity-80" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Switch Identity & Visualizer Deck */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <motion.div
              animate={{
                scale: isActivePlayback ? [1, 1.12, 1] : 1,
                rotate: isActivePlayback ? [0, -3, 3, 0] : 0,
              }}
              transition={{ duration: 0.2 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-neon-cyan/20 via-blue-600/20 to-neon-purple/25 border-2 border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-xl shadow-cyan-950/80 cursor-pointer overflow-hidden"
              onClick={handleTestClick}
            >
              <Disc3 className={`w-10 h-10 ${isActivePlayback ? 'animate-spin' : ''}`} />
              <div className="absolute inset-0 bg-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            {isEnabled && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-neon-emerald text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-glow-emerald">
                LIVE
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-gradient-to-r from-neon-cyan/20 to-blue-500/20 text-neon-cyan border border-neon-cyan/40 tracking-wider uppercase">
                {currentSound.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-neon-emerald bg-neon-emerald/10 px-2.5 py-0.5 rounded-full border border-neon-emerald/30">
                <Zap className="w-3 h-3" /> Native &lt; 2ms Latency
              </span>
              {currentSound.isCustom && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                  CUSTOM PACK
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {currentSound.name}
            </h2>
            <p className="text-xs text-slate-300/80 max-w-xl line-clamp-1 leading-relaxed">
              {currentSound.description}
            </p>
          </div>
        </div>

        {/* Real-time Dynamic Waveform Spectrum Visualizer */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-1 h-12 px-5 py-2.5 rounded-2xl bg-surface/90 border border-surfaceBorder shadow-inner">
            <Radio className="w-4 h-4 text-neon-cyan mr-2 animate-pulse" />
            {[35, 65, 95, 45, 80, 100, 60, 85, 40, 90, 70, 50, 85, 30, 75, 90].map(
              (height, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    scaleY: isActivePlayback
                      ? [0.3, Math.min(1, (height / 100) * 1.3), 0.3]
                      : isEnabled
                      ? [0.2, height / 100, 0.2]
                      : 0.1,
                  }}
                  transition={{
                    repeat: isEnabled || isActivePlayback ? Infinity : 0,
                    duration: isActivePlayback ? 0.3 + (idx % 3) * 0.1 : 0.8 + (idx % 4) * 0.2,
                    ease: 'easeInOut',
                  }}
                  className={`w-1 sm:w-1.5 rounded-full origin-bottom transition-colors ${
                    isActivePlayback
                      ? 'bg-gradient-to-t from-neon-cyan to-white shadow-glow-cyan'
                      : isEnabled
                      ? 'bg-gradient-to-t from-blue-600 to-neon-cyan'
                      : 'bg-slate-700'
                  }`}
                  style={{ height: '28px' }}
                />
              )
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTestClick}
              className={`relative overflow-hidden group flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-950 transition-all transform active:scale-95 shadow-xl cursor-pointer ${
                isActivePlayback
                  ? 'bg-white shadow-glow-cyan ring-4 ring-neon-cyan/40 scale-105'
                  : 'bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-400 hover:from-white hover:to-neon-cyan shadow-cyan-500/30'
              }`}
            >
              <Play className={`w-4 h-4 ${isActivePlayback ? 'fill-current' : ''}`} />
              <span>TEST SOUND</span>
              <Sparkles className="w-3.5 h-3.5 opacity-70 group-hover:rotate-45 transition-transform" />
            </button>

            <button
              onClick={onOpenTuning}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-surface hover:bg-surfaceHover border border-surfaceBorder hover:border-neon-cyan/40 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Open Acoustic Tuner (Pitch, Speed, Jitter, Volume)"
            >
              <SlidersHorizontal className="w-4 h-4 text-neon-cyan" />
              <span>Tune</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
