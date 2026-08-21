use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let header_i = MenuItem::with_id(app, "header", "KeyFX — Desktop Audio Utility", false, None::<&str>)?;
    let toggle_i = MenuItem::with_id(app, "toggle_active", "Toggle Active / Mute", true, None::<&str>)?;
    let open_i = MenuItem::with_id(app, "open", "Open KeyFX", true, None::<&str>)?;
    let exit_i = MenuItem::with_id(app, "exit", "Exit KeyFX", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&header_i, &toggle_i, &open_i, &exit_i])?;

    let tray_builder = TrayIconBuilder::with_id("keyfx-tray")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("KeyFX - Keyboard Sound Utility");

    let tray_builder = if let Some(icon) = app.default_window_icon() {
        tray_builder.icon(icon.clone())
    } else {
        tray_builder
    };

    tray_builder
        .on_menu_event(move |app, event| {
            match event.id().as_ref() {
                "open" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }
                "toggle_active" => {
                    let is_active = crate::keyboard::toggle_enabled();
                    let _ = app.emit("keyfx://tray-toggle-enabled", is_active);
                }
                "exit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    println!("[KeyFX Tray] System tray initialized successfully.");
    Ok(())
}
