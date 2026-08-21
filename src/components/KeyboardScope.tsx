import React from 'react';
import { Check, Filter } from 'lucide-react';
import { KeyboardScope } from '../types';

interface KeyboardScopeProps {
  currentScope: KeyboardScope;
  onChangeScope: (scope: KeyboardScope) => void;
}

interface ScopeOption {
  id: KeyboardScope;
  title: string;
  description: string;
  badge: string;
  keysPreview: string;
  iconText: string;
}

const SCOPES: ScopeOption[] = [
  {
    id: 'all_keys',
    title: 'All Keys (Full Immersion)',
    description: 'Triggers realistic mechanical audio on every single key: letters, numbers, space, enter, modifiers, symbols, and function keys.',
    badge: 'Recommended',
    keysPreview: 'A-Z, 0-9, Space, Enter, Shift, Ctrl, Alt, F1-F12...',
    iconText: '⌨️',
  },
  {
    id: 'letters_only',
    title: 'Letters Only (Typing Focus)',
    description: 'Triggers only on alphabet letters (A through Z) and common punctuation. Modifiers and navigation keys remain silent.',
    badge: 'Typing Mode',
    keysPreview: 'A, B, C, D ... Z',
    iconText: '🔤',
  },
  {
    id: 'numbers_only',
    title: 'Numbers & Numpad Only',
    description: 'Triggers exclusively on number row digits and 10-key numpad keys for accounting, finance, and data crunching.',
    badge: 'Numeric Focus',
    keysPreview: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, NumPad...',
    iconText: '🔢',
  },
  {
    id: 'letters_numbers',
    title: 'Letters + Numbers',
    description: 'Triggers on all alphanumeric characters while keeping system shortcut keys, Ctrl, Alt, and Windows keys muted.',
    badge: 'Alphanumeric',
    keysPreview: 'A-Z, 0-9, Basic Punctuation',
    iconText: '📝',
  },
  {
    id: 'custom',
    title: 'Mute Modifiers (Gaming & Coding)',
    description: 'Smart filter that mutes fast modifier spamming (Ctrl, Alt, Shift, Win, Caps, F-keys) during gaming or intense IDE editing.',
    badge: 'Dev / Gamer',
    keysPreview: 'Exclude Ctrl, Alt, Win, Shift, CapsLock, F1-F12',
    iconText: '🎮',
  },
];

export const KeyboardScopeSelector: React.FC<KeyboardScopeProps> = ({
  currentScope,
  onChangeScope,
}) => {
  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6 shadow-2xl">
      <div>
        <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
          <Filter className="w-5 h-5 text-neon-cyan" />
          Acoustic Trigger Scope Filters
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-neon-cyan border border-cyan-500/30">
            FILTER MATRIX
          </span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Select which keyboard strokes should trigger acoustic feedback across Windows applications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCOPES.map((scope) => {
          const isSelected = currentScope === scope.id;

          return (
            <div
              key={scope.id}
              onClick={() => onChangeScope(scope.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-neon-cyan/15 via-[#121a2a] to-[#0c101a] border-neon-cyan/60 shadow-glow-cyan/20 ring-1 ring-neon-cyan/40 scale-[1.01]'
                  : 'glass-card hover:bg-surfaceHover/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span className="text-base">{scope.iconText}</span>
                    {scope.title}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {scope.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{scope.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <code className="text-slate-400 font-mono text-[10px] truncate max-w-[240px]">
                  {scope.keysPreview}
                </code>
                {isSelected && (
                  <span className="flex items-center gap-1 text-neon-cyan font-bold">
                    <Check className="w-3.5 h-3.5" /> ACTIVE
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
