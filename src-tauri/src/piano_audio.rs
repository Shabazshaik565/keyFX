use std::io::Cursor;
use std::sync::{Arc, Mutex, OnceLock, RwLock};
use std::time::Duration;
use rodio::{Decoder, OutputStreamHandle, Sink, Source};

#[derive(Debug, Clone)]
pub struct PianoSettings {
    pub volume: f32,
    pub octave: i32,
    pub sustain: bool,
    pub preset: String,
}

impl Default for PianoSettings {
    fn default() -> Self {
        Self {
            volume: 85.0,
            octave: 4,
            sustain: false,
            preset: "grand_piano".to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PianoPresetKind {
    Grand,
    Bright,
    Upright,
    Electric,
}

impl PianoPresetKind {
    pub fn from_str(s: &str) -> Self {
        match s {
            "bright_piano" => PianoPresetKind::Bright,
            "upright_piano" => PianoPresetKind::Upright,
            "electric_piano" => PianoPresetKind::Electric,
            _ => PianoPresetKind::Grand,
        }
    }
}

pub struct ActivePianoVoice {
    pub vk: u32,
    pub note_name: String,
    pub sink: Arc<Sink>,
    pub is_key_down: bool,
    pub is_sustained: bool,
    pub base_volume: f32,
}

struct FadingVoice {
    pub sink: Arc<Sink>,
    pub current_volume: f32,
    pub step: u8,
    pub total_steps: u8,
}

#[derive(Clone)]
pub struct DecodedAnchor {
    pub midi: i32,
    pub channels: u16,
    pub sample_rate: u32,
    pub samples: Arc<Vec<f32>>,
}

/// Zero-copy, real-time acoustic DSP modeled PCM audio source
#[derive(Clone)]
pub struct PianoPcmSource {
    samples: Arc<Vec<f32>>,
    pos: usize,
    channels: u16,
    sample_rate: u32,
    preset: PianoPresetKind,
    note_freq: f32,
    lp1: [f32; 2],
    lp2: [f32; 2],
}

impl PianoPcmSource {
    pub fn new(
        channels: u16,
        sample_rate: u32,
        samples: Arc<Vec<f32>>,
        preset: PianoPresetKind,
        note_freq: f32,
    ) -> Self {
        Self {
            samples,
            pos: 0,
            channels,
            sample_rate,
            preset,
            note_freq,
            lp1: [0.0; 2],
            lp2: [0.0; 2],
        }
    }
}

impl Iterator for PianoPcmSource {
    type Item = f32;

    #[inline]
    fn next(&mut self) -> Option<f32> {
        if self.pos < self.samples.len() {
            let raw = self.samples[self.pos];
            let ch = self.pos % (self.channels as usize).max(1);
            let frame = self.pos / (self.channels as usize).max(1);
            self.pos += 1;

            let t = frame as f32 / self.sample_rate as f32;

            let out_sample = match self.preset {
                PianoPresetKind::Grand => {
                    // Yamaha C5 Concert Grand: Natural full-spectrum acoustic resonance
                    raw
                }
                PianoPresetKind::Bright => {
                    // Bright Studio Grand: High harmonic excitation, crisp bite, punchy hammer attack
                    let alpha = 0.22;
                    self.lp1[ch] += alpha * (raw - self.lp1[ch]);
                    let high = raw - self.lp1[ch];
                    let mut out = raw + high * 0.95;

                    // Transient punch boost in the first 45ms of hammer contact
                    if t < 0.045 {
                        let punch = 1.0 - (t / 0.045);
                        out *= 1.0 + 0.35 * punch;
                    }
                    (out * 1.15).clamp(-1.0, 1.0)
                }
                PianoPresetKind::Upright => {
                    // Mellow Upright Felt Piano: Warm 2-pole cascaded felt low-pass filter
                    // Drastically absorbs harsh metallic highs > 1100Hz leaving warm woody body
                    let alpha = 0.14;
                    self.lp1[ch] += alpha * (raw - self.lp1[ch]);
                    self.lp2[ch] += alpha * (self.lp1[ch] - self.lp2[ch]);
                    let mut out = self.lp2[ch] * 1.65;

                    // Soft felt hammer attack: smooth any transient tick
                    if t < 0.015 {
                        let ramp = t / 0.015;
                        out *= 0.35 + 0.65 * ramp;
                    }
                    out.clamp(-1.0, 1.0)
                }
                PianoPresetKind::Electric => {
                    // Vintage Rhodes Mark I:
                    // 1. Crystal bell tine attack at fundamental + 3rd harmonic
                    let bell_env = (-t / 0.28).exp();
                    let phase1 = 2.0 * std::f32::consts::PI * self.note_freq * t;
                    let phase3 = 2.0 * std::f32::consts::PI * (self.note_freq * 3.0) * t;
                    let tine = bell_env * (0.38 * phase1.sin() + 0.26 * phase3.sin());

                    // 2. Smooth pickup frequency response (~2200Hz)
                    let alpha = 0.28;
                    self.lp1[ch] += alpha * (raw - self.lp1[ch]);

                    // 3. Combine body & bell tine
                    let mix = 0.52 * self.lp1[ch] + 0.68 * tine;

                    // 4. Warm analog saturation
                    let saturated = (mix * 1.45).tanh();

                    // 5. Classic stereo tremolo / auto-pan (4.6 Hz LFO)
                    let lfo = (2.0 * std::f32::consts::PI * 4.6 * t).sin();
                    let pan = if ch == 0 { 1.0 + 0.35 * lfo } else { 1.0 - 0.35 * lfo };
                    (saturated * pan).clamp(-1.0, 1.0)
                }
            };

            Some(out_sample)
        } else {
            None
        }
    }

    #[inline]
    fn size_hint(&self) -> (usize, Option<usize>) {
        let remaining = self.samples.len().saturating_sub(self.pos);
        (remaining, Some(remaining))
    }
}

impl ExactSizeIterator for PianoPcmSource {}

impl Source for PianoPcmSource {
    #[inline]
    fn current_frame_len(&self) -> Option<usize> {
        None
    }

    #[inline]
    fn channels(&self) -> u16 {
        self.channels
    }

    #[inline]
    fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    #[inline]
    fn total_duration(&self) -> Option<Duration> {
        let total_frames = self.samples.len() / (self.channels as usize).max(1);
        Some(Duration::from_secs_f64(total_frames as f64 / self.sample_rate as f64))
    }
}

pub struct PianoEngine {
    stream_handle: OutputStreamHandle,
    settings: Arc<RwLock<PianoSettings>>,
    active_voices: Arc<Mutex<Vec<ActivePianoVoice>>>,
    fading_voices: Arc<Mutex<Vec<FadingVoice>>>,
    anchors: Arc<RwLock<Vec<DecodedAnchor>>>,
}

static PIANO_ENGINE: OnceLock<RwLock<PianoEngine>> = OnceLock::new();

#[derive(Clone, Copy)]
pub struct RawAnchor {
    pub midi: i32,
    pub bytes: &'static [u8],
}

// 30 Anchors spaced every 3 semitones (Minor 3rd) across all 88 keys
pub static RAW_SALAMANDER_ANCHORS: &[RawAnchor] = &[
    RawAnchor { midi: 21, bytes: include_bytes!("../assets/piano/A0.mp3") },
    RawAnchor { midi: 24, bytes: include_bytes!("../assets/piano/C1.mp3") },
    RawAnchor { midi: 27, bytes: include_bytes!("../assets/piano/Ds1.mp3") },
    RawAnchor { midi: 30, bytes: include_bytes!("../assets/piano/Fs1.mp3") },
    RawAnchor { midi: 33, bytes: include_bytes!("../assets/piano/A1.mp3") },
    RawAnchor { midi: 36, bytes: include_bytes!("../assets/piano/C2.mp3") },
    RawAnchor { midi: 39, bytes: include_bytes!("../assets/piano/Ds2.mp3") },
    RawAnchor { midi: 42, bytes: include_bytes!("../assets/piano/Fs2.mp3") },
    RawAnchor { midi: 45, bytes: include_bytes!("../assets/piano/A2.mp3") },
    RawAnchor { midi: 48, bytes: include_bytes!("../assets/piano/C3.mp3") },
    RawAnchor { midi: 51, bytes: include_bytes!("../assets/piano/Ds3.mp3") },
    RawAnchor { midi: 54, bytes: include_bytes!("../assets/piano/Fs3.mp3") },
    RawAnchor { midi: 57, bytes: include_bytes!("../assets/piano/A3.mp3") },
    RawAnchor { midi: 60, bytes: include_bytes!("../assets/piano/C4.mp3") },
    RawAnchor { midi: 63, bytes: include_bytes!("../assets/piano/Ds4.mp3") },
    RawAnchor { midi: 66, bytes: include_bytes!("../assets/piano/Fs4.mp3") },
    RawAnchor { midi: 69, bytes: include_bytes!("../assets/piano/A4.mp3") },
    RawAnchor { midi: 72, bytes: include_bytes!("../assets/piano/C5.mp3") },
    RawAnchor { midi: 75, bytes: include_bytes!("../assets/piano/Ds5.mp3") },
    RawAnchor { midi: 78, bytes: include_bytes!("../assets/piano/Fs5.mp3") },
    RawAnchor { midi: 81, bytes: include_bytes!("../assets/piano/A5.mp3") },
    RawAnchor { midi: 84, bytes: include_bytes!("../assets/piano/C6.mp3") },
    RawAnchor { midi: 87, bytes: include_bytes!("../assets/piano/Ds6.mp3") },
    RawAnchor { midi: 90, bytes: include_bytes!("../assets/piano/Fs6.mp3") },
    RawAnchor { midi: 93, bytes: include_bytes!("../assets/piano/A6.mp3") },
    RawAnchor { midi: 96, bytes: include_bytes!("../assets/piano/C7.mp3") },
    RawAnchor { midi: 99, bytes: include_bytes!("../assets/piano/Ds7.mp3") },
    RawAnchor { midi: 102, bytes: include_bytes!("../assets/piano/Fs7.mp3") },
    RawAnchor { midi: 105, bytes: include_bytes!("../assets/piano/A7.mp3") },
    RawAnchor { midi: 108, bytes: include_bytes!("../assets/piano/C8.mp3") },
];

pub fn note_to_midi(note_name: &str, octave: i32) -> i32 {
    let semitone = match note_name {
        "C" => 0,
        "C#" | "Db" => 1,
        "D" => 2,
        "D#" | "Eb" => 3,
        "E" => 4,
        "F" => 5,
        "F#" | "Gb" => 6,
        "G" => 7,
        "G#" | "Ab" => 8,
        "A" => 9,
        "A#" | "Bb" => 10,
        "B" => 11,
        _ => 0,
    };
    (octave + 1) * 12 + semitone
}

pub fn midi_to_freq(midi_note: i32) -> f32 {
    440.0 * 2.0_f32.powf((midi_note as f32 - 69.0) / 12.0)
}

fn decode_single_anchor(raw: &RawAnchor) -> Option<DecodedAnchor> {
    let cursor = Cursor::new(raw.bytes);
    if let Ok(source) = Decoder::new(cursor) {
        let channels = source.channels();
        let sample_rate = source.sample_rate();
        let samples: Vec<f32> = source.convert_samples().collect();
        Some(DecodedAnchor {
            midi: raw.midi,
            channels,
            sample_rate,
            samples: Arc::new(samples),
        })
    } else {
        None
    }
}

pub fn init_piano_engine(stream_handle: OutputStreamHandle) {
    let config = crate::settings::load_config();
    let initial_settings = PianoSettings {
        volume: config.piano_volume,
        octave: config.piano_octave,
        sustain: config.piano_sustain,
        preset: config.piano_preset,
    };

    let anchors: Arc<RwLock<Vec<DecodedAnchor>>> = Arc::new(RwLock::new(Vec::with_capacity(30)));
    let fading_voices: Arc<Mutex<Vec<FadingVoice>>> = Arc::new(Mutex::new(Vec::new()));
    let fading_clone = fading_voices.clone();

    // High-performance single background fader thread (60 FPS tick / 16ms)
    // Replaces all per-key thread spawning with smooth, buttery batch volume damping
    std::thread::Builder::new()
        .name("keyfx-piano-fader".to_string())
        .spawn(move || {
            loop {
                std::thread::sleep(Duration::from_millis(16));
                let mut list = match fading_clone.lock() {
                    Ok(guard) => guard,
                    Err(_) => break,
                };
                if !list.is_empty() {
                    list.retain_mut(|fv| {
                        fv.step += 1;
                        if fv.step >= fv.total_steps {
                            fv.sink.stop();
                            false
                        } else {
                            let factor = 1.0 - (fv.step as f32 / fv.total_steps as f32);
                            // Natural exponential felt-damping curve
                            fv.sink.set_volume(fv.current_volume * factor * factor);
                            true
                        }
                    });
                }
            }
        })
        .ok();

    // Pre-decode central octaves first (C3 through C5) for instant immediate response
    let central_midis = [48, 51, 54, 57, 60, 63, 66, 69, 72, 75];
    for raw in RAW_SALAMANDER_ANCHORS.iter() {
        if central_midis.contains(&raw.midi) {
            if let Some(decoded) = decode_single_anchor(raw) {
                if let Ok(mut list) = anchors.write() {
                    list.push(decoded);
                }
            }
        }
    }

    // Pre-decode all remaining anchors on a low-priority background thread
    let background_anchors = anchors.clone();
    std::thread::Builder::new()
        .name("keyfx-piano-predecode".to_string())
        .spawn(move || {
            for raw in RAW_SALAMANDER_ANCHORS.iter() {
                if !central_midis.contains(&raw.midi) {
                    if let Some(decoded) = decode_single_anchor(raw) {
                        if let Ok(mut list) = background_anchors.write() {
                            list.push(decoded);
                        }
                    }
                }
            }
            println!("[KeyFX Piano] All 30 concert grand anchors fully pre-decoded in memory.");
        })
        .ok();

    let engine = PianoEngine {
        stream_handle,
        settings: Arc::new(RwLock::new(initial_settings)),
        active_voices: Arc::new(Mutex::new(Vec::new())),
        fading_voices,
        anchors,
    };

    let _ = PIANO_ENGINE.set(RwLock::new(engine));
    println!("[KeyFX Piano] Zero-latency Real Piano Engine initialized.");
}

pub fn update_stream_handle(stream_handle: OutputStreamHandle) {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(mut engine) = engine_lock.write() {
            engine.stream_handle = stream_handle;
        }
    }
}

pub fn update_piano_settings(volume: f32, octave: i32, sustain: bool, preset: String) {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            if let Ok(mut settings) = engine.settings.write() {
                settings.volume = volume.clamp(0.0, 100.0);
                settings.octave = octave.clamp(1, 7);
                settings.sustain = sustain;
                settings.preset = preset;
            }
        }
    }
}

