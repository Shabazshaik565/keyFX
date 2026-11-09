import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SoundHero } from './components/SoundHero';
import { SoundLibrary } from './components/SoundLibrary';
import { SoundTuning } from './components/SoundTuning';
import { KeyboardScopeSelector } from './components/KeyboardScope';
import { KeyVisualizer } from './components/KeyVisualizer';
import { PianoView } from './components/PianoView';
import { SettingsModal } from './components/SettingsModal';
import { AppMode, AppSettings, SoundProfile, PianoNoteEvent } from './types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KeyStrokePayload {
  vk_code: number;
  key_label: string;
  timestamp_ms: number;
}

const INITIAL_SOUNDS: SoundProfile[] = [
  {
    id: 'mech_cherry_blue',
    name: 'Mechanical Cherry MX Blue',
    category: 'Mechanical',
    description: 'Crisp, tactile, and sharp acoustic click with high actuation feedback.',
    tags: ['Clicky', 'Tactile', 'Classic'],
  },
  {
    id: 'mech_gateron_ink',
    name: 'Gateron Ink Black (Deep Thock)',
    category: 'Mechanical',
    description: 'Deep, muted, and dampened low-frequency thock favorite among custom keyboard enthusiasts.',
    tags: ['Deep', 'Thock', 'Lubed'],
  },
  {
    id: 'typewriter_1930',
    name: 'Vintage 1930s Typewriter',
    category: 'Acoustic',
    description: 'Authentic heavy metal striker hit on paper roller with rich metallic resonance.',
    tags: ['Acoustic', 'Vintage', 'Retro'],
  },
  {
    id: 'cyber_deck_beep',
    name: 'Cyber Deck Terminal Beep',
    category: 'Digital',
    description: 'Futuristic sci-fi HUD synthesizer blip with clean sine-decay envelope.',
    tags: ['Sci-Fi', 'HUD', 'Cyber'],
  },
  {
    id: 'soft_bubble_pop',
    name: 'Soft Bubble Pop',
    category: 'Soft',
    description: 'Gentle, soothing, and unobtrusive fluid bubble pop ideal for quiet workspaces.',
    tags: ['Soft', 'Gentle', 'Minimal'],
  },
  {
    id: 'arcade_8bit_blip',
    name: 'Retro 8-Bit Arcade Blip',
    category: 'Retro',
    description: 'Chiptune square-wave sound effect reminiscent of classic 80s arcade cabinets.',
    tags: ['8-Bit', 'Chiptune', 'Arcade'],
  },
  {
    id: 'heavy_tactile_impact',
    name: 'Heavy Tactile Impact',
    category: 'Mechanical',
    description: 'Punchy, resonant bottom-out sound designed for heavy typists and brass plate builds.',
    tags: ['Heavy', 'Brass', 'Punchy'],
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  isEnabled: true,
  mode: 'normal',
  selectedSoundId: 'mech_cherry_blue',
  volume: 85,
  pitch: 0,
  playbackSpeed: 1.0,
  randomPitch: 8,
  randomVolume: 5,
  cooldownMs: 15,
  keyboardScope: 'all_keys',
  startWithWindows: false,
  minimizeToTray: true,
  muteWhenFullscreen: false,
  pianoVolume: 85,
  pianoOctave: 4,
  pianoSustain: false,
  pianoPreset: 'grand_piano',
};

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('keyfx_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [sounds, setSounds] = useState<SoundProfile[]>(() => {
    const saved = localStorage.getItem('keyfx_sounds');
    return saved ? JSON.parse(saved) : INITIAL_SOUNDS;
  });

  const [activeTab, setActiveTab] = useState<'studio' | 'library' | 'scope'>('studio');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [externalKey, setExternalKey] = useState<{ label: string; id: number } | null>(null);
  const [isKeyPulsing, setIsKeyPulsing] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [activePianoNotes, setActivePianoNotes] = useState<Set<string>>(new Set());
  const [livePianoSustain, setLivePianoSustain] = useState<boolean>(settings.pianoSustain);

  const strokeTimestampsRef = useRef<number[]>([]);

  // Sync settings with LocalStorage & Rust backend
  useEffect(() => {
    localStorage.setItem('keyfx_settings', JSON.stringify(settings));
    try {
      invoke('set_app_mode', { mode: settings.mode }).catch(() => {});
      invoke('sync_audio_tuning', {
        isEnabled: settings.isEnabled,
        volume: settings.volume,
        pitch: settings.pitch,
        playbackSpeed: settings.playbackSpeed,
        randomPitch: settings.randomPitch,
        randomVolume: settings.randomVolume,
        selectedSoundId: settings.selectedSoundId,
      }).catch(() => {});
      invoke('sync_piano_settings', {
        volume: settings.pianoVolume,
        octave: settings.pianoOctave,
        sustain: settings.pianoSustain,
        preset: settings.pianoPreset,
      }).catch(() => {});
      invoke('set_keyboard_scope', { scope: settings.keyboardScope }).catch(() => {});
      invoke('set_cooldown_ms', { cooldownMs: settings.cooldownMs }).catch(() => {});
    } catch {
      // safe fallback
    }
  }, [settings]);

  // Load saved config & custom sounds from Rust backend on startup
  useEffect(() => {
    const initApp = async () => {
      try {
        const [customItems, backendStatus] = await Promise.all([
          invoke<SoundProfile[]>('get_custom_sounds').catch(() => [] as SoundProfile[]),
          invoke<AppSettings>('get_app_status').catch(() => null),
        ]);

        if (customItems && customItems.length > 0) {
          setSounds((prev) => {
            const builtIn = prev.filter((s) => !s.isCustom);
            return [...customItems, ...builtIn];
          });
        }

        if (backendStatus) {
          setSettings((prev) => ({
            ...prev,
            ...backendStatus,
          }));

          invoke('set_app_mode', { mode: backendStatus.mode || 'normal' }).catch(() => {});
          invoke('sync_audio_tuning', {
            isEnabled: backendStatus.isEnabled,
            volume: backendStatus.volume,
            pitch: backendStatus.pitch,
            playbackSpeed: backendStatus.playbackSpeed,
            randomPitch: backendStatus.randomPitch,
            randomVolume: backendStatus.randomVolume,
            selectedSoundId: backendStatus.selectedSoundId,
          }).catch(() => {});
          invoke('sync_piano_settings', {
            volume: backendStatus.pianoVolume ?? 85,
            octave: backendStatus.pianoOctave ?? 4,
            sustain: backendStatus.pianoSustain ?? false,
            preset: backendStatus.pianoPreset ?? 'grand_piano',
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to initialize app from backend:', err);
      }
    };
    initApp();
  }, []);

  // Listen for system-wide Windows keystroke, Piano & Tray events
  useEffect(() => {
    let unlistenKeystroke: (() => void) | undefined;
    let unlistenTrayToggle: (() => void) | undefined;
    let unlistenPianoNoteOn: (() => void) | undefined;
    let unlistenPianoNoteOff: (() => void) | undefined;
    let unlistenPianoOctave: (() => void) | undefined;
    let unlistenPianoSustain: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        unlistenKeystroke = await listen<KeyStrokePayload>('keyfx://keystroke', (event) => {
          const now = Date.now();
          setExternalKey({ label: event.payload.key_label, id: now + Math.random() });
          setIsKeyPulsing(true);
          setTimeout(() => setIsKeyPulsing(false), 140);
          setTotalKeystrokes((c) => c + 1);

          // Calculate dynamic live WPM based on a rolling 5-second window
          strokeTimestampsRef.current.push(now);
          strokeTimestampsRef.current = strokeTimestampsRef.current.filter((t) => now - t <= 5000);
          const charsInWindow = strokeTimestampsRef.current.length;
          const calculatedWpm = Math.round((charsInWindow / 5) * 12);
          setLiveWpm(calculatedWpm);
        });

        unlistenPianoNoteOn = await listen<PianoNoteEvent>('keyfx://piano-note-on', (event) => {
          setActivePianoNotes((prev) => new Set(prev).add(event.payload.note_full));
          setTotalKeystrokes((c) => c + 1);
        });

        unlistenPianoNoteOff = await listen<{ vk_code: number; note_full?: string }>('keyfx://piano-note-off', (event) => {
          if (event.payload.note_full) {
            const noteToRemove = event.payload.note_full;
            setActivePianoNotes((prev) => {
              const next = new Set(prev);
              next.delete(noteToRemove);
              return next;
            });
          }
        });

        unlistenPianoOctave = await listen<number>('keyfx://piano-octave-changed', (event) => {
          setSettings((prev) => ({ ...prev, pianoOctave: event.payload }));
          showToast(`Octave shifted to C${event.payload}`, 'info');
        });

        unlistenPianoSustain = await listen<boolean>('keyfx://piano-sustain-changed', (event) => {
          setLivePianoSustain(event.payload);
        });

        unlistenTrayToggle = await listen<boolean>('keyfx://tray-toggle-enabled', (event) => {
          setSettings((prev) => ({ ...prev, isEnabled: event.payload }));
          showToast(event.payload ? 'KeyFX is now ACTIVE' : 'KeyFX is MUTED', 'info');
        });

        // Query initial autostart status from Windows Registry
        const autostart = await invoke<boolean>('is_autostart_enabled');
        setSettings((prev) => ({ ...prev, startWithWindows: autostart }));
      } catch (err) {
        console.warn('Tauri event listener initialization:', err);
      }
    };

    setupListeners();

    // WPM cooldown decay timer
    const interval = setInterval(() => {
      const now = Date.now();
      strokeTimestampsRef.current = strokeTimestampsRef.current.filter((t) => now - t <= 5000);
      if (strokeTimestampsRef.current.length === 0) {
        setLiveWpm(0);
      } else {
        const charsInWindow = strokeTimestampsRef.current.length;
        setLiveWpm(Math.round((charsInWindow / 5) * 12));
      }
    }, 1000);

    return () => {
      if (unlistenKeystroke) unlistenKeystroke();
      if (unlistenPianoNoteOn) unlistenPianoNoteOn();
      if (unlistenPianoNoteOff) unlistenPianoNoteOff();
      if (unlistenPianoOctave) unlistenPianoOctave();
      if (unlistenPianoSustain) unlistenPianoSustain();
      if (unlistenTrayToggle) unlistenTrayToggle();
      clearInterval(interval);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const updateSettings = (updated: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
    if (updated.pianoSustain !== undefined) {
      setLivePianoSustain(updated.pianoSustain);
    }
  };

  const handleModeChange = (newMode: AppMode) => {
    setActivePianoNotes(new Set());
    updateSettings({ mode: newMode });
    try {
      invoke('set_app_mode', { mode: newMode }).catch(() => {});
      invoke('stop_all_piano_notes').catch(() => {});
    } catch {}
    showToast(
      newMode === 'piano'
        ? 'Switched to Real Piano Mode 🎹'
        : 'Switched to Normal Mode ⌨️',
      'success'
    );
  };

  // Play sound via native Rust audio engine
  const playSampleFeedback = (soundId?: string) => {
    if (!settings.isEnabled && !soundId) return;

    try {
      if (soundId) {
        invoke('preview_sound', { soundId }).catch(() => {});
      } else {
        invoke('trigger_test_sound').catch(() => {});
      }
    } catch {
      // safe fallback
    }
  };

  const currentSound =
    sounds.find((s) => s.id === settings.selectedSoundId) || sounds[0];

  const handleImportSound = async () => {
    try {
      const imported = await invoke<SoundProfile | null>('import_custom_sound');
      if (!imported) {
        return; // User cancelled dialog
      }

      setSounds((prev) => [imported, ...prev.filter((s) => s.id !== imported.id)]);
      updateSettings({ selectedSoundId: imported.id });
      showToast(`Imported "${imported.name}" successfully!`, 'success');
      playSampleFeedback(imported.id);
    } catch (err: any) {
      console.error('Import error:', err);
      showToast(`Import failed: ${err?.toString() || 'Invalid audio file'}`, 'error');
    }
  };

  const handleDeleteCustomSound = async (id: string) => {
    try {
      await invoke('delete_custom_sound', { soundId: id });
      setSounds((prev) => prev.filter((s) => s.id !== id));
      if (settings.selectedSoundId === id) {
        updateSettings({ selectedSoundId: INITIAL_SOUNDS[0].id });
      }
      showToast('Custom sound deleted.', 'info');
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`Failed to delete sound: ${err?.toString() || 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-neon-cyan selection:text-black relative overflow-hidden">
      {/* Background Animated Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className={`absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-700 ${
            settings.mode === 'piano' ? 'bg-neon-purple/10' : 'bg-neon-cyan/5'
          }`}
        />
        <div
          className={`absolute bottom-10 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-700 ${
            settings.mode === 'piano' ? 'bg-pink-600/10' : 'bg-neon-purple/5'
          }`}
        />
      </div>

      {/* Main Studio Header */}
      <Header
        isEnabled={settings.isEnabled}
        mode={settings.mode}
        onChangeMode={handleModeChange}
        onToggleEnabled={() => {
          const next = !settings.isEnabled;
          updateSettings({ isEnabled: next });
          if (!next) {
            setActivePianoNotes(new Set());
            invoke('stop_all_piano_notes').catch(() => {});
          }
          showToast(next ? 'KeyFX is now ACTIVE' : 'KeyFX is now MUTED', next ? 'success' : 'info');
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        liveWpm={liveWpm}
        totalKeystrokes={totalKeystrokes}
      />

      {/* Main Studio Body */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto p-5 sm:p-6 space-y-6">
        {/* Tab Views with Animated Transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'studio' && (
            <motion.div
              key={settings.mode === 'piano' ? 'piano-studio' : 'mech-studio'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {settings.mode === 'piano' ? (
                /* Dedicated Real Piano Mode Interface */
                <PianoView
                  pianoVolume={settings.pianoVolume}
                  pianoOctave={settings.pianoOctave}
                  pianoSustain={livePianoSustain}
                  pianoPreset={settings.pianoPreset}
                  activeNotes={activePianoNotes}
                  onChangeSettings={updateSettings}
                  onShowToast={showToast}
                />
              ) : (
                /* Normal Mechanical Keyboard Studio View */
                <>
                  <SoundHero
                    currentSound={currentSound}
                    isEnabled={settings.isEnabled}
                    onTestSound={() => playSampleFeedback()}
                    onOpenTuning={() => setActiveTab('studio')}
                    isKeyActive={isKeyPulsing}
                  />

                  <KeyVisualizer
                    externalKey={externalKey}
                    onTriggerVisualSound={() => playSampleFeedback()}
                  />

                  <SoundTuning
                    settings={settings}
                    onChangeSettings={updateSettings}
                    onResetDefaults={() => {
                      updateSettings({
                        volume: DEFAULT_SETTINGS.volume,
                        pitch: DEFAULT_SETTINGS.pitch,
                        playbackSpeed: DEFAULT_SETTINGS.playbackSpeed,
                        randomPitch: DEFAULT_SETTINGS.randomPitch,
                        randomVolume: DEFAULT_SETTINGS.randomVolume,
                        cooldownMs: DEFAULT_SETTINGS.cooldownMs,
                      });
                      showToast('Acoustic settings reset to defaults.', 'info');
                    }}
                  />
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <SoundLibrary
                sounds={sounds}
                selectedSoundId={settings.selectedSoundId}
                onSelectSound={(id) => {
                  updateSettings({ selectedSoundId: id });
                  const sound = sounds.find((s) => s.id === id);
                  if (sound) showToast(`Selected: ${sound.name}`, 'success');
                  playSampleFeedback(id);
                }}
                onPreviewSound={(id) => playSampleFeedback(id)}
                onImportSound={handleImportSound}
                onDeleteCustomSound={handleDeleteCustomSound}
              />
            </motion.div>
          )}

          {activeTab === 'scope' && (
            <motion.div
              key="scope"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <KeyboardScopeSelector
                currentScope={settings.keyboardScope}
                onChangeScope={(scope) => {
                  updateSettings({ keyboardScope: scope });
                  showToast(`Scope set to: ${scope.replace('_', ' ').toUpperCase()}`, 'info');
                }}
              />

              <KeyVisualizer
                externalKey={externalKey}
                onTriggerVisualSound={() => playSampleFeedback()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onChangeSettings={updateSettings}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-2 duration-150 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/80'
              : toastMessage.type === 'info'
              ? 'bg-blue-950/90 border-blue-500/40 text-blue-200 shadow-blue-950/80'
              : 'bg-[#0f1828]/95 border-neon-cyan/50 text-neon-cyan shadow-cyan-950/90'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-neon-cyan" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

export default App;
