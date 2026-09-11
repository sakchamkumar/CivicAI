import { useState } from "react";
import axios from "axios";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import API_BASE_URL from "../config";

export default function ReportProblem() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // ============================================================
  // GPS STATE
  // ============================================================

  const [coordinates, setCoordinates] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");

  // ============================================================
  // SUBMISSION STATE
  // ============================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // DUPLICATE DETECTION STATE
  // ============================================================

  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [duplicateWarningVisible, setDuplicateWarningVisible] =
    useState(false);
  const [duplicateChecking, setDuplicateChecking] = useState(false);

  const categories = [
    "Road",
    "Waste",
    "Water",
    "Electricity",
    "Traffic",
    "Public Safety",
    "Environment",
    "Other",
  ];

  // ============================================================
  // GET CURRENT LOCATION
  // ============================================================

  const handleUseCurrentLocation = () => {
    setLocationError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser. Please enter the location manually."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        setCoordinates({
          latitude,
          longitude,
          accuracy,
        });

        setLocationMessage(
          "Current location captured successfully."
        );

        setLocationLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);

        let message =
          "Unable to get your current location. Please enter the location manually.";

        if (error.code === 1) {
          message =
            "Location permission was denied. Please allow location access or enter the location manually.";
        } else if (error.code === 2) {
          message =
            "Your current location could not be determined. Please try again or enter the location manually.";
        } else if (error.code === 3) {
          message =
            "Location request timed out. Please try again or enter the location manually.";
        }

        setLocationError(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // ============================================================
  // DUPLICATE DETECTION
  // ============================================================

  const checkForDuplicateReports = async (user) => {
    // ----------------------------------------------------------
    // Duplicate detection currently requires GPS coordinates.
    // If the user entered only a manual location, we skip the
    // duplicate check and allow normal submission.
    // ----------------------------------------------------------

    if (!coordinates) {
      return [];
    }

    setDuplicateChecking(true);

    try {
      // --------------------------------------------------------
      // GET EXISTING REPORTS
      // --------------------------------------------------------

      const reportsSnapshot = await getDocs(
        collection(db, "reports")
      );

      const existingReports = [];

      reportsSnapshot.forEach((doc) => {
        const data = doc.data();

        // ------------------------------------------------------
        // IMPORTANT:
        // We intentionally DO NOT exclude reports belonging
        // to the current user.
        //
        // This allows CivicAI to detect duplicate reports even
        // when the same user accidentally reports the same
        // community problem more than once.
        // ------------------------------------------------------

        // ------------------------------------------------------
        // Only reports with valid GPS coordinates can be used
        // by the current duplicate-detection algorithm.
        // ------------------------------------------------------

        const latitude = Number(data.latitude);
        const longitude = Number(data.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return;
        }

        if (
          !data.description ||
          typeof data.description !== "string"
        ) {
          return;
        }

        existingReports.push({
          reportId: doc.id,

          category:
            data.category || "Other",

          subcategory:
            data.aiSubcategory || null,

          severity:
            data.severity || "UNKNOWN",

          description:
            data.description,

          location:
            data.location || null,

          status:
            data.status || "submitted",

          priorityScore:
            Number.isFinite(Number(data.priorityScore))
              ? Number(data.priorityScore)
              : null,

          latitude,
          longitude,
        });
      });

      // --------------------------------------------------------
      // No suitable existing reports.
      // --------------------------------------------------------

      if (existingReports.length === 0) {
        return [];
      }

      // --------------------------------------------------------
      // ASK BACKEND TO CHECK FOR DUPLICATES
      // --------------------------------------------------------

      const response = await axios.post(
        `${API_BASE_URL}/api/duplicates/check`,
        {
          description: description.trim(),

          latitude: coordinates.latitude,

          longitude: coordinates.longitude,

          candidates: existingReports,
        }
      );

      if (
        !response.data ||
        !response.data.success
      ) {
        throw new Error(
          "Invalid duplicate detection response."
        );
      }

      return response.data.matches || [];
    } catch (duplicateError) {
      console.error(
        "Duplicate detection error:",
        duplicateError
      );

      // --------------------------------------------------------
      // Duplicate detection should never prevent a user from
      // reporting a genuine community problem.
      // --------------------------------------------------------

      return [];
    } finally {
      setDuplicateChecking(false);
    }
  };

  // ============================================================
  // ACTUAL REPORT SUBMISSION
  // ============================================================

  const submitReport = async (user) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // ========================================================
      // LOCATION DATA
      // ========================================================

      const reportLocation =
        location.trim() ||
        "Current location captured by GPS";

      // ========================================================
      // STEP 1 — SAVE INITIAL REPORT
      // ========================================================

      const reportRef = await addDoc(
        collection(db, "reports"),
        {
          userId: user.uid,

          description: description.trim(),

          category,

          location: reportLocation,

          // ----------------------------------------------------
          // GPS COORDINATES
          // ----------------------------------------------------

          latitude: coordinates
            ? coordinates.latitude
            : null,

          longitude: coordinates
            ? coordinates.longitude
            : null,

          locationAccuracy: coordinates
            ? coordinates.accuracy
            : null,

          locationSource: coordinates
            ? "gps"
            : "manual",

          additionalInfo: additionalInfo.trim(),

          // AI starts as pending.
          aiAnalysisStatus: "pending",

          // Initial report status.
          status: "submitted",

          // AI will calculate these.
          severity: "pending",
          priorityScore: 0,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      // ========================================================
      // STEP 2 — SEND REPORT TO CIVICAI AI
      // ========================================================

      let aiAnalysisSuccessful = false;

      try {
        const aiResponse = await axios.post(
          `${API_BASE_URL}/api/ai/analyze`,
          {
            description: description.trim(),
            category,
            location: reportLocation,
            additionalInfo: additionalInfo.trim(),

            // Send GPS information to AI as additional context.
            latitude: coordinates
              ? coordinates.latitude
              : null,

            longitude: coordinates
              ? coordinates.longitude
              : null,
          }
        );

        // ------------------------------------------------------
        // VERIFY AI RESPONSE
        // ------------------------------------------------------

        if (
          !aiResponse.data ||
          !aiResponse.data.success ||
          !aiResponse.data.analysis
        ) {
          throw new Error("Invalid AI response.");
        }

        const analysis = aiResponse.data.analysis;

        // ======================================================
        // STEP 3 — SAVE AI RESULTS TO THE REPORT
        // ======================================================

        await updateDoc(reportRef, {
          aiAnalysisStatus: "completed",

          aiCategory: analysis.category,
          aiSubcategory: analysis.subcategory,

          severity: analysis.severity,

          safetyRisk: analysis.safetyRisk,

          aiConfidence: analysis.confidence,

          aiReasoning: analysis.reasoning,

          priorityScore: analysis.priorityScore,

          updatedAt: serverTimestamp(),
        });

        aiAnalysisSuccessful = true;
      } catch (aiError) {
        // ------------------------------------------------------
        // AI FAILURE
        // ------------------------------------------------------

        console.error(
          "AI analysis error:",
          aiError
        );

        // The report itself has already been saved.
        // Mark the AI analysis as failed so it can be
        // processed again later.

        try {
          await updateDoc(reportRef, {
            aiAnalysisStatus: "failed",
            updatedAt: serverTimestamp(),
          });
        } catch (updateError) {
          console.error(
            "Unable to update AI analysis status:",
            updateError
          );
        }
      }

      // ========================================================
      // SUCCESS MESSAGE
      // ========================================================

      if (aiAnalysisSuccessful) {
        setSuccess(
          "Your report was submitted and analyzed successfully by CivicAI."
        );
      } else {
        setSuccess(
          "Your report was submitted successfully. AI analysis is currently pending."
        );
      }

      // ========================================================
      // CLEAR FORM
      // ========================================================

      setCategory("");
      setDescription("");
      setLocation("");
      setAdditionalInfo("");

      // Clear GPS data after successful submission.
      setCoordinates(null);
      setLocationMessage("");
      setLocationError("");

      // Clear duplicate state.
      setDuplicateMatches([]);
      setDuplicateWarningVisible(false);

      // ========================================================
      // RETURN TO DASHBOARD
      // ========================================================

      setTimeout(() => {
        navigate("/dashboard");
      }, 1800);
    } catch (submissionError) {
      console.error(
        "Report submission error:",
        submissionError
      );

      setError(
        "Unable to submit your report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SUBMIT REPORT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const user = auth.currentUser;

    // ----------------------------------------------------------
    // AUTHENTICATION
    // ----------------------------------------------------------

    if (!user) {
      setError("You must be signed in to report a problem.");
      return;
    }

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!category) {
      setError("Please select a problem category.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the problem.");
      return;
    }

    if (description.trim().length < 10) {
      setError(
        "Please provide a little more detail about the problem."
      );
      return;
    }

    // A manually entered location OR GPS coordinates are required.
    if (!location.trim() && !coordinates) {
      setError(
        "Please enter the problem location or use your current location."
      );
      return;
    }

    // ----------------------------------------------------------
    // START SUBMISSION PROCESS
    // ----------------------------------------------------------

    setLoading(true);

    // ----------------------------------------------------------
    // DUPLICATE DETECTION
    // ----------------------------------------------------------

    if (coordinates) {
      const matches =
        await checkForDuplicateReports(user);

      // --------------------------------------------------------
      // Potential duplicates found.
      // Pause submission and show warning.
      // --------------------------------------------------------

      if (matches.length > 0) {
        setDuplicateMatches(matches);
        setDuplicateWarningVisible(true);
        setLoading(false);
        return;
      }
    }

    // ----------------------------------------------------------
    // No duplicate detected.
    // Continue with normal submission.
    // ----------------------------------------------------------

    await submitReport(user);
  };

  // ============================================================
  // SUBMIT ANYWAY
  // ============================================================

  const handleSubmitAnyway = async () => {
    const user = auth.currentUser;

    if (!user) {
      setError("You must be signed in to report a problem.");
      return;
    }

    setDuplicateWarningVisible(false);
    setDuplicateMatches([]);

    await submitReport(user);
  };

  // ============================================================
  // CANCEL DUPLICATE WARNING
  // ============================================================

  const handleCancelDuplicate = () => {
    setDuplicateWarningVisible(false);
    setDuplicateMatches([]);
    setError(
      "Submission cancelled. Please review your report before submitting again."
    );
  };

  // ============================================================
  // BACK TO DASHBOARD
  // ============================================================

  const handleBack = () => {
    navigate("/dashboard");
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
      }}
    >
      {/* ============================================================
          HEADER
      ============================================================ */}

      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "18px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: "700",
            }}
          >
            CivicAI
          </h1>

          <p
            style={{
              margin: "3px 0 0",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Community Problem Intelligence
          </p>
        </div>

        <button
          type="button"
          onClick={handleBack}
          style={{
            padding: "10px 18px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#374151",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          ← Dashboard
        </button>
      </header>

      {/* ============================================================
          MAIN
      ============================================================ */}

      <main
        style={{
          width: "100%",
          maxWidth: "850px",
          margin: "0 auto",
          padding: "45px 24px 60px",
        }}
      >
        {/* ========================================================
            INTRODUCTION
        ======================================================== */}

        <div
          style={{
            marginBottom: "25px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#6b7280",
            }}
          >
            COMMUNITY REPORT
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "34px",
              lineHeight: "1.2",
            }}
          >
            Report a Problem
          </h2>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            Tell CivicAI about a problem in your community.
            Your report will be analyzed by our AI system to
            help classify and prioritize it.
          </p>
        </div>

        {/* ========================================================
            FORM CARD
        ======================================================== */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "35px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.05)",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* ======================================================
                CATEGORY
            ====================================================== */}

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="category"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Problem Category
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  border: "1px solid #9ca3af",
                  borderRadius: "10px",
                  fontSize: "15px",
                  background: "#ffffff",
                  color: category
                    ? "#111827"
                    : "#6b7280",
                  outline: "none",
                }}
              >
                <option value="">
                  Select a category
                </option>

                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* ======================================================
                DESCRIPTION
            ====================================================== */}

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="description"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Describe the Problem
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Example: There is a large pothole near the main entrance of our school that is causing traffic problems."
                disabled={loading}
                rows={6}
                maxLength={2000}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  border: "1px solid #9ca3af",
                  borderRadius: "10px",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  resize: "vertical",
                  background: "#ffffff",
                  color: "#111827",
                  outline: "none",
                }}
              />

              <div
                style={{
                  marginTop: "6px",
                  textAlign: "right",
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                {description.length}/2000
              </div>
            </div>

            {/* ======================================================
                LOCATION
            ====================================================== */}

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="location"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Problem Location
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="Example: Main Road, near City Park"
                  disabled={loading}
                  maxLength={500}
                  style={{
                    flex: "1 1 400px",
                    minWidth: 0,
                    boxSizing: "border-box",
                    padding: "13px 14px",
                    border: "1px solid #9ca3af",
                    borderRadius: "10px",
                    fontSize: "15px",
                    background: "#ffffff",
                    color: "#111827",
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={
                    loading || locationLoading
                  }
                  style={{
                    flex: "0 0 auto",
                    padding: "13px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "10px",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor:
                      loading || locationLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      loading || locationLoading
                        ? 0.7
                        : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {locationLoading
                    ? "📍 Getting Location..."
                    : "📍 Use My Current Location"}
                </button>
              </div>

              {/* GPS SUCCESS */}

              {locationMessage && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "11px 13px",
                    borderRadius: "9px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}
                >
                  ✅ {locationMessage}

                  {coordinates && (
                    <div
                      style={{
                        marginTop: "5px",
                        color: "#15803d",
                        fontSize: "12px",
                      }}
                    >
                      Coordinates captured:{" "}
                      {coordinates.latitude.toFixed(6)},{" "}
                      {coordinates.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              )}

              {/* GPS ERROR */}

              {locationError && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "11px 13px",
                    borderRadius: "9px",
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    color: "#9a3412",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}
                >
                  ⚠️ {locationError}
                </div>
              )}

              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "12px",
                  color: "#9ca3af",
                  lineHeight: "1.5",
                }}
              >
                You can enter the location manually or use
                your current GPS location. GPS coordinates
                will be saved with your report for future
                map features.
              </p>
            </div>

            {/* ======================================================
                ADDITIONAL INFORMATION
            ====================================================== */}

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="additionalInfo"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Additional Information

                <span
                  style={{
                    marginLeft: "6px",
                    fontWeight: "400",
                    color: "#9ca3af",
                  }}
                >
                  (Optional)
                </span>
              </label>

              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(event) =>
                  setAdditionalInfo(event.target.value)
                }
                placeholder="Add anything else that may help understand the problem."
                disabled={loading}
                rows={4}
                maxLength={1000}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  border: "1px solid #9ca3af",
                  borderRadius: "10px",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  resize: "vertical",
                  background: "#ffffff",
                  color: "#111827",
                  outline: "none",
                }}
              />

              <div
                style={{
                  marginTop: "6px",
                  textAlign: "right",
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                {additionalInfo.length}/1000
              </div>
            </div>

            {/* ======================================================
                DUPLICATE WARNING
            ====================================================== */}

            {duplicateWarningVisible &&
              duplicateMatches.length > 0 && (
                <div
                  style={{
                    marginBottom: "24px",
                    padding: "20px",
                    borderRadius: "12px",
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                  }}
                >
                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: "700",
                      color: "#9a3412",
                      marginBottom: "8px",
                    }}
                  >
                    ⚠️ Potential Duplicate Report
                  </div>

                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#7c2d12",
                    }}
                  >
                    CivicAI found an existing community
                    report that may describe the same problem.
                    Please review it before submitting.
                  </p>

                  {duplicateMatches.map(
                    (match, index) => (
                      <div
                        key={
                          match.reportId ||
                          `duplicate-${index}`
                        }
                        style={{
                          marginBottom:
                            index <
                            duplicateMatches.length - 1
                              ? "14px"
                              : "0",
                          padding: "16px",
                          borderRadius: "10px",
                          background: "#ffffff",
                          border:
                            "1px solid #fed7aa",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginBottom: "10px",
                          }}
                        >
                          <strong
                            style={{
                              color: "#374151",
                              fontSize: "14px",
                            }}
                          >
                            Possible Match{" "}
                            {index + 1}
                          </strong>

                          <span
                            style={{
                              padding: "5px 9px",
                              borderRadius: "999px",
                              background:
                                "#ffedd5",
                              color: "#9a3412",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            {Math.round(
                              match.duplicateScore *
                                100
                            )}
                            % duplicate score
                          </span>
                        </div>

                        <div
                          style={{
                            marginBottom: "12px",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            color: "#4b5563",
                          }}
                        >
                          {match.description}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "8px",
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          <div>
                            <strong>
                              Distance:
                            </strong>{" "}
                            {match.distanceMeters} m
                          </div>

                          <div>
                            <strong>
                              Text similarity:
                            </strong>{" "}
                            {Math.round(
                              match.textSimilarity *
                                100
                            )}
                            %
                          </div>

                          <div>
                            <strong>
                              Location score:
                            </strong>{" "}
                            {Math.round(
                              match.geoScore *
                                100
                            )}
                            %
                          </div>

                          <div>
                            <strong>
                              Category:
                            </strong>{" "}
                            {match.category}
                          </div>

                          <div>
                            <strong>
                              Severity:
                            </strong>{" "}
                            {match.severity}
                          </div>

                          <div>
                            <strong>
                              Status:
                            </strong>{" "}
                            {match.status}
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginTop: "18px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        handleSubmitAnyway
                      }
                      disabled={loading}
                      style={{
                        flex: "1 1 220px",
                        padding: "13px 16px",
                        border: "none",
                        borderRadius: "9px",
                        background: "#111827",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: loading
                          ? "not-allowed"
                          : "pointer",
                        opacity: loading
                          ? 0.7
                          : 1,
                      }}
                    >
                      {loading
                        ? "Submitting..."
                        : "Submit Anyway"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleCancelDuplicate
                      }
                      disabled={loading}
                      style={{
                        flex: "1 1 180px",
                        padding: "13px 16px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius: "9px",
                        background: "#ffffff",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: loading
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            {/* ======================================================
                AI INFORMATION BOX
            ====================================================== */}

            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                borderRadius: "12px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                🤖 CivicAI AI Analysis
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "#6b7280",
                }}
              >
                After submission, CivicAI will analyze your
                report to identify its category, subcategory,
                severity, safety risk, confidence, and
                priority score.
              </p>
            </div>

            {/* ======================================================
                DUPLICATE CHECK INFORMATION
            ====================================================== */}

            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                borderRadius: "12px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1e40af",
                  marginBottom: "6px",
                }}
              >
                🔎 Duplicate Report Detection
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "#1e3a8a",
                }}
              >
                When GPS location is available, CivicAI checks
                nearby reports and compares their descriptions
                to identify possible duplicate community
                problems.
              </p>
            </div>

            {/* ======================================================
                DUPLICATE CHECKING STATUS
            ====================================================== */}

            {duplicateChecking && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  fontSize: "14px",
                }}
              >
                🔎 Checking existing community reports for
                possible duplicates...
              </div>
            )}

            {/* ======================================================
                ERROR
            ====================================================== */}

            {error && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: "14px",
                }}
              >
                ❌ {error}
              </div>
            )}

            {/* ======================================================
                SUCCESS
            ====================================================== */}

            {success && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                ✅ {success}
              </div>
            )}

            {/* ======================================================
                SUBMIT
            ====================================================== */}

            {!duplicateWarningVisible && (
              <button
                type="submit"
                disabled={
                  loading ||
                  duplicateChecking
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#111827",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor:
                    loading ||
                    duplicateChecking
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    loading ||
                    duplicateChecking
                      ? 0.7
                      : 1,
                }}
              >
                {duplicateChecking
                  ? "Checking for Duplicates..."
                  : loading
                  ? "Submitting & Analyzing..."
                  : "Submit Community Report"}
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}