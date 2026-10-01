import { useRef, useState } from "react";
import "./UserForm.css";
export default function UserForm({
  user,
  users = [],
  busy = false,
  onSave,
  onClose,
  onDelete
}) {
  const [values, setValues] = useState({
    username: user?.username || "",
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    zipcode: user?.address?.zipcode || ""
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const lock = useRef(false);
  function handleChange(event) {
    const {
      name,
      value
    } = event.target;
    setValues(function (previous) {
      return {
        ...previous,
        [name]: value
      };
    });
    setErrors(function (previous) {
      return {
        ...previous,
        [name]: ""
      };
    });
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (busy || lock.current) return;
    const data = {
      username: values.username.trim(),
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      address: {
        ...(user?.address || {}),
        street: values.street.trim(),
        city: values.city.trim(),
        zipcode: values.zipcode.trim()
      }
    };
    const fieldErrors = {};
    if (!data.name.trim()) {
      fieldErrors.name = "Please enter your full name.";
    }
    const username = data.username.toLowerCase();
    const email = data.email.toLowerCase();
    const others = users.filter(function (item) {
      return !user || String(item.id) !== String(user.id);
    });
    if (!username) fieldErrors.username = "Please enter a username."; else if (others.some(function (item) {
      return String(item.username || "").trim().toLowerCase() === username;
    })) fieldErrors.username = "This username already exists.";
    if (!email) fieldErrors.email = "Please enter an email address."; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = "Please enter a valid email address.";
    } else if (others.some(function (item) {
      return String(item.email || "").trim().toLowerCase() === email;
    })) fieldErrors.email = "This email address is already in use.";
    setErrors(fieldErrors);
    setApiError("");
    if (Object.keys(fieldErrors).length) return;
    lock.current = true;
    try {
      await onSave(data);
    } catch (error) {
      setErrors(error.fields || {});
      setApiError(error.message || "Unable to save user.");
    } finally {
      lock.current = false;
    }
  }
  async function handleDelete() {
    if (!user || busy || lock.current) return;
    setApiError("");
    try {
      await onDelete(user);
    } catch (error) {
      setApiError(error.message || "Unable to delete user.");
    }
  }
  function field(
    name,
    label,
    type = "text",
    autoComplete = "off",
    required = false
  ) {
    const placeholders = {
      username: "Enter a unique username",
      name: "Enter your full name",
      email: "Enter your email address",
      street: "Enter street or house address",
      city: "Enter your city",
      zipcode: "Enter postal code",
      phone: "Enter phone number (optional)",
    };

    return (
      <div className="form-field">
        <label htmlFor={`user-${name}`}>
          {label}
          {required ? " *" : ""}
        </label>

        <input
          id={`user-${name}`}
          name={name}
          type={type}
          value={values[name]}
          onChange={handleChange}
          placeholder={placeholders[name]}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={
            errors[name]
              ? `error-${name}`
              : undefined
          }
        />

        {errors[name] && (
          <p
            id={`error-${name}`}
            className="error"
          >
            {errors[name]}
          </p>
        )}
      </div>
    );
  }
  return <form className="user-form" onSubmit={handleSubmit} noValidate>
    <div className="form-heading">
      <div><h2>{user ? "Edit user" : "Add user"}</h2>
        <p>
          Username, name and email are required.
          Phone number and address are optional.
        </p></div>
      <button type="button" className="close-button" onClick={onClose} disabled={busy} aria-label="Close form">×</button>
    </div>
    <fieldset disabled={busy}>
      {field("username", "Username", "text", "username", true)}
      {field("name", "Name", "text", "name", true)}
      {field("email", "Email address", "email", "email", true)}
      <fieldset className="address-fields">
        <legend>Address (optional)</legend>
        {field("street", "Street", "text", "street-address")}
        {field("city", "City", "text", "address-level2")}
        {field("zipcode", "Postal code", "text", "postal-code")}
      </fieldset>
      {field("phone", "Phone number (optional)", "tel", "tel")}
      {(
        apiError ||
        Object.values(errors).some(Boolean)
      ) && (
          <div
            className="form-alert"
            role="alert"
            aria-atomic="true"
          >
            <strong>Unable to save user</strong>

            {apiError && <p>{apiError}</p>}

            {Object.values(errors).some(Boolean) && (
              <ul>
                {Object.entries(errors)
                  .filter(function ([, message]) {
                    return Boolean(message);
                  })
                  .map(function ([fieldName, message]) {
                    return (
                      <li key={fieldName}>
                        {message}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        )}
      <div className="form-footer">
        <button type="button" onClick={onClose}>Cancel</button>
        {user && typeof onDelete === "function" && <button type="button" className="delete-user-button" onClick={handleDelete}>Delete user</button>}
        <button type="submit" className="primary-button">
          {busy ? "Please wait..." : user ? "Save changes" : "Add user"}
        </button>
      </div>
    </fieldset>
  </form>;
}
