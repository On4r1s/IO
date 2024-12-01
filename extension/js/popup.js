document.getElementById('start_record').addEventListener('click', async () => {
    await chrome.runtime.sendMessage('start')
})

document.getElementById('stop_record').addEventListener('click', async () => {
    await chrome.runtime.sendMessage('stop')
})

document.getElementById('settings_btn').addEventListener('click', async () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('html/settings.html')
    })
})
