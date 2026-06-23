import { authFetch } from "./authFetch";

const BASE = "http://127.0.0.1:8000/api";

export const getRoles = async () => {
  const res = await authFetch(`${BASE}/roles`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const getDepartments = async () => {
  const res = await authFetch(`${BASE}/departments`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const getAdminUsers = async (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.department && filters.department !== "All") params.set("department", filters.department);
  if (filters.status && filters.status !== "All") params.set("status", filters.status);
  if (filters.role && filters.role !== "All") params.set("role", filters.role);
  if (filters.perPage) params.set("per_page", String(filters.perPage));
  if (filters.page) params.set("page", String(filters.page));

  const res = await authFetch(`${BASE}/admin/users?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const createAdminUser = async (token, payload) => {
  const res = await authFetch(`${BASE}/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const updateAdminUser = async (token, userId, payload) => {
  const res = await authFetch(`${BASE}/admin/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};


export const deleteAdminUser = async (token, userId) => {
  const res = await authFetch(`${BASE}/admin/users/${userId}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const bulkDeleteAdminUsers = async (token, userIds) => {
  const res = await authFetch(`${BASE}/admin/users/bulk-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_ids: userIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const bulkDeactivateAdminUsers = async (token, userIds) => {
  const res = await authFetch(`${BASE}/admin/users/bulk-deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_ids: userIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};



