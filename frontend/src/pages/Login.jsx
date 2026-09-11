import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Invalid email or password.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setError(
            "Too many login attempts. Please try again later."
          );
          break;

        default:
          setError("Unable to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ============================================================
          BROWSER AUTOFILL FIX
      ============================================================ */}

      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
            box-shadow: 0 0 0 1000px #ffffff inset !important;
            -webkit-text-fill-color: #111827 !important;
            color: #111827 !important;
            caret-color: #111827 !important;
            transition: background-color 9999s ease-in-out 0s;
          }

          input::placeholder {
            color: #9ca3af;
            opacity: 1;
          }

          input:focus {
            border-color: #111827 !important;
            box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.08);
          }
        `}
      </style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          padding: "24px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            background: "#ffffff",
            padding: "40px",
            borderRadius: "18px",
            boxShadow: "0 12px 35px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* ========================================================
              HEADER
          ======================================================== */}

          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <h1
              style={{
                margin: "0 0 10px",
                fontSize: "34px",
                color: "#111827",
              }}
            >
              CivicAI
            </h1>

            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "16px",
              }}
            >
              AI-Powered Community Problem Intelligence
            </p>
          </div>

          {/* ========================================================
              LOGIN TITLE
          ======================================================== */}

          <h2
            style={{
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Welcome back
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: "25px",
              color: "#6b7280",
            }}
          >
            Sign in to continue to CivicAI.
          </p>

          {/* ========================================================
              LOGIN FORM
          ======================================================== */}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}

            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                marginBottom: "18px",
                border: "1px solid #9ca3af",
                borderRadius: "10px",
                fontSize: "15px",
                outline: "none",
                backgroundColor: "#ffffff",
                color: "#111827",
                WebkitTextFillColor: "#111827",
              }}
            />

            {/* PASSWORD */}

            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                marginBottom: "20px",
                border: "1px solid #9ca3af",
                borderRadius: "10px",
                fontSize: "15px",
                outline: "none",
                backgroundColor: "#ffffff",
                color: "#111827",
                WebkitTextFillColor: "#111827",
              }}
            />

            {/* ERROR */}

            {error && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontSize: "14px",
                }}
              >
                ❌ {error}
              </div>
            )}

            {/* SIGN IN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "10px",
                background: "#111827",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* ========================================================
              SIGNUP LINK
          ======================================================== */}

          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{
                color: "#111827",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}