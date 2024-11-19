document.getElementById('start_record').addEventListener('click', async () => {
    await chrome.runtime.sendMessage('start')
});

document.getElementById('stop_record').addEventListener('click', async () => {
    await chrome.runtime.sendMessage('stop')
});
