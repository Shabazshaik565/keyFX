import React from 'react';
import { Volume2, Music, Gauge, Shuffle, Timer, RotateCcw, Sliders, Wand2, Minus, Plus } from 'lucide-react';
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
      badge: 'Sharp actuation',
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
      badge: 'Dampened bass',
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
      badge: 'Chiptune high',
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
      badge: 'Office friendly',
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
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-6 shadow-2xl">
      {/* Tuning Header & Instant Presets */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-neon-cyan" />
            Acoustic Mixing Console
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 font-mono">
              DSP ENGINE
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time semitone pitch transpose, speed multiplier, velocity variance, and acoustic jitter.
          </p>
        </div>

        {/* Quick Acoustic Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-400 mr-1">
            <Wand2 className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-[11px] font-semibold">Presets:</span>
          </div>

          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={preset.apply}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101522] hover:bg-[#182032] border border-white/[0.08] hover:border-neon-cyan/40 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}

          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all cursor-pointer ml-1"
            title="Reset DSP parameters to studio defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Sliders Grid with Increment/Decrement Step Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Master Output Gain */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-neon-cyan" /> Master Output Gain
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeSettings({ volume: Math.max(0, settings.volume - 5) })}
                className="p-1 rounded-md bg-[#0F1420] border border-white/[0.06] text-slate-400 hover:text-white"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="text-neon-cyan font-mono text-xs font-bold bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/30 w-12 text-center">
                {settings.volume}%
              </span>
              <button
                type="button"
                onClick={() => onChangeSettings({ volume: Math.min(100, settings.volume + 5) })}
                className="p-1 rounded-md bg-[#0F1420] border border-white/[0.06] text-slate-400 hover:text-white"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
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

        {/* Semitone Pitch Shifter */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Music className="w-4 h-4 text-neon-purple" /> Semitone Pitch Shifter
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeSettings({ pitch: Math.max(-12, settings.pitch - 1) })}
                className="p-1 rounded-md bg-[#0F1420] border border-white/[0.06] text-slate-400 hover:text-white"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="text-neon-purple font-mono text-xs font-bold bg-neon-purple/10 px-2 py-0.5 rounded-md border border-neon-purple/30 w-14 text-center">
                {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch} st
              </span>
              <button
                type="button"
                onClick={() => onChangeSettings({ pitch: Math.min(12, settings.pitch + 1) })}
                className="p-1 rounded-md bg-[#0F1420] border border-white/[0.06] text-slate-400 hover:text-white"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
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

        {/* Speed Scaling */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-neon-emerald" /> Playback Speed Multiplier
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeSettings({ playbackSpeed: Math.max(0.5, Number((settings.playbackSpeed - 0.05).toFixed(2))) })}
                className="p-1 rounded-md bg-[#0F1420] border border-white/[0.06] text-slate-400 hover:text-white"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="text-neon-emerald font-mono text-xs font-bold bg-neon-emerald/10 px-2 py-0.5 rounded-md border border-neon-emerald/30 w-14 text-center">
                {settings.playbackSpeed.toFixed(2)}x
              </span>
              <button
                type="button"
                onClick={() => onChangeSettings({ playbackSpeed: Math.min(2.0, Number((settings.playbackSpeed + 0.05).toFixed(2))) })}
                className="p-1 rounded-md bg-[#0F1420] border border-white/[0.06] text-slate-400 hover:text-white"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
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
            <span>1.0x (Standard)</span>
            <span>2.0x (Hyper)</span>
          </div>
        </div>

        {/* Debounce Cooldown */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Timer className="w-4 h-4 text-neon-amber" /> Debounce Cooldown Filter
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeSettings({ cooldownMs: Math.max(0, settings.cooldownMs - 5) })}
                className="p-1 rounded-md bg-[#0F1420] border border-white/[0.06] text-slate-400 hover:text-white"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="text-neon-amber font-mono text-xs font-bold bg-neon-amber/10 px-2 py-0.5 rounded-md border border-neon-amber/30 w-16 text-center">
                {settings.cooldownMs} ms
              </span>
              <button
                type="button"
                onClick={() => onChangeSettings({ cooldownMs: Math.min(120, settings.cooldownMs + 5) })}
                className="p-1 rounded-md bg-[#0F1420] border border-white/[0.06] text-slate-400 hover:text-white"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
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
            <span>20 ms (Rapid typing)</span>
            <span>120 ms (Quiet)</span>
          </div>
        </div>

        {/* Acoustic Micro-Pitch Jitter */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-neon-cyan" /> Acoustic Micro-Pitch Jitter
            </span>
            <span className="text-neon-cyan font-mono text-xs font-bold bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/30">
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
            Randomizes switch harmonics so continuous typing sounds naturally organic.
          </p>
        </div>

        {/* Velocity Dynamics Jitter */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200 flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-blue-400" /> Velocity Dynamics Jitter
            </span>
            <span className="text-blue-400 font-mono text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/30">
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
