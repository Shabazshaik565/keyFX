import React, { useState } from 'react';
import { Play, Check, FolderUp, Trash2, Search, X } from 'lucide-react';
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Mechanical: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  Acoustic: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Digital: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Soft: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Retro: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Custom: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
};

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
      {/* Top Filter & Search Action Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search switch profiles, typewriter, custom packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#0B0F19] border border-white/[0.08] focus:border-neon-cyan/50 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Import Sound Pack Action Button */}
          <button
            onClick={onImportSound}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple/20 via-neon-cyan/20 to-blue-600/20 hover:from-neon-purple/30 hover:to-neon-cyan/30 border border-neon-cyan/40 text-neon-cyan hover:text-white text-xs font-bold transition-all cursor-pointer shadow-glow-cyan-sm active:scale-95"
          >
            <FolderUp className="w-4 h-4" />
            <span>Import Custom Audio (.WAV / .MP3)</span>
          </button>
        </div>

        {/* Category Filter Chips with Counters */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/[0.05]">
          {CATEGORIES.map((category) => {
            const count =
              category === 'All'
                ? sounds.length
                : sounds.filter((s) => s.category === category).length;

            const isCurrent = activeCategory === category;

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan-sm'
                    : 'bg-[#101524] hover:bg-[#182033] text-slate-400 border border-white/[0.06]'
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
      {filteredSounds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSounds.map((sound) => {
            const isSelected = sound.id === selectedSoundId;
            const isPreviewing = previewingId === sound.id;
            const isCustomSound =
              Boolean(sound.isCustom) ||
              Boolean((sound as any).is_custom) ||
              sound.category === 'Custom' ||
              sound.id.startsWith('custom_');

            const colorBadge = CATEGORY_COLORS[sound.category] || CATEGORY_COLORS.Mechanical;

            return (
              <div
                key={sound.id}
                onClick={() => onSelectSound(sound.id)}
                className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-gradient-to-br from-neon-cyan/15 via-[#121A2A] to-[#0A0E18] border-neon-cyan/60 shadow-glow-cyan-sm ring-1 ring-neon-cyan/40 scale-[1.01]'
                    : 'glass-card hover:border-white/[0.15]'
                }`}
              >
                <div>
                  {/* Card Header: Category Badge & Preview Action */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md border font-mono ${colorBadge.bg} ${colorBadge.text} ${colorBadge.border}`}
                      >
                        {sound.category}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-neon-cyan bg-neon-cyan/15 px-2 py-0.5 rounded-md border border-neon-cyan/30 shadow-glow-cyan-sm font-mono">
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
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isPreviewing
                          ? 'bg-neon-cyan text-slate-950 border-white shadow-glow-cyan scale-110'
                          : 'bg-[#101524] hover:bg-[#182136] border-white/[0.08] text-slate-300 hover:text-white'
                      }`}
                      title="Preview switch stroke audio"
                    >
                      <Play className={`w-3.5 h-3.5 ${isPreviewing ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-neon-cyan transition-colors leading-snug">
                    {sound.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {sound.description}
                  </p>
                </div>

                {/* Card Footer: Tags & Action Buttons */}
                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
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
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 transition-all cursor-pointer shadow-sm"
                        title="Delete custom sound pack"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSound(sound.id);
                      }}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm ${
                        isSelected
                          ? 'bg-neon-cyan text-slate-950 shadow-glow-cyan-sm'
                          : 'bg-[#101524] hover:bg-[#182136] border border-white/[0.08] text-slate-300 hover:text-white'
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
      ) : (
        /* Empty State */
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4 border border-white/[0.08]">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">No sound profiles match your search</h4>
            <p className="text-xs text-slate-400">
              Try adjusting your search terms or selecting a different category filter.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-[#101524] hover:bg-[#182033] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
