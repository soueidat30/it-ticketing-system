import { authFetch } from "./authFetch";

const BASE = "http://127.0.0.1:8000/api";

export const getAdminDashboardStats = async () => {
  return authFetch(`${BASE}/admin/dashboard`, {
    headers: {
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());
};



