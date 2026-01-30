// getInstallId 和 resetInstallId 直接内联，兼容非模块环境
async function getInstallId() {
    const key = 'install_id_v1';
    const { [key]: existing } = await chrome.storage.local.get(key);
    if (existing) return existing;

    // 128-bit random
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

    await chrome.storage.local.set({ [key]: id });
    return id;
}

async function resetInstallId() {
    await chrome.storage.local.remove('install_id_v1');
}

// ---- 1) Listeners ----
// No Sentry listeners needed anymore.

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // first install
        const manifest = chrome.runtime.getManifest();
        chrome.storage.sync.set({ extensionVersion: manifest.version });
    } else if (details.reason === 'update') {
        // perform version upgrade tasks
        const manifest = chrome.runtime.getManifest();
        const newVersion = manifest.version;
        
        chrome.storage.sync.get(['extensionVersion'], (result) => {
            const oldVersion = result.extensionVersion;
            
            // version change, clear/update custom selectors
            if (oldVersion !== newVersion) {
                // clear custom selectors on version change
                chrome.storage.sync.remove(['customSelectors'], () => {
                    chrome.storage.sync.set({ extensionVersion: newVersion });
                    console.log(`[Markdown Copy] Updated from ${oldVersion} to ${newVersion}, reset config`);
                });
            }
        });
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // first install
        const manifest = chrome.runtime.getManifest();
        chrome.storage.sync.set({ extensionVersion: manifest.version });
    } else if (details.reason === 'update') {
        // perform version upgrade tasks
        const manifest = chrome.runtime.getManifest();
        const newVersion = manifest.version;
        
        chrome.storage.sync.get(['extensionVersion'], (result) => {
            const oldVersion = result.extensionVersion;
            
            // version change, clear/update custom selectors
            if (oldVersion !== newVersion) {
                // clear custom selectors on version change
                chrome.storage.sync.remove(['customSelectors'], () => {
                    chrome.storage.sync.set({ extensionVersion: newVersion });
                    console.log(`[Markdown Copy] Updated from ${oldVersion} to ${newVersion}, reset config`);
                });
            }
        });
    }
});