pub fn set_piano_preset(preset: &str) {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            if let Ok(mut settings) = engine.settings.write() {
                settings.preset = preset.to_string();
            }
        }
    }
}

pub fn preview_preset_sound(preset: &str) {
    set_piano_preset(preset);
    // Play a preview note (C5, MIDI 72) with the newly selected instrument
    play_piano_note_on(0xF001, "C", Some(5), 1.0);
    // Smoothly damp preview note after 750ms
    std::thread::spawn(|| {
        std::thread::sleep(Duration::from_millis(750));
        play_piano_note_off(0xF001);
    });
}

pub fn set_piano_sustain(sustain: bool) {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            if let Ok(mut settings) = engine.settings.write() {
                settings.sustain = sustain;
            }
            if !sustain {
                release_sustained_notes();
            }
        }
    }
}

pub fn set_piano_octave(octave: i32) {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            if let Ok(mut settings) = engine.settings.write() {
                settings.octave = octave.clamp(1, 7);
            }
        }
    }
}

pub fn play_piano_note_on(vk: u32, note_name: &str, octave_override: Option<i32>, velocity: f32) {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            let (volume, octave, sustain, preset) = {
                let s = engine.settings.read().unwrap();
                (s.volume, octave_override.unwrap_or(s.octave), s.sustain, s.preset.clone())
            };

            let midi = note_to_midi(note_name, octave).clamp(21, 108);

            // Find closest pre-decoded PCM anchor from the anchor bank
            let anchor_match = {
                let list = engine.anchors.read().unwrap();
                let mut best: Option<DecodedAnchor> = None;
                let mut min_diff = i32::MAX;

                for a in list.iter() {
                    let diff = (midi - a.midi).abs();
                    if diff < min_diff {
                        min_diff = diff;
                        best = Some(a.clone());
                    }
                }
                best
            };

            // If anchor found in memory, play with zero-copy PianoPcmSource
            let chosen_anchor = if let Some(a) = anchor_match {
                Some(a)
            } else {
                // Fallback: decode closest raw anchor directly
                let raw_best = RAW_SALAMANDER_ANCHORS.iter().min_by_key(|r| (midi - r.midi).abs());
                if let Some(r) = raw_best {
                    if let Some(decoded) = decode_single_anchor(r) {
                        if let Ok(mut list) = engine.anchors.write() {
                            list.push(decoded.clone());
                        }
                        Some(decoded)
                    } else {
                        None
                    }
                } else {
                    None
                }
            };

            if let Some(anchor) = chosen_anchor {
                let semitone_shift = (midi - anchor.midi) as f32;
                let pitch_speed = 2.0_f32.powf(semitone_shift / 12.0);

                if let Ok(sink) = Sink::try_new(&engine.stream_handle) {
                    let preset_kind = PianoPresetKind::from_str(&preset);
                    let note_freq = midi_to_freq(midi);

                    let preset_vol_mult = match preset_kind {
                        PianoPresetKind::Bright => 1.05,
                        PianoPresetKind::Upright => 1.0,
                        PianoPresetKind::Electric => 1.1,
                        PianoPresetKind::Grand => 1.0,
                    };

                    // Soft-limited headroom scaling to keep chords crystal clear without clipping
                    let base_vol = (volume / 100.0) * velocity.clamp(0.2, 1.4) * 1.35 * preset_vol_mult;
                    sink.set_volume(base_vol.clamp(0.0, 2.0));
                    sink.set_speed(pitch_speed);

                    // Zero-copy acoustic DSP modeled playback: instantaneous!
                    let source = PianoPcmSource::new(
                        anchor.channels,
                        anchor.sample_rate,
                        anchor.samples.clone(),
                        preset_kind,
                        note_freq,
                    );
                    sink.append(source);

                    let arc_sink = Arc::new(sink);
                    let mut voices = engine.active_voices.lock().unwrap();

                    // If this key is already playing, stop previous voice cleanly
                    voices.retain(|v| {
                        if v.vk == vk {
                            v.sink.stop();
                            false
                        } else {
                            !v.sink.empty()
                        }
                    });

                    // Voice limit to 32 simultaneous voices with graceful voice stealing
                    if voices.len() >= 32 {
                        if let Some(idx) = voices.iter().position(|v| !v.is_key_down) {
                            voices[idx].sink.stop();
                            voices.remove(idx);
                        }
                    }

                    voices.push(ActivePianoVoice {
                        vk,
                        note_name: format!("{}{}", note_name, octave),
                        sink: arc_sink,
                        is_key_down: true,
                        is_sustained: sustain,
                        base_volume: base_vol,
                    });
                }
            }
        }
    }
}

