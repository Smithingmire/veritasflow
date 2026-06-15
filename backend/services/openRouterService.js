const axios = require("axios");

async function analyzeContent(contentData) {
    console.log("Calling OpenRouter to analyze content...", contentData.title);

    const prompt = `
Analyze this website or video content based on its title and URL.

Title: "${contentData.title}"
URL: "${contentData.url}"

Provide an analysis in JSON format. Fill in all fields with your analysis. Do NOT leave them empty.

Expected JSON output format:
{
  "summary": "1-2 sentence summary of what the content is about.",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "learningScore": 85,
  "fakeNewsRisk": "Low/Medium/High",
  "socialImpactScore": 75,
  "careerRecommendation": "Suggested career path or skill related to this content",
  "contentCategory": "Social Media / Technology / Education / News / Forum / Blog / Entertainment / Science",
  "difficultyLevel": "Beginner/Intermediate/Advanced",
  "sentiment": "Positive/Neutral/Negative"
}
`;

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openrouter/free",
                messages: [
                    {
                        role: "user",
                        content: prompt
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

        console.log("OpenRouter Success");
        return response.data;
    } catch (error) {
        console.error("OpenRouter API Error:", error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = analyzeContent;