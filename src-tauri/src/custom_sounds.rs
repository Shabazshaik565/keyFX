use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomSoundItem {
    pub id: String,
    pub name: String,
    pub category: String,
    pub description: String,
    pub tags: Vec<String>,
    pub filename: String,
    pub file_path: String,
    pub file_size: u64,
    pub is_custom: bool,
}

fn get_data_dir() -> PathBuf {
    let base = if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        PathBuf::from(local_appdata).join("KeyFX")
    } else if let Ok(user_profile) = std::env::var("USERPROFILE") {
        PathBuf::from(user_profile).join(".keyfx")
    } else {
        PathBuf::from("./keyfx_data")
    };

    let sounds_dir = base.join("sounds");
    let _ = fs::create_dir_all(&sounds_dir);
    sounds_dir
}

fn get_metadata_path() -> PathBuf {
    let data_dir = get_data_dir();
    data_dir.join("custom_sounds.json")
}

fn read_metadata() -> Vec<CustomSoundItem> {
    let path = get_metadata_path();
    if !path.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&path) {
        Ok(contents) => serde_json::from_str(&contents).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

fn write_metadata(items: &[CustomSoundItem]) -> Result<(), String> {
    let path = get_metadata_path();
    let json = serde_json::to_string_pretty(items)
        .map_err(|e| format!("Failed to serialize sound metadata: {}", e))?;
    fs::write(path, json)
        .map_err(|e| format!("Failed to write sound metadata file: {}", e))?;
    Ok(())
}

/// Load all stored custom sound files into the in-memory audio engine on startup
pub fn init_custom_sounds() -> Vec<CustomSoundItem> {
    let items = read_metadata();
    println!("[KeyFX Custom] Loading {} persisted custom sounds...", items.len());

    let mut valid_items = Vec::new();

    for item in items {
        let file_path = Path::new(&item.file_path);
        if file_path.exists() {
            if let Ok(bytes) = fs::read(file_path) {
                crate::audio::add_custom_sound(item.id.clone(), bytes);
                valid_items.push(item);
                continue;
            }
        }
        println!("[KeyFX Custom] Skipping missing custom sound file: {:?}", file_path);
    }

    valid_items
}

/// Open native Windows file dialog and import audio file
pub fn pick_and_import_sound() -> Result<Option<CustomSoundItem>, String> {
    let file = rfd::FileDialog::new()
        .add_filter("Audio Files (*.wav, *.mp3, *.ogg)", &["wav", "mp3", "ogg"])
        .set_title("Select Keyboard Audio Sound (WAV, MP3, OGG)")
        .pick_file();

    let source_path = match file {
        Some(path) => path,
        None => return Ok(None), // User cancelled dialog
    };

    let bytes = fs::read(&source_path)
        .map_err(|e| format!("Failed to read selected file: {}", e))?;

    if bytes.len() > 25 * 1024 * 1024 {
        return Err("Selected audio file exceeds 25 MB maximum size limit.".to_string());
    }

    // Validate that rodio can decode this audio stream
    crate::audio::validate_audio_bytes(&bytes)?;

    let original_filename = source_path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_else(|| "custom_sound.wav".to_string());

    let extension = source_path
        .extension()
        .map(|e| e.to_string_lossy().to_string())
        .unwrap_or_else(|| "wav".to_string());

    let stem = source_path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Custom Sound".to_string());

    // Clean display name
    let display_name = stem.replace(['_', '-'], " ");

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    let safe_stem = stem.chars().filter(|c| c.is_alphanumeric()).collect::<String>();
    let id = format!("custom_{}_{}", timestamp, safe_stem);

    let target_filename = format!("{}.{}", id, extension);
    let target_path = get_data_dir().join(&target_filename);

    fs::write(&target_path, &bytes)
        .map_err(|e| format!("Failed to copy sound to KeyFX app directory: {}", e))?;

    // Register with audio engine for instant zero-latency playback
    crate::audio::add_custom_sound(id.clone(), bytes.clone());

    let item = CustomSoundItem {
        id,
        name: display_name,
        category: "Custom".to_string(),
        description: format!("Imported local audio file: {}", original_filename),
        tags: vec!["Custom".to_string(), extension.to_uppercase()],
        filename: original_filename,
        file_path: target_path.to_string_lossy().to_string(),
        file_size: bytes.len() as u64,
        is_custom: true,
    };

    let mut all_items = read_metadata();
    all_items.retain(|existing| existing.id != item.id);
    all_items.insert(0, item.clone());
    write_metadata(&all_items)?;

    println!("[KeyFX Custom] Successfully imported sound: {}", item.name);
    Ok(Some(item))
}

pub fn get_all_custom_sounds() -> Vec<CustomSoundItem> {
    read_metadata()
}

pub fn get_sound_bytes(id: &str) -> Option<Vec<u8>> {
    let items = read_metadata();
    if let Some(item) = items.into_iter().find(|x| x.id == id) {
        let file_path = PathBuf::from(&item.file_path);
        if file_path.exists() {
            return fs::read(file_path).ok();
        }
    }
    None
}

pub fn delete_sound_by_id(id: &str) -> Result<(), String> {
    crate::audio::remove_custom_sound(id);

    let mut items = read_metadata();
    if let Some(pos) = items.iter().position(|x| x.id == id) {
        let item = items.remove(pos);
        let path = PathBuf::from(&item.file_path);
        if path.exists() {
            let _ = fs::remove_file(path);
        }
        write_metadata(&items)?;
        println!("[KeyFX Custom] Deleted sound: {}", id);
    }

    Ok(())
}
