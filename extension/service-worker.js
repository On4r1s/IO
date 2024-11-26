let recording_status = ''
async function recording(action) {
    let settingsRequest
    try {
        settingsRequest = fetch("http://127.0.0.1:5000/recording",{
            method: "POST",
            headers: { 'action': action },
        })
    } catch (e) {
        return e
    }
    console.log(await settingsRequest)
    if (await settingsRequest.status === 200) {
        if (action === 'start'){
            recording_status = 'started'
        } else if (action === 'stop'){
            recording_status = 'stopped'
        } else {
            console.error(action)
        }
    } else {
        console.error(await settingsRequest.status)
    }
    return await settingsRequest
}

async function sendPicture(picture) {
    let settingsRequest
    let body = JSON.stringify({ image: picture })
    console.log(body)
    try {
        settingsRequest = fetch("http://127.0.0.1:5000/image",{
            method: "POST",
            body: body
        })
    } catch (e) {
        return e
    }
    return await settingsRequest
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message === 'start' || message === 'stop') {
        console.log(await recording(message))
    } else {
        console.log('image')
        await sendPicture(message)
    }
})
