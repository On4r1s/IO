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
    if(message.action === "monitorMeetings") {
        return;
    }
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

let isMonitorMeetingsScheduled = false;
let currentlyScheduledMeeting = null;
let monitorMeetingsTimeoutId = null;

// Function to detect an active meeting
function detectMeeting(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const MeetingPatterns = ["teams.microsoft.com", "app.zoom.us", 'meet.google.com'];

        const isMeeting = MeetingPatterns.some(pattern =>
            activeTab.url.includes(pattern)
        );

        console.log(isMeeting);

        if (isMeeting) {
            chrome.scripting.executeScript(
                { target: { tabId: activeTab.id }, func: checkDOMForMeeting },
                (injectionResults) => {
                    const result = injectionResults && injectionResults[0]?.result;
                    callback(!!result);
                }
            );
        } else {
            callback(false);
        }
    });
}

function checkDOMForMeeting() { //Seperate id checking and aria-label checking because google is big bad
    const buttonsToCheck = ['#chat-button', '#camera-button', '#microphone-button', '#webclient']; // webclient for zoom because it's weird
    const hasButtons = buttonsToCheck.some(selector => document.querySelector(selector));
    const ariaLabelsToCheck = ['Czatuj ze wszystkimi', 'Ustawienia dźwięku', 'Zaprezentuj teraz']; // Polish, need to find english for google
    const hasAriaLabels = ariaLabelsToCheck.some(label => document.querySelector(`[aria-label="${label}"]`));
    return hasButtons || hasAriaLabels;
}

async function fetchMeetings() {
    try {
        const response = await fetch("http://127.0.0.1:5000/meetings");
        if (!response.ok) throw new Error("Failed to fetch meetings");
        return await response.json();
    } catch (error) {
        console.error("Error fetching meetings:", error);
        return [];
    }
}

function findNearestMeeting(meetings) {
    const now = new Date();
    let nearestMeeting = null;

    meetings.forEach((meeting) => {
        const meetingDateTime = new Date(`${meeting.date}T${meeting.startTime}`);
        if (meetingDateTime > now && (!nearestMeeting || meetingDateTime < new Date(`${nearestMeeting.date}T${nearestMeeting.startTime}`))) {
            nearestMeeting = meeting;
        }
    });

    return nearestMeeting;
}

function scheduleMeetingCheck(meeting) {
    const now = new Date();
    const meetingStartTime = new Date(`${meeting.date}T${meeting.startTime}`);
    // Calculate time until the meeting starts
    const timeUntilMeeting = meetingStartTime - now;

    const MaxDelay = 1000 * 60 * 60 * 24; // 24 hours
    if (timeUntilMeeting > MaxDelay) {
        console.log(`Meeting ${meeting.id} is more than 24 hours away. Scheduling skipped.`);
        return;
    }

    console.log(`Scheduling check for meeting ${meeting.id} in ${timeUntilMeeting / 1000} seconds.`);

    // Set a new timeout and track its ID
    monitorMeetingsTimeoutId = setTimeout(() => {
        console.log("Meeting time! Checking for active Teams meeting...");
        checkForActiveMeetingWithRetries(meeting, 5);

        // After the meeting ends, reset the scheduling flag
        const now = new Date();
        const meetingEndTime = new Date(`${meeting.date}T${meeting.endTime}`);
        const timeUntilMeetingEnds = meetingEndTime - now;

        if (timeUntilMeetingEnds > 0) {
            setTimeout(() => {
                console.log("Meeting has ended. Resetting monitorMeetings scheduling.");
                isMonitorMeetingsScheduled = false;
                currentlyScheduledMeeting = null;
                monitorMeetings();
            }, timeUntilMeetingEnds);
        } else {
            console.log("Meeting already ended. Resetting immediately.");
            isMonitorMeetingsScheduled = false;
            currentlyScheduledMeeting = null;
            monitorMeetings();
        }
    }, timeUntilMeeting);
}

function checkForActiveMeetingWithRetries(meeting, retries) {
    if (retries <= 0) {
        console.log("Retries exhausted. No active meeting detected.");
        monitorMeetings();
        return;
    }

    detectMeeting((isActive) => {
        if (isActive) {
            console.log("User is in an active meeting within calendar date. Start recording");
            recording('start');
            const now = new Date();
            const meetingEndTime = new Date(`${meeting.date}T${meeting.endTime}`);
            const timeUntilEnd = meetingEndTime - now;

            if (timeUntilEnd > 0) {
                console.log(`Scheduling stop of recording for meeting ${meeting.id} in ${timeUntilEnd / 1000} seconds.`);
                setTimeout(() => {
                    console.log("Meeting end time! Stopping recording.");
                    recording('stop');
                }, timeUntilEnd);
            } else {
                console.log("Meeting end time has already passed. No need to schedule stop.");
                monitorMeetings();
            }
        } else {
            console.log("User is NOT in an active meeting. Retrying...");
            setTimeout(() => {
                checkForActiveMeetingWithRetries(meeting, retries - 1);
            }, 30000); // Retry every 30 seconds
        }
    });
}

// Main function to monitor meetings - note: if new meeting added, browser needs restart or add timeout to function
async function monitorMeetings() {
    const meetings = await fetchMeetings();
    if (meetings.length === 0) {
        console.log("No meetings found.");
        isMonitorMeetingsScheduled = false;
        currentlyScheduledMeeting = null;
        return;
    }

    const nearestMeeting = findNearestMeeting(meetings);
    if (!nearestMeeting) {
        console.log("No upcoming meetings.");
        isMonitorMeetingsScheduled = false;
        currentlyScheduledMeeting = null;
        return;
    }

    console.log("Nearest meeting:", nearestMeeting);
    if (isMonitorMeetingsScheduled) {
        const newMeetingTime = new Date(`${nearestMeeting.date}T${nearestMeeting.startTime}`);
        const currentMeetingTime = new Date(`${currentlyScheduledMeeting.date}T${currentlyScheduledMeeting.startTime}`);

        // Reschedule only if the new meeting is earlier
        if (newMeetingTime < currentMeetingTime) {
            console.log("New meeting is earlier. Rescheduling...");
            clearTimeout(monitorMeetingsTimeoutId);
            scheduleMeetingCheck(nearestMeeting);
            currentlyScheduledMeeting = nearestMeeting;
        } else {
            console.log("Current meeting is earlier or the same. Skipping reschedule.");
        }
        return;
    }
    isMonitorMeetingsScheduled = true;
    currentlyScheduledMeeting = nearestMeeting;
    scheduleMeetingCheck(nearestMeeting);
}

monitorMeetings();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "monitorMeetings") {
        console.log("Received request to monitor meetings");
        monitorMeetings();
        sendResponse({ status: "success" });
    }
});