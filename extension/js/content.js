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

//works only for youtube now, path is for yt

let myPort = chrome.runtime.connect({ name: "port-from-content" })
let path = "/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[1]/div[2]/div/div/ytd-player/div/div/div[1]/video"
let canvas = document.createElement("canvas")
let status = 'stop'


myPort.onMessage.addListener(async (m) => {
    if (m.message === 'start') {
        status = 'start'
        work()
    } else if (m.message === 'stop') {
        status = 'stop'
    }
})

async function screen() {
    let video = await waitUntil(path)
    canvas.width = parseInt(video.style.width)
    canvas.height = parseInt(video.style.height)
    canvas
        .getContext("2d")
        .drawImage(video, 0, 0, canvas.width, canvas.height)

    myPort.postMessage({ image: canvas.toDataURL("image/png") })
}

async function work(){
    while (status !== 'stop') {
        await screen()
        const interval = setInterval(async () => {
            clearInterval(interval)
        }, 1000)
    }
}

work()
