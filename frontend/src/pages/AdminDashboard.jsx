import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { auth, db } from "../firebase";
import API_BASE_URL from "../config";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // ============================================================
  // STATE
  // ============================================================

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState("");

  const [updatingReportId, setUpdatingReportId] =
    useState(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  // ============================================================
  // SEARCH / FILTER STATE
  // ============================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // ============================================================
  // LOAD ALL REPORTS
  // ============================================================

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      setReportsError("");

      const reportsQuery = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(reportsQuery);

      const loadedReports = [];

      snapshot.forEach((document) => {
        const data = document.data();

        loadedReports.push({
          id: document.id,
          ...data,
        });
      });

      setReports(loadedReports);
    } catch (error) {
      console.error(
        "Error loading admin reports:",
        error
      );

      setReportsError(
        "Unable to load community reports."
      );
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ============================================================
  // UPDATE REPORT STATUS
  // ============================================================

  const handleStatusChange = async (
    reportId,
    newStatus
  ) => {
    if (!reportId || !newStatus) {
      return;
    }

    const currentReport = reports.find(
      (report) => report.id === reportId
    );

    if (!currentReport) {
      return;
    }

    const currentStatus = String(
      currentReport.status || "submitted"
    )
      .trim()
      .toLowerCase();

    const normalizedNewStatus = String(newStatus)
      .trim()
      .toLowerCase();

    if (currentStatus === normalizedNewStatus) {
      return;
    }

    try {
      setUpdatingReportId(reportId);
      setStatusMessage("");
      setStatusError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const idToken =
        await currentUser.getIdToken();

      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/reports/${reportId}/status`,
        {
          status: normalizedNewStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (
        !response.data ||
        !response.data.success
      ) {
        throw new Error(
          response.data?.error ||
            "Failed to update report status."
        );
      }

      setReports((previousReports) =>
        previousReports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: normalizedNewStatus,
                updatedAt:
                  response.data.report?.updatedAt ||
                  new Date(),
              }
            : report
        )
      );

      setStatusMessage(
        `Report #${reportId.slice(
          0,
          8
        )} status updated to ${formatStatus(
          normalizedNewStatus
        )}.`
      );
    } catch (error) {
      console.error(
        "Admin status update error:",
        error
      );

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update report status.";

      setStatusError(errorMessage);

      await loadReports();
    } finally {
      setUpdatingReportId(null);
    }
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalReports = reports.length;

  const inProgressReports = reports.filter((report) => {
    const status = String(report.status || "")
      .trim()
      .toLowerCase();

    return (
      status === "in-progress" ||
      status === "in progress" ||
      status === "reviewing"
    );
  }).length;

  const resolvedReports = reports.filter((report) => {
    const status = String(report.status || "")
      .trim()
      .toLowerCase();

    return status === "resolved";
  }).length;

  const highPriorityReports = reports.filter((report) => {
    const severity = String(report.severity || "")
      .trim()
      .toLowerCase();

    const priorityScore =
      Number(report.priorityScore) || 0;

    return (
      severity === "high" ||
      severity === "critical" ||
      priorityScore >= 70
    );
  }).length;

  const stats = [
    {
      icon: "📋",
      title: "Total Reports",
      value: loadingReports ? "…" : totalReports,
      description: "All community reports",
    },
    {
      icon: "🚨",
      title: "High Priority",
      value: loadingReports
        ? "…"
        : highPriorityReports,
      description: "Reports requiring attention",
    },
    {
      icon: "⏳",
      title: "In Progress",
      value: loadingReports
        ? "…"
        : inProgressReports,
      description: "Reports being reviewed",
    },
    {
      icon: "✅",
      title: "Resolved",
      value: loadingReports
        ? "…"
        : resolvedReports,
      description: "Problems marked resolved",
    },
  ];

  // ============================================================
  // FILTER OPTIONS
  // ============================================================

  const categories = [
    ...new Set(
      reports
        .map((report) =>
          String(report.category || "")
            .trim()
        )
        .filter(Boolean)
    ),
  ].sort();

  // ============================================================
  // NORMALIZE STATUS
  // ============================================================

  const normalizeStatus = (status) => {
    const normalized = String(status || "submitted")
      .trim()
      .toLowerCase();

    if (normalized === "in progress") {
      return "in-progress";
    }

    return normalized;
  };

  // ============================================================
  // FILTERED REPORTS
  // ============================================================

  const filteredReports = reports.filter((report) => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    const normalizedCategory = String(
      report.category || ""
    )
      .trim()
      .toLowerCase();

    const normalizedSubcategory = String(
      report.aiSubcategory || report.subcategory || ""
    )
      .trim()
      .toLowerCase();

    const normalizedDescription = String(
      report.description || ""
    )
      .trim()
      .toLowerCase();

    const normalizedReportId = String(
      report.id || ""
    )
      .trim()
      .toLowerCase();

    const normalizedStatus = normalizeStatus(
      report.status
    );

    const normalizedSeverity = String(
      report.severity || ""
    )
      .trim()
      .toLowerCase();

    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    const matchesSearch =
      !normalizedSearch ||
      normalizedReportId.includes(
        normalizedSearch
      ) ||
      normalizedCategory.includes(
        normalizedSearch
      ) ||
      normalizedSubcategory.includes(
        normalizedSearch
      ) ||
      normalizedDescription.includes(
        normalizedSearch
      );

    // ----------------------------------------------------------
    // CATEGORY
    // ----------------------------------------------------------

    const matchesCategory =
      categoryFilter === "all" ||
      normalizedCategory ===
        categoryFilter.toLowerCase();

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    const matchesStatus =
      statusFilter === "all" ||
      normalizedStatus ===
        statusFilter.toLowerCase();

    // ----------------------------------------------------------
    // SEVERITY
    // ----------------------------------------------------------

    const matchesSeverity =
      severityFilter === "all" ||
      normalizedSeverity ===
        severityFilter.toLowerCase();

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesSeverity
    );
  });

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSeverityFilter("all");
  };

  const filtersActive =
    searchTerm.trim() !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    severityFilter !== "all";

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Unknown date";
    }

    try {
      if (
        typeof timestamp.toDate ===
        "function"
      ) {
        return timestamp.toDate().toLocaleString();
      }

      if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }

      return new Date(timestamp).toLocaleString();
    } catch {
      return "Unknown date";
    }
  };

  // ============================================================
  // FORMAT STATUS
  // ============================================================

  const formatStatus = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (normalized === "in-progress") {
      return "In Progress";
    }

    if (normalized === "reviewing") {
      return "Reviewing";
    }

    if (normalized === "resolved") {
      return "Resolved";
    }

    return "Submitted";
  };

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusStyle = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (normalized === "resolved") {
      return {
        background: "#ecfdf5",
        color: "#047857",
      };
    }

    if (
      normalized === "in-progress" ||
      normalized === "in progress"
    ) {
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
      };
    }

    if (normalized === "reviewing") {
      return {
        background: "#f5f3ff",
        color: "#6d28d9",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#374151",
    };
  };

  // ============================================================
  // SEVERITY STYLE
  // ============================================================

  const getSeverityStyle = (severity) => {
    const normalized = String(severity || "")
      .trim()
      .toLowerCase();

    if (normalized === "critical") {
      return {
        background: "#fef2f2",
        color: "#991b1b",
      };
    }

    if (normalized === "high") {
      return {
        background: "#fff7ed",
        color: "#c2410c",
      };
    }

    if (normalized === "medium") {
      return {
        background: "#fffbeb",
        color: "#a16207",
      };
    }

    if (normalized === "low") {
      return {
        background: "#f0fdf4",
        color: "#15803d",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#374151",
    };
  };

  // ============================================================
  // OPEN REPORT
  // ============================================================

  const handleOpenReport = (reportId) => {
    navigate(`/report/${reportId}`);
  };

  // ============================================================
  // SAFE LOCATION DISPLAY
  // ============================================================

  const getLocationDisplay = (report) => {
    if (
      report.location &&
      typeof report.location === "string"
    ) {
      return report.location;
    }

    const latitude = Number(report.latitude);
    const longitude = Number(report.longitude);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return `${latitude.toFixed(
        4
      )}, ${longitude.toFixed(4)}`;
    }

    return "Not provided";
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
          gap: "20px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: "700",
              color: "#111827",
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              background: "#f3f4f6",
              color: "#374151",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            👑 ADMIN
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#111827",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <main
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "45px 24px 60px",
        }}
      >
        {/* ======================================================
            ADMIN WELCOME
        ====================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "35px",
            marginBottom: "28px",
            boxShadow:
              "0 8px 25px rgba(0, 0, 0, 0.05)",
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
            CIVICAI ADMINISTRATION
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "34px",
              lineHeight: "1.2",
              color: "#111827",
            }}
          >
            Admin Dashboard 👑
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#6b7280",
              maxWidth: "780px",
            }}
          >
            Monitor community problems, review reports,
            update their progress, and understand the
            current state of CivicAI activity.
          </p>

          <div
            style={{
              marginTop: "25px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              style={{
                padding: "12px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "9px",
                background: "#ffffff",
                color: "#374151",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ← User Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/map")
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
              🗺️ Community Map
            </button>
          </div>
        </section>

        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <section
          style={{
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "22px",
                color: "#111827",
              }}
            >
              Community Overview
            </h3>

            <p
              style={{
                margin: "5px 0 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Current report activity across CivicAI.
            </p>
          </div>

          {reportsError && (
            <div
              style={{
                marginBottom: "15px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "13px",
              }}
            >
              ❌ {reportsError}
            </div>
          )}

          {statusMessage && (
            <div
              style={{
                marginBottom: "15px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#047857",
                fontSize: "13px",
              }}
            >
              ✅ {statusMessage}
            </div>
          )}

          {statusError && (
            <div
              style={{
                marginBottom: "15px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "13px",
              }}
            >
              ❌ {statusError}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.title}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow:
                    "0 6px 20px rgba(0, 0, 0, 0.04)",
                  border: "1px solid #eef0f4",
                }}
              >
                <div
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: "12px",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    marginBottom: "17px",
                  }}
                >
                  {stat.icon}
                </div>

                <p
                  style={{
                    margin: "0 0 5px",
                    fontSize: "14px",
                    color: "#6b7280",
                    fontWeight: "600",
                  }}
                >
                  {stat.title}
                </p>

                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "5px",
                  }}
                >
                  {stat.value}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#9ca3af",
                  }}
                >
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================
            ALL REPORTS
        ====================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            boxShadow:
              "0 8px 25px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "15px",
              marginBottom: "22px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#111827",
                }}
              >
                Community Reports
              </h3>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Review reports submitted by CivicAI
                users and update their progress.
              </p>
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#f3f4f6",
                color: "#374151",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {loadingReports
                ? "Loading..."
                : `${reports.length} report${
                    reports.length === 1
                      ? ""
                      : "s"
                  }`}
            </div>
          </div>

          {/* ====================================================
              SEARCH AND FILTERS
          ==================================================== */}

          {!loadingReports &&
            !reportsError &&
            reports.length > 0 && (
              <div
                style={{
                  marginBottom: "24px",
                  padding: "18px",
                  borderRadius: "14px",
                  background: "#f9fafb",
                  border: "1px solid #eef0f4",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(240px, 2fr) repeat(3, minmax(150px, 1fr))",
                    gap: "12px",
                    alignItems: "end",
                  }}
                >
                  {/* SEARCH */}

                  <div>
                    <label
                      htmlFor="admin-report-search"
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#374151",
                      }}
                    >
                      Search Reports
                    </label>

                    <input
                      id="admin-report-search"
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search description, category, ID..."
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#ffffff",
                        color: "#111827",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* CATEGORY */}

                  <div>
                    <label
                      htmlFor="admin-category-filter"
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#374151",
                      }}
                    >
                      Category
                    </label>

                    <select
                      id="admin-category-filter"
                      value={categoryFilter}
                      onChange={(event) =>
                        setCategoryFilter(
                          event.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#ffffff",
                        color: "#374151",
                        fontSize: "13px",
                        fontWeight: "600",
                        outline: "none",
                      }}
                    >
                      <option value="all">
                        All Categories
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* STATUS */}

                  <div>
                    <label
                      htmlFor="admin-status-filter"
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#374151",
                      }}
                    >
                      Status
                    </label>

                    <select
                      id="admin-status-filter"
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#ffffff",
                        color: "#374151",
                        fontSize: "13px",
                        fontWeight: "600",
                        outline: "none",
                      }}
                    >
                      <option value="all">
                        All Statuses
                      </option>

                      <option value="submitted">
                        Submitted
                      </option>

                      <option value="reviewing">
                        Reviewing
                      </option>

                      <option value="in-progress">
                        In Progress
                      </option>

                      <option value="resolved">
                        Resolved
                      </option>
                    </select>
                  </div>

                  {/* SEVERITY */}

                  <div>
                    <label
                      htmlFor="admin-severity-filter"
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#374151",
                      }}
                    >
                      Severity
                    </label>

                    <select
                      id="admin-severity-filter"
                      value={severityFilter}
                      onChange={(event) =>
                        setSeverityFilter(
                          event.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#ffffff",
                        color: "#374151",
                        fontSize: "13px",
                        fontWeight: "600",
                        outline: "none",
                      }}
                    >
                      <option value="all">
                        All Severities
                      </option>

                      <option value="critical">
                        Critical
                      </option>

                      <option value="high">
                        High
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="low">
                        Low
                      </option>
                    </select>
                  </div>
                </div>

                {/* FILTER SUMMARY */}

                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Showing{" "}
                    <strong
                      style={{
                        color: "#374151",
                      }}
                    >
                      {filteredReports.length}
                    </strong>{" "}
                    of{" "}
                    <strong
                      style={{
                        color: "#374151",
                      }}
                    >
                      {reports.length}
                    </strong>{" "}
                    reports
                  </div>

                  {filtersActive && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      style={{
                        padding: "8px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#ffffff",
                        color: "#374151",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* ====================================================
              LOADING
          ==================================================== */}

          {loadingReports && (
            <div
              style={{
                padding: "50px 20px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Loading community reports...
            </div>
          )}

          {/* ====================================================
              ERROR
          ==================================================== */}

          {!loadingReports &&
            reportsError && (
              <div
                style={{
                  padding: "35px 20px",
                  textAlign: "center",
                  color: "#991b1b",
                  fontSize: "14px",
                }}
              >
                Unable to display reports.
              </div>
            )}

          {/* ====================================================
              EMPTY DATABASE
          ==================================================== */}

          {!loadingReports &&
            !reportsError &&
            reports.length === 0 && (
              <div
                style={{
                  padding: "50px 20px",
                  textAlign: "center",
                  border:
                    "1px dashed #d1d5db",
                  borderRadius: "14px",
                  color: "#6b7280",
                }}
              >
                <div
                  style={{
                    fontSize: "35px",
                    marginBottom: "12px",
                  }}
                >
                  📋
                </div>

                <h4
                  style={{
                    margin: "0 0 7px",
                    color: "#374151",
                    fontSize: "17px",
                  }}
                >
                  No reports yet
                </h4>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                  }}
                >
                  Community reports will appear here
                  once users start submitting problems.
                </p>
              </div>
            )}

          {/* ====================================================
              NO FILTER RESULTS
          ==================================================== */}

          {!loadingReports &&
            !reportsError &&
            reports.length > 0 &&
            filteredReports.length === 0 && (
              <div
                style={{
                  padding: "45px 20px",
                  textAlign: "center",
                  border:
                    "1px dashed #d1d5db",
                  borderRadius: "14px",
                  color: "#6b7280",
                }}
              >
                <div
                  style={{
                    fontSize: "34px",
                    marginBottom: "12px",
                  }}
                >
                  🔎
                </div>

                <h4
                  style={{
                    margin: "0 0 7px",
                    color: "#374151",
                    fontSize: "17px",
                  }}
                >
                  No matching reports
                </h4>

                <p
                  style={{
                    margin: "0 0 15px",
                    fontSize: "13px",
                  }}
                >
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    padding: "9px 15px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}

          {/* ====================================================
              REPORT LIST
          ==================================================== */}

          {!loadingReports &&
            !reportsError &&
            filteredReports.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {filteredReports.map((report) => {
                  const statusStyle =
                    getStatusStyle(
                      report.status
                    );

                  const severityStyle =
                    getSeverityStyle(
                      report.severity
                    );

                  const priorityScore =
                    Number(
                      report.priorityScore
                    ) || 0;

                  const currentStatus =
                    String(
                      report.status ||
                        "submitted"
                    )
                      .trim()
                      .toLowerCase();

                  const normalizedCurrentStatus =
                    currentStatus ===
                    "in progress"
                      ? "in-progress"
                      : currentStatus;

                  const isUpdating =
                    updatingReportId ===
                    report.id;

                  return (
                    <div
                      key={report.id}
                      onClick={() =>
                        handleOpenReport(
                          report.id
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          handleOpenReport(
                            report.id
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "20px",
                        background:
                          "#ffffff",
                        cursor: "pointer",
                        transition:
                          "box-shadow 0.2s ease, transform 0.2s ease",
                      }}
                      onMouseEnter={(
                        event
                      ) => {
                        event.currentTarget.style.boxShadow =
                          "0 8px 22px rgba(0, 0, 0, 0.08)";

                        event.currentTarget.style.transform =
                          "translateY(-1px)";
                      }}
                      onMouseLeave={(
                        event
                      ) => {
                        event.currentTarget.style.boxShadow =
                          "none";

                        event.currentTarget.style.transform =
                          "translateY(0)";
                      }}
                    >
                      {/* ----------------------------------------
                          TOP ROW
                      ----------------------------------------- */}

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: "15px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                              flexWrap:
                                "wrap",
                              marginBottom:
                                "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize:
                                  "12px",
                                fontWeight:
                                  "700",
                                color:
                                  "#6b7280",
                              }}
                            >
                              REPORT
                            </span>

                            <span
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#9ca3af",
                              }}
                            >
                              #
                              {report.id.slice(
                                0,
                                8
                              )}
                            </span>
                          </div>

                          <h4
                            style={{
                              margin: 0,
                              fontSize:
                                "17px",
                              color:
                                "#111827",
                            }}
                          >
                            {report.aiSubcategory ||
                              report.category ||
                              "Community Problem"}
                          </h4>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "8px",
                            flexWrap:
                              "wrap",
                            alignItems:
                              "center",
                          }}
                        >
                          <span
                            style={{
                              padding:
                                "6px 9px",
                              borderRadius:
                                "999px",
                              background:
                                severityStyle.background,
                              color:
                                severityStyle.color,
                              fontSize:
                                "11px",
                              fontWeight:
                                "700",
                            }}
                          >
                            {String(
                              report.severity ||
                                "UNKNOWN"
                            ).toUpperCase()}
                          </span>

                          <span
                            style={{
                              padding:
                                "6px 9px",
                              borderRadius:
                                "999px",
                              background:
                                statusStyle.background,
                              color:
                                statusStyle.color,
                              fontSize:
                                "11px",
                              fontWeight:
                                "700",
                            }}
                          >
                            {formatStatus(
                              report.status
                            ).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* ----------------------------------------
                          DESCRIPTION
                      ----------------------------------------- */}

                      <p
                        style={{
                          margin:
                            "14px 0",
                          color:
                            "#4b5563",
                          fontSize:
                            "14px",
                          lineHeight:
                            "1.6",
                        }}
                      >
                        {report.description ||
                          "No description provided."}
                      </p>

                      {/* ----------------------------------------
                          REPORT INFORMATION
                      ----------------------------------------- */}

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(170px, 1fr))",
                          gap: "10px",
                          marginBottom:
                            "15px",
                        }}
                      >
                        <InfoItem
                          label="Category"
                          value={
                            report.category ||
                            "Other"
                          }
                        />

                        <InfoItem
                          label="Priority"
                          value={`${priorityScore}/100`}
                        />

                        <InfoItem
                          label="Location"
                          value={getLocationDisplay(
                            report
                          )}
                        />

                        <InfoItem
                          label="Submitted"
                          value={formatDate(
                            report.createdAt
                          )}
                        />
                      </div>

                      {/* ----------------------------------------
                          ADMIN STATUS CONTROL
                      ----------------------------------------- */}

                      <div
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                        style={{
                          marginTop:
                            "4px",
                          marginBottom:
                            "15px",
                          padding:
                            "14px",
                          borderRadius:
                            "11px",
                          background:
                            "#f9fafb",
                          border:
                            "1px solid #eef0f4",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "12px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                fontWeight:
                                  "700",
                                color:
                                  "#374151",
                                marginBottom:
                                  "4px",
                              }}
                            >
                              ADMIN STATUS CONTROL
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#9ca3af",
                              }}
                            >
                              Update the current
                              progress of this
                              community report.
                            </div>
                          </div>

                          <select
                            value={
                              normalizedCurrentStatus
                            }
                            disabled={
                              isUpdating
                            }
                            onChange={(
                              event
                            ) =>
                              handleStatusChange(
                                report.id,
                                event.target
                                  .value
                              )
                            }
                            onClick={(
                              event
                            ) =>
                              event.stopPropagation()
                            }
                            style={{
                              minWidth:
                                "170px",
                              padding:
                                "10px 12px",
                              border:
                                "1px solid #d1d5db",
                              borderRadius:
                                "8px",
                              background:
                                isUpdating
                                  ? "#f3f4f6"
                                  : "#ffffff",
                              color:
                                "#374151",
                              fontSize:
                                "13px",
                              fontWeight:
                                "600",
                              cursor:
                                isUpdating
                                  ? "not-allowed"
                                  : "pointer",
                              outline:
                                "none",
                            }}
                          >
                            <option value="submitted">
                              Submitted
                            </option>

                            <option value="reviewing">
                              Reviewing
                            </option>

                            <option value="in-progress">
                              In Progress
                            </option>

                            <option value="resolved">
                              Resolved
                            </option>
                          </select>
                        </div>

                        {isUpdating && (
                          <div
                            style={{
                              marginTop:
                                "9px",
                              fontSize:
                                "12px",
                              color:
                                "#2563eb",
                              fontWeight:
                                "600",
                            }}
                          >
                            Updating report status...
                          </div>
                        )}
                      </div>

                      {/* ----------------------------------------
                          FOOTER
                      ----------------------------------------- */}

                      <div
                        style={{
                          borderTop:
                            "1px solid #f0f1f3",
                          paddingTop:
                            "13px",
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap:
                            "10px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#9ca3af",
                          }}
                        >
                          User ID:{" "}
                          {report.userId
                            ? `${report.userId.slice(
                                0,
                                12
                              )}...`
                            : "Unknown"}
                        </span>

                        <span
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "#374151",
                            fontWeight:
                              "600",
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
        </section>

        {/* ======================================================
            ADMIN ACCOUNT
        ====================================================== */}

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "13px",
          }}
        >
          Admin account:{" "}
          <strong
            style={{
              color: "#6b7280",
            }}
          >
            {user?.email || "Unknown user"}
          </strong>
        </div>
      </main>
    </div>
  );
}

// ================================================================
// INFO ITEM
// ================================================================

function InfoItem({ label, value }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "9px",
        background: "#f9fafb",
        border: "1px solid #f0f1f3",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          marginBottom: "4px",
          fontWeight: "600",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#374151",
          fontWeight: "600",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}