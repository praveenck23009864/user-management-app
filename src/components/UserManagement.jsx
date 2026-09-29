
import './UserManagement.css';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from './usersApi.js';

import UserChat from './UserChat.jsx';
import UserForm from './UserForm.jsx';



const palette = [
  'mint',
  'blue',
  'lilac',
  'peach',
  'aqua',
  'rose',
];

const nav = [
  {
    id: 'dashboard',
    icon: '▦',
    label: 'Dashboard',
  },
  {
    id: 'users',
    icon: '♙',
    label: 'Users',
  },
  {
    id: 'analytics',
    icon: '▥',
    label: 'Analytics',
  },
  {
    id: 'assistant',
    icon: '✧',
    label: 'AI Assistant',
  },
  {
    id: 'settings',
    icon: '⚙',
    label: 'Settings',
  },
];

function Avatar({ user, index = 0 }) {
  const initials = String(user?.name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(function (part) {
      return part[0];
    })
    .join('')
    .toUpperCase();

  return (
    <span
      className={`avatar ${
        palette[index % palette.length]
      }`}
    >
      {initials}
    </span>
  );
}

function IconButton({
  children,
  ...props
}) {
  return (
    <button
      className="icon-button"
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function ErrorState({
  message,
  retry,
}) {
  return (
    <div
      className="state"
      role="alert"
    >
      {message}

      <br />

      <button
        className="button secondary"
        onClick={retry}
      >
        Try again
      </button>
    </div>
  );
}

export default function UserManagement({
  isAdmin,
  onAdminLogin,
  onLogout,
}) {
  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');

  const [page, setPage] =
    useState('dashboard');

  const [search, setSearch] =
    useState('');

  const [view, setView] =
    useState('table');

  const [
    pageNumber,
    setPageNumber,
  ] = useState(1);

  const [dark, setDark] =
    useState(false);

  const [
    mobileNav,
    setMobileNav,
  ] = useState(false);

  const [drawer, setDrawer] =
    useState(null);

  const [target, setTarget] =
    useState(null);

  const [confirm, setConfirm] =
    useState(null);

  const [busy, setBusy] =
    useState(false);

  const [notice, setNotice] =
    useState('');

  /*
   * Load users
   */
  const refresh =
    useCallback(async function () {
      setLoading(true);
      setLoadError('');

      try {
        const data =
          await getUsers();

        setUsers(data);
      } catch (error) {
        setLoadError(
          error.message ||
            'Unable to load users.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(function () {
    let live = true;

    getUsers()
      .then(function (data) {
        if (live) {
          setUsers(data);
        }
      })
      .catch(function (error) {
        if (live) {
          setLoadError(
            error.message ||
              'Unable to load users.',
          );
        }
      })
      .finally(function () {
        if (live) {
          setLoading(false);
        }
      });

    return function () {
      live = false;
    };
  }, []);

  /*
   * Search
   * Status filtering has been removed.
   */
  const filtered = useMemo(
    function () {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        function (user) {
          const searchable =
            `${user.name || ''} ${
              user.email || ''
            }`.toLowerCase();

          return searchable.includes(
            query,
          );
        },
      );
    },
    [users, search],
  );

  /*
   * Pagination
   */
  const visible =
    filtered.slice(
      (pageNumber - 1) * 8,
      pageNumber * 8,
    );

  const pages = Math.max(
    1,
    Math.ceil(
      filtered.length / 8,
    ),
  );

  /*
   * Email domains
   */
  const domains =
    Object.entries(
      users.reduce(
        function (
          accumulator,
          user,
        ) {
          const domain =
            String(
              user.email || '',
            ).split('@')[1];

          if (domain) {
            accumulator[domain] =
              (accumulator[
                domain
              ] || 0) + 1;
          }

          return accumulator;
        },
        {},
      ),
    )
      .sort(function (a, b) {
        return b[1] - a[1];
      })
      .slice(0, 4);

  /*
   * Dashboard statistics
   */
  const total = users.length;

  const emailDomainCount =
    Object.keys(
      users.reduce(
        function (
          accumulator,
          user,
        ) {
          const domain =
            String(
              user.email || '',
            ).split('@')[1];

          if (domain) {
            accumulator[domain] =
              true;
          }

          return accumulator;
        },
        {},
      ),
    ).length;

  const gmailUsers =
    users.filter(
      function (user) {
        return String(
          user.email || '',
        )
          .toLowerCase()
          .endsWith(
            '@gmail.com',
          );
      },
    ).length;

  const stats = [
    {
      label: 'Total users',
      value: total,
      icon: '♙',
      tone: 'blue',
      caption:
        'People in your workspace',
    },
    {
      label: 'Email domains',
      value: emailDomainCount,
      icon: '✉',
      tone: 'lilac',
      caption:
        'Unique domains across your team',
    },
    {
      label: 'Gmail users',
      value: gmailUsers,
      icon: '✦',
      tone: 'mint',
      caption:
        'Users with Gmail accounts',
    },
  ];

  /*
   * Navigation
   */
  function go(nextPage) {
    setPage(nextPage);

    setMobileNav(false);

    setSearch('');

    setPageNumber(1);
  }

  /*
   * Open add/edit/details drawer
   */
  function open(
    mode,
    user = null,
  ) {
    if (
      (mode === 'add' ||
        mode === 'edit') &&
      !isAdmin
    ) {
      onAdminLogin();
      return;
    }

    setTarget(user);
    setDrawer(mode);
  }

  /*
   * Create / Update user
   */
  async function save(values) {
    setBusy(true);
    setNotice('');

    try {
      if (target) {
        await updateUser(
          target.id,
          {
            name: values.name,
            email: values.email,
          },
        );

        setNotice(
          'User updated successfully.',
        );
      } else {
        await createUser(values);

        setNotice(
          'User added successfully.',
        );
      }

      await refresh();

      setDrawer(null);
      setTarget(null);
    } catch (error) {
      setNotice(
        error.message ||
          'Unable to save user.',
      );

      throw error;
    } finally {
      setBusy(false);
    }
  }

  /*
   * Delete user
   */
  async function remove() {
    if (!confirm) {
      return;
    }

    setBusy(true);

    try {
      await deleteUser(
        confirm.id,
      );

      setNotice(
        'User deleted successfully.',
      );

      setConfirm(null);
      setDrawer(null);
      setTarget(null);

      await refresh();
    } catch (error) {
      setNotice(
        error.message ||
          'Unable to delete user.',
      );

      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`raka-app ${
        dark
          ? 'theme-dark'
          : ''
      }`}
    >
      {/* ======================
          SIDEBAR
      ====================== */}

      <aside
        className={`side-nav ${
          mobileNav
            ? 'mobile-open'
            : ''
        }`}
      >
        <button
          className="brand"
          onClick={function () {
            go('dashboard');
          }}
        >
          <span className="brand-mark">
            ◧
          </span>

          <span>
            RAKA <b>tech</b>
          </span>
        </button>

        <p className="nav-caption">
          WORKSPACE
        </p>

        <nav aria-label="Main navigation">
          {nav.map(
            function (item) {
              return (
                <button
                  key={item.id}
                  onClick={function () {
                    go(item.id);
                  }}
                  className={`nav-link ${
                    page ===
                    item.id
                      ? 'selected'
                      : ''
                  }`}
                >
                  <span className="nav-icon">
                    {item.icon}
                  </span>

                  {item.label}

                  {item.id ===
                    'users' && (
                    <span className="nav-count">
                      {total}
                    </span>
                  )}
                </button>
              );
            },
          )}
        </nav>

        <div className="side-bottom">
          <div className="workspace-badge">
            <span className="workspace-symbol">
              ✦
            </span>

            <div>
              <strong>
                Your workspace
              </strong>

              <small>
                Manage with
                confidence
              </small>
            </div>
          </div>

          <button
            className="side-account"
            onClick={
              isAdmin
                ? onLogout
                : onAdminLogin
            }
          >
            <span className="avatar blue">
              PC
            </span>

            <span>
              <strong>
                {isAdmin
                  ? 'Admin account'
                  : 'Viewer mode'}
              </strong>

              <small>
                {isAdmin
                  ? 'Sign out'
                  : 'Sign in as admin'}
              </small>
            </span>

            <span>↗</span>
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={function () {
            setMobileNav(
              false,
            );
          }}
        />
      )}

      {/* ======================
          MAIN AREA
      ====================== */}

      <div className="app-main">
        {/* TOP BAR */}

        <header className="topbar">
          <div className="top-left">
            <IconButton
              aria-label="Open menu"
              onClick={function () {
                setMobileNav(
                  true,
                );
              }}
            >
              ☰
            </IconButton>

            <span className="breadcrumb">
              Workspace
              <span> / </span>

              <strong>
                {
                  nav.find(
                    function (
                      item,
                    ) {
                      return (
                        item.id ===
                        page
                      );
                    },
                  )?.label
                }
              </strong>
            </span>
          </div>

          <div className="top-actions">
            <button
              className="top-search"
              onClick={function () {
                go('users');
              }}
            >
              <span>⌕</span>

              Search users by
              name or email...
            </button>

            <IconButton
              aria-label="Toggle dark mode"
              onClick={function () {
                setDark(!dark);
              }}
            >
              {dark
                ? '☀'
                : '☾'}
            </IconButton>

            <span className="top-divider" />

            <button
              className="account-chip"
              onClick={
                isAdmin
                  ? onLogout
                  : onAdminLogin
              }
            >
              <span className="avatar blue">
                PC
              </span>

              <span>
                <strong>
                  Praveen Chandu
                </strong>

                <small>
                  {isAdmin
                    ? 'Admin · Sign out'
                    : 'Viewer · Admin login'}
                </small>
              </span>

              <span>⌄</span>
            </button>
          </div>
        </header>

        {/* ======================
            CONTENT
        ====================== */}

        <main
          className="content"
          style={{
            textAlign: 'left',
          }}
        >
          {notice && (
            <div
              className="toast"
              role="status"
            >
              {notice}

              <button
                onClick={function () {
                  setNotice('');
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* ======================
              DASHBOARD
          ====================== */}

{page === 'dashboard' && (
  <>
    <div
      className="page-heading"
      style={{ display: 'flex', justifyContent: 'flex-end' }}
    >
      <button
        className="button primary"
        onClick={function () {
          open('add');
        }}
      >
        ＋ Add user
      </button>
    </div>

              {/* DASHBOARD CARDS */}

              <div className="stats-grid">
                {stats.map(
                  function (stat) {
                    return (
                      <article
                        className="stat-card"
                        key={
                          stat.label
                        }
                      >
                        <span
                          className={`stat-icon ${stat.tone}`}
                        >
                          {
                            stat.icon
                          }
                        </span>

                        <span className="stat-label">
                          {
                            stat.label
                          }
                        </span>

                        <strong>
                          {loading
                            ? '—'
                            : stat.value}
                        </strong>

                        <small>
                          {
                            stat.caption
                          }
                        </small>
                      </article>
                    );
                  },
                )}
              </div>

              <div className="dashboard-grid">
                {/* RECENT USERS */}

                <section className="surface recent-panel">
                  <div className="section-heading">
                    <div>
                      <h2>
                        Recent users
                      </h2>

                      <p>
                        A quick look
                        at people in
                        your workspace
                      </p>
                    </div>

                    <button
                      className="text-link"
                      onClick={function () {
                        go('users');
                      }}
                    >
                      View all →
                    </button>
                  </div>

                  {loading ? (
                    <p className="state">
                      Loading users...
                    </p>
                  ) : loadError ? (
                    <ErrorState
                      message={
                        loadError
                      }
                      retry={
                        refresh
                      }
                    />
                  ) : users.length ===
                    0 ? (
                    <p className="state">
                      No users found.
                    </p>
                  ) : (
                    users
                      .slice(0, 6)
                      .map(
                        function (
                          user,
                          index,
                        ) {
                          return (
                            <button
                              className="recent-row"
                              key={
                                user.id
                              }
                              onClick={function () {
                                open(
                                  'details',
                                  user,
                                );
                              }}
                            >
                              <Avatar
                                user={
                                  user
                                }
                                index={
                                  index
                                }
                              />

                              <span>
                                <strong>
                                  {
                                    user.name
                                  }
                                </strong>

                                <small>
                                  {
                                    user.email
                                  }
                                </small>
                              </span>

                              <span className="row-arrow">
                                ↗
                              </span>
                            </button>
                          );
                        },
                      )
                  )}
                </section>

                {/* AI PREVIEW */}

                <section className="surface assistant-preview">
                  <div className="assistant-orb">
                    ✦
                  </div>

                  <span className="eyebrow">
                    AI ASSISTANT
                  </span>

                  <h2>
                    How can I help
                    you?
                  </h2>

                  <p>
                    Ask questions
                    about your users
                    and get useful
                    insights in
                    seconds.
                  </p>

                  <div className="prompt-list">
                    {[
                      'How many users are there?',
                      'List all email addresses',
                      'Show users with name starting A',
                    ].map(
                      function (
                        prompt,
                      ) {
                        return (
                          <button
                            key={
                              prompt
                            }
                            onClick={function () {
                              go(
                                'assistant',
                              );
                            }}
                          >
                            {prompt}

                            <span>
                              ↗
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>

                  <button
                    className="assistant-cta"
                    onClick={function () {
                      go(
                        'assistant',
                      );
                    }}
                  >
                    Open AI assistant

                    <span>
                      →
                    </span>
                  </button>
                </section>
              </div>
            </>
          )}

          {/* ======================
              USERS
          ====================== */}

          {page === 'users' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    YOUR PEOPLE
                  </span>

                  <h1>
                    Users

                    <span className="heading-count">
                      {total}
                    </span>
                  </h1>

                  <p>
                    Browse, search
                    and manage your
                    team members.
                  </p>
                </div>

                <button
                  className="button primary"
                  onClick={function () {
                    open('add');
                  }}
                >
                  ＋ Add user
                </button>
              </div>

              <section className="surface users-panel">
                {/* SEARCH TOOLBAR */}

                <div className="users-toolbar">
                  <div className="search-field">
                    <span>⌕</span>

                    <input
                      aria-label="Search users"
                      placeholder="Search by name or email..."
                      value={
                        search
                      }
                      onChange={function (
                        event,
                      ) {
                        setSearch(
                          event
                            .target
                            .value,
                        );

                        setPageNumber(
                          1,
                        );
                      }}
                    />

                    {search && (
                      <button
                        onClick={function () {
                          setSearch(
                            '',
                          );

                          setPageNumber(
                            1,
                          );
                        }}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div
                    className="view-switch"
                    aria-label="View mode"
                  >
                    <button
                      className={
                        view ===
                        'table'
                          ? 'on'
                          : ''
                      }
                      onClick={function () {
                        setView(
                          'table',
                        );
                      }}
                      aria-label="Table view"
                    >
                      ☷
                    </button>

                    <button
                      className={
                        view ===
                        'grid'
                          ? 'on'
                          : ''
                      }
                      onClick={function () {
                        setView(
                          'grid',
                        );
                      }}
                      aria-label="Grid view"
                    >
                      ▦
                    </button>
                  </div>
                </div>

                {loading ? (
                  <p className="state">
                    Loading users...
                  </p>
                ) : loadError ? (
                  <ErrorState
                    message={
                      loadError
                    }
                    retry={
                      refresh
                    }
                  />
                ) : filtered.length ===
                  0 ? (
                  <p className="state">
                    No users match
                    your search.
                  </p>
                ) : view ===
                  'table' ? (
                  /* TABLE VIEW */

                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>
                            #
                          </th>

                          <th>
                            Name
                          </th>

                          <th>
                            Email
                          </th>

                          <th>
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {visible.map(
                          function (
                            user,
                            index,
                          ) {
                            const userNumber =
                              (pageNumber -
                                1) *
                                8 +
                              index +
                              1;

                            return (
                              <tr
                                key={
                                  user.id
                                }
                                onClick={function () {
                                  open(
                                    'details',
                                    user,
                                  );
                                }}
                              >
                                <td className="index-cell">
                                  {
                                    userNumber
                                  }
                                </td>

                                <td>
                                  <div className="person">
                                    <Avatar
                                      user={
                                        user
                                      }
                                      index={
                                        userNumber -
                                        1
                                      }
                                    />

                                    <strong>
                                      {
                                        user.name
                                      }
                                    </strong>
                                  </div>
                                </td>

                                <td className="email-cell">
                                  {
                                    user.email
                                  }
                                </td>

                                <td>
                                  <div className="row-actions">
                                    <button
                                      onClick={function (
                                        event,
                                      ) {
                                        event.stopPropagation();

                                        open(
                                          'edit',
                                          user,
                                        );
                                      }}
                                    >
                                      ✎ Edit
                                    </button>

                                    <button
                                      className="more-action"
                                      aria-label={`Details for ${user.name}`}
                                      onClick={function (
                                        event,
                                      ) {
                                        event.stopPropagation();

                                        open(
                                          'details',
                                          user,
                                        );
                                      }}
                                    >
                                      ···
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* GRID VIEW */

                  <div className="user-grid">
                    {visible.map(
                      function (
                        user,
                        index,
                      ) {
                        return (
                          <article
                            className="user-tile"
                            key={
                              user.id
                            }
                          >
                            <div className="tile-top">
                              <Avatar
                                user={
                                  user
                                }
                                index={
                                  index
                                }
                              />
                            </div>

                            <strong>
                              {
                                user.name
                              }
                            </strong>

                            <small>
                              {
                                user.email
                              }
                            </small>

                            <div className="tile-actions">
                              <button
                                onClick={function () {
                                  open(
                                    'details',
                                    user,
                                  );
                                }}
                              >
                                View
                                details
                              </button>

                              <button
                                onClick={function () {
                                  open(
                                    'edit',
                                    user,
                                  );
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                )}

                {/* PAGINATION */}

                <div className="table-footer">
                  <span>
                    Showing{' '}
                    {filtered.length
                      ? (pageNumber -
                          1) *
                          8 +
                        1
                      : 0}
                    –
                    {Math.min(
                      pageNumber *
                        8,
                      filtered.length,
                    )}{' '}
                    of{' '}
                    {
                      filtered.length
                    }{' '}
                    users
                  </span>

                  <div className="pagination">
                    <button
                      disabled={
                        pageNumber ===
                        1
                      }
                      onClick={function () {
                        setPageNumber(
                          pageNumber -
                            1,
                        );
                      }}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>

                    {Array.from(
                      {
                        length:
                          pages,
                      },
                      function (
                        _,
                        index,
                      ) {
                        const number =
                          index +
                          1;

                        return (
                          <button
                            key={
                              number
                            }
                            className={
                              pageNumber ===
                              number
                                ? 'current'
                                : ''
                            }
                            onClick={function () {
                              setPageNumber(
                                number,
                              );
                            }}
                          >
                            {
                              number
                            }
                          </button>
                        );
                      },
                    )}

                    <button
                      disabled={
                        pageNumber ===
                        pages
                      }
                      onClick={function () {
                        setPageNumber(
                          pageNumber +
                            1,
                        );
                      }}
                      aria-label="Next page"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ======================
              ANALYTICS
          ====================== */}

          {page ===
            'analytics' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    THE BIG PICTURE
                  </span>

                  <h1>
                    User analytics
                  </h1>

                  <p>
                    Simple insights
                    from your current
                    user data.
                  </p>
                </div>

                <button
                  className="button secondary"
                  onClick={
                    refresh
                  }
                >
                  ↻ Refresh data
                </button>
              </div>

              <div className="stats-grid">
                {stats.map(
                  function (stat) {
                    return (
                      <article
                        className="stat-card"
                        key={
                          stat.label
                        }
                      >
                        <span
                          className={`stat-icon ${stat.tone}`}
                        >
                          {
                            stat.icon
                          }
                        </span>

                        <span className="stat-label">
                          {
                            stat.label
                          }
                        </span>

                        <strong>
                          {loading
                            ? '—'
                            : stat.value}
                        </strong>

                        <small>
                          {
                            stat.caption
                          }
                        </small>
                      </article>
                    );
                  },
                )}
              </div>

              <div className="analytics-grid">
                {/* EMAIL SUMMARY */}

                <section className="surface analytics-card">
                  <div className="section-heading">
                    <div>
                      <h2>
                        Email
                        overview
                      </h2>

                      <p>
                        Summary of
                        your user
                        accounts
                      </p>
                    </div>
                  </div>

                  <div className="analytics-summary">
                    <div className="summary-number">
                      <span>
                        Total users
                      </span>

                      <strong>
                        {total}
                      </strong>
                    </div>

                    <div className="summary-number">
                      <span>
                        Email
                        domains
                      </span>

                      <strong>
                        {
                          emailDomainCount
                        }
                      </strong>
                    </div>

                    <div className="summary-number">
                      <span>
                        Gmail users
                      </span>

                      <strong>
                        {
                          gmailUsers
                        }
                      </strong>
                    </div>
                  </div>
                </section>

                {/* DOMAINS */}

                <section className="surface analytics-card">
                  <div className="section-heading">
                    <div>
                      <h2>
                        Top email
                        domains
                      </h2>

                      <p>
                        Where your
                        users' emails
                        are hosted
                      </p>
                    </div>
                  </div>

                  {domains.length ? (
                    domains.map(
                      function (
                        entry,
                      ) {
                        const [
                          domain,
                          count,
                        ] = entry;

                        const percentage =
                          total
                            ? (count /
                                total) *
                              100
                            : 0;

                        return (
                          <div
                            className="domain-row"
                            key={
                              domain
                            }
                          >
                            <div>
                              <span>
                                {
                                  domain
                                }
                              </span>

                              <strong>
                                {
                                  count
                                }
                              </strong>
                            </div>

                            <div className="bar">
                              <span
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <p className="state">
                      No email data
                      available.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ======================
              AI ASSISTANT
          ====================== */}

          {page ===
            'assistant' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    YOUR SMART
                    WORKSPACE
                  </span>

                  <h1>
                    AI assistant{' '}
                    <span className="spark">
                      ✦
                    </span>
                  </h1>

                  <p>
                    Ask questions
                    about the users
                    currently loaded
                    in your
                    workspace.
                  </p>
                </div>
              </div>

              <div className="chat-layout">
                <div className="surface chat-main">
                  {isAdmin ? (
                    <UserChat
                      users={
                        users
                      }
                    />
                  ) : (
                    <div className="locked-chat">
                      <div className="assistant-orb">
                        ✦
                      </div>

                      <h2>
                        Meet your AI
                        assistant
                      </h2>

                      <p>
                        Sign in as
                        admin to ask
                        questions
                        about your
                        users.
                      </p>

                      <button
                        className="button primary"
                        onClick={
                          onAdminLogin
                        }
                      >
                        Admin sign in
                        →
                      </button>
                    </div>
                  )}
                </div>

                <aside className="insights-side">
                  <h2>
                    Quick insights
                  </h2>

                  {stats.map(
                    function (stat) {
                      return (
                        <div
                          className="insight-row"
                          key={
                            stat.label
                          }
                        >
                          <span
                            className={`stat-icon ${stat.tone}`}
                          >
                            {
                              stat.icon
                            }
                          </span>

                          <span>
                            {
                              stat.label
                            }

                            <strong>
                              {loading
                                ? '—'
                                : stat.value}
                            </strong>
                          </span>
                        </div>
                      );
                    },
                  )}
                </aside>
              </div>
            </>
          )}

          {/* ======================
              SETTINGS
          ====================== */}

          {page ===
            'settings' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    PERSONALIZE YOUR
                    VIEW
                  </span>

                  <h1>
                    Settings
                  </h1>

                  <p>
                    Choose how your
                    workspace looks
                    and works.
                  </p>
                </div>
              </div>

              <section className="surface settings-panel">
                <h2>
                  Appearance
                </h2>

                <p>
                  Switch between
                  light and dark
                  mode.
                </p>

                <button
                  className="setting-row"
                  onClick={function () {
                    setDark(!dark);
                  }}
                >
                  <span>
                    <strong>
                      Dark mode
                    </strong>

                    <small>
                      Use a darker
                      color palette
                    </small>
                  </span>

                  <span
                    className={`toggle ${
                      dark
                        ? 'enabled'
                        : ''
                    }`}
                  >
                    <i />
                  </span>
                </button>

                <h2>
                  Account
                </h2>

                <button
                  className="setting-row"
                  onClick={
                    isAdmin
                      ? onLogout
                      : onAdminLogin
                  }
                >
                  <span>
                    <strong>
                      {isAdmin
                        ? 'Administrator'
                        : 'Viewer'}
                    </strong>

                    <small>
                      {isAdmin
                        ? 'Sign out of your admin session'
                        : 'Sign in to add, edit and delete users'}
                    </small>
                  </span>

                  <span>→</span>
                </button>
              </section>
            </>
          )}
        </main>
      </div>

      {/* ======================
          DRAWER
      ====================== */}

      {drawer && (
        <div
          className="drawer-overlay"
          onMouseDown={function (
            event,
          ) {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDrawer(null);
            }
          }}
        >
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={
              drawer ===
              'details'
                ? 'User details'
                : drawer ===
                    'edit'
                  ? 'Edit user'
                  : 'Add user'
            }
          >
            <div className="drawer-header">
              <span className="eyebrow">
                {drawer ===
                'details'
                  ? 'USER PROFILE'
                  : drawer ===
                      'edit'
                    ? 'UPDATE PROFILE'
                    : 'NEW TEAM MEMBER'}
              </span>

              <IconButton
                onClick={function () {
                  setDrawer(null);
                }}
                aria-label="Close panel"
              >
                ×
              </IconButton>
            </div>

            {drawer ===
            'details' ? (
              <>
                <div className="details-hero">
                  <Avatar
                    user={target}
                  />

                  <h2>
                    {target?.name}
                  </h2>

                  <p>
                    {target?.email}
                  </p>
                </div>

                <div className="details-fields">
                  <h3>
                    Overview
                  </h3>

                  <div>
                    <span>
                      Full name
                    </span>

                    <strong>
                      {
                        target?.name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Email address
                    </span>

                    <strong>
                      {
                        target?.email
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      User ID
                    </span>

                    <strong>
                      {target?.id}
                    </strong>
                  </div>
                </div>

                <div className="drawer-bottom">
                  <button
                    className="button secondary"
                    onClick={function () {
                      open(
                        'edit',
                        target,
                      );
                    }}
                  >
                    ✎ Edit user
                  </button>

                  <button
                    className="button danger"
                    onClick={function () {
                      if (
                        !isAdmin
                      ) {
                        onAdminLogin();
                        return;
                      }

                      setConfirm(
                        target,
                      );
                    }}
                  >
                    Delete user
                  </button>
                </div>
              </>
            ) : (
              <UserForm
                key={`${drawer}-${target?.id || 'new'}`}
                user={
                  drawer ===
                  'edit'
                    ? target
                    : null
                }
                busy={busy}
                onSave={save}
                onClose={function () {
                  setDrawer(null);
                }}
              />
            )}
          </aside>
        </div>
      )}

      {/* ======================
          DELETE CONFIRMATION
      ====================== */}

      {confirm && (
        <div className="confirm-overlay">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="confirm-card"
          >
            <span className="confirm-icon">
              !
            </span>

            <h2 id="delete-title">
              Delete this user?
            </h2>

            <p>
              This will remove{' '}
              <strong>
                {confirm.name}
              </strong>{' '}
              from your users. This
              action cannot be
              undone.
            </p>

            <div>
              <button
                className="button secondary"
                disabled={busy}
                onClick={function () {
                  setConfirm(
                    null,
                  );
                }}
              >
                Cancel
              </button>

              <button
                className="button danger"
                disabled={busy}
                onClick={remove}
              >
                {busy
                  ? 'Deleting...'
                  : 'Delete user'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}