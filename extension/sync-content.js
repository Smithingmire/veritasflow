window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.type === "VERITASFLOW_AUTH_SYNC") {
    const { token, user } = event.data;

    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["token", "user"], (stored) => {
          if (chrome.runtime.lastError) {
            console.warn("Storage sync failed:", chrome.runtime.lastError.message);
            return;
          }
          if (!stored) return;
          if (stored.token !== token || JSON.stringify(stored.user) !== JSON.stringify(user)) {
            if (token) {
              console.log("Syncing: Website user logged in. Updating extension session.");
              chrome.storage.local.set({ token, user });
            } else {
              console.log("Syncing: Website user logged out. Clearing extension session.");
              chrome.storage.local.remove(["token", "user", "lastAnalysis"]);
            }
          }
        });
      }
    } catch (err) {
      // Gracefully catch 'Extension context invalidated' errors after extension reloads
      console.debug("VeritasFlow: Sync context is temporarily offline. Refresh page if needed.", err);
    }
  }
});

// Listen for storage changes in the extension (e.g. logout from popup) to sync back to website
try {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local" && changes.token && !changes.token.newValue) {
        console.log("Syncing: Extension user logged out. Clearing website session.");
        window.postMessage({ type: "VERITASFLOW_EXTENSION_LOGOUT" }, "*");
      }
    });
  }
} catch (err) {
  console.debug("VeritasFlow: Storage listener context invalidated.", err);
}

