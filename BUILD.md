# 🔧 Build Instructions - Juna Voice Interface

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development
npm run dev

# 3. Create production build
npm run build
```

## 📋 Prerequisites

### **Required Software**

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Rust** (latest stable) - [Installation](https://rustup.rs/)
- **Tauri CLI** - Installed automatically

### **Platform-specific Requirements**

#### **Windows**

```powershell
# Microsoft C++ Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools
# oder Visual Studio mit C++ Workload
```

#### **macOS**

```bash
# Xcode Command Line Tools
xcode-select --install
```

#### **Linux (Ubuntu/Debian)**

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libasound2-dev \
    libpulse-dev
```

## 🛠️ Build Commands

### **Development**

```bash
npm run dev          # Development server with hot-reload
npm run start        # Alias for dev
npm run serve        # Alias for dev
```

### **Production Builds**

```bash
npm run build        # Optimized production build
npm run build:debug  # Debug build for troubleshooting
npm run bundle       # Create all installer formats
```

### **Utility Commands**

```bash
npm run clean        # Clear build cache
npm run info         # Show system information
npm run icon         # Generate app icons
```

## 📦 Build Outputs

### **Development**

- App runs on `http://localhost:1420`
- Hot-reload for frontend changes
- Rust backend is compiled automatically

### **Production Builds**

Builds are created in `src-tauri/target/release/`:

#### **Windows**

- `voice-recorder-pro.exe` - Portable Executable
- `voice-recorder-pro_1.0.0_x64_en-US.msi` - Windows Installer

#### **macOS**

- `voice-recorder-pro.app` - macOS Application Bundle
- `voice-recorder-pro_1.0.0_x64.dmg` - macOS Disk Image

#### **Linux**

- `voice-recorder-pro` - Linux Executable
- `voice-recorder-pro_1.0.0_amd64.deb` - Debian Package
- `voice-recorder-pro_1.0.0_amd64.AppImage` - Universal Linux App

## ⚡ Performance Optimizations

### **Reduce Build Time**

```bash
# Parallel Compilation
export CARGO_BUILD_JOBS=8

# Incremental Compilation
export CARGO_INCREMENTAL=1

# Link-Time Optimization
export CARGO_PROFILE_RELEASE_LTO=true
```

### **Optimize Bundle Size**

```toml
# In src-tauri/Cargo.toml
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"      # Optimize for size
strip = true         # Remove debug symbols
```

## 🔍 Troubleshooting

### **Common Problems**

#### **"command not found: tauri"**

```bash
npm install -g @tauri-apps/cli@next
# oder
cargo install tauri-cli
```

#### **"WebKit2GTK not found" (Linux)**

```bash
sudo apt install libwebkit2gtk-4.0-dev
```

#### **"MSBuild not found" (Windows)**

```powershell
# Open Visual Studio Installer
# Install "Desktop development with C++"
```

#### **"xcode-select error" (macOS)**

```bash
sudo xcode-select --reset
xcode-select --install
```

### **Debug Tips**

#### **Frontend Debugging**

- **Chrome DevTools**: `Ctrl+Shift+I`
- **Console Logs**: Use `console.log()`
- **Network Tab**: Monitor API calls

#### **Backend Debugging**

```bash
# Debug-Build mit Logs
RUST_LOG=debug npm run build:debug

# Tauri-spezifische Logs
TAURI_DEBUG=1 npm run dev
```

#### **Audio Debugging**

```javascript
// In Browser Console
navigator.mediaDevices
  .enumerateDevices()
  .then((devices) => console.log(devices));

// Check microphone permissions
navigator.permissions
  .query({ name: "microphone" })
  .then((result) => console.log(result.state));
```

## 🚀 Distribution

### **Code Signing (Production)**

#### **macOS**

```bash
# Developer Certificate erforderlich
codesign --force --deep --sign "Developer ID Application: Your Name" voice-recorder-pro.app
```

#### **Windows**

```bash
# Code Signing Certificate erforderlich
signtool sign /f certificate.p12 /p password voice-recorder-pro.exe
```

### **Auto-Updates konfigurieren**

```json
// In tauri.conf.json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://releases.yourapp.com/{{target}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "your-public-key"
  }
}
```

## 📊 Build Metrics

### **Typical Build Times**

- **Clean Build**: 2-5 minutes
- **Incremental**: 10-30 seconds
- **Frontend-only**: < 5 seconds

### **Bundle Sizes**

- **Windows**: ~15-20 MB
- **macOS**: ~18-25 MB
- **Linux**: ~20-30 MB

## 🔧 CI/CD Integration

### **GitHub Actions Example**

```yaml
name: Build and Release
on:
  push:
    tags: ["v*"]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: npm install

      - name: Build app
        run: npm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: app-${{ matrix.os }}
          path: src-tauri/target/release/bundle/
```

---

**Happy Building! 🎉**
