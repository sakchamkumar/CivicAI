import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";

// ============================================================
// HELPERS
// ============================================================

const CATEGORY_ORDER = [
  "Road",
  "Waste",
  "Water",
  "Electricity",
  "Traffic",
  "Public Safety",
  "Environment",
  "Other",
];

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const STATUS_ORDER = [
  "submitted",
  "reviewing",
  "in-progress",
  "resolved",
];

function normalizeStatus(status) {
  if (!status) {
    return "submitted";
  }

  const normalized = String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (normalized === "inprogress") {
    return "in-progress";
  }

  return normalized;
}

function normalizeCategory(category) {
  if (!category) {
    return "Other";
  }

  const value = String(category).trim();

  const match = CATEGORY_ORDER.find(
    (item) => item.toLowerCase() === value.toLowerCase()
  );

  return match || value;
}

function normalizeSeverity(severity) {
  if (!severity) {
    return "LOW";
  }

  const value = String(severity).trim().toUpperCase();

  if (SEVERITY_ORDER.includes(value)) {
    return value;
  }

  return "LOW";
}

function formatStatus(status) {
  const normalized = normalizeStatus(status);

  const labels = {
    submitted: "Submitted",
    reviewing: "Reviewing",
    "in-progress": "In Progress",
    resolved: "Resolved",
  };

  return labels[normalized] || normalized;
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "Unknown date";
  }

  try {
    if (
      typeof timestamp === "object" &&
      typeof timestamp.toDate === "function"
    ) {
      return timestamp.toDate().toLocaleDateString();
    }

    if (
      typeof timestamp === "object" &&
      typeof timestamp.seconds === "number"
    ) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }

    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.error("Date formatting failed:", error);
  }

  return "Unknown date";
}

function getTimestampDate(timestamp) {
  if (!timestamp) {
    return null;
  }

  try {
    if (
      typeof timestamp === "object" &&
      typeof timestamp.toDate === "function"
    ) {
      return timestamp.toDate();
    }

    if (
      typeof timestamp === "object" &&
      typeof timestamp.seconds === "number"
    ) {
      return new Date(timestamp.seconds * 1000);
    }

    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  } catch (error) {
    return null;
  }

  return null;
}

function getPriorityScore(report) {
  const score = Number(report?.priorityScore);

  if (Number.isFinite(score)) {
    return Math.max(0, Math.min(100, score));
  }

  const severity = normalizeSeverity(report?.severity);

  const fallbackScores = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25,
  };

  return fallbackScores[severity] || 0;
}

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

