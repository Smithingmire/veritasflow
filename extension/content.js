let lastUrl = location.href;

function getDurationInSeconds() {
    const durationEl = document.querySelector(".ytp-time-duration");
    if (!durationEl) return null;
    const parts = durationEl.innerText.split(":").map(Number);
    let secs = 0;
    if (parts.length === 2) {
        secs = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return secs;
}

function sendVideoInfo() {
    const title = document.querySelector("h1")?.innerText || document.title;
    const channel = document.querySelector("#channel-name a")?.innerText || "Unknown Channel";
    const url = location.href;
    const duration = getDurationInSeconds();

    console.log("Sending:", {
        title,
        channel,
        url,
        duration
    });

    chrome.runtime.sendMessage(
        {
            type: "VIDEO_DETECTED",
            title,
            channel,
            url,
            videoDuration: duration
        },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error("Message Error:", chrome.runtime.lastError.message);
            } else {
                console.log("Background Received");
            }
        }
    );
}

// Send once when page loads
setTimeout(sendVideoInfo, 1500);

setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(sendVideoInfo, 3000);
    }
}, 1000);

// Listen for manual triggers from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ANALYZE_NOW") {
        sendVideoInfo();
        sendResponse({ success: true });
    }
});