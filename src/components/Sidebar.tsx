import React from 'react';
import {
  Keyboard,
  Music,
  Layers,
  Filter,
  Sliders,
  Settings,
  Volume2,
  VolumeX,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AppMode } from '../types';

interface SidebarProps {
  currentTab: 'studio' | 'library' | 'scope';
  onChangeTab: (tab: 'studio' | 'library' | 'scope') => void;
  mode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  onOpenSettings: () => void;
  liveWpm?: number;
  totalKeystrokes?: number;
  soundCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onChangeTab,
  mode,
  onChangeMode,
  isEnabled,
  onToggleEnabled,
  onOpenSettings,
  liveWpm = 0,
  totalKeystrokes = 0,
  soundCount = 7,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'studio' as const,
      label: mode === 'piano' ? 'Piano Studio' : 'Sound Studio',
      icon: mode === 'piano' ? Music : Sliders,
      badge: mode === 'piano' ? '88 Keys' : 'Pro',
      description: mode === 'piano' ? 'Playable acoustic grand' : 'Active switch & tuner',
    },
    {
      id: 'library' as const,
      label: 'Sound Library',
      icon: Layers,
      badge: `${soundCount}`,
      description: 'Switch packs & custom audio',
    },
    {
      id: 'scope' as const,
      label: 'Trigger Scope',
      icon: Filter,
      badge: 'Filter',
      description: 'App & keystroke filtering',
    },
  ];

  return (
    <aside
      className={`relative z-30 flex flex-col justify-between h-screen border-r border-white/[0.08] bg-[#090D15]/95 backdrop-blur-2xl transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-20' : 'w-64 xl:w-72'
      }`}
    >
      {/* Top Header & Brand */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={() => onChangeTab('studio')}
            className="flex items-center gap-3 cursor-pointer group flex-1 overflow-hidden"
          >
            {/* Logo Icon */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 via-blue-600/20 to-purple-600/20 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-glow-cyan-sm group-hover:scale-105 transition-all">
                {mode === 'piano' ? (
                  <Music className="w-5 h-5 text-neon-purple animate-pulse" />
                ) : (
                  <Keyboard className="w-5 h-5 text-neon-cyan" />
                )}
              </div>
              {isEnabled && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neon-emerald ring-2 ring-[#090D15]" />
              )}
            </div>

            {/* Brand Title */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-wider text-white font-mono flex items-center">
                    KEY<span className="text-neon-cyan">FX</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/[0.08] text-slate-300 border border-white/[0.08]">
                    v2.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-medium mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${mode === 'piano' ? 'bg-neon-purple' : 'bg-neon-cyan'}`} />
                  {mode === 'piano' ? 'Concert Grand Deck' : 'Native Audio Engine'}
                </p>
              </div>
            )}
          </div>

          {/* Collapse Sidebar Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Operating Mode Segmented Control */}
        {!isCollapsed && (
          <div className="mt-4 p-1 rounded-xl bg-[#0F1422] border border-white/[0.06] flex items-center gap-1 shadow-inner">
            <button
              onClick={() => onChangeMode('normal')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'normal'
                  ? 'bg-gradient-to-r from-neon-cyan/20 to-blue-600/30 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Normal</span>
            </button>

            <button
              onClick={() => onChangeMode('piano')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'piano'
                  ? 'bg-gradient-to-r from-neon-purple/20 to-pink-600/30 text-neon-purple border border-neon-purple/40 shadow-glow-purple'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Piano</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspaces
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-neon-cyan/15 to-transparent text-white border-l-2 border-neon-cyan font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-neon-cyan bg-neon-cyan/10'
                    : 'text-slate-400 group-hover:text-white group-hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold leading-tight">{item.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                          : 'bg-white/[0.05] text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer & Live Telemetry Deck */}
      <div className="p-3 border-t border-white/[0.06] space-y-2.5 bg-[#080B12]/80">
        {/* Live Keystroke / WPM Activity Card */}
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-[#0F1524] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-neon-cyan animate-pulse" />
                {mode === 'piano' ? 'Note Activity' : 'Live Typing Speed'}
              </span>
              <span className="text-[10px] font-mono font-bold text-neon-emerald bg-neon-emerald/10 px-2 py-0.5 rounded-md border border-neon-emerald/20">
                {mode === 'piano'
                  ? `${totalKeystrokes} notes`
                  : liveWpm > 0
                  ? `${liveWpm} WPM`
                  : `${totalKeystrokes} keys`}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple rounded-full"
                  animate={{
                    width: mode === 'piano'
                      ? `${Math.min(100, (totalKeystrokes % 100))}%`
                      : `${Math.min(100, (liveWpm / 120) * 100)}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {mode === 'piano' ? 'Session' : 'Realtime'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div
              className="w-10 h-10 rounded-xl bg-[#0F1524] border border-white/[0.06] flex items-center justify-center text-neon-cyan"
              title={`${mode === 'piano' ? totalKeystrokes + ' Notes' : liveWpm + ' WPM'}`}
            >
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        )}

        {/* Master Active / Mute Switch */}
        <button
          onClick={onToggleEnabled}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            isEnabled
              ? 'bg-emerald-950/40 border-neon-emerald/40 text-neon-emerald hover:border-neon-emerald shadow-glow-emerald/20'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:border-rose-400'
          }`}
          title="Toggle system-wide audio feedback"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isEnabled && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-emerald opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isEnabled ? 'bg-neon-emerald' : 'bg-rose-500'
                }`}
              />
            </span>
            {!isCollapsed && <span>{isEnabled ? 'AUDIO ACTIVE' : 'MUTED'}</span>}
          </div>

          {isEnabled ? (
            <Volume2 className="w-4 h-4 text-neon-emerald" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-400" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span>Preferences</span>}
        </button>
      </div>
    </aside>
  );
};
