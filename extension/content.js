let lastUrl = location.href;
let doomScrollStart = null;
let doomScrollInterval = null;
let reminderShown = false;
const DOOM_SCROLL_THRESHOLD = 300; // 5 minutes in seconds

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

function isOnShortContent() {
    const url = location.href.toLowerCase();
    return url.includes("youtube.com/shorts") || 
           url.includes("instagram.com/reel") || 
           url.includes("tiktok.com");
}

function showDoomScrollReminder() {
    if (document.getElementById("vf-doomscroll-overlay")) return;

    const elapsed = Math.round((Date.now() - doomScrollStart) / 1000);
    const mins = Math.floor(elapsed / 60);

    const overlay = document.createElement("div");
    overlay.id = "vf-doomscroll-overlay";
    overlay.innerHTML = `
        <div style="
            position: fixed; inset: 0; z-index: 999999;
            background: rgba(0, 0, 0, 0.92);
            display: flex; align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: vfFadeIn 0.3s ease;
        ">
            <style>
                @keyframes vfFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes vfPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                @keyframes vfGlow { 0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); } 50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.6); } }
            </style>
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 20px;
                padding: 40px 48px;
                max-width: 420px;
                text-align: center;
                animation: vfGlow 2s ease infinite;
            ">
                <div style="font-size: 56px; margin-bottom: 16px;">⚠️</div>
                <h2 style="
                    color: #ef4444; font-size: 22px; font-weight: 700;
                    margin: 0 0 8px; letter-spacing: -0.5px;
                ">Doomscrolling Alert</h2>
                <p style="
                    color: #94a3b8; font-size: 14px; line-height: 1.6;
                    margin: 0 0 20px;
                ">
                    You've been scrolling short-form content for <strong style="color: #f87171;">${mins}+ minutes</strong>. 
                    Take a breath — your time is worth more than endless scrolling.
                </p>
                <div style="
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 12px; padding: 12px 16px;
                    margin-bottom: 24px;
                ">
                    <p style="color: #fca5a5; font-size: 12px; margin: 0; line-height: 1.5;">
                        🧠 Short-form content floods your brain with dopamine hits, reducing your attention span and focus ability over time.
                    </p>
                </div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="vf-doom-close" style="
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white; border: none; border-radius: 10px;
                        padding: 12px 24px; font-size: 14px; font-weight: 600;
                        cursor: pointer; transition: transform 0.2s;
                    ">Close Tab</button>
                    <button id="vf-doom-dismiss" style="
                        background: rgba(255,255,255,0.08);
                        color: #94a3b8; border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 10px; padding: 12px 24px;
                        font-size: 14px; font-weight: 500;
                        cursor: pointer; transition: transform 0.2s;
                    ">5 More Minutes</button>
                </div>
                <p style="color: #475569; font-size: 11px; margin: 16px 0 0;">
                    Powered by VeritasFlow — AI Information Diet Tracker
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("vf-doom-close").addEventListener("click", () => {
        window.close();
    });

    document.getElementById("vf-doom-dismiss").addEventListener("click", () => {
        overlay.remove();
        // reset timer for another 5 minutes
        doomScrollStart = Date.now();
        reminderShown = false;
    });

    // notify background about the reminder
    chrome.runtime.sendMessage({
        type: "DOOMSCROLL_REMINDER",
        duration: elapsed,
        url: location.href
    });
}

function startDoomScrollTracking() {
    if (doomScrollInterval) return;
    doomScrollStart = Date.now();
    reminderShown = false;

    doomScrollInterval = setInterval(() => {
        if (!isOnShortContent()) {
            clearInterval(doomScrollInterval);
            doomScrollInterval = null;
            doomScrollStart = null;
            return;
        }

        const elapsed = (Date.now() - doomScrollStart) / 1000;
        if (elapsed >= DOOM_SCROLL_THRESHOLD && !reminderShown) {
            reminderShown = true;
            showDoomScrollReminder();
        }
    }, 5000);
}

function stopDoomScrollTracking() {
    if (doomScrollInterval) {
        clearInterval(doomScrollInterval);
        doomScrollInterval = null;
    }
    doomScrollStart = null;
    reminderShown = false;
    const overlay = document.getElementById("vf-doomscroll-overlay");
    if (overlay) overlay.remove();
}

function sendVideoInfo() {
    const title = document.querySelector("h1")?.innerText || document.title;
    const channel = document.querySelector("#channel-name a")?.innerText || "Unknown Channel";
    const url = location.href;
    const duration = getDurationInSeconds();

    chrome.runtime.sendMessage(
        { type: "VIDEO_DETECTED", title, channel, url, videoDuration: duration },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error("Message Error:", chrome.runtime.lastError.message);
            }
        }
    );
}

// kick off on page load
setTimeout(() => {
    sendVideoInfo();
    if (isOnShortContent()) startDoomScrollTracking();
}, 1500);

// watch for URL changes (shorts navigation doesn't reload the page)
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(sendVideoInfo, 3000);

        if (isOnShortContent()) {
            if (!doomScrollInterval) startDoomScrollTracking();
        } else {
            stopDoomScrollTracking();
        }
    }
}, 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ANALYZE_NOW") {
        sendVideoInfo();
        sendResponse({ success: true });
    }
});