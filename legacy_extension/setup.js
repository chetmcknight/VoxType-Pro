function log(msg) {
    const content = document.getElementById('debugContent');
    if (!content) return;
    const div = document.createElement('div');
    div.className = 'debug-line';
    div.innerText = `> ${msg}`;
    content.prepend(div);
    console.log(`VoxType: ${msg}`);
}

log("Setup script loaded");

document.addEventListener('DOMContentLoaded', () => {
    log("DOM content ready");
    const authBtn = document.getElementById('authBtn');
    const setupUI = document.getElementById('setupUI');
    const successUI = document.getElementById('successUI');
    const errorDisplay = document.getElementById('errorDisplay');

    if (!authBtn) {
        log("ERROR: authBtn not found");
        return;
    }

    authBtn.addEventListener('click', async () => {
        log("Button clicked. Starting mic request...");
        errorDisplay.style.display = 'none';

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("mediaDevices API not supported in this context");
            }

            log("Requesting getUserMedia...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            log("Permission GRANTED.");

            // Stop the stream
            stream.getTracks().forEach(t => t.stop());

            // Update UI
            setupUI.style.display = 'none';
            successUI.style.display = 'flex';

            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({ action: "setup-complete" });
            }

        } catch (e) {
            log(`ERROR: ${e.name} - ${e.message}`);
            errorDisplay.style.display = 'block';
            errorDisplay.innerText = `${e.name}: ${e.message}`;

            if (e.name === 'NotAllowedError') {
                log("HINT: Click the lock icon in the URL bar to allow the mic.");
            }
        }
    });
});
