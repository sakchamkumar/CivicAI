const express = require("express");

const router = express.Router();

const generateWithGemini = require("../utils/gemini");

// ============================================================
// AI REPORT ANALYSIS
// ============================================================

router.post("/analyze", async (req, res) => {
  try {
    const { description, category, location, additionalInfo } = req.body;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!description || typeof description !== "string") {
      return res.status(400).json({
        success: false,
        error: "Problem description is required.",
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Problem description must be at least 10 characters.",
      });
    }

    // ----------------------------------------------------------
    // AI PROMPT
    // ----------------------------------------------------------

    const prompt = `
You are CivicAI, an AI system designed to analyze community problems
reported by citizens.

Analyze the following community problem and return ONLY valid JSON.

Community problem:
${description.trim()}

User-selected category:
${category || "Not provided"}

Location:
${location || "Not provided"}

Additional information:
${additionalInfo || "Not provided"}

Choose the most appropriate category from:

- Road
- Waste
- Water
- Electricity
- Traffic
- Public Safety
- Environment
- Other

Return exactly this JSON structure:

{
  "category": "Road",
  "subcategory": "Pothole",
  "severity": "HIGH",
  "safetyRisk": "HIGH",
  "confidence": 0.94,
  "reasoning": "Brief explanation of why the problem has this severity and classification."
}

Rules:

1. category must be one of the allowed categories.
2. subcategory should be specific and concise.
3. severity must be exactly one of:
   LOW, MEDIUM, HIGH, CRITICAL
4. safetyRisk must be exactly one of:
   LOW, MEDIUM, HIGH
5. confidence must be a number between 0 and 1.
6. reasoning should be concise and based only on the information provided.
7. Do not invent facts.
8. Return JSON only.
`;

    // ----------------------------------------------------------
    // GEMINI REQUEST
    // ----------------------------------------------------------

    const aiResponse = await generateWithGemini(prompt);

    // ----------------------------------------------------------
    // CLEAN RESPONSE
    // ----------------------------------------------------------

    let cleanedResponse = aiResponse.trim();

    // Remove markdown code fences if Gemini returns them.
    cleanedResponse = cleanedResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // ----------------------------------------------------------
    // PARSE JSON
    // ----------------------------------------------------------

    let analysis;

    try {
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("AI JSON parsing error:", parseError);
      console.error("Raw AI response:", aiResponse);

      return res.status(500).json({
        success: false,
        error: "AI returned an invalid analysis format.",
      });
    }

    // ----------------------------------------------------------
    // VALIDATE AI OUTPUT
    // ----------------------------------------------------------

    const allowedCategories = [
      "Road",
      "Waste",
      "Water",
      "Electricity",
      "Traffic",
      "Public Safety",
      "Environment",
      "Other",
    ];

    const allowedSeverities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ];

    const allowedSafetyRisks = [
      "LOW",
      "MEDIUM",
      "HIGH",
    ];

    if (!allowedCategories.includes(analysis.category)) {
      analysis.category = "Other";
    }

    if (!allowedSeverities.includes(analysis.severity)) {
      analysis.severity = "MEDIUM";
    }

    if (!allowedSafetyRisks.includes(analysis.safetyRisk)) {
      analysis.safetyRisk = "LOW";
    }

    let confidence = Number(analysis.confidence);

    if (!Number.isFinite(confidence)) {
      confidence = 0;
    }

    confidence = Math.max(0, Math.min(1, confidence));

    analysis.confidence = Number(confidence.toFixed(2));

    if (
      !analysis.subcategory ||
      typeof analysis.subcategory !== "string"
    ) {
      analysis.subcategory = "General Issue";
    }

    if (
      !analysis.reasoning ||
      typeof analysis.reasoning !== "string"
    ) {
      analysis.reasoning =
        "The problem was classified based on the information provided.";
    }

    // ----------------------------------------------------------
    // PRIORITY SCORE
    // ----------------------------------------------------------

    const severityScores = {
      LOW: 25,
      MEDIUM: 50,
      HIGH: 75,
      CRITICAL: 100,
    };

    const safetyScores = {
      LOW: 0,
      MEDIUM: 10,
      HIGH: 20,
    };

    const baseScore = severityScores[analysis.severity] || 50;
    const safetyBonus = safetyScores[analysis.safetyRisk] || 0;

    let priorityScore = baseScore + safetyBonus;

    priorityScore = Math.min(100, priorityScore);

    analysis.priorityScore = priorityScore;

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("CivicAI AI analysis error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to analyze the community problem.",
    });
  }
});

module.exports = router;