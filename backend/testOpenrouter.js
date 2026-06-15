const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const axios = require("axios");

async function test() {
    try {

        console.log("Testing OpenRouter...");

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openrouter/free",
                messages: [
                    {
                        role: "user",
                        content: `Analyze this YouTube video based on its title and channel.

Title: DSA Roadmap 2026 + Internship & Placement Guidance + Live Q&A - YouTube
Channel: Harshit Trehan

Provide a response in JSON format. Fill in all fields with your analysis. Do NOT leave them empty.

Expected JSON output format:
{
  "summary": "1-2 sentence summary of what the video is about.",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "learningScore": 85,
  "fakeNewsRisk": "Low",
  "socialImpactScore": 75,
  "careerRecommendation": "Software Engineer / Tech placement seeker",
  "contentCategory": "Education / Tech",
  "difficultyLevel": "Intermediate"
}`
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        console.log("SUCCESS:");
        console.log(response.data);

    } catch (err) {

        console.error("ERROR:");

        if (err.response) {
            console.error(err.response.status);
            console.error(err.response.data);
        } else {
            console.error(err.message);
        }

    }
}

test();