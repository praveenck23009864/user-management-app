import './UserChat.css';
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export default function UserChat({ users = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");

  const messagesContainerRef = useRef(null);

  // Scroll inside the chat, without moving the entire webpage.
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, thinking]);

  async function handleSend(event) {
    event.preventDefault();

    const question = input.trim();

    if (!question || thinking) 

      
      return;

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",


        },

        body: JSON.stringify({
          messages: history,
          users: users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to get an AI response."
        );
      }

      if (
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error("AI returned an empty response.");
      }

      setMessages([
        ...history,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Try again."
      );
    } finally {
      setThinking(false);
    }
  }

  function clearChat() {
    if (thinking) return;

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
      {/* HEADER */}
      <header className="user-chat-header">
        <div className="chat-brand">
          <div className="chat-logo" aria-hidden="true">
            ✦
          </div>

          <div className="chat-brand-info">
            <h2>AI Assistant</h2>

            <p>
              <span
                className="online-dot"
                aria-hidden="true"
              />
              Powered by Ollama Cloud
            </p>
          </div>
        </div>

        <button
          type="button"
          className="clear-chat"
          onClick={clearChat}
          disabled={thinking || messages.length === 0}
        >
          Clear chat
        </button>
      </header>

      {/* CONVERSATION */}
      <div
        className="user-chat-messages"
        ref={messagesContainerRef}
        role="log"
        aria-label="AI chat conversation"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div
              className="welcome-icon"
              aria-hidden="true"
            >
              ✦
            </div>

            <h3>How can I help you?</h3>

            <p>
              Ask questions about the users currently
              loaded in your application.
            </p>

            <div className="chat-suggestions">
              <button
                type="button"
                onClick={() =>
                  setInput("How many users are there?")
                }
              >
                How many users are there?
              </button>

              <button
                type="button"
                onClick={() =>
                  setInput("Who has a Gmail address?")
                }
              >
                Who has a Gmail address?
              </button>

              <button
                type="button"
                onClick={() =>
                  setInput(
                    "List everyone whose name starts with A."
                  )
                }
              >
                List names starting with A
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
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
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <span>{message.content}</span>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="message-row message-ai">
            <span className="message-author">
              AI Assistant
            </span>

            <div
              className="message-bubble thinking"
              role="status"
              aria-label="AI is thinking"
            >
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="chat-error" role="alert">
          <strong>Couldn't get an answer.</strong>
          <span>{error}</span>
        </div>
      )}

      {/* INPUT */}
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
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleInputKeyDown}
            placeholder="Ask anything about your users..."
            disabled={thinking}
            rows={3}
          />

          <div className="chat-input-footer">
            <span>
              Enter to send · Shift + Enter for new line
            </span>

            <button
              type="submit"
              className="chat-send-button"
              disabled={thinking || !input.trim()}
            >
              {thinking ? "Thinking..." : "Send ↑"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}