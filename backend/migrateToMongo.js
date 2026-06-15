const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const fs = require("fs");
const mongoose = require("mongoose");
const User = require("./models/User");
const Activity = require("./models/Activity");

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI || mongoURI.includes("<username>")) {
  console.error("ERROR: Please specify a valid MONGODB_URI in your backend/backend/.env file first.");
  process.exit(1);
}

const usersPath = path.join(__dirname, "users.json");
const dbPath = path.join(__dirname, "database.json");

async function migrate() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoURI);
    console.log("Connected successfully.");

    // 1. Migrate Users
    if (fs.existsSync(usersPath)) {
      const localUsers = JSON.parse(fs.readFileSync(usersPath, "utf8"));
      console.log(`Found ${localUsers.length} users to migrate.`);
      for (const u of localUsers) {
        // Upsert by username
        await User.findOneAndUpdate(
          { username: u.username },
          u,
          { upsert: true, new: true }
        );
      }
      console.log("Users migrated successfully.");
    } else {
      console.log("No local users.json found. Skipping user migration.");
    }

    // 2. Migrate Activities
    if (fs.existsSync(dbPath)) {
      const localActivities = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      const activitiesToMigrate = Array.isArray(localActivities) 
        ? localActivities 
        : localActivities.activities || [];
      
      console.log(`Found ${activitiesToMigrate.length} activities to migrate.`);
      for (const act of activitiesToMigrate) {
        // Upsert by activity id
        await Activity.findOneAndUpdate(
          { id: act.id },
          act,
          { upsert: true, new: true }
        );
      }
      console.log("Activities migrated successfully.");
    } else {
      console.log("No local database.json found. Skipping activity migration.");
    }

    console.log("Database migration complete!");
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

migrate();
