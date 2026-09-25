require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(
  express.json({
    limit: "1mb",
  }),
);
app.get("/", function (req, res) {
  res.json({
    message: "AI Backend is running",
  });
});
app.post("/api/chat", async function (req, res) {
  try {
    const { messages, users } = req.body;
    if (!Array.isArray(messages) || !Array.isArray(users)) {
      return res.status(400).json({
        error: "Messages and users must be arrays.",
      });
    }
    if (!process.env.OLLAMA_API_KEY) {
      return res.status(500).json({
        error: "Ollama API key is not configured.",
      });
    }
    const safeUsers = users.map(function (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    });
    const chatMessages = [
      {
        role: "system",
        content: `
You are a helpful user management assistant.

Answer questions using ONLY the supplied user data.

Current users:
${JSON.stringify(safeUsers)}

Rules:
- Answer questions about the supplied users.
- Count users accurately.
- Find users by name or email.
- If information is unavailable, say so.
- Do not invent users.
`,
      },
      ...messages
        .filter(function (message) {
          return (
            ["user", "assistant"].includes(message.role) &&
            typeof message.content === "string"
          );
        })
        .map(function ({ role, content }) {
          return {
            role,
            content,
          };
        }),
    ];
    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        messages: chatMessages,
        stream: false,
      }),
    });
    if (!response.ok) {
      console.error("Ollama request failed:", response.status);
      return res.status(502).json({
        error: "Ollama Cloud request failed.",
      });
    }
    const result = await response.json();
    const reply = result.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({
        error: "Ollama returned an empty answer.",
      });
    }
    res.json({
      reply,
    });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({
      error: "Unable to process the chat request.",
    });
  }
});
app.listen(PORT, function () {
  console.log(`AI Backend running at http://localhost:${PORT}`);
});
