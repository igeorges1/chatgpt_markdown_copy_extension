import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentPath = path.join(__dirname, '../extension/content.js');
const markdownPath = path.join(__dirname, '../extension/markdown.js');
const selectorsPath = path.join(__dirname, '../extension/selectors.js');
const i18nPath = path.join(__dirname, '../extension/i18n.js');
const fixturePath = path.join(__dirname, '../../new-gemini-QA-UI.html');

function loadContentScript(window) {
    const contentCode = fs.readFileSync(contentPath, 'utf8');
    const markdownCode = fs.readFileSync(markdownPath, 'utf8');
    const selectorsCode = fs.readFileSync(selectorsPath, 'utf8');
    const i18nCode = fs.readFileSync(i18nPath, 'utf8');

    const mockI18n = {
        getMessage: (key) => {
            const messages = {
                'userRole': '**User:**',
                'aiRole': '**AI:**',
                'noConversationFound': 'No conversation found',
                'copyAsMarkdown': 'Copy as Markdown',
                'cantFindMessageBody': 'Cannot find message body'
            };
            return messages[key] || key;
        }
    };

    const mockChrome = {
        runtime: {
            onMessage: {
                addListener: () => {}
            }
        },
        i18n: mockI18n,
        storage: {
            sync: {
                get: (keys, callback) => callback({})
            }
        }
    };

    const context = vm.createContext({
        window,
        document: window.document,
        Node: window.Node,
        chrome: mockChrome,
        globalThis: window,
        console,
        MutationObserver: window.MutationObserver,
        history: window.history,
        location: window.location,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval
    });

    new vm.Script(i18nCode).runInContext(context);
    new vm.Script(selectorsCode).runInContext(context);
    new vm.Script(markdownCode).runInContext(context);

    const fullScript = `
        ${contentCode}
        window.exportConversation = exportConversation;
        window.currentPlatform = currentPlatform;
        window.addMarkdownCopyButton = addMarkdownCopyButton;
        window.processExistingMessages = processExistingMessages;
        window.DEFAULT_PLATFORM_CONFIG = DEFAULT_PLATFORM_CONFIG;
    `;

    new vm.Script(fullScript).runInContext(context);

    return window;
}

test('New Gemini Q&A UI: copyButtonSelector matches and addMarkdownCopyButton executes correctly', () => {
    const html = fs.readFileSync(fixturePath, 'utf8');
    const dom = new JSDOM(html, {
        url: 'https://gemini.google.com/'
    });

    const window = dom.window;
    const document = window.document;

    loadContentScript(window);

    // Verify correct platform detection
    assert.strictEqual(window.currentPlatform, 'gemini', 'Should detect platform as gemini');

    // Find all copy-button containers
    const copyButtons = document.querySelectorAll('copy-button');
    assert.ok(copyButtons.length > 0, `Should find copy buttons, found ${copyButtons.length}`);

    // Verify copy button inner selector matching
    const selector = window.DEFAULT_PLATFORM_CONFIG.gemini.copyButtonSelector;
    const firstCopyButton = copyButtons[0];
    const buttonInside = firstCopyButton.querySelector(selector);
    assert.ok(buttonInside, 'Should successfully find the nested copy button inside the copy-button container');

    // Run addMarkdownCopyButton directly for synchronous verification to avoid debounce timeouts
    window.addMarkdownCopyButton(firstCopyButton);

    // Verify cloned wrapper injection
    // Should be injected as a sibling of copy-button container
    const insertedClones = document.querySelectorAll('copy-button[data-markdown-copy="true"]');
    assert.strictEqual(insertedClones.length, 1, 'Should inject the cloned Markdown Copy button next to original one');

    // Verify the properties of the cloned buttons
    const clonedWrapper = insertedClones[0];
    const clonedButton = clonedWrapper.querySelector('button');
    const clonedIconSvg = clonedWrapper.querySelector('svg');

    assert.strictEqual(clonedButton.getAttribute('aria-label'), 'Copy as Markdown', 'Cloned button should have updated aria-label');
    assert.ok(clonedIconSvg, 'Cloned icon should be a vector <svg> element');
    assert.ok(clonedIconSvg.classList.contains('mat-icon'), 'Cloned SVG should have mat-icon class');
    assert.ok(clonedIconSvg.classList.contains('lm-icon-m'), 'Cloned SVG should have lm-icon-m class');
    assert.strictEqual(clonedIconSvg.getAttribute('width'), '20', 'Cloned SVG should have width 20');
    assert.strictEqual(clonedIconSvg.getAttribute('height'), '20', 'Cloned SVG should have height 20');
});
