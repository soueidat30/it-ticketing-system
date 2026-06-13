
const BASE = "http://127.0.0.1:8000/api";
 
const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});
 
// ── Categories & Priorities ───────────────────────────────────────────────────
export const getCategories = (token) =>
  fetch(`${BASE}/categories`, { headers: headers(token) }).then((r) => r.json());
 
export const getPriorities = (token) =>
  fetch(`${BASE}/priorities`, { headers: headers(token) }).then((r) => r.json());
 
export const getStatuses = (token) =>
  fetch(`${BASE}/statuses`, { headers: headers(token) }).then((r) => r.json());
 
// ── Tickets ───────────────────────────────────────────────────────────────────
 
// Employee: create ticket
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
 
// Employee: get own tickets
export const getMyTickets = (token) =>
  fetch(`${BASE}/my-tickets`, { headers: headers(token) }).then((r) => r.json());
 
// Employee: delete ticket
export const deleteTicket = (token, id) =>
  fetch(`${BASE}/tickets/${id}`, {
    method: "DELETE",
    headers: headers(token),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw d;
    return d;
  });
 
// Manager/Admin: get ALL tickets
export const getAllTickets = (token) =>
  fetch(`${BASE}/tickets`, { headers: headers(token) }).then((r) => r.json());
 
// Any role: get single ticket by ID
export const getTicketById = (token, id) =>
  fetch(`${BASE}/tickets/${id}`, { headers: headers(token) }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw { response: { data: d } };
    return d;
  });
 
// ── Ticket Status Update (Agent/Admin/Manager) ────────────────────────────────
export const updateTicketStatus = (token, ticketId, statusId, note = "") =>
  fetch(`${BASE}/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ status_id: statusId, note }),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw { response: { data: d } };
    return d;
  });
 
// ── Ticket Assignment (Admin/Manager) ─────────────────────────────────────────
export const assignTicket = (token, ticketId, agentId, note = "") =>
  fetch(`${BASE}/tickets/${ticketId}/assign`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ agent_id: agentId, note }),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw { response: { data: d } };
    return d;
  });
 
// ── Ticket History / Timeline ─────────────────────────────────────────────────
export const getTicketHistory = (token, ticketId) =>
  fetch(`${BASE}/tickets/${ticketId}/history`, {
    headers: headers(token),
  }).then((r) => r.json());
 
// ── Comments ──────────────────────────────────────────────────────────────────
 
// Aliases used in TeamTicketDetail (matches what your component imports)
export const getTicketComments = (token, ticketId) =>
  fetch(`${BASE}/tickets/${ticketId}/comments`, {
    headers: headers(token),
  }).then((r) => r.json());
 
export const addTicketComment = (token, ticketId, content, isInternal = false) =>
  fetch(`${BASE}/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ content, internal: isInternal }),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw { response: { data: d } };
    return d;
  });

export const deleteTicketComment = (token, ticketId, commentId) =>
  fetch(`${BASE}/tickets/${ticketId}/comments/${commentId}`, {
    method: "DELETE",
    headers: headers(token),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw { response: { data: d } };
    return d;
  });

 
// Generic aliases (used in Notifications page)
export const getComments     = getTicketComments;
export const addComment      = addTicketComment;
 
// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (token) =>
  fetch(`${BASE}/notifications`, { headers: headers(token) }).then((r) => r.json());
 
export const getUnreadCount = (token) =>
  fetch(`${BASE}/notifications/unread-count`, {
    headers: headers(token),
  }).then((r) => r.json());
 
export const markNotificationRead = (token, id) =>
  fetch(`${BASE}/notifications/${id}/read`, {
    method: "PATCH",
    headers: headers(token),
  }).then((r) => r.json());
 
export const markAllNotificationsRead = (token) =>
  fetch(`${BASE}/notifications/read-all`, {
    method: "PATCH",
    headers: headers(token),
  }).then((r) => r.json());
 
export const deleteNotification = (token, id) =>
  fetch(`${BASE}/notifications/${id}`, {
    method: "DELETE",
    headers: headers(token),
  }).then((r) => r.json());