pub fn play_piano_note_off(vk: u32) {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            let sustain = engine.settings.read().unwrap().sustain;
            let mut voices = engine.active_voices.lock().unwrap();
            let mut to_fade = Vec::new();

            for voice in voices.iter_mut() {
                if voice.vk == vk {
                    voice.is_key_down = false;
                    if sustain {
                        voice.is_sustained = true;
                    } else {
                        to_fade.push((voice.sink.clone(), voice.base_volume));
                    }
                }
            }

            if !sustain {
                voices.retain(|v| v.vk != vk || v.is_sustained);
            }

            // Transfer voices to the central high-speed fader worker
            if !to_fade.is_empty() {
                let mut fading = engine.fading_voices.lock().unwrap();
                for (sink, vol) in to_fade {
                    fading.push(FadingVoice {
                        sink,
                        current_volume: vol,
                        step: 0,
                        total_steps: 4, // 4 steps * 16ms = ~64ms natural damper release
                    });
                }
            }
        }
    }
}

fn release_sustained_notes() {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            let mut voices = engine.active_voices.lock().unwrap();
            let mut to_fade = Vec::new();

            voices.retain(|v| {
                if !v.is_key_down && v.is_sustained {
                    to_fade.push((v.sink.clone(), v.base_volume));
                    false
                } else {
                    true
                }
            });

            if !to_fade.is_empty() {
                let mut fading = engine.fading_voices.lock().unwrap();
                for (sink, vol) in to_fade {
                    fading.push(FadingVoice {
                        sink,
                        current_volume: vol,
                        step: 0,
                        total_steps: 4, // 4 steps * 16ms = ~64ms natural damper release
                    });
                }
            }
        }
    }
}

