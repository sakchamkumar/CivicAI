import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // ============================================================
  // ADMIN STATUS
  // ============================================================

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // ============================================================
  // REPORT STATISTICS
  // ============================================================

  const [reportStats, setReportStats] = useState({
    total: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  // ============================================================
  // CHECK USER ROLE
  // ============================================================

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setCheckingRole(false);
        return;
      }

      try {
        setCheckingRole(true);

        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
          setIsAdmin(false);
          return;
        }

        const userData = userSnapshot.data();

        setIsAdmin(userData.role === "admin");
      } catch (error) {
        console.error("Error checking user role:", error);
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [user]);

  // ============================================================
  // LOAD USER REPORTS
  // ============================================================

  useEffect(() => {
    const loadReportStats = async () => {
      if (!user) {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        setStatsError("");

        const reportsQuery = query(
          collection(db, "reports"),
          where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(reportsQuery);

        let total = 0;
        let inProgress = 0;
        let resolved = 0;
        let highPriority = 0;

        snapshot.forEach((document) => {
          const report = document.data();

          total += 1;

          // ------------------------------------------------------
          // STATUS
          // ------------------------------------------------------

          const status = String(report.status || "")
            .trim()
            .toLowerCase();

          if (
            status === "in-progress" ||
            status === "in progress" ||
            status === "reviewing"
          ) {
            inProgress += 1;
          }

          if (status === "resolved") {
            resolved += 1;
          }

          // ------------------------------------------------------
          // HIGH PRIORITY
          // ------------------------------------------------------

          const severity = String(report.severity || "")
            .trim()
            .toLowerCase();

          const priorityScore =
            typeof report.priorityScore === "number"
              ? report.priorityScore
              : 0;

          if (
            severity === "high" ||
            priorityScore >= 70
          ) {
            highPriority += 1;
          }
        });

        setReportStats({
          total,
          inProgress,
          resolved,
          highPriority,
        });
      } catch (error) {
        console.error(
          "Error loading dashboard report statistics:",
          error
        );

        setStatsError(
          "Unable to load your report statistics."
        );
      } finally {
        setLoadingStats(false);
      }
    };

    loadReportStats();
  }, [user]);

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
  // DASHBOARD STATS
  // ============================================================

  const stats = [
    {
      icon: "📋",
      title: "My Reports",
      value: loadingStats ? "…" : reportStats.total,
      description: "Problems you have reported",
    },
    {
      icon: "⏳",
      title: "In Progress",
      value: loadingStats ? "…" : reportStats.inProgress,
      description: "Reports being reviewed",
    },
    {
      icon: "✅",
      title: "Resolved",
      value: loadingStats ? "…" : reportStats.resolved,
      description: "Problems marked resolved",
    },
    {
      icon: "🚨",
      title: "High Priority",
      value: loadingStats ? "…" : reportStats.highPriority,
      description: "Reports requiring attention",
    },
  ];

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
      </header>

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}

      <main
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "45px 24px 60px",
        }}
      >
        {/* ========================================================
            WELCOME SECTION
        ======================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "35px",
            marginBottom: "28px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.05)",
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
            CIVICAI DASHBOARD
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "34px",
              lineHeight: "1.2",
              color: "#111827",
            }}
          >
            Welcome
            {user?.displayName ? `, ${user.displayName}` : ""}! 👋
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#6b7280",
              maxWidth: "750px",
            }}
          >
            Help make your community better by reporting problems,
            understanding their priority, and tracking what happens next.
          </p>

          {/* ======================================================
              ACTION BUTTONS
          ====================================================== */}

          <div
            style={{
              marginTop: "25px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {/* ====================================================
                REPORT A PROBLEM
            ==================================================== */}

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

            {/* ====================================================
                MY REPORTS
            ==================================================== */}

            <button
              type="button"
              onClick={() => navigate("/my-reports")}
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
              📋 My Reports
            </button>

            {/* ====================================================
                COMMUNITY MAP
            ==================================================== */}

            <button
              type="button"
              onClick={() => navigate("/map")}
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
              🗺️ Explore Community Map
            </button>

            {/* ====================================================
                COMMUNITY ANALYTICS
            ==================================================== */}

            <button
              type="button"
              onClick={() => navigate("/analytics")}
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
              📊 Community Analytics
            </button>

            {/* ====================================================
                ADMIN DASHBOARD
                ONLY VISIBLE TO ADMINS
            ==================================================== */}

            {!checkingRole && isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin")}
                style={{
                  padding: "12px 20px",
                  border: "1px solid #111827",
                  borderRadius: "9px",
                  background: "#111827",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                🛡️ Admin Dashboard
              </button>
            )}
          </div>
        </section>

        {/* ========================================================
            STATISTICS
        ======================================================== */}

        <section
          style={{
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
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
                Community Overview
              </h3>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Your CivicAI activity at a glance.
              </p>
            </div>
          </div>

          {/* ======================================================
              STATISTICS ERROR
          ====================================================== */}

          {statsError && (
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
              ❌ {statsError}
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
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
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

        {/* ========================================================
            CIVICAI FEATURES
        ======================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ marginBottom: "22px" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "22px",
                color: "#111827",
              }}
            >
              CivicAI Intelligence
            </h3>

            <p
              style={{
                margin: "6px 0 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Tools that power the community intelligence platform.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            <FeatureCard
              icon="📝"
              title="Report Problems"
              description="Submit descriptions, photos, and location information about community problems."
            />

            <FeatureCard
              icon="🤖"
              title="AI Classification"
              description="CivicAI automatically classifies reports and identifies the type of problem."
            />

            <FeatureCard
              icon="🚨"
              title="Priority Detection"
              description="AI estimates severity, safety risk, and priority."
            />

            <FeatureCard
              icon="🗺️"
              title="Community Map"
              description="Visualize reported problems geographically and identify local hotspots."
            />

            <FeatureCard
              icon="🔎"
              title="Duplicate Detection"
              description="Identify potentially duplicate reports describing the same community problem."
            />

            {/* ====================================================
                ANALYTICS FEATURE
            ==================================================== */}

            <button
              type="button"
              onClick={() => navigate("/analytics")}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "20px",
                background: "#fafafa",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  fontSize: "25px",
                  marginBottom: "12px",
                }}
              >
                📊
              </div>

              <h4
                style={{
                  margin: "0 0 7px",
                  fontSize: "16px",
                  color: "#111827",
                }}
              >
                Community Analytics →
              </h4>

              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "#6b7280",
                }}
              >
                Explore real community trends, categories, severity,
                resolution patterns, priority scores, and geographic
                hotspots.
              </p>
            </button>
          </div>
        </section>

        {/* ========================================================
            ACCOUNT INFORMATION
        ======================================================== */}

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "13px",
          }}
        >
          Signed in as{" "}
          <strong style={{ color: "#6b7280" }}>
            {user?.email || "Unknown user"}
          </strong>

          {isAdmin && (
            <span
              style={{
                marginLeft: "8px",
                padding: "4px 8px",
                borderRadius: "6px",
                background: "#f3f4f6",
                color: "#374151",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              ADMIN
            </span>
          )}
        </div>
      </main>
    </div>
  );
}

/* ================================================================
   FEATURE CARD
   ================================================================ */

function FeatureCard({ icon, title, description }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          fontSize: "25px",
          marginBottom: "12px",
        }}
      >
        {icon}
      </div>

      <h4
        style={{
          margin: "0 0 7px",
          fontSize: "16px",
          color: "#111827",
        }}
      >
        {title}
      </h4>

      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: "1.6",
          color: "#6b7280",
        }}
      >
        {description}
      </p>
    </div>
  );
}