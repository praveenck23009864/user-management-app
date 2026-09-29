import "./UserCard.css";

function getInitials(name) {
  return (
    String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (word) {
        return word[0] || "";
      })
      .join("")
      .toUpperCase() || "?"
  );
}

function UserCard({
  user,
  index,
  isAdmin,
  selected,
  busy,
  onEdit,
}) {
  function handleEdit() {
    onEdit(user);
  }

  return (
    <article className={`user-card ${selected ? "selected" : ""}`}>
      <div className="user-details">
        <span
          className={`avatar tone-${index % 4}`}
          aria-hidden="true"
        >
          {getInitials(user.name)}
        </span>

        <div className="user-info">
          <h2>{user.name || "Unnamed user"}</h2>

          <p>
            {user.email || "No email"}
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="card-actions">
          <button
            type="button"
            className="edit-action"
            onClick={handleEdit}
            disabled={busy}
          >
            Edit
          </button>
        </div>
      )}
    </article>
  );
}

export default UserCard;