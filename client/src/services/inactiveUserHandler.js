import { authLogoutAndClear } from "./logoutUtils";

const INACTIVE_STORAGE_KEY = "__inactive_user_notice";

export const setInactiveUserNotice = (payload) => {
  try {
    localStorage.setItem(INACTIVE_STORAGE_KEY, JSON.stringify({
      message: payload?.message || "Your account is deactivated. Please contact the administrator.",
      ts: Date.now(),
    }));
  } catch {
    // ignore
  }
};

export const getInactiveUserNotice = () => {
  try {
    const raw = localStorage.getItem(INACTIVE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearInactiveUserNotice = () => {
  try {
    localStorage.removeItem(INACTIVE_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const handleUserInactive = async (err) => {
  const code = err?.response?.data?.code;
  const message = err?.response?.data?.message;

  if (code !== "USER_INACTIVE") return false;

  setInactiveUserNotice({ message });
  await authLogoutAndClear();
  return true;
};


