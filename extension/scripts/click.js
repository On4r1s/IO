const button = document.getElementsByClassName('settings_btn');
button[0].addEventListener('click', () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('html/settings.html')
    });
});
