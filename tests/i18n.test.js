import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nPath = path.join(__dirname, '../extension/i18n.js');
const i18nCode = fs.readFileSync(i18nPath, 'utf8');

// Function to run the code in a mocked environment
function getLocalizeHtmlPage() {
    const exports = {};
    const module = { exports };
    const chrome = {
        i18n: {
            getMessage: (key) => {
                const messages = {
                    'testKey': 'Localized Text',
                    'placeholderKey': 'Localized Placeholder',
                    'titleKey': 'Localized Title',
                    'ariaLabelKey': 'Localized Aria Label'
                };
                return messages[key];
            }
        }
    };

    // Evaluate the code
    const fn = new Function('chrome', 'module', 'exports', i18nCode + '\nreturn localizeHtmlPage;');
    return fn(chrome, module, exports);
}

const localizeHtmlPage = getLocalizeHtmlPage();

class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.attributes = {};
        this.textContent = '';
    }
    getAttribute(name) {
        return this.attributes[name];
    }
    setAttribute(name, value) {
        this.attributes[name] = value;
    }
}

test('localizeHtmlPage should localize text content', () => {
    const el = new MockElement();
    el.setAttribute('data-i18n', 'testKey');

    global.document = {
        querySelectorAll: (selector) => {
            if (selector === '[data-i18n]') return [el];
            return [];
        }
    };

    localizeHtmlPage();
    assert.strictEqual(el.textContent, 'Localized Text');
});

test('localizeHtmlPage should localize placeholders', () => {
    const el = new MockElement('input');
    el.setAttribute('data-i18n-placeholder', 'placeholderKey');

    global.document = {
        querySelectorAll: (selector) => {
            if (selector === '[data-i18n-placeholder]') return [el];
            return [];
        }
    };

    localizeHtmlPage();
    assert.strictEqual(el.getAttribute('placeholder'), 'Localized Placeholder');
});

test('localizeHtmlPage should localize titles', () => {
    const el = new MockElement();
    el.setAttribute('data-i18n-title', 'titleKey');

    global.document = {
        querySelectorAll: (selector) => {
            if (selector === '[data-i18n-title]') return [el];
            return [];
        }
    };

    localizeHtmlPage();
    assert.strictEqual(el.getAttribute('title'), 'Localized Title');
});

test('localizeHtmlPage should localize aria-labels', () => {
    const el = new MockElement();
    el.setAttribute('data-i18n-aria-label', 'ariaLabelKey');

    global.document = {
        querySelectorAll: (selector) => {
            if (selector === '[data-i18n-aria-label]') return [el];
            return [];
        }
    };

    localizeHtmlPage();
    assert.strictEqual(el.getAttribute('aria-label'), 'Localized Aria Label');
});

test('localizeHtmlPage should handle missing messages', () => {
    const el = new MockElement();
    el.setAttribute('data-i18n', 'nonExistentKey');
    el.textContent = 'Original Text';

    global.document = {
        querySelectorAll: (selector) => {
            if (selector === '[data-i18n]') return [el];
            return [];
        }
    };

    localizeHtmlPage();
    assert.strictEqual(el.textContent, 'Original Text');
});
