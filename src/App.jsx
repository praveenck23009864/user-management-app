
import { useEffect, useState } from "react";

import AdminLogin from "./components/AdminLogin.jsx";
import UserManagement from "./components/UserManagement.jsx";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Check whether an admin session already exists.
  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((result) => {
        setIsAdmin(result.isAdmin === true);
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not sign out.");
      }

      setIsAdmin(false);
      setShowLogin(false);
    } catch {
      alert("Unable to sign out. Please try again.");
    }
  }

  if (checking) {
    return (
      <p className="auth-loading">
        Loading workspace...
      </p>
    );
  }

  // Show login only when the visitor clicks Admin Login.
if (showLogin && !isAdmin) {
  return (
    <AdminLogin
      onLogin={() => {
        setIsAdmin(true);
        setShowLogin(false);
      }}
      onCancel={() => setShowLogin(false)}
    />
  );
}
  // Public directory is visible by default.
  return (
    <UserManagement
      isAdmin={isAdmin}
      onAdminLogin={() => setShowLogin(true)}
      onLogout={logout}
    />
  );
}