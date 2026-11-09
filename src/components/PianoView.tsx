import React, { useState, useMemo, useEffect } from 'react';
import { Volume2, Music, Disc, Sparkles, BookOpen, ChevronLeft, ChevronRight, HelpCircle, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    desc: 'World-renowned acoustic grand piano with resonant spruce soundboard & rich harmonic overtones',
    icon: '🎹',
  },
  {
    id: 'bright_piano',
    name: 'Bright Studio Grand',
    desc: 'Crisp, articulate hammer strike with enhanced presence and upper harmonic punch',
    icon: '🎼',
  },
  {
    id: 'upright_piano',
    name: 'Mellow Upright Piano',
    desc: 'Intimate felt upright piano with warm, soft damping and woody acoustic depth',
    icon: '🪵',
  },
  {
    id: 'electric_piano',
    name: 'Vintage Electric (Rhodes)',
    desc: 'Classic bell tine attack with warm singing chorused decay',
    icon: '⚡',
  },
];

const SONG_TUTORIALS = [
  {
    title: 'Für Elise (Beethoven)',
    keys: 'E - D# - E - D# - E - B - D - C - A',
    typing: 'E  E  E  E  E  J  S  A  A',
  },
  {
    title: 'Twinkle Twinkle Little Star',
    keys: 'C - C - G - G - A - A - G',
    typing: 'A  A  G  G  H  H  G',
  },
  {
    title: 'Ode to Joy (Beethoven)',
    keys: 'E - E - F - G - G - F - E - D - C - C - D - E - E - D - D',
    typing: 'D  D  F  G  G  F  D  S  A  A  S  D  D  S  S',
  },
  {
    title: 'Interstellar Main Theme',
    keys: 'A - E - A - E - A - E - A - E',
    typing: 'H  D  H  D  H  D  H  D',
  },
  {
    title: 'Canon in D (Pachelbel)',
    keys: 'D - A - B - F# - G - D - G - A',
    typing: 'S  H  J  T  G  S  G  H',
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
  const [showKeyLabels, setShowKeyLabels] = useState(true);
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
  // A0 is whiteIndex 0. C1 is whiteIndex 2. C(octave) is:
  // C1 = 2, C2 = 9, C3 = 16, C4 = 23, C5 = 30, C6 = 37, C7 = 44, C8 = 51
  const startWhiteIndex = Math.max(0, 2 + (pianoOctave - 1) * 7);
  const endWhiteIndex = Math.min(51, startWhiteIndex + 11);
  const bracketLeftPercent = (startWhiteIndex / 52) * 100;
  const bracketWidthPercent = ((endWhiteIndex - startWhiteIndex + 1) / 52) * 100;

  return (
    <div className="space-y-6">
      {/* Piano Control Strip */}
      <div className="bg-surface/90 border border-surfaceBorder rounded-3xl p-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Preset Selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-neon-cyan" />
                Concert Instrument:
              </span>
              <div className="flex items-center bg-background/80 rounded-2xl p-1 border border-surfaceBorder">
                {PRESETS.map((p) => {
                  const isSelected = pianoPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={(e) => {
                        (e.currentTarget as HTMLElement).blur();
                        onChangeSettings({ pianoPreset: p.id });
                        invoke('preview_piano_preset', { preset: p.id }).catch(() => {});
                        onShowToast(`Selected: ${p.name}`, 'success');
                      }}
                      title={p.desc}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-neon-cyan/20 to-blue-600/30 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-surfaceHover/50'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span className="hidden sm:inline">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 px-1 flex items-center gap-1.5">
              <span className="text-neon-cyan font-semibold">Active Timbre:</span>
              <span>{PRESETS.find((p) => p.id === pianoPreset)?.desc}</span>
            </p>
          </div>

          {/* View Mode & Octave Controls */}
          <div className="flex items-center gap-3">
            {/* View Mode Selector */}
            <div className="flex items-center bg-background/80 border border-surfaceBorder rounded-2xl p-1 text-xs">
              <button
                onClick={(e) => { (e.currentTarget as HTMLElement).blur(); setViewMode('both'); }}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'both' ? 'bg-surface border border-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Show both 88-Key Panoramic Deck and Focused Playing Deck"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Dual</span>
              </button>
              <button
                onClick={(e) => { (e.currentTarget as HTMLElement).blur(); setViewMode('88keys'); }}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  viewMode === '88keys' ? 'bg-surface border border-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Full 88-Key Grand Piano Only"
              >
                <span>88 Keys</span>
              </button>
              <button
                onClick={(e) => { (e.currentTarget as HTMLElement).blur(); setViewMode('focused'); }}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'focused' ? 'bg-surface border border-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Focused Keyboard Performance Deck Only"
              >
                <span>Focused</span>
              </button>
            </div>

            {/* Octave Shifter */}
            <div className="flex items-center bg-background/80 border border-surfaceBorder rounded-2xl p-1">
              <button
                onClick={(e) => handleOctaveShift(-1, e)}
                disabled={pianoOctave <= 1}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-surfaceHover disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Octave Down (Shortcut: Z)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 text-center min-w-[85px]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Octave</div>
                <div className="text-xs font-black font-mono text-neon-cyan">
                  C{pianoOctave} <span className="text-[10px] text-slate-400 font-normal">to C{pianoOctave + 1}</span>
                </div>
              </div>

              <button
                onClick={(e) => handleOctaveShift(1, e)}
                disabled={pianoOctave >= 7}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-surfaceHover disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Octave Up (Shortcut: X)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sustain Pedal Button */}
            <button
              onClick={handleToggleSustain}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer shadow-lg ${
                pianoSustain
                  ? 'bg-gradient-to-r from-neon-emerald/25 to-teal-600/30 border-neon-emerald/60 text-neon-emerald shadow-glow-emerald/30'
                  : 'bg-background/80 border-surfaceBorder text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
              title="Toggle Sustain Pedal (Hold notes after key release). Shortcut: Spacebar"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  pianoSustain ? 'bg-neon-emerald shadow-glow-emerald animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span>SUSTAIN</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/40 text-[9px] text-slate-300 font-mono">
                SPACE
              </kbd>
            </button>

            {/* Songbook */}
            <button
              onClick={() => setIsSongbookOpen(!isSongbookOpen)}
              className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                isSongbookOpen
                  ? 'bg-neon-purple/20 border-neon-purple text-neon-purple'
                  : 'bg-background/80 border-surfaceBorder text-slate-400 hover:text-slate-200'
              }`}
              title="Open Piano Songbook & Key Cheat Sheet"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Volume & Details Bar */}
        <div className="mt-4 pt-4 border-t border-surfaceBorder/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-2 flex-1 sm:w-48">
              <input
                type="range"
                min="0"
                max="100"
                value={pianoVolume}
                onChange={(e) => onChangeSettings({ pianoVolume: Number(e.target.value) })}
                className="w-full accent-neon-cyan h-1.5 bg-background rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-300 min-w-[32px]">
                {pianoVolume}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <button
              onClick={() => setShowKeyLabels(!showKeyLabels)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              {showKeyLabels ? 'Hide Key Hints' : 'Show Key Hints'}
            </button>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-neon-cyan">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              World-Class Yamaha C5 Acoustic Samples Active (88 Keys)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FULL 88-KEY CONCERT GRAND PIANO PANORAMIC DECK                         */}
      {/* ========================================================================= */}
      {(viewMode === 'both' || viewMode === '88keys') && (
        <div className="relative bg-gradient-to-b from-[#131926] via-[#0d131f] to-[#080c14] border-2 border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
          {/* Concert Grand Top Header Bar */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2 font-mono font-extrabold text-white tracking-wider">
              <span className="text-base">🎹</span>
              <span>FULL 88-KEY CONCERT GRAND DECK (A0 — C8)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              52 White Keys · 36 Black Keys · Click or Drag Any Key
            </span>
          </div>

          {/* Red Felt String Rail */}
          <div className="h-2 w-full bg-gradient-to-r from-red-800 via-red-600 to-red-800 rounded-t-sm shadow-inner mb-1" />

          {/* 88-Key Bed */}
          <div className="relative select-none w-full overflow-hidden">
            {/* Active Keyboard Zone Highlight Bracket */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none border-2 border-neon-cyan rounded-lg bg-neon-cyan/10 transition-all duration-300 z-30 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              style={{
                left: `${bracketLeftPercent}%`,
                width: `${bracketWidthPercent}%`,
              }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono font-black text-neon-cyan px-2 py-0.5 rounded border border-neon-cyan/60 whitespace-nowrap shadow-md">
                Active Computer Keyboard Zone (C{pianoOctave})
              </div>
            </div>

            {/* White Keys Strip (52 White Keys) */}
            <div className="relative flex w-full h-24 sm:h-28 z-10">
              {all88WhiteKeys.map((wKey, idx) => {
                const isActive = activeNotes.has(wKey.fullNote);
                const isOctaveC = wKey.note === 'C';

                return (
                  <div
                    key={`88-w-${wKey.fullNote}-${idx}`}
                    onMouseDown={() => handleDirectPlay(wKey.note, wKey.octave, wKey.midi)}
                    onMouseUp={() => handleDirectRelease(wKey.midi)}
                    onMouseLeave={() => handleDirectRelease(wKey.midi)}
                    title={wKey.fullNote}
                    className={`relative flex-1 rounded-b-[3px] border-r border-b border-slate-400/40 cursor-pointer flex flex-col justify-end items-center pb-1 transition-all ${
                      isActive
                        ? 'bg-gradient-to-b from-cyan-200 to-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.9)] text-black'
                        : 'bg-gradient-to-b from-white via-slate-100 to-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {isOctaveC && (
                      <span className="text-[8px] font-black font-mono text-slate-800 select-none">
                        C{wKey.octave}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Black Keys Strip (36 Black Keys, Positioned Absolutely) */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {all88BlackKeys.map((bKey, idx) => {
                const isActive = activeNotes.has(bKey.fullNote);
                // Position based on whiteIndex
                // Each white key occupies (100 / 52)%
                const leftPos = ((bKey.whiteIndex + 0.65) / 52) * 100;

                return (
                  <div
                    key={`88-b-${bKey.fullNote}-${idx}`}
                    onMouseDown={() => handleDirectPlay(bKey.note, bKey.octave, bKey.midi)}
                    onMouseUp={() => handleDirectRelease(bKey.midi)}
                    onMouseLeave={() => handleDirectRelease(bKey.midi)}
                    title={bKey.fullNote}
                    className={`absolute pointer-events-auto w-[1.3%] h-14 sm:h-16 rounded-b-[2px] shadow-xl border-x border-b cursor-pointer transition-all ${
                      isActive
                        ? 'bg-gradient-to-b from-purple-600 via-neon-purple to-pink-500 shadow-[0_0_15px_rgba(180,50,255,0.9)] border-purple-400'
                        : 'bg-gradient-to-b from-[#222834] via-[#141a24] to-[#0a0d14] hover:from-slate-700 hover:to-black border-black'
                    }`}
                    style={{
                      left: `${leftPos}%`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Active Note Readout */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>
              Active Sound: <strong className="text-white">{activeNotes.size > 0 ? Array.from(activeNotes).join(', ') : 'None'}</strong>
            </span>
            <span className="text-neon-cyan">
              Tip: Press Z / X to shift the active keyboard bracket across all 88 keys
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FOCUSED PERFORMANCE DECK (LARGE KEYS & KEYBOARD MAPPINGS)              */}
      {/* ========================================================================= */}
      {(viewMode === 'both' || viewMode === 'focused') && (
        <div className="relative bg-gradient-to-b from-[#111724] via-[#0d131e] to-[#0a0e17] border-2 border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Deck Header */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2 font-mono font-extrabold text-white tracking-wider">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              <span>ACTIVE PERFORMANCE DECK (PLAY WITH COMPUTER KEYBOARD)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Current Octave: <strong className="text-neon-cyan">C{pianoOctave} — G{pianoOctave + 1}</strong>
              </span>
            </div>
          </div>

          {/* Felt Red Rail at top of piano keys */}
          <div className="h-2.5 w-full bg-gradient-to-r from-red-700 via-red-500 to-red-700 rounded-t-lg shadow-inner mb-2 opacity-90 border-b border-red-900" />

          {/* Keyboard Chassis */}
          <div className="relative flex justify-center items-start select-none py-1 overflow-x-auto">
            <div className="relative inline-flex items-start">
              {/* White Keys */}
              {focusedWhiteKeys.map((keyDef, idx) => {
                const fullOctave = Math.min(8, Math.max(1, pianoOctave + keyDef.octaveOffset));
                const fullNote = `${keyDef.note}${fullOctave}`;
                const isActive = activeNotes.has(fullNote);

                return (
                  <motion.div
                    key={`${keyDef.note}-${idx}`}
                    onMouseDown={() => handleDirectPlay(keyDef.note, fullOctave, 60 + keyDef.octaveOffset * 12)}
                    onMouseUp={() => handleDirectRelease(60 + keyDef.octaveOffset * 12)}
                    onMouseLeave={() => handleDirectRelease(60 + keyDef.octaveOffset * 12)}
                    animate={{
                      y: isActive ? 5 : 0,
                    }}
                    transition={{ duration: 0.04 }}
                    className={`relative w-12 sm:w-14 h-48 sm:h-56 rounded-b-xl border border-slate-400/40 shadow-lg cursor-pointer flex flex-col justify-end items-center pb-3 transition-colors ${
                      isActive
                        ? 'bg-gradient-to-b from-cyan-100 via-cyan-200 to-neon-cyan shadow-[0_0_25px_rgba(0,240,255,0.7)] text-black border-cyan-300'
                        : 'bg-gradient-to-b from-white via-slate-100 to-slate-200 hover:from-slate-100 hover:to-slate-300 text-slate-800'
                    }`}
                    style={{
                      marginRight: idx < focusedWhiteKeys.length - 1 ? '2px' : '0',
                      zIndex: 10,
                    }}
                  >
                    {/* Subtle 3D Key Ridge */}
                    <div className="absolute inset-x-1 bottom-1 h-2 rounded-b-lg bg-black/10 pointer-events-none" />

                    {/* Note & Keyboard Badge */}
                    <div className="text-center pointer-events-none">
                      <div className="text-xs font-black tracking-tight font-mono">{fullNote}</div>
                      {showKeyLabels && (
                        <kbd
                          className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shadow-sm ${
                            isActive
                              ? 'bg-black text-neon-cyan'
                              : 'bg-slate-300/80 text-slate-700 border border-slate-400'
                          }`}
                        >
                          {keyDef.shortcut}
                        </kbd>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Black Keys (Overlayed Absolutely) */}
              <div className="absolute inset-0 pointer-events-none flex items-start" style={{ zIndex: 20 }}>
                {[
                  { note: 'C#', oct: 0, whiteIndex: 0, shortcut: 'W' },
                  { note: 'D#', oct: 0, whiteIndex: 1, shortcut: 'E' },
                  { note: 'F#', oct: 0, whiteIndex: 3, shortcut: 'T' },
                  { note: 'G#', oct: 0, whiteIndex: 4, shortcut: 'Y' },
                  { note: 'A#', oct: 0, whiteIndex: 5, shortcut: 'U' },
                  { note: 'C#', oct: 1, whiteIndex: 7, shortcut: 'O' },
                  { note: 'D#', oct: 1, whiteIndex: 8, shortcut: 'P' },
                  { note: 'F#', oct: 1, whiteIndex: 10, shortcut: '[' },
                  { note: 'G#', oct: 1, whiteIndex: 11, shortcut: ']' },
                ].map((bKey, idx) => {
                  const fullOctave = Math.min(8, Math.max(1, pianoOctave + bKey.oct));
                  const fullNote = `${bKey.note}${fullOctave}`;
                  const isActive = activeNotes.has(fullNote);

                  const leftPercent = ((bKey.whiteIndex + 0.67) / focusedWhiteKeys.length) * 100;

                  return (
                    <motion.div
                      key={`${bKey.note}-${idx}`}
                      onMouseDown={() => handleDirectPlay(bKey.note, fullOctave, 61 + bKey.oct * 12)}
                      onMouseUp={() => handleDirectRelease(61 + bKey.oct * 12)}
                      onMouseLeave={() => handleDirectRelease(61 + bKey.oct * 12)}
                      animate={{
                        y: isActive ? 4 : 0,
                      }}
                      transition={{ duration: 0.04 }}
                      className={`absolute pointer-events-auto w-7 sm:w-8 h-28 sm:h-34 rounded-b-lg shadow-2xl cursor-pointer flex flex-col justify-end items-center pb-2 border-x border-b transition-colors ${
                        isActive
                          ? 'bg-gradient-to-b from-purple-700 via-neon-purple to-pink-500 border-purple-400 text-white shadow-[0_0_20px_rgba(180,50,255,0.8)]'
                          : 'bg-gradient-to-b from-[#222834] via-[#141a24] to-[#0a0d14] border-black/80 hover:from-slate-700 hover:to-black text-slate-200'
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                      }}
                    >
                      <div className="absolute top-0 inset-x-1 h-3 rounded-t bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                      <div className="text-center pointer-events-none">
                        <div className="text-[10px] font-black tracking-tight font-mono text-slate-300">
                          {fullNote}
                        </div>
                        {showKeyLabels && (
                          <kbd
                            className={`inline-block mt-0.5 px-1 py-0.2 rounded text-[9px] font-bold font-mono ${
                              isActive
                                ? 'bg-white text-purple-900 font-extrabold'
                                : 'bg-black/60 text-neon-cyan border border-cyan-500/30'
                            }`}
                          >
                            {bKey.shortcut}
                          </kbd>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ambient Glow Reflection Under Piano Keys */}
          <div className="mt-4 flex items-center justify-between px-2 text-[11px] text-slate-400 font-mono">
            <span>Active Keys: {activeNotes.size > 0 ? Array.from(activeNotes).join(', ') : 'Ready to play'}</span>
            <span>Sustain Pedal: {pianoSustain ? 'ACTIVE (HOLD)' : 'OFF (Press Space to Toggle)'}</span>
          </div>
        </div>
      )}

      {/* Interactive Songbook & Cheat Sheet Drawer */}
      <AnimatePresence>
        {isSongbookOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface/90 border border-neon-purple/40 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neon-purple font-extrabold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>World Famous Piano Songs — Instant Typing Guide</span>
              </div>
              <button
                onClick={() => setIsSongbookOpen(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Type the physical keys on your computer keyboard in rhythm to perform these world-famous melodies:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SONG_TUTORIALS.map((song, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-background/80 border border-surfaceBorder hover:border-neon-purple/40 transition-all space-y-2"
                >
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-neon-purple" />
                    <span>{song.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Notes: <span className="text-slate-300 font-semibold">{song.keys}</span>
                  </div>
                  <div className="text-[11px] bg-black/40 p-2 rounded-xl border border-surfaceBorder/80 font-mono text-neon-cyan font-bold tracking-wider">
                    Type: {song.typing}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Mapping Reference Bar */}
      <div className="bg-surface/60 border border-surfaceBorder/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-neon-cyan" />
          <span className="font-bold text-slate-300">Quick Keyboard Guide:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="px-2 py-1 rounded-lg bg-background border border-surfaceBorder">
            White Keys: <strong className="text-white">A S D F G H J K L ; '</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-background border border-surfaceBorder">
            Black Keys: <strong className="text-neon-cyan">W E T Y U O P [ ]</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-background border border-surfaceBorder">
            Octaves: <strong className="text-neon-purple">Z / X</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-background border border-surfaceBorder">
            Sustain: <strong className="text-neon-emerald">Spacebar</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
