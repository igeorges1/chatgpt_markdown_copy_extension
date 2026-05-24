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
const fixturePath = path.join(__dirname, '../fixtures/chatgpt20260419_long.html');
const proFixturePath = path.join(__dirname, '../fixtures/chatgpt_pro_20260523.html');

function loadContentScript(window) {
    const contentCode = fs.readFileSync(contentPath, 'utf8');
    const markdownCode = fs.readFileSync(markdownPath, 'utf8');
    const selectorsCode = fs.readFileSync(selectorsPath, 'utf8');
    const i18nCode = fs.readFileSync(i18nPath, 'utf8');

    // Mock Chrome API
    const mockI18n = {
        getMessage: (key) => {
            const messages = {
                'userRole': '**User:**',
                'aiRole': '**AI:**',
                'noConversationFound': 'No conversation found'
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
        i18n: mockI18n
    };

    const context = vm.createContext({
        window,
        document: window.document,
        Node: window.Node,
        chrome: mockChrome,
        globalThis: window,
        navigator: window.navigator,
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        MutationObserver: window.MutationObserver,
        history: window.history,
        location: window.location
    });

    // Load dependencies first
    new vm.Script(i18nCode).runInContext(context);
    new vm.Script(selectorsCode).runInContext(context);
    new vm.Script(markdownCode).runInContext(context);

    // Load content script and expose exportConversation to window
    const fullScript = `
        ${contentCode}

        // Expose exportConversation for testing
        window.exportConversation = exportConversation;
        window.currentPlatform = currentPlatform;
    `;

    new vm.Script(fullScript).runInContext(context);

    return window;
}

test('Export Full Conversation works on simplified HTML fixture', () => {
    const html = fs.readFileSync(fixturePath, 'utf8');
    const dom = new JSDOM(html, {
        url: 'https://chatgpt.com/'
    });

    loadContentScript(dom.window);

    // Trigger export conversation
    const exportedMarkdown = dom.window.exportConversation();

    // Verify export produced content
    assert.ok(exportedMarkdown, 'Export should produce markdown content');

    // Log the output for debugging
    console.log('Exported markdown preview (first 500 chars):');
    console.log(exportedMarkdown.substring(0, 500));

    assert.ok(exportedMarkdown.length > 100, 'Export should produce substantial content');

    // Verify structure - should have user and AI messages
    assert.match(exportedMarkdown, /\*\*User:\*\*/, 'Should contain user messages');
    assert.match(exportedMarkdown, /\*\*AI:\*\*/, 'Should contain AI messages');
    assert.match(exportedMarkdown, /---\n\n/, 'Should have message separators');

    // Verify content from the conversation (about USB Fingerprint Scanner on Fedora)
    assert.match(exportedMarkdown, /USB|fingerprint|scanner/i, 'Should contain conversation topic');
    assert.match(exportedMarkdown, /Fedora/i, 'Should mention Fedora');

    // Verify markdown formatting
    assert.doesNotMatch(exportedMarkdown, /<[^>]+>/, 'Should not contain HTML tags');
    assert.ok(exportedMarkdown.split('---').length > 2, 'Should have multiple message turns');
});

test('Export button finds conversation messages correctly', () => {
    const html = fs.readFileSync(fixturePath, 'utf8');
    const dom = new JSDOM(html, {
        url: 'https://chatgpt.com/'
    });

    const window = dom.window;
    const document = window.document;

    // Check that the fixture has the expected structure
    const selectors = {
        messageSelector: '[data-testid^="conversation-turn"]',
        userSelector: '[data-message-author-role="user"]',
        aiSelector: '[data-message-author-role="assistant"]'
    };

    const turns = document.querySelectorAll(selectors.messageSelector);
    assert.ok(turns.length > 0, `Should find conversation turns, found ${turns.length}`);

    let userCount = 0;
    let aiCount = 0;

    turns.forEach(turn => {
        const userDiv = turn.querySelector(selectors.userSelector);
        const aiDiv = turn.querySelector(selectors.aiSelector);

        if (userDiv) userCount++;
        if (aiDiv) aiCount++;
    });

    assert.ok(userCount > 0, `Should find user messages, found ${userCount}`);
    assert.ok(aiCount > 0, `Should find AI messages, found ${aiCount}`);

    console.log(`Found ${turns.length} conversation turns with ${userCount} user and ${aiCount} AI messages`);
});

test('Export handles missing conversation gracefully', () => {
    const emptyHtml = `
        <html>
            <body>
                <main>
                    <div>No conversation here</div>
                </main>
            </body>
        </html>
    `;

    const dom = new JSDOM(emptyHtml, {
        url: 'https://chatgpt.com/'
    });

    loadContentScript(dom.window);

    const exportedMarkdown = dom.window.exportConversation();

    assert.ok(exportedMarkdown, 'Should return a message even for empty conversation');
    assert.match(exportedMarkdown, /No conversation found/i, 'Should indicate no conversation found');
});

test('Export Full Conversation works on chatgpt pro fixture', () => {
    const html = fs.readFileSync(proFixturePath, 'utf8');
    const dom = new JSDOM(html, {
        url: 'https://chatgpt.com/'
    });

    loadContentScript(dom.window);
    const exportedMarkdown = dom.window.exportConversation();

    assert.ok(exportedMarkdown, 'Export should produce markdown content');
    assert.ok(exportedMarkdown.length > 200, 'Export should produce markdown longer than 200 characters');
    assert.match(exportedMarkdown, /\*\*User:\*\*/, 'Should contain user messages');
    assert.match(exportedMarkdown, /\*\*AI:\*\*/, 'Should contain AI messages');
    assert.match(
        exportedMarkdown,
        /最重要的能力不是“写代码”，而是“定义正确问题、提供正确上下文、验证正确结果”。/,
        'Should include the required key sentence'
    );
    assert.doesNotMatch(exportedMarkdown, /<[^>]+>/, 'Should not contain raw HTML tags');
});

test('ChatGPT turn markdown copy button copies expected content on pro fixture', async () => {
    const html = fs.readFileSync(proFixturePath, 'utf8');
    const dom = new JSDOM(html, {
        url: 'https://chatgpt.com/'
    });

    let copiedText = '';
    Object.defineProperty(dom.window.navigator, 'clipboard', {
        value: {
            writeText: async (text) => {
                copiedText = text;
            }
        },
        configurable: true
    });

    loadContentScript(dom.window);

    // Wait for debounced button injection in processExistingMessages()
    await new Promise(resolve => setTimeout(resolve, 1600));

    const markdownButtons = dom.window.document.querySelectorAll('[data-markdown-copy="true"]');
    assert.ok(markdownButtons.length > 0, 'Should inject markdown copy buttons');

    let successfulCopies = 0;
    let foundRequiredSentence = false;

    for (const markdownButton of markdownButtons) {
        copiedText = '';
        markdownButton.click();
        await new Promise(resolve => setTimeout(resolve, 10));

        if (!copiedText) continue;
        successfulCopies++;
        assert.doesNotMatch(copiedText, /<[^>]+>/, 'Copied markdown should not contain raw HTML tags');

        if (copiedText.includes('最重要的能力不是“写代码”，而是“定义正确问题、提供正确上下文、验证正确结果”。')) {
            foundRequiredSentence = true;
        }
    }

    assert.ok(successfulCopies > 0, 'At least one markdown copy button should write markdown');
    assert.ok(foundRequiredSentence, 'At least one copied markdown result should include the required key sentence');
});
