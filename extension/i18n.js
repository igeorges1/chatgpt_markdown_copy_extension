// Internationalization Helper

function localizeHtmlPage() {
    // Localize text content
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.textContent = message;
        }
    });

    // Localize placeholders
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.setAttribute('placeholder', message);
        }
    });

    // Localize titles
    const titles = document.querySelectorAll('[data-i18n-title]');
    titles.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.setAttribute('title', message);
        }
    });

    // Localize aria-labels
    const ariaLabels = document.querySelectorAll('[data-i18n-aria-label]');
    ariaLabels.forEach(element => {
        const key = element.getAttribute('data-i18n-aria-label');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.setAttribute('aria-label', message);
        }
    });
}

// Run localization when the DOM is fully loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', localizeHtmlPage);
}
