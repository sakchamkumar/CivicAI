import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={styles.page}>
      {/* ============================================================
          NAVIGATION
      ============================================================ */}

      <header style={styles.navbar}>
        <div style={styles.navContainer}>
          <Link to="/" style={styles.logoLink}>
            <div style={styles.logo}>CivicAI</div>
            <div style={styles.logoSubtitle}>
              Community Problem Intelligence
            </div>
          </Link>

          <nav style={styles.navLinks}>
            <a href="#how-it-works" style={styles.navLink}>
              How It Works
            </a>

            <a href="#features" style={styles.navLink}>
              Features
            </a>

            <a href="#about" style={styles.navLink}>
              About
            </a>

            <Link to="/login" style={styles.loginButton}>
              Log In
            </Link>

            <Link to="/signup" style={styles.primaryNavButton}>
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================================
          HERO
      ============================================================ */}

      <main>
        <section style={styles.heroSection}>
          <div style={styles.heroContainer}>
            <div style={styles.heroContent}>
              <div style={styles.heroBadge}>
                <span style={styles.badgeDot}></span>
                AI-Powered Community Intelligence
              </div>

              <h1 style={styles.heroTitle}>
                Make Your Community
                <br />
                <span style={styles.heroAccent}>Better With AI.</span>
              </h1>

              <p style={styles.heroDescription}>
                CivicAI helps communities report local problems, understand
                their urgency, identify duplicate reports, and track what
                happens next.
              </p>

              <div style={styles.heroActions}>
                <Link to="/signup" style={styles.heroPrimaryButton}>
                  Report a Problem
                  <span style={styles.buttonArrow}>→</span>
                </Link>

                <Link to="/login" style={styles.heroSecondaryButton}>
                  Explore CivicAI
                </Link>
              </div>

              <div style={styles.heroTrust}>
                <div style={styles.trustItem}>
                  <span style={styles.trustIcon}>🤖</span>
                  AI Analysis
                </div>

                <div style={styles.trustDivider}></div>

                <div style={styles.trustItem}>
                  <span style={styles.trustIcon}>📍</span>
                  Location Intelligence
                </div>

                <div style={styles.trustDivider}></div>

                <div style={styles.trustItem}>
                  <span style={styles.trustIcon}>📊</span>
                  Real Data
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div style={styles.heroVisual}>
              <div style={styles.dashboardPreview}>
                <div style={styles.previewHeader}>
                  <div>
                    <div style={styles.previewBrand}>CivicAI</div>
                    <div style={styles.previewSmallText}>
                      Community Intelligence
                    </div>
                  </div>

                  <div style={styles.previewStatus}>
                    <span style={styles.previewStatusDot}></span>
                    AI Ready
                  </div>
                </div>

                <div style={styles.previewCard}>
                  <div style={styles.previewLabel}>
                    COMMUNITY REPORT
                  </div>

                  <div style={styles.previewTitle}>
                    Large pothole near school entrance
                  </div>

                  <div style={styles.previewLocation}>
                    📍 Main Road · Community Area
                  </div>

                  <div style={styles.previewAnalysis}>
                    <div style={styles.analysisHeader}>
                      <span>AI Analysis</span>
                      <span style={styles.analysisBadge}>Analyzed</span>
                    </div>

                    <div style={styles.analysisGrid}>
                      <div style={styles.analysisBox}>
                        <span style={styles.analysisBoxLabel}>
                          Category
                        </span>
                        <strong>Road</strong>
                      </div>

                      <div style={styles.analysisBox}>
                        <span style={styles.analysisBoxLabel}>
                          Severity
                        </span>
                        <strong style={styles.highText}>HIGH</strong>
                      </div>

                      <div style={styles.analysisBox}>
                        <span style={styles.analysisBoxLabel}>
                          Safety Risk
                        </span>
                        <strong style={styles.highText}>HIGH</strong>
                      </div>

                      <div style={styles.analysisBox}>
                        <span style={styles.analysisBoxLabel}>
                          Priority
                        </span>
                        <strong>95 / 100</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.previewBottom}>
                  <div>
                    <span style={styles.previewBottomLabel}>
                      STATUS
                    </span>
                    <strong>Reviewing</strong>
                  </div>

                  <div style={styles.previewTimeline}>
                    <span style={styles.timelineActive}></span>
                    <span style={styles.timelineLine}></span>
                    <span style={styles.timelineInactive}></span>
                    <span style={styles.timelineLine}></span>
                    <span style={styles.timelineInactive}></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            TRANSFORMATION
        ============================================================ */}

        <section style={styles.transformationSection}>
          <div style={styles.sectionContainer}>
            <div style={styles.sectionHeading}>
              <div style={styles.sectionEyebrow}>FROM REPORT TO ACTION</div>

              <h2 style={styles.sectionTitle}>
                Turn community problems into
                <br />
                <span style={styles.sectionAccent}>
                  structured intelligence.
                </span>
              </h2>

              <p style={styles.sectionDescription}>
                CivicAI transforms a simple community report into useful,
                structured information that can be prioritized, mapped,
                analyzed, and tracked.
              </p>
            </div>

            <div style={styles.pipeline}>
              <PipelineCard
                number="01"
                icon="📝"
                title="Report"
                description="Describe a problem and provide its location."
              />

              <div style={styles.pipelineArrow}>→</div>

              <PipelineCard
                number="02"
                icon="🤖"
                title="Analyze"
                description="AI classifies the problem and evaluates its risk."
              />

              <div style={styles.pipelineArrow}>→</div>

              <PipelineCard
                number="03"
                icon="🎯"
                title="Prioritize"
                description="Severity and safety risk produce a priority score."
              />

              <div style={styles.pipelineArrow}>→</div>

              <PipelineCard
                number="04"
                icon="📊"
                title="Track"
                description="Monitor reports, locations, trends, and status."
              />
            </div>
          </div>
        </section>

        {/* ============================================================
            FEATURES
        ============================================================ */}

        <section id="features" style={styles.featuresSection}>
          <div style={styles.sectionContainer}>
            <div style={styles.sectionHeading}>
              <div style={styles.sectionEyebrow}>CORE CAPABILITIES</div>

              <h2 style={styles.sectionTitle}>
                Built to understand
                <br />
                <span style={styles.sectionAccent}>
                  community problems.
                </span>
              </h2>
            </div>

            <div style={styles.featureGrid}>
              <FeatureCard
                icon="🤖"
                title="AI Problem Analysis"
                description="Gemini analyzes reports and generates structured categories, subcategories, severity, safety risk, confidence, and reasoning."
              />

              <FeatureCard
                icon="🎯"
                title="Priority Scoring"
                description="Reports receive a 0–100 priority score based on severity and safety risk, helping urgent issues stand out."
              />

              <FeatureCard
                icon="📍"
                title="Location Intelligence"
                description="GPS coordinates and location information connect individual reports to the geographic context of a community."
              />

              <FeatureCard
                icon="🔎"
                title="Duplicate Detection"
                description="Text similarity and geographic distance help identify reports that may describe the same local problem."
              />

              <FeatureCard
                icon="🗺️"
                title="Community Mapping"
                description="View geographically located reports through an interactive community map powered by OpenStreetMap."
              />

              <FeatureCard
                icon="📊"
                title="Community Analytics"
                description="Analyze real Firestore data to understand categories, severity, statuses, trends, priorities, and hotspots."
              />
            </div>
          </div>
        </section>

        {/* ============================================================
            HOW IT WORKS
        ============================================================ */}

        <section id="how-it-works" style={styles.howSection}>
          <div style={styles.sectionContainer}>
            <div style={styles.howGrid}>
              <div>
                <div style={styles.sectionEyebrow}>HOW CIVICAI WORKS</div>

                <h2 style={styles.sectionTitle}>
                  A simple report can
                  <br />
                  become <span style={styles.sectionAccent}>insight.</span>
                </h2>

                <p style={styles.sectionDescription}>
                  CivicAI combines user reports, AI analysis, geospatial
                  information, and administrative workflows into one system.
                </p>

                <div style={styles.steps}>
                  <Step
                    number="1"
                    title="Submit a problem"
                    description="A community member describes an issue and provides its location."
                  />

                  <Step
                    number="2"
                    title="CivicAI analyzes it"
                    description="The backend sends the report to Gemini for structured AI analysis."
                  />

                  <Step
                    number="3"
                    title="Understand its priority"
                    description="Severity, safety risk, confidence, and priority are calculated."
                  />

                  <Step
                    number="4"
                    title="Track what happens next"
                    description="Administrators can review and update the report through its resolution workflow."
                  />
                </div>
              </div>

              <div style={styles.workflowVisual}>
                <div style={styles.workflowCard}>
                  <div style={styles.workflowTop}>
                    <span style={styles.workflowTitle}>
                      CIVICAI INTELLIGENCE
                    </span>

                    <span style={styles.workflowLive}>
                      LIVE DATA
                    </span>
                  </div>

                  <div style={styles.workflowNode}>
                    <div style={styles.workflowIcon}>📝</div>
                    <div>
                      <strong>Community Report</strong>
                      <span>User-submitted problem</span>
                    </div>
                  </div>

                  <div style={styles.workflowConnector}></div>

                  <div style={styles.workflowNode}>
                    <div style={styles.workflowIcon}>🤖</div>
                    <div>
                      <strong>AI Analysis</strong>
                      <span>Classification + risk assessment</span>
                    </div>
                  </div>

                  <div style={styles.workflowConnector}></div>

                  <div style={styles.workflowNode}>
                    <div style={styles.workflowIcon}>🎯</div>
                    <div>
                      <strong>Priority Score</strong>
                      <span>Urgency translated to a score</span>
                    </div>
                  </div>

                  <div style={styles.workflowConnector}></div>

                  <div style={styles.workflowNode}>
                    <div style={styles.workflowIcon}>🛡️</div>
                    <div>
                      <strong>Administrative Action</strong>
                      <span>Review → In Progress → Resolved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            TRANSPARENCY
        ============================================================ */}

        <section id="about" style={styles.aboutSection}>
          <div style={styles.sectionContainer}>
            <div style={styles.aboutCard}>
              <div style={styles.aboutIcon}>🧠</div>

              <div style={styles.aboutContent}>
                <div style={styles.sectionEyebrow}>
                  RESPONSIBLE ENGINEERING
                </div>

                <h2 style={styles.aboutTitle}>
                  Built around real data,
                  <br />
                  not artificial demonstrations.
                </h2>

                <p style={styles.aboutText}>
                  CivicAI uses actual community reports for its analytics.
                  Its duplicate detection combines deterministic text and
                  geographic similarity, while AI-generated analysis includes
                  confidence and reasoning. Future machine-learning features
                  can be introduced when enough real historical data exists.
                </p>

                <div style={styles.aboutPoints}>
                  <div style={styles.aboutPoint}>
                    <span>✓</span>
                    Real Firestore analytics
                  </div>

                  <div style={styles.aboutPoint}>
                    <span>✓</span>
                    Explainable AI output
                  </div>

                  <div style={styles.aboutPoint}>
                    <span>✓</span>
                    Role-based administration
                  </div>

                  <div style={styles.aboutPoint}>
                    <span>✓</span>
                    Protected user data
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            FINAL CTA
        ============================================================ */}

        <section style={styles.ctaSection}>
          <div style={styles.ctaContainer}>
            <div style={styles.ctaBadge}>
              CIVICAI
            </div>

            <h2 style={styles.ctaTitle}>
              Have a problem in your community?
            </h2>

            <p style={styles.ctaText}>
              Report it. Understand its priority. Track what happens next.
            </p>

            <Link to="/signup" style={styles.ctaButton}>
              Get Started
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}

      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div>
            <div style={styles.footerLogo}>CivicAI</div>

            <div style={styles.footerSubtitle}>
              Community Problem Intelligence
            </div>

            <p style={styles.footerDescription}>
              AI-powered tools for understanding and prioritizing
              community problems.
            </p>
          </div>

          <div style={styles.footerLinks}>
            <div style={styles.footerColumn}>
              <strong>Product</strong>

              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/login">Log In</Link>
            </div>

            <div style={styles.footerColumn}>
              <strong>Project</strong>

              <a
                href="https://github.com/sakchamkumar/CivicAI"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>

              <Link to="/signup">Get Started</Link>
            </div>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <span>
            © {new Date().getFullYear()} CivicAI
          </span>

          <span>
            Built as a full-stack AI civic technology project.
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================
   REUSABLE COMPONENTS
