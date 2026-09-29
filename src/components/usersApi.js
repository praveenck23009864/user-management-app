
const API_URL = "/api/users";

async function request(
  path = "",
  options = {}
) {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      credentials: "same-origin",
      ...options,
    }
  );

  if (!response.ok) {
    let detail;

    try {
      detail = (
        await response.json()
      ).error;
    } catch {
      // No JSON error body.
    }

    throw new Error(
      detail ||
        `Request failed (${response.status}). Please try again.`
    );
  }

  if (
    response.status === 204 ||
    options.method === "DELETE"
  ) {
    return null;
  }

  return response.json();
}

// GET — Viewer and Admin

export async function getUsers() {
  const result = await request();

  if (!Array.isArray(result.data)) {
    throw new Error(
      "The API returned an unexpected response."
    );
  }

  return result.data;
}

// POST — Admin only

export function createUser(user) {
  return request("", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(user),
  });
}

// PATCH — Admin only

export function updateUser(
  id,
  changes
) {
  return request(
    `/${encodeURIComponent(id)}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(changes),
    }
  );
}

// DELETE — Admin only

export function deleteUser(id) {
  return request(
    `/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}