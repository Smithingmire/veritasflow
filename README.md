# VeritasFlow — AI-Powered Information Diet Tracker

VeritasFlow is a browser extension + web dashboard that tracks your online content consumption across websites like YouTube, Reddit, Twitter, Medium, and Wikipedia. It uses AI to analyze every piece of content you consume and calculates a personalized **Information Diet Score** — helping you build healthier browsing habits.

## What It Does

- **Tracks browsing activity** on user-configured websites via a Chrome extension
- **AI-powered content analysis** — every tracked page/video gets analyzed for sentiment, category, learning value, and fake news risk
- **Diet Score** — a daily score (0–100) weighted by time spent, reflecting the quality of your content consumption
- **Filter Bubble Detection** — warns when your consumption is skewed toward negative, entertainment-heavy, or echo-chamber content
- **Analytics Dashboard** — weekly, monthly, and yearly breakdowns with focus vs distraction time
- **Focus Mode** — block distracting websites during deep work sessions

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React + TypeScript, Vite, Vanilla CSS |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Extension | Chrome Manifest V3 (background service worker, content scripts) |
| AI | OpenRouter API (content analysis, sentiment, categorization) |
| Hosting | Vercel (frontend), Render (backend) |

## Project Structure

```
veritasflow/
├── frontend/          # React dashboard (Vite + TypeScript)
│   └── src/
│       ├── pages/     # Dashboard.tsx, Home.tsx
│       ├── components/
│       ├── services/  # Auth service
│       └── styles/
├── backend/           # Express API server
│   ├── controllers/   # activityController, authController
│   ├── models/        # Activity, User, Feedback (Mongoose)
│   ├── routes/
│   ├── services/      # OpenRouter AI integration
│   └── server.js
└── extension/         # Chrome extension (Manifest V3)
    ├── background.js  # Tracks tab activity, sends to backend
    ├── popup.html/js  # Extension popup with diet score + top domains
    └── manifest.json
```

## Setup

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_openrouter_key
PORT=5000
```

```bash
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Chrome Extension

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` folder
4. The VeritasFlow icon appears in the toolbar — log in with your credentials

## How Scoring Works

### Diet Score (0–100)

Each piece of content gets a `learningScore` from AI analysis. Your daily diet score is the **duration-weighted average** of all content scores:

```
dietScore = Σ(learningScore × duration) / Σ(duration)
```

### Focus vs Distracted Time

- **Focus** — time spent on content categorized as Education, Tech, Science, or Development
- **Distracted** — time spent on Social Media, Entertainment, or Gaming content

### Display Threshold

Activities under **90 seconds** are excluded from the dashboard display to filter out accidental clicks and quick skips. They still count toward the diet score calculation.

### Analytics Periods

- **Weekly** — current calendar week (Monday–Sunday), click any day to see that day's content
- **Monthly** — last 4 calendar weeks, shows average diet score per week
- **Yearly** — last 12 months, aggregated per month

### Doomscrolling Detection

The extension monitors time spent on short-form content (YouTube Shorts, Instagram Reels, TikTok). If a user scrolls continuously for **5+ minutes**, a fullscreen reminder overlay is injected on the page with two options:

- **Close Tab** — immediately exits the doomscroll session
- **5 More Minutes** — dismisses the reminder and resets the timer

Each reminder event is logged to the backend. The dashboard shows a **Doomscrolling Index** card with today's and this week's reminder count and total doom-scroll time.

## Environment

- **Node.js** >= 18
- **MongoDB** (Atlas or local)
- **Chrome** (for the extension)
