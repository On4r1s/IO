document.getElementById('start_record').addEventListener('click', async () => {
    await chrome.runtime.sendMessage('start')
});

document.getElementById('stop_record').addEventListener('click', async () => {
    await chrome.runtime.sendMessage('stop')
});

const button = document.getElementsByClassName('settings_btn');
button[0].addEventListener('click', () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('html/settings.html')
    });
});
