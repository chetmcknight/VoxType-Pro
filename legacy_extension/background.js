// VoxType: Robust Background Service Worker v1.1.2

chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "toggle-recording") {
        const windowId = tab ? tab.windowId : chrome.windows.WINDOW_ID_CURRENT;

        // Immediate opening is required for user gestures
        chrome.sidePanel.open({ windowId }).catch(() => {
            // Fallback for independent windows
            chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT }).catch(() => { });
        });

        // Broadcast to any listening instance
        setTimeout(() => {
            chrome.runtime.sendMessage({ action: "toggle" }).catch(() => { });
        }, 400);
    }
});

// Configure side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => { });

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "setup.html" });
    }
});
