pub mod audio;
pub mod autostart;
pub mod custom_sounds;
pub mod keyboard;
pub mod piano_audio;
pub mod settings;
pub mod tray;

pub use settings::AppConfig;

#[tauri::command]
fn get_app_status() -> Result<AppConfig, String> {
    Ok(settings::load_config())
}

#[tauri::command]
fn toggle_active_state(is_enabled: bool) -> Result<bool, String> {
    keyboard::set_enabled(is_enabled);
    let mut config = settings::load_config();
    config.is_enabled = is_enabled;
    let _ = settings::save_config(&config);
    audio::update_audio_settings(
        config.is_enabled,
        config.volume,
        config.pitch,
        config.playback_speed,
        config.random_pitch,
        config.random_volume,
        config.selected_sound_id,
    );
    Ok(is_enabled)
}

#[tauri::command]
fn set_app_mode(mode: String) -> Result<String, String> {
    keyboard::set_mode(mode.clone());
    let mut config = settings::load_config();
    config.mode = mode.clone();
    let _ = settings::save_config(&config);
    Ok(mode)
}

#[tauri::command]
fn sync_piano_settings(
    volume: f32,
    octave: i32,
    sustain: bool,
    preset: String,
) -> Result<(), String> {
    piano_audio::update_piano_settings(volume, octave, sustain, preset.clone());
    keyboard::update_piano_octave(octave);

    let mut config = settings::load_config();
    config.piano_volume = volume;
    config.piano_octave = octave;
    config.piano_sustain = sustain;
    config.piano_preset = preset;
    let _ = settings::save_config(&config);
    Ok(())
}

#[tauri::command]
fn set_piano_sustain(sustain: bool) -> Result<bool, String> {
    piano_audio::set_piano_sustain(sustain);
    keyboard::update_piano_sustain(sustain);
    let mut config = settings::load_config();
    config.piano_sustain = sustain;
    let _ = settings::save_config(&config);
    Ok(sustain)
}

#[tauri::command]
fn set_piano_octave(octave: i32) -> Result<i32, String> {
    let clamped = octave.clamp(1, 7);
    piano_audio::set_piano_octave(clamped);
    keyboard::update_piano_octave(clamped);
    let mut config = settings::load_config();
    config.piano_octave = clamped;
    let _ = settings::save_config(&config);
    Ok(clamped)
}

#[tauri::command]
fn set_piano_preset(preset: String) -> Result<String, String> {
    piano_audio::set_piano_preset(&preset);
    let mut config = settings::load_config();
    config.piano_preset = preset.clone();
    let _ = settings::save_config(&config);
    Ok(preset)
}

#[tauri::command]
fn preview_piano_preset(preset: String) -> Result<String, String> {
    piano_audio::preview_preset_sound(&preset);
    let mut config = settings::load_config();
    config.piano_preset = preset.clone();
    let _ = settings::save_config(&config);
    Ok(preset)
}

#[tauri::command]
fn trigger_piano_note_on(
    vk: u32,
    note_name: String,
    octave: Option<i32>,
    velocity: Option<f32>,
) -> Result<(), String> {
    piano_audio::play_piano_note_on(vk, &note_name, octave, velocity.unwrap_or(1.0));
    Ok(())
}

#[tauri::command]
fn trigger_piano_note_off(vk: u32) -> Result<(), String> {
    piano_audio::play_piano_note_off(vk);
    Ok(())
}

#[tauri::command]
fn stop_all_piano_notes() -> Result<(), String> {
    piano_audio::stop_all_piano_notes();
    Ok(())
}

#[tauri::command]
fn set_keyboard_scope(scope: String) -> Result<String, String> {
    keyboard::update_scope(scope.clone());
    let mut config = settings::load_config();
    config.keyboard_scope = scope.clone();
    let _ = settings::save_config(&config);
    Ok(scope)
}

