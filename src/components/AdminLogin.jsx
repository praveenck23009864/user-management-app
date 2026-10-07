import { useState } from "react";
import "./AdminLogin.css";

export default function AdminLogin({
  onLogin,
  onCancel,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const responseText = await response.text();

      if (!responseText.trim()) {
        throw new Error(
          `Login returned an empty response (HTTP ${response.status}). Check the backend terminal and public tunnel.`
        );
      }

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Login returned an invalid response (HTTP ${response.status}). Check the backend terminal.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Login failed (HTTP ${response.status}).`
        );
      }

      if (data?.isAdmin !== true) {
        throw new Error(
          "The server did not confirm admin login."
        );
      }

      onLogin();
    } catch (error) {
      setError(error.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-login-badge">
          RAKA TECH
        </span>

        <h1>Admin Login</h1>

        <p>
          Sign in to manage users and access
          administrative tools.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">
            Email address
          </label>

          <input
            id="admin-email"
            name="email"
            type="email"
            value={email}
            onChange={function (event) {
              setEmail(event.target.value);
            }}
            autoComplete="username"
            placeholder="admin@rakatech.com"
            disabled={loading}
            required
          />

          <label htmlFor="admin-password">
            Password
          </label>

          <div className="admin-password-field">
            <input
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={function (event) {
                setPassword(event.target.value);
              }}
              autoComplete="current-password"
              placeholder="Enter password"
              disabled={loading}
              required
            />

            <button
              className="admin-password-toggle"
              type="button"
              onClick={function () {
                setShowPassword(function (previous) {
                  return !previous;
                });
              }}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              aria-controls="admin-password"
              title={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              disabled={loading}
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m3 3 18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c7 0 10 7 10 7a17.4 17.4 0 0 1-3 4" />
                  <path d="M6.5 6.5A17.7 17.7 0 0 0 2 12s3 7 10 7a10.8 10.8 0 0 0 5.5-1.5" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div
              className="admin-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            className="admin-login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button
            className="viewer-button"
            type="button"
            onClick={onCancel}
            disabled={loading}
          >
            Continue as viewer
          </button>
        </form>
      </section>
    </main>
  );
}