import React, { useState } from 'react';
import { Play, Check, FolderUp, Trash2, Search } from 'lucide-react';
import { SoundProfile, SoundCategory } from '../types';

interface SoundLibraryProps {
  sounds: SoundProfile[];
  selectedSoundId: string;
  onSelectSound: (id: string) => void;
  onPreviewSound: (id: string) => void;
  onImportSound: () => void;
  onDeleteCustomSound?: (id: string) => void;
}

const CATEGORIES: ('All' | SoundCategory)[] = [
  'All',
  'Mechanical',
  'Acoustic',
  'Digital',
  'Soft',
  'Retro',
  'Custom',
];

export const SoundLibrary: React.FC<SoundLibraryProps> = ({
  sounds,
  selectedSoundId,
  onSelectSound,
  onPreviewSound,
  onImportSound,
  onDeleteCustomSound,
}) => {
  const [activeCategory, setActiveCategory] = useState<'All' | SoundCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const filteredSounds = sounds.filter((sound) => {
    const matchesCategory = activeCategory === 'All' || sound.category === activeCategory;
    const matchesSearch =
      sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handlePreview = (id: string) => {
    setPreviewingId(id);
    onPreviewSound(id);
    setTimeout(() => {
      setPreviewingId((curr) => (curr === id ? null : curr));
    }, 280);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Search, Category Pills & Import Action */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mechanical switches, typewriter, custom packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface/90 border border-surfaceBorder focus:border-neon-cyan/50 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Import Sound Pack Button */}
          <button
            onClick={onImportSound}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple/20 via-neon-cyan/20 to-blue-600/20 hover:from-neon-purple/30 hover:to-neon-cyan/30 border border-neon-cyan/40 text-neon-cyan hover:text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-950/40 active:scale-95"
          >
            <FolderUp className="w-4 h-4" />
            <span>+ Import Custom Sound (WAV/MP3/OGG)</span>
          </button>
        </div>

        {/* Category Pills with Counters */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
          {CATEGORIES.map((category) => {
            const count =
              category === 'All'
                ? sounds.length
                : sounds.filter((s) => s.category === category).length;

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-neon-cyan/20 to-blue-600/20 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan/20'
                    : 'bg-surface/80 hover:bg-surfaceHover text-slate-400 border border-surfaceBorder'
                }`}
              >
                <span>{category}</span>
                <span className="text-[10px] opacity-60 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Sound Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSounds.map((sound) => {
          const isSelected = sound.id === selectedSoundId;
          const isPreviewing = previewingId === sound.id;
          const isCustomSound =
            Boolean(sound.isCustom) ||
            Boolean((sound as any).is_custom) ||
            sound.category === 'Custom' ||
            sound.id.startsWith('custom_');

          return (
            <div
              key={sound.id}
              onClick={() => onSelectSound(sound.id)}
              className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                isSelected
                  ? 'bg-gradient-to-br from-neon-cyan/15 via-[#121a2a] to-[#0c101a] border-neon-cyan/60 shadow-glow-cyan/25 ring-1 ring-neon-cyan/40 transform scale-[1.01]'
                  : 'glass-card hover:bg-surfaceHover/90'
              }`}
            >
              <div>
                {/* Card Header: Category Badge & Preview Action */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-md ${
                        isCustomSound
                          ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {sound.category}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-neon-cyan bg-neon-cyan/10 px-2.5 py-0.5 rounded-md border border-neon-cyan/30 shadow-glow-cyan/30">
                        <Check className="w-3 h-3" /> ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(sound.id);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isPreviewing
                        ? 'bg-neon-cyan text-slate-950 border-white shadow-glow-cyan scale-110'
                        : 'bg-surface hover:bg-slate-700 border-surfaceBorder text-slate-300 hover:text-white'
                    }`}
                    title="Preview sound effect"
                  >
                    <Play className={`w-3.5 h-3.5 ${isPreviewing ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-neon-cyan transition-colors leading-snug">
                  {sound.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {sound.description}
                </p>
              </div>

              {/* Card Footer: Tags & Select/Delete Buttons */}
              <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {sound.tags?.slice(0, 2).join(' • ') || (isCustomSound ? 'Custom Pack' : 'KeyFX Pack')}
                </span>

                <div className="flex items-center gap-2">
                  {isCustomSound && onDeleteCustomSound && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomSound(sound.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 transition-all cursor-pointer shadow-sm"
                      title="Delete this custom sound pack"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSound(sound.id);
                    }}
                    className={`text-xs px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm ${
                      isSelected
                        ? 'bg-neon-cyan text-slate-950 shadow-glow-cyan'
                        : 'bg-surface hover:bg-surfaceHover border border-surfaceBorder text-slate-300 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'SELECTED' : 'SELECT'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
