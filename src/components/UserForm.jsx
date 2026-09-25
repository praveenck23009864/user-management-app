import { useState } from "react";
import "./UserForm.css";
function UserForm({ user, busy, onSave, onClose }) {
  const [name, setName] = useState(user ? user.name || "" : "");
  const [email, setEmail] = useState(user ? user.email || "" : "");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  function handleNameChange(event) {
    setName(event.target.value);
  }
  function handleEmailChange(event) {
    setEmail(event.target.value);
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const fieldErrors = {};
    if (!name.trim()) {
      fieldErrors.name = "Please enter a full name.";
    }
    if (!email.trim().includes("@")) {
      fieldErrors.email = "Email must contain @.";
    }
    setErrors(fieldErrors);
    setApiError("");
    if (Object.keys(fieldErrors).length > 0) return;
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
      });
    } catch (error) {
      setApiError(error.message || "Unable to save user.");
    }
  }
  return (
    <form className="user-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading">
        <div>
          <h2>{user ? "Edit user" : "Add user"}</h2>
          <p>
            {user
              ? "Update the details below."
              : "Enter the new user's details."}
          </p>
        </div>

        <button
          type="button"
          className="close-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close form"
        >
          ×
        </button>
      </div>

      <fieldset disabled={busy}>
        <label htmlFor="full-name">name</label>
        <input
          id="full-name"
          value={name}
          onChange={handleNameChange}
          placeholder="Enter full name"
          autoComplete="name"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
        />

        {errors.name && (
          <p id="name-error" className="error">
            {errors.name}
          </p>
        )}

        <label htmlFor="email-address">Email address</label>
        <input
          id="email-address"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter email address"
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />

        {errors.email && (
          <p id="email-error" className="error">
            {errors.email}
          </p>
        )}

        {apiError && (
          <p className="error" role="alert">
            {apiError}
          </p>
        )}

        <div className="form-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="primary-button">
            {busy ? "Please wait..." : user ? "Save changes" : "Add user"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
export default UserForm;
