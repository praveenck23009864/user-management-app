import { useState } from "react";
import './PageHeader.css';
import './UserCard.css';
import  './UserChat.css';
import './UserDirectory.css';
import './UserForm.css';
import './UserSearch.css';
import './UserManagement.css';

function UserForm({
  user,
  busy,
  onSave,
  onClose,
  onDelete,
}) {
  const [name, setName] = useState(
    user ? user.name || "" : ""
  );

  const [email, setEmail] = useState(
    user ? user.email || "" : ""
  );

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
  }

  function openDeleteConfirm() {
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    setShowDeleteConfirm(false);
  }

  async function confirmDelete() {
    if (!user || busy) {
      return;
    }

    setApiError("");

    try {
      await onDelete(user);
    } catch (error) {
      setApiError(
        error.message ||
          "Unable to delete user."
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) {
      return;
    }

    const fieldErrors = {};

    if (!name.trim()) {
      fieldErrors.name =
        "Please enter a full name.";
    }

    if (!email.trim().includes("@")) {
      fieldErrors.email =
        "Email must contain @.";
    }

    setErrors(fieldErrors);
    setApiError("");

    if (
      Object.keys(fieldErrors).length > 0
    ) {
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
      });
    } catch (error) {
      setApiError(
        error.message ||
          "Unable to save user."
      );
    }
  }

  return (
    <form
      className="user-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="form-heading">
        <div>
          <h2>
            {user
              ? "Edit user"
              : "Add user"}
          </h2>

          <p>
            {user
              ? "Update or delete this user."
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
        <label htmlFor="full-name">
          Name
        </label>

        <input
          id="full-name"
          value={name}
          onChange={handleNameChange}
          placeholder="Enter full name"
          autoComplete="name"
          required
          aria-invalid={Boolean(
            errors.name
          )}
        />

        {errors.name && (
          <p className="error">
            {errors.name}
          </p>
        )}

        <label htmlFor="email-address">
          Email address
        </label>

        <input
          id="email-address"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter email address"
          autoComplete="email"
          required
          aria-invalid={Boolean(
            errors.email
          )}
        />

        {errors.email && (
          <p className="error">
            {errors.email}
          </p>
        )}

        {apiError && (
          <p
            className="error"
            role="alert"
          >
            {apiError}
          </p>
        )}

        {user && showDeleteConfirm && (
          <div className="delete-box">
            <div>
              <strong>
                Delete this user?
              </strong>

              <p>
                Are you sure you want to
                delete {user.name}?
              </p>
            </div>

            <div className="delete-box-actions">
              <button
                type="button"
                onClick={
                  closeDeleteConfirm
                }
                disabled={busy}
              >
                Keep user
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                onClick={confirmDelete}
                disabled={busy}
              >
                Confirm delete
              </button>
            </div>
          </div>
        )}

        <div className="form-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>

          {user && (
            <button
              type="button"
              className="delete-user-button"
              onClick={
                openDeleteConfirm
              }
              disabled={busy}
            >
              Delete user
            </button>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : user
              ? "Save changes"
              : "Add user"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

export default UserForm;