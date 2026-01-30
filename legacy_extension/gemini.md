# Project Map: Voice-to-Text (VTT) App

## Status
- [x] Blueprint Phase (Discovery)
- [x] Link Phase (Data Schema)
- [x] Architect Phase (Core Logic)
- [x] Stylize Phase (Premium UI)
- [x] Trigger Phase (Delivery)

## Blueprint
### 1. North Star
Building a high-performance, aesthetically pleasing voice-to-text application that allows users to quickly dictate notes or text via a keyboard shortcut (Global preference).

### 2. Integrations
- Web Speech API (Core Transcription)
- Clipboard API (Auto-copy functionality)

### 3. Source of Truth
- LocalStorage for session history and user preferences.

### 4. Delivery Payload
- Chrome Extension (to support Global shortcuts) / Web App (PWA).

### 5. Behavioral Rules
- Trigger: `Ctrl + Space` (Toggle recording).
- Auto-Copy: Enabled by default.
- Language: English (US).
- Feedback: Pulsing audio visualizer and glassmorphism UI.

---

## Data Schema (Json)
```json
{
  "settings": {
    "shortcut": "Space",
    "autoCopy": true,
    "theme": "dark"
  },
  "history": [
    {
      "id": "uuid",
      "timestamp": "iso-date",
      "text": "transcribed text content"
    }
  ]
}
```
