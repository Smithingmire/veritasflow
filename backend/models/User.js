const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  consent: { type: Boolean, default: false },
  token: { type: String, required: true },
  settings: {
    trackedWebsites: { 
      type: [String], 
      default: ["youtube.com", "reddit.com", "twitter.com", "medium.com", "wikipedia.org"] 
    },
    blockedWebsites: { 
      type: [String], 
      default: ["instagram.com", "tiktok.com"] 
    },
    focusMode: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("User", UserSchema);
