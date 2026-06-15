(function() {
  function syncTokens() {
    const token = localStorage.getItem("vf_token");
    const userStr = localStorage.getItem("vf_current_user");
    let user = null;
    try {
      if (userStr) user = JSON.parse(userStr);
    } catch (e) {}

    window.postMessage({
      type: "VERITASFLOW_AUTH_SYNC",
      token: token,
      user: user
    }, "*");
  }

  // Initial sync
  syncTokens();

  // Listen for storage events (updates from other tabs)
  window.addEventListener("storage", (e) => {
    if (e.key === "vf_token" || e.key === "vf_current_user") {
      syncTokens();
    }
  });

  // Regular polling to catch local React state/localStorage transitions
  setInterval(syncTokens, 1000);

  // Listen for logout events from the extension content script
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === "VERITASFLOW_EXTENSION_LOGOUT") {
      console.log("Received logout event from extension. Clearing local storage.");
      localStorage.removeItem("vf_token");
      localStorage.removeItem("vf_current_user");
      window.location.reload();
    }
  });
})();
