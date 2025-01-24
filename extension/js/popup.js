const langDict = {
    "pl": {
        "title": "Rozszerzenie IO",
        "start": "Zacznij Nagranie",
        "stop": "Zakończ Nagranie",
        "settings": "Ustawienia",
        "python": "Uruchom Pythona, kliknij tu",
        "no_tab": "Nie ma aktywnej karty",
        "bad_tab": "Nie obsługuję tej karty",
    },
    "en": {
        "title": "IO Extension",
        "start": "Start Recording",
        "stop": "End Recording",
        "settings": "Settings",
        "python": "Run Python, then click here",
        "no_tab": "No active tab",
        "bad_tab": "I don't support this tab",
    }
}
const possiblePages = ['https://www.youtube.com', 'https://meet.google.com']

let interval
let seconds
let dict

function superTrim(link) {
    const url = new URL(link)
    return `${url.protocol}//${url.host}`
}

// changing buttons appearance and usage ability
function startRecording(startBtn, stopBtn){
    startBtn.disabled = true
    startBtn.style.backgroundColor = 'white'
    startBtn.style.color = '#28a745'

    stopBtn.disabled = false
    stopBtn.style.backgroundColor = '#dc3545'
    stopBtn.style.color = 'white'

    chrome.storage.local.get(['recording_seconds'], (result) => {
        seconds = Math.floor((Date.now() - result.recording_seconds) / 1000)
    })

    interval = setInterval(function () {updateTimer(startBtn)}, 1000) // timer
}

// same here
function endRecording(startBtn, stopBtn) {
    startBtn.disabled = false
    startBtn.style.backgroundColor = '#28a745'
    startBtn.style.color = 'white'

    stopBtn.disabled = true
    stopBtn.style.backgroundColor = 'white'
    stopBtn.style.color = '#dc3545'

    clearInterval(interval)
    startBtn.textContent = dict['start']
}

function updateTimer(btn) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    btn.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    seconds++
}


document.addEventListener('DOMContentLoaded', async () => {
    const startBtn = document.getElementById('start-btn')
    const stopBtn = document.getElementById('stop-btn')
    const settingsBtn = document.getElementById('settings-btn')
    const textDiv = document.getElementById('popup-text-div')
    const h1 = document.getElementById('title')

    let text = document.createElement('div')

    chrome.storage.local.get(['recording_settings'], (result) => {
        dict = langDict[result.recording_settings.lang]
        startBtn.innerText = dict['start']
        stopBtn.innerText = dict['stop']
        settingsBtn.innerText = dict['settings']
        h1.innerText = dict['title']
    })

    //add text with animation
    function addText() {
        textDiv.appendChild(text)
        text.classList.add('popup-text')

        text.addEventListener('animationend', (event) => {
            if (event.animationName === 'typing') {
                text.classList.add('stop-blink')
            }
        })
    }

    // Python off -> some error while recording -> no tab -> bad tab -> all is good = nothing happens = no text
    chrome.storage.local.get(['recording_text'], (result) => {
        if (result.recording_text !== '') {

            if (String(result.recording_text) === 'default') {
                if (text.innerText === '') { addText() }
                text.innerText = dict['python']
                text.style.textDecorationLine = 'underline'
                text.style.cursor = 'pointer'

                startBtn.disabled = true
                startBtn.style.backgroundColor = 'white'
                startBtn.style.color = '#28a745'

                text.addEventListener('click', async () => {
                    await chrome.runtime.sendMessage('change')
                    whereami.reload()
                })
            }
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0) {
                    if (text.innerText === '') { addText() }
                    text.innerText = dict['no_tab']

                    startBtn.disabled = true
                    startBtn.style.backgroundColor = 'white'
                    startBtn.style.color = '#28a745'

                } else if (!possiblePages.includes(superTrim(tabs[0].url))) {
                    if (text.innerText === '') { addText() }
                    text.innerText = dict['no_tab']

                    startBtn.disabled = true
                    startBtn.style.backgroundColor = 'white'
                    startBtn.style.color = '#28a745'
                }
            })
        }
    })

    chrome.storage.local.get(['recording_status'], (result) => {
        if (result.recording_status === 'start') {
            startRecording(startBtn, stopBtn)
        }
    })

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
                if (key === 'recording_status' && newValue === 'start') {
                    startRecording(startBtn, stopBtn)
                } else if (key === 'recording_status' && newValue === 'stop') {
                    endRecording(startBtn, stopBtn)
                }
                if (key === 'recording_text') {
                    if (text.innerText === '') { addText() }
                    text.innerText = String(newValue)
                }
            }
        }
    })

    // Start
    startBtn.addEventListener('click', async() => {
        setTimeout(async () => {
            await chrome.runtime.sendMessage('start')
        }, 400)
    })

    // Stop
    stopBtn.addEventListener('click', async() => {
        setTimeout(async () => {
            await chrome.runtime.sendMessage('stop')
        }, 400)
    })

    // Settings
    settingsBtn.addEventListener('click', async() => {
        await chrome.tabs.create({
            url: chrome.runtime.getURL('html/main.html')
        })
    })
})
