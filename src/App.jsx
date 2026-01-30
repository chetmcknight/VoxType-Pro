import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [translation, setTranslation] = useState('')
  const [language, setLanguage] = useState('en')
  const [status, setStatus] = useState('Ready')
  const [showToast, setShowToast] = useState(false)
  const [micError, setMicError] = useState(false)

  const recognitionRef = useRef(null)
  const transcriptRef = useRef('') // To keep track for event handlers without closure issues

  // Toast Helper
  const triggerToast = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  // Translation Logic
  const translateText = async (text, targetLang) => {
    if (!text || targetLang === 'en') return text
    console.log(`Translating to ${targetLang}...`)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      const response = await fetch(url)
      const data = await response.json()
      return data[0].map(x => x[0]).join('')
    } catch (e) {
      console.error("Translation Error: " + e)
      return text
    }
  }

  // Sync to Clipboard
  const syncToRAM = (text, silent = true) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      console.log("RAM Updated")
      if (!silent) triggerToast()
    }).catch(err => {
      console.error("RAM Sync Error: " + err)
    })
  }

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setStatus('STT Not Supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let interim = ''
      let final = transcriptRef.current // Start with existing final

      // We need to parse slightly differently for continuous
      // Actually, standard behavior is that event.results accumulates. 
      // But we need to be careful not to duplicate.
      // Often with continuous, we just iterate new results.
      // Let's use the standard loop from the original code which reconstructs.

      let newFinalChunk = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinalChunk += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }

      if (newFinalChunk) {
        transcriptRef.current += (transcriptRef.current ? ' ' : '') + newFinalChunk
        syncToRAM(transcriptRef.current, true)
        setTranscript(transcriptRef.current)

        // Trigger translation if needed
        if (language !== 'en') {
          translateText(transcriptRef.current, language).then(setTranslation)
        }
      }

      setInterimTranscript(interim)
    }

    recognition.onstart = () => {
      setIsRecording(true)
      setStatus('Listening...')
      setMicError(false)
    }

    recognition.onend = () => {
      // Auto-restart if we didn't manually stop (conceptually), 
      // but in React state, we check isRecording. 
      // Wait, if we use a Ref for "intended recording state" it's cleaner.
      // For now, simple logic:
      console.log('Recognition ended')
      setIsRecording(false)
      setStatus('Ready')

      // If we have content, final sync
      if (transcriptRef.current) {
        syncToRAM(transcriptRef.current, false)
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech Error", event.error)
      if (event.error === 'not-allowed') {
        setMicError(true)
        setStatus('Mic Blocked')
      }
      setIsRecording(false)
    }

    recognitionRef.current = recognition
  }, [language]) // Re-init if lang changes? No, lang is for translation.

  // Toggle Recording
  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
      // ensure we update state immediately to avoid UI lag
      setIsRecording(false)
    } else {
      setTranscript('')
      setInterimTranscript('')
      setTranslation('')
      transcriptRef.current = ''
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error(e)
        setMicError(true)
      }
    }
  }

  // Keyboard Shortcut Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'Digit9') {
        e.preventDefault()
        toggleRecording()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording]) // Depend on isRecording so toggle works correctly


  // Handlers
  const handleCopy = async () => {
    const text = language === 'en' ? transcript : translation
    if (!text) return
    syncToRAM(text, false)
  }

  const handleClear = () => {
    setTranscript('')
    setInterimTranscript('')
    setTranslation('')
    transcriptRef.current = ''
    // setStatus('Ready')
  }

  const handleLangChange = async (e) => {
    const newLang = e.target.value
    setLanguage(newLang)
    if (transcript && newLang !== 'en') {
      const t = await translateText(transcript, newLang)
      setTranslation(t)
    } else {
      setTranslation('')
    }
  }

  const getTargetLabel = () => {
    if (language === 'en') return 'Translation'
    const sel = document.querySelector(`option[value="${language}"]`)
    return sel ? sel.text.split(' (')[0] : 'Translation'
  }

  return (
    <div className="container">
      <div className="header">
        <h1>VoxType <span className="pro-gradient">Pro</span></h1>
      </div>

      <div className="glass-panel">
        <div className="status-badge" id="status">
          <div className={`dot ${isRecording ? 'recording' : ''}`}></div>
          <span>{status}</span>
        </div>

        <div className="mic-container">
          <button
            className={`mic-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            aria-label="Toggle Microphone"
          >
            <img src="/icon128.png" className="mic-icon-img" alt="VoxType Icon" />
          </button>
          <div className={`mic-instruction ${isRecording ? 'recording' : ''}`}>
            {isRecording ? 'Click to Stop' : 'Click to Start Recording'}
          </div>
        </div>

        {micError && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Microphone Access Denied</p>
            <p style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>Please allow microphone access in your browser settings.</p>
          </div>
        )}

        <div className="transcript-container">
          <div className={`toast ${showToast ? 'show' : ''}`}>
            <div className="toast-icon">✓</div>
            <span>Ready to Paste</span>
          </div>

          <label className="transcript-label">English</label>
          <div className="transcript-area">
            {transcript || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Voice transcription will appear here...</span>}
            {interimTranscript && <b> {interimTranscript}</b>}
          </div>

          <label className="transcript-label">{getTargetLabel()}</label>
          <div className="transcript-area" style={{ borderColor: 'rgba(99, 102, 241, 0.3)', minHeight: '80px', maxHeight: '80px' }}>
            {translation || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Translated text will appear here...</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
            ⚡ Zero-Click Sync Active
          </div>

          <div className="lang-selector-container">
            <select className="lang-select" value={language} onChange={handleLangChange}>
              <option value="en">English (Original)</option>
              <option value="ar">Arabic</option>
              <option value="zh">Chinese</option>
              <option value="fa">Farsi</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
              <option value="it">Italian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="pt">Portuguese</option>
              <option value="ro">Romanian</option>
              <option value="ru">Russian</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '5px', fontWeight: 700 }} onClick={handleCopy}>
            Copy {language === 'en' ? 'English' : 'Translation'}
          </button>
          <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)', width: '100%' }} onClick={handleClear}>
            Clear Everything
          </button>
        </div>

        <div id="debugLog">
          [System] App Initialized v2.0
        </div>

      </div>
    </div>
  )
}

export default App
