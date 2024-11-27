let recording_status = 'stop'

async function waitUntil(duh) {
    return await new Promise(resolve => {
        const interval = setInterval(() => {
            if (duh != null) {
                resolve(duh)
                clearInterval(interval)
            }
        }, 1000);
    })
}

async function recording(action) {
    try {
        const request = await fetch("http://127.0.0.1:5000/recording", {
            method: "POST",
            headers: {'action': action},
        })
        if (!request.ok) {
            console.error(`Response status: ${request.status}`)
        } else {
            if (action === 'start') {
                recording_status = 'start'
            } else if (action === 'stop') {
                recording_status = 'stop'
            } else {
                console.error(`action: ${action}`)
            }
        }
        return null
    } catch (e) {
        console.error(e)
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
            console.error(`Response status: ${request.status}`)
        }
    } catch (e) {
        console.error(e)
    }
}

let portFromContent

function connected(p) {
    portFromContent = p
    portFromContent.onMessage.addListener(async (m) => {
        await sendPicture(m.image)
    })
}

chrome.runtime.onConnect.addListener(connected);


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (recording_status !== message) {
        await recording(message)
        await waitUntil(portFromContent.postMessage({message: message}))
    }
})
