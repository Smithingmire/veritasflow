const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  id: { type: String, required: true },
  username: { type: String, required: true },
  url: { type: String, required: true },
  domain: { type: String, required: true },
  title: { type: String, required: true },
  duration: { type: Number, required: true },
  analysis: {
    status: { type: String, default: "analyzing" },
    summary: { type: String, default: "AI is analyzing this content..." },
    keyPoints: { type: [String], default: ["Analyzing..."] },
    learningScore: { type: Number, default: 50 },
    fakeNewsRisk: { type: String, default: "Low" },
    socialImpactScore: { type: Number, default: 50 },
    careerRecommendation: { type: String, default: "Analyzing..." },
    contentCategory: { type: String, default: "Analyzing..." },
    difficultyLevel: { type: String, default: "Intermediate" },
    sentiment: { type: String, default: "Neutral" }
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Activity", ActivitySchema);
