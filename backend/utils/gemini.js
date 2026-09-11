const dotenv = require("dotenv");

// ============================================================
// ENVIRONMENT
// ============================================================

dotenv.config();

// ============================================================
// GEMINI
// ============================================================

const { GoogleGenAI } = require("@google/genai");

// ============================================================
// VALIDATE API KEY
// ============================================================

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "WARNING: GEMINI_API_KEY is not configured in backend/.env"
  );
}

// ============================================================
// GEMINI CLIENT
// ============================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ============================================================
// GENERATE CONTENT
// ============================================================

async function generateWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!prompt || typeof prompt !== "string") {
    throw new Error("Gemini prompt is required.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  return response.text;
}

// ============================================================
// EXPORT
// ============================================================

module.exports = generateWithGemini;