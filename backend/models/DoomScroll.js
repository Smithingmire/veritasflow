const mongoose = require("mongoose");

const DoomScrollSchema = new mongoose.Schema({
  username: { type: String, required: true },
  duration: { type: Number, required: true },
  url: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DoomScroll", DoomScrollSchema);