================================================================ */

function PipelineCard({ number, icon, title, description }) {
  return (
    <div style={styles.pipelineCard}>
      <div style={styles.pipelineNumber}>{number}</div>

      <div style={styles.pipelineIcon}>{icon}</div>

      <h3 style={styles.pipelineTitle}>{title}</h3>

      <p style={styles.pipelineDescription}>{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div style={styles.featureCard}>
      <div style={styles.featureIcon}>{icon}</div>

      <h3 style={styles.featureTitle}>{title}</h3>

      <p style={styles.featureDescription}>{description}</p>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNumber}>{number}</div>

      <div>
        <h3 style={styles.stepTitle}>{title}</h3>

        <p style={styles.stepDescription}>{description}</p>
      </div>
    </div>
  );
}

/* ================================================================
   STYLES
================================================================ */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#111827",
    fontFamily: "Arial, sans-serif",
  },

  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255,255,255,0.96)",
    borderBottom: "1px solid #e5e7eb",
    backdropFilter: "blur(10px)",
  },

  navContainer: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "18px 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "30px",
  },

  logoLink: {
    textDecoration: "none",
    color: "#111827",
  },

  logo: {
    fontSize: "25px",
    fontWeight: "800",
    letterSpacing: "-0.6px",
  },

  logoSubtitle: {
    marginTop: "3px",
    fontSize: "12px",
    color: "#53657d",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "25px",
  },

  navLink: {
    textDecoration: "none",
    color: "#53657d",
    fontSize: "14px",
    fontWeight: "600",
  },

  loginButton: {
    textDecoration: "none",
    color: "#111827",
    fontSize: "14px",
    fontWeight: "700",
    padding: "10px 15px",
  },

  primaryNavButton: {
    textDecoration: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "11px 18px",
    borderRadius: "9px",
    fontSize: "14px",
    fontWeight: "700",
  },

  heroSection: {
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    padding: "80px 30px 90px",
  },

  heroContainer: {
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    alignItems: "center",
    gap: "70px",
  },

  heroContent: {
    maxWidth: "650px",
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    padding: "8px 13px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "700",
    border: "1px solid #e2e8f0",
    marginBottom: "22px",
  },

  badgeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#2563eb",
  },

  heroTitle: {
    margin: 0,
    fontSize: "58px",
    lineHeight: "1.04",
    letterSpacing: "-2.5px",
    fontWeight: "800",
    color: "#0f172a",
  },

  heroAccent: {
    color: "#2563eb",
  },

  heroDescription: {
    margin: "25px 0 0",
    maxWidth: "620px",
    fontSize: "18px",
    lineHeight: "1.7",
    color: "#53657d",
  },

  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginTop: "32px",
    flexWrap: "wrap",
  },

  heroPrimaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "13px",
    textDecoration: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "15px 21px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
  },

  buttonArrow: {
    fontSize: "20px",
    lineHeight: 1,
  },

  heroSecondaryButton: {
    textDecoration: "none",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #cbd5e1",
    padding: "14px 21px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
  },

  heroTrust: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginTop: "38px",
    flexWrap: "wrap",
  },

  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
  },

  trustIcon: {
    fontSize: "15px",
  },

  trustDivider: {
    width: "1px",
    height: "18px",
    background: "#dbe2ea",
  },

  heroVisual: {
    display: "flex",
    justifyContent: "center",
  },

  dashboardPreview: {
    width: "100%",
    maxWidth: "510px",
    background: "#f8fafc",
    border: "1px solid #dfe5ec",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 24px 70px rgba(15,23,42,0.10)",
    transform: "rotate(1deg)",
  },

  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 5px 16px",
  },

  previewBrand: {
    fontSize: "17px",
    fontWeight: "800",
  },

  previewSmallText: {
    marginTop: "2px",
    fontSize: "10px",
    color: "#64748b",
  },

  previewStatus: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10px",
    fontWeight: "700",
    color: "#166534",
    background: "#dcfce7",
    padding: "6px 9px",
    borderRadius: "999px",
  },

  previewStatusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#16a34a",
  },

  previewCard: {
    background: "#ffffff",
    borderRadius: "15px",
    padding: "22px",
    border: "1px solid #e5e7eb",
  },

  previewLabel: {
    fontSize: "9px",
    color: "#64748b",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  previewTitle: {
    marginTop: "10px",
    fontSize: "21px",
    lineHeight: "1.3",
    fontWeight: "800",
    color: "#111827",
  },

  previewLocation: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "11px",
  },

  previewAnalysis: {
    marginTop: "20px",
    paddingTop: "17px",
    borderTop: "1px solid #edf0f4",
  },

  analysisHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    fontWeight: "800",
  },

  analysisBadge: {
    fontSize: "9px",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#2563eb",
  },

  analysisGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "9px",
    marginTop: "12px",
  },

  analysisBox: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    background: "#f8fafc",
    border: "1px solid #edf0f4",
    borderRadius: "9px",
    padding: "11px",
    fontSize: "12px",
  },

  analysisBoxLabel: {
    fontSize: "9px",
    color: "#64748b",
    fontWeight: "600",
  },

  highText: {
    color: "#dc2626",
  },

  previewBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "17px 7px 4px",
  },

  previewBottomLabel: {
    display: "block",
    fontSize: "8px",
    color: "#64748b",
    fontWeight: "800",
    letterSpacing: "1px",
    marginBottom: "4px",
  },

  previewBottomStrong: {
    fontSize: "12px",
  },

  previewTimeline: {
    display: "flex",
    alignItems: "center",
  },

  timelineActive: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#2563eb",
  },

  timelineInactive: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#cbd5e1",
  },

  timelineLine: {
    width: "32px",
    height: "2px",
    background: "#cbd5e1",
  },

  transformationSection: {
    padding: "90px 30px",
    background: "#f5f7fb",
  },

  sectionContainer: {
    maxWidth: "1180px",
    margin: "0 auto",
  },

  sectionHeading: {
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto 50px",
  },

  sectionEyebrow: {
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.6px",
    marginBottom: "13px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "40px",
    lineHeight: "1.16",
    letterSpacing: "-1.3px",
    color: "#0f172a",
    fontWeight: "800",
  },

  sectionAccent: {
    color: "#2563eb",
  },

  sectionDescription: {
    margin: "17px auto 0",
    maxWidth: "650px",
    color: "#64748b",
    fontSize: "16px",
    lineHeight: "1.7",
  },

  pipeline: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr",
    alignItems: "stretch",
    gap: "14px",
  },

  pipelineCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "24px",
    position: "relative",
    boxShadow: "0 8px 25px rgba(15,23,42,0.04)",
  },

  pipelineNumber: {
    position: "absolute",
    top: "14px",
    right: "16px",
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: "800",
  },

  pipelineIcon: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "11px",
    background: "#f1f5f9",
    fontSize: "21px",
    marginBottom: "18px",
  },

  pipelineTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
  },

  pipelineDescription: {
    margin: "9px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  pipelineArrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "24px",
    fontWeight: "700",
  },

  featuresSection: {
    padding: "100px 30px",
    background: "#ffffff",
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
  },

  featureCard: {
    padding: "28px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    transition: "transform 0.2s ease",
  },

  featureIcon: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "22px",
    marginBottom: "19px",
  },

  featureTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
  },

  featureDescription: {
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.7",
  },

  howSection: {
    padding: "100px 30px",
    background: "#f5f7fb",
  },

  howGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 0.9fr",
    gap: "70px",
    alignItems: "center",
  },

  steps: {
    marginTop: "35px",
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },

  step: {
    display: "flex",
    gap: "16px",
  },

  stepNumber: {
    flexShrink: 0,
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "800",
  },

  stepTitle: {
    margin: "1px 0 5px",
    fontSize: "16px",
    fontWeight: "800",
  },

  stepDescription: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  workflowVisual: {
    display: "flex",
    justifyContent: "center",
  },

  workflowCard: {
    width: "100%",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "25px",
    boxShadow: "0 20px 50px rgba(15,23,42,0.07)",
  },

  workflowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  workflowTitle: {
    fontSize: "10px",
    letterSpacing: "1.3px",
    fontWeight: "800",
    color: "#64748b",
  },

  workflowLive: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#166534",
    background: "#dcfce7",
    padding: "5px 8px",
    borderRadius: "999px",
  },

  workflowNode: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "11px",
  },

  workflowIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "9px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },

  workflowNodeStrong: {
    display: "block",
  },

  workflowNodeSpan: {
    display: "block",
  },

  workflowConnector: {
    height: "22px",
    width: "2px",
    background: "#cbd5e1",
    marginLeft: "32px",
  },

  aboutSection: {
    padding: "90px 30px",
    background: "#ffffff",
  },

  aboutCard: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "90px 1fr",
    gap: "30px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "42px",
  },

  aboutIcon: {
    width: "70px",
    height: "70px",
    borderRadius: "18px",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
  },

  aboutContent: {
    minWidth: 0,
  },

  aboutTitle: {
    margin: 0,
    fontSize: "31px",
    lineHeight: "1.2",
    fontWeight: "800",
    letterSpacing: "-0.8px",
  },

  aboutText: {
    margin: "16px 0 0",
    maxWidth: "720px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.75",
  },

  aboutPoints: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px 25px",
    marginTop: "22px",
  },

  aboutPoint: {
    color: "#334155",
    fontSize: "12px",
    fontWeight: "700",
  },

  aboutPointSpan: {
    color: "#16a34a",
    marginRight: "6px",
  },

  ctaSection: {
    padding: "90px 30px",
    background: "#111827",
  },

  ctaContainer: {
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
  },

  ctaBadge: {
    display: "inline-block",
    color: "#bfdbfe",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "2px",
    marginBottom: "16px",
  },

  ctaTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "42px",
    lineHeight: "1.15",
    fontWeight: "800",
    letterSpacing: "-1px",
  },

  ctaText: {
    margin: "15px auto 0",
    color: "#cbd5e1",
    fontSize: "16px",
  },

  ctaButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "28px",
    textDecoration: "none",
    background: "#ffffff",
    color: "#111827",
    padding: "14px 22px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "800",
  },

  footer: {
    background: "#0b1220",
    color: "#ffffff",
    padding: "55px 30px 25px",
  },

  footerContainer: {
    maxWidth: "1180px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    gap: "50px",
  },

  footerLogo: {
    fontSize: "22px",
    fontWeight: "800",
  },

  footerSubtitle: {
    marginTop: "4px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  footerDescription: {
    maxWidth: "320px",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: "1.6",
    marginTop: "13px",
  },

  footerLinks: {
    display: "flex",
    gap: "80px",
  },

  footerColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "100px",
  },

  footerColumnStrong: {
    fontSize: "12px",
  },

  footerColumnA: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "12px",
  },

  footerColumnLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "12px",
  },

  footerBottom: {
    maxWidth: "1180px",
    margin: "40px auto 0",
    paddingTop: "20px",
    borderTop: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    color: "#64748b",
    fontSize: "10px",
  },
};