
import "./PageHeader.css";

function PageHeader({
  busy,
  onAdd,
  addButtonRef,
  isAdmin,
  onAdminLogin,
  onLogout,
}) {
  return (
    <div className="page-heading">

      <div>
        <h1>
          RAKA tech User Management
        </h1>

        <p>
          {isAdmin
            ? "Admin workspace — manage your people."
            : "Browse and search our user directory."}
        </p>
      </div>

      <div className="header-actions">

        <span className="access-badge">
          {isAdmin ? "Admin" : "Viewer"}
        </span>

        {isAdmin ? (
          <>
            <button
              ref={addButtonRef}
              type="button"
              className="primary-button add-button"
              onClick={onAdd}
              disabled={busy}
            >
              + Add user
            </button>

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
            >
              Sign out
            </button>
          </>
        ) : (
<button
  type="button"
  className="primary-button add-button"
  onClick={() => {
    console.log("Admin login clicked");
    onAdminLogin();
  }}
>
  Admin login
</button>
        )}

      </div>
    </div>
  );
}

export default PageHeader;