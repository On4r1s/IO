// status for future use
let status
const defaultSettings = {
    "max_space": "10",
    "quality": "100",
    "lang": "en"
}

const langDict = {
    "pl": {
        "error_wl": "Błąd podczas",
        "error_wt": "Błąd z",
        "analyzing": "analizowania",
        "recording": "nagraniem",
        "settings": "ustawieniami",
        "low_space": "Mało miejsca, zwolnij",
        "no_space": "Skończyło się miejsce, kończę nagrywanie",
    },
    "en": {
        "error_wl": "Error while",
        "error_wt": "Error with",
        "analyzing": "analyzing",
        "recording": "recording",
        "settings": "settings",
        "low_space": "Little space left, free up",
        "no_space": "No space left, finished recording",
    }
}

let settings = null

/*
python isn't good -> bad
python was good & python is bad -> not good
python is good -> good
no python -> start python
*/
async function getSettings() {
    try {
        const request = await fetch("http://127.0.0.1:5000/settings", {
            method: "GET"
        })
        if (!request.ok) {
            if (settings === null) { // bad
                chrome.storage.local.set({
                    recording_status: 'stop',
                    recording_text: `Error with settings(${request.status})`,
                    recording_settings: defaultSettings,
                })
            } else { // not good
                const dict = langDict[settings.lang]
                const text = `${dict['error_wt']} ${dict['settings']}(${request.status})`

                chrome.storage.local.set({
                    recording_status: 'stop',
                    recording_text: text,
                    recording_settings: defaultSettings,
                })
            }
        } else { // good
            settings = JSON.parse(await request.text())
            chrome.storage.local.set({
                recording_status: 'stop',
                recording_text: '',
                recording_settings: settings,
            })
        }
    } catch (e) { // run python
        chrome.storage.local.set({
            recording_status: 'stop',
            recording_text: 'default',
            recording_settings: defaultSettings,
        })
        console.error('run python')
    }
}

// separated to use on background, future use for main page with status(will be in chrome.storage)
async function analyze(stamp) {
    if (stamp !== 'nah') {
        try {
            const request = await fetch("http://127.0.0.1:5000/analyze", {
                method: "POST",
                headers: {'stamp': stamp},
            })
            if (!request.ok) {
                const dict = langDict[settings.lang]
                const text = `${dict['error_wl']} ${dict['analyzing']}(${request.status})`
                console.error(text)
                chrome.storage.local.set({recording_text: text})

                status = 'error'
            } else {
                status = 'done'
            }
        } catch (e) {
            console.error(e)
        }
    }
}

async function health() {
    try {
        const request = await fetch("http://127.0.0.1:5000/health", {
            method: "GET",
        })
        if (!request.ok) {
            const dict = langDict[settings.lang]
            const text = `${dict['error_wl']} ${dict['recording']}(${request.status})`
            chrome.storage.local.set({recording_text: text})

        } else {
            const free = Number(JSON.parse(await request.text())['left'])
            let text = ''
            if (free <= 0.146484) { // si approximation
                text = langDict[settings.lang]['low_space']
            } else if ( free < 0.048828) {
                text = langDict[settings.lang]['no_space']
                chrome.storage.local.set({recording_text: text})
                chrome.storage.local.set({recording_status: 'stop'})
            }

            if (text !== '') {
                chrome.storage.local.set({recording_text: text})
            }
        }
    } catch (e) {
        console.error(e)
    }
}

// start or stop recording
let interval
async function recording(action) {
    chrome.storage.local.get(['recording_page'], async (result) => {
        if (result.recording_page !== null) {
            try {
                const request = await fetch("http://127.0.0.1:5000/recording", {
                    method: "POST",
                    headers: {'action': action},
                })
                if (!request.ok) { // something went wrong
                    const dict = langDict[settings.lang]
                    const text = `${dict['error_wt']} ${dict['recording']}(${request.status})`

                    chrome.storage.local.set({recording_text: text})
                } else { // all good
                    chrome.storage.local.set({recording_seconds: Date.now()})
                    if (action === 'start') {
                        chrome.storage.local.set({recording_status: 'start'})
                        await health()
                        interval = setInterval(async () => { // checking health every n milliseconds
                            await health()
                        }, 10000) // 10 secs
                    } else if (action === 'stop') {
                        clearInterval(interval)
                        chrome.storage.local.set({recording_status: 'stop'})
                        status = 'analyzing'
                        await analyze(await request.text())
                    }
                }
            } catch (e) { // ???
                console.error(e)
            }
        }
    })
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message === 'change') {
        await getSettings()
    } else {
        chrome.storage.local.get(['recording_status'], async (result) => {
            if (result.recording_status !== message) {
                await recording(message)
            }
        })
    }
})

getSettings()
