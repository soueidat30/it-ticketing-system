import { authFetch } from "./authFetch";
import { handleUserInactive } from "./inactiveUserHandler";

export const userInactiveAwareFetch = async (url, options = {}, fetchOpts = {}) => {
  try {
    const res = await authFetch(url, options, fetchOpts);


    if (res.status === 403) {
      let data = null;
      try {
        data = await res.clone().json();
      } catch {
        // ignore
      }

      if (data?.code === "USER_INACTIVE") {
        await handleUserInactive({ response: { data } });
      }
    }

    return res;
  } catch (err) {

    await handleUserInactive(err);
    throw err;
  }
};

