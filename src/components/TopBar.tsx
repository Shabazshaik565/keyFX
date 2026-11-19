import React from 'react';
import { Play, Zap, Sliders, Music, Layers, Filter, Settings, Volume2, VolumeX } from 'lucide-react';
import { AppMode, SoundProfile } from '../types';

interface TopBarProps {
  mode: AppMode;
  currentTab: 'studio' | 'library' | 'scope';
  currentSound: SoundProfile;
  pianoPreset: string;
  isEnabled: boolean;
  onTestSound: () => void;
  onOpenSettings: () => void;
  onToggleEnabled: () => void;
}

const PIANO_PRESET_NAMES: Record<string, string> = {
  grand_piano: 'Yamaha C5 Concert Grand',
  bright_piano: 'Bright Studio Grand',
  upright_piano: 'Mellow Upright Piano',
  electric_piano: 'Vintage Electric Rhodes',
};

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  currentTab,
  currentSound,
  pianoPreset,
  isEnabled,
  onTestSound,
  onOpenSettings,
  onToggleEnabled,
}) => {
  const getBreadcrumb = () => {
    if (currentTab === 'library') {
      return {
        section: 'Sound Library',
        detail: 'Sound Packs & Custom Audio',
      };
    }
    if (currentTab === 'scope') {
      return {
        section: 'Trigger Scope',
        detail: 'Keystroke Filter Matrix',
      };
    }
    if (mode === 'piano') {
      return {
        section: 'Piano Studio',
        detail: PIANO_PRESET_NAMES[pianoPreset] || 'Concert Grand',
      };
    }
    return {
      section: 'Sound Studio',
      detail: currentSound.name,
    };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="h-14 border-b border-white/[0.06] bg-[#0A0E17]/80 backdrop-blur-xl px-5 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Desktop Breadcrumb Path */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-400">{breadcrumb.section}</span>
        <span className="text-slate-600">/</span>
        <span className="font-bold text-white flex items-center gap-1.5">
          {mode === 'piano' && currentTab === 'studio' ? (
            <Music className="w-3.5 h-3.5 text-neon-purple" />
          ) : currentTab === 'library' ? (
            <Layers className="w-3.5 h-3.5 text-neon-cyan" />
          ) : currentTab === 'scope' ? (
            <Filter className="w-3.5 h-3.5 text-neon-cyan" />
          ) : (
            <Sliders className="w-3.5 h-3.5 text-neon-cyan" />
          )}
          {breadcrumb.detail}
        </span>
      </div>

      {/* Right: Engine Specs & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Engine Specs Badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0F1422] border border-white/[0.06] text-[11px] font-mono text-slate-400">
          <Zap className="w-3 h-3 text-neon-cyan" />
          <span>&lt; 2ms Native</span>
          <span className="text-slate-600">•</span>
          <span className="text-neon-emerald">Linear PCM</span>
        </div>

        {/* Quick Test Keystroke Action */}
        <button
          onClick={onTestSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/40 text-neon-cyan hover:text-white text-xs font-bold transition-all cursor-pointer shadow-glow-cyan-sm active:scale-95"
          title="Trigger a test audio stroke through current output profile"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Test Sound</span>
        </button>

        {/* Global Toggle Button */}
        <button
          onClick={onToggleEnabled}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isEnabled
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:border-emerald-400'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-400 hover:border-rose-400'
          }`}
          title={isEnabled ? 'Audio feedback is ACTIVE' : 'Audio feedback is MUTED'}
        >
          {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.06] transition-all cursor-pointer"
          title="Open Preferences & Windows Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
