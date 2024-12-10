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
    },
    "en": {
        "error_wl": "Error while",
        "error_wt": "Error with",
        "analyzing": "analyzing",
        "recording": "recording",
        "settings": "settings",
    }
}

let settings = null

async function getSettings() {
    try {
        const request = await fetch("http://127.0.0.1:5000/settings", {
            method: "GET"
        })
        if (!request.ok) {
            if (settings === null) {
                chrome.storage.local.set({
                    recording_status: 'stop',
                    recording_text: `Error with settings(${request.status})`,
                    recording_settings: defaultSettings,
                })
            } else {
                const dict = langDict[settings.lang]
                const text = `${dict['error_wt']} ${dict['settings']}(${request.status})`

                chrome.storage.local.set({
                    recording_status: 'stop',
                    recording_text: text,
                    recording_settings: defaultSettings,
                })
            }
        } else {
            settings = JSON.parse(await request.text())
            chrome.storage.local.set({
                recording_status: 'stop',
                recording_text: '',
                recording_settings: settings,
            })
        }
    } catch (e) {
        chrome.storage.local.set({
            recording_status: 'stop',
            recording_text: 'default',
            recording_settings: defaultSettings,
        })
        console.error(e)
    }
}

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

async function recording(action) {
    chrome.storage.local.get(['recording_page'], async (result) => {
        if (result.recording_page !== null) {
            try {
                const request = await fetch("http://127.0.0.1:5000/recording", {
                    method: "POST",
                    headers: {'action': action},
                })
                if (!request.ok) {
                    const dict = langDict[settings.lang]
                    const text = `${dict['error_wt']} ${dict['recording']}(${request.status})`

                    chrome.storage.local.set({recording_text: text})
                } else {
                    chrome.storage.local.set({ recording_seconds: Date.now()})
                    if (action === 'start') {
                        chrome.storage.local.set({ recording_status: 'start'})
                    } else if (action === 'stop') {
                        chrome.storage.local.set({ recording_status: 'stop'})
                        status = 'analyzing'
                        await analyze(await request.text())
                    }
                }
            } catch (e) {
                console.error(e)
            }
        } else {

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
