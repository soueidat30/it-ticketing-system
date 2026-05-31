import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/auth";

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    username,
    password,
  });
  return response.data;
};

export const logout = async (token) => {
  const response = await axios.post(
    `${API_URL}/logout`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const changePassword = async (token, currentPassword, newPassword, confirmPassword) => {
  const response = await axios.post(
    `${API_URL}/change-password`,
    {
      current_password:          currentPassword,
      new_password:              newPassword,
      new_password_confirmation: confirmPassword,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};