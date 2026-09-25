import "./PageHeader.css";
function PageHeader({ busy, onAdd, addButtonRef }) {
  return (
    <div className="page-heading">
      <div>
        <h1>RAKA tech User Management</h1>
        <p>A simple space to manage your people.</p>
      </div>
      <button
        ref={addButtonRef}
        type="button"
        className="primary-button add-button"
        onClick={onAdd}
        disabled={busy}
      >
        Add user
      </button>
    </div>
  );
}
export default PageHeader;
