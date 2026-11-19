import React, { useState, useEffect } from 'react';
import { Terminal, Flame, Palette } from 'lucide-react';

interface KeyVisualizerProps {
  onTriggerVisualSound?: (keyLabel: string) => void;
  activeKeyOverride?: string | null;
  externalKey?: { label: string; id: number } | null;
}

interface KeycapInfo {
  label: string;
  sub?: string;
  width?: string;
  isModifier?: boolean;
}

const KEYBOARD_LAYOUT: KeycapInfo[][] = [
  // Row 1: Function / Number Row
  [
    { label: 'ESC', isModifier: true, width: 'w-10' },
    { label: '1', sub: '!' },
    { label: '2', sub: '@' },
    { label: '3', sub: '#' },
    { label: '4', sub: '$' },
    { label: '5', sub: '%' },
    { label: '6', sub: '^' },
    { label: '7', sub: '&' },
    { label: '8', sub: '*' },
    { label: '9', sub: '(' },
    { label: '0', sub: ')' },
    { label: '-', sub: '_' },
    { label: '=', sub: '+' },
    { label: 'BACKSPACE', isModifier: true, width: 'w-20' },
  ],
  // Row 2: QWERTY
  [
    { label: 'TAB', isModifier: true, width: 'w-14' },
    { label: 'Q' },
    { label: 'W' },
    { label: 'E' },
    { label: 'R' },
    { label: 'T' },
    { label: 'Y' },
    { label: 'U' },
    { label: 'I' },
    { label: 'O' },
    { label: 'P' },
    { label: '[', sub: '{' },
    { label: ']', sub: '}' },
    { label: '\\', sub: '|', width: 'w-12' },
  ],
  // Row 3: ASDF
  [
    { label: 'CAPS', isModifier: true, width: 'w-16' },
    { label: 'A' },
    { label: 'S' },
    { label: 'D' },
    { label: 'F' },
    { label: 'G' },
    { label: 'H' },
    { label: 'J' },
    { label: 'K' },
    { label: 'L' },
    { label: ';', sub: ':' },
    { label: "'", sub: '"' },
    { label: 'ENTER', isModifier: true, width: 'w-20' },
  ],
  // Row 4: ZXCV
  [
    { label: 'L-SHIFT', isModifier: true, width: 'w-22' },
    { label: 'Z' },
    { label: 'X' },
    { label: 'C' },
    { label: 'V' },
    { label: 'B' },
    { label: 'N' },
    { label: 'M' },
    { label: ',', sub: '<' },
    { label: '.', sub: '>' },
    { label: '/', sub: '?' },
    { label: 'R-SHIFT', isModifier: true, width: 'w-22' },
  ],
  // Row 5: Bottom Row
  [
    { label: 'CTRL', isModifier: true, width: 'w-12' },
    { label: 'WIN', isModifier: true, width: 'w-10' },
    { label: 'ALT', isModifier: true, width: 'w-12' },
    { label: 'SPACE', width: 'w-56 sm:w-64 flex-grow' },
    { label: 'ALT', isModifier: true, width: 'w-12' },
    { label: 'FN', isModifier: true, width: 'w-10' },
    { label: 'CTRL', isModifier: true, width: 'w-12' },
  ],
];

type RgbMode = 'cyan' | 'purple' | 'emerald' | 'sunset' | 'stealth' | 'rainbow';

