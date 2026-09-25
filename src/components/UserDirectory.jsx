import UserSearch from "./UserSearch.jsx";
import UserCard from "./UserCard.jsx";
import "./UserDirectory.css";
function UserDirectory({
  users,
  search,
  onSearchChange,
  loading,
  loadError,
  busy,
  editingUser,
  deleteTargetId,
  onEdit,
  onDelete,
  onDeleteTargetChange,
  onRetry,
}) {
  const query = search.trim().toLowerCase();
  function matchesSearch(user) {
    const name = String(user.name || "").toLowerCase();
    const email = String(user.email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  }
  const filteredUsers = users.filter(matchesSearch);
  function renderUser(user, index) {
    return (
      <UserCard
        key={user.id}
        user={user}
        index={index}
        selected={Boolean(editingUser && editingUser.id === user.id)}
        busy={busy}
        deleteTargetId={deleteTargetId}
        onEdit={onEdit}
        onDelete={onDelete}
        onDeleteTargetChange={onDeleteTargetChange}
      />
    );
  }
  return (
    <section className="directory" aria-label="User directory">
      <UserSearch search={search} onSearchChange={onSearchChange} />

      {loading ? (
        <p className="empty-state" role="status">
          Loading users...
        </p>
      ) : loadError ? (
        <div className="empty-state" role="alert">
          <p className="error">{loadError}</p>
          <button onClick={onRetry} disabled={busy}>
            Retry loading
          </button>
        </div>
      ) : (
        <>
          <div className="user-grid">{filteredUsers.map(renderUser)}</div>

          {filteredUsers.length === 0 && (
            <p className="empty-state">
              {users.length
                ? "No users match your search."
                : "No users found. Add your first user."}
            </p>
          )}

          <p className="user-count">
            Showing {filteredUsers.length} of {users.length} loaded users
          </p>
        </>
      )}
    </section>
  );
}
export default UserDirectory;
