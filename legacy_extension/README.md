# VoxType | Global Voice-to-Text Chrome Extension

<div align="center">

![VoxType Icon](icon128.png)

**Premium voice-to-text transcription with global keyboard shortcuts**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/voxtype)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

</div>

---

## ✨ Features

- 🎤 **Global Keyboard Shortcut**: Use `Cmd + Shift + L` (Mac) or `Ctrl + Shift + L` (Windows/Linux) from anywhere
- 📋 **Auto-Copy to Clipboard**: Finalized text segments are automatically copied
- 🎨 **Premium Glassmorphic UI**: Beautiful dark mode with smooth animations
- 🔴 **Live Visual Feedback**: Pulsing indicator and real-time interim transcription
- ⚡ **Instant Transcription**: Powered by Web Speech API for fast, accurate results
- 🔒 **Privacy First**: All processing happens locally in your browser

---

## 🚀 Installation

### Option 1: Load as Unpacked Extension (Developer Mode)

1. **Download or Clone** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right corner)
4. Click **Load unpacked**
5. Select the `VTT-chet` folder
6. The VoxType extension is now installed! 🎉

### Option 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store soon.

---

## ⚙️ Setup & Configuration

### 1. Grant Microphone Permissions

On first use, you'll need to grant microphone access:

1. Click the VoxType extension icon in your toolbar
2. Click **"Open Setup Page"** button
3. Click **"Allow Microphone Access"** and approve the browser prompt
4. You're all set! Close the setup page.

### 2. Configure Global Keyboard Shortcut

To use VoxType from anywhere on your computer (not just in Chrome):

1. Navigate to `chrome://extensions/shortcuts`
2. Find **"VoxType - Global Voice to Text"**
3. Click the pencil icon next to "Start/Stop Recording"
4. Set your preferred shortcut (default: `Cmd + Shift + L`)
5. **Important**: Change the dropdown from **"In Chrome"** to **"Global"**

Now you can activate VoxType from any application! 🌍

---

## 📖 How to Use

### Basic Usage

1. **Click the extension icon** to open the VoxType side panel
2. **Click the microphone button** or use your keyboard shortcut
3. **Start speaking** - your words appear in real-time
4. **Click again** to stop recording
5. **Copy** the transcribed text or let auto-copy do it for you!

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + L` | Toggle recording on/off |

### Tips for Best Results

- 🎯 Speak clearly and at a normal pace
- 🔇 Use in a quiet environment for better accuracy
- 🌐 Requires internet connection (uses Google's Speech API)
- 🗣️ Currently supports English (US) - more languages coming soon

---

## 🛠️ Technical Details

### Architecture

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Speech Engine**: Web Speech API (`webkitSpeechRecognition`)
- **UI Framework**: Vanilla HTML5/CSS3 with Glassmorphism
- **Side Panel API**: Chrome's modern side panel interface
- **Background Worker**: Service worker for global shortcut handling

### File Structure

```
VTT-chet/
├── manifest.json       # Extension configuration
├── background.js       # Service worker for shortcuts
├── index.html          # Main UI (side panel)
├── setup.html          # Microphone permission helper
├── icon16.png          # Extension icon (16x16)
├── icon48.png          # Extension icon (48x48)
├── icon128.png         # Extension icon (128x128)
└── README.md           # This file
```

### Permissions Used

- `storage` - Save user preferences
- `clipboardWrite` - Auto-copy transcribed text
- `sidePanel` - Modern side panel interface

---

## 🐛 Troubleshooting

### Microphone not working?

1. Check browser permissions: `chrome://settings/content/microphone`
2. Ensure VoxType is in the "Allowed" list
3. Try the setup page again: Click extension icon → "Open Setup Page"

### Keyboard shortcut not working?

1. Verify it's set to **"Global"** in `chrome://extensions/shortcuts`
2. Make sure no other app is using the same shortcut
3. Try a different key combination

### No transcription appearing?

1. Check your internet connection (required for Speech API)
2. Ensure microphone is not muted
3. Check browser console for errors (F12 → Console tab)

---

## 🔄 Updates & Changelog

### Version 1.0.0 (Current)
- ✅ Initial release
- ✅ Global keyboard shortcut support
- ✅ Auto-copy to clipboard
- ✅ Premium glassmorphic UI
- ✅ Real-time transcription with interim results

---

## 📝 License

MIT License - feel free to use and modify!

---

## 👨‍💻 Developer

Created by **Chet McKnight**

---

## 🙏 Acknowledgments

- Built with Chrome Extension Manifest V3
- Powered by Web Speech API
- Icons and UI designed with modern web standards

---

<div align="center">

**Enjoy VoxType? Give it a ⭐ on GitHub!**

Made with ❤️ and ☕

</div>
