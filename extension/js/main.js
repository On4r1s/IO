document.getElementById("calendar-btn").addEventListener("click", () => {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/calendar.html')
    })
});

document.getElementById("load-recordings-btn").addEventListener("click", () => {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/load-recordings.html')
    })
});

document.getElementById("settings-btn").addEventListener("click", () => {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/settings.html')
    })
});