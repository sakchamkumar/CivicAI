import { useEffect, useState } from "react";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

import { auth, db } from "../firebase";
import API_BASE_URL from "../config";

export default function ReportDetails() {
  const navigate = useNavigate();
  const { reportId } = useParams();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // STATUS HISTORY STATE
  // ============================================================

  const [statusHistory, setStatusHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // ============================================================
  // LOAD REPORT
  // ============================================================

  useEffect(() => {
    const loadReport = async () => {
      const user = auth.currentUser;

      if (!user) {
        setError("You must be signed in to view this report.");
        setLoading(false);
        return;
      }

      if (!reportId) {
        setError("Report ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const reportRef = doc(db, "reports", reportId);
        const snapshot = await getDoc(reportRef);

        if (!snapshot.exists()) {
          setError("This report could not be found.");
          setLoading(false);
          return;
        }

        const reportData = snapshot.data();

        // --------------------------------------------------------
        // SECURITY CHECK
        // --------------------------------------------------------

        if (reportData.userId !== user.uid) {
          setError(
            "You do not have permission to view this report."
          );
          setLoading(false);
          return;
        }

        setReport({
          id: snapshot.id,
          ...reportData,
        });
      } catch (error) {
        console.error(
          "Error loading report details:",
          error
        );

        setError(
          "Unable to load this report. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  // ============================================================
  // LOAD STATUS HISTORY
  // ============================================================

  useEffect(() => {
    const loadStatusHistory = async () => {
      const user = auth.currentUser;

      if (!user || !reportId) {
        return;
      }

      try {
        setHistoryLoading(true);
        setHistoryError("");

        const idToken = await user.getIdToken();

        const response = await axios.get(
          `${API_BASE_URL}/api/admin/reports/${reportId}/status-history`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (
          response.data &&
          response.data.success
        ) {
          setStatusHistory(
            Array.isArray(response.data.history)
              ? response.data.history
              : []
          );
        } else {
          setStatusHistory([]);
        }
      } catch (error) {
        console.error(
          "Error loading status history:",
          error
        );

        setHistoryError(
          "Status history could not be loaded."
        );
      } finally {
        setHistoryLoading(false);
      }
    };

    loadStatusHistory();
  }, [reportId]);

  // ============================================================
  // FORMAT FIRESTORE / API DATE
  // ============================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Not available";
    }

    try {
      let date = null;

      // --------------------------------------------------------
      // FIREBASE CLIENT TIMESTAMP
      // --------------------------------------------------------

      if (
        typeof timestamp.toDate === "function"
      ) {
        date = timestamp.toDate();
      }

      // --------------------------------------------------------
      // FIREBASE / FIRESTORE TIMESTAMP
      // seconds + nanoseconds
      // --------------------------------------------------------

      else if (
        typeof timestamp.seconds === "number"
      ) {
        date = new Date(
          timestamp.seconds * 1000
        );
      }

      // --------------------------------------------------------
      // FIRESTORE ADMIN SDK SERIALIZED TIMESTAMP
      // _seconds + _nanoseconds
      // --------------------------------------------------------

      else if (
        typeof timestamp._seconds === "number"
      ) {
        date = new Date(
          timestamp._seconds * 1000
        );
      }

      // --------------------------------------------------------
      // FIRESTORE TIMESTAMP VALUE
      // --------------------------------------------------------

      else if (
        timestamp.timestampValue
      ) {
        date = new Date(
          timestamp.timestampValue
        );
      }

      // --------------------------------------------------------
      // NUMBER
      // --------------------------------------------------------

      else if (
        typeof timestamp === "number"
      ) {
        // Handle both seconds and milliseconds.
        date = new Date(
          timestamp < 10000000000
            ? timestamp * 1000
            : timestamp
        );
      }

      // --------------------------------------------------------
      // STRING
      // --------------------------------------------------------

      else if (
        typeof timestamp === "string"
      ) {
        date = new Date(timestamp);
      }

      // --------------------------------------------------------
      // UNKNOWN OBJECT
      // --------------------------------------------------------

      else {
        return "Not available";
      }

      // --------------------------------------------------------
      // FINAL VALIDATION
      // --------------------------------------------------------

      if (
        !date ||
        Number.isNaN(date.getTime())
      ) {
        return "Not available";
      }

      return date.toLocaleString();
    } catch (error) {
      console.error(
        "Date formatting error:",
        error
      );

      return "Not available";
    }
  };

  // ============================================================
  // STATUS LABEL
  // ============================================================

  const formatStatusLabel = (status) => {
    if (!status) {
      return "Submitted";
    }

    return String(status)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // ============================================================
  // STATUS STYLING
  // ============================================================

  const getStatusStyle = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (normalized === "resolved") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (
      normalized === "in-progress" ||
      normalized === "in progress"
    ) {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (normalized === "reviewing") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    return {
      background: "#e0e7ff",
      color: "#3730a3",
    };
  };

  // ============================================================
  // STATUS TIMELINE ICON
  // ============================================================

  const getStatusIcon = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (normalized === "resolved") {
      return "✓";
    }

    if (
      normalized === "in-progress" ||
      normalized === "in progress"
    ) {
      return "⚙";
    }

    if (normalized === "reviewing") {
      return "🔍";
    }

    return "📋";
  };

  // ============================================================
  // SEVERITY STYLING
  // ============================================================

  const getSeverityStyle = (severity) => {
    const normalized = String(severity || "")
      .trim()
      .toUpperCase();

    if (normalized === "CRITICAL") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (normalized === "HIGH") {
      return {
        background: "#ffedd5",
        color: "#c2410c",
      };
    }

    if (normalized === "MEDIUM") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (normalized === "LOW") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#6b7280",
    };
  };

  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {
    navigate("/my-reports");
  };

  // ============================================================
  // OPEN LOCATION ON MAP
  // ============================================================

  const handleViewOnMap = () => {
    if (
      typeof report?.latitude !== "number" ||
      typeof report?.longitude !== "number"
    ) {
      return;
    }

    const latitude = report.latitude;
    const longitude = report.longitude;

    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    window.open(
      mapUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ============================================================
  // LOCATION AVAILABILITY
  // ============================================================

  const hasGPS =
    typeof report?.latitude === "number" &&
    typeof report?.longitude === "number";

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          fontFamily: "Arial, sans-serif",
          color: "#374151",
        }}
      >
        Loading report...
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f7fb",
          fontFamily: "Arial, sans-serif",
          color: "#111827",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              marginBottom: "25px",
              padding: "10px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ← My Reports
          </button>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "30px",
              border: "1px solid #fecaca",
              boxShadow:
                "0 8px 25px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h2
              style={{
                margin: "0 0 10px",
                color: "#991b1b",
              }}
            >
              Unable to Load Report
            </h2>

            <p
              style={{
                margin: 0,
                color: "#6b7280",
                lineHeight: "1.6",
              }}
            >
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const statusStyle = getStatusStyle(
    report.status
  );

  const severityStyle = getSeverityStyle(
    report.severity
  );

  const confidence =
    typeof report.aiConfidence === "number"
      ? Math.round(report.aiConfidence * 100)
      : null;

  // ============================================================
  // MAIN UI
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
      {/* ========================================================
          HEADER
      ======================================================== */}

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
          ← My Reports
        </button>
      </header>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main
        style={{
          width: "100%",
          maxWidth: "950px",
          margin: "0 auto",
          padding: "45px 24px 60px",
        }}
      >
        {/* ======================================================
            PAGE INTRO
        ====================================================== */}

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
            REPORT DETAILS
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "34px",
              lineHeight: "1.2",
            }}
          >
            Community Problem Report
          </h2>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            View your submitted report and CivicAI's
            analysis.
          </p>
        </div>

        {/* ======================================================
            REPORT INFORMATION
        ====================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            marginBottom: "22px",
            boxShadow:
              "0 8px 25px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "25px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "22px",
                }}
              >
                Report Information
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#9ca3af",
                  wordBreak: "break-all",
                }}
              >
                ID: {report.id}
              </p>
            </div>

            <span
              style={{
                display: "inline-block",
                padding: "7px 12px",
                borderRadius: "999px",
                background: statusStyle.background,
                color: statusStyle.color,
                fontSize: "13px",
                fontWeight: "700",
                textTransform: "capitalize",
              }}
            >
              {formatStatusLabel(
                report.status
              )}
            </span>
          </div>

          {/* ====================================================
              DETAILS GRID
          ==================================================== */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            <DetailItem
              label="Category"
              value={
                report.category ||
                "Not provided"
              }
            />

            <DetailItem
              label="Location"
              value={
                report.location ||
                "Not provided"
              }
            />

            <DetailItem
              label="Submitted"
              value={formatDate(
                report.createdAt
              )}
            />

            <DetailItem
              label="Last Updated"
              value={formatDate(
                report.updatedAt
              )}
            />
          </div>

          {/* ====================================================
              GPS LOCATION
          ==================================================== */}

          <div
            style={{
              marginTop: "25px",
              paddingTop: "25px",
              borderTop:
                "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#6b7280",
                    textTransform:
                      "uppercase",
                  }}
                >
                  📍 Location Intelligence
                </p>

                <h4
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    color: "#111827",
                  }}
                >
                  Location Information
                </h4>
              </div>

              <span
                style={{
                  display: "inline-block",
                  padding: "6px 11px",
                  borderRadius: "999px",
                  background: hasGPS
                    ? "#dcfce7"
                    : "#f3f4f6",
                  color: hasGPS
                    ? "#166534"
                    : "#6b7280",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {hasGPS
                  ? "GPS Location"
                  : "Manual Location"}
              </span>
            </div>

            {hasGPS ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                    marginBottom: "18px",
                  }}
                >
                  <LocationCard
                    label="Latitude"
                    value={report.latitude.toFixed(
                      6
                    )}
                  />

                  <LocationCard
                    label="Longitude"
                    value={report.longitude.toFixed(
                      6
                    )}
                  />

                  <LocationCard
                    label="GPS Accuracy"
                    value={
                      typeof report.locationAccuracy ===
                      "number"
                        ? `±${Math.round(
                            report.locationAccuracy
                          )} meters`
                        : "Not available"
                    }
                  />

                  <LocationCard
                    label="Source"
                    value={
                      report.locationSource ===
                      "gps"
                        ? "Browser GPS"
                        : "GPS"
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    handleViewOnMap
                  }
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    border: "none",
                    borderRadius: "9px",
                    background: "#111827",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🗺️ View Location on Map
                </button>
              </>
            ) : (
              <div
                style={{
                  padding: "15px",
                  borderRadius: "10px",
                  background: "#f9fafb",
                  border:
                    "1px solid #e5e7eb",
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                This report was submitted
                using a manually entered
                location. GPS coordinates were
                not captured for this report.
              </div>
            )}
          </div>

          {/* ====================================================
              DESCRIPTION
          ==================================================== */}

          <div
            style={{
              marginTop: "25px",
              paddingTop: "25px",
              borderTop:
                "1px solid #e5e7eb",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#6b7280",
                textTransform:
                  "uppercase",
              }}
            >
              Problem Description
            </p>

            <p
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: "1.7",
                color: "#374151",
                whiteSpace: "pre-wrap",
              }}
            >
              {report.description ||
                "No description provided."}
            </p>
          </div>

          {/* ====================================================
              ADDITIONAL INFORMATION
          ==================================================== */}

          {report.additionalInfo && (
            <div
              style={{
                marginTop: "22px",
                paddingTop: "22px",
                borderTop:
                  "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#6b7280",
                  textTransform:
                    "uppercase",
                }}
              >
                Additional Information
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: "1.7",
                  color: "#374151",
                  whiteSpace: "pre-wrap",
                }}
              >
                {report.additionalInfo}
              </p>
            </div>
          )}
        </section>

        {/* ======================================================
            STATUS HISTORY
        ====================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            marginBottom: "22px",
            boxShadow:
              "0 8px 25px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <p
              style={{
                margin: "0 0 7px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#6b7280",
                textTransform:
                  "uppercase",
              }}
            >
              📋 Report Progress
            </p>

            <h3
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              Status History
            </h3>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.6",
              }}
            >
              Track how your report has progressed
              through CivicAI's review process.
            </p>
          </div>

          {historyLoading ? (
            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#f9fafb",
                border:
                  "1px solid #e5e7eb",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Loading status history...
            </div>
          ) : historyError ? (
            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#fff7ed",
                border:
                  "1px solid #fed7aa",
                color: "#9a3412",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              ⚠️ {historyError}
            </div>
          ) : statusHistory.length === 0 ? (
            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#f9fafb",
                border:
                  "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#e0e7ff",
                    color: "#3730a3",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  📋
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    {formatStatusLabel(
                      report.status ||
                        "submitted"
                    )}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    Your report has been
                    submitted and is awaiting
                    its next status update.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                paddingLeft: "8px",
              }}
            >
              {/* Vertical timeline line */}
              <div
                style={{
                  position: "absolute",
                  left: "27px",
                  top: "22px",
                  bottom: "22px",
                  width: "2px",
                  background: "#e5e7eb",
                }}
              />

              {statusHistory.map(
                (item, index) => {
                  const itemStyle =
                    getStatusStyle(
                      item.newStatus
                    );

                  return (
                    <div
                      key={
                        item.id ||
                        `${item.reportId}-${index}`
                      }
                      style={{
                        position:
                          "relative",
                        display: "flex",
                        gap: "18px",
                        paddingBottom:
                          index ===
                          statusHistory.length -
                            1
                            ? 0
                            : "28px",
                      }}
                    >
                      {/* Timeline icon */}
                      <div
                        style={{
                          position:
                            "relative",
                          zIndex: 2,
                          width: "40px",
                          height: "40px",
                          minWidth: "40px",
                          borderRadius:
                            "50%",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          background:
                            itemStyle.background,
                          color:
                            itemStyle.color,
                          border:
                            "4px solid #ffffff",
                          boxShadow:
                            "0 0 0 1px #e5e7eb",
                          fontSize:
                            "16px",
                        }}
                      >
                        {getStatusIcon(
                          item.newStatus
                        )}
                      </div>

                      {/* Timeline content */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          paddingTop:
                            "1px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            gap: "12px",
                            flexWrap:
                              "wrap",
                            marginBottom:
                              "7px",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "6px 10px",
                              borderRadius:
                                "999px",
                              background:
                                itemStyle.background,
                              color:
                                itemStyle.color,
                              fontSize:
                                "12px",
                              fontWeight:
                                "700",
                            }}
                          >
                            {formatStatusLabel(
                              item.newStatus
                            )}
                          </span>

                          <span
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#9ca3af",
                            }}
                          >
                            {formatDate(
                              item.timestamp
                            )}
                          </span>
                        </div>

                        <p
                          style={{
                            margin:
                              "0 0 5px",
                            fontSize:
                              "14px",
                            fontWeight:
                              "600",
                            color:
                              "#374151",
                          }}
                        >
                          Status changed from{" "}
                          <strong>
                            {formatStatusLabel(
                              item.previousStatus
                            )}
                          </strong>{" "}
                          to{" "}
                          <strong>
                            {formatStatusLabel(
                              item.newStatus
                            )}
                          </strong>
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize:
                              "12px",
                            color:
                              "#9ca3af",
                            lineHeight:
                              "1.5",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          Updated by CivicAI
                          administrator
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* ======================================================
            AI ANALYSIS
        ====================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            marginBottom: "22px",
            boxShadow:
              "0 8px 25px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <p
              style={{
                margin: "0 0 7px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#6b7280",
                textTransform:
                  "uppercase",
              }}
            >
              🤖 CivicAI Intelligence
            </p>

            <h3
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              AI Analysis
            </h3>
          </div>

          {report.aiAnalysisStatus ===
          "completed" ? (
            <>
              {/* ==================================================
                  AI SUMMARY CARDS
              ================================================== */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                  marginBottom: "25px",
                }}
              >
                <AnalysisCard
                  label="AI Category"
                  value={
                    report.aiCategory ||
                    "Not available"
                  }
                />

                <AnalysisCard
                  label="Subcategory"
                  value={
                    report.aiSubcategory ||
                    "Not available"
                  }
                />

                <AnalysisCard
                  label="Severity"
                  value={
                    report.severity ||
                    "Not available"
                  }
                  valueStyle={
                    severityStyle
                  }
                />

                <AnalysisCard
                  label="Safety Risk"
                  value={
                    report.safetyRisk ||
                    "Not available"
                  }
                />

                <AnalysisCard
                  label="Priority Score"
                  value={
                    typeof report.priorityScore ===
                    "number"
                      ? `${report.priorityScore}/100`
                      : "Not available"
                  }
                />

                <AnalysisCard
                  label="AI Confidence"
                  value={
                    confidence !== null
                      ? `${confidence}%`
                      : "Not available"
                  }
                />
              </div>

              {/* ==================================================
                  AI REASONING
              ================================================== */}

              <div
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  background: "#f9fafb",
                  border:
                    "1px solid #e5e7eb",
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#6b7280",
                    textTransform:
                      "uppercase",
                  }}
                >
                  AI Reasoning
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    lineHeight: "1.7",
                    color: "#374151",
                  }}
                >
                  {report.aiReasoning ||
                    "No AI reasoning is available."}
                </p>
              </div>
            </>
          ) : report.aiAnalysisStatus ===
            "failed" ? (
            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#fff7ed",
                border:
                  "1px solid #fed7aa",
                color: "#9a3412",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              ⚠️ CivicAI was unable to
              complete the AI analysis for this
              report. The report itself was
              submitted successfully.
            </div>
          ) : (
            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#f9fafb",
                border:
                  "1px solid #e5e7eb",
                color: "#6b7280",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              ⏳ AI analysis for this report is
              currently pending.
            </div>
          )}
        </section>

        {/* ======================================================
            FOOTER ACTION
        ====================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: "12px 20px",
              border:
                "1px solid #d1d5db",
              borderRadius: "9px",
              background: "#ffffff",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ← Back to My Reports
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/report")
            }
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "9px",
              background: "#111827",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            📝 Report Another Problem
          </button>
        </div>
      </main>
    </div>
  );
}

/* ================================================================
   DETAIL ITEM
================================================================ */

function DetailItem({ label, value }) {
  return (
    <div>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: "12px",
          fontWeight: "700",
          color: "#9ca3af",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "15px",
          color: "#374151",
          lineHeight: "1.5",
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   LOCATION CARD
================================================================ */

function LocationCard({ label, value }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "11px",
        background: "#f9fafb",
        border:
          "1px solid #e5e7eb",
      }}
    >
      <p
        style={{
          margin: "0 0 7px",
          fontSize: "11px",
          fontWeight: "700",
          color: "#9ca3af",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "14px",
          fontWeight: "700",
          color: "#111827",
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   ANALYSIS CARD
================================================================ */

function AnalysisCard({
  label,
  value,
  valueStyle,
}) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "12px",
        background: "#f9fafb",
        border:
          "1px solid #e5e7eb",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontSize: "12px",
          fontWeight: "700",
          color: "#9ca3af",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>

      <div
        style={{
          display: "inline-block",
          fontSize: "16px",
          fontWeight: "700",
          color: valueStyle
            ? valueStyle.color
            : "#111827",
          background: valueStyle
            ? valueStyle.background
            : "transparent",
          padding: valueStyle
            ? "5px 9px"
            : 0,
          borderRadius: valueStyle
            ? "7px"
            : 0,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}