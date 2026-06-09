import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const getAgentDashboard = async (token) => {
  const res = await axios.get(`${API_URL}/agent/dashboard/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  return res.data;
};

