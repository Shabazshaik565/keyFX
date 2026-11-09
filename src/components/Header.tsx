import React from 'react';
import { Volume2, VolumeX, Settings, Keyboard, Sparkles, Activity, Layers, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppMode } from '../types';

interface HeaderProps {
  isEnabled: boolean;
  mode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  onToggleEnabled: () => void;
  onOpenSettings: () => void;
  activeTab: 'studio' | 'library' | 'scope';
  setActiveTab: (tab: 'studio' | 'library' | 'scope') => void;
  liveWpm?: number;
  totalKeystrokes?: number;
}

export const Header: React.FC<HeaderProps> = ({
  isEnabled,
  mode,
  onChangeMode,
  onToggleEnabled,
  onOpenSettings,
  activeTab,
  setActiveTab,
  liveWpm = 0,
  totalKeystrokes = 0,
}) => {
  const tabs = [
    { id: 'studio', label: mode === 'piano' ? 'Piano Studio' : 'Sound Studio', icon: mode === 'piano' ? Music : Sparkles },
    { id: 'library', label: 'Sound Library', icon: Layers },
    { id: 'scope', label: 'Trigger Scope', icon: Keyboard },
  ] as const;

  return (
    <header className="border-b border-surfaceBorder/80 bg-background/90 backdrop-blur-2xl px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-2xl">
      {/* Brand & Mode Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => setActiveTab('studio')}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-neon-cyan/20 via-neon-purple/20 to-blue-600/20 border border-neon-cyan/40 flex items-center justify-center shadow-lg shadow-cyan-950/60 group-hover:scale-105 transition-all">
            {mode === 'piano' ? (
              <Music className="w-5 h-5 text-neon-purple animate-pulse" />
            ) : (
              <Keyboard className="w-5 h-5 text-neon-cyan" />
            )}
          </div>
          {isEnabled && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0, 0.9] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full blur-[2px] ${
                mode === 'piano' ? 'bg-neon-purple shadow-glow-purple' : 'bg-neon-emerald shadow-glow-emerald'
              }`}
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2 font-mono">
              KEY<span className="text-neon-cyan font-black">FX</span>
            </span>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border tracking-widest ${
                mode === 'piano'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              }`}
            >
              {mode === 'piano' ? 'PIANO MODE' : 'PRO STUDIO'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full animate-ping ${
                mode === 'piano' ? 'bg-neon-purple' : 'bg-neon-cyan'
              }`}
            />
            {mode === 'piano'
              ? 'Playable Multi-Voice Acoustic Piano'
              : 'Zero-Latency Native Mechanical Audio'}
          </p>
        </div>

        {/* Operating Mode Toggle */}
        <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-surfaceBorder shadow-inner ml-2">
          <button
            onClick={() => onChangeMode('normal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'normal'
                ? 'bg-gradient-to-r from-neon-cyan/20 to-blue-600/30 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surfaceHover/30'
            }`}
            title="Normal Mode: Mechanical keystroke sounds across all apps"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Normal</span>
          </button>
          <button
            onClick={() => onChangeMode('piano')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'piano'
                ? 'bg-gradient-to-r from-neon-purple/25 to-pink-600/30 text-neon-purple border border-neon-purple/50 shadow-[0_0_15px_rgba(180,50,255,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surfaceHover/30'
            }`}
            title="Piano Mode: Turn physical keyboard into a playable polyphonic piano"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Piano</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs with Smooth Pill Indicator */}
      <div className="flex items-center bg-surface/90 p-1.5 rounded-2xl border border-surfaceBorder shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all z-10 cursor-pointer ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surfaceHover/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-gradient-to-r from-neon-cyan/25 to-blue-600/30 border border-neon-cyan/50 rounded-xl shadow-glow-cyan/30"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 ${isActive ? 'text-neon-cyan' : 'text-slate-400'}`} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Real-time Status & Top Actions */}
      <div className="flex items-center gap-3">
        {/* Live Keystroke Speed Meter */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-surfaceBorder text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-neon-emerald animate-pulse" />
          <span className="text-[11px] text-slate-400">{mode === 'piano' ? 'Activity:' : 'Live Speed:'}</span>
          <span className="font-mono font-bold text-neon-emerald">
            {mode === 'piano'
              ? `${totalKeystrokes} Notes`
              : liveWpm > 0
              ? `${liveWpm} WPM`
              : `${totalKeystrokes} Keys`}
          </span>
        </div>

        {/* Global Master Active / Mute Toggle */}
        <button
          onClick={onToggleEnabled}
          className={`group flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer ${
            isEnabled
              ? 'bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border-neon-emerald/50 text-neon-emerald hover:border-neon-emerald shadow-glow-emerald/30 ring-1 ring-neon-emerald/30'
              : 'bg-gradient-to-r from-rose-950/60 to-rose-900/40 border-rose-500/50 text-rose-400 hover:border-rose-400'
          }`}
          title="Toggle system-wide audio feedback"
        >
          <span className="relative flex h-2.5 w-2.5">
            {isEnabled && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-emerald opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isEnabled ? 'bg-neon-emerald' : 'bg-rose-500'
              }`}
            ></span>
          </span>
          <span className="tracking-wider">{isEnabled ? 'ACTIVE' : 'MUTED'}</span>
          {isEnabled ? (
            <Volume2 className="w-4 h-4 text-neon-emerald group-hover:scale-110 transition-transform" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-surface hover:bg-surfaceHover border border-surfaceBorder text-slate-300 hover:text-white transition-all hover:border-slate-600 cursor-pointer shadow-sm"
          title="Open System & Windows Settings"
        >
          <Settings className="w-4 h-4 text-slate-300 hover:text-neon-cyan transition-colors" />
        </button>
      </div>
    </header>
  );
};
