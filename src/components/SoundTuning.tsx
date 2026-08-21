import React from 'react';
import { Volume2, Music, Gauge, Shuffle, Timer, RotateCcw, Sliders, Wand2 } from 'lucide-react';
import { AppSettings } from '../types';

interface SoundTuningProps {
  settings: AppSettings;
  onChangeSettings: (updated: Partial<AppSettings>) => void;
  onResetDefaults: () => void;
}

export const SoundTuning: React.FC<SoundTuningProps> = ({
  settings,
  onChangeSettings,
  onResetDefaults,
}) => {
  const PRESETS = [
    {
      name: 'Crisp Tactile',
      icon: '⚡',
      apply: () =>
        onChangeSettings({
          volume: 90,
          pitch: 2,
          playbackSpeed: 1.05,
          randomPitch: 10,
          randomVolume: 6,
          cooldownMs: 10,
        }),
    },
    {
      name: 'Deep ASMR Thock',
      icon: '🌊',
      apply: () =>
        onChangeSettings({
          volume: 95,
          pitch: -4,
          playbackSpeed: 0.9,
          randomPitch: 6,
          randomVolume: 12,
          cooldownMs: 20,
        }),
    },
    {
      name: 'Cyber Arcade',
      icon: '🕹️',
      apply: () =>
        onChangeSettings({
          volume: 85,
          pitch: 6,
          playbackSpeed: 1.25,
          randomPitch: 18,
          randomVolume: 4,
          cooldownMs: 5,
        }),
    },
    {
      name: 'Subtle & Quiet',
      icon: '🍃',
      apply: () =>
        onChangeSettings({
          volume: 45,
          pitch: -1,
          playbackSpeed: 1.0,
          randomPitch: 8,
          randomVolume: 10,
          cooldownMs: 25,
        }),
    },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6 shadow-2xl">
      {/* Tuning Header & Instant Presets */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-neon-cyan" />
            Studio Mixing Console
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-neon-cyan border border-cyan-500/30">
              DSP ENGINE
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time semitone pitch shifter, velocity dynamics, and jitter filters.
          </p>
        </div>

        {/* Quick Acoustic Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-400 mr-1">
            <Wand2 className="w-3.5 h-3.5 text-neon-purple" />
            <span>Presets:</span>
          </div>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={preset.apply}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surfaceHover border border-surfaceBorder hover:border-neon-cyan/40 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}

          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all cursor-pointer ml-1"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {/* Master Volume */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-neon-cyan" /> Master Output Gain
            </span>
            <span className="text-neon-cyan font-mono text-sm bg-neon-cyan/10 px-2 py-0.5 rounded-lg border border-neon-cyan/30">
              {settings.volume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={settings.volume}
            onChange={(e) => onChangeSettings({ volume: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Mute (0%)</span>
            <span>Balanced (50%)</span>
            <span>Max (100%)</span>
          </div>
        </div>

        {/* Pitch Transpose */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Music className="w-4 h-4 text-neon-purple" /> Semitone Pitch Shifter
            </span>
            <span className="text-neon-purple font-mono text-sm bg-neon-purple/10 px-2 py-0.5 rounded-lg border border-neon-purple/30">
              {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch} st
            </span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={settings.pitch}
            onChange={(e) => onChangeSettings({ pitch: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>-12 st (Octave Down)</span>
            <span>0 (Original)</span>
            <span>+12 st (Octave Up)</span>
          </div>
        </div>

        {/* Playback Speed */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-neon-emerald" /> Speed Scaling
            </span>
            <span className="text-neon-emerald font-mono text-sm bg-neon-emerald/10 px-2 py-0.5 rounded-lg border border-neon-emerald/30">
              {settings.playbackSpeed.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={settings.playbackSpeed}
            onChange={(e) => onChangeSettings({ playbackSpeed: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>0.5x (Slow)</span>
            <span>1.0x (Original)</span>
            <span>2.0x (Hyper)</span>
          </div>
        </div>

        {/* Keystroke Cooldown */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Timer className="w-4 h-4 text-neon-amber" /> Debounce Cooldown
            </span>
            <span className="text-neon-amber font-mono text-sm bg-neon-amber/10 px-2 py-0.5 rounded-lg border border-neon-amber/30">
              {settings.cooldownMs} ms
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="5"
            value={settings.cooldownMs}
            onChange={(e) => onChangeSettings({ cooldownMs: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>0 ms (Instant)</span>
            <span>20 ms (Typing)</span>
            <span>120 ms (Calm)</span>
          </div>
        </div>

        {/* Random Pitch Jitter */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-neon-cyan" /> Acoustic Micro-Pitch Jitter
            </span>
            <span className="text-neon-cyan font-mono text-sm bg-neon-cyan/10 px-2 py-0.5 rounded-lg border border-neon-cyan/30">
              ±{settings.randomPitch}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={settings.randomPitch}
            onChange={(e) => onChangeSettings({ randomPitch: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-[11px] text-slate-400">
            Randomizes switch harmonics so rapid typing sounds organic.
          </p>
        </div>

        {/* Random Volume Jitter */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-blue-400" /> Velocity Dynamics Jitter
            </span>
            <span className="text-blue-400 font-mono text-sm bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/30">
              ±{settings.randomVolume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={settings.randomVolume}
            onChange={(e) => onChangeSettings({ randomVolume: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-[11px] text-slate-400">
            Simulates natural finger pressure differences across keys.
          </p>
        </div>
      </div>
    </div>
  );
};
