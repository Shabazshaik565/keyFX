use std::fs;
use std::path::PathBuf;
use std::sync::mpsc::{sync_channel, SyncSender};
use std::sync::{OnceLock, RwLock};
use serde::{Deserialize, Serialize};

fn default_mode() -> String {
    "normal".to_string()
}

fn default_piano_volume() -> f32 {
    85.0
}

fn default_piano_octave() -> i32 {
    4
}

fn default_piano_preset() -> String {
    "grand_piano".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub is_enabled: bool,
    pub volume: f32,
    pub pitch: f32,
    pub playback_speed: f32,
    pub random_pitch: f32,
    pub random_volume: f32,
    pub cooldown_ms: u64,
    pub selected_sound_id: String,
    pub keyboard_scope: String,
    pub start_with_windows: bool,
    pub minimize_to_tray: bool,
    pub output_device: String,
    #[serde(default = "default_mode")]
    pub mode: String,
    #[serde(default = "default_piano_volume")]
    pub piano_volume: f32,
    #[serde(default = "default_piano_octave")]
    pub piano_octave: i32,
    #[serde(default)]
    pub piano_sustain: bool,
    #[serde(default = "default_piano_preset")]
    pub piano_preset: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            is_enabled: true,
            volume: 85.0,
            pitch: 0.0,
            playback_speed: 1.0,
            random_pitch: 8.0,
            random_volume: 5.0,
            cooldown_ms: 15,
            selected_sound_id: "mech_cherry_blue".to_string(),
            keyboard_scope: "all_keys".to_string(),
            start_with_windows: false,
            minimize_to_tray: true,
            output_device: "default".to_string(),
            mode: "normal".to_string(),
            piano_volume: 85.0,
            piano_octave: 4,
            piano_sustain: false,
            piano_preset: "grand_piano".to_string(),
        }
    }
}

static CONFIG_CACHE: OnceLock<RwLock<AppConfig>> = OnceLock::new();
static CONFIG_WRITER_TX: OnceLock<SyncSender<AppConfig>> = OnceLock::new();

fn get_config_writer() -> &'static SyncSender<AppConfig> {
    CONFIG_WRITER_TX.get_or_init(|| {
        let (tx, rx) = sync_channel::<AppConfig>(64);
        std::thread::spawn(move || {
            while let Ok(mut config) = rx.recv() {
                // Coalesce rapid bursts (e.g. from slider drags or rapid clicks)
                while let Ok(newer) = rx.try_recv() {
                    config = newer;
                }
                let path = get_config_path();
                if let Ok(json) = serde_json::to_string_pretty(&config) {
                    let _ = fs::write(path, json);
                }
                std::thread::sleep(std::time::Duration::from_millis(50));
            }
        });
        tx
    })
}

fn get_config_path() -> PathBuf {
    let base = if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        PathBuf::from(local_appdata).join("KeyFX")
    } else if let Ok(user_profile) = std::env::var("USERPROFILE") {
        PathBuf::from(user_profile).join(".keyfx")
    } else {
        PathBuf::from("./keyfx_data")
    };

    let _ = fs::create_dir_all(&base);
    base.join("config.json")
}

pub fn load_config() -> AppConfig {
    if let Some(lock) = CONFIG_CACHE.get() {
        if let Ok(config) = lock.read() {
            return config.clone();
        }
    }

    let path = get_config_path();
    let initial = if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            serde_json::from_str::<AppConfig>(&content).unwrap_or_default()
        } else {
            AppConfig::default()
        }
    } else {
        AppConfig::default()
    };

    let _ = CONFIG_CACHE.set(RwLock::new(initial.clone()));
    initial
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    // 1. Immediately update in-memory cache for zero-latency retrieval
    if let Some(lock) = CONFIG_CACHE.get() {
        if let Ok(mut c) = lock.write() {
            *c = config.clone();
        }
    } else {
        let _ = CONFIG_CACHE.set(RwLock::new(config.clone()));
    }

    // 2. Coalesced non-blocking background disk write (never spawns loose threads)
    let _ = get_config_writer().try_send(config.clone());

    Ok(())
}
