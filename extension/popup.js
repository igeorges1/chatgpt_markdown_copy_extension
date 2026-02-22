document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-btn');
    const statusDiv = document.getElementById('status');

    exportBtn.addEventListener('click', async () => {
        exportBtn.disabled = true;
        statusDiv.textContent = 'Exporting...';
        statusDiv.classList.remove('error');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                throw new Error('No active tab found');
            }

            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'EXPORT_CONVERSATION' });

            if (response && response.markdown) {
                downloadFile(response.markdown, 'conversation.md');
                statusDiv.textContent = 'Export successful!';
            } else {
                throw new Error(response?.error || 'No content received');
            }
        } catch (error) {
            console.error('Export failed:', error);
            statusDiv.textContent = 'Export failed. Refresh page & try again.';
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
