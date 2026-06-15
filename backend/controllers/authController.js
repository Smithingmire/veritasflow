const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { username, email, password, consent } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email and password are required." });
    }

    if (!consent) {
      return res.status(400).json({ success: false, message: "Tracking consent is required to register." });
    }

    const existingUser = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already taken." });
    }

    const token = "tk_" + Math.random().toString(36).substr(2, 9);
    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      consent,
      token,
      settings: {
        trackedWebsites: ["youtube.com", "reddit.com", "twitter.com", "medium.com", "wikipedia.org"],
        blockedWebsites: ["instagram.com", "tiktok.com"],
        focusMode: false
      }
    });

    await newUser.save();

    res.json({
      success: true,
      user: { username: newUser.username, email: newUser.email, consent: newUser.consent },
      token: newUser.token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp("^" + username + "$", "i") } },
        { email: { $regex: new RegExp("^" + username + "$", "i") } }
      ]
    });

    if (!user || user.password !== password) {
      return res.status(400).json({ success: false, message: "Invalid username or password." });
    }

    if (!user.consent) {
      return res.status(400).json({ success: false, message: "Tracking consent is required. Please update your consent status on the dashboard." });
    }

    // Initialize settings if they are missing
    if (!user.settings) {
      user.settings = {
        trackedWebsites: ["youtube.com", "reddit.com", "twitter.com", "medium.com", "wikipedia.org"],
        blockedWebsites: ["instagram.com", "tiktok.com"],
        focusMode: false
      };
      await user.save();
    }

    res.json({
      success: true,
      user: { username: user.username, email: user.email, consent: user.consent },
      token: user.token || "tk_demo"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
