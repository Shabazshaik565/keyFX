import React, { useState, useEffect } from 'react';
import { Terminal, Flame, Palette } from 'lucide-react';

interface KeyVisualizerProps {
  onTriggerVisualSound?: (keyLabel: string) => void;
  activeKeyOverride?: string | null;
  externalKey?: { label: string; id: number } | null;
}

const KEYBOARD_ROWS = [
  ['ESC', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'BACKSPACE'],
  ['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'ENTER'],
  ['L-SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'R-SHIFT'],
  ['CTRL', 'WIN', 'ALT', 'SPACE', 'ALT', 'FN', 'CTRL'],
];

type RgbMode = 'cyan' | 'purple' | 'rainbow' | 'emerald' | 'sunset';

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

  const getKeyWidthClass = (key: string) => {
    switch (key) {
      case 'SPACE':
        return 'w-48 sm:w-60 flex-grow';
      case 'BACKSPACE':
      case 'ENTER':
        return 'w-18 sm:w-22';
      case 'TAB':
      case 'CAPS':
        return 'w-14 sm:w-16';
      case 'L-SHIFT':
      case 'R-SHIFT':
        return 'w-20 sm:w-24';
      case 'CTRL':
      case 'ALT':
      case 'WIN':
      case 'FN':
      case 'ESC':
        return 'w-10 sm:w-12';
      default:
        return 'w-8 sm:w-10';
    }
  };

  const getRgbUnderglowClass = () => {
    switch (rgbMode) {
      case 'purple':
        return 'from-neon-purple/20 via-indigo-900/10 to-neon-purple/20';
      case 'rainbow':
        return 'rgb-strip opacity-40';
      case 'emerald':
        return 'from-neon-emerald/20 via-teal-900/10 to-neon-emerald/20';
      case 'sunset':
        return 'from-neon-rose/20 via-neon-amber/20 to-neon-rose/20';
      default:
        return 'from-neon-cyan/20 via-blue-900/10 to-neon-cyan/20';
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Keyboard Header & Live Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              Interactive Mechanical Deck
              <span className="text-[10px] font-mono text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full border border-neon-cyan/30">
                RGB CHASSIS
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Click keys or type in any Windows app to visualize actuation</p>
          </div>
        </div>

        {/* RGB Mode Selector & Live Counters */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Lighting Mode Selector */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-surfaceBorder">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            {(['cyan', 'purple', 'emerald', 'sunset', 'rainbow'] as RgbMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setRgbMode(mode)}
                className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                  mode === 'cyan'
                    ? 'bg-neon-cyan'
                    : mode === 'purple'
                    ? 'bg-neon-purple'
                    : mode === 'emerald'
                    ? 'bg-neon-emerald'
                    : mode === 'sunset'
                    ? 'bg-gradient-to-r from-neon-rose to-neon-amber'
                    : 'rgb-strip'
                } ${rgbMode === mode ? 'scale-125 ring-2 ring-white shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                title={`RGB Mode: ${mode}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surfaceBorder">
              <span className="text-slate-400 text-[11px]">Last:</span>
              <span className="font-mono font-black text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/30">
                {recentKey}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surfaceBorder">
              <Flame className="w-3.5 h-3.5 text-neon-emerald" />
              <span className="font-mono font-bold text-neon-emerald">{pressCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mechanical Keyboard Chassis */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#090d14] via-[#0d121c] to-[#080b10] p-4 sm:p-5 border border-white/10 shadow-key-chassis overflow-x-auto">
        {/* Switch Backlight Underglow Layer */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${getRgbUnderglowClass()} blur-xl pointer-events-none rounded-2xl transition-all duration-500`}
        />

        <div className="relative z-10 flex flex-col gap-2 min-w-[700px] justify-center items-center">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1.5 sm:gap-2 w-full justify-center">
              {row.map((key) => {
                const isPressed = activeKeys.has(key) || activeKeyOverride === key;
                const widthClass = getKeyWidthClass(key);

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    type="button"
                    className={`mech-key h-9 sm:h-10 ${widthClass} rounded-xl flex items-center justify-center font-mono text-[11px] font-bold select-none cursor-pointer transition-all ${
                      isPressed
                        ? 'active shadow-key-active scale-[0.95] translate-y-1 bg-gradient-to-t from-neon-cyan to-white text-slate-950 border border-white'
                        : 'bg-gradient-to-b from-[#161c2b] to-[#101420] text-slate-200 hover:from-[#1e273c] hover:to-[#141928] hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span className="relative z-10">{key}</span>
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
