import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/auth";

export const authLogoutAndClear = async () => {
  const token = localStorage.getItem("token");

  try {
    if (token) {
      await axios.post(
        `${API_URL}/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  } catch {
    // ignore
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

