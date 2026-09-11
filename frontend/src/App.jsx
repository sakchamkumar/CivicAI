import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ReportProblem from "./pages/ReportProblem";
import MyReports from "./pages/MyReports";
import ReportDetails from "./pages/ReportDetails";
import CommunityMap from "./pages/CommunityMap";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ============================================================
            PUBLIC ROUTES
        ============================================================ */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />



        {/* ============================================================
            PROTECTED USER ROUTES
        ============================================================ */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/report"
            element={<ReportProblem />}
          />

          <Route
            path="/my-reports"
            element={<MyReports />}
          />

          <Route
            path="/report/:reportId"
            element={<ReportDetails />}
          />

          <Route
            path="/map"
            element={<CommunityMap />}
          />

          {/* ========================================================
              COMMUNITY ANALYTICS
          ======================================================== */}

          <Route
            path="/analytics"
            element={<Analytics />}
          />

        </Route>



        {/* ============================================================
            ADMIN ROUTES
        ============================================================ */}

        <Route element={<AdminRoute />}>

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

        </Route>



        {/* ============================================================
            FALLBACK
        ============================================================ */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;