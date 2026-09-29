
import { useState } from "react";
import "./Login.css";

export default function Login({
  account,
  onRegister,
  onLogin,
}) {
  const [isSignup, setIsSignup] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function switchMode() {
    setIsSignup(!isSignup);

    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (isSignup) {
      // REGISTER

      if (username.trim().length < 3) {
        setError(
          "Username must contain at least 3 characters."
        );
        return;
      }

      if (!email.includes("@")) {
        setError(
          "Please enter a valid email address."
        );
        return;
      }

      if (password.length < 8) {
        setError(
          "Password must contain at least 8 characters."
        );
        return;
      }

      if (password !== confirmPassword) {
        setError(
          "Passwords do not match."
        );
        return;
      }

      onRegister({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      setSuccess(
        "Account created! Please sign in."
      );

      setIsSignup(false);
      setPassword("");
      setConfirmPassword("");

    } else {
      // LOGIN

      const loginError = onLogin(
        email.trim(),
        password
      );

      if (loginError) {
        setError(loginError);
      }
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">

        {/* LEFT SECTION */}

        <section className="login-hero">
          <div className="login-hero-content">

            <div className="login-brand">
              <span className="brand-icon">
                R
              </span>

              <span>RAKA tech</span>
            </div>

            <div className="hero-text">

              <span className="hero-badge">
                USER MANAGEMENT PLATFORM
              </span>

              <h1>
                Manage your users
                <br />
                with confidence.
              </h1>

              <p>
                Create an account,
                manage users, and
                explore your data
                with AI.
              </p>

            </div>

            <div className="hero-footer">
              React + Express + Ollama Cloud
            </div>

          </div>
        </section>

        {/* RIGHT SECTION */}

        <section className="login-form-section">

          <div className="login-card">

            <div className="mobile-brand">
              RAKA tech
            </div>

            <span className="login-eyebrow">
              {isSignup
                ? "GET STARTED"
                : "WELCOME BACK"}
            </span>

            <h2>
              {isSignup
                ? "Create your account"
                : "Sign in to your account"}
            </h2>

            <p className="login-subtitle">
              {isSignup
                ? "Enter your details to register."
                : "Enter your email and password."}
            </p>

            <form onSubmit={handleSubmit}>

              {/* USERNAME */}

              {isSignup && (
                <div className="login-field">

                  <label htmlFor="username">
                    Username
                  </label>

                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    autoComplete="username"
                    minLength={3}
                    required
                  />

                </div>
              )}

              {/* EMAIL */}

              <div className="login-field">

                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  required
                />

              </div>

              {/* PASSWORD */}

              <div className="login-field">

                <label htmlFor="password">
                  Password
                </label>

                <div className="password-input">

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete={
                      isSignup
                        ? "new-password"
                        : "current-password"
                    }
                    minLength={
                      isSignup ? 8 : undefined
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {/* CONFIRM PASSWORD */}

              {isSignup && (
                <div className="login-field">

                  <label htmlFor="confirmPassword">
                    Confirm password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    required
                  />

                </div>
              )}

              {/* FEEDBACK */}

              {error && (
                <p
                  className="login-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  className="login-success"
                  role="status"
                >
                  {success}
                </p>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="login-submit"
              >
                {isSignup
                  ? "Create account"
                  : "Sign in"}

                <span>→</span>
              </button>

              {/* SWITCH MODE */}

              <p className="auth-switch">

                {isSignup
                  ? "Already have an account?"
                  : "Don't have an account?"}

                {" "}

                <button
                  type="button"
                  onClick={switchMode}
                >
                  {isSignup
                    ? "Sign in"
                    : "Create account"}
                </button>

              </p>

              <p className="login-demo-note">
                Demo only — accounts are not
                saved after refreshing the page.
              </p>

              {account && !isSignup && (
                <p className="demo-account">
                  Account created for:
                  {" "}
                  <strong>
                    {account.username}
                  </strong>
                </p>
              )}

            </form>

          </div>

        </section>

      </div>
    </main>
  );
}