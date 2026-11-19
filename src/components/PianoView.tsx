import React, { useState, useMemo, useEffect } from 'react';
import { Volume2, Music, Disc, BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface PianoViewProps {
  pianoVolume: number;
  pianoOctave: number;
  pianoSustain: boolean;
  pianoPreset: string;
  activeNotes: Set<string>; // set of note_full like "C4", "C#4", etc.
  onChangeSettings: (updates: {
    pianoVolume?: number;
    pianoOctave?: number;
    pianoSustain?: boolean;
    pianoPreset?: string;
  }) => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

interface PianoKeyDef {
  note: string;
  octaveOffset: number;
  isWhite: boolean;
  shortcut: string;
}

interface Full88Key {
  note: string;
  octave: number;
  fullNote: string;
  isWhite: boolean;
  midi: number;
  whiteIndex: number;
}

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Focused 20-Key Performance Layout mapped to standard computer keyboard
const FOCUSED_KEY_LAYOUT: PianoKeyDef[] = [
  // Octave 0 (Base Octave)
  { note: 'C', octaveOffset: 0, isWhite: true, shortcut: 'A' },
  { note: 'C#', octaveOffset: 0, isWhite: false, shortcut: 'W' },
  { note: 'D', octaveOffset: 0, isWhite: true, shortcut: 'S' },
  { note: 'D#', octaveOffset: 0, isWhite: false, shortcut: 'E' },
  { note: 'E', octaveOffset: 0, isWhite: true, shortcut: 'D' },
  { note: 'F', octaveOffset: 0, isWhite: true, shortcut: 'F' },
  { note: 'F#', octaveOffset: 0, isWhite: false, shortcut: 'T' },
  { note: 'G', octaveOffset: 0, isWhite: true, shortcut: 'G' },
  { note: 'G#', octaveOffset: 0, isWhite: false, shortcut: 'Y' },
  { note: 'A', octaveOffset: 0, isWhite: true, shortcut: 'H' },
  { note: 'A#', octaveOffset: 0, isWhite: false, shortcut: 'U' },
  { note: 'B', octaveOffset: 0, isWhite: true, shortcut: 'J' },

  // Octave 1 (Upper Octave)
  { note: 'C', octaveOffset: 1, isWhite: true, shortcut: 'K' },
  { note: 'C#', octaveOffset: 1, isWhite: false, shortcut: 'O' },
  { note: 'D', octaveOffset: 1, isWhite: true, shortcut: 'L' },
  { note: 'D#', octaveOffset: 1, isWhite: false, shortcut: 'P' },
  { note: 'E', octaveOffset: 1, isWhite: true, shortcut: ';' },
  { note: 'F', octaveOffset: 1, isWhite: true, shortcut: "'" },
  { note: 'F#', octaveOffset: 1, isWhite: false, shortcut: '[' },
  { note: 'G', octaveOffset: 1, isWhite: true, shortcut: ']' },
];

const PRESETS = [
  {
    id: 'grand_piano',
    name: 'Yamaha C5 Concert Grand',
    desc: 'Acoustic grand with resonant spruce soundboard & rich harmonic depth',
    icon: '🎹',
    tag: 'Full Spectrum',
  },
  {
    id: 'bright_piano',
    name: 'Bright Studio Grand',
    desc: 'Crisp, articulate hammer strike with enhanced presence and high-shelf punch',
    icon: '🎼',
    tag: 'Bright Attack',
  },
  {
    id: 'upright_piano',
    name: 'Mellow Upright Piano',
    desc: 'Intimate felt upright piano with warm, soft damping and woody acoustic tone',
    icon: '🪵',
    tag: 'Warm Felt',
  },
  {
    id: 'electric_piano',
    name: 'Vintage Electric (Rhodes)',
    desc: 'Classic bell tine harmonics with warm chorused decay and stereo pan',
    icon: '⚡',
    tag: 'Analog Tine',
  },
];

const SONG_TUTORIALS = [
  {
    title: 'Happy Birthday',
    keys: 'C - C - D - C - F - E | C - C - D - C - G - F',
    typing: 'A  A  S  A  F  D  |  A  A  S  A  G  F',
    difficulty: 'Easy',
  },
  {
    title: 'Für Elise (Beethoven)',
    keys: 'E - D# - E - D# - E - B - D - C - A',
    typing: 'E  E  E  E  E  J  S  A  A',
    difficulty: 'Intermediate',
  },
  {
    title: 'Twinkle Twinkle Little Star',
    keys: 'C - C - G - G - A - A - G',
    typing: 'A  A  G  G  H  H  G',
    difficulty: 'Easy',
  },
  {
    title: 'Ode to Joy (Beethoven)',
    keys: 'E - E - F - G - G - F - E - D - C - C - D - E - E - D - D',
    typing: 'D  D  F  G  G  F  D  S  A  A  S  D  D  S  S',
    difficulty: 'Intermediate',
  },
  {
    title: 'Interstellar Main Theme',
    keys: 'A - E - A - E - A - E - A - E',
    typing: 'H  D  H  D  H  D  H  D',
    difficulty: 'Easy',
  },
  {
    title: 'Canon in D (Pachelbel)',
    keys: 'D - A - B - F# - G - D - G - A',
    typing: 'S  H  J  T  G  S  G  H',
    difficulty: 'Intermediate',
  },
];

export const PianoView: React.FC<PianoViewProps> = ({
  pianoVolume,
  pianoOctave,
  pianoSustain,
  pianoPreset,
  activeNotes,
  onChangeSettings,
  onShowToast,
}) => {
  const [isSongbookOpen, setIsSongbookOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'both' | '88keys' | 'focused'>('both');

  // Prevent Spacebar from scrolling the page or activating focused buttons
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate complete 88 Keys (A0 = MIDI 21 to C8 = MIDI 108)
  const { all88WhiteKeys, all88BlackKeys } = useMemo(() => {
    const whiteKeys: Full88Key[] = [];
    const blackKeys: Full88Key[] = [];
    let whiteCounter = 0;

    for (let m = 21; m <= 108; m++) {
      const noteIndex = m % 12;
      const octave = Math.floor(m / 12) - 1;
      const note = CHROMATIC_NOTES[noteIndex];
      const isWhite = !note.includes('#');

      if (isWhite) {
        whiteKeys.push({
          note,
          octave,
          fullNote: `${note}${octave}`,
          isWhite: true,
          midi: m,
          whiteIndex: whiteCounter++,
        });
      } else {
        blackKeys.push({
          note,
          octave,
          fullNote: `${note}${octave}`,
          isWhite: false,
          midi: m,
          whiteIndex: whiteCounter - 1, // associate with previous white key
        });
      }
    }

    return { all88WhiteKeys: whiteKeys, all88BlackKeys: blackKeys };
  }, []);

  // Trigger piano note on click / touch
  const handleDirectPlay = (noteName: string, octave: number, midiCode: number) => {
    try {
      invoke('trigger_piano_note_on', {
        vk: 0x9000 + midiCode,
        noteName,
        octave,
        velocity: 1.0,
      }).catch(() => {});
    } catch {
      // safe fallback
    }
  };

  const handleDirectRelease = (midiCode: number) => {
    try {
      invoke('trigger_piano_note_off', {
        vk: 0x9000 + midiCode,
      }).catch(() => {});
    } catch {
      // safe fallback
    }
  };

  const handleOctaveShift = (delta: number, e?: React.MouseEvent) => {
    if (e) (e.currentTarget as HTMLElement).blur();
    const nextOctave = Math.max(1, Math.min(7, pianoOctave + delta));
    if (nextOctave !== pianoOctave) {
      onChangeSettings({ pianoOctave: nextOctave });
      invoke('set_piano_octave', { octave: nextOctave }).catch(() => {});
      onShowToast(`Octave shifted to C${nextOctave}`, 'info');
    }
  };

  const handleToggleSustain = (e?: React.MouseEvent) => {
    if (e) (e.currentTarget as HTMLElement).blur();
    const next = !pianoSustain;
    onChangeSettings({ pianoSustain: next });
    invoke('set_piano_sustain', { sustain: next }).catch(() => {});
    onShowToast(next ? 'Sustain Pedal: LATCHED ON' : 'Sustain Pedal: RELEASED', next ? 'success' : 'info');
  };

  const focusedWhiteKeys = FOCUSED_KEY_LAYOUT.filter((k) => k.isWhite);

  // Compute active keyboard zone range on the full 88-key deck
  const startWhiteIndex = Math.max(0, 2 + (pianoOctave - 1) * 7);
  const endWhiteIndex = Math.min(51, startWhiteIndex + 11);
  const bracketLeftPercent = (startWhiteIndex / 52) * 100;
  const bracketWidthPercent = ((endWhiteIndex - startWhiteIndex + 1) / 52) * 100;

  return (
    <div className="space-y-6">
      {/* Concert Instrument Selector & Controls Header */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-2xl space-y-4">
        {/* Preset Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Disc className="w-3.5 h-3.5 text-neon-cyan" />
              Concert Instrument Engine:
            </span>
            <span className="text-[11px] font-mono text-neon-purple font-semibold bg-neon-purple/10 px-2 py-0.5 rounded-md border border-neon-purple/30">
              {PRESETS.find((p) => p.id === pianoPreset)?.tag || 'Acoustic'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESETS.map((p) => {
              const isSelected = pianoPreset === p.id;

              return (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onChangeSettings({ pianoPreset: p.id });
                    try {
                      invoke('set_piano_preset', { preset: p.id }).catch(() => {});
                      invoke('preview_piano_preset', { preset: p.id }).catch(() => {});
                    } catch {}
                    onShowToast(`Selected: ${p.name}`, 'success');
                  }}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-neon-purple/20 via-[#18162A] to-[#0E101D] border-neon-purple/60 text-white shadow-glow-purple ring-1 ring-neon-purple/40'
                      : 'bg-[#101524] hover:bg-[#182033] border-white/[0.06] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{p.icon}</span>
                    {isSelected && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-neon-purple bg-neon-purple/20 px-1.5 py-0.5 rounded border border-neon-purple/40">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white mt-1.5 leading-snug">{p.name}</span>
                  <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Second Row: Octave Shifter, Sustain Pedal, Volume & Songbook */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          {/* Octave Shifter */}
          <div className="flex items-center gap-2 bg-[#0F1422] p-1.5 rounded-xl border border-white/[0.06]">
            <span className="text-[11px] font-bold text-slate-400 px-2 font-mono">OCTAVE</span>
            <button
              onClick={(e) => handleOctaveShift(-1, e)}
              disabled={pianoOctave <= 1}
              className="w-7 h-7 rounded-lg bg-[#182033] hover:bg-[#222C44] disabled:opacity-40 disabled:hover:bg-[#182033] flex items-center justify-center text-white text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-black text-neon-cyan px-2 text-xs">
              C{pianoOctave}
            </span>
            <button
              onClick={(e) => handleOctaveShift(1, e)}
              disabled={pianoOctave >= 7}
              className="w-7 h-7 rounded-lg bg-[#182033] hover:bg-[#222C44] disabled:opacity-40 disabled:hover:bg-[#182033] flex items-center justify-center text-white text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sustain Pedal Toggle Button */}
          <button
            onClick={handleToggleSustain}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              pianoSustain
                ? 'bg-gradient-to-r from-neon-purple/20 to-pink-600/30 border-neon-purple/60 text-neon-purple shadow-glow-purple ring-1 ring-neon-purple/40'
                : 'bg-[#0F1422] hover:bg-[#182033] border-white/[0.06] text-slate-300'
            }`}
            title="Toggle Sustain Pedal or hold Spacebar while typing"
          >
            <span className={`w-2 h-2 rounded-full ${pianoSustain ? 'bg-neon-purple animate-ping' : 'bg-slate-600'}`} />
            <span>Sustain Pedal</span>
            <span className="text-[10px] font-mono opacity-70 px-1.5 py-0.5 rounded bg-white/[0.06]">
              SPACEBAR
            </span>
          </button>

          {/* Master Piano Volume */}
          <div className="flex items-center gap-2 bg-[#0F1422] px-3 py-1.5 rounded-xl border border-white/[0.06]">
            <Volume2 className="w-3.5 h-3.5 text-neon-cyan" />
            <input
              type="range"
              min="0"
              max="100"
              value={pianoVolume}
              onChange={(e) => onChangeSettings({ pianoVolume: Number(e.target.value) })}
              className="w-20"
            />
            <span className="text-[10px] font-mono font-bold text-neon-cyan w-8 text-right">
              {pianoVolume}%
            </span>
          </div>

          {/* Deck View Mode Selector */}
          <div className="flex items-center bg-[#0F1422] p-1 rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                setViewMode('both');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Deck
            </button>
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                setViewMode('88keys');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === '88keys'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              88 Keys
            </button>
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                setViewMode('focused');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'focused'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Performance
            </button>
          </div>

          {/* Songbook Tutorial Action Button */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              setIsSongbookOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/40 text-neon-cyan hover:text-white text-xs font-bold transition-all cursor-pointer shadow-glow-cyan-sm active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Songbook Tutorials</span>
          </button>
        </div>
      </div>

      {/* 88-Key Acoustic Piano Roll */}
      {(viewMode === 'both' || viewMode === '88keys') && (
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-cyan" />
              <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                Full 88-Key Acoustic Grand Deck (A0 - C8)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Active Zone: <span className="text-neon-cyan font-bold">C{pianoOctave} - G{pianoOctave + 1}</span>
            </span>
          </div>

          {/* Fallboard & Damper Felt Strip */}
          <div className="relative rounded-xl overflow-hidden border border-white/[0.1] bg-[#07090F] shadow-2xl">
            {/* Wood Fallboard Top Rim */}
            <div className="h-4 bg-gradient-to-b from-[#2B1810] via-[#1A0E0A] to-[#0D0705] border-b border-black flex items-center justify-center">
              <div className="h-[2px] w-full bg-gradient-to-r from-amber-900/20 via-amber-600/40 to-amber-900/20" />
            </div>

            {/* Red Damper Felt Line */}
            <div className="h-1.5 bg-[#8B0000] shadow-inner" />

            {/* Active Range Bracket Indicator */}
            <div
              className="absolute top-5 h-1 bg-neon-cyan/80 z-20 pointer-events-none transition-all duration-300 shadow-glow-cyan"
              style={{
                left: `${bracketLeftPercent}%`,
                width: `${bracketWidthPercent}%`,
              }}
            />

            {/* Piano Keys Deck */}
            <div className="relative h-28 w-full select-none overflow-x-auto">
              {/* White Keys */}
              <div className="flex h-full w-full">
                {all88WhiteKeys.map((k) => {
                  const isActive = activeNotes.has(k.fullNote);

                  return (
                    <button
                      key={k.fullNote}
                      onMouseDown={() => handleDirectPlay(k.note, k.octave, k.midi)}
                      onMouseUp={() => handleDirectRelease(k.midi)}
                      onMouseLeave={() => handleDirectRelease(k.midi)}
                      className={`relative flex-1 h-full border-r border-slate-400/30 rounded-b-md transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-b from-neon-cyan to-cyan-300 shadow-glow-cyan translate-y-0.5 z-10'
                          : 'bg-gradient-to-b from-white via-slate-100 to-slate-200 hover:bg-slate-100'
                      }`}
                      title={k.fullNote}
                    >
                      {k.note === 'C' && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-slate-600">
                          C{k.octave}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Black Keys */}
              {all88BlackKeys.map((k) => {
                const isActive = activeNotes.has(k.fullNote);
                const leftPercent = ((k.whiteIndex + 0.65) / 52) * 100;

                return (
                  <button
                    key={k.fullNote}
                    onMouseDown={() => handleDirectPlay(k.note, k.octave, k.midi)}
                    onMouseUp={() => handleDirectRelease(k.midi)}
                    onMouseLeave={() => handleDirectRelease(k.midi)}
                    className={`absolute top-0 h-16 w-[1.3%] rounded-b-sm border-x border-b border-black transition-all cursor-pointer z-10 ${
                      isActive
                        ? 'bg-gradient-to-b from-neon-purple to-purple-400 shadow-glow-purple translate-y-0.5'
                        : 'bg-gradient-to-b from-[#111111] via-[#1E1E1E] to-black hover:bg-neutral-800'
                    }`}
                    style={{ left: `${leftPercent}%` }}
                    title={k.fullNote}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Focused 20-Key Performance Deck */}
      {(viewMode === 'both' || viewMode === 'focused') && (
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-purple" />
              <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                Performance Synthesizer Deck (Mapped to Computer Keyboard)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Type on your keyboard anywhere or click keys directly
            </span>
          </div>

          {/* Focused Key Deck */}
          <div className="relative rounded-xl bg-[#090D15] p-4 border border-white/[0.08] shadow-key-chassis overflow-x-auto">
            <div className="relative flex min-w-[650px] justify-center h-36">
              {/* White Keys */}
              {focusedWhiteKeys.map((keyDef, idx) => {
                const fullNote = `${keyDef.note}${pianoOctave + keyDef.octaveOffset}`;
                const isActive = activeNotes.has(fullNote);

                return (
                  <button
                    key={fullNote}
                    onMouseDown={() => handleDirectPlay(keyDef.note, pianoOctave + keyDef.octaveOffset, 60 + idx)}
                    onMouseUp={() => handleDirectRelease(60 + idx)}
                    onMouseLeave={() => handleDirectRelease(60 + idx)}
                    className={`relative flex-1 max-w-[48px] h-full rounded-b-xl border-r border-b border-l border-slate-300/40 flex flex-col justify-between items-center pb-2 pt-1 transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-gradient-to-b from-neon-cyan via-cyan-200 to-white shadow-glow-cyan translate-y-1 z-10'
                        : 'bg-gradient-to-b from-white via-slate-100 to-slate-200 hover:from-slate-100 hover:to-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {fullNote}
                    </span>
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shadow-md">
                      {keyDef.shortcut}
                    </span>
                  </button>
                );
              })}

              {/* Black Keys */}
              {FOCUSED_KEY_LAYOUT.filter((k) => !k.isWhite).map((keyDef) => {
                const fullNote = `${keyDef.note}${pianoOctave + keyDef.octaveOffset}`;
                const isActive = activeNotes.has(fullNote);

                // Position relative to white key
                const whiteIndex = focusedWhiteKeys.findIndex(
                  (w) => w.note === keyDef.note.replace('#', '') && w.octaveOffset === keyDef.octaveOffset
                );
                const leftPercent = ((whiteIndex + 0.68) / focusedWhiteKeys.length) * 100;

                return (
                  <button
                    key={fullNote}
                    onMouseDown={() => handleDirectPlay(keyDef.note, pianoOctave + keyDef.octaveOffset, 80)}
                    onMouseUp={() => handleDirectRelease(80)}
                    onMouseLeave={() => handleDirectRelease(80)}
                    className={`absolute top-0 h-22 w-[5.5%] rounded-b-lg border-x border-b border-black flex flex-col justify-between items-center pb-1.5 pt-1 transition-all cursor-pointer z-10 select-none ${
                      isActive
                        ? 'bg-gradient-to-b from-neon-purple to-purple-400 shadow-glow-purple translate-y-1'
                        : 'bg-gradient-to-b from-[#181818] via-[#101010] to-black hover:bg-neutral-800'
                    }`}
                    style={{ left: `${leftPercent}%` }}
                  >
                    <span className="text-[9px] font-mono font-bold text-slate-300">
                      {fullNote}
                    </span>
                    <span className="w-5 h-5 rounded bg-neon-purple/20 border border-neon-purple/40 text-neon-purple font-mono font-bold text-[10px] flex items-center justify-center">
                      {keyDef.shortcut}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Songbook Modal */}
      {isSongbookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#141B2B] to-[#0D121E] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0A0E18]/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center text-neon-purple">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Piano Songbook Tutorials</h3>
                  <p className="text-xs text-slate-400">Play famous melodies using your computer keyboard</p>
                </div>
              </div>

              <button
                onClick={() => setIsSongbookOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 gap-3">
                {SONG_TUTORIALS.map((song, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#0F1422] border border-white/[0.06] hover:border-neon-cyan/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <Music className="w-4 h-4 text-neon-cyan" />
                        {song.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                        {song.difficulty}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-500 font-semibold">Musical Notes: </span>
                        <code className="text-neon-cyan font-mono">{song.keys}</code>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <span className="text-slate-500 font-semibold">Type Keys: </span>
                        <code className="text-white font-mono font-bold bg-white/[0.08] px-2 py-0.5 rounded">
                          {song.typing}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#0A0E18]/60 flex justify-end">
              <button
                onClick={() => setIsSongbookOpen(false)}
                className="px-5 py-2 rounded-xl bg-neon-cyan hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-glow-cyan-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
