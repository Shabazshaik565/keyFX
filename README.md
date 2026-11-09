# 🎹 KeyFX — Native Windows Keyboard Sound Utility

<div align="center">

![KeyFX Version](https://img.shields.io/badge/version-2.0.0-cyan.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-blue.svg)
![Framework](https://img.shields.io/badge/framework-Tauri%20v2%20%7C%20React%2019-indigo.svg)
![Backend](https://img.shields.io/badge/backend-Rust-orange.svg)
![Latency](https://img.shields.io/badge/latency-%3C%202ms%20(Zero%20Delay)-emerald.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Turn every keystroke into rich, tactile mechanical audio across any Windows application.**

[Features](#-key-features) • [Architecture](#-architecture) • [Sound Profiles](#-sound-profiles) • [Audio Routing](#-audio-output-routing) • [Setup on Another Device](#-setup-on-another-device) • [Building Standalone Binary](#-building-standalone-binary)

</div>

---

## ✨ Overview

**KeyFX** is a native, ultra-low-latency desktop utility for Windows that produces acoustic feedback for every physical keypress. Built with **Tauri v2**, **Rust**, and **React 19**, KeyFX captures keystrokes system-wide via a non-blocking Windows low-level hook (`WH_KEYBOARD_LL`) and streams acoustic profiles through a dedicated low-latency audio engine.

---

## 🚀 Key Features

* **🎹 Playable Real Piano Mode (NEW)**: Transform your computer keyboard into a polyphonic musical instrument. Play chords and melodies with physical modeling acoustic grand piano, studio upright, and Rhodes electric piano voices.
* **⚡ Ultra-Low Latency (< 2ms)**: Audio plays on a dedicated worker thread with zero typing lag or input interference.
* **🎧 In-App Audio Output Selector**: Choose to route sounds to **Computer Speakers**, **Bluetooth Headphones**, or the **Default Windows Output** directly inside Settings.
* **🎵 Custom Audio Imports (WAV / MP3 / OGG)**: Import your own sound packs using the native Windows file picker. Stored locally in `%LOCALAPPDATA%\KeyFX\sounds\`.
* **⌨️ Interactive RGB Mechanical Visualizer**: Live mechanical keyboard deck with real-time key actuation, typing speed counter (WPM), and 5 RGB lighting modes.
* **🎚️ DSP Studio Mixing Console**: Fine-tune volume gain, semitone pitch transposition ($\pm 12$ st), speed scaling ($0.5\times - 2.0\times$), debounce cooldown, and organic micro-pitch/volume jitter.
* **🪄 Instant Acoustic Presets**: One-tap DSP presets including *Crisp Tactile*, *Deep ASMR Thock*, *Cyber Arcade*, and *Subtle & Quiet*.
* **🪟 Native Windows Integration**:
  * **System Tray**: Runs silently in the background with context menu (`Active / Mute`, `Open`, `Exit`).
  * **Minimize on Close (`X`)**: Window close hides to the system tray so audio playback continues uninterrupted.
  * **Autostart on Boot**: Automatically launches on Windows startup via Registry (`HKCU\...\Run`).
* **🔒 Privacy-First Guarantee**: 100% offline. Zero telemetry, zero network requests, and never logs or stores typed characters.

---

## 🎹 Real Piano Mode

KeyFX includes two switchable modes: **Normal Mode** (for mechanical keyboard acoustics across all Windows apps) and **Piano Mode** (to play music like a real piano).

### Keyboard Mapping

| Key Type | Computer Keys | Mapped Notes |
| :--- | :--- | :--- |
| **White Keys (Home Row)** | `A`, `S`, `D`, `F`, `G`, `H`, `J`, `K`, `L`, `;`, `'` | `C`, `D`, `E`, `F`, `G`, `A`, `B`, `C+1`, `D+1`, `E+1`, `F+1` |
| **Black Keys (Top Row)** | `W`, `E`, `T`, `Y`, `U`, `O`, `P`, `[`, `]` | `C#`, `D#`, `F#`, `G#`, `A#`, `C#+1`, `D#+1`, `F#+1`, `G#+1` |
| **Octave Shifting** | `Z` / `X` | Shift base octave Down / Up ($C1$ to $C7$) |
| **Sustain Pedal** | `Spacebar` (or UI Toggle) | Hold damper open; release to damp vibrating strings |

### Piano Engine Features
* **Polyphony**: Play up to 32 simultaneous voices and chords without note choking.
* **Acoustic Synthesis**: Inharmonic string partials ($f_n = n f_0 \sqrt{1 + B n^2}$), hammer felt transients, and dual-string unison beating.
* **Anti-Auto-Repeat**: Windows keyboard repeat is cleanly filtered so held keys sustain naturally rather than repeatedly firing.
* **Damper Fadeout**: Releasing a key smoothly damps the vibrating string over 90ms without audio cutoffs or clicks.
* **Songbook Guide**: Built-in interactive cheat sheet with melodies like *Für Elise*, *Ode to Joy*, and *Twinkle Twinkle Little Star*.

---

## 🔊 Built-in Sound Profiles

| Profile | Category | Character & Acoustic Signature |
| :--- | :---: | :--- |
| **Mechanical Cherry MX Blue** | `Mechanical` | High-frequency tactile snap with crisp actuation click. |
| **Gateron Ink Black** | `Mechanical` | Deep, dampened low-frequency thock favorite among custom keyboard builds. |
| **Vintage 1930s Typewriter** | `Acoustic` | Authentic heavy metal striker hit on paper roller with metallic resonance. |
| **Cyber Deck Terminal Beep** | `Digital` | Futuristic sci-fi HUD synthesizer blip with clean sine decay. |
| **Soft Bubble Pop** | `Soft` | Gentle, soothing fluid bubble pop for quiet shared office spaces. |
| **Retro 8-Bit Arcade Blip** | `Retro` | Chiptune square-wave effect reminiscent of 80s arcade cabinets. |
| **Heavy Tactile Impact** | `Mechanical` | Punchy, resonant bottom-out sound tailored for heavy typists. |

---

## 🎧 Audio Output Routing

KeyFX allows you to isolate typing sounds from your regular audio:

* **Speakers While on Bluetooth**: Play music/calls through your Bluetooth headset while keeping mechanical keyboard clicks routed to your laptop/PC speakers.
* **Bluetooth Audio**: Route typing audio directly to your wireless headphones for personal feedback.
* **Default Windows Device**: Automatically follow your active system audio output.

> Configure this anytime via **Settings (⚙️) → Audio Output Device**.

---

## 🏗️ Architecture

```
KeyFX/
├── src/                          # Frontend (React 19 + TypeScript + Tailwind CSS)
│   ├── components/
│   │   ├── Header.tsx            # Navigation, Live WPM meter & Active toggle
│   │   ├── SoundHero.tsx         # Active sound card & live oscilloscope spectrum
│   │   ├── SoundLibrary.tsx      # Sound library grid, search, and custom audio management
│   │   ├── SoundTuning.tsx       # Studio DSP mixing console & acoustic presets
│   │   ├── KeyVisualizer.tsx     # RGB mechanical keyboard deck & lighting modes
│   │   ├── KeyboardScope.tsx     # Acoustic trigger scope filter matrix
│   │   └── SettingsModal.tsx     # Audio device picker, autostart & tray toggles
│   ├── index.css                 # Glassmorphism, animations & Tailwind design system
│   └── App.tsx                   # Main state container & Tauri IPC communication
└── src-tauri/                    # Native Backend (Rust + Tauri v2)
    ├── src/
    │   ├── audio.rs              # Real-time audio engine, DSP synthesis & device routing
    │   ├── keyboard.rs           # Global Windows WH_KEYBOARD_LL hook & scoping
    │   ├── custom_sounds.rs      # Native file picker (rfd) & custom sound persistence
    │   ├── autostart.rs          # Windows Registry HKCU\...\Run management
    │   ├── settings.rs           # %LOCALAPPDATA%\KeyFX\config.json manager
    │   ├── tray.rs               # Native Windows System Tray icon & events
    │   └── lib.rs                # Tauri command handlers & lifecycle management
    ├── Cargo.toml                # Rust dependencies & release profile (LTO, strip)
    └── tauri.conf.json           # Tauri v2 desktop window & bundle configuration
```

---

## 💻 Setup on Another Device

To set up and run KeyFX on any other Windows machine:

### 1. Prerequisites on the New Device
Ensure the following tools are installed:
* [Node.js (v18+)](https://nodejs.org/)
* [Rust & Cargo](https://rustup.rs/) *(Choose default installation with MSVC toolchain)*
* [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) *(Select "Desktop development with C++")*

### 2. Copy or Clone Project Files
Open the project directory in PowerShell or Terminal:
```bash
cd keyfx
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run KeyFX in Development Mode
```bash
npm run tauri dev
```

---

## 📦 Building Standalone Binary

To produce an optimized, standalone release `.exe` on any computer:

```bash
# 1. Build optimized frontend stylesheets & scripts
npm run build

# 2. Compile native release binary with Link-Time Optimization (LTO)
cargo build --release --manifest-path src-tauri/Cargo.toml

# The standalone single executable will be located at:
# src-tauri/target/release/keyfx.exe
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
