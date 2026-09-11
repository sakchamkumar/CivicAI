import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import { db } from "../firebase";

import "leaflet/dist/leaflet.css";

// ============================================================
// FIX DEFAULT LEAFLET MARKER ICON
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ============================================================
// CONSTANTS
// ============================================================

const CATEGORIES = [
  "Road",
  "Waste",
  "Water",
  "Electricity",
  "Traffic",
  "Public Safety",
  "Environment",
  "Other",
];

const SEVERITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

// ============================================================
// HELPERS
// ============================================================

function normalizeStatus(status) {
  return String(status || "submitted")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeSeverity(severity) {
  return String(severity || "low")
    .trim()
    .toUpperCase();
}

function normalizeCategory(category) {
  return String(category || "Other")
    .trim()
    .toLowerCase();
}

function getSeverityColor(severity) {
  const value = normalizeSeverity(severity);

  if (value === "CRITICAL") return "#991b1b";
  if (value === "HIGH") return "#dc2626";
  if (value === "MEDIUM") return "#d97706";

  return "#16a34a";
}

function formatDate(timestamp) {
  if (!timestamp) return "Unknown date";

  try {
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString();
    }

    return new Date(timestamp).toLocaleDateString();
  } catch {
    return "Unknown date";
  }
}

// ============================================================
// COMPONENT
// ============================================================

