const API_URL = "/api/users";
async function request(path = "", options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "same-origin",
    ...options
  });
  const text = await response.text();
  let result;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = null;
  }
  if (!response.ok) {
    const error = new Error(typeof result?.error === "string" ? result.error : `Request failed (${response.status}). Please try again.`);
    error.fields = result?.fields || {};
    throw error;
  }
  if (response.status === 204 || options.method === "DELETE") return null;
  if (result === null) throw new Error("The server returned an invalid response.");
  return result;
}
export async function getUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const result = await request(`?page=${page}&limit=200`);
    const pagination = result.pagination;
    if (!Array.isArray(result.data) || Number(pagination?.page) !== page || typeof pagination?.hasNextPage !== "boolean") {
      throw new Error("Invalid users or pagination response from the server.");
    }
    users.push(...result.data);
    if (!pagination.hasNextPage) return users;
    if (!result.data.length) throw new Error("The API returned an unexpected empty page.");
    page += 1;
  }
}
export async function getUser(id) {
  const result = await request(`/${encodeURIComponent(id)}`);
  const user = result.data && !Array.isArray(result.data) ? result.data : result;
  if (user?.id == null) throw new Error("The server returned an invalid user.");
  return user;
}
export function createUser(user) {
  return request("", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  });
}
export function updateUser(id, changes) {
  return request(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(changes)
  });
}
export function deleteUser(id) {
  return request(`/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
