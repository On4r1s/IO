const langDict = {
    "pl": {
        "error_img": "Błąd z wysłaniem obrazka",
    },
    "en": {
        "error_img": "Error while sending img",
    }
}

const paths = {
    'https://www.youtube.com': "/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[1]/div[2]/div/div/ytd-player/div/div/div[1]/video",
    'https://meet.google.com': "/html/body/div[1]/c-wiz/div/div/div[35]/div[4]/div[2]/main/div[1]/div/div[2]/div[3]/div/div",
}

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// wait until element loads
async function waitUntil(path) {
    return await new Promise(resolve => {
        const interval = setInterval(() => {
            let elem = getElementByXpath(path)
            if (elem != null) {
                resolve(elem)
                clearInterval(interval)
            }
        }, 1000);
    })
}

function trimLocation(mode = "basic") {
    const currentLocation = window.location.href;

    switch (mode) {
        case "basic": // Removes leading/trailing whitespace
            return currentLocation.trim()

        case "no-query": // Removes query parameters
            return currentLocation.split('?')[0]

        case "no-path": // Keeps only the domain (protocol and host)
            const url = new URL(currentLocation)
            return `${url.protocol}//${url.host}`

        default:
            return currentLocation
    }
}

async function sendPicture(image) {
    let body = JSON.stringify({image: image})
    try {
        const request = await fetch("http://127.0.0.1:5000/image", {
            method: "POST",
            body: body
        })
        if (!request.ok) {
            chrome.storage.local.get(['recording_settings'], (result) => {
                dict = langDict[result.recording_settings.lang]
                const text = `${dict['error_img']}(${request.status})`

                chrome.storage.local.set({recording_text: text})
            })
        }
    } catch (e) {
        console.error(e)
    }
}


// getting image from element appearance on canvas
let canvas = document.createElement("canvas")

const whereami = trimLocation("no-path")
async function screen() {
    let video = await waitUntil(paths[whereami])
    canvas.width = parseInt(document.defaultView.getComputedStyle(video).width)
    canvas.height = parseInt(document.defaultView.getComputedStyle(video).height)
    canvas
        .getContext("2d")
        .drawImage(video, 0, 0, canvas.width, canvas.height)

    await sendPicture(canvas.toDataURL("image/png"))

}

let interval
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (key === 'recording_status' && newValue === 'start') {
                if (whereami === 'https://meet.google.com') {
                    interval = setInterval( () => {}, 10000000)
                    chrome.runtime.sendMessage({ action: "captureScreen" }, (response) => {
                        if (!response.success) {
                            console.error(response)
                        }
                    })
                } else {
                    interval = setInterval(async () => { // sending image each n milliseconds
                        await screen()
                    }, 2000)
                }
            }
            else if (key === 'recording_status' && newValue === 'stop') {
                clearInterval(interval)
            }
        }
    }
})

function findNextMeeting(meetings) {
    const now = new Date();

    // Przekształcamy dane spotkań na obiekty z datami
    const parsedMeetings = meetings.map(meeting => ({
        ...meeting,
        startDateTime: new Date(`${meeting.date}T${meeting.startTime}`)
    }));

    // Filtrujemy przyszłe spotkania
    const futureMeetings = parsedMeetings.filter(meeting => meeting.startDateTime > now);

    // Sortujemy je po czasie rozpoczęcia
    futureMeetings.sort((a, b) => a.startDateTime - b.startDateTime);

    // Zwracamy najbliższe
    return futureMeetings[0] || null;
}

function scheduleRecording(meeting) {
    if (!meeting) {
        console.log("Nie przekazano spotkania do scheduleRecording.");
        return;
    }

    const now = new Date();
    const startDateTime = new Date(meeting.startDateTime); // Upewnij się, że to obiekt Date

    // Obliczanie czasu zakończenia na podstawie `endTime`
    let endDateTime;
    if (meeting.endTime) {
        const [endHours, endMinutes] = meeting.endTime.split(':').map(Number);
        endDateTime = new Date(startDateTime); // Tworzymy obiekt na podstawie `startDateTime`
        endDateTime.setHours(endHours, endMinutes, 0, 0); // Ustawiamy godziny i minuty zakończenia
    } else {
        console.log("Nie można obliczyć czasu zakończenia spotkania (brak endTime).");
        return;
    }

    console.log("Obecny czas:", now);
    console.log("Czas rozpoczęcia spotkania:", startDateTime);
    console.log("Czas zakończenia spotkania:", endDateTime);

    const timeToStart = startDateTime - now;
    const timeToStop = endDateTime - now;

    // Debugowanie wartości czasu
    console.log("Czas do rozpoczęcia (ms):", timeToStart);
    console.log("Czas do zakończenia (ms):", timeToStop);

    if (timeToStart > 0 || timeToStop > 0) {
        // Używamy setInterval do regularnego sprawdzania, czy czas spotkania nadszedł
        const checkInterval = setInterval(() => {
            const currentTime = new Date();
            const timeToStart = startDateTime - currentTime;
            const timeToStop = endDateTime - currentTime;

            if (timeToStart <= 0) {
                console.log("Rozpoczynam nagrywanie...");
                chrome.storage.local.set({ recording_status: 'start' });
                //clearInterval(checkInterval); // Zatrzymujemy sprawdzanie, jeśli nagrywanie rozpoczęte
            }

            if (timeToStop <= 0) {
                console.log("Kończę nagrywanie...");
                chrome.storage.local.set({ recording_status: 'stop' });
                clearInterval(checkInterval); // Zatrzymujemy sprawdzanie, jeśli nagrywanie zakończone
            }
        }, 10000); // Sprawdzamy co minutę (60000 ms)

    }else {
        console.log("Spotkanie już się rozpoczęło lub zakończyło.");
    }

    if (timeToStart < 0 && timeToStop < 0){


    }
    else {
        console.log("Spotkanie już się rozpoczęło lub zakończyło.");
    }
}


// Przykład odczytu spotkań i harmonogramowania
chrome.storage.local.get(['meetings'], ({ meetings }) => {
    if (meetings) {
        const nextMeeting = findNextMeeting(meetings);
        scheduleRecording(nextMeeting);
    }
})