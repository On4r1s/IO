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

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log(message + " recording")
    console.log(await recording(message))
})
