import { authFetch } from "./authFetch";

const BASE = "http://127.0.0.1:8000/api";

export const bulkActivateAdminUsers = async (token, userIds) => {
  const res = await authFetch(`${BASE}/admin/users/bulk-activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_ids: userIds }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const parsed = text ? JSON.parse(text) : {};
      throw parsed;
    } catch {
      throw { raw: text };
    }
  }

  return res.json().catch(() => ({}));
};





