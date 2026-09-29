
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} = require("node:crypto");

const app = express();

const PORT = process.env.PORT || 5000;

const UPSTREAM =
  "https://playground.nileslabs.com/api/v1";

const COOKIE = "raka_admin";

const SESSION_MS =
  8 * 60 * 60 * 1000;

// Development-only session storage.
const sessions = new Map();

// Login attempt tracking.
const attempts = new Map();

// Shared Playground sandbox cookies.
let upstreamCookies = "";

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.APP_ORIGIN,
    ].filter(Boolean),

    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

// ----------------------------------
// COOKIE HELPERS
// ----------------------------------

function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((part) => {
        const index =
          part.indexOf("=");

        return index < 0
          ? ["", ""]
          : [
              part.slice(
                0,
                index
              ).trim(),

              part.slice(
                index + 1
              ).trim(),
            ];
      })
  );
}

// ----------------------------------
// CHECK ADMIN SESSION
// ----------------------------------

function session(req) {
  const token =
    cookies(req)[COOKIE];

  const record =
    token && sessions.get(token);

  if (
    !record ||
    record.expires < Date.now()
  ) {
    if (token) {
      sessions.delete(token);
    }

    return null;
  }

  return record;
}

function requireAdmin(
  req,
  res,
  next
) {
  if (!session(req)) {
    return res.status(403).json({
      error:
        "Admin sign in required.",
    });
  }

  next();
}

// ----------------------------------
// CHECK REQUEST ORIGIN
// ----------------------------------

function sameOrigin(
  req,
  res,
  next
) {
  const origin =
    req.get("origin");

  const accepted = new Set(
    [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.APP_ORIGIN,
    ].filter(Boolean)
  );

  if (
    origin &&
    !accepted.has(origin)
  ) {
    return res.status(403).json({
      error: "Origin not allowed.",
    });
  }

  next();
}

// ----------------------------------
// VERIFY ADMIN PASSWORD
// ----------------------------------

function verifyPassword(
  password,
  stored
) {
  try {
    const [salt, hash] =
      stored.split(":");

    if (
      !salt ||
      !/^[a-f0-9]{64}$/.test(hash)
    ) {
      return false;
    }

    const derived = scryptSync(
      password,
      salt,
      32
    );

    return timingSafeEqual(
      derived,
      Buffer.from(hash, "hex")
    );
  } catch {
    return false;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,

    sameSite: "lax",

    secure:
      process.env.NODE_ENV ===
      "production",

    path: "/",

    maxAge: SESSION_MS,
  };
}

// ----------------------------------
// TEST ROUTE
// ----------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    message:
      "RAKA backend running",
  });
});

// ----------------------------------
// CHECK CURRENT ADMIN
// ----------------------------------

app.get(
  "/api/auth/me",

  (req, res) => {
    res.json({
      isAdmin: Boolean(
        session(req)
      ),
    });
  }
);

// ----------------------------------
// ADMIN LOGIN
// ----------------------------------

app.post(
  "/api/auth/login",

  sameOrigin,

  (req, res) => {
    const email = String(
      req.body?.email || ""
    )
      .trim()
      .toLowerCase();

    const password =
      req.body?.password;

    const key =
      req.ip || "unknown";

    const now = Date.now();

    const record =
      attempts.get(key);

    if (
      record &&
      record.until > now
    ) {
      return res.status(429).json({
        error:
          "Too many attempts. Try again later.",
      });
    }

    const configured =
      Boolean(
        process.env.ADMIN_EMAIL &&
        process.env.ADMIN_PASSWORD_HASH
      );

    const correct =
      configured &&
      typeof password === "string" &&
      email ===
        process.env.ADMIN_EMAIL.toLowerCase() &&
      verifyPassword(
        password,
        process.env.ADMIN_PASSWORD_HASH
      );

    if (!correct) {
      const count =
        (record?.reset > now
          ? record.count
          : 0) + 1;

      attempts.set(key, {
        count,

        reset:
          count === 1
            ? now + 15 * 60_000
            : record.reset,

        until:
          count >= 5
            ? now + 15 * 60_000
            : 0,
      });

      return res
        .status(401)
        .json({
          error: configured
            ? "Invalid email or password."
            : "Admin account is not configured.",
        });
    }

    attempts.delete(key);

    const token = randomBytes(
      32
    ).toString("hex");

    sessions.set(token, {
      expires:
        now + SESSION_MS,
    });

    res.cookie(
      COOKIE,
      token,
      cookieOptions()
    );

    return res.json({
      isAdmin: true,
    });
  }
);

// ----------------------------------
// ADMIN LOGOUT
// ----------------------------------

app.post(
  "/api/auth/logout",

  sameOrigin,

  (req, res) => {
    const token =
      cookies(req)[COOKIE];

    if (token) {
      sessions.delete(token);
    }

    res.clearCookie(
      COOKIE,
      {
        path: "/",

        httpOnly: true,

        sameSite: "lax",

        secure:
          process.env.NODE_ENV ===
          "production",
      }
    );

    res.json({
      isAdmin: false,
    });
  }
);

// ----------------------------------
// PLAYGROUND API PROXY
// ----------------------------------

