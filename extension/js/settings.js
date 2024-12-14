document.getElementById('backButton').addEventListener('click', function() {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/main.html')
    })
});