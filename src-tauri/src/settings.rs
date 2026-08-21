use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

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
        }
    }
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
    let path = get_config_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(config) = serde_json::from_str::<AppConfig>(&content) {
                return config;
            }
        }
    }
    AppConfig::default()
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = get_config_path();
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(path, json)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    Ok(())
}
