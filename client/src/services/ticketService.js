const BASE = "http://127.0.0.1:8000/api";

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});


// =====================================================
// AUTH / LOOKUPS
// =====================================================

export const getCategories = (t) =>
  fetch(`${BASE}/categories`, { headers: headers(t) })
    .then(r => r.json());

export const getPriorities = (t) =>
  fetch(`${BASE}/priorities`, { headers: headers(t) })
    .then(r => r.json());


// =====================================================
// TICKETS
// =====================================================

export const createTicket = (t, body) =>
  fetch(`${BASE}/tickets`, {
    method: "POST",
    headers: headers(t),
    body: JSON.stringify(body),
  }).then(r => r.json());

export const getMyTickets = (t) =>
  fetch(`${BASE}/my-tickets`, {
    headers: headers(t),
  }).then(r => r.json());

export const getTicketById = (t, id) =>
  fetch(`${BASE}/tickets/${id}`, {
    headers: headers(t),
  }).then(r => r.json());

export const getAllTickets = (token) =>
  fetch(`${BASE}/tickets`, {
    headers: headers(token),
  }).then(r => r.json());

export const deleteTicket = (t, id) =>
  fetch(`${BASE}/tickets/${id}`, {
    method: "DELETE",
    headers: headers(t),
  }).then(r => r.json());


// =====================================================
// ASSIGN + STATUS (MANAGER / AGENT FLOW)
// =====================================================

export const assignTicket = (token, id, agent_id) =>
  fetch(`${BASE}/tickets/${id}/assign`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({ agent_id }),
  }).then(r => r.json());

export const updateTicketStatus = (token, id, status) =>
  fetch(`${BASE}/tickets/${id}/status`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({ status }),
  }).then(r => r.json());


// =====================================================
// COMMENTS (MANAGER / AGENT / EMPLOYEE)
// =====================================================

// get comments of a ticket
export const getTicketComments = (t, id) =>
  fetch(`${BASE}/tickets/${id}`, {
    headers: headers(t),
  })
    .then(r => r.json())
    .then(data => data.comments || []);

// add comment
export const addTicketComment = (t, id, content) =>
  fetch(`${BASE}/tickets/${id}/comments`, {
    method: "POST",
    headers: headers(t),
    body: JSON.stringify({ content }),
  }).then(r => r.json());


// =====================================================
// NOTIFICATIONS (placeholder for now)
// =====================================================

export const getNotifications = async () => {
  return [
    {
      id: 1,
      type: "ticket_created",
      title: "Ticket Created",
      message: "Your ticket was submitted successfully",
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ];
};

export const markNotificationRead = async () => ({ success: true });

export const markAllNotificationsRead = async () => ({ success: true });

export const deleteNotification = async () => ({ success: true });