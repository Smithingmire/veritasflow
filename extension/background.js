// Tracking variables
let currentTabId = null;
let currentUrl = null;
let currentTitle = null;
let startTime = null;
let currentVideoDuration = null;
let currentChannel = null;
let loggedForCurrentTab = false;
let alreadyLoggedDuration = 0; // Tracks duration already saved for this session to avoid duplication
let doomScrollTimer = null;

let settings = {
  trackedWebsites: ["youtube.com", "reddit.com", "twitter.com", "medium.com", "wikipedia.org", "instagram.com", "tiktok.com"],
  blockedWebsites: ["instagram.com", "tiktok.com"],
  focusMode: false
};

// Helper to normalize and clean URLs for robust comparison
function cleanUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    let cleaned = parsed.origin + parsed.pathname;
    
    // Retain the YouTube video ID if it exists to differentiate between watch sessions
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.has("v")) {
      cleaned += "?v=" + parsed.searchParams.get("v");
    }
    
    if (cleaned.endsWith("/")) {
      cleaned = cleaned.slice(0, -1);
    }
    return cleaned.toLowerCase();
  } catch (e) {
    let cleaned = url.toLowerCase().split(/[?#]/)[0];
    if (cleaned.endsWith("/")) {
      cleaned = cleaned.slice(0, -1);
    }
    return cleaned;
  }
}

// Identify long-form YouTube videos (containing /watch)
function isLongFormYoutubeVideo(url) {
  if (!url) return false;
  return url.toLowerCase().includes("youtube.com/watch");
}

// Identify doom scrolling short content
function isDoomScrolling(url) {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes("instagram.com") || 
         lowerUrl.includes("tiktok.com") || 
         lowerUrl.includes("youtube.com/shorts");
}

// Fetch tracking settings from backend if logged in
function fetchSettings() {
  chrome.storage.local.get("token", (res) => {
    if (!res.token) return;
    
    fetch("http://localhost:5000/api/activity/settings", {
      headers: {
        "Authorization": `Bearer ${res.token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.trackedWebsites) {
          settings = data;
          console.log("Settings synchronized from backend:", settings);
        }
      })
      .catch(err => console.error("Error synchronizing settings:", err));
  });
}

// Initial fetch and periodic sync
fetchSettings();
setInterval(fetchSettings, 10000);

// Watch for token storage updates (login/logout) to refresh settings and tracking instantly
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.token) {
    console.log("Authentication token updated. Refreshing config.");
    fetchSettings();
    
    // Immediately start tracking on the active tab if logged in
    if (changes.token.newValue) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url) {
          startTracking(activeTab.id, activeTab.url, activeTab.title);
        }
      });
    }
  }
});

// Helper to check and redirect blocked sites in Focus Mode
function checkAndBlockTab(tabId, url) {
  if (!url) return false;
  
  if (settings.focusMode && settings.blockedWebsites) {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace("www.", "");
      const isBlocked = settings.blockedWebsites.some(site => 
        domain.includes(site) || site.includes(domain)
      );
      
      if (isBlocked) {
        console.log(`Blocking website: ${url} (Focus Mode Active)`);
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL("blocked.html") });
        return true;
      }
    } catch (e) {
      // Ignore internal urls (e.g. chrome://)
    }
  }
  return false;
}

// Helper to check if a domain is tracked
function isTracked(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace("www.", "");
    
    const isMatched = settings.trackedWebsites.some(site => domain.includes(site) || site.includes(domain));
    if (!isMatched) return false;

    // For YouTube, only track actual video/shorts consumption
    if (domain.includes("youtube.com")) {
      const path = parsed.pathname.toLowerCase();
      return path.includes("/watch") || path.includes("/shorts");
    }

    // For Instagram, only track posts/reels/stories
    if (domain.includes("instagram.com")) {
      const path = parsed.pathname.toLowerCase();
      return path.includes("/p/") || path.includes("/reel/") || path.includes("/reels/") || path.includes("/stories/");
    }

    return true;
  } catch (e) {
    return false;
  }
}

// Helper to send activity to backend
function sendActivity(url, title, durationSeconds, isImmediate = false, channel = null) {
  console.log(`Checking threshold: ${title}. duration = ${durationSeconds}s. isImmediate = ${isImmediate}. channel = ${channel}`);

  chrome.storage.local.get("token", (res) => {
    if (!res.token) {
      console.log("Skipped: User is not logged in.");
      chrome.storage.local.remove("lastAnalysis");
      return;
    }

    console.log(`Sending activity: ${title} (${url}) for ${durationSeconds}s`);
    
    fetch("http://localhost:5000/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${res.token}`
      },
      body: JSON.stringify({
        url,
        title,
        duration: durationSeconds,
        channel: channel || currentChannel
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Activity saved successfully:", data);
      if (data.success && data.tracked) {
        // 3. Compile Suggestions – start empty and conditionally add based on diet score
        let suggestions = [];
        if (data.todayDietScore < 50) {
          suggestions.push("Your diet score is low – consider focusing on higher‑quality or educational content.");
        } else {
          suggestions.push("Great job! Your content consumption looks good.");
        }
        chrome.storage.local.set({
          lastAnalysis: {
            title: data.activity.title,
            channel: data.activity.channel || data.activity.domain,
            url: data.activity.url,
            duration: data.activity.duration,
            analysis: data.activity.analysis,
            suggestions: suggestions,
            status: "success"
          }
        });
      } else {
        chrome.storage.local.remove("lastAnalysis");
      }
    })
    .catch(err => {
      console.error("Error sending activity:", err);
      chrome.storage.local.remove("lastAnalysis");
    });
  });
}

// End tracking session for the current tab
function stopTrackingCurrent() {
  if (doomScrollTimer) {
    clearTimeout(doomScrollTimer);
    doomScrollTimer = null;
  }

  if (startTime && currentUrl && currentTitle) {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const deltaSeconds = durationSeconds - alreadyLoggedDuration;

    // Log the stay if total duration is at least 5 seconds
    if (durationSeconds >= 5) {
      if (deltaSeconds > 0) {
        sendActivity(currentUrl, currentTitle, deltaSeconds, true, currentChannel);
      }
    } else {
      console.log(`Skipped short stay (${durationSeconds}s).`);
      if (alreadyLoggedDuration === 0) {
        chrome.storage.local.remove("lastAnalysis");
      }
    }
  }
  
  startTime = null;
  currentTabId = null;
  currentUrl = null;
  currentTitle = null;
  currentVideoDuration = null;
  alreadyLoggedDuration = 0;
  loggedForCurrentTab = false;
}

// Start tracking session for a tab
function startTracking(tabId, url, title) {
  // 1. Immediately block if it is a blocked site in Focus Mode
  if (checkAndBlockTab(tabId, url)) {
    stopTrackingCurrent();
    return;
  }

  chrome.storage.local.get("token", (res) => {
    if (!res.token) {
      stopTrackingCurrent();
      return;
    }

    if (isTracked(url)) {
      if (cleanUrl(currentUrl) === cleanUrl(url) && currentTabId === tabId) {
        return;
      }
      
      stopTrackingCurrent(); // Stop previous
      
      currentTabId = tabId;
      currentUrl = url;
      currentTitle = title || url;
      startTime = Date.now();
      currentVideoDuration = null;
      alreadyLoggedDuration = 0;
      loggedForCurrentTab = false;
      console.log(`Started tracking: ${currentTitle} (${currentUrl})`);
      
      chrome.storage.local.set({
        lastAnalysis: {
          title: currentTitle,
          channel: new URL(url).hostname.replace("www.", ""),
          url: url,
          status: "loading"
        }
      });

    } else {
      stopTrackingCurrent();
    }
  });
}

// Tab changed
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (chrome.runtime.lastError || !tab) return;
    startTracking(tab.id, tab.url, tab.title);
  });
});

