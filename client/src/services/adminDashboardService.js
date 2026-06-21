const BASE = "http://127.0.0.1:8000/api";

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

export const getAdminDashboardStats = (token) =>
  fetch(`${BASE}/admin/dashboard`, { headers: headers(token) }).then((r) => r.json());

