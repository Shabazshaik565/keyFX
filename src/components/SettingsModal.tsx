import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Power, Monitor, CheckCircle2, Speaker, RefreshCw, Headphones, Radio, Play } from 'lucide-react';
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
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#141b2b] to-[#0d121e] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-background/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">System & Audio Settings</h2>
              <p className="text-xs text-slate-400">Audio output routing & Windows background behavior</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Audio Output Device Routing Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Speaker className="w-3.5 h-3.5 text-neon-cyan" /> Audio Output Device
              </h3>

              <button
                onClick={fetchAudioDevices}
                disabled={isLoadingDevices}
                className="flex items-center gap-1 text-[11px] text-neon-cyan hover:text-cyan-300 transition-colors cursor-pointer"
                title="Scan for connected Bluetooth and speakers"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingDevices ? 'animate-spin' : ''}`} />
                <span>Refresh Devices</span>
              </button>
            </div>

            <div className="glass-card p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface border border-surfaceBorder flex items-center justify-center text-neon-cyan flex-shrink-0">
                  {currentDevice.toLowerCase().includes('bluetooth') ||
                  currentDevice.toLowerCase().includes('hands-free') ||
                  currentDevice.toLowerCase().includes('wireless') ||
                  currentDevice.toLowerCase().includes('headphone') ? (
                    <Headphones className="w-5 h-5 text-neon-purple" />
                  ) : (
                    <Speaker className="w-5 h-5 text-neon-cyan" />
                  )}
                </div>

                <div className="flex-1">
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">
                    Play Sounds Through:
                  </label>
                  <select
                    value={currentDevice}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="w-full bg-[#0c101a] border border-surfaceBorder focus:border-neon-cyan/50 text-white rounded-xl px-3 py-2 text-xs outline-none cursor-pointer"
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

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-neon-emerald animate-pulse" />
                  Select Computer Speakers or Bluetooth headphones anytime.
                </span>

                <button
                  type="button"
                  onClick={handleTestPlayback}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isPlayingTest
                      ? 'bg-neon-cyan text-slate-950 shadow-glow-cyan'
                      : 'bg-surface hover:bg-surfaceHover border border-surfaceBorder text-slate-300 hover:text-white'
                  }`}
                >
                  <Play className={`w-3 h-3 ${isPlayingTest ? 'fill-current' : ''}`} />
                  <span>Test Device</span>
                </button>
              </div>
            </div>
          </div>

          {/* Windows Integration Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Power className="w-3.5 h-3.5 text-neon-cyan" /> Windows Native Integration
            </h3>

            <div className="space-y-2.5">
              {/* Start with Windows */}
              <label className="flex items-center justify-between p-4 rounded-2xl glass-card hover:border-neon-cyan/40 transition-all cursor-pointer">
                <div className="pr-4">
                  <span className="text-sm font-bold text-white block">Start KeyFX with Windows</span>
                  <span className="text-xs text-slate-400 block mt-0.5 leading-relaxed">
                    Automatically launch KeyFX in background tray on Windows startup via Registry.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.startWithWindows}
                  onChange={async (e) => {
                    const nextVal = e.target.checked;
                    onChangeSettings({ startWithWindows: nextVal });
                    try {
                      await invoke('set_autostart_enabled', { enabled: nextVal });
                    } catch (err) {
                      console.warn('Autostart toggle error:', err);
                    }
                  }}
                  className="w-5 h-5 rounded text-neon-cyan focus:ring-neon-cyan bg-slate-800 border-slate-700 cursor-pointer accent-cyan-400"
                />
              </label>

              {/* Minimize to Tray on Close */}
              <label className="flex items-center justify-between p-4 rounded-2xl glass-card hover:border-neon-cyan/40 transition-all cursor-pointer">
                <div className="pr-4">
                  <span className="text-sm font-bold text-white block">Minimize to System Tray on Close</span>
                  <span className="text-xs text-slate-400 block mt-0.5 leading-relaxed">
                    Clicking the "X" button keeps KeyFX running silently in your taskbar notification area.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.minimizeToTray}
                  onChange={(e) => onChangeSettings({ minimizeToTray: e.target.checked })}
                  className="w-5 h-5 rounded text-neon-cyan focus:ring-neon-cyan bg-slate-800 border-slate-700 cursor-pointer accent-cyan-400"
                />
              </label>

              {/* Mute When Fullscreen */}
              <label className="flex items-center justify-between p-4 rounded-2xl glass-card hover:border-neon-cyan/40 transition-all cursor-pointer">
                <div className="pr-4">
                  <span className="text-sm font-bold text-white block">Auto-Mute on Fullscreen Apps</span>
                  <span className="text-xs text-slate-400 block mt-0.5 leading-relaxed">
                    Temporarily mute effects when full-screen games or video players are focused.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.muteWhenFullscreen}
                  onChange={(e) => onChangeSettings({ muteWhenFullscreen: e.target.checked })}
                  className="w-5 h-5 rounded text-neon-cyan focus:ring-neon-cyan bg-slate-800 border-slate-700 cursor-pointer accent-cyan-400"
                />
              </label>
            </div>
          </div>

          {/* Privacy & Security Guarantee */}
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              Privacy-First Local Guarantee
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                Never records, transmits, or logs typed keystrokes.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                100% offline — zero telemetry, analytics, or network requests.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                Native low-latency Windows event hook without input delay.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-background/50 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">KeyFX v1.0.0 (Windows Native)</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neon-cyan hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-glow-cyan/50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
