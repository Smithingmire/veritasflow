const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Authorization header missing." });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing from Authorization header." });
    }

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid session token." });
    }

    // Attach user profile to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ success: false, message: "Authentication check failed." });
  }
};
