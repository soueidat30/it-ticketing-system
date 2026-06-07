const BASE = "http://127.0.0.1:8000/api";

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

export const getCategories = (token) =>
  fetch(`${BASE}/categories`, { headers: headers(token) }).then((r) => r.json());

export const getPriorities = (token) =>
  fetch(`${BASE}/priorities`, { headers: headers(token) }).then((r) => r.json());

export const createTicket = (token, body) =>
  fetch(`${BASE}/tickets`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw { response: { data: d } };
    return d;
  });

export const getMyTickets = (token) =>
  fetch(`${BASE}/my-tickets`, { headers: headers(token) }).then((r) => r.json());

export const deleteTicket = (token, id) =>
  fetch(`${BASE}/tickets/${id}`, {
    method: "DELETE",
    headers: headers(token),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw d;
    return d;
  });

