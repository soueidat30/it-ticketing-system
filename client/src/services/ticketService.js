import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

// Get categories
export const getCategories = async (token) => {
  const response = await axios.get(`${API_URL}/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return response.data;
};
// Get priorities
export const getPriorities = async (token) => {
  const response = await axios.get(`${API_URL}/priorities`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return response.data;
};

// Create a new ticket
export const createTicket = async (token, ticketData) => {
  const response = await axios.post(`${API_URL}/tickets`, ticketData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

// Get employee's own tickets
export const getMyTickets = async (token) => {
  const response = await axios.get(`${API_URL}/my-tickets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Delete a ticket
export const deleteTicket = async (token, id) => {
  const response = await axios.delete(`${API_URL}/tickets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Update a ticket
export const updateTicket = async (token, id, ticketData) => {
  const response = await axios.put(`${API_URL}/tickets/${id}`, ticketData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  return response.data;
};