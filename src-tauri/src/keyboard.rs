use std::sync::atomic::{AtomicIsize, Ordering};
use std::sync::{OnceLock, RwLock};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};
use windows_sys::Win32::Foundation::{HMODULE, LPARAM, LRESULT, WPARAM};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, DispatchMessageW, GetMessageW, SetWindowsHookExW,
    TranslateMessage, UnhookWindowsHookEx, HHOOK, KBDLLHOOKSTRUCT, MSG,
    WH_KEYBOARD_LL, WM_KEYDOWN, WM_SYSKEYDOWN,
};

#[derive(Debug, Clone, serde::Serialize)]
pub struct KeyStrokeEvent {
    pub vk_code: u32,
    pub key_label: String,
    pub timestamp_ms: u64,
}

pub struct KeyboardHookState {
    pub is_enabled: bool,
    pub scope: String,
    pub cooldown_ms: u64,
    pub last_press: Instant,
    pub app_handle: Option<AppHandle>,
}

static GLOBAL_STATE: OnceLock<RwLock<KeyboardHookState>> = OnceLock::new();
static HOOK_HANDLE: AtomicIsize = AtomicIsize::new(0);

pub fn init_state(app_handle: AppHandle) {
    let config = crate::settings::load_config();
    let state = KeyboardHookState {
        is_enabled: config.is_enabled,
        scope: config.keyboard_scope,
        cooldown_ms: config.cooldown_ms,
        last_press: Instant::now(),
        app_handle: Some(app_handle),
    };
    let _ = GLOBAL_STATE.set(RwLock::new(state));
}

pub fn is_enabled() -> bool {
    if let Some(state_lock) = GLOBAL_STATE.get() {
        if let Ok(state) = state_lock.read() {
            return state.is_enabled;
        }
    }
    true
}

pub fn set_enabled(enabled: bool) {
    if let Some(state_lock) = GLOBAL_STATE.get() {
        if let Ok(mut state) = state_lock.write() {
            state.is_enabled = enabled;
            println!("[KeyFX Hook] Global keyboard listening state: {}", enabled);
        }
    }
}

pub fn toggle_enabled() -> bool {
    if let Some(state_lock) = GLOBAL_STATE.get() {
        if let Ok(mut state) = state_lock.write() {
            state.is_enabled = !state.is_enabled;
            println!("[KeyFX Hook] Global keyboard listening state toggled to: {}", state.is_enabled);
            return state.is_enabled;
        }
    }
    true
}

pub fn update_scope(scope: String) {
    if let Some(state_lock) = GLOBAL_STATE.get() {
        if let Ok(mut state) = state_lock.write() {
            state.scope = scope;
        }
    }
}

pub fn update_cooldown(cooldown_ms: u64) {
    if let Some(state_lock) = GLOBAL_STATE.get() {
        if let Ok(mut state) = state_lock.write() {
            state.cooldown_ms = cooldown_ms;
        }
    }
}

// Convert Virtual Key Code to a general key label for the UI Visualizer
fn get_key_label(vk: u32) -> String {
    match vk {
        0x08 => "BACKSPACE".to_string(),
        0x09 => "TAB".to_string(),
        0x0D => "ENTER".to_string(),
        0x14 => "CAPS".to_string(),
        0x1B => "ESC".to_string(),
        0x20 => "SPACE".to_string(),
        0x30..=0x39 => format!("{}", (vk - 0x30)),
        0x41..=0x5A => format!("{}", (vk as u8 as char)),
        0x60..=0x69 => format!("{}", (vk - 0x60)),
        0x70..=0x7B => format!("F{}", (vk - 0x70 + 1)),
        0xA0 | 0x10 => "L-SHIFT".to_string(),
        0xA1 => "R-SHIFT".to_string(),
        0xA2 | 0x11 => "CTRL".to_string(),
        0xA3 => "CTRL".to_string(),
        0xA4 | 0x12 => "ALT".to_string(),
        0xA5 => "ALT".to_string(),
        0x5B | 0x5C => "WIN".to_string(),
        0xBC => ",".to_string(),
        0xBE => ".".to_string(),
        0xBF => "/".to_string(),
        0xBA => ";".to_string(),
        0xDE => "'".to_string(),
        0xDB => "[".to_string(),
        0xDD => "]".to_string(),
        0xDC => "\\".to_string(),
        0xBD => "-".to_string(),
        0xBB => "=".to_string(),
        _ => "KEY".to_string(),
    }
}

// Low-Level Windows Keyboard Callback
unsafe extern "system" fn low_level_keyboard_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if n_code >= 0 && (w_param == WM_KEYDOWN as usize || w_param == WM_SYSKEYDOWN as usize) {
        let kbd_struct = *(l_param as *const KBDLLHOOKSTRUCT);
        let vk = kbd_struct.vkCode;

        if let Some(state_lock) = GLOBAL_STATE.get() {
            if let Ok(mut state) = state_lock.write() {
                if state.is_enabled {
                    let now = Instant::now();
                    let elapsed = now.duration_since(state.last_press);

                    // Respect configured keystroke cooldown
                    if elapsed >= Duration::from_millis(state.cooldown_ms) {
                        let is_letter = (0x41..=0x5A).contains(&vk);
                        let is_number = (0x30..=0x39).contains(&vk) || (0x60..=0x69).contains(&vk);
                        let is_typing_common = matches!(vk, 0x20 | 0x08 | 0x0D | 0x09); // Space, Backspace, Enter, Tab
                        let is_modifier = matches!(vk, 0x10 | 0x11 | 0x12 | 0x14 | 0x5B | 0x5C | 0xA0..=0xA5);

                        let allow_trigger = match state.scope.as_str() {
                            "letters_only" => is_letter || is_typing_common,
                            "numbers_only" => is_number || is_typing_common,
                            "letters_numbers" => is_letter || is_number || is_typing_common,
                            "custom" => !is_modifier,
                            _ => true, // "all_keys" default
                        };

                        if allow_trigger {
                            state.last_press = now;
                            let key_label = get_key_label(vk);

                            // Trigger ultra-low latency native audio with physical key character
                            crate::audio::play_keystroke_sound(vk);

                            if let Some(app) = &state.app_handle {
                                let payload = KeyStrokeEvent {
                                    vk_code: vk,
                                    key_label,
                                    timestamp_ms: std::time::SystemTime::now()
                                        .duration_since(std::time::UNIX_EPOCH)
                                        .unwrap_or_default()
                                        .as_millis() as u64,
                                };
                                let _ = app.emit("keyfx://keystroke", payload);
                            }
                        }
                    }
                }
            }
        }
    }

    // Always pass through immediately — NEVER block or delay user input
    CallNextHookEx(std::ptr::null_mut(), n_code, w_param, l_param)
}

pub fn start_hook() {
    std::thread::spawn(|| unsafe {
        let hook = SetWindowsHookExW(
            WH_KEYBOARD_LL,
            Some(low_level_keyboard_proc),
            std::ptr::null_mut() as HMODULE,
            0,
        );

        if hook.is_null() {
            eprintln!("[KeyFX Hook] Failed to install low-level Windows keyboard hook.");
            return;
        }

        println!("[KeyFX Hook] Global Windows low-level keyboard hook active.");
        HOOK_HANDLE.store(hook as isize, Ordering::SeqCst);

        let mut msg: MSG = std::mem::zeroed();
        while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }

        let existing_hook = HOOK_HANDLE.swap(0, Ordering::SeqCst);
        if existing_hook != 0 {
            UnhookWindowsHookEx(existing_hook as HHOOK);
        }
    });
}
