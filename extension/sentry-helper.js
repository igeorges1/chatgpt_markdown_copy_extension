// Helper function to safely capture Sentry events
function normalizeUnknownError(err) {
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message || String(err),
            stack: err.stack,
        };
    }

    // Some libraries throw strings/objects
    if (typeof err === 'string') {
        return {
            name: 'Error',
            message: err,
            stack: undefined
        };
    }

    try {
        return {
            name: (err && err.name) ? String(err.name) : 'NonError',
            message: (err && err.message) ? String(err.message) : JSON.stringify(err),
            stack: err && err.stack ? String(err.stack) : undefined,
        };
    } catch {
        return {
            name: 'NonError',
            message: String(err),
            stack: undefined
        };
    }
}

/**
 * @param {unknown} err
 * @param {{
 *   where?: string,
 *   tags?: Record<string, string>,
 *   extra?: Record<string, any>
 * }} opts
 */
window.captureSentryException = function(err, opts = {}) {
    const n = normalizeUnknownError(err);

    const payload = {
        type: 'CONTENT_ERROR',
        name: n.name,
        message: n.message,
        stack: n.stack,
        url: location.href,
        where: opts.where || 'content-script',
        tags: opts.tags || {},
        extra: opts.extra || {},
        ts: Date.now(),
    };

    try {
        chrome.runtime.sendMessage(payload, () => {
            // In MV3, if the service worker is sleeping/not started, sometimes runtime.lastError is reported
            // Do nothing here, just ensure no exception is thrown
            void chrome.runtime.lastError;
        });
    } catch {
        // ignore
    }
};

window.captureSentryMessage = function(message, level = 'info', opts = {}) {
    const payload = {
        type: 'CONTENT_MESSAGE',
        level: level,
        name: null,
        message: message,
        stack: null,
        url: location.href,
        where: opts.where || 'content-script',
        tags: opts.tags || {},
        extra: opts.extra || {},
        ts: Date.now(),
    };

    try {
        chrome.runtime.sendMessage(payload, () => {
            // In MV3, if the service worker is sleeping/not started, sometimes runtime.lastError is reported
            // Do nothing here, just ensure no exception is thrown
            void chrome.runtime.lastError;
        });
    } catch (sentryError) {
        console.error('[Sentry] Failed to capture message:', sentryError);
    }
};

// Optional: Global fallback (doesn't guarantee catching everything, but forwards what it catches)
window.installGlobalErrorForwarding = function() {
    window.addEventListener('error', (ev) => {
        window.captureSentryException(ev.error || ev.message, {
            where: 'window.onerror',
            extra: {
                filename: ev.filename,
                lineno: ev.lineno,
                colno: ev.colno
            },
        });
    });

    window.addEventListener('unhandledrejection', (ev) => {
        window.captureSentryException(ev.reason, {
            where: 'unhandledrejection'
        });
    });
};

window.logError = function(error, ...args) {
    console.error(error, ...args);
    if (error instanceof Error) {
        window.captureSentryException(error, {
            extra: {
                args
            }
        });
    } else {
        let message;
        try {
            message = typeof error === 'string' ? error : JSON.stringify(error);
        } catch {
            message = String(error);
        }
        window.captureSentryMessage(message, 'error', {
            extra: {
                args
            }
        });
    }
};

window.logInfo = function(message, ...args) {
    console.log(message, ...args);
    const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
    window.captureSentryMessage(msgStr, 'info', {
        extra: {
            args
        }
    });
};

window.logDebug = function(message, ...args) {
    console.debug(message, ...args);
    const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
    window.captureSentryMessage(msgStr, 'debug', {
        extra: {
            args
        }
    });
};
