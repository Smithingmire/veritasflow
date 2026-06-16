document.addEventListener("DOMContentLoaded", () => {
  const lnkLogout = document.getElementById("lnk-logout");
  const lnkRegister = document.getElementById("lnk-register");
  
  // Login Elements
  const stateLogin = document.getElementById("state-login");
  const txtUsername = document.getElementById("txt-username");
  const txtPassword = document.getElementById("txt-password");
  const btnLogin = document.getElementById("btn-login");
  const loginError = document.getElementById("login-error");

  // Dashboard Elements
  const stateDashboard = document.getElementById("state-dashboard");
  const todayDietScore = document.getElementById("today-diet-score");
  const dietScoreLabel = document.getElementById("diet-score-label");
  const topVisitedList = document.getElementById("top-visited-list");
  const btnDashboard = document.getElementById("btn-dashboard");

  // Safe helper to open URLs
  function openUrl(url) {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  }

  // Safe helper to get from storage
  function getStorage(keys, callback) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, callback);
    } else {
      const mock = {
        token: localStorage.getItem("token") || "demo_token",
        user: JSON.parse(localStorage.getItem("user") || '{"username":"demo"}'),
        signupRedirected: localStorage.getItem("signupRedirected") === "true"
      };
      callback(mock);
    }
  }

  // Safe helper to set storage
  function setStorage(data, callback) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, callback);
    } else {
      for (const k in data) {
        if (typeof data[k] === "object") {
          localStorage.setItem(k, JSON.stringify(data[k]));
        } else {
          localStorage.setItem(k, data[k]);
        }
      }
      if (callback) callback();
    }
  }

  // Safe helper to remove storage
  function removeStorage(keys, callback) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(keys, callback);
    } else {
      keys.forEach(k => localStorage.removeItem(k));
      if (callback) callback();
    }
  }

  // Check login state first
  function checkAuthState() {
    getStorage(["token", "user", "signupRedirected"], (res) => {
      const userDisplay = document.getElementById("user-display");
      if (res.token) {
        lnkLogout.style.display = "block";
        if (userDisplay && res.user && res.user.username) {
          userDisplay.textContent = `@${res.user.username}`;
          userDisplay.style.display = "block";
        } else if (userDisplay) {
          userDisplay.style.display = "none";
        }
        stateLogin.style.display = "none";
        stateDashboard.style.display = "flex";
        fetchDashboardData(res.token);
      } else {
        lnkLogout.style.display = "none";
        if (userDisplay) userDisplay.style.display = "none";
        stateLogin.style.display = "flex";
        stateDashboard.style.display = "none";

        // Automatically redirect user to the website for registration once
        if (!res.signupRedirected) {
          setStorage({ signupRedirected: true }, () => {
            openUrl("http://localhost:5173/auth?mode=signup");
          });
        }
      }
    });
  }

  // Fetch stats and history from the dashboard API
  function fetchDashboardData(token) {
    fetch("http://localhost:5000/api/activity/dashboard", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      // 1. Update overall daily Diet Score
      if (data && data.today) {
        const score = data.today.score !== undefined ? data.today.score : 0;
        
        const circleVal = document.getElementById("circle-score-val");
        const circleProgress = document.getElementById("score-circle-progress");
        
        if (circleVal) circleVal.textContent = score;
        if (circleProgress) {
          const circumference = 263.89;
          const offset = circumference - (score / 100) * circumference;
          circleProgress.style.strokeDashoffset = offset;
        }
        
        if (dietScoreLabel) {
          dietScoreLabel.textContent = data.today.label || "No Data Yet";
        }
        if (todayDietScore) {
          todayDietScore.textContent = `${score}/100`;
        }
      }

      // 2. Render top 3 visited websites
      if (data && data.topWebsites && topVisitedList) {
        topVisitedList.innerHTML = "";
        
        const topItems = data.topWebsites.slice(0, 3);
        if (topItems.length === 0) {
          topVisitedList.innerHTML = `<div style="font-size: 11px; color: var(--text-secondary); text-align: center; padding: 10px;">No domains visited today (min 90s stay required).</div>`;
          return;
        }
        
        topItems.forEach(site => {
          const item = document.createElement("div");
          item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px;";
          
          item.innerHTML = `
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">
              <div style="font-size: 13px; font-weight: 500; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${site.url}</div>
              <div style="font-size: 11px; color: var(--text-secondary);">${site.category || 'General'}</div>
            </div>
            <div style="font-size: 13px; font-weight: 600; color: var(--accent-purple);">${site.time}</div>
          `;
          topVisitedList.appendChild(item);
        });
      }
    })
    .catch(err => {
      console.error("Error fetching dashboard stats:", err);
      if (topVisitedList) {
        topVisitedList.innerHTML = `<div style="font-size: 11px; color: var(--text-secondary); text-align: center; padding: 10px;">Failed to load history.</div>`;
      }
    });
  }

  // Manual Register Link Click
  lnkRegister.addEventListener("click", () => {
    openUrl("http://localhost:5173/auth?mode=signup");
  });

  // Visit Dashboard Button Click
  if (btnDashboard) {
    btnDashboard.addEventListener("click", () => {
      openUrl("http://localhost:5173/dashboard");
    });
  }

  // Visit Dashboard via more info button
  const btnMoreInfo = document.getElementById("btn-more-info");
  if (btnMoreInfo) {
    btnMoreInfo.addEventListener("click", () => {
      openUrl("http://localhost:5173/dashboard");
    });
  }

  // Handle Login Click
  btnLogin.addEventListener("click", () => {
    const username = txtUsername.value.trim();
    const password = txtPassword.value.trim();
    loginError.style.display = "none";

    if (!username || !password) {
      loginError.textContent = "Please fill in all fields.";
      loginError.style.display = "block";
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Authenticating...";

    fetch("http://localhost:5000/api/activity/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
      btnLogin.disabled = false;
      btnLogin.textContent = "Sign In";

      if (data.success) {
        setStorage({
          token: data.token,
          user: data.user
        }, () => {
          checkAuthState();
        });
      } else {
        loginError.textContent = data.message || "Invalid credentials.";
        loginError.style.display = "block";
      }
    })
    .catch(err => {
      console.error(err);
      btnLogin.disabled = false;
      btnLogin.textContent = "Sign In";
      loginError.textContent = "Cannot reach authentication server.";
      loginError.style.display = "block";
    });
  });

  // Handle Logout Click
  lnkLogout.addEventListener("click", () => {
    removeStorage(["token", "user", "lastAnalysis"], () => {
      txtUsername.value = "";
      txtPassword.value = "";
      checkAuthState();
    });
  });

  // Listen for changes (e.g. background reports finish) to refresh stats
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes.lastAnalysis) {
        getStorage("token", (res) => {
          if (res.token) {
            fetchDashboardData(res.token);
          }
        });
      }
    });
  }

  // Initial update
  checkAuthState();
});
