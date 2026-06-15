/**
 * VeritasFlow — Authentication Service
 * Integrated with the Node.js backend.
 */
class AuthService {
  async signup(username, email, password, consent) {
    try {
      const res = await fetch("http://localhost:5000/api/activity/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, consent })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vf_current_user', JSON.stringify(data.user));
        localStorage.setItem('vf_token', data.token);
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
      const res = await fetch("http://localhost:5000/api/activity/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vf_current_user', JSON.stringify(data.user));
        localStorage.setItem('vf_token', data.token);
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
