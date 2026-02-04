import { useState, useEffect, useRef } from 'react'
import './index.css'

// Development logger
const isDev = import.meta.env.DEV
const log = (...args) => isDev && console.log(...args)

function App() {
  // Check speech recognition support
  const speechRecognitionSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)
  
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [translation, setTranslation] = useState('')
  const [language, setLanguage] = useState('en')
  const [status, setStatus] = useState(speechRecognitionSupported ? 'Ready' : 'Speech recognition not supported')
  const [showToast, setShowToast] = useState(false)
  const [micError, setMicError] = useState(false)
  const [fnKeyRecording, setFnKeyRecording] = useState(false)

  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  // Toast Helper
  const triggerToast = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const translateText = async (text, targetLang) => {
    if (targetLang === 'en') return text
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`)
      const data = await res.json()
      return data[0].map(item => item[0]).join('')
    } catch (error) {
      console.error('Translation failed:', error)
      return text
    }
  }



  const autoPasteOnRelease = (text) => {
    if (!text) return
    
    // Copy to clipboard first
    navigator.clipboard.writeText(text).then(() => {
      log("Auto-paste triggered for external apps")
      
      // Try to paste into active element
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true')) {
        activeElement.focus()
        
        // Try different paste methods
        try {
          // Method 1: execCommand
          document.execCommand('paste')
        } catch (execError) {
          log("execCommand paste failed:", execError)
          try {
            // Method 2: Dispatch paste event
            const pasteEvent = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              dataType: 'text/plain',
              data: text
            })
            activeElement.dispatchEvent(pasteEvent)
          } catch (pasteError) {
            log("Paste methods failed:", pasteError)
          }
        }
      }
    }).catch(err => {
      console.error("Auto-paste error: " + err)
    })
  }

  // Keyboard Shortcut Handler (Push-to-Talk style)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Start recording when both Ctrl and Space are pressed
      const isCtrlSpace = e.ctrlKey && (e.code === 'Space' || e.key === 'Space')
      
      if (isCtrlSpace && !isRecording && !fnKeyRecording) {
        e.preventDefault()
        log('Starting Ctrl+Space recording')
        setFnKeyRecording(true)
        setIsRecording(true)
        setTranscript('')
        setInterimTranscript('')
        setTranslation('')
        transcriptRef.current = ''
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start()
          } else {
            console.error('Speech recognition not initialized')
          }
        } catch (error) {
          console.error('Failed to start recognition:', error)
          setMicError(true)
        }
      }
    }

    const handleKeyUp = (e) => {
      // Stop recording when EITHER Ctrl OR Space is released
      const isCtrlRelease = (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control')
      const isSpaceRelease = (e.code === 'Space' || e.key === 'Space')
      
      if (fnKeyRecording && isRecording && (isCtrlRelease || isSpaceRelease)) {
        e.preventDefault()
        log('Stopping Ctrl+Space recording')
        
        const textToPaste = transcriptRef.current
        if (textToPaste) {
          log('Auto-pasting text:', textToPaste)
          autoPasteOnRelease(textToPaste)
        }
        
        setFnKeyRecording(false)
        setIsRecording(false)
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isRecording, fnKeyRecording])

  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Failed to start recognition:', error)
        setMicError(true)
      }
    }
  }

  const handleCopy = async () => {
    const textToCopy = language === 'en' ? transcript : translation
    if (!textToCopy) return
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      triggerToast()
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleClear = () => {
    setTranscript('')
    setTranslation('')
    setInterimTranscript('')
    transcriptRef.current = ''
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
    return sel ? sel.text.split('(')[0] : 'Translation'
  }

  // Speech Recognition Setup
  useEffect(() => {
    if (!speechRecognitionSupported) {
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      setStatus('Listening...')
      setMicError(false)
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        const newTranscript = transcriptRef.current + finalTranscript
        setTranscript(newTranscript)
        transcriptRef.current = newTranscript
        
        if (language !== 'en') {
          translateText(newTranscript, language).then(setTranslation)
        }
      }
      setInterimTranscript(interimTranscript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setMicError(true)
        setStatus('Microphone access denied')
      } else {
        setStatus(`Error: ${event.error}`)
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      setStatus('Ready')
    }

    recognitionRef.current = recognition
  }, [language, speechRecognitionSupported])

  return (
    <div className="container">
      <div className="glass-panel">
        <div className="app-headline">
          <span className="voxtype-text">VoxType</span> <span className="pro-gradient">Pro</span>
        </div>
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
            {isRecording 
              ? (fnKeyRecording ? `Release Ctrl+Space to stop...` : `Click to stop or release Ctrl+Space`) 
              : `Click to start or hold Ctrl+Space to talk`
            }
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
            <div className="toast-message">Ready to Paste</div>
          </div>

          <label className="transcript-label">English</label>
          <div className="transcript-area">
            <div className="transcript-text">
              {transcript || (!isRecording && <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Voice transcription will appear here...</span>)}
              {interimTranscript && <b> {interimTranscript}</b>}
            </div>
          </div>

          <label className="transcript-label">{getTargetLabel()}</label>
          <div className="transcript-area" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <div className="transcript-text">
              {translation || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Translated text will appear here...</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '25px', width: '100%' }}>
            <div className="lang-selector-container" style={{ margin: 0 }}>
              <select className="lang-select" value={language} onChange={handleLangChange}>
            <option value="en">English (Original)</option>
            <option value="af">Afrikaans</option>
            <option value="sq">Albanian</option>
            <option value="am">Amharic</option>
            <option value="ar">Arabic</option>
            <option value="hy">Armenian</option>
            <option value="az">Azerbaijani</option>
            <option value="eu">Basque</option>
            <option value="be">Belarusian</option>
            <option value="bn">Bengali</option>
            <option value="bs">Bosnian</option>
            <option value="bg">Bulgarian</option>
            <option value="ca">Catalan</option>
            <option value="ceb">Cebuano</option>
            <option value="ny">Chichewa</option>
            <option value="zh">Chinese (Simplified)</option>
            <option value="zh-TW">Chinese (Traditional)</option>
            <option value="co">Corsican</option>
            <option value="hr">Croatian</option>
            <option value="cs">Czech</option>
            <option value="da">Danish</option>
            <option value="nl">Dutch</option>
            <option value="eo">Esperanto</option>
            <option value="et">Estonian</option>
            <option value="tl">Filipino</option>
            <option value="fa">Persian (Farsi)</option>
            <option value="fi">Finnish</option>
            <option value="fr">French</option>
            <option value="fy">Frisian</option>
            <option value="gl">Galician</option>
            <option value="ka">Georgian</option>
            <option value="de">German</option>
            <option value="el">Greek</option>
            <option value="gu">Gujarati</option>
            <option value="ha">Haitian Creole</option>
            <option value="he">Hebrew</option>
            <option value="hi">Hindi</option>
            <option value="hu">Hungarian</option>
            <option value="hy">Armenian</option>
            <option value="is">Icelandic</option>
            <option value="id">Indonesian</option>
            <option value="ig">Igbo</option>
            <option value="it">Italian</option>
            <option value="ja">Japanese</option>
            <option value="jw">Javanese</option>
            <option value="kn">Kannada</option>
            <option value="kk">Kazakh</option>
            <option value="ko">Korean</option>
            <option value="ku">Kurdish (Kurmanji)</option>
            <option value="ky">Kyrgyz</option>
            <option value="lo">Lao</option>
            <option value="lt">Lithuanian</option>
            <option value="lv">Latvian</option>
            <option value="lb">Luxembourgish</option>
            <option value="mk">Macedonian</option>
            <option value="ml">Malayalam</option>
            <option value="mr">Marathi</option>
            <option value="mn">Mongolian</option>
            <option value="my">Myanmar (Burmese)</option>
            <option value="ne">Nepali</option>
            <option value="no">Norwegian</option>
            <option value="ps">Pashto</option>
            <option value="pa">Punjabi</option>
            <option value="pl">Polish</option>
            <option value="pt">Portuguese</option>
            <option value="ro">Romanian</option>
            <option value="ru">Russian</option>
            <option value="sm">Samoan</option>
            <option value="sg">Sinhala</option>
            <option value="si">Sinhala</option>
            <option value="sk">Slovak</option>
            <option value="sl">Slovenian</option>
            <option value="so">Somali</option>
            <option value="es">Spanish</option>
            <option value="sv">Swedish</option>
            <option value="tg">Tajik</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="th">Thai</option>
            <option value="tr">Turkish</option>
            <option value="uk">Ukrainian</option>
            <option value="ug">Uyghur</option>
            <option value="uz">Uzbek</option>
            <option value="vi">Vietnamese</option>
            <option value="cy">Welsh</option>
            <option value="xh">Xhosa</option>
            <option value="yi">Yiddish</option>
            <option value="yo">Yoruba</option>
            <option value="zu">Zulu</option>
            </select>
            </div>

            <button className="btn btn-primary" onClick={handleCopy}>
              Copy {language === 'en' ? 'English' : 'Translation'}
            </button>
            
            <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }} onClick={handleClear}>
              Clear Everything
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App