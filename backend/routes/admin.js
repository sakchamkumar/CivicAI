const express = require("express");
const router = express.Router();

const { adminDb } = require("../utils/firebaseAdmin");

// ============================================================
// FIREBASE ADMIN AUTHENTICATION
// ============================================================

const { getAuth } = require("firebase-admin/auth");

const adminAuth = getAuth();

// ============================================================
// ALLOWED REPORT STATUSES
// ============================================================

const ALLOWED_STATUSES = [
  "submitted",
  "reviewing",
  "in-progress",
  "resolved",
];

// ============================================================
// VERIFY FIREBASE USER
// ============================================================

async function verifyUser(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authentication token is required.");
  }

  const idToken = authHeader.split("Bearer ")[1];

  if (!idToken) {
    throw new Error("Authentication token is missing.");
  }

  const decodedToken = await adminAuth.verifyIdToken(idToken);

  return decodedToken;
}

// ============================================================
// VERIFY ADMIN
// ============================================================

async function verifyAdmin(uid) {
  const userSnapshot = await adminDb
    .collection("users")
    .doc(uid)
    .get();

  if (!userSnapshot.exists) {
    throw new Error("User profile not found.");
  }

  const userData = userSnapshot.data();

  if (userData.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return userData;
}

// ============================================================
// UPDATE REPORT STATUS
// ============================================================

router.patch("/reports/:reportId/status", async (req, res) => {
  try {
    // ----------------------------------------------------------
    // Validate report ID
    // ----------------------------------------------------------

    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "Report ID is required.",
      });
    }

    // ----------------------------------------------------------
    // Validate requested status
    // ----------------------------------------------------------

    const { status } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({
        success: false,
        error: "A valid status is required.",
      });
    }

    const normalizedStatus = status
      .trim()
      .toLowerCase();

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid status. Allowed statuses are: submitted, reviewing, in-progress, resolved.",
      });
    }

    // ----------------------------------------------------------
    // Authenticate Firebase user
    // ----------------------------------------------------------

    const decodedUser = await verifyUser(req);

    const adminUid = decodedUser.uid;

    // ----------------------------------------------------------
    // Verify admin role
    // ----------------------------------------------------------

    await verifyAdmin(adminUid);

    // ----------------------------------------------------------
    // Get report
    // ----------------------------------------------------------

    const reportRef = adminDb
      .collection("reports")
      .doc(reportId);

    const reportSnapshot = await reportRef.get();

    if (!reportSnapshot.exists) {
      return res.status(404).json({
        success: false,
        error: "Report not found.",
      });
    }

    const reportData = reportSnapshot.data();

    const previousStatus =
      reportData.status || "submitted";

    // ----------------------------------------------------------
    // Avoid unnecessary updates
    // ----------------------------------------------------------

    if (previousStatus === normalizedStatus) {
      return res.status(400).json({
        success: false,
        error: "The report already has this status.",
      });
    }

    // ----------------------------------------------------------
    // Timestamp
    // ----------------------------------------------------------

    const timestamp = new Date();

    // ----------------------------------------------------------
    // Update report + create status history
    // ----------------------------------------------------------

    const statusHistoryRef = adminDb
      .collection("statusHistory")
      .doc();

    const batch = adminDb.batch();

    batch.update(reportRef, {
      status: normalizedStatus,
      updatedAt: timestamp,
    });

    batch.set(statusHistoryRef, {
      reportId,
      userId: reportData.userId || null,

      previousStatus,
      newStatus: normalizedStatus,

      changedBy: adminUid,

      timestamp,
    });

    await batch.commit();

    // ----------------------------------------------------------
    // Success
    // ----------------------------------------------------------

    return res.json({
      success: true,

      message: "Report status updated successfully.",

      report: {
        reportId,
        previousStatus,
        newStatus: normalizedStatus,
        updatedAt: timestamp,
      },

      statusHistory: {
        historyId: statusHistoryRef.id,
        reportId,
        previousStatus,
        newStatus: normalizedStatus,
        changedBy: adminUid,
        timestamp,
      },
    });
  } catch (error) {
    console.error(
      "Admin status update error:",
      error
    );

    // ----------------------------------------------------------
    // Authentication / authorization errors
    // ----------------------------------------------------------

    if (
      error.message ===
        "Authentication token is required." ||
      error.message ===
        "Authentication token is missing."
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.code === "auth/id-token-expired" ||
      error.code === "auth/argument-error" ||
      error.code === "auth/id-token-revoked"
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired authentication token.",
      });
    }

    if (
      error.message === "Admin access required."
    ) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message === "User profile not found."
    ) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    // ----------------------------------------------------------
    // Generic server error
    // ----------------------------------------------------------

    return res.status(500).json({
      success: false,
      error: "Failed to update report status.",
    });
  }
});

// ============================================================
// GET STATUS HISTORY FOR A REPORT
// ============================================================

router.get(
  "/reports/:reportId/status-history",
  async (req, res) => {
    try {
      const { reportId } = req.params;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          error: "Report ID is required.",
        });
      }

      // --------------------------------------------------------
      // Authenticate user
      // --------------------------------------------------------

      const decodedUser = await verifyUser(req);

      const uid = decodedUser.uid;

      // --------------------------------------------------------
      // Get report
      // --------------------------------------------------------

      const reportRef = adminDb
        .collection("reports")
        .doc(reportId);

      const reportSnapshot = await reportRef.get();

      if (!reportSnapshot.exists) {
        return res.status(404).json({
          success: false,
          error: "Report not found.",
        });
      }

      const reportData = reportSnapshot.data();

      // --------------------------------------------------------
      // Verify ownership or admin access
      // --------------------------------------------------------

      let allowed = false;

      if (reportData.userId === uid) {
        allowed = true;
      } else {
        try {
          await verifyAdmin(uid);
          allowed = true;
        } catch {
          allowed = false;
        }
      }

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            "You do not have permission to view this status history.",
        });
      }

      // --------------------------------------------------------
      // Get status history
      // --------------------------------------------------------

      const historySnapshot = await adminDb
        .collection("statusHistory")
        .where("reportId", "==", reportId)
        .get();

      const history = [];

      historySnapshot.forEach((doc) => {
        const data = doc.data();

        history.push({
          id: doc.id,
          reportId: data.reportId,
          userId: data.userId || null,
          previousStatus:
            data.previousStatus || null,
          newStatus:
            data.newStatus || null,
          changedBy:
            data.changedBy || null,
          timestamp:
            data.timestamp || null,
        });
      });

      // --------------------------------------------------------
      // Sort newest first
      // --------------------------------------------------------

      history.sort((a, b) => {
        const timeA = a.timestamp?.toMillis
          ? a.timestamp.toMillis()
          : new Date(a.timestamp || 0).getTime();

        const timeB = b.timestamp?.toMillis
          ? b.timestamp.toMillis()
          : new Date(b.timestamp || 0).getTime();

        return timeB - timeA;
      });

      return res.json({
        success: true,
        reportId,
        currentStatus:
          reportData.status || "submitted",
        history,
      });
    } catch (error) {
      console.error(
        "Status history error:",
        error
      );

      if (
        error.message ===
          "Authentication token is required." ||
        error.message ===
          "Authentication token is missing."
      ) {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      if (
        error.code === "auth/id-token-expired" ||
        error.code === "auth/argument-error" ||
        error.code === "auth/id-token-revoked"
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid or expired authentication token.",
        });
      }

      return res.status(500).json({
        success: false,
        error:
          "Failed to retrieve status history.",
      });
    }
  }
);

module.exports = router;