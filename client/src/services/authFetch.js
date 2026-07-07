const getToken = () => localStorage.getItem("token");



const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
});

export const authFetch = async (url, options = {}, { retry = true } = {}) => {
  const token = getToken();

  const mergedOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeaders(token),
    },
  };

  const res = await fetch(url, mergedOptions);

  if (res.status !== 401 || !retry) return res;

  return res;
};



export const authJson = async (url, options = {}, { retry = true } = {}) => {
  const res = await authFetch(url, options, { retry });
  return res.json().catch(() => ({}));
};

