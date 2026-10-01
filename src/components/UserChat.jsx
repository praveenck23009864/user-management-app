import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./UserChat.css";


const actionLabels = {
  create: "Add user",
  update: "Edit user",
  delete: "Delete user",
};

const previewFields = [
  ["username", "Username"],
  ["name", "Name"],
  ["email", "Email"],
  ["address", "Address"],
  ["phone", "Phone"],
];

function displayValue(user, key) {
  if (!user) return "—";

  if (key === "address") {
    return (
      [
        user.address?.street,
        user.address?.city,
        user.address?.zipcode,
      ]
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  return String(user[key] || "—");
}

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid server response. Refresh users before repeating a change."
    );
  }

  if (!response.ok) {
    const details = Object.values(data.fields || {})
      .filter(Boolean)
      .join(" ");

    throw new Error(
      [
        data.error || `Request failed (${response.status}).`,
        details,
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  return data;
}
function UserChart({ chart }) {
  const colors = [
    "#14b8a6",
    "#6366f1",
    "#f59e0b",
    "#ec4899",
    "#0ea5e9",
    "#8b5cf6",
  ];

  const items = chart.items || [];

  if (!items.length || !chart.total) {
    return (
      <div className="ai-data-chart">
        <h4>{chart.title}</h4>
        <p>No user data available.</p>
      </div>
    );
  }

  let position = 0;

  const gradient = items.map(function (item, index) {
    const start = position;

    position += (item.value / chart.total) * 100;

    return (
      `${colors[index % colors.length]} ` +
      `${start}% ${position}%`
    );
  }).join(", ");

  return (
    <section
      className="ai-data-chart"
      aria-label={chart.title}
    >
      <h4>{chart.title}</h4>

      <p className="ai-chart-note">
        {chart.total} users · {chart.note}
      </p>

      {chart.type === "donut" ? (
        <div
          className="ai-donut"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
          role="img"
          aria-label={`${chart.title}. Exact values are listed below.`}
        >
          <div className="ai-donut-center">
            <strong>{chart.total}</strong>
            <span>users</span>
          </div>
        </div>
      ) : null}

      <ul className="ai-chart-items">
        {items.map(function (item, index) {
          const percentage =
            (item.value / chart.total) * 100;

          const color = colors[index % colors.length];

          return (
            <li key={`${item.label}-${index}`}>
              <div className="ai-chart-label">
                <span>
                  <i
                    className="ai-chart-dot"
                    style={{ background: color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>

                <strong>
                  {item.value} ({percentage.toFixed(1)}%)
                </strong>
              </div>

              {chart.type === "bar" && (
                <div className="ai-chart-track" aria-hidden="true">
                  <div
                    className="ai-chart-fill"
                    style={{
                      width: `${percentage}%`,
                      background: color,
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
export default function UserChat({ onUsersChanged }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");

  const lock = useRef(false);
  const messagesContainerRef = useRef(null);

  const pending = messages.some(function (message) {
    return message.action?.status === "pending";
  });

  const busy = thinking || actionBusy;

  useEffect(
    function () {
      const container = messagesContainerRef.current;

      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    [messages, thinking]
  );

  async function handleSend(event) {
    event.preventDefault();

    const question = input.trim();

    if (!question || lock.current || pending) return;

    lock.current = true;

    const history = [
      ...messages,
      {
        role: "user",
        content: question,
      },
    ];

    setMessages(history);
    setInput("");
    setThinking(true);
    setError("");

    try {
      const data = await postJSON("/api/chat", {
        messages: history.slice(-40).map(function (message) {
          return {
            role: message.role,
            content: message.content,
          };
        }),
      });

      if (
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error("The AI returned no answer.");
      }

      setMessages(function (current) {
        return [
          ...current,
{
  role: "assistant",
  content: data.reply,

  chart: data.chart || null,

  action: data.action
    ? { ...data.action, status: "pending" }
    : null,
}
        ];
      });
    } catch (err) {
      setError(
        err.message || "Unable to reach the assistant."
      );
    } finally {
      lock.current = false;
      setThinking(false);
    }
  }

  async function decide(action, decision) {
    if (
      lock.current ||
      action.status !== "pending"
    ) {
      return;
    }

    lock.current = true;
    setActionBusy(true);
    setError("");

    try {
      const data = await postJSON(
        `/api/chat/actions/${encodeURIComponent(action.id)}`,
        { decision }
      );

      setMessages(function (current) {
        return current.map(function (message) {
          if (message.action?.id !== action.id) {
            return message;
          }

          const username =
            action.after?.username ||
            action.before?.username ||
            action.userId;

          return {
            ...message,
            content:
              `${data.reply} ` +
              `${actionLabels[action.operation]}: ${username}.`,
            action: {
              ...message.action,
              status: data.status,
            },
          };
        });
      });

      if (data.status === "done" && onUsersChanged) {
        try {
          await onUsersChanged();
        } catch {
          setError(
            "The change was saved, but the list could not refresh. Refresh the page."
          );
        }
      }
    } catch (err) {
      setError(
        err.message ||
        "Unable to finish this action. Check the users list."
      );

      setMessages(function (current) {
        return current.map(function (message) {
          if (message.action?.id !== action.id) {
            return message;
          }

          return {
            ...message,
            content:
              "The action could not be confirmed. Check the current users before requesting it again.",
            action: {
              ...message.action,
              status: "failed",
            },
          };
        });
      });

      if (decision === "confirm" && onUsersChanged) {
        try {
          await onUsersChanged();
        } catch {
          // The parent component displays refresh errors.
        }
      }
    } finally {
      lock.current = false;
      setActionBusy(false);
    }
  }

  function clearChat() {
    if (busy || pending) return;

    setMessages([]);
    setInput("");
    setError("");
  }

  function handleInputKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="user-chat">
      <header className="user-chat-header">
        <div className="chat-brand">
          <div className="chat-logo" aria-hidden="true">
            ✦
          </div>

          <div className="chat-brand-info">
            <h2>AI Assistant</h2>
            <p>Ask questions, add, edit or delete users</p>
          </div>
        </div>

        <button
          type="button"
          className="clear-chat"
          onClick={clearChat}
          disabled={busy || pending || !messages.length}
        >
          Clear chat
        </button>
      </header>

      <div
        className="user-chat-messages"
        ref={messagesContainerRef}
        role="log"
        aria-label="AI chat conversation"
        aria-live="polite"
      >
        {!messages.length && (
          <div className="chat-welcome">
            <div className="welcome-icon" aria-hidden="true">
              ✦
            </div>

            <h3>Manage users through chat</h3>

            <p>
              Describe one change at a time.
              Review and confirm before it is saved.
            </p>

            <div className="chat-suggestions">
              {[
                "How many users are there?",
                "Help me add a user",
                "Help me edit a user",
                "Help me delete a user",
              ].map(function (text) {
                return (
                  <button
                    key={text}
                    type="button"
                    onClick={function () {
                      setInput(text);
                    }}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map(function (message, index) {
          const action = message.action;

          return (
            <div
              key={index}
              className={`message-row ${message.role === "user"
                  ? "message-user"
                  : "message-ai"
                }`}
            >
              <span className="message-author">
                {message.role === "user"
                  ? "You"
                  : "AI Assistant"}
              </span>

              <div className="message-bubble">
                {message.role === "assistant" ? (
                  <div className="chat-markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: function ({ children }) {
                          return (
                            <div
                              className="chat-table-scroll"
                              role="region"
                              aria-label="User data comparison"
                              tabIndex={0}
                            >
                              <table>{children}</table>
                            </div>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span>{message.content}</span>
                )}
                {message.chart && (
                  <UserChart chart={message.chart} />
                )}

                {action && (
                  <section
                    className="chat-action-card"
                    aria-label={`${actionLabels[action.operation]
                      } preview`}
                  >
                    <h4>
                      {actionLabels[action.operation]}
                    </h4>

                    {action.userId != null && (
                      <p className="chat-action-id">
                        User ID: {action.userId}
                      </p>
                    )}

                    <div className="chat-action-table-scroll">
                      <table className="chat-action-table">
                        <thead>
                          <tr>
                            <th>Field</th>

                            {action.before && <th>Current</th>}

                            {action.after && (
                              <th>
                                {action.before
                                  ? "After saving"
                                  : "New user"}
                              </th>
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {previewFields.map(function ([key, label]) {
                            const changed =
                              action.before &&
                              action.after &&
                              displayValue(action.before, key) !==
                              displayValue(action.after, key);

                            return (
                              <tr
                                key={key}
                                className={changed ? "changed" : ""}
                              >
                                <th scope="row">{label}</th>

                                {action.before && (
                                  <td>
                                    {displayValue(action.before, key)}
                                  </td>
                                )}

                                {action.after && (
                                  <td>
                                    {displayValue(action.after, key)}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {action.status === "pending" ? (
                      <>
                        <p>
                          {action.operation === "delete"
                            ? "Confirm to delete this user. This cannot be undone."
                            : "Check the details before saving."}
                        </p>

                        <div className="chat-action-buttons">
                          <button
                            type="button"
                            onClick={function () {
                              decide(action, "cancel");
                            }}
                            disabled={busy}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className={
                              action.operation === "delete"
                                ? "chat-confirm-delete"
                                : "chat-confirm-save"
                            }
                            onClick={function () {
                              decide(action, "confirm");
                            }}
                            disabled={busy}
                          >
                            {actionBusy
                              ? "Please wait..."
                              : `Confirm ${action.operation === "create"
                                ? "add"
                                : action.operation === "update"
                                  ? "edit"
                                  : "delete"
                              }`}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p
                        className="chat-action-status"
                        role="status"
                      >
                        {action.status === "done"
                          ? "Completed"
                          : action.status === "cancelled"
                            ? "Cancelled"
                            : "Check the users list before trying again."}
                      </p>
                    )}
                  </section>
                )}
              </div>
            </div>
          );
        })}

        {thinking && (
          <div className="message-row message-ai">
            <div className="message-bubble" role="status">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="chat-error" role="alert">
          <strong>Request could not be completed.</strong>
          <span>{error}</span>
        </div>
      )}

      {pending && (
        <p className="chat-pending-hint">
          Confirm or cancel the preview to continue chatting.
        </p>
      )}

      <form
        className="user-chat-form"
        onSubmit={handleSend}
      >
        <label
          className="chat-input-label"
          htmlFor="user-chat-input"
        >
          Your message
        </label>

        <div className="chat-composer">
          <textarea
            id="user-chat-input"
            value={input}
            onChange={function (event) {
              setInput(event.target.value);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Example: Add username ravi01, name Ravi Kumar, email ravi@example.com"
            disabled={busy || pending}
            maxLength={12000}
            rows={3}
          />

          <div className="chat-input-footer">
            <span>
              Enter to send · Shift + Enter for new line
            </span>

            <button
              type="submit"
              className="chat-send-button"
              disabled={busy || pending || !input.trim()}
            >
              {thinking ? "Thinking..." : "Send ↑"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}