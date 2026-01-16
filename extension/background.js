// ES Module environment
import './sentry-config.js';
const SENTRY_CONFIG = self.SENTRY_CONFIG || globalThis.SENTRY_CONFIG;

import Sentry from './sentry10.32.1.global.js';
import { getInstallId } from './id.js';

let sentryInited = false;

function shouldInitSentry() {
  return (
    typeof Sentry !== 'undefined' &&
    SENTRY_CONFIG?.dsn &&
    SENTRY_CONFIG.dsn !== 'YOUR_SENTRY_DSN_HERE'
  );
}

// ---- 1) Sync phase: Initialize early (don't await) ----
if (shouldInitSentry()) {
  try {
    Sentry.init({
      dsn: SENTRY_CONFIG.dsn,
      environment: SENTRY_CONFIG.environment,
      release: SENTRY_CONFIG.release,
      tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,

      // ⚠️ Your original comment said "Allow ... content scripts", but this is SW.
      // Keep this option as is for now based on your current needs
      skipBrowserExtensionCheck: false,

      // ✅ In SW, avoid using integrations that bind to history/popstate/load
      integrations: [
        // If you're not doing performance tracking, consider removing BrowserTracing (it's more page-oriented)
        // Sentry.browserTracingIntegration(),
        Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
      ],

      enableLogs: true,

      beforeSend(event, _hint) {
        event.tags = { ...event.tags, ...SENTRY_CONFIG.tags };
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.filter((b) => {
            return !b.message?.includes('clipboard');
          });
        }
        return event;
      },

      initialScope: {
        tags: SENTRY_CONFIG.tags,
      },
    });

    sentryInited = true;
    console.log('[Sentry] Initialized (sync) successfully');
  } catch (e) {
    console.error('[Sentry] Initialization failed:', e);
  }

  // ---- 2) Async phase: Set user/installId later (can be delayed) ----
  (async () => {
    try {
      const installId = await getInstallId();
      if (sentryInited && Sentry) {
        Sentry.setUser({ id: `ext-install:${installId}` });
      }
    } catch (e) {
      console.warn('[Sentry] Failed to set installId user:', e);
    }
  })();
} else {
  console.log('[Sentry] Not initialized - DSN not configured');
}

// ---- 3) Listeners are still registered synchronously ----
chrome.runtime.onMessage.addListener((msg) => {
  if (!sentryInited || !Sentry) return;

  if (msg?.type === 'CONTENT_ERROR') {
    Sentry.captureException(new Error(msg.message), {
      extra: {
        stack: msg.stack,
        url: msg.url,
        where: 'content-script',
      },
      tags: msg.tags,
    });
  } else if (msg?.type === 'CONTENT_MESSAGE') {
    Sentry.logger[msg.level || 'info'](msg.message, {
      extra: {
        url: msg.url,
        where: msg.where || 'content-script',
        ...msg.extra,
      },
      tags: msg.tags,
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