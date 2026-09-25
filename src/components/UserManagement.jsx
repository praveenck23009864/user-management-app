import { useEffect, useRef, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "./usersApi.js";
import PageHeader from "./PageHeader.jsx";
import UserDirectory from "./UserDirectory.jsx";
import UserForm from "./UserForm.jsx";
import UserChat from "./UserChat.jsx";
import "./UserManagement.css";
function UserManagement() {
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const panelRef = useRef(null);
  const addButtonRef = useRef(null);
  const mutationLock = useRef(false);
  const loadSequence = useRef(0);
  // Fetching is shared by the first load and later refreshes.
  async function fetchUsers() {
    const requestNumber = ++loadSequence.current;
    try {
      const data = await getUsers();

      // Ignore an older response if a newer request has started.
      if (requestNumber === loadSequence.current) {
        setUsers(data);
      }
    } catch (error) {
      if (requestNumber === loadSequence.current) {
        setLoadError(error.message || "Unable to load users.");
      }
    } finally {
      if (requestNumber === loadSequence.current) {
        setLoading(false);
      }
    }
  }
  function loadUsers() {
    setLoading(true);
    setLoadError("");
    return fetchUsers();
  }

  useEffect(function () {
    const requestNumber = ++loadSequence.current;

    getUsers()
      .then(function (data) {
        if (requestNumber === loadSequence.current) setUsers(data);
      })
      .catch(function (error) {
        if (requestNumber === loadSequence.current) {
          setLoadError(error.message || "Unable to load users.");
        }
      })
      .finally(function () {
        if (requestNumber === loadSequence.current) setLoading(false);
      });

    return function () {
      loadSequence.current += 1;
    };
  }, []);
  function handleAdd() {
    openForm(null);
  }
  function openForm(user = null) {
    if (mutationLock.current) return;
    setEditingUser(user);
    setFormOpen(true);
    setFormVersion(function (version) {
      return version + 1;
    });
    setMessage("");
    setActionError("");
  }

  // Focus the form after React has rendered it.
  useEffect(
    function () {
      if (!formOpen || formVersion === 0) return;
      if (panelRef.current) {
        panelRef.current.scrollIntoView({
          block: "nearest",
        });
        const input = panelRef.current.querySelector("input");
        if (input)
          input.focus({
            preventScroll: true,
          });
      }
    },
    [formOpen, formVersion],
  );
  function closeForm() {
    setFormOpen(false);
    setEditingUser(null);
    requestAnimationFrame(function () {
      if (addButtonRef.current) addButtonRef.current.focus();
    });
  }
  async function saveUser(values) {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    setMessage("");
    setActionError("");
    try {
      if (editingUser) {
        const changes = {};
        if (values.name !== editingUser.name) {
          changes.name = values.name;
        }
        if (values.email !== editingUser.email) {
          changes.email = values.email;
        }
        if (Object.keys(changes).length === 0) {
          setMessage("No changes to save.");
          return;
        }
        await updateUser(editingUser.id, changes);
        setMessage("User updated successfully.");
      } else {
        await createUser(values);
        setMessage("User created successfully.");
      }

      // Refresh errors are handled separately from save errors.
      await loadUsers();
      closeForm();
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }
  async function handleDelete(user) {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      await deleteUser(user.id);

      // Remove the deleted record immediately.
      setUsers(function (current) {
        return current.filter(function (item) {
          return item.id !== user.id;
        });
      });
      setMessage("User deleted successfully.");
      await loadUsers();
      if (editingUser && editingUser.id === user.id) {
        closeForm();
      }
    } catch (error) {
      setActionError(error.message || "Unable to delete user.");
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="people-page">
      <div className="workspace">
        <div className="workspace-body">
          <PageHeader
            busy={busy}
            onAdd={handleAdd}
            addButtonRef={addButtonRef}
          />

          {message && (
            <p className="success-message" role="status">
              {message}
            </p>
          )}

          {actionError && (
            <p className="error" role="alert">
              {actionError}
            </p>
          )}

          <div className="people-layout with-panel">
            <UserDirectory
              users={users}
              search={search}
              onSearchChange={setSearch}
              loading={loading}
              loadError={loadError}
              busy={busy}
              editingUser={editingUser}
              deleteTargetId={deleteTargetId}
              onEdit={openForm}
              onDelete={handleDelete}
              onDeleteTargetChange={setDeleteTargetId}
              onRetry={loadUsers}
            />

            <aside className="right-sidebar">
              {formOpen && (
                <div
                  ref={panelRef}
                  className="editor-panel"
                  aria-label={editingUser ? "Edit user" : "Add user"}
                >
                  <UserForm
                    key={formVersion}
                    user={editingUser}
                    busy={busy}
                    onSave={saveUser}
                    onClose={closeForm}
                  />
                </div>
              )}

              <div className="chat-side-panel">
                <UserChat users={users} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
export default UserManagement;
