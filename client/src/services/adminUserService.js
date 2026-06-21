const BASE = "http://127.0.0.1:8000/api";

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

export const getRoles = async (token) =>
  fetch(`${BASE}/roles`, { headers: headers(token) }).then((r) => r.json());

export const getDepartments = async (token) =>
  fetch(`${BASE}/departments`, { headers: headers(token) }).then((r) => r.json());

export const getAdminUsers = async (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.department && filters.department !== "All") params.set("department", filters.department);
  if (filters.status && filters.status !== "All") params.set("status", filters.status);
  if (filters.role && filters.role !== "All") params.set("role", filters.role);
  if (filters.perPage) params.set("per_page", String(filters.perPage));
  if (filters.page) params.set("page", String(filters.page));

  const res = await fetch(`${BASE}/admin/users?${params.toString()}`, {
    method: "GET",
    headers: headers(token),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const createAdminUser = async (token, payload) => {
  const res = await fetch(`${BASE}/admin/users`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const updateAdminUser = async (token, userId, payload) => {
  const res = await fetch(`${BASE}/admin/users/${userId}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const deleteAdminUser = async (token, userId) => {
  const res = await fetch(`${BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const bulkDeleteAdminUsers = async (token, userIds) => {
  const res = await fetch(`${BASE}/admin/users/bulk-delete`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ user_ids: userIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const bulkDeactivateAdminUsers = async (token, userIds) => {
  const res = await fetch(`${BASE}/admin/users/bulk-deactivate`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ user_ids: userIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

