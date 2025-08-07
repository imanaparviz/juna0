# 🎤 Voice Recorder Pro

A **high-performance, modern Tauri application** for professional audio recording with elegant user interface and optimized performance.

## ✨ Features

### 🔥 **High-Performance Audio Recording**

- **Optimized MediaRecorder API** with 128kbps bitrate
- **Automatic codec detection** (WebM/Opus, MP4, OGG, WAV)
- **Echo-cancellation & noise suppression** for crystal-clear recordings
- **Stereo recording** with 44.1kHz sample rate

### 🎨 **Elegant User Interface**

- **GPU-accelerated animations** for smooth performance
- **Floating microphone button** with interactive hover effects
- **Animated sound waves** during recording
- **Dark theme** with modern gradients and shadows
- **Responsive design** for various screen sizes

### ⚡ **Performance Optimizations**

- **Hardware-accelerated CSS** (`will-change`, `transform3d`)
- **Optimized event handlers** and DOM caching
- **Minimal bundle size** through Tauri's Rust backend
- **Memory-efficient** audio processing

### 🎹 **Keyboard Shortcuts**

- **Spacebar**: Start/stop recording
- **Enter**: Play recording
- **Ctrl+S**: Save recording
- **Delete**: Delete recording

## 🚀 Installation & Setup

### Prerequisites

Install the following tools:

```bash
# Node.js (v18+)
https://nodejs.org/

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs/ | sh

# Tauri CLI
npm install --global @tauri-apps/cli@next
```

### Start Project

```bash
# Install dependencies
npm install

# Start development server
npm run tauri dev

# Create production build
npm run tauri build
```

## 🎯 Usage

### 1. **Start Recording**

Click the large microphone button in the center or press **Spacebar**.

### 2. **Recording Status**

- **Pulsing red button** = Recording in progress
- **Animated sound waves** around the button
- **Live timer** shows recording duration

### 3. **Stop Recording**

Click the microphone button again or press **Spacebar**.

### 4. **Playback & Management**

- **Play**: Listen to recording immediately
- **Save**: Download file with timestamp
- **Delete**: Remove recording from memory

## 🔧 Technical Details

### **Frontend Stack**

- **HTML5** with semantic elements
- **Modern CSS3** with custom properties and animations
- **Vanilla JavaScript ES6+** with class-based architecture
- **MediaRecorder API** for audio recording

### **Backend Stack**

- **Rust** with Tauri Framework
- **WebView2** for cross-platform compatibility
- **Native performance** through Rust backend

### **Audio Specifications**

```javascript
{
  sampleRate: 44100,     // CD quality
  channelCount: 2,       // Stereo
  bitRate: 128000,       // 128kbps
  format: 'WebM/Opus'    // Modern compression
}
```

### **Supported File Formats**

- **WebM** (Opus Codec) - Recommended
- **MP4** (AAC Codec)
- **OGG** (Opus Codec)
- **WAV** (Uncompressed)

## 🎨 UI/UX Features

### **Microphone Button**

- **120px diameter** for optimal touch targets
- **Gradient background** with smooth transitions
- **Hover effects** with scale & shadow
- **Recording state** with pulse animation

### **Sound Waves Animation**

- **4 concentric circles** with staggered delays
- **GPU-optimized transformations**
- **Smooth fade-in/out** animations

### **Notification System**

- **Toast notifications** for status updates
- **Auto-hide** after 3 seconds
- **Color-coded** messages (Success, Warning, Error)

## 📱 Platform Support

### **Desktop Platforms**

- ✅ **Windows** (Windows 10+)
- ✅ **macOS** (10.13+)
- ✅ **Linux** (Ubuntu 18.04+)

### **Browser Compatibility**

- ✅ **Chrome** 88+
- ✅ **Firefox** 85+
- ✅ **Safari** 14+
- ✅ **Edge** 88+

## 🛠️ Configuration

### **Adjust Audio Settings**

Edit `src/main.js`:

```javascript
this.config = {
  audioConstraints: {
    audio: {
      echoCancellation: true, // Suppress echo
      noiseSuppression: true, // Reduce noise
      autoGainControl: true, // Automatic volume
      sampleRate: 44100, // Sample rate
      channelCount: 2, // Stereo/Mono
    },
  },
};
```

### **UI Customizations**

Edit `src/styles.css`:

```css
:root {
  --color-accent: #ff4757; /* Main accent color */
  --mic-button-size: 120px; /* Button size */
  --animation-duration: 250ms; /* Animation speed */
}
```

## 🔒 Security & Privacy

- **Local processing**: All recordings stay on your device
- **No cloud uploads**: Your data never leaves your computer
- **Microphone permission**: App explicitly asks for permission
- **Memory-safe**: Rust backend prevents buffer overflows

## 🚀 Performance Tips

### **For best audio quality:**

- Use an **external microphone**
- Record in a **quiet environment**
- Install **browser updates**
- Enable **hardware acceleration**

### **For optimal performance:**

- **Chrome/Edge** for best WebM support
- **16GB+ RAM** for longer recordings
- **SSD storage** for fast file operations

## 📄 License

**MIT License** - Free for commercial and private projects.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or pull requests.

---

**Made with ❤️ using Tauri, Rust & Modern Web Technologies**
