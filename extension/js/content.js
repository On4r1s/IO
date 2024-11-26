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
        }, 100);
    })
}

//let path = "/html/body/div[1]/div[2]/div/img"
//works only for youtube now, path is for yt

let path = "/html/body/ytd-app/div[1]/ytd-page-manager/ytd-watch-flexy/div[5]/div[1]/div/div[1]/div[2]/div/div/ytd-player/div/div/div[1]/video"
let canvas = document.createElement("canvas")



async function screen() {
    let video = await waitUntil(path)

    canvas.width = parseInt(video.style.width)
    canvas.height = parseInt(video.style.height)
    canvas
        .getContext("2d")
        .drawImage(video, 0, 0, canvas.width, canvas.height)

    console.log('sent')

    chrome.runtime.sendMessage(canvas.toDataURL("image/png"))
}

screen()
