use std::collections::HashMap;
use std::io::Cursor;
use std::sync::{Arc, OnceLock, RwLock};
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use rodio::cpal::traits::{DeviceTrait, HostTrait};
use rodio::cpal;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDeviceInfo {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

#[derive(Debug, Clone)]
pub struct AudioSettings {
    pub is_enabled: bool,
    pub volume: f32,
    pub pitch: f32,
    pub playback_speed: f32,
    pub random_pitch: f32,
    pub random_volume: f32,
    pub selected_sound_id: String,
}

impl Default for AudioSettings {
    fn default() -> Self {
        Self {
            is_enabled: true,
            volume: 85.0,
            pitch: 0.0,
            playback_speed: 1.0,
            random_pitch: 8.0,
            random_volume: 5.0,
            selected_sound_id: "mech_cherry_blue".to_string(),
        }
    }
}

pub struct AudioEngine {
    stream_handle: OutputStreamHandle,
    sound_cache: HashMap<String, Vec<u8>>,
    settings: Arc<RwLock<AudioSettings>>,
}

enum AudioWorkerMsg {
    SwitchDevice(String),
}

static AUDIO_ENGINE: OnceLock<RwLock<AudioEngine>> = OnceLock::new();
static AUDIO_WORKER_TX: OnceLock<std::sync::mpsc::Sender<AudioWorkerMsg>> = OnceLock::new();


// Fast pseudo-random number generator for zero-allocation micro-variations
fn fast_random() -> f32 {
    use std::time::SystemTime;
    let nanos = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos();
    ((nanos % 1000) as f32) / 1000.0
}

// Generate high quality 16-bit 44.1kHz PCM WAV buffers in memory
fn generate_wav_sample(generator: impl Fn(f32) -> f32, duration_secs: f32) -> Vec<u8> {
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate: 44100,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut cursor = Cursor::new(Vec::new());
    {
        let mut writer = hound::WavWriter::new(&mut cursor, spec).expect("failed to create wav writer");
        let total_samples = (44100.0 * duration_secs) as usize;

        for i in 0..total_samples {
            let t = (i as f32) / 44100.0;
            let sample_f32 = generator(t).clamp(-1.0, 1.0);
            let sample_i16 = (sample_f32 * 32767.0) as i16;
            writer.write_sample(sample_i16).unwrap();
        }
        writer.finalize().unwrap();
    }
    cursor.into_inner()
}

fn create_built_in_sounds() -> HashMap<String, Vec<u8>> {
    let mut sounds = HashMap::new();

    // 1. Mechanical Cherry MX Blue: High frequency tactile snap + crisp click
    let cherry_blue = generate_wav_sample(
        |t| {
            let env = (-t * 60.0).exp();
            let click = (2.0 * std::f32::consts::PI * 1800.0 * t).sin() * 0.7;
            let snap = (2.0 * std::f32::consts::PI * 3400.0 * t).sin() * 0.4;
            let thump = (2.0 * std::f32::consts::PI * 220.0 * t).sin() * 0.3 * (-t * 35.0).exp();
            (click + snap + thump) * env
        },
        0.08,
    );
    sounds.insert("mech_cherry_blue".to_string(), cherry_blue);

    // 2. Mechanical Gateron Ink Black: Deep low-frequency dampened thock
    let gateron_ink = generate_wav_sample(
        |t| {
            let env = (-t * 38.0).exp();
            let thock1 = (2.0 * std::f32::consts::PI * 160.0 * t).sin() * 0.8;
            let thock2 = (2.0 * std::f32::consts::PI * 310.0 * t).sin() * 0.4;
            let sub = (2.0 * std::f32::consts::PI * 85.0 * t).sin() * 0.5;
            (thock1 + thock2 + sub) * env
        },
        0.12,
    );
    sounds.insert("mech_gateron_ink".to_string(), gateron_ink);

    // 3. Vintage 1930s Typewriter: Heavy striker hit with mechanical resonance
    let typewriter = generate_wav_sample(
        |t| {
            let hit_env = (-t * 80.0).exp();
            let res_env = (-t * 25.0).exp();
            let hit = (2.0 * std::f32::consts::PI * 1250.0 * t).sin() * 0.6 * hit_env;
            let body = (2.0 * std::f32::consts::PI * 380.0 * t).sin() * 0.4 * res_env;
            let metal = (2.0 * std::f32::consts::PI * 2600.0 * t).sin() * 0.25 * res_env;
            hit + body + metal
        },
        0.14,
    );
    sounds.insert("typewriter_1930".to_string(), typewriter);

    // 4. Cyber Deck Terminal Beep: Sci-Fi HUD synthesizer blip
    let cyber_deck = generate_wav_sample(
        |t| {
            let env = (-t * 40.0).exp();
            let freq = 1200.0 * (-t * 20.0).exp() + 440.0;
            let tone = (2.0 * std::f32::consts::PI * freq * t).sin() * 0.7;
            let harm = (2.0 * std::f32::consts::PI * freq * 2.0 * t).sin() * 0.2;
            (tone + harm) * env
        },
        0.09,
    );
    sounds.insert("cyber_deck_beep".to_string(), cyber_deck);

    // 5. Soft Bubble Pop: Gentle fluid bubble pop
    let soft_bubble = generate_wav_sample(
        |t| {
            let env = (-t * 45.0).exp();
            let freq = 450.0 + (t * 800.0);
            let pop = (2.0 * std::f32::consts::PI * freq * t).sin() * 0.8;
            pop * env
        },
        0.07,
    );
    sounds.insert("soft_bubble_pop".to_string(), soft_bubble);

    // 6. Retro 8-Bit Arcade Blip: Square-wave retro arcade blip
    let arcade_blip = generate_wav_sample(
        |t| {
            let env = (-t * 35.0).exp();
            let freq = 680.0;
            let square = if (2.0 * std::f32::consts::PI * freq * t).sin() > 0.0 { 0.5 } else { -0.5 };
            square * env
        },
        0.08,
    );
    sounds.insert("arcade_8bit_blip".to_string(), arcade_blip);

    // 7. Heavy Tactile Impact: Resonant bottom-out brass/plate hit
    let heavy_impact = generate_wav_sample(
        |t| {
            let env = (-t * 50.0).exp();
            let hit = (2.0 * std::f32::consts::PI * 240.0 * t).sin() * 0.7;
            let ring = (2.0 * std::f32::consts::PI * 720.0 * t).sin() * 0.3 * (-t * 20.0).exp();
            let sub = (2.0 * std::f32::consts::PI * 110.0 * t).sin() * 0.5;
            (hit + ring + sub) * env
        },
        0.13,
    );
    sounds.insert("heavy_tactile_impact".to_string(), heavy_impact);

    sounds
}

pub fn get_audio_output_devices() -> Vec<AudioDeviceInfo> {
    let host = cpal::default_host();
    let mut list = Vec::new();

    list.push(AudioDeviceInfo {
        id: "default".to_string(),
        name: "Default Windows Audio Device".to_string(),
        is_default: true,
    });

    if let Ok(devices) = host.output_devices() {
        for device in devices {
            if let Ok(name) = device.name() {
                list.push(AudioDeviceInfo {
                    id: name.clone(),
                    name,
                    is_default: false,
                });
            }
        }
    }
    list
}

pub fn set_output_device(device_name: &str) -> Result<(), String> {
    if let Some(tx) = AUDIO_WORKER_TX.get() {
        tx.send(AudioWorkerMsg::SwitchDevice(device_name.to_string()))
            .map_err(|e| format!("Audio worker channel error: {}", e))?;
    }
    println!("[KeyFX Audio] Audio output device switch request sent: {}", device_name);
    Ok(())
}

fn create_stream_for_device(device_name: &str) -> Option<(OutputStream, OutputStreamHandle)> {
    let host = cpal::default_host();
    if device_name == "default" || device_name.is_empty() {
        OutputStream::try_default().ok()
    } else {
        let mut target = None;
        if let Ok(devices) = host.output_devices() {
            for d in devices {
                if let Ok(name) = d.name() {
                    if name == device_name {
                        target = Some(d);
                        break;
                    }
                }
            }
        }
        if let Some(dev) = target {
            match OutputStream::try_from_device(&dev) {
                Ok(res) => Some(res),
                Err(_) => OutputStream::try_default().ok(),
            }
        } else {
            OutputStream::try_default().ok()
        }
    }
}

pub fn init_audio_engine() {
    let (tx, rx) = std::sync::mpsc::channel::<AudioWorkerMsg>();
    let _ = AUDIO_WORKER_TX.set(tx);

    std::thread::spawn(move || {
        let config = crate::settings::load_config();
        let mut stream_opt = create_stream_for_device(&config.output_device);

        if stream_opt.is_none() {
            eprintln!("[KeyFX Audio] Warning: Failed to open audio output stream");
            return;
        }

        let (initial_stream, stream_handle) = stream_opt.take().unwrap();
        let mut _current_stream: Option<OutputStream> = Some(initial_stream);
        let sound_cache = create_built_in_sounds();
        let initial_settings = AudioSettings {
            is_enabled: config.is_enabled,
            volume: config.volume,
            pitch: config.pitch,
            playback_speed: config.playback_speed,
            random_pitch: config.random_pitch,
            random_volume: config.random_volume,
            selected_sound_id: config.selected_sound_id,
        };

        let engine = AudioEngine {
            stream_handle: stream_handle.clone(),
            sound_cache,
            settings: Arc::new(RwLock::new(initial_settings)),
        };

        let stream_for_piano = stream_handle.clone();
        let _ = AUDIO_ENGINE.set(RwLock::new(engine));
        crate::piano_audio::init_piano_engine(stream_for_piano);
        println!("[KeyFX Audio] Local low-latency audio engine initialized.");

        // Immediately load and register all saved custom sounds into the audio engine cache
        let _ = crate::custom_sounds::init_custom_sounds();

        // Listen for device switch events on this audio worker thread
        while let Ok(msg) = rx.recv() {
            match msg {
                AudioWorkerMsg::SwitchDevice(device_name) => {
                    _current_stream = None; // Safely drop previous stream on this thread
                    if let Some((new_stream, new_handle)) = create_stream_for_device(&device_name) {
                        _current_stream = Some(new_stream);
                        if let Some(engine_lock) = AUDIO_ENGINE.get() {
                            if let Ok(mut engine) = engine_lock.write() {
                                engine.stream_handle = new_handle.clone();
                                crate::piano_audio::update_stream_handle(new_handle);
                            }
                        }
                        println!("[KeyFX Audio] Successfully switched audio output to: {}", device_name);
                    } else {
                        eprintln!("[KeyFX Audio] Failed to switch audio device: {}", device_name);
                    }
                }
            }
        }
    });
}





pub fn update_audio_settings(
    is_enabled: bool,
    volume: f32,
    pitch: f32,
    playback_speed: f32,
    random_pitch: f32,
    random_volume: f32,
    selected_sound_id: String,
) {
    if let Some(engine_lock) = AUDIO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            if let Ok(mut settings) = engine.settings.write() {
                settings.is_enabled = is_enabled;
                settings.volume = volume;
                settings.pitch = pitch;
                settings.playback_speed = playback_speed;
                settings.random_pitch = random_pitch;
                settings.random_volume = random_volume;
                settings.selected_sound_id = selected_sound_id;
            }
        }
    }
}

