export type KeyboardScope = 'all_keys' | 'letters_only' | 'numbers_only' | 'letters_numbers' | 'custom';

export type SoundCategory = 'Mechanical' | 'Retro' | 'Digital' | 'Acoustic' | 'Soft' | 'Custom';

export type AppMode = 'normal' | 'piano';

export type PianoPreset = 'grand_piano' | 'bright_piano' | 'upright_piano' | 'electric_piano';

export interface SoundProfile {
  id: string;
  name: string;
  category: SoundCategory;
  description: string;
  isCustom?: boolean;
  tags?: string[];
  filePath?: string;
  filename?: string;
  fileSize?: number;
}

export interface AudioDeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface PianoNoteEvent {
  vk_code: number;
  note_name: string;
  note_full: string;
  octave: number;
  is_white: boolean;
}

export interface AppSettings {
  isEnabled: boolean;
  mode: AppMode;
  selectedSoundId: string;
  volume: number; // 0 - 100
  pitch: number; // -12 to +12 semitones
  playbackSpeed: number; // 0.5 to 2.0
  randomPitch: number; // 0 to 30 %
  randomVolume: number; // 0 to 20 %
  cooldownMs: number; // 0 to 150 ms
  keyboardScope: KeyboardScope;
  startWithWindows: boolean;
  minimizeToTray: boolean;
  muteWhenFullscreen: boolean;
  outputDevice?: string;

  // Piano Mode Settings
  pianoVolume: number; // 0 - 100
  pianoOctave: number; // 1 - 7 (default 4)
  pianoSustain: boolean;
  pianoPreset: string;
}
