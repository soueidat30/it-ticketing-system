import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const getAgentTicket = async (token, ticketId) => {
  const res = await axios.get(`${API_URL}/agent/tickets/${ticketId}`, {
    headers: {
      ...authHeaders(token),
    },
  });
  return res.data;
};

export const resolveAgentTicket = async (token, ticketId, payload) => {
  const res = await axios.post(`${API_URL}/agent/tickets/${ticketId}/resolve`, payload, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return res.data;
};

