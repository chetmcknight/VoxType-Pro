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

  // Sync to Clipboard and Paste at Cursor
  const syncToRAM = (text, silent = true) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      console.log("RAM Updated")
      
      // Try to paste at cursor position using modern approach
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )) {
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
          const start = activeElement.selectionStart
          const end = activeElement.selectionEnd
          const value = activeElement.value
          activeElement.value = value.substring(0, start) + text + value.substring(end)
          activeElement.selectionStart = activeElement.selectionEnd = start + text.length
        } else if (activeElement.contentEditable === 'true') {
          document.execCommand('insertText', false, text)
        }
      }
      
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

  // Track if recording was started by shortcut key (for walkie-talkie mode)
  const [fnKeyRecording, setFnKeyRecording] = useState(false)
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)

  // Keyboard Shortcut Handler (Push-to-Talk style)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Track Ctrl key state
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
        setIsCtrlPressed(true)
        return
      }
      
      // Check for Ctrl+Space
      const isCtrlSpace = isCtrlPressed && (e.code === 'Space' || e.key === 'Space')
      
      if (isCtrlSpace && !isRecording && !fnKeyRecording) {
        e.preventDefault()
        // Start recording when shortcut key is pressed
        if (!recognitionRef.current) return
        setTranscript('')
        setInterimTranscript('')
        setTranslation('')
        transcriptRef.current = ''
        setFnKeyRecording(true)
        try {
          recognitionRef.current.start()
        } catch (error) {
          console.error('Failed to start recognition:', error)
          setMicError(true)
          setFnKeyRecording(false)
        }
      }
    }

    const handleKeyUp = (e) => {
      // Track Ctrl key state
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
        setIsCtrlPressed(false)
        // If we're recording via Ctrl+Space, stop when Ctrl is released
        if (fnKeyRecording && isRecording) {
          setFnKeyRecording(false)
          setIsRecording(false)
          if (recognitionRef.current) {
            recognitionRef.current.stop()
          }
        }
        return
      }
      
      // Check for Space release when using Ctrl+Space
      const isSpaceRelease = fnKeyRecording && (e.code === 'Space' || e.key === 'Space')
      
      if (isSpaceRelease && isRecording && fnKeyRecording) {
        e.preventDefault()
        // Stop recording when shortcut key is released
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
  }, [isRecording, fnKeyRecording, isCtrlPressed])

  // Toggle Recording (for button clicks)
  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
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
          <label className="transcript-label">English</label>
          <div className="transcript-area">
            <div className="transcript-text">
              {transcript || (!isRecording && <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Voice transcription will appear here...</span>)}
              {interimTranscript && <b> {interimTranscript}</b>}
            </div>
          </div>

          <div style={{ height: '20px' }}></div>
          <label className="transcript-label">{getTargetLabel()}</label>
          <div className="transcript-area" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <div className="transcript-text">
              {translation || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Translated text will appear here...</span>}
            </div>
          </div>
        </div>

        <div style={{ height: '40px' }}></div>

        <div className="lang-selector-container">
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
            <option value="en">English</option>
            <option value="eo">Esperanto</option>
            <option value="et">Estonian</option>
            <option value="tl">Filipino</option>
            <option value="fi">Finnish</option>
            <option value="fr">French</option>
            <option value="fy">Frisian</option>
            <option value="gl">Galician</option>
            <option value="ka">Georgian</option>
            <option value="de">German</option>
            <option value="el">Greek</option>
            <option value="gu">Gujarati</option>
            <option value="ht">Haitian Creole</option>
            <option value="ha">Hausa</option>
            <option value="haw">Hawaiian</option>
            <option value="iw">Hebrew</option>
            <option value="hi">Hindi</option>
            <option value="hmn">Hmong</option>
            <option value="hu">Hungarian</option>
            <option value="is">Icelandic</option>
            <option value="ig">Igbo</option>
            <option value="id">Indonesian</option>
            <option value="ga">Irish</option>
            <option value="it">Italian</option>
            <option value="ja">Japanese</option>
            <option value="jw">Javanese</option>
            <option value="kn">Kannada</option>
            <option value="kk">Kazakh</option>
            <option value="km">Khmer</option>
            <option value="ko">Korean</option>
            <option value="ku">Kurdish (Kurmanji)</option>
            <option value="ky">Kyrgyz</option>
            <option value="lo">Lao</option>
            <option value="la">Latin</option>
            <option value="lv">Latvian</option>
            <option value="lt">Lithuanian</option>
            <option value="lb">Luxembourgish</option>
            <option value="mk">Macedonian</option>
            <option value="mg">Malagasy</option>
            <option value="ms">Malay</option>
            <option value="ml">Malayalam</option>
            <option value="mt">Maltese</option>
            <option value="mi">Maori</option>
            <option value="mr">Marathi</option>
            <option value="mn">Mongolian</option>
            <option value="my">Myanmar (Burmese)</option>
            <option value="ne">Nepali</option>
            <option value="no">Norwegian</option>
            <option value="ps">Pashto</option>
            <option value="fa">Persian (Farsi)</option>
            <option value="pl">Polish</option>
            <option value="pt">Portuguese</option>
            <option value="pa">Punjabi</option>
            <option value="ro">Romanian</option>
            <option value="ru">Russian</option>
            <option value="sm">Samoan</option>
            <option value="gd">Scots Gaelic</option>
            <option value="sr">Serbian</option>
            <option value="st">Sesotho</option>
            <option value="sn">Shona</option>
            <option value="sd">Sindhi</option>
            <option value="si">Sinhala</option>
            <option value="sk">Slovak</option>
            <option value="sl">Slovenian</option>
            <option value="so">Somali</option>
            <option value="es">Spanish</option>
            <option value="su">Sundanese</option>
            <option value="sw">Swahili</option>
            <option value="sv">Swedish</option>
            <option value="tg">Tajik</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="th">Thai</option>
            <option value="tr">Turkish</option>
            <option value="uk">Ukrainian</option>
            <option value="ur">Urdu</option>
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

          <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 700 }} onClick={handleCopy}>
            Copy {language === 'en' ? 'English' : 'Translation'}
          </button>
          <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)', width: '100%', marginTop: '1px' }} onClick={handleClear}>
            Clear Everything
          </button>

        <div id="debugLog">
          [System] App Initialized v2.0
        </div>
      </div>
    </div>
  )
}

export default App