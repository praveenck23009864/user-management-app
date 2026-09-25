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
  selected,
  busy,
  deleteTargetId,
  onEdit,
  onDelete,
  onDeleteTargetChange,
}) {
  function handleEdit() {
    onEdit(user);
  }
  function requestDelete() {
    onDeleteTargetChange(user.id);
  }
  function cancelDelete() {
    onDeleteTargetChange(null);
  }
  function confirmDelete() {
    onDeleteTargetChange(null);
    onDelete(user);
  }
  return (
    <article className={`user-card ${selected ? "selected" : ""}`}>
      <div className="user-details">
        <span className={`avatar tone-${index % 4}`} aria-hidden="true">
          {getInitials(user.name)}
        </span>

        <div className="user-info">
          <h2>{user.name || "Unnamed user"}</h2>
          <p>{user.email || "No email"}</p>
        </div>
      </div>

      <div className="card-actions">
        <button
          className="edit-action"
          onClick={handleEdit}
          disabled={busy}
          aria-label={`Edit ${user.name}`}
        >
          Edit
        </button>

        {deleteTargetId === user.id ? (
          <div
            className="delete-confirm"
            role="group"
            aria-label={`Confirm deletion of ${user.name}`}
          >
            <p>Delete {user.name}?</p>

            <div className="delete-confirm-actions">
              <button type="button" disabled={busy} onClick={cancelDelete}>
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                disabled={busy}
                onClick={confirmDelete}
              >
                Confirm delete
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="delete-action"
            onClick={requestDelete}
            disabled={busy}
            aria-label={`Delete ${user.name}`}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
export default UserCard;
