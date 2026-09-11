import { Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db } from "../firebase";

export default function AdminRoute() {
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const checkAdmin = () => {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setIsAdmin(false);
          setCheckingAdmin(false);
          return;
        }

        try {
          const userRef = doc(db, "users", user.uid);
          const userSnapshot = await getDoc(userRef);

          if (!userSnapshot.exists()) {
            setIsAdmin(false);
            setCheckingAdmin(false);
            return;
          }

          const userData = userSnapshot.data();

          setIsAdmin(userData.role === "admin");
        } catch (error) {
          console.error("Admin role check failed:", error);
          setIsAdmin(false);
        } finally {
          setCheckingAdmin(false);
        }
      });
    };

    checkAdmin();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (checkingAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          color: "#374151",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
        }}
      >
        Checking admin access...
      </div>
    );
  }

  if (!auth.currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}