#[tauri::command]
fn set_cooldown_ms(cooldown_ms: u64) -> Result<u64, String> {
    keyboard::update_cooldown(cooldown_ms);
    let mut config = settings::load_config();
    config.cooldown_ms = cooldown_ms;
    let _ = settings::save_config(&config);
    Ok(cooldown_ms)
}

#[tauri::command]
fn sync_audio_tuning(
    is_enabled: bool,
    volume: f32,
    pitch: f32,
    playback_speed: f32,
    random_pitch: f32,
    random_volume: f32,
    selected_sound_id: String,
) -> Result<(), String> {
    keyboard::set_enabled(is_enabled);
    let mut config = settings::load_config();
    config.is_enabled = is_enabled;
    config.volume = volume;
    config.pitch = pitch;
    config.playback_speed = playback_speed;
    config.random_pitch = random_pitch;
    config.random_volume = random_volume;
    config.selected_sound_id = selected_sound_id.clone();
    let _ = settings::save_config(&config);

    audio::update_audio_settings(
        is_enabled,
        volume,
        pitch,
        playback_speed,
        random_pitch,
        random_volume,
        selected_sound_id,
    );
    Ok(())
}

#[tauri::command]
fn preview_sound(sound_id: String) -> Result<(), String> {
    audio::preview_sound_by_id(&sound_id);
    Ok(())
}

#[tauri::command]
fn trigger_test_sound() -> Result<(), String> {
    audio::play_keystroke_sound(0x20); // Test with spacebar stabilizer sound
    Ok(())
}

#[tauri::command]
fn import_custom_sound() -> Result<Option<custom_sounds::CustomSoundItem>, String> {
    custom_sounds::pick_and_import_sound()
}

#[tauri::command]
fn get_custom_sounds() -> Result<Vec<custom_sounds::CustomSoundItem>, String> {
    Ok(custom_sounds::get_all_custom_sounds())
}

#[tauri::command]
fn delete_custom_sound(sound_id: String) -> Result<(), String> {
    custom_sounds::delete_sound_by_id(&sound_id)
}

#[tauri::command]
fn set_autostart_enabled(enabled: bool) -> Result<bool, String> {
    autostart::set_autostart_enabled(enabled)
}

#[tauri::command]
fn is_autostart_enabled() -> Result<bool, String> {
    Ok(autostart::is_autostart_enabled())
}

#[tauri::command]
fn hide_to_tray(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn show_main_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.unminimize().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_audio_output_devices() -> Result<Vec<audio::AudioDeviceInfo>, String> {
    Ok(audio::get_audio_output_devices())
}

#[tauri::command]
fn set_audio_output_device(device_name: String) -> Result<String, String> {
    audio::set_output_device(&device_name)?;
    let mut config = settings::load_config();
    config.output_device = device_name.clone();
    let _ = settings::save_config(&config);
    Ok(device_name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Minimize to tray on close
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .setup(|app| {
            audio::init_audio_engine();
            // Load saved custom sound profiles into audio engine cache
            custom_sounds::init_custom_sounds();
            keyboard::init_state(app.handle().clone());
            keyboard::start_hook();
            // Initialize Windows System Tray
            if let Err(err) = tray::create_tray(app.handle()) {
                eprintln!("[KeyFX Tray] Error setting up tray icon: {:?}", err);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_status,
            toggle_active_state,
            set_app_mode,
            sync_piano_settings,
            set_piano_sustain,
            set_piano_octave,
            set_piano_preset,
            preview_piano_preset,
            trigger_piano_note_on,
            trigger_piano_note_off,
            stop_all_piano_notes,
            set_keyboard_scope,
            set_cooldown_ms,
            sync_audio_tuning,
            preview_sound,
            trigger_test_sound,
            import_custom_sound,
            get_custom_sounds,
            delete_custom_sound,
            set_autostart_enabled,
            is_autostart_enabled,
            get_audio_output_devices,
            set_audio_output_device,
            hide_to_tray,
            show_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running KeyFX tauri application");
}