async function playground(
  req,
  res
) {
  try {
    const suffix =
      req.params.id
        ? `/${encodeURIComponent(
            req.params.id
          )}`
        : "";

    const headers = {
      Accept:
        "application/json",
    };

    if (upstreamCookies) {
      headers.Cookie =
        upstreamCookies;
    }

    if (
      req.method !== "GET"
    ) {
      headers[
        "Content-Type"
      ] = "application/json";
    }

    const upstream =
      await fetch(
        `${UPSTREAM}/users${suffix}`,
        {
          method: req.method,

          headers,

          body:
            req.method === "GET" ||
            req.method === "DELETE"
              ? undefined
              : JSON.stringify(
                  req.body
                ),
        }
      );

    const setCookies =
      typeof upstream.headers
        .getSetCookie ===
      "function"
        ? upstream.headers.getSetCookie()
        : [];

    if (setCookies.length) {
      const jar = new Map(
        upstreamCookies
          .split("; ")
          .filter(Boolean)
          .map((part) => [
            part.split("=")[0],
            part,
          ])
      );

      for (
        const line of setCookies
      ) {
        const pair =
          line.split(";")[0];

        jar.set(
          pair.split("=")[0],
          pair
        );
      }

      upstreamCookies =
        [...jar.values()].join(
          "; "
        );
    }

    const body =
      await upstream.text();

    if (!upstream.ok) {
      console.error(
        "Playground request failed:",
        upstream.status
      );
    }

    return res
      .status(
        upstream.status
      )
      .type(
        upstream.headers.get(
          "content-type"
        ) ||
          "application/json"
      )
      .send(
        body || undefined
      );
  } catch (err) {
    console.error(
      "Playground proxy error:",
      err.message
    );

    return res
      .status(502)
      .json({
        error:
          "Unable to reach users API.",
      });
  }
}

// Public GET
app.get(
  "/api/users",
  playground
);

// Admin-only mutations
app.post(
  "/api/users",
  sameOrigin,
  requireAdmin,
  playground
);

app.patch(
  "/api/users/:id",
  sameOrigin,
  requireAdmin,
  playground
);

app.delete(
  "/api/users/:id",
  sameOrigin,
  requireAdmin,
  playground
);

// ----------------------------------
// OLLAMA TOOL DEFINITION
// ----------------------------------

const tools = [
  {
    type: "function",

    function: {
      name: "get_users",

      description:
        "Get currently loaded users, names, emails and count.",

      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// ----------------------------------
// CALL OLLAMA
// ----------------------------------

async function callOllama(
  messages
) {
  const response = await fetch(
    "https://ollama.com/api/chat",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${process.env.OLLAMA_API_KEY}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        model:
          process.env.OLLAMA_MODEL,

        messages,

        tools,

        stream: false,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Ollama Cloud error ${response.status}`
    );
  }

  return response.json();
}

// ----------------------------------
// ADMIN-ONLY AI CHAT
// ----------------------------------

app.post(
  "/api/chat",

  sameOrigin,

  requireAdmin,

  async (req, res) => {
    try {
      const {
        messages,
        users,
      } = req.body || {};

      if (
        !Array.isArray(messages) ||
        !Array.isArray(users)
      ) {
        return res
          .status(400)
          .json({
            error:
              "Messages and users must be arrays.",
          });
      }

      if (
        !process.env.OLLAMA_API_KEY ||
        !process.env.OLLAMA_MODEL
      ) {
        return res
          .status(500)
          .json({
            error:
              "Ollama Cloud is not configured.",
          });
      }

      const safeUsers =
        users.map(
          ({
            id,
            name,
            email,
          }) => ({
            id,
            name,
            email,
          })
        );

      const conversation = [
        {
          role: "system",

          content:
            "You are a user management assistant. Use get_users to answer user questions. Only use the loaded user snapshot from the tool. Do not invent users.",
        },

        ...messages
          .filter(
            (message) =>
              message &&
              [
                "user",
                "assistant",
              ].includes(
                message.role
              ) &&
              typeof message.content ===
                "string"
          )
          .map(
            ({
              role,
              content,
            }) => ({
              role,
              content,
            })
          ),
      ];

      let result =
        await callOllama(
          conversation
        );

      // Handle model-requested tool calls.
      for (
        let round = 0;
        round < 3;
        round++
      ) {
        const calls =
          result.message
            ?.tool_calls || [];

        if (!calls.length) {
          break;
        }

        conversation.push(
          result.message
        );

        for (
          const call of calls
        ) {
          const name =
            call.function
              ?.name;

          conversation.push({
            role: "tool",

            tool_name:
              name || "unknown",

            content:
              JSON.stringify(
                name ===
                  "get_users"
                  ? {
                      users:
                        safeUsers,

                      count:
                        safeUsers.length,
                    }
                  : {
                      error:
                        "Unknown tool",
                    }
              ),
          });
        }

        result =
          await callOllama(
            conversation
          );
      }

      const reply =
        result.message
          ?.content;

      if (
        typeof reply !==
          "string" ||
        !reply.trim()
      ) {
        return res
          .status(502)
          .json({
            error:
              "Ollama returned no final answer.",
          });
      }

      return res.json({
        reply,
      });
    } catch (err) {
      console.error(
        "Chat error:",
        err.message
      );

      return res
        .status(502)
        .json({
          error:
            "Unable to process chat request.",
        });
    }
  }
);

// ----------------------------------
// START SERVER
// ----------------------------------
const frontendDirectory = require("node:path").join(
  __dirname,
  "../dist"
);

app.use(express.static(frontendDirectory));

app.listen(PORT, () => {
  console.log(
    `RAKA Backend running at http://localhost:${PORT}`
  );
});