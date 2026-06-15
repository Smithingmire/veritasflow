function parseGeminiResponse(text) {
  try {
    if (!text) {
      throw new Error("Empty response from AI");
    }

    // Try finding JSON object using curly braces index
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      let jsonString = text.substring(startIndex, endIndex + 1);
      
      // Clean common LLM JSON syntax issues:
      // 1. Remove trailing commas before closing braces/brackets
      jsonString = jsonString.replace(/,\s*([\]}])/g, '$1');
      // 2. Replace unescaped newlines within string values with space to prevent parse failures
      jsonString = jsonString.replace(/\r?\n/g, ' ');
      
      return JSON.parse(jsonString);
    }

    // Fallback: clean standard markdown code blocks
    let cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    cleanedText = cleanedText.replace(/,\s*([\]}])/g, '$1').replace(/\r?\n/g, ' ');
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("JSON Parse Error. Raw text was:", text, "Error:", error);
    return {
      error: true,
      message: "Invalid JSON from Gemini"
    };
  }
}

module.exports = parseGeminiResponse;