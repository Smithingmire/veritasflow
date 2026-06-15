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
