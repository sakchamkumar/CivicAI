const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// ============================================================
// ENVIRONMENT
// ============================================================

dotenv.config();

// ============================================================
// ROUTES
// ============================================================

const aiRoutes = require("./routes/ai");
const duplicateRoutes = require("./routes/duplicates");
const adminRoutes = require("./routes/admin");

// ============================================================
// GEMINI
// ============================================================

const generateWithGemini = require("./utils/gemini");

// ============================================================
// APP
// ============================================================

const app = express();

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(express.json({ limit: "1mb" }));

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/ai", aiRoutes);
app.use("/api/duplicates", duplicateRoutes);
app.use("/api/admin", adminRoutes);

// ============================================================
// ROOT
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CivicAI backend is running!",
  });
});

// ============================================================
// API TEST
// ============================================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "CivicAI API connection is working!",
  });
});

// ============================================================
// GEMINI TEST
// ============================================================

app.get("/api/ai-test", async (req, res) => {
  try {
    const response = await generateWithGemini(
      "Reply with exactly: CivicAI Gemini connection successful."
    );

    res.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    res.status(500).json({
      success: false,
      error: "Gemini connection failed.",
    });
  }
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(
    `CivicAI backend running on port ${PORT}`
  );

  console.log(
    `CivicAI frontend allowed origin: ${FRONTEND_URL}`
  );
});