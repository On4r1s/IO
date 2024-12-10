const langDict = {
    "pl": {
        "error_img": "Błąd z wysłaniem obrazku",
    },
    "en": {
        "error_img": "Error while sending img",
    }
}
//works only for youtube now
const paths = {
    'https://www.youtube.com': "/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[1]/div[2]/div/div/ytd-player/div/div/div[1]/video"
}

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

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
                const text = `${langDict[result.recording_settings.settings.lang]['error_img']}(${request.status})`

                chrome.storage.local.set({recording_text: text})
            })

        }
    } catch (e) {
        console.error(e)
    }
}

let canvas = document.createElement("canvas")
async function screen() {
    let video = await waitUntil(paths[trimLocation("no-path")])
    canvas.width = parseInt(video.style.width)
    canvas.height = parseInt(video.style.height)
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
                interval = setInterval(async () => {
                    await screen()
                }, 2000)
            }
            else if (key === 'recording_status' && newValue === 'stop') {
                clearInterval(interval)
            }
        }
    }
})