function StatCard({ icon, label, value, description }) {
  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-icon">{icon}</div>

      <div className="analytics-stat-content">
        <div className="analytics-stat-value">{value}</div>
        <div className="analytics-stat-label">{label}</div>

        {description && (
          <div className="analytics-stat-description">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="analytics-section-card">
      <div className="analytics-section-header">
        <div>
          <h2>{title}</h2>

          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {children}
    </section>
  );
}

function HorizontalBar({
  label,
  value,
  maxValue,
  percentage,
}) {
  const width =
    maxValue > 0
      ? Math.max(percentage > 0 ? 4 : 0, (value / maxValue) * 100)
      : 0;

  return (
    <div className="analytics-bar-row">
      <div className="analytics-bar-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="analytics-bar-track">
        <div
          className="analytics-bar-fill"
          style={{
            width: `${Math.min(100, width)}%`,
          }}
        />
      </div>

      <div className="analytics-bar-percentage">
        {percentage}%
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Analytics() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD REAL FIRESTORE REPORTS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const snapshot = await getDocs(collection(db, "reports"));

        const loadedReports = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        if (mounted) {
          setReports(loadedReports);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);

        if (mounted) {
          setError(
            "Unable to load community analytics. Please try again."
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
  // ANALYTICS CALCULATIONS
  // ==========================================================

  const analytics = useMemo(() => {
    const totalReports = reports.length;

    // --------------------------------------------------------
    // CATEGORY COUNTS
    // --------------------------------------------------------

    const categoryCounts = {};

    reports.forEach((report) => {
      const category = normalizeCategory(report.category);

      categoryCounts[category] =
        (categoryCounts[category] || 0) + 1;
    });

    const categoryData = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage:
          totalReports > 0
            ? Math.round((count / totalReports) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // --------------------------------------------------------
    // SEVERITY COUNTS
    // --------------------------------------------------------

    const severityCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    reports.forEach((report) => {
      const severity = normalizeSeverity(report.severity);

      severityCounts[severity] =
        (severityCounts[severity] || 0) + 1;
    });

    const severityData = SEVERITY_ORDER.map((severity) => ({
      severity,
      count: severityCounts[severity] || 0,
      percentage:
        totalReports > 0
          ? Math.round(
              ((severityCounts[severity] || 0) / totalReports) * 100
            )
          : 0,
    }));

    // --------------------------------------------------------
    // STATUS COUNTS
    // --------------------------------------------------------

    const statusCounts = {
      submitted: 0,
      reviewing: 0,
      "in-progress": 0,
      resolved: 0,
    };

    reports.forEach((report) => {
      const status = normalizeStatus(report.status);

      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      } else {
        statusCounts[status] =
          (statusCounts[status] || 0) + 1;
      }
    });

    const statusData = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        label: formatStatus(status),
        count,
        percentage:
          totalReports > 0
            ? Math.round((count / totalReports) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // --------------------------------------------------------
    // PRIORITY
    // --------------------------------------------------------

    const priorityScores = reports.map((report) =>
      getPriorityScore(report)
    );

    const averagePriority =
      priorityScores.length > 0
        ? Math.round(
            priorityScores.reduce(
              (sum, score) => sum + score,
              0
            ) / priorityScores.length
          )
        : 0;

    const highPriorityCount = reports.filter((report) => {
      const severity = normalizeSeverity(report.severity);
      const score = getPriorityScore(report);

      return severity === "HIGH" || severity === "CRITICAL" || score >= 70;
    }).length;

    // --------------------------------------------------------
    // HIGHEST PRIORITY REPORTS
    // --------------------------------------------------------

    const highestPriorityReports = [...reports]
      .sort(
        (a, b) =>
          getPriorityScore(b) - getPriorityScore(a)
      )
      .slice(0, 5);

    // --------------------------------------------------------
    // PROBLEM TYPES
    // --------------------------------------------------------

    const problemTypeCounts = {};

    reports.forEach((report) => {
      const type =
        report.subcategory ||
        report.category ||
        "Other";

      const normalizedType = String(type).trim() || "Other";

      problemTypeCounts[normalizedType] =
        (problemTypeCounts[normalizedType] || 0) + 1;
    });

    const problemTypeData = Object.entries(problemTypeCounts)
      .map(([type, count]) => ({
        type,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // --------------------------------------------------------
    // RECENT REPORTING TREND — LAST 7 DAYS
    // --------------------------------------------------------

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const trendData = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today);

      date.setDate(today.getDate() - i);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const count = reports.filter((report) => {
        const reportDate = getTimestampDate(report.createdAt);

        if (!reportDate) {
          return false;
        }

        return (
          reportDate >= date &&
          reportDate < nextDate
        );
      }).length;

      trendData.push({
        date,
        label: date.toLocaleDateString(undefined, {
          weekday: "short",
        }),
        fullDate: date.toLocaleDateString(),
        count,
      });
    }

    // --------------------------------------------------------
    // GEOGRAPHIC HOTSPOTS
    // --------------------------------------------------------

    const hotspotMap = {};

    reports.forEach((report) => {
      const latitude = Number(report.latitude);
      const longitude = Number(report.longitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }

      // Group nearby points into approximate geographic cells.
      const roundedLat = latitude.toFixed(3);
      const roundedLon = longitude.toFixed(3);

      const key = `${roundedLat},${roundedLon}`;

      if (!hotspotMap[key]) {
        hotspotMap[key] = {
          latitude,
          longitude,
          count: 0,
          reports: [],
        };
      }

      hotspotMap[key].count += 1;
      hotspotMap[key].reports.push(report);
    });

    const hotspots = Object.values(hotspotMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalReports,
      categoryData,
      severityData,
      statusData,
      averagePriority,
      highPriorityCount,
      highestPriorityReports,
      problemTypeData,
      trendData,
      hotspots,
    };
  }, [reports]);

  // ==========================================================
  // MAX VALUES
  // ==========================================================

  const maxCategoryCount = Math.max(
    ...analytics.categoryData.map((item) => item.count),
    0
  );

  const maxProblemTypeCount = Math.max(
    ...analytics.problemTypeData.map((item) => item.count),
    0
  );

  const maxTrendCount = Math.max(
    ...analytics.trendData.map((item) => item.count),
    0
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="analytics-page">
        <style>{styles}</style>

        <div className="analytics-loading">
          <div className="analytics-spinner" />

          <h2>Loading Community Analytics</h2>

          <p>
            Analyzing real community reports from CivicAI...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="analytics-page">
        <style>{styles}</style>

        <div className="analytics-error-card">
          <div className="analytics-error-icon">⚠️</div>

          <h2>Analytics Unavailable</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="analytics-primary-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="analytics-page">
      <style>{styles}</style>

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="analytics-header">
        <div className="analytics-header-inner">
          <div>
            <button
              type="button"
              className="analytics-back-button"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>

            <div className="analytics-title-row">
              <div className="analytics-title-icon">📊</div>

              <div>
                <h1>Community Analytics</h1>

                <p>
                  Understand the problems affecting your
                  community through real CivicAI report data.
                </p>
              </div>
            </div>
          </div>

          <div className="analytics-live-badge">
            <span className="analytics-live-dot" />
            Live Firestore Data
          </div>
        </div>
      </header>

      <main className="analytics-container">

        {/* ======================================================
            EMPTY STATE
        ====================================================== */}

        {analytics.totalReports === 0 ? (
          <div className="analytics-empty-card">
            <div className="analytics-empty-icon">📊</div>

            <h2>No Community Reports Yet</h2>

            <p>
              Analytics will appear here automatically once
              community members start submitting reports.
            </p>

            <button
              type="button"
              className="analytics-primary-button"
              onClick={() => navigate("/report")}
            >
              Report a Problem
            </button>
          </div>
        ) : (
          <>
            {/* ==================================================
                TOP STATS
            ================================================== */}

            <div className="analytics-stats-grid">
              <StatCard
                icon="📋"
                label="Total Reports"
                value={analytics.totalReports}
                description="All community reports"
              />

              <StatCard
                icon="🚨"
                label="High Priority"
                value={analytics.highPriorityCount}
                description="High or critical priority"
              />

              <StatCard
                icon="🎯"
                label="Average Priority"
                value={`${analytics.averagePriority}/100`}
                description="Average CivicAI priority score"
              />

              <StatCard
                icon="✅"
                label="Resolved"
                value={
                  analytics.statusData.find(
                    (item) => item.status === "resolved"
                  )?.count || 0
                }
                description="Reports marked resolved"
              />
            </div>

            {/* ==================================================
                CATEGORY + SEVERITY
            ================================================== */}

            <div className="analytics-two-column">

              <SectionCard
                title="Reports by Category"
                subtitle="Which types of community problems are reported most often?"
              >
                <div className="analytics-bars">
                  {analytics.categoryData.map((item) => (
                    <HorizontalBar
                      key={item.category}
                      label={item.category}
                      value={item.count}
                      maxValue={maxCategoryCount}
                      percentage={item.percentage}
                    />
                  ))}
                </div>
              </SectionCard>


              <SectionCard
                title="Severity Distribution"
                subtitle="How serious are the reported community problems?"
              >
                <div className="analytics-severity-grid">
                  {analytics.severityData.map((item) => (
                    <div
                      key={item.severity}
                      className={`analytics-severity-card severity-${item.severity.toLowerCase()}`}
                    >
                      <div className="analytics-severity-name">
                        {item.severity}
                      </div>

                      <div className="analytics-severity-count">
                        {item.count}
                      </div>

                      <div className="analytics-severity-percent">
                        {item.percentage}% of reports
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

            </div>

            {/* ==================================================
                STATUS
            ================================================== */}

            <SectionCard
              title="Report Status"
              subtitle="Current state of community reports"
            >
              <div className="analytics-status-grid">
                {analytics.statusData.map((item) => (
                  <div
                    key={item.status}
                    className="analytics-status-card"
                  >
                    <div className="analytics-status-top">
                      <span
                        className={`analytics-status-dot status-${item.status}`}
                      />

                      <span>{item.label}</span>
                    </div>

                    <strong>{item.count}</strong>

                    <span>{item.percentage}% of reports</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ==================================================
                TREND
            ================================================== */}

            <SectionCard
              title="Recent Reporting Trend"
              subtitle="Number of reports submitted during the last 7 days"
            >
              <div className="analytics-trend">
                {analytics.trendData.map((item) => {
                  const height =
                    maxTrendCount > 0
                      ? Math.max(
                          item.count > 0 ? 10 : 2,
                          (item.count / maxTrendCount) * 100
                        )
                      : 2;

                  return (
                    <div
                      key={item.fullDate}
                      className="analytics-trend-column"
                    >
                      <div className="analytics-trend-count">
                        {item.count}
                      </div>

                      <div className="analytics-trend-bar-area">
                        <div
                          className="analytics-trend-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      </div>

                      <div className="analytics-trend-day">
                        {item.label}
                      </div>

                      <div className="analytics-trend-date">
                        {item.fullDate}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* ==================================================
                PROBLEM TYPES
            ================================================== */}

            <SectionCard
              title="Most Common Problem Types"
              subtitle="The most frequently reported specific problems"
            >
              <div className="analytics-bars">
                {analytics.problemTypeData.map((item) => {
                  const percentage =
                    analytics.totalReports > 0
                      ? Math.round(
                          (item.count /
                            analytics.totalReports) *
                            100
                        )
                      : 0;

                  return (
                    <HorizontalBar
                      key={item.type}
                      label={item.type}
                      value={item.count}
                      maxValue={maxProblemTypeCount}
                      percentage={percentage}
                    />
                  );
                })}
              </div>
            </SectionCard>

            {/* ==================================================
                HIGHEST PRIORITY REPORTS
            ================================================== */}

            <SectionCard
              title="Highest Priority Problems"
              subtitle="Reports currently carrying the highest CivicAI priority scores"
            >
              <div className="analytics-priority-list">
                {analytics.highestPriorityReports.map(
                  (report, index) => {
                    const score = getPriorityScore(report);
                    const severity = normalizeSeverity(
                      report.severity
                    );

                    return (
                      <button
                        type="button"
                        key={report.id}
                        className="analytics-priority-item"
                        onClick={() =>
                          navigate(`/report/${report.id}`)
                        }
                      >
                        <div className="analytics-priority-rank">
                          #{index + 1}
                        </div>

                        <div className="analytics-priority-main">
                          <div className="analytics-priority-title">
                            {report.subcategory ||
                              report.category ||
                              "Community Problem"}
                          </div>

                          <div className="analytics-priority-description">
                            {report.description ||
                              "No description available."}
                          </div>

                          <div className="analytics-priority-meta">
                            <span>
                              {normalizeCategory(
                                report.category
                              )}
                            </span>

                            <span>•</span>

                            <span>
                              {formatStatus(report.status)}
                            </span>

                            <span>•</span>

                            <span>
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="analytics-priority-score">
                          <strong>{score}</strong>
                          <span>/ 100</span>

                          <div
                            className={`analytics-mini-severity severity-${severity.toLowerCase()}`}
                          >
                            {severity}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </SectionCard>

            {/* ==================================================
                GEOGRAPHIC HOTSPOTS
            ================================================== */}

            <SectionCard
              title="Geographic Hotspots"
              subtitle="Approximate locations where multiple reports have been submitted"
            >
              {analytics.hotspots.length === 0 ? (
                <div className="analytics-no-data">
                  <span>📍</span>

                  <p>
                    No reports with valid geographic
                    coordinates are available yet.
                  </p>
                </div>
              ) : (
                <div className="analytics-hotspot-grid">
                  {analytics.hotspots.map(
                    (hotspot, index) => (
                      <button
                        type="button"
                        key={`${hotspot.latitude}-${hotspot.longitude}`}
                        className="analytics-hotspot-card"
                        onClick={() => navigate("/map")}
                      >
                        <div className="analytics-hotspot-rank">
                          #{index + 1}
                        </div>

                        <div className="analytics-hotspot-icon">
                          📍
                        </div>

                        <div className="analytics-hotspot-content">
                          <strong>
                            {hotspot.count}{" "}
                            {hotspot.count === 1
                              ? "report"
                              : "reports"}
                          </strong>

                          <span>
                            {hotspot.latitude.toFixed(4)},{" "}
                            {hotspot.longitude.toFixed(4)}
                          </span>

                          <small>
                            View on Community Map →
                          </small>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </SectionCard>

            {/* ==================================================
                DATA TRANSPARENCY
            ================================================== */}

            <div className="analytics-transparency-card">
              <div className="analytics-transparency-icon">
                🔎
              </div>

              <div>
                <h3>Data Transparency</h3>

                <p>
                  These statistics are calculated directly
                  from CivicAI's Firestore reports. No
                  artificial or placeholder statistics are
                  used. As more community reports are
                  submitted, the analytics will update
                  automatically.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = `
.analytics-page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #111827;
  font-family: Arial, sans-serif;
}

.analytics-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.analytics-header-inner {
  width: min(1400px, calc(100% - 40px));
  margin: 0 auto;
  padding: 28px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.analytics-back-button {
  border: 0;
  background: transparent;
  color: #4b5563;
  padding: 0;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 600;
}

.analytics-back-button:hover {
  color: #111827;
}

.analytics-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.analytics-title-icon {
  width: 54px;
  height: 54px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  font-size: 27px;
  flex-shrink: 0;
}

.analytics-title-row h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.analytics-title-row p {
  margin: 7px 0 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.5;
}

.analytics-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.analytics-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.analytics-container {
  width: min(1400px, calc(100% - 40px));
  margin: 0 auto;
  padding: 32px 0 60px;
}

.analytics-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.analytics-stat-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.analytics-stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  flex-shrink: 0;
}

.analytics-stat-content {
  min-width: 0;
}

.analytics-stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  line-height: 1.1;
}

.analytics-stat-label {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.analytics-stat-description {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 12px;
}

.analytics-two-column {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 22px;
  margin-bottom: 22px;
}

.analytics-section-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 22px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.analytics-two-column .analytics-section-card {
  margin-bottom: 0;
}

.analytics-section-header {
  margin-bottom: 22px;
}

.analytics-section-header h2 {
  margin: 0;
  font-size: 19px;
  color: #111827;
}

.analytics-section-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

.analytics-bars {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.analytics-bar-row {
  display: grid;
  grid-template-columns: 145px minmax(80px, 1fr) 48px;
  align-items: center;
  gap: 12px;
}

.analytics-bar-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
}

.analytics-bar-label strong {
  color: #111827;
}

.analytics-bar-track {
  height: 9px;
  background: #eef2f7;
  border-radius: 999px;
  overflow: hidden;
}

.analytics-bar-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.analytics-bar-percentage {
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}

.analytics-severity-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 13px;
}

.analytics-severity-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 17px;
}

.analytics-severity-name {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.analytics-severity-count {
  margin-top: 8px;
  font-size: 27px;
  font-weight: 800;
}

.analytics-severity-percent {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.severity-critical {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.severity-high {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}

.severity-medium {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.severity-low {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.analytics-status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.analytics-status-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 17px;
}

.analytics-status-top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
  font-weight: 700;
}

.analytics-status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #9ca3af;
}

.status-submitted {
  background: #6b7280;
}

.status-reviewing {
  background: #8b5cf6;
}

.status-in-progress {
  background: #2563eb;
}

.status-resolved {
  background: #10b981;
}

.analytics-status-card strong {
  display: block;
  margin-top: 13px;
  font-size: 27px;
}

.analytics-status-card > span:last-child {
  display: block;
  margin-top: 4px;
  color: #9ca3af;
  font-size: 12px;
}

.analytics-trend {
  height: 290px;
  display: flex;
  align-items: stretch;
  gap: 16px;
  padding: 5px 0 0;
}

.analytics-trend-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.analytics-trend-count {
  height: 24px;
  font-size: 12px;
  font-weight: 800;
  color: #374151;
}

.analytics-trend-bar-area {
  flex: 1;
  width: 100%;
  max-width: 70px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
}

.analytics-trend-bar {
  width: 70%;
  min-height: 3px;
  border-radius: 8px 8px 0 0;
  background: #4f46e5;
  transition: height 0.4s ease;
}

.analytics-trend-day {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 800;
  color: #374151;
}

.analytics-trend-date {
  margin-top: 3px;
  color: #9ca3af;
  font-size: 10px;
  text-align: center;
}

.analytics-priority-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.analytics-priority-item {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  display: grid;
  grid-template-columns: 45px minmax(0, 1fr) 95px;
  gap: 15px;
  align-items: center;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.analytics-priority-item:hover {
  transform: translateY(-1px);
  border-color: #c7d2fe;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.07);
}

.analytics-priority-rank {
  font-size: 13px;
  font-weight: 800;
  color: #6366f1;
  text-align: center;
}

.analytics-priority-main {
  min-width: 0;
}

.analytics-priority-title {
  font-size: 15px;
  font-weight: 800;
  color: #111827;
}

.analytics-priority-description {
  margin-top: 5px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.analytics-priority-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  color: #9ca3af;
  font-size: 11px;
}

.analytics-priority-score {
  text-align: right;
}

.analytics-priority-score strong {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
}

.analytics-priority-score > span {
  color: #9ca3af;
  font-size: 11px;
}

.analytics-mini-severity {
  margin-top: 5px;
  display: inline-block;
  padding: 4px 7px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
}

.analytics-hotspot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.analytics-hotspot-card {
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 13px;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.analytics-hotspot-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 5px 16px rgba(15, 23, 42, 0.06);
}

.analytics-hotspot-rank {
  color: #6366f1;
  font-size: 12px;
  font-weight: 800;
}

.analytics-hotspot-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.analytics-hotspot-content {
  min-width: 0;
}

.analytics-hotspot-content strong {
  display: block;
  color: #111827;
  font-size: 14px;
}

.analytics-hotspot-content span {
  display: block;
  margin-top: 4px;
  color: #6b7280;
  font-size: 11px;
}

.analytics-hotspot-content small {
  display: block;
  margin-top: 6px;
  color: #6366f1;
  font-size: 11px;
  font-weight: 700;
}

.analytics-transparency-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 19px;
  border-radius: 16px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
}

.analytics-transparency-icon {
  font-size: 23px;
}

.analytics-transparency-card h3 {
  margin: 0;
  color: #312e81;
  font-size: 15px;
}

.analytics-transparency-card p {
  margin: 6px 0 0;
  color: #4338ca;
  font-size: 13px;
  line-height: 1.55;
}

.analytics-loading,
.analytics-error-card,
.analytics-empty-card {
  width: min(600px, calc(100% - 40px));
  margin: 100px auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
}

.analytics-loading h2,
.analytics-error-card h2,
.analytics-empty-card h2 {
  margin: 18px 0 7px;
  font-size: 21px;
}

.analytics-loading p,
.analytics-error-card p,
.analytics-empty-card p {
  margin: 0 auto;
  max-width: 470px;
  color: #6b7280;
  line-height: 1.6;
  font-size: 14px;
}

.analytics-spinner {
  width: 38px;
  height: 38px;
  margin: 0 auto;
  border: 4px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: analytics-spin 0.8s linear infinite;
}

@keyframes analytics-spin {
  to {
    transform: rotate(360deg);
  }
}

.analytics-error-icon,
.analytics-empty-icon {
  font-size: 42px;
}

.analytics-primary-button {
  margin-top: 22px;
  border: 0;
  border-radius: 10px;
  padding: 11px 17px;
  background: #4f46e5;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.analytics-primary-button:hover {
  background: #4338ca;
}

.analytics-no-data {
  min-height: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #9ca3af;
}

.analytics-no-data span {
  font-size: 30px;
}

.analytics-no-data p {
  margin: 9px 0 0;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .analytics-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .analytics-two-column {
    grid-template-columns: 1fr;
  }

  .analytics-status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .analytics-header-inner {
    width: min(100% - 28px, 1400px);
    flex-direction: column;
  }

  .analytics-container {
    width: min(100% - 28px, 1400px);
    padding-top: 22px;
  }

  .analytics-stats-grid {
    grid-template-columns: 1fr;
  }

  .analytics-section-card {
    padding: 18px;
  }

  .analytics-bar-row {
    grid-template-columns: 110px minmax(60px, 1fr) 38px;
    gap: 8px;
  }

  .analytics-status-grid {
    grid-template-columns: 1fr;
  }

  .analytics-severity-grid {
    grid-template-columns: 1fr;
  }

  .analytics-priority-item {
    grid-template-columns: 35px minmax(0, 1fr);
  }

  .analytics-priority-score {
    grid-column: 2;
    text-align: left;
  }

  .analytics-hotspot-grid {
    grid-template-columns: 1fr;
  }

  .analytics-trend {
    gap: 7px;
  }

  .analytics-trend-date {
    display: none;
  }

  .analytics-title-row h1 {
    font-size: 24px;
  }
}
`;