export default function CommunityMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // FILTERS
  // ==========================================================

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // ==========================================================
  // LOAD REPORTS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const snapshot = await getDocs(collection(db, "reports"));

        const loadedReports = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (report) =>
              typeof report.latitude === "number" &&
              typeof report.longitude === "number"
          );

        if (mounted) {
          setReports(loadedReports);
        }
      } catch (err) {
        console.error("Community map error:", err);

        if (mounted) {
          setError(
            "Unable to load community reports. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // FILTER REPORTS
  // ==========================================================

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const categoryMatches =
        categoryFilter === "ALL" ||
        normalizeCategory(report.category) ===
          normalizeCategory(categoryFilter);

      const severityMatches =
        severityFilter === "ALL" ||
        normalizeSeverity(report.severity) ===
          severityFilter;

      return categoryMatches && severityMatches;
    });
  }, [reports, categoryFilter, severityFilter]);

  // ==========================================================
  // MAP CENTER
  // ==========================================================

  const mapCenter = useMemo(() => {
    if (filteredReports.length > 0) {
      return [
        filteredReports[0].latitude,
        filteredReports[0].longitude,
      ];
    }

    if (reports.length > 0) {
      return [reports[0].latitude, reports[0].longitude];
    }

    // Default center: India
    return [22.9734, 78.6569];
  }, [filteredReports, reports]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const highPriorityCount = filteredReports.filter((report) => {
    const severity = normalizeSeverity(report.severity);

    return (
      severity === "HIGH" ||
      severity === "CRITICAL" ||
      Number(report.priorityScore || 0) >= 70
    );
  }).length;

  const categoryCount = new Set(
    filteredReports
      .map((report) => report.category)
      .filter(Boolean)
  ).size;

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const handleResetFilters = () => {
    setCategoryFilter("ALL");
    setSeverityFilter("ALL");
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              color: "#2563eb",
              fontSize: "14px",
              fontWeight: "700",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            CIVICAI COMMUNITY
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "34px",
              color: "#111827",
            }}
          >
            Community Problem Map
          </h1>

          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
              color: "#6b7280",
              fontSize: "16px",
            }}
          >
            Explore reported community problems and their locations.
          </p>
        </div>

        {/* ====================================================
            STAT CARDS
        ==================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            title="Mapped Reports"
            value={filteredReports.length}
            icon="📍"
          />

          <StatCard
            title="High Priority"
            value={highPriorityCount}
            icon="🚨"
          />

          <StatCard
            title="Categories"
            value={categoryCount}
            icon="🗂️"
          />
        </div>

        {/* ====================================================
            FILTER PANEL
        ==================================================== */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
            boxShadow: "0 5px 20px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  color: "#111827",
                }}
              >
                Filter Community Reports
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                Narrow the map by problem category or severity.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: "9px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#374151",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {/* CATEGORY */}

            <div>
              <label
                htmlFor="category-filter"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#374151",
                }}
              >
                Problem Category
              </label>

              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "9px",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="ALL">
                  All Categories
                </option>

                {CATEGORIES.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* SEVERITY */}

            <div>
              <label
                htmlFor="severity-filter"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#374151",
                }}
              >
                Severity
              </label>

              <select
                id="severity-filter"
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(event.target.value)
                }
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "9px",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="ALL">
                  All Severities
                </option>

                {SEVERITIES.map((severity) => (
                  <option
                    key={severity}
                    value={severity}
                  >
                    {severity.charAt(0) +
                      severity.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FILTER RESULT */}

          <div
            style={{
              marginTop: "16px",
              padding: "11px 13px",
              background: "#f8fafc",
              borderRadius: "9px",
              color: "#475569",
              fontSize: "13px",
            }}
          >
            Showing{" "}
            <strong style={{ color: "#111827" }}>
              {filteredReports.length}
            </strong>{" "}
            of{" "}
            <strong style={{ color: "#111827" }}>
              {reports.length}
            </strong>{" "}
            mapped reports
          </div>
        </section>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "14px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* ====================================================
            MAP
        ==================================================== */}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  color: "#111827",
                }}
              >
                Report Locations
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Each marker represents a report with GPS coordinates.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#dc2626",
                  display: "inline-block",
                }}
              />

              Higher priority
            </div>
          </div>

          {loading ? (
            <div
              style={{
                height: "620px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                fontSize: "16px",
              }}
            >
              Loading community reports...
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={filteredReports.length > 0 ? 13 : 5}
              scrollWheelZoom={true}
              style={{
                width: "100%",
                height: "620px",
              }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filteredReports.map((report) => {
                const severity = normalizeSeverity(
                  report.severity
                );

                const markerColor =
                  getSeverityColor(severity);

                const icon = L.divIcon({
                  className: "",
                  html: `
                    <div
                      style="
                        width: 30px;
                        height: 30px;
                        border-radius: 50% 50% 50% 0;
                        background: ${markerColor};
                        transform: rotate(-45deg);
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      "
                    ></div>
                  `,
                  iconSize: [30, 30],
                  iconAnchor: [15, 30],
                  popupAnchor: [0, -28],
                });

                return (
                  <Marker
                    key={report.id}
                    position={[
                      report.latitude,
                      report.longitude,
                    ]}
                    icon={icon}
                  >
                    <Popup>
                      <div
                        style={{
                          minWidth: "220px",
                          fontFamily: "Arial, sans-serif",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginBottom: "5px",
                          }}
                        >
                          {report.category ||
                            "Community Problem"}
                        </div>

                        <div
                          style={{
                            fontSize: "17px",
                            fontWeight: "700",
                            color: "#111827",
                            marginBottom: "10px",
                          }}
                        >
                          {report.subcategory ||
                            "Reported Problem"}
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            lineHeight: "1.5",
                            color: "#374151",
                            marginBottom: "10px",
                          }}
                        >
                          {report.description ||
                            "No description available."}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                            fontSize: "12px",
                          }}
                        >
                          <div>
                            <strong>Severity:</strong>{" "}
                            <span
                              style={{
                                color: markerColor,
                                fontWeight: "700",
                                textTransform: "uppercase",
                              }}
                            >
                              {severity}
                            </span>
                          </div>

                          <div>
                            <strong>Status:</strong>{" "}
                            {normalizeStatus(
                              report.status
                            )}
                          </div>

                          <div>
                            <strong>Priority:</strong>{" "}
                            {report.priorityScore ??
                              "Not scored"}
                          </div>

                          <div>
                            <strong>Reported:</strong>{" "}
                            {formatDate(report.createdAt)}
                          </div>

                          {report.address && (
                            <div>
                              <strong>Location:</strong>{" "}
                              {report.address}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: "10px",
                            paddingTop: "10px",
                            borderTop:
                              "1px solid #e5e7eb",
                            fontSize: "11px",
                            color: "#6b7280",
                          }}
                        >
                          {report.latitude.toFixed(6)},{" "}
                          {report.longitude.toFixed(6)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* ====================================================
            NO FILTER RESULTS
        ==================================================== */}

        {!loading &&
          reports.length > 0 &&
          filteredReports.length === 0 && (
            <div
              style={{
                marginTop: "18px",
                padding: "18px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              No reports match the selected filters.
              <br />

              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  marginTop: "10px",
                  padding: "8px 13px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#374151",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {!loading &&
          reports.length === 0 &&
          !error && (
            <div
              style={{
                marginTop: "18px",
                padding: "18px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              No GPS-based community reports are available yet.
              Reports created with GPS will appear here.
            </div>
          )}
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ title, value, icon }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0 5px 20px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          marginBottom: "12px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#111827",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        {title}
      </div>
    </div>
  );
}