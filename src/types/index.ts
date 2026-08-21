export type KeyboardScope = 'all_keys' | 'letters_only' | 'numbers_only' | 'letters_numbers' | 'custom';

export type SoundCategory = 'Mechanical' | 'Retro' | 'Digital' | 'Acoustic' | 'Soft' | 'Custom';

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

export interface AppSettings {
  isEnabled: boolean;
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
}

