// ES Module environment
import { getInstallId } from './id.js';

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