export const KeyVisualizer: React.FC<KeyVisualizerProps> = ({
  onTriggerVisualSound,
  activeKeyOverride,
  externalKey,
}) => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [recentKey, setRecentKey] = useState<string>('Ready');
  const [pressCount, setPressCount] = useState<number>(0);
  const [rgbMode, setRgbMode] = useState<RgbMode>('cyan');

  const handleKeyPress = (key: string) => {
    setActiveKeys((prev) => new Set(prev).add(key));
    setRecentKey(key);
    setPressCount((c) => c + 1);
    if (onTriggerVisualSound) {
      onTriggerVisualSound(key);
    }
    setTimeout(() => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 180);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let keyName = e.key.toUpperCase();
      if (e.code === 'Space') keyName = 'SPACE';
      if (e.code === 'Backspace') keyName = 'BACKSPACE';
      if (e.code === 'Enter') keyName = 'ENTER';
      if (e.code === 'Tab') keyName = 'TAB';
      if (e.code === 'Escape') keyName = 'ESC';
      if (e.code.includes('Shift')) keyName = e.code === 'ShiftRight' ? 'R-SHIFT' : 'L-SHIFT';
      if (e.code.includes('Control')) keyName = 'CTRL';
      if (e.code.includes('Alt')) keyName = 'ALT';

      handleKeyPress(keyName);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (externalKey) {
      handleKeyPress(externalKey.label);
    }
  }, [externalKey]);

  const getRgbUnderglowClass = () => {
    switch (rgbMode) {
      case 'purple':
        return 'from-neon-purple/25 via-indigo-950/20 to-neon-purple/25';
      case 'rainbow':
        return 'rgb-strip opacity-40';
      case 'emerald':
        return 'from-neon-emerald/25 via-teal-950/20 to-neon-emerald/25';
      case 'sunset':
        return 'from-neon-rose/25 via-neon-amber/20 to-neon-rose/25';
      case 'stealth':
        return 'from-white/10 via-slate-900/10 to-white/10';
      default:
        return 'from-neon-cyan/25 via-blue-950/20 to-neon-cyan/25';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-4 shadow-2xl relative overflow-hidden">
      {/* Keyboard Header & Live Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-glow-cyan-sm">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              Tactile Mechanical Deck
              <span className="text-[10px] font-mono text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full border border-neon-cyan/30">
                PBT CHASSIS
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive 60% layout • Visualizes hardware keystroke events in real time
            </p>
          </div>
        </div>

        {/* RGB Mode Selector & Live Counters */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Lighting Mode Selector */}
          <div className="flex items-center gap-1.5 bg-[#0F1422] p-1.5 rounded-xl border border-white/[0.08]">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
            {(['cyan', 'purple', 'emerald', 'sunset', 'stealth', 'rainbow'] as RgbMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setRgbMode(mode)}
                className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                  mode === 'cyan'
                    ? 'bg-neon-cyan'
                    : mode === 'purple'
                    ? 'bg-neon-purple'
                    : mode === 'emerald'
                    ? 'bg-neon-emerald'
                    : mode === 'sunset'
                    ? 'bg-gradient-to-r from-neon-rose to-neon-amber'
                    : mode === 'stealth'
                    ? 'bg-slate-300'
                    : 'rgb-strip'
                } ${rgbMode === mode ? 'scale-125 ring-2 ring-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                title={`RGB Mode: ${mode}`}
              />
            ))}
          </div>

          {/* Last Key & Session Count */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F1422] border border-white/[0.08]">
              <span className="text-slate-400 text-[10px] font-medium">Last:</span>
              <span className="font-mono font-black text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/30 text-[11px]">
                {recentKey}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F1422] border border-white/[0.08]">
              <Flame className="w-3.5 h-3.5 text-neon-emerald" />
              <span className="font-mono font-bold text-neon-emerald text-[11px]">{pressCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mechanical Keyboard Chassis Container */}
      <div className="relative rounded-xl bg-gradient-to-b from-[#090D15] via-[#0E1320] to-[#080B12] p-3.5 sm:p-4 border border-white/[0.08] shadow-key-chassis overflow-x-auto">
        {/* Switch Backlight Underglow Layer */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${getRgbUnderglowClass()} blur-2xl pointer-events-none rounded-xl transition-all duration-500`}
        />

        <div className="relative z-10 flex flex-col gap-1.5 min-w-[680px] justify-center items-center">
          {KEYBOARD_LAYOUT.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1.5 w-full justify-center">
              {row.map((k) => {
                const key = k.label;
                const isPressed = activeKeys.has(key) || activeKeyOverride === key;
                const widthClass = k.width || 'w-9 sm:w-10';

                return (
                  <button
                    key={`${key}-${rowIdx}`}
                    onClick={() => handleKeyPress(key)}
                    type="button"
                    className={`mech-key h-9 sm:h-10 ${widthClass} rounded-lg flex flex-col items-center justify-center font-mono select-none cursor-pointer transition-all ${
                      isPressed
                        ? 'active shadow-key-active scale-[0.96] translate-y-0.5 bg-gradient-to-t from-neon-cyan to-white text-slate-950 border border-white font-black'
                        : k.isModifier
                        ? 'bg-gradient-to-b from-[#182030] to-[#111724] text-slate-300 hover:from-[#1E283C] hover:to-[#151D2D] hover:text-white border border-slate-700/50'
                        : 'bg-gradient-to-b from-[#131926] to-[#0E131E] text-slate-200 hover:from-[#1A2234] hover:to-[#121826] hover:text-white border border-slate-800/80'
                    }`}
                  >
                    {k.sub && (
                      <span className="text-[8px] opacity-60 leading-none mb-0.5">{k.sub}</span>
                    )}
                    <span className="text-[10px] sm:text-[11px] font-bold leading-none">{key}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
