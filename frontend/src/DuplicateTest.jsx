import { useState } from "react";
import axios from "axios";

import API_BASE_URL from "./config";

export default function DuplicateTest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testDuplicateDetection = async () => {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/duplicates/check`,
        {
          description:
            "There is a large pothole near the school entrance causing danger to motorcycles.",

          latitude: 23.7957,
          longitude: 86.4304,

          candidates: [
            {
              reportId: "existing-report-1",
              category: "Road",
              subcategory: "Pothole",
              severity: "HIGH",

              description:
                "A huge pothole outside the school gate is making it dangerous for motorcycles.",

              location: "Near school entrance",

              status: "submitted",

              priorityScore: 85,

              latitude: 23.7960,
              longitude: 86.4307,
            },
          ],
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error("Duplicate detection test error:", err);

      setError(
        err.response?.data?.error ||
          "Could not connect to the duplicate detection API."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "#ffffff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            color: "#111827",
          }}
        >
          CivicAI Duplicate Detection Test
        </h1>

        <p
          style={{
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          This temporary page tests whether CivicAI can detect
          a potentially duplicate community report using text
          similarity and geographic distance.
        </p>

        <button
          type="button"
          onClick={testDuplicateDetection}
          disabled={loading}
          style={{
            marginTop: "20px",
            padding: "13px 20px",
            border: "none",
            borderRadius: "9px",
            background: loading ? "#9ca3af" : "#2563eb",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "Testing..."
            : "Test Duplicate Detection"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: "24px",
              padding: "20px",
              borderRadius: "10px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: result.isDuplicate
                  ? "#b91c1c"
                  : "#047857",
              }}
            >
              {result.isDuplicate
                ? "⚠️ Potential Duplicate Detected"
                : "✅ No Duplicate Detected"}
            </h2>

            <p>
              <strong>Success:</strong>{" "}
              {String(result.success)}
            </p>

            <p>
              <strong>Match Count:</strong>{" "}
              {result.matchCount}
            </p>

            <p>
              <strong>Checked Candidates:</strong>{" "}
              {result.checkedCandidates}
            </p>

            {result.matches?.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3>Strongest Match</h3>

                <p>
                  <strong>Report ID:</strong>{" "}
                  {result.matches[0].reportId}
                </p>

                <p>
                  <strong>Category:</strong>{" "}
                  {result.matches[0].category}
                </p>

                <p>
                  <strong>Severity:</strong>{" "}
                  {result.matches[0].severity}
                </p>

                <p>
                  <strong>Distance:</strong>{" "}
                  {result.matches[0].distanceMeters} meters
                </p>

                <p>
                  <strong>Text Similarity:</strong>{" "}
                  {result.matches[0].textSimilarity}
                </p>

                <p>
                  <strong>Geographic Score:</strong>{" "}
                  {result.matches[0].geoScore}
                </p>

                <p>
                  <strong>Duplicate Score:</strong>{" "}
                  {result.matches[0].duplicateScore}
                </p>

                <p>
                  <strong>Existing Report:</strong>
                </p>

                <div
                  style={{
                    padding: "14px",
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    lineHeight: 1.6,
                  }}
                >
                  {result.matches[0].description}
                </div>
              </div>
            )}

            <details style={{ marginTop: "24px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                View Raw API Response
              </summary>

              <pre
                style={{
                  marginTop: "12px",
                  padding: "16px",
                  background: "#111827",
                  color: "#f9fafb",
                  borderRadius: "8px",
                  overflowX: "auto",
                  fontSize: "13px",
                }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}