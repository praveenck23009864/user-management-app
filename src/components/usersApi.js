const API_URL = "https://playground.nileslabs.com/api/v1";
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }

  // DELETE can succeed without returning a response body.
  if (response.status === 204 || options.method === "DELETE") {
    return null;
  }
  return response.json();
}
export async function getUsers() {
  const result = await request("/users");
  if (!Array.isArray(result.data)) {
    throw new Error("The API returned an unexpected response.");
  }
  return result.data;
}
export function createUser(user) {
  return request("/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
}
export function updateUser(id, changes) {
  return request(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(changes),
  });
}
export function deleteUser(id) {
  return request(`/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
