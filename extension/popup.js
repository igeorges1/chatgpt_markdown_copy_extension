document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-btn');
    const statusDiv = document.getElementById('status');

    exportBtn.addEventListener('click', async () => {
        exportBtn.disabled = true;
        statusDiv.textContent = chrome.i18n.getMessage('exporting');
        statusDiv.classList.remove('error');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                throw new Error(chrome.i18n.getMessage('noActiveTab'));
            }

            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'EXPORT_CONVERSATION' });

            if (response && response.markdown) {
                downloadFile(response.markdown, 'conversation.md');
                statusDiv.textContent = chrome.i18n.getMessage('exportSuccess');
            } else {
                throw new Error(response?.error || chrome.i18n.getMessage('noContentReceived'));
            }
        } catch (error) {
            console.error(chrome.i18n.getMessage('exportFailed'), error);
            statusDiv.textContent = chrome.i18n.getMessage('exportFailedRefresh');
            statusDiv.classList.add('error');
        } finally {
            setTimeout(() => {
                exportBtn.disabled = false;
                // statusDiv.textContent = ''; // Keep success/error message for a bit
            }, 2000);
        }
    });

    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Use anchor tag for download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
});
