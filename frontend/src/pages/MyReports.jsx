import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";

export default function MyReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      setError("");

      const user = auth.currentUser;

      if (!user) {
        setError("You must be signed in to view your reports.");
        setLoading(false);
        return;
      }

      try {
        const reportsQuery = query(
          collection(db, "reports"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(reportsQuery);

        const loadedReports = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setReports(loadedReports);
      } catch (error) {
        console.error("Error loading reports:", error);

        setError(
          "Unable to load your reports. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Date unavailable";
    }

    try {
      const date = timestamp.toDate();

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Date unavailable";
    }
  };

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusStyle = (status) => {
    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase();

    switch (normalizedStatus) {
      case "resolved":
        return {
          background: "#dcfce7",
          color: "#166534",
        };

      case "in-progress":
      case "in progress":
        return {
          background: "#dbeafe",
          color: "#1d4ed8",
        };

      case "reviewing":
        return {
          background: "#fef3c7",
          color: "#92400e",
        };

      case "submitted":
      default:
        return {
          background: "#f3f4f6",
          color: "#374151",
        };
    }
  };

  // ============================================================
  // SEVERITY STYLE
  // ============================================================

  const getSeverityStyle = (severity) => {
    const normalizedSeverity = String(severity || "")
      .trim()
      .toUpperCase();

    switch (normalizedSeverity) {
      case "CRITICAL":
        return {
          background: "#fee2e2",
          color: "#991b1b",
        };

      case "HIGH":
        return {
          background: "#ffedd5",
          color: "#c2410c",
        };

      case "MEDIUM":
        return {
          background: "#fef3c7",
          color: "#92400e",
        };

      case "LOW":
        return {
          background: "#dcfce7",
          color: "#166534",
        };

      default:
        return {
          background: "#f3f4f6",
          color: "#6b7280",
        };
    }
  };

  // ============================================================
  // OPEN REPORT DETAILS
  // ============================================================

  const handleOpenReport = (reportId) => {
    if (!reportId) {
      return;
    }

    navigate(`/report/${reportId}`);
  };

  // ============================================================
  // RENDER
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
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "10px 18px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#374151",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          ← Dashboard
        </button>
      </header>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "45px 24px 60px",
        }}
      >
        {/* ======================================================
            TITLE
        ====================================================== */}

        <div style={{ marginBottom: "30px" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#6b7280",
            }}
          >
            YOUR ACTIVITY
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "34px",
              lineHeight: "1.2",
            }}
          >
            My Reports
          </h2>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            View the community problems you have reported through
            CivicAI.
          </p>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
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
            LOADING
        ====================================================== */}

        {loading && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "45px",
              textAlign: "center",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                color: "#6b7280",
              }}
            >
              Loading your reports...
            </div>
          </div>
        )}

        {/* ======================================================
            EMPTY STATE
        ====================================================== */}

        {!loading && !error && reports.length === 0 && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "55px 30px",
              textAlign: "center",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "15px",
              }}
            >
              📝
            </div>

            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "22px",
              }}
            >
              No reports yet
            </h3>

            <p
              style={{
                margin: "0 auto 25px",
                maxWidth: "500px",
                color: "#6b7280",
                lineHeight: "1.6",
              }}
            >
              You haven't reported any community problems yet.
              Help your community by submitting your first report.
            </p>

            <button
              type="button"
              onClick={() => navigate("/report")}
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
              📝 Report a Problem
            </button>
          </div>
        )}

        {/* ======================================================
            REPORT LIST
        ====================================================== */}

        {!loading && !error && reports.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {reports.map((report) => {
              const statusStyle = getStatusStyle(report.status);
              const severityStyle = getSeverityStyle(report.severity);

              return (
                <div
                  key={report.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenReport(report.id)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      handleOpenReport(report.id);
                    }
                  }}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "25px",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
                    border: "1px solid #eef0f3",
                    cursor: "pointer",
                    transition:
                      "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                    outline: "none",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform =
                      "translateY(-2px)";
                    event.currentTarget.style.boxShadow =
                      "0 10px 28px rgba(0, 0, 0, 0.08)";
                    event.currentTarget.style.borderColor =
                      "#d1d5db";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform =
                      "translateY(0)";
                    event.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(0, 0, 0, 0.05)";
                    event.currentTarget.style.borderColor =
                      "#eef0f3";
                  }}
                >
                  {/* ==================================================
                      TOP ROW
                  ================================================== */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "15px",
                      flexWrap: "wrap",
                      marginBottom: "15px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#9ca3af",
                          marginBottom: "6px",
                        }}
                      >
                        Report #{report.id.slice(0, 8)}
                      </div>

                      <h3
                        style={{
                          margin: 0,
                          fontSize: "20px",
                          color: "#111827",
                        }}
                      >
                        {report.category || "Other"}
                      </h3>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "600",
                          ...statusStyle,
                        }}
                      >
                        {report.status || "submitted"}
                      </span>

                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "600",
                          ...severityStyle,
                        }}
                      >
                        Severity: {report.severity || "pending"}
                      </span>
                    </div>
                  </div>

                  {/* ==================================================
                      DESCRIPTION
                  ================================================== */}

                  <p
                    style={{
                      margin: "0 0 18px",
                      color: "#374151",
                      lineHeight: "1.6",
                      fontSize: "15px",
                    }}
                  >
                    {report.description}
                  </p>

                  {/* ==================================================
                      DETAILS
                  ================================================== */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "12px",
                      paddingTop: "16px",
                      borderTop: "1px solid #f0f1f3",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginBottom: "4px",
                        }}
                      >
                        LOCATION
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                        }}
                      >
                        📍 {report.location || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginBottom: "4px",
                        }}
                      >
                        PRIORITY SCORE
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                          fontWeight: "600",
                        }}
                      >
                        {typeof report.priorityScore === "number"
                          ? report.priorityScore
                          : 0}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginBottom: "4px",
                        }}
                      >
                        SUBMITTED
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                        }}
                      >
                        {formatDate(report.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      VIEW DETAILS HINT
                  ================================================== */}

                  <div
                    style={{
                      marginTop: "18px",
                      paddingTop: "14px",
                      borderTop: "1px solid #f0f1f3",
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        fontWeight: "600",
                      }}
                    >
                      View full report →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================
            BOTTOM ACTION
        ====================================================== */}

        {!loading && !error && reports.length > 0 && (
          <div
            style={{
              marginTop: "25px",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/report")}
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
        )}
      </main>
    </div>
  );
}