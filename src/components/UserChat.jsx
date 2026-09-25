import { useState } from "react";
import "./UserChat.css";
function UserChat({ users }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  function handleInputChange(event) {
    setInput(event.target.value);
  }
  async function handleSend(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question || thinking) return;
    const history = [
      ...messages,
      {
        role: "user",
        content: question,
      },
    ];
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
          users: users.map(function ({ id, name, email }) {
            return {
              id,
              name,
              email,
            };
          }),
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to get an answer. Please try again.");
      }
      const data = await response.json();
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The server returned an invalid answer.");
      }
      setMessages([
        ...history,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
      setInput("");
    } catch (err) {
      setError(err.message);
    } finally {
      setThinking(false);
    }
  }
  return (
    <section className="chat-panel">
      <h2>Ask about your users</h2>
      <p>Answers will use the users currently loaded in this app.</p>

      <div role="log" aria-label="Chat conversation" aria-live="polite">
        {messages.map(function (message, index) {
          return (
            <div key={index}>
              <strong>{message.role === "user" ? "You" : "Assistant"}</strong>
              <p className="chat-message">{message.content}</p>
            </div>
          );
        })}
      </div>

      {thinking && <p role="status">Thinking...</p>}
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSend}>
        <label htmlFor="chat-question">Your question</label>
        <input
          id="chat-question"
          value={input}
          onChange={handleInputChange}
          placeholder="Who has a Gmail address?"
          disabled={thinking}
          required
        />

        <button type="submit" disabled={thinking || !input.trim()}>
          {thinking ? "Thinking..." : "Send"}
        </button>
      </form>
    </section>
  );
}
export default UserChat;
