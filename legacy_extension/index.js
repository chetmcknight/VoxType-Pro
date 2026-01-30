// VoxType: Ultra-Productivity Logic v1.2.1

document.addEventListener('DOMContentLoaded', () => {
    function log(msg) {
        const d = document.getElementById('debugLog');
        if (d) d.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
        console.log(`VoxType: ${msg}`);
    }

    log("App initialized");

    const micBtn = document.getElementById('micBtn');
    const statusText = document.querySelector('#status span');
    const transcriptArea = document.getElementById('transcriptArea');
    const translationArea = document.getElementById('translationArea');
    const targetLabel = document.getElementById('targetLabel');
    const micInstruction = document.getElementById('micInstruction');
    const setupArea = document.getElementById('setupArea');
    const permBtn = document.getElementById('permBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const langSelect = document.getElementById('langSelect');
    const toast = document.getElementById('toast');

    let isRecording = false;
    let finalTranscript = '';
    let recognition = null;

    // Show Toast Notification
    function showToast() {
        if (!toast) return;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Helper to sync to clipboard (RAM)
    function syncToRAM(text, silent = true) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            log("RAM Updated");
            if (!silent) showToast();
        }).catch(err => {
            log("RAM Sync Error: " + err);
        });
    }

    // Translation Logic (Pro Engine)
    async function translateText(text, targetLang) {
        if (!text || targetLang === 'en') return text;
        log(`Translating to ${targetLang}...`);
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();
            return data[0].map(x => x[0]).join('');
        } catch (e) {
            log("Translation Error: " + e);
            return text;
        }
    }

    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) throw new Error("STT not supported");

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const text = event.results[i][0].transcript;
                    finalTranscript += (finalTranscript ? ' ' : '') + text;
                    syncToRAM(finalTranscript, true); // Silent sync while talking
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            transcriptArea.innerHTML = finalTranscript + (interim ? ` <b>${interim}</b>` : '');
            transcriptArea.scrollTop = transcriptArea.scrollHeight;
        };

        recognition.onstart = () => {
            log('Recording...');
            isRecording = true;
            micBtn.classList.add('recording');
            micInstruction.classList.add('recording');
            micInstruction.innerText = 'Click to Stop';
            statusText.innerText = 'Listening...';
            setupArea.style.display = 'none';
        };

        recognition.onend = () => {
            log('Stopped');

            if (isRecording) {
                log('Auto-restarting...');
                try { recognition.start(); } catch (e) { log('Restart failed'); }
            } else {
                // Recording manually stopped
                micBtn.classList.remove('recording');
                micInstruction.classList.remove('recording');
                micInstruction.innerText = 'Click to Start';
                statusText.innerText = 'Ready';

                // Final loud sync with notification
                if (finalTranscript) {
                    syncToRAM(finalTranscript, false);
                }
            }
        };

        recognition.onerror = (e) => {
            log(`Error: ${e.error}`);
            isRecording = false;
            if (e.error === 'not-allowed') {
                setupArea.style.display = 'block';
            }
        };
    } catch (e) {
        log('Engine Missing');
    }

    function toggleRecording(source) {
        log(`Trigger: ${source}`);
        if (!recognition) return;

        if (isRecording) {
            isRecording = false;
            recognition.stop();
        } else {
            finalTranscript = '';
            transcriptArea.innerText = '';
            try {
                recognition.start();
            } catch (e) {
                setupArea.style.display = 'block';
            }
        }
    }

    if (micBtn) micBtn.onclick = () => toggleRecording('Button');

    if (permBtn) {
        permBtn.onclick = () => {
            const url = chrome.runtime.getURL('setup.html');
            chrome.tabs.create({ url });
        };
    }

    if (langSelect && copyBtn) {
        langSelect.addEventListener('change', () => {
            let langName = langSelect.options[langSelect.selectedIndex].text;
            // Clean up the name (e.g., "English (Original)" -> "English")
            langName = langName.split(' (')[0];
            copyBtn.innerText = `Copy ${langName}`;
            if (targetLabel) targetLabel.innerText = langSelect.value === 'en' ? 'Translation' : langName;

            // Immediate translation preview if text exists
            if (finalTranscript && langSelect.value !== 'en') {
                translateText(finalTranscript, langSelect.value).then(text => {
                    if (translationArea) translationArea.innerText = text;
                });
            } else if (langSelect.value === 'en') {
                if (translationArea) translationArea.innerHTML = '<span style="opacity: 0.3; font-style: italic;">Translated text will appear here...</span>';
            }
        });
    }

    if (copyBtn) {
        copyBtn.onclick = async () => {
            if (finalTranscript) {
                const targetLang = langSelect ? langSelect.value : 'en';
                const textToCopy = await translateText(finalTranscript, targetLang);
                if (translationArea) translationArea.innerText = textToCopy;
                syncToRAM(textToCopy, false);
            } else {
                log("Nothing to copy");
            }
        };
    }

    if (clearBtn) {
        clearBtn.onclick = () => {
            finalTranscript = '';
            transcriptArea.innerText = '';
            if (translationArea) translationArea.innerHTML = '<span style="opacity: 0.3; font-style: italic;">Translated text will appear here...</span>';
            log('RAM Cleared');
        };
    }

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
            if (req.action === 'toggle') {
                toggleRecording('Shortcut');
                sendResponse({ ok: true });
            } else if (req.action === 'setup-complete') {
                setupArea.style.display = 'none';
                log('Synced!');
                sendResponse({ ok: true });
            }
            return true;
        });
    }
});
