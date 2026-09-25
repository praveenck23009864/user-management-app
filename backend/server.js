require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.json({ message: "AI Backend is running" }));

const tools = [{
  type: "function",
  function: {
    name: "get_users",
    description: "Get the users currently loaded in the application to answer questions about their names, emails, and count.",
    parameters: { type: "object", properties: {}, required: [] },
  },
}];

async function callOllama(messages) {
  const response = await fetch("https://ollama.com/api/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL,
      messages,
      tools,
      stream: false,
    }),
  });
  if (!response.ok) {
    console.error("Ollama request failed:", response.status);
    throw new Error(`Ollama Cloud request failed (${response.status})`);
  }
  return response.json();
}

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, users } = req.body || {};
    if (!Array.isArray(messages) || !Array.isArray(users)) {
      return res.status(400).json({ error: "Messages and users must be arrays." });
    }
    if (!process.env.OLLAMA_API_KEY || !process.env.OLLAMA_MODEL) {
      return res.status(500).json({ error: "Ollama Cloud is not configured." });
    }

    const safeUsers = users.map(({ id, name, email }) => ({ id, name, email }));
    const conversation = [
      {
        role: "system",
        content: "You are a user-management assistant. Use get_users for questions about users. Only use the currently loaded users returned by the tool. Do not invent users. Explain when information is unavailable. The list may not represent all users in the remote database.",
      },
      ...messages
        .filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
        .map(({ role, content }) => ({ role, content })),
    ];

    let result = await callOllama(conversation);
    for (let round = 0; round < 3; round++) {
      const calls = result.message?.tool_calls || [];
      if (!calls.length) break;
      conversation.push(result.message);
      for (const call of calls) {
        const name = call.function?.name;
        conversation.push({
          role: "tool",
          tool_name: name || "unknown",
          content: JSON.stringify(name === "get_users"
            ? { users: safeUsers, count: safeUsers.length }
            : { error: "Unknown tool" }),
        });
      }
      result = await callOllama(conversation);
    }
    const reply = result.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({ error: "Ollama did not return a final answer." });
    }
    return res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error.message);
    return res.status(502).json({ error: "Unable to process the chat request." });
  }
});

app.listen(PORT, () => console.log(`AI Backend running at http://localhost:${PORT}`));
