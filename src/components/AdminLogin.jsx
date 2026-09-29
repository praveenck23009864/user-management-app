import { useState } from "react";
import "./AdminLogin.css";

export default function AdminLogin({
  onLogin,
  onCancel,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

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
          data.error || `Login failed (HTTP ${response.status}).`
        );
      }

      if (data.isAdmin !== true) {
        throw new Error("The server did not confirm admin login.");
      }

      onLogin();
    } catch (error) {
      setError(error.message);
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
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="admin@rakatech.com"
            required
          />

          <label htmlFor="admin-password">
            Password
          </label>

          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter password"
            required
          />

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            className="admin-login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

          <button
            className="viewer-button"
            type="button"
            onClick={onCancel}
          >
            Continue as viewer
          </button>
        </form>
      </section>
    </main>
  );
}