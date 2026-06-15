window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.type === "VERITASFLOW_AUTH_SYNC") {
    const { token, user } = event.data;

    chrome.storage.local.get(["token", "user"], (stored) => {
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
});

// Listen for storage changes in the extension (e.g. logout from popup) to sync back to website
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.token && !changes.token.newValue) {
    console.log("Syncing: Extension user logged out. Clearing website session.");
    window.postMessage({ type: "VERITASFLOW_EXTENSION_LOGOUT" }, "*");
  }
});
