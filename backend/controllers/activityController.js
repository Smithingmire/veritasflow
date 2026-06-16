const mongoose = require("mongoose");
const User = require("../models/User");
const Activity = require("../models/Activity");
const Feedback = require("../models/Feedback");
const analyzeContent = require("../services/openRouterService");
const parseGeminiResponse = require("../utils/jsonParser");

// Helper to extract domain from URL
function getDomain(url) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : "https://" + url);
    return parsed.hostname.replace("www.", "");
  } catch (e) {
    return url;
  }
}

// Helper to convert seconds to readable string
function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}

// Add a tracked website activity
exports.addActivity = async (req, res) => {
  try {
    const { url, title, duration, channel } = req.body;
    if (!url || !title) {
      return res.status(400).json({ success: false, message: "URL and Title are required." });
    }

    const domain = getDomain(url);
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(401).json({ success: false, message: "User session expired." });
    }

    const userSettings = user.settings || {
      trackedWebsites: ["youtube.com", "reddit.com", "twitter.com", "medium.com", "wikipedia.org"],
      blockedWebsites: ["instagram.com", "tiktok.com"],
      focusMode: false
    };

    // Check if the domain is on the user's tracked list
    const isTracked = userSettings.trackedWebsites.some(site => 
      domain.includes(site) || site.includes(domain)
    );

    if (!isTracked) {
      return res.json({ success: true, tracked: false, message: "Website is not in the user's tracked list." });
    }

    // Find the last activity for this user to aggregate duration if they are still on the same page
    const lastActivity = await Activity.findOne({ username: req.user.username }).sort({ timestamp: -1 });

    const cleanUrlString = (u) => {
      try {
        const p = new URL(u);
        let c = p.origin + p.pathname;
        return c.endsWith("/") ? c.slice(0, -1).toLowerCase() : c.toLowerCase();
      } catch (e) {
        let c = u.toLowerCase().split(/[?#]/)[0];
        return c.endsWith("/") ? c.slice(0, -1) : c;
      }
    };

    if (lastActivity && cleanUrlString(lastActivity.url) === cleanUrlString(url)) {
      console.log(`Aggregating duration for same URL: ${url} (+${duration}s)`);
      lastActivity.duration = (lastActivity.duration || 0) + (duration || 10);
      lastActivity.timestamp = new Date();
      await lastActivity.save();

      return res.json({
        success: true,
        tracked: true,
        activity: lastActivity
      });
    }

    // Check if we already analyzed this URL/Title recently to save API credits
    const existingActivity = await Activity.findOne({ 
      username: req.user.username, 
      $or: [{ url }, { title }] 
    });
    
    const activityId = Date.now().toString();
    const newActivity = new Activity({
      id: activityId,
      username: req.user.username,
      url,
      domain,
      title,
      duration: duration || 10,
      channel,
      analysis: {
        status: "analyzing",
        summary: "AI is analyzing this content...",
        keyPoints: ["Analyzing..."],
        learningScore: 50,
        fakeNewsRisk: "Low",
        socialImpactScore: 50,
        careerRecommendation: "Analyzing...",
        contentCategory: "Analyzing...",
        difficultyLevel: "Intermediate",
        sentiment: "Neutral"
      },
      timestamp: new Date()
    });

    await newActivity.save();

    // Send instant success response
    res.json({
      success: true,
      tracked: true,
      activity: newActivity
    });

    // Run AI analysis asynchronously in the background
    (async () => {
      let analysis = null;
      if (existingActivity && existingActivity.analysis && existingActivity.analysis.status === "success") {
        analysis = existingActivity.analysis;
        console.log("Reusing cached analysis for:", title);
      } else {
        try {
          const result = await analyzeContent({ url, title });
          const textResponse = result.choices[0].message.content;
          analysis = parseGeminiResponse(textResponse);
          if (!analysis || analysis.error) {
            throw new Error("Invalid JSON parsed from AI response");
          }
        } catch (err) {
          console.error("Background Content analysis failed, using fallback metrics:", err.message);
          analysis = {
            summary: "This content was successfully logged on " + domain + ".",
            keyPoints: [
              "Content analyzed: " + title,
              "Logged duration of stay for information diet scoring.",
              "Category classified under " + (domain.includes("wikipedia") ? "Education" : domain.includes("youtube") ? "Entertainment" : "General Study") + "."
            ],
            learningScore: domain.includes("wikipedia") || domain.includes("github") ? 85 : 40,
            fakeNewsRisk: "Low",
            socialImpactScore: 50,
            careerRecommendation: "General Skill Acquisition",
            contentCategory: domain.includes("wikipedia") ? "Education" : domain.includes("youtube") ? "Entertainment" : "Social Media",
            difficultyLevel: "Intermediate",
            sentiment: "Neutral"
          };
        }
      }

      // Update the specific activity
      const actToUpdate = await Activity.findOne({ id: activityId });
      if (actToUpdate) {
        actToUpdate.analysis = {
          ...analysis,
          status: "success"
        };
        await actToUpdate.save();
        console.log(`Background AI analysis complete and saved for activity ${activityId}: ${title}`);
      }
    })();
  } catch (error) {
    console.error("Error in addActivity:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get settings for the authenticated user
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(401).json({ error: "User session expired." });
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update settings for the authenticated user
exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(401).json({ error: "User session expired." });

    const { trackedWebsites, blockedWebsites, focusMode } = req.body;

    if (!user.settings) {
      user.settings = { trackedWebsites: [], blockedWebsites: [], focusMode: false };
    }

    if (trackedWebsites !== undefined) user.settings.trackedWebsites = trackedWebsites;
    if (blockedWebsites !== undefined) user.settings.blockedWebsites = blockedWebsites;
    if (focusMode !== undefined) user.settings.focusMode = focusMode;

    await user.save();
    res.json({ success: true, settings: user.settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard aggregated stats for the authenticated user
exports.getDashboard = async (req, res) => {
  try {
    const userActivities = await Activity.find({ username: req.user.username });

    // Filter activities for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayActivities = userActivities.filter(act => new Date(act.timestamp) >= startOfToday);

    // Filter for display: only show activities with >= 90 seconds duration
    const MIN_DISPLAY_DURATION = 90;
    const todayActivitiesForDisplay = todayActivities.filter(act => act.duration >= MIN_DISPLAY_DURATION);

    // 1. Calculate Today's Diet Score (Weighted by duration)
    let totalTodayDuration = 0;
    let weightedScoreSum = 0;
    let categoryTimes = {};
    let uniqueDomains = new Set();

    todayActivities.forEach(act => {
      const dur = act.duration;
      totalTodayDuration += dur;
      uniqueDomains.add(act.domain);

      const score = (act.analysis && act.analysis.learningScore) || 50;
      weightedScoreSum += score * dur;

      const cat = (act.analysis && act.analysis.contentCategory) || "General";
      categoryTimes[cat] = (categoryTimes[cat] || 0) + dur;
    });

    // Zero-based: new users start at 0, not a fake fallback
    const todayDietScore = totalTodayDuration > 0 
      ? Math.round(weightedScoreSum / totalTodayDuration) 
      : 0;

    // Calculate components breakdown
    const qualityScore = todayDietScore;
    const timeSpentHours = totalTodayDuration / 3600;
    const timeBalanceVal = totalTodayDuration > 0
      ? Math.max(30, Math.min(100, Math.round(100 - (timeSpentHours > 4 ? (timeSpentHours - 4) * 10 : 0))))
      : 0;

    const categoryCount = Object.keys(categoryTimes).length;
    const diversityVal = categoryCount > 0 ? Math.min(100, 40 + categoryCount * 15) : 0;

    let constructiveTime = 0;
    todayActivities.forEach(act => {
      const cat = ((act.analysis && act.analysis.contentCategory) || "").toLowerCase();
      if (cat.includes("education") || cat.includes("tech") || cat.includes("science") || cat.includes("development")) {
        constructiveTime += act.duration;
      }
    });
    const focusVal = totalTodayDuration > 0 ? Math.round((constructiveTime / totalTodayDuration) * 100) : 0;

    const todayData = {
      score: todayDietScore,
      label: userActivities.length === 0 ? "No Data Yet" : (todayDietScore >= 75 ? "Excellent" : todayDietScore >= 55 ? "Good" : "Needs Improvement"),
      breakdown: [
        { name: "Content Quality", val: qualityScore },
        { name: "Time Balance", val: timeBalanceVal },
        { name: "Diversity", val: diversityVal },
        { name: "Focus Ratio", val: focusVal }
      ]
    };

    // 2. Aggregate Top Visited Websites (today only, >= 90s activities)
    const siteAggregations = {};
    todayActivitiesForDisplay.forEach(act => {
      const dom = act.domain;
      if (!siteAggregations[dom]) {
        siteAggregations[dom] = {
          url: dom,
          timeRaw: 0,
          category: (act.analysis && act.analysis.contentCategory) || "General"
        };
      }
      siteAggregations[dom].timeRaw += act.duration;
    });

    const topWebsites = Object.values(siteAggregations)
      .sort((a, b) => b.timeRaw - a.timeRaw)
      .slice(0, 5)
      .map(site => ({
        url: site.url,
        time: formatDuration(site.timeRaw),
        category: site.category
      }));

    // 3. Compile Suggestions
    const suggestions = [];
    if (userActivities.length > 0) {
      if (todayDietScore < 50) {
        suggestions.push("Your diet score is below 50%. Try focusing on high-quality educational or productive content instead of mindless feeds.");
      } else {
        suggestions.push("Your content consumption is good! Keep up the healthy information diet.");
      }
    }

    // 4. Generate dynamic improvements log
    const improvements = [
      { date: "Today", text: totalTodayDuration > 0 ? `Tracked ${formatDuration(totalTodayDuration)} of active learning session` : "No website activity recorded yet today." }
    ];
    if (userActivities.length > 5) {
      improvements.push({ date: "Yesterday", text: `Consistently consuming ${todayData.label.toLowerCase()} content.` });
    }

    // 5. Weekly Data (Current calendar week, starting from Monday)
    // Find the most recent Monday
    const today = new Date();
    const todayDateStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const distanceToMonday = (currentDay === 0 ? 6 : currentDay - 1);
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    // Create a map of the 7 days of the current week (Monday to Sunday)
    const weeklyMap = {};
    const orderedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weekDateStrings = []; // track ordered date strings
    
    orderedDays.forEach((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      
      const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
      weekDateStrings.push(dateStr);
      
      weeklyMap[dateStr] = {
        day: dayName,
        dateStr: dateStr,
        isToday: dateStr === todayDateStr,
        score: 0,
        focus: 0,
        distracted: 0,
        topSite: "None",
        count: 0,
        sumScores: 0,
        weightedScoreSum: 0,
        totalDuration: 0
      };
    });

    // Build a map of activities grouped by date for the week
    const weekActivitiesMap = {};
    weekDateStrings.forEach(ds => { weekActivitiesMap[ds] = []; });

    userActivities.forEach(act => {
      const actDate = new Date(act.timestamp);
      const actDateStr = actDate.getFullYear() + "-" + String(actDate.getMonth() + 1).padStart(2, '0') + "-" + String(actDate.getDate()).padStart(2, '0');
      
      if (weeklyMap[actDateStr]) {
        const dayData = weeklyMap[actDateStr];
        const cat = ((act.analysis && act.analysis.contentCategory) || "").toLowerCase();
        const isDistraction = cat.includes("social") || cat.includes("entertainment") || cat.includes("game");
        
        if (isDistraction) {
          dayData.distracted += act.duration;
        } else {
          dayData.focus += act.duration;
        }
        
        const actScore = (act.analysis && act.analysis.learningScore) || 50;
        dayData.sumScores += actScore;
        dayData.weightedScoreSum += actScore * act.duration;
        dayData.totalDuration += act.duration;
        dayData.count++;
        
        if (dayData.topSite === "None" || act.duration > 30) {
          dayData.topSite = act.domain;
        }

        // Add to activities map for this date (only if >= 90s)
        if (act.duration >= MIN_DISPLAY_DURATION) {
          weekActivitiesMap[actDateStr].push({
            id: act.id,
            url: act.url,
            domain: act.domain,
            title: act.title,
            duration: act.duration,
            channel: act.channel,
            analysis: act.analysis,
            timestamp: act.timestamp
          });
        }
      }
    });

    const weeklyData = weekDateStrings.map(dateStr => {
      const dayData = weeklyMap[dateStr];
      // Daily diet score: weighted by duration (not simple average)
      const dailyDietScore = dayData.totalDuration > 0 
        ? Math.round(dayData.weightedScoreSum / dayData.totalDuration) 
        : 0;
      return {
        day: dayData.day,
        dateStr: dayData.dateStr,
        isToday: dayData.isToday,
        score: dailyDietScore,
        focus: formatDuration(dayData.focus),
        distracted: formatDuration(dayData.distracted),
        topSite: dayData.topSite
      };
    });

    // 6. Monthly Data (last 4 calendar weeks, each starting from Monday)
    const monthlyData = [];
    for (let week = 0; week < 4; week++) {
      // Each week ends on the Sunday before the previous week's Monday
      const weekStart = new Date(monday);
      weekStart.setDate(monday.getDate() - (week * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      weekEnd.setHours(0, 0, 0, 0);

      const weekActivities = userActivities.filter(act => {
        const t = new Date(act.timestamp);
        return t >= weekStart && t < weekEnd;
      });

      let wFocus = 0, wDistracted = 0, wWeightedScoreSum = 0, wTotalDuration = 0, wCount = 0, wTopSite = "None";
      weekActivities.forEach(act => {
        const cat = ((act.analysis && act.analysis.contentCategory) || "").toLowerCase();
        const isDistraction = cat.includes("social") || cat.includes("entertainment") || cat.includes("game");
        if (isDistraction) { wDistracted += act.duration; } else { wFocus += act.duration; }
        const actScore = (act.analysis && act.analysis.learningScore) || 50;
        wWeightedScoreSum += actScore * act.duration;
        wTotalDuration += act.duration;
        wCount++;
        if (wTopSite === "None") wTopSite = act.domain;
      });

      // Format date range label
      const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endDate = new Date(weekEnd);
      endDate.setDate(endDate.getDate() - 1);
      const endLabel = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      monthlyData.unshift({
        day: week === 0 ? "This Week" : `Week ${4 - week}`,
        dateRange: `${startLabel} – ${endLabel}`,
        score: wTotalDuration > 0 ? Math.round(wWeightedScoreSum / wTotalDuration) : 0,
        avgDietScore: wTotalDuration > 0 ? Math.round(wWeightedScoreSum / wTotalDuration) : 0,
        focus: formatDuration(wFocus),
        distracted: formatDuration(wDistracted),
        topSite: wTopSite,
        totalActivities: wCount
      });
    }

    res.json({
      today: todayData,
      topWebsites,
      suggestions,
      improvements,
      weeklyData,
      monthlyData,
      weekActivitiesMap,
      activities: todayActivitiesForDisplay.map(act => ({
        id: act.id,
        url: act.url,
        domain: act.domain,
        title: act.title,
        duration: act.duration,
        channel: act.channel,
        analysis: act.analysis,
        timestamp: act.timestamp
      }))
    });
  } catch (error) {
    console.error("Error generating dashboard data:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add user feedback (maximum one per user)
exports.addFeedback = async (req, res) => {
  try {
    const { feedbackText } = req.body;
    if (!feedbackText || feedbackText.trim() === "") {
      return res.status(400).json({ success: false, message: "Feedback content is required." });
    }

    // Check database connection state
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: "Database connection offline. Please provide your MONGODB_URI connection string to start submitting feedback!" 
      });
    }

    // Check if feedback already submitted by this user
    const existingFeedback = await Feedback.findOne({ username: req.user.username });
    if (existingFeedback) {
      return res.status(400).json({ success: false, message: "You have already submitted feedback! Users are limited to one submission." });
    }

    const newFeedback = new Feedback({
      username: req.user.username,
      feedbackText: feedbackText.trim()
    });

    await newFeedback.save();
    res.json({ success: true, message: "Feedback submitted successfully!", feedback: newFeedback });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all feedbacks for homepage (public)
exports.getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ timestamp: -1 });
    res.json({ success: true, feedbacks });
  } catch (error) {
    console.error("Error retrieving feedbacks:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
