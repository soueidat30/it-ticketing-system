import { handleUserInactive } from "./inactiveUserHandler";

export const handleInactiveAxiosResponse = async (error) => {
  try {
    const code = error?.response?.data?.code;
    if (code !== "USER_INACTIVE") return false;

    await handleUserInactive(error);
    return true;
  } catch {
    return false;
  }
};

