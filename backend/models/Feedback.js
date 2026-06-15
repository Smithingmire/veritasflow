const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  username: { type: String, required: true },
  feedbackText: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
