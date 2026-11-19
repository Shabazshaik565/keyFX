import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Power,
  Monitor,
  CheckCircle2,
  Speaker,
  RefreshCw,
  Headphones,
  Radio,
  Play,
  Command
} from 'lucide-react';
import { AppSettings, AudioDeviceInfo } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onChangeSettings: (updated: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'windows' | 'shortcuts'>('audio');
  const [devices, setDevices] = useState<AudioDeviceInfo[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const fetchAudioDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const list = await invoke<AudioDeviceInfo[]>('get_audio_output_devices');
      if (list && list.length > 0) {
        setDevices(list);
      }
    } catch (err) {
      console.warn('Failed to get audio output devices:', err);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAudioDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDevice = settings.outputDevice || 'default';

  const handleDeviceChange = async (deviceId: string) => {
    onChangeSettings({ outputDevice: deviceId });
    try {
      await invoke('set_audio_output_device', { deviceName: deviceId });
    } catch (err) {
      console.error('Failed to set audio output device:', err);
    }
  };

  const handleTestPlayback = async () => {
    setIsPlayingTest(true);
    try {
      await invoke('trigger_test_sound');
    } catch (err) {
      console.warn('Test playback error:', err);
    }
    setTimeout(() => setIsPlayingTest(false), 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#131929] to-[#0C101C] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0A0E18]/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-glow-cyan-sm">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">KeyFX Preferences</h2>
              <p className="text-xs text-slate-400">Audio routing, Windows system integration, & hotkeys</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tab Strip */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/[0.06] bg-[#0A0E18]/40">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'border-neon-cyan text-neon-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Speaker className="w-3.5 h-3.5" />
            <span>Audio Device</span>
          </button>

          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'windows'
                ? 'border-neon-cyan text-neon-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Windows Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'border-neon-cyan text-neon-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Command className="w-3.5 h-3.5" />
            <span>Shortcuts & Privacy</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                  <Speaker className="w-3.5 h-3.5 text-neon-cyan" /> Audio Output Target
                </span>

                <button
                  onClick={fetchAudioDevices}
                  disabled={isLoadingDevices}
                  className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDevices ? 'animate-spin' : ''}`} />
                  <span>Scan Devices</span>
                </button>
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B0F19] border border-white/[0.08] flex items-center justify-center text-neon-cyan flex-shrink-0">
                    {currentDevice.toLowerCase().includes('bluetooth') ||
                    currentDevice.toLowerCase().includes('wireless') ||
                    currentDevice.toLowerCase().includes('headphone') ? (
                      <Headphones className="w-5 h-5 text-neon-purple" />
                    ) : (
                      <Speaker className="w-5 h-5 text-neon-cyan" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      Target Audio Device:
                    </label>
                    <select
                      value={currentDevice}
                      onChange={(e) => handleDeviceChange(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-white/[0.08] focus:border-neon-cyan/50 text-white rounded-xl px-3 py-2 text-xs outline-none cursor-pointer"
                    >
                      <option value="default">Default Windows Audio Device (Automatic)</option>
                      {devices
                        .filter((d) => d.id !== 'default')
                        .map((dev) => (
                          <option key={dev.id} value={dev.id}>
                            {dev.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Radio className="w-3.5 h-3.5 text-neon-emerald animate-pulse" />
                    Bluetooth, USB DACs, & speakers supported
                  </span>

                  <button
                    type="button"
                    onClick={handleTestPlayback}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isPlayingTest
                        ? 'bg-neon-cyan text-slate-950 shadow-glow-cyan'
                        : 'bg-[#101524] hover:bg-[#182033] border border-white/[0.08] text-slate-300 hover:text-white'
                    }`}
                  >
                    <Play className={`w-3 h-3 ${isPlayingTest ? 'fill-current' : ''}`} />
                    <span>Test Device</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                <Power className="w-3.5 h-3.5 text-neon-cyan" /> Background Behavior
              </span>

              <div className="space-y-2.5">
                {/* Start with Windows Toggle */}
                <div
                  onClick={async () => {
                    const nextVal = !settings.startWithWindows;
                    onChangeSettings({ startWithWindows: nextVal });
                    try {
                      await invoke('set_autostart_enabled', { enabled: nextVal });
                    } catch (err) {
                      console.warn('Autostart toggle error:', err);
                    }
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl glass-card hover:border-white/[0.15] transition-all cursor-pointer"
                >
                  <div className="pr-4">
                    <span className="text-sm font-bold text-white block">Start KeyFX with Windows</span>
                    <span className="text-xs text-slate-400 block mt-0.5 leading-relaxed">
                      Automatically launch in background tray on Windows startup via Registry.
                    </span>
                  </div>

                  <div
                    className={`switch-root ${
                      settings.startWithWindows ? 'bg-neon-cyan shadow-glow-cyan-sm' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`switch-thumb ${
                        settings.startWithWindows ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* Minimize to Tray on Close */}
                <div
                  onClick={() => onChangeSettings({ minimizeToTray: !settings.minimizeToTray })}
                  className="flex items-center justify-between p-4 rounded-2xl glass-card hover:border-white/[0.15] transition-all cursor-pointer"
                >
                  <div className="pr-4">
                    <span className="text-sm font-bold text-white block">Minimize to System Tray on Close</span>
                    <span className="text-xs text-slate-400 block mt-0.5 leading-relaxed">
                      Clicking "X" minimizes KeyFX silently into the Windows taskbar notification area.
                    </span>
                  </div>

                  <div
                    className={`switch-root ${
                      settings.minimizeToTray ? 'bg-neon-cyan shadow-glow-cyan-sm' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`switch-thumb ${
                        settings.minimizeToTray ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* Mute When Fullscreen */}
                <div
                  onClick={() => onChangeSettings({ muteWhenFullscreen: !settings.muteWhenFullscreen })}
                  className="flex items-center justify-between p-4 rounded-2xl glass-card hover:border-white/[0.15] transition-all cursor-pointer"
                >
                  <div className="pr-4">
                    <span className="text-sm font-bold text-white block">Auto-Mute on Fullscreen Apps</span>
                    <span className="text-xs text-slate-400 block mt-0.5 leading-relaxed">
                      Temporarily silence audio feedback when games or video players are focused.
                    </span>
                  </div>

                  <div
                    className={`switch-root ${
                      settings.muteWhenFullscreen ? 'bg-neon-cyan shadow-glow-cyan-sm' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`switch-thumb ${
                        settings.muteWhenFullscreen ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              {/* Keyboard Shortcuts Table */}
              <div className="glass-card p-4 rounded-2xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                  <Command className="w-3.5 h-3.5 text-neon-cyan" /> Application Shortcuts
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-slate-400">Hold Piano Sustain Pedal</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#0B0F19] border border-white/[0.1] text-neon-cyan font-mono font-bold">
                      Spacebar
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-slate-400">Shift Piano Octave Down / Up</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-[#0B0F19] border border-white/[0.1] text-slate-200 font-mono">
                        C1 - C7 Stepper
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-slate-400">Toggle System Mute</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#0B0F19] border border-white/[0.1] text-slate-200 font-mono">
                      System Tray / Mute Switch
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Privacy Guarantee */}
              <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  Local Privacy Guarantee
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    Zero keystroke recording or logging — audio hooks process events in volatile memory.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    100% offline — zero network calls, tracking, or telemetry.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#0A0E18]/60 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">KeyFX v2.0.0 (Native Desktop)</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neon-cyan hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-glow-cyan-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
