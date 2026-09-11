const express = require("express");

const router = express.Router();

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_CANDIDATES = 100;

// A report within this distance can be considered geographically
// close enough to be a possible duplicate.
const MAX_DISTANCE_METERS = 2000;

// Minimum text similarity for a possible duplicate when the
// reports are geographically close.
const MIN_TEXT_SIMILARITY = 0.35;

// Combined score threshold for identifying a strong duplicate.
const DUPLICATE_SCORE_THRESHOLD = 0.60;

// ============================================================
// TEXT NORMALIZATION
// ============================================================

function tokenize(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "been",
    "by",
    "for",
    "from",
    "has",
    "have",
    "in",
    "is",
    "it",
    "near",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "were",
    "with",
    "there",
    "very",
    "road",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3)
    .filter((word) => !stopWords.has(word));
}

// ============================================================
// TEXT SIMILARITY
// ============================================================

function cosineSimilarity(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (!tokensA.length || !tokensB.length) {
    return 0;
  }

  const frequencyA = {};
  const frequencyB = {};

  for (const token of tokensA) {
    frequencyA[token] = (frequencyA[token] || 0) + 1;
  }

  for (const token of tokensB) {
    frequencyB[token] = (frequencyB[token] || 0) + 1;
  }

  const vocabulary = new Set([
    ...Object.keys(frequencyA),
    ...Object.keys(frequencyB),
  ]);

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const word of vocabulary) {
    const valueA = frequencyA[word] || 0;
    const valueB = frequencyB[word] || 0;

    dotProduct += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// ============================================================
// HAVERSINE DISTANCE
// ============================================================

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadiusMeters = 6371000;

  const toRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const a =
    Math.sin(latitudeDifference / 2) *
      Math.sin(latitudeDifference / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

// ============================================================
// GEO SCORE
// ============================================================

function calculateGeoScore(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) {
    return 0;
  }

  if (distanceMeters >= MAX_DISTANCE_METERS) {
    return 0;
  }

  return 1 - distanceMeters / MAX_DISTANCE_METERS;
}

// ============================================================
// COMBINED DUPLICATE SCORE
// ============================================================

function calculateDuplicateScore(textSimilarity, geoScore) {
  // Text is slightly more important than location.
  const score =
    textSimilarity * 0.65 +
    geoScore * 0.35;

  return Math.min(1, Math.max(0, score));
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function isValidCoordinate(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function normalizeSeverity(severity) {
  if (!severity || typeof severity !== "string") {
    return "UNKNOWN";
  }

  return severity.trim().toUpperCase();
}

// ============================================================
// POST /api/duplicates/check
// ============================================================

router.post("/check", async (req, res) => {
  try {
    const {
      description,
      latitude,
      longitude,
      candidates,
    } = req.body;

    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length < 10
    ) {
      return res.status(400).json({
        success: false,
        error:
          "A valid problem description of at least 10 characters is required.",
      });
    }

    if (
      !isValidCoordinate(latitude) ||
      !isValidCoordinate(longitude)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Valid latitude and longitude are required for duplicate detection.",
      });
    }

    if (!Array.isArray(candidates)) {
      return res.status(400).json({
        success: false,
        error:
          "Candidates must be provided as an array.",
      });
    }

    // ----------------------------------------------------------
    // PROTECT THE API FROM EXCESSIVE INPUT
    // ----------------------------------------------------------

    const limitedCandidates = candidates.slice(
      0,
      MAX_CANDIDATES
    );

    // ----------------------------------------------------------
    // COMPARE REPORTS
    // ----------------------------------------------------------

    const matches = [];

    for (const candidate of limitedCandidates) {
      if (!candidate || typeof candidate !== "object") {
        continue;
      }

      const candidateLatitude = Number(candidate.latitude);
      const candidateLongitude = Number(candidate.longitude);

      if (
        !Number.isFinite(candidateLatitude) ||
        !Number.isFinite(candidateLongitude)
      ) {
        // Reports without GPS coordinates cannot be compared
        // geographically, so skip them for this first version.
        continue;
      }

      if (
        !candidate.description ||
        typeof candidate.description !== "string"
      ) {
        continue;
      }

      // --------------------------------------------------------
      // GEOGRAPHIC SIMILARITY
      // --------------------------------------------------------

      const distanceMeters =
        calculateDistanceMeters(
          latitude,
          longitude,
          candidateLatitude,
          candidateLongitude
        );

      // Ignore reports that are too far away.
      if (distanceMeters > MAX_DISTANCE_METERS) {
        continue;
      }

      const geoScore =
        calculateGeoScore(distanceMeters);

      // --------------------------------------------------------
      // TEXT SIMILARITY
      // --------------------------------------------------------

      const textSimilarity =
        cosineSimilarity(
          description.trim(),
          candidate.description.trim()
        );

      // --------------------------------------------------------
      // COMBINED SCORE
      // --------------------------------------------------------

      const duplicateScore =
        calculateDuplicateScore(
          textSimilarity,
          geoScore
        );

      // --------------------------------------------------------
      // DETERMINE WHETHER THIS IS A POSSIBLE DUPLICATE
      // --------------------------------------------------------

      const isPotentialDuplicate =
        (
          distanceMeters <= 500 &&
          textSimilarity >= MIN_TEXT_SIMILARITY
        ) ||
        duplicateScore >= DUPLICATE_SCORE_THRESHOLD;

      if (!isPotentialDuplicate) {
        continue;
      }

      matches.push({
        reportId: candidate.reportId || null,

        category:
          candidate.category || "Other",

        subcategory:
          candidate.subcategory || null,

        severity:
          normalizeSeverity(candidate.severity),

        description:
          candidate.description.trim(),

        location:
          candidate.location || null,

        status:
          candidate.status || "submitted",

        priorityScore:
          Number.isFinite(Number(candidate.priorityScore))
            ? Number(candidate.priorityScore)
            : null,

        distanceMeters: Math.round(
          distanceMeters
        ),

        textSimilarity:
          Number(textSimilarity.toFixed(3)),

        geoScore:
          Number(geoScore.toFixed(3)),

        duplicateScore:
          Number(duplicateScore.toFixed(3)),

        isPotentialDuplicate: true,
      });
    }

    // ----------------------------------------------------------
    // SORT BY STRONGEST MATCH
    // ----------------------------------------------------------

    matches.sort(
      (a, b) =>
        b.duplicateScore -
        a.duplicateScore
    );

    // Return only the strongest matches.
    const topMatches = matches.slice(0, 5);

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.json({
      success: true,

      isDuplicate: topMatches.length > 0,

      matchCount: topMatches.length,

      matches: topMatches,

      checkedCandidates:
        limitedCandidates.length,
    });
  } catch (error) {
    console.error(
      "Duplicate detection error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Duplicate detection failed.",
    });
  }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;