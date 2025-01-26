const langDict = {
    "pl": {
        "error_img": "Błąd z wysłaniem obrazka",
    },
    "en": {
        "error_img": "Error while sending img",
    }
}

const browserChromeHeight = window.outerHeight - window.innerHeight

const paths = {
    'https://meet.google.com': "/html/body/div[1]/c-wiz/div/div/div[35]/div[4]/div[2]/main/div[1]/div/div[1]/div/div[2]/div/video",
    'https://teams.microsoft.com': "/html/body/div[1]/div/div/div/div[7]/div/div/div/div[2]/div/div[1]/div/div[2]/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div/div/video",
    'https://app.zoom.us': "/html/body/div[3]/div[2]/div/div[2]/div/div[1]/div[1]/div[5]/div/div[1]"
}

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// wait until element loads
async function waitUntil(path, z) {
    return await new Promise(resolve => {
        const interval = setInterval(() => {
            let elem
            if (z) elem = document.getElementById('video-share-layout')
            else elem = getElementByXpath(path)
            if (elem != null) {
                resolve(elem)
                clearInterval(interval)
            }
        }, 500);
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
async function screen(video, w, h, sx, sy) {
    canvas.width = w
    canvas.height = h
    canvas
        .getContext("2d")
        .drawImage(video, sx, sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
    const pic = canvas.toDataURL("image/png")
    await sendPicture(pic)
}

let interval
chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'local') {
        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            if (key === 'recording_status' && newValue === 'start') {
                    chrome.runtime.sendMessage({action: "getId"}, async () => {
                        chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
                            if (message.action === "screenCaptured") {
                                const streamId = message.streamId
                                const stream = await navigator.mediaDevices.getUserMedia(
                                    {
                                        audio: false,
                                        video: {
                                            mandatory: {
                                                chromeMediaSource: "desktop",
                                                chromeMediaSourceId: streamId,
                                            },
                                        },
                                    })
                                const video = document.createElement('video')
                                video.srcObject = stream
                                video.autoplay = true
                                document.body.appendChild(video)
                                console.log(whereami)
                                console.log(paths[whereami])
                                let elem
                                if (whereami !== 'https://app.zoom.us') {
                                    elem = await waitUntil(paths[whereami], false)
                                } else {
                                    elem = await waitUntil('video-share-layout', true)
                                    //elem = document.getElementById('video-share-layout')
                                }

                                console.log(2)
                                interval = setInterval(async () => { // sending image each n milliseconds
                                    let rect = elem.getBoundingClientRect()
                                    video.style.width = String(rect.width)
                                    video.style.height = String(rect.height)

                                    if (whereami === 'https://meet.google.com') {
                                        await screen(video, rect.width+272, rect.height+150, rect.x+3, rect.y + browserChromeHeight+45)
                                    } else if (whereami === 'https://teams.microsoft.com') {
                                        await screen(video, rect.width+240, rect.height+165, rect.x+50, rect.y + browserChromeHeight+50)
                                    } else if (whereami === 'https://app.zoom.us') {
                                    await screen(video, rect.width+240, rect.height+165, rect.x+50, rect.y + browserChromeHeight+50)
                                }
                                }, 2000)

                            }

                        })
                    })
            } else if (key === 'recording_status' && newValue === 'stop') {
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