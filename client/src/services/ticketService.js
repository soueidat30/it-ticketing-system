
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
 
export const getStatuses = (token) =>
  fetch(`${BASE}/statuses`, { headers: headers(token) }).then((r) => r.json());


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
 
export const getAllTickets = (token) =>
  fetch(`${BASE}/tickets`, { headers: headers(token) }).then((r) => r.json());
 
export const getTicketById = (token, id) =>
  fetch(`${BASE}/tickets/${id}`, { headers: headers(token) }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw { response: { data: d } };
    return d;
  });
 
export const resolveTicket = (token, ticketId, payload) =>
  fetch(`${BASE}/agent/tickets/${ticketId}/resolve`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw { response: { data: d } };
    return d;
  });

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

export const getUsersByRole = (token, role) =>
  fetch(`${BASE}/users?role=${encodeURIComponent(role)}`, { headers: headers(token) })
    .then(async (r) => {
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        throw {
          status: r.status,
          statusText: r.statusText,
          data,
        };
      }
      return data;
    });

export const getTicketHistory = (token, ticketId) =>
  fetch(`${BASE}/tickets/${ticketId}/history`, {
    headers: headers(token),
  }).then((r) => r.json());
export const getTicketComments = (token, ticketId) =>
  fetch(`${BASE}/tickets/${ticketId}/comments`, {
    headers: headers(token),
  }).then((r) => r.json());
 
export const addTicketComment = (
  token,
  ticketId,
  content,
  isInternal = false,
  notifyUserId = null
) =>
  fetch(`${BASE}/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      content,
      internal: isInternal,
      ...(notifyUserId != null ? { notify_user_id: notifyUserId } : {}),
    }),
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
export const getComments     = getTicketComments;
export const addComment      = addTicketComment;
 
export const getNotifications = (token) =>
  fetch(`${BASE}/notifications`, { headers: headers(token) }).then((r) => r.json());

export const getEmployeeComments = (token) =>
  fetch(`${BASE}/employee/comments`, { headers: headers(token) }).then((r) => r.json());

 
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

export const getTicketAttachments = (ticketId, token) =>
  fetch(`${BASE}/tickets/${ticketId}/attachments`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { attachments: [] };
    return d;
  });
 

export const getActivityLogs = async (token, filters = {}) => {
  const params = new URLSearchParams(filters);

  const fetchLogs = async (authToken) => {
    const response = await fetch(`${BASE}/admin/activity-logs?${params.toString()}`, {
      method: "GET",
      headers: {
        ...headers(authToken),
      },
    });
    return response;
  };

  let response = await fetchLogs(token);

  if (response.status === 401) {
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          ...headers(token),
        },
      });

      const refreshData = await refreshRes.json().catch(() => ({}));
      const newToken = refreshData?.access_token;

      if (refreshRes.ok && newToken) {
        localStorage.setItem("token", newToken);
        response = await fetchLogs(newToken);
      }
    } catch {
      // ignore
    }
  }

  if (!response.ok) {
    try {
      // eslint-disable-next-line no-console
      console.error("getActivityLogs failed", {
        status: response.status,
        statusText: response.statusText,
        body: await response.json(),
      });
      return { error: true, status: response.status };
    } catch {
      // eslint-disable-next-line no-console
      console.error("getActivityLogs failed (no JSON body)", {
        status: response.status,
        statusText: response.statusText,
      });
      return { error: true, status: response.status };
    }

  }

  return response.json();
};


