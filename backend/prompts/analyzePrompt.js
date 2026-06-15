exports.analysisPrompt = (video) => `
Analyze this YouTube video.

Title: ${video.title}
Channel: ${video.channel}
URL: ${video.url}

Return ONLY valid JSON.

{
  "summary":"",
  "keyPoints":[],
  "learningScore":0,
  "socialImpactScore":0,
  "credibilityScore":0,
  "fakeNewsRisk":"",
  "careerPaths":[],
  "quiz":[]
}
`;