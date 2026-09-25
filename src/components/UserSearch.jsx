import "./UserSearch.css";
function UserSearch({ search, onSearchChange }) {
  function handleChange(event) {
    onSearchChange(event.target.value);
  }
  return (
    <div className="search-box">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </svg>

      <input
        type="search"
        aria-label="Search loaded users by name or email"
        placeholder="Search name or email"
        value={search}
        onChange={handleChange}
      />
    </div>
  );
}
export default UserSearch;
