const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const analyzeRoutes = require("./routes/analyzeRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Backend Running");
});

app.use("/api/analyze", analyzeRoutes);
app.use("/api/activity", activityRoutes);

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/veritasflow";
mongoose.connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(process.env.PORT, () => {
      console.log(`Server Running On Port ${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
  });