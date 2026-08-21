use std::env;
use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_WRITE};
use winreg::RegKey;

const APP_NAME: &str = "KeyFX";
const RUN_KEY_PATH: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";

pub fn is_autostart_enabled() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(run_key) = hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_READ) {
        let value: Result<String, _> = run_key.get_value(APP_NAME);
        value.is_ok()
    } else {
        false
    }
}

pub fn set_autostart_enabled(enabled: bool) -> Result<bool, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu
        .open_subkey_with_flags(RUN_KEY_PATH, KEY_WRITE | KEY_READ)
        .map_err(|e| format!("Failed to access Windows Run registry: {}", e))?;

    if enabled {
        let current_exe = env::current_exe()
            .map_err(|e| format!("Failed to get current executable path: {}", e))?;
        let exe_str = current_exe.to_string_lossy().to_string();
        
        // Quote the path in case it contains spaces
        let formatted_path = format!("\"{}\"", exe_str);

        run_key
            .set_value(APP_NAME, &formatted_path)
            .map_err(|e| format!("Failed to write autostart registry entry: {}", e))?;
        println!("[KeyFX Autostart] Enabled autostart with path: {}", formatted_path);
        Ok(true)
    } else {
        let _ = run_key.delete_value(APP_NAME);
        println!("[KeyFX Autostart] Disabled autostart.");
        Ok(false)
    }
}
