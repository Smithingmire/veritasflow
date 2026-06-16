const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://veritasflow-yrbx.onrender.com";

class AuthService {
  async signup(username, email, password, consent) {
    try {
      const res = await fetch(`${API_BASE}/api/activity/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, consent })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vf_current_user', JSON.stringify(data.user));
        localStorage.setItem('vf_token', data.token);
        
        // Sync session with the extension
        window.postMessage({ type: "VERITASFLOW_AUTH_SYNC", token: data.token, user: data.user }, "*");
        return { success: true };
      } else {
        return { success: false, message: data.message || "Registration failed." };
      }
    } catch (e) {
      console.error("Signup error:", e);
      return { success: false, message: "Server connection failed." };
    }
  }

  async login(username, password) {
    try {
      const res = await fetch(`${API_BASE}/api/activity/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vf_current_user', JSON.stringify(data.user));
        localStorage.setItem('vf_token', data.token);

        // Sync session with the extension
        window.postMessage({ type: "VERITASFLOW_AUTH_SYNC", token: data.token, user: data.user }, "*");
        return { success: true };
      } else {
        return { success: false, message: data.message || "Invalid credentials." };
      }
    } catch (e) {
      console.error("Login error:", e);
      return { success: false, message: "Server connection failed." };
    }
  }

  logout() {
    localStorage.removeItem('vf_current_user');
    localStorage.removeItem('vf_token');
    // Sync session with the extension (clear it)
    window.postMessage({ type: "VERITASFLOW_AUTH_SYNC", token: null, user: null }, "*");
  }

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('vf_current_user'));
    } catch {
      return null;
    }
  }

  getToken() {
    return localStorage.getItem('vf_token');
  }
}

export const authService = new AuthService();
