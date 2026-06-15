const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database.json"); // Stores activities
const usersPath = path.join(__dirname, "../users.json"); // Stores user information

// Default initial state
const defaultUsers = [
  { 
    username: 'demo', 
    email: 'demo@veritasflow.app', 
    password: 'password', 
    consent: true, 
    token: 'tk_demo',
    settings: {
      trackedWebsites: ["youtube.com", "reddit.com", "twitter.com", "medium.com", "wikipedia.org"],
      blockedWebsites: ["instagram.com", "tiktok.com"],
      focusMode: false
    }
  }
];

function readDb() {
  try {
    let users = [];
    let activities = [];

    // 1. Read Users
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    } else {
      // Try to migrate from existing database.json
      if (fs.existsSync(dbPath)) {
        try {
          const oldData = JSON.parse(fs.readFileSync(dbPath, "utf8"));
          if (oldData.users && oldData.users.length > 0) {
            users = oldData.users;
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
            console.log("Migrated users list to users.json successfully.");
          }
        } catch (e) {
          console.error("Failed to migrate users from database.json:", e.message);
        }
      }
      
      if (users.length === 0) {
        users = defaultUsers;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      }
    }

    // 2. Read Activities
    if (fs.existsSync(dbPath)) {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      if (Array.isArray(dbContent)) {
        activities = dbContent;
      } else if (dbContent.activities) {
        activities = dbContent.activities;
      }
    } else {
      fs.writeFileSync(dbPath, JSON.stringify(activities, null, 2));
    }

    // Safeguard user settings
    users.forEach(u => {
      if (!u.settings) {
        u.settings = {
          trackedWebsites: ["youtube.com", "reddit.com", "twitter.com", "medium.com", "wikipedia.org"],
          blockedWebsites: ["instagram.com", "tiktok.com"],
          focusMode: false
        };
      }
    });

    return { users, activities };
  } catch (error) {
    console.error("Error reading database files:", error);
    return { users: defaultUsers, activities: [] };
  }
}

function writeDb(data) {
  try {
    if (data.users) {
      fs.writeFileSync(usersPath, JSON.stringify(data.users, null, 2));
    }
    if (data.activities) {
      fs.writeFileSync(dbPath, JSON.stringify(data.activities, null, 2));
    }
    return true;
  } catch (error) {
    console.error("Error writing database files:", error);
    return false;
  }
}

module.exports = {
  readDb,
  writeDb
};