pub fn stop_all_piano_notes() {
    if let Some(engine_lock) = PIANO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            let mut voices = engine.active_voices.lock().unwrap();
            for voice in voices.drain(..) {
                voice.sink.stop();
            }
            let mut fading = engine.fading_voices.lock().unwrap();
            for fv in fading.drain(..) {
                fv.sink.stop();
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_note_to_midi_and_freq() {
        assert_eq!(note_to_midi("C", 4), 60);
        assert_eq!(note_to_midi("A", 4), 69);
        assert_eq!(note_to_midi("C", 5), 72);

        let freq_a4 = midi_to_freq(69);
        assert!((freq_a4 - 440.0).abs() < 0.01);
    }

    #[test]
    fn test_vk_mapping() {
        let note_a = crate::keyboard::map_vk_to_piano_note(0x41);
        assert_eq!(note_a, Some(("C", 0, true)));
    }

    #[test]
    fn test_raw_anchors_count() {
        assert_eq!(RAW_SALAMANDER_ANCHORS.len(), 30);
    }

    #[test]
    fn test_decode_single_anchor() {
        let raw_c4 = RAW_SALAMANDER_ANCHORS.iter().find(|a| a.midi == 60).unwrap();
        let decoded = decode_single_anchor(raw_c4).expect("C4 anchor should decode cleanly");
        assert_eq!(decoded.sample_rate, 44100);
        assert_eq!(decoded.channels, 2);
        assert!(!decoded.samples.is_empty());
    }

    #[test]
    fn test_preset_kinds() {
        assert_eq!(PianoPresetKind::from_str("grand_piano"), PianoPresetKind::Grand);
        assert_eq!(PianoPresetKind::from_str("bright_piano"), PianoPresetKind::Bright);
        assert_eq!(PianoPresetKind::from_str("upright_piano"), PianoPresetKind::Upright);
        assert_eq!(PianoPresetKind::from_str("electric_piano"), PianoPresetKind::Electric);
    }
}
