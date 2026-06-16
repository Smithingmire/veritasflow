const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  addActivity,
  getSettings,
  updateSettings,
  getDashboard,
  addFeedback,
  getFeedbacks,
  logDoomscroll
} = require("../controllers/activityController");
const { register, login, getUserCount } = require("../controllers/authController");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/users/count", getUserCount);

router.post("/", authMiddleware, addActivity);
router.get("/dashboard", authMiddleware, getDashboard);
router.get("/settings", authMiddleware, getSettings);
router.post("/settings", authMiddleware, updateSettings);
router.post("/doomscroll", authMiddleware, logDoomscroll);

router.post("/feedback", authMiddleware, addFeedback);
router.get("/feedback/list", getFeedbacks);

module.exports = router;