pub fn add_custom_sound(id: String, bytes: Vec<u8>) {
    if let Some(engine_lock) = AUDIO_ENGINE.get() {
        if let Ok(mut engine) = engine_lock.write() {
            engine.sound_cache.insert(id, bytes);
        }
    }
}

pub fn remove_custom_sound(id: &str) {
    if let Some(engine_lock) = AUDIO_ENGINE.get() {
        if let Ok(mut engine) = engine_lock.write() {
            engine.sound_cache.remove(id);
        }
    }
}

pub fn validate_audio_bytes(bytes: &[u8]) -> Result<(), String> {
    let cursor = Cursor::new(bytes.to_vec());
    match Decoder::new(cursor) {
        Ok(_) => Ok(()),
        Err(err) => Err(format!("Unsupported or corrupted audio format: {}", err)),
    }
}

pub fn play_keystroke_sound(vk: u32) {
    if let Some(engine_lock) = AUDIO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            if let Ok(settings) = engine.settings.read() {
                if !settings.is_enabled {
                    return;
                }

                let sound_id = settings.selected_sound_id.clone();
                let wav_data_opt = if let Some(data) = engine.sound_cache.get(&sound_id) {
                    Some(data.clone())
                } else if let Some(disk_data) = crate::custom_sounds::get_sound_bytes(&sound_id) {
                    Some(disk_data)
                } else {
                    None
                };

                if let Some(wav_data) = wav_data_opt {
                    let cursor = Cursor::new(wav_data);
                    if let Ok(source) = Decoder::new(cursor) {
                        if let Ok(sink) = Sink::try_new(&engine.stream_handle) {
                            // 1. Key-specific acoustic nuance (Spacebar deeper stabilizer, Backspace crisp pop, Enter solid latch)
                            let key_pitch_mult = match vk {
                                0x20 => 0.85, // Spacebar (deep stabilizer thump)
                                0x08 => 1.12, // Backspace (crisp rebound click)
                                0x0D => 0.94, // Enter (heavy accent click)
                                _ => 1.0,
                            };

                            let key_vol_mult = match vk {
                                0x20 => 1.15, // Spacebar slightly louder body
                                0x0D => 1.10, // Enter slightly louder accent
                                _ => 1.0,
                            };

                            // 2. Calculate volume with dynamic punch boost (up to 2.5x gain headroom)
                            let vol_rand = (fast_random() - 0.5) * (settings.random_volume / 100.0);
                            let base_vol = (settings.volume / 100.0) * 1.6 * key_vol_mult;
                            let final_vol = (base_vol + vol_rand).clamp(0.0, 2.5);
                            sink.set_volume(final_vol);

                            // 3. Calculate pitch & speed modulation: 2^(pitch / 12)
                            let pitch_rand = (fast_random() - 0.5) * (settings.random_pitch / 100.0);
                            let semitone_factor = 2.0_f32.powf((settings.pitch / 12.0) + pitch_rand);
                            let final_speed = (settings.playback_speed * semitone_factor * key_pitch_mult).clamp(0.2, 4.0);
                            sink.set_speed(final_speed);

                            sink.append(source);
                            sink.detach(); // Detached non-blocking playback
                        }
                    }
                }
            }
        }
    }
}

pub fn preview_sound_by_id(sound_id: &str) {
    if let Some(engine_lock) = AUDIO_ENGINE.get() {
        if let Ok(engine) = engine_lock.read() {
            let wav_data_opt = if let Some(data) = engine.sound_cache.get(sound_id) {
                Some(data.clone())
            } else if let Some(disk_data) = crate::custom_sounds::get_sound_bytes(sound_id) {
                Some(disk_data)
            } else {
                None
            };

            if let Some(wav_data) = wav_data_opt {
                let cursor = Cursor::new(wav_data);
                if let Ok(source) = Decoder::new(cursor) {
                    if let Ok(sink) = Sink::try_new(&engine.stream_handle) {
                        if let Ok(settings) = engine.settings.read() {
                            sink.set_volume(((settings.volume / 100.0) * 1.6).clamp(0.0, 2.5));
                        }
                        sink.append(source);
                        sink.detach();
                    }
                }
            }
        }
    }
}


