import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name.trim(),
      });

      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: user.email,
        role: "user",
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);

      switch (error.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setError("Password is too weak. Use at least 6 characters.");
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection and try again."
          );
          break;

        default:
          setError("Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ============================================================
          INPUT / AUTOFILL STYLING
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
              SIGNUP TITLE
          ======================================================== */}

          <h2
            style={{
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Create your account
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: "25px",
              color: "#6b7280",
            }}
          >
            Join CivicAI and help identify community problems.
          </p>

          {/* ========================================================
              SIGNUP FORM
          ======================================================== */}

          <form onSubmit={handleSignup}>
            {/* FULL NAME */}

            <label
              htmlFor="name"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Full Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              autoComplete="name"
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
              placeholder="At least 6 characters"
              autoComplete="new-password"
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

            {/* CONFIRM PASSWORD */}

            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Re-enter your password"
              autoComplete="new-password"
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

            {/* ERROR MESSAGE */}

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

            {/* CREATE ACCOUNT */}

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
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* ========================================================
              LOGIN LINK
          ======================================================== */}

          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#111827",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}