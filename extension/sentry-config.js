// Sentry Configuration
// Replace SENTRY_DSN with your actual Sentry DSN
// Get your DSN from: https://sentry.io/settings/projects/

const SENTRY_CONFIG_OBJ = {
    // REQUIRED: Set your Sentry DSN here
    // Example: 'https://examplePublicKey@o0.ingest.sentry.io/0'
    dsn: 'https://05cb409834d55523fe1f68bc5e4ea795@o157982.ingest.us.sentry.io/4510368527089664',

    // Optional: Environment (production, staging, development)
    environment: 'production',

    // Optional: Release version (should match your extension version)
    release: 'chatgpt-markdown-copy@2.0.0',

    // Optional: Sample rate for error tracking (1.0 = 100%)
    tracesSampleRate: 1.0,

    // Optional: Enable performance monitoring
    enablePerformance: false,

    // Optional: Enable session replay
    enableReplay: false,

    // Optional: Custom tags
    tags: {
        extension: 'chatgpt-markdown-copy'
    }
};

// Export for both Content Scripts (global) and Modules (globalThis/self)
if (typeof window !== 'undefined') {
    window.SENTRY_CONFIG = SENTRY_CONFIG_OBJ;
}
if (typeof self !== 'undefined') {
    self.SENTRY_CONFIG = SENTRY_CONFIG_OBJ;
}
if (typeof globalThis !== 'undefined') {
    globalThis.SENTRY_CONFIG = SENTRY_CONFIG_OBJ;
}