// Tab URL/title updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (checkAndBlockTab(tabId, changeInfo.url)) {
      stopTrackingCurrent();
      return;
    }
  }

  if (tab.active && (changeInfo.url || changeInfo.title)) {
    if (changeInfo.url && cleanUrl(changeInfo.url) !== cleanUrl(currentUrl)) {
      startTracking(tabId, tab.url, tab.title);
    } else if (changeInfo.title && tabId === currentTabId) {
      currentTitle = changeInfo.title;
    }
  }
});

// Tab closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === currentTabId) {
    console.log(`Tracked tab ${tabId} was closed. Finalizing activity.`);
    stopTrackingCurrent();
  }
});

// Window focus changed
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTrackingCurrent();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (tab) {
        startTracking(tab.id, tab.url, tab.title);
      }
    });
  }
});

// Extension messaging receiver
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "VIDEO_DETECTED") {
    console.log("Received video data from content script:", message);
    
    // Check if the URL has actually changed from the last tracked URL (e.g. scrolling between Shorts or internal page transitions)
    if (message.url && cleanUrl(message.url) !== cleanUrl(currentUrl)) {
      console.log(`URL changed internally from ${currentUrl} to ${message.url}. Finalizing old session and starting new.`);
      stopTrackingCurrent();
      
      currentTabId = sender.tab ? sender.tab.id : currentTabId;
      currentUrl = message.url;
      currentTitle = message.title || message.url;
      startTime = Date.now();
      alreadyLoggedDuration = 0;
      loggedForCurrentTab = false;
      currentChannel = message.channel || null;
    }
    
    currentVideoDuration = message.videoDuration;
    if (message.title) currentTitle = message.title;
    if (message.channel) currentChannel = message.channel;
    
    // Handle immediate trace for Short content
    // We treat it as short content if the video duration is known and < 90s, OR if it's doom scrolling,
    // OR if the video duration is not known yet (so we don't miss logging it if the user leaves early)
    const isShort = (currentVideoDuration && currentVideoDuration < 90) || isDoomScrolling(currentUrl) || !currentVideoDuration;
    if (isShort && alreadyLoggedDuration === 0) {
      if (doomScrollTimer) clearTimeout(doomScrollTimer);
      
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 5000 - elapsed);
      
      console.log(`Short content detected. Elapsed: ${elapsed}ms. Setting timer for remaining ${remaining}ms.`);
      doomScrollTimer = setTimeout(() => {
        if (cleanUrl(currentUrl) === cleanUrl(message.url) && alreadyLoggedDuration === 0) {
          console.log("User watched content for 5s. Logging details immediately.");
          alreadyLoggedDuration = Math.round((Date.now() - startTime) / 1000);
          sendActivity(message.url, message.title, alreadyLoggedDuration, true, message.channel);
        }
      }, remaining);
    }
    
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "CLOSE_TAB" && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "DOOMSCROLL_REMINDER") {
    console.log("Doomscroll reminder triggered:", message);
    chrome.storage.local.get(["token", "doomScrollCount"], (res) => {
      if (!res.token) return;

      const count = (res.doomScrollCount || 0) + 1;
      chrome.storage.local.set({ doomScrollCount: count });

      fetch("http://localhost:5000/api/activity/doomscroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${res.token}`
        },
        body: JSON.stringify({
          duration: message.duration,
          url: message.url
        })
      })
      .then(r => r.json())
      .then(data => console.log("Doomscroll reminder logged:", data))
      .catch(err => console.error("Error logging doomscroll:", err));
    });

    // show a chrome notification as well
    chrome.notifications.create("doomscroll-alert", {
      type: "basic",
      iconUrl: "icon128.png",
      title: "⚠️ Doomscrolling Alert",
      message: `You've been scrolling short content for ${Math.floor(message.duration / 60)}+ minutes. Take a break!`,
      priority: 2
    });

    sendResponse({ success: true });
    return true;
  }
});