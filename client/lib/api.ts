import axios from "axios";

const getBaseApiUrl = (): string => {
  if (typeof window !== "undefined") {
    // If accessed via ngrok or remote domain, use relative /api/v1 (proxied by Next.js rewrites)
    // to completely prevent Mixed Content (HTTPS -> HTTP) and CORS errors
    if (
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      return "/api/v1";
    }
    return process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  }
  return process.env.INTERNAL_API_URL || "http://server:3900/api/v1";
};

const API_URL = getBaseApiUrl();

export const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const localVal = localStorage.getItem(name);
    if (localVal) return localVal;
  } catch (e) {}

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let c of ca) {
    while (c.startsWith(" ")) c = c.substring(1, c.length);
    if (c.startsWith(nameEQ)) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const setCookie = (name: string, value: string, days?: number) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(name, value || "");
  } catch (e) {}

  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie =
    name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

export const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(name);
  } catch (e) {}
  document.cookie =
    name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
};

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getCookie("accessToken");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers["ngrok-skip-browser-warning"] = "true";
    }
    return config;
  },
  (error) => {
    throw error;
  },
);

let isRefreshing = false;
let failedRequestsQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedRequestsQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedRequestsQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            throw err;
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentToken = getCookie("accessToken");
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken: currentToken },
          {
            withCredentials: true,
            headers: currentToken
              ? { Authorization: `Bearer ${currentToken}` }
              : {},
          },
        );
        const accessToken =
          refreshResponse.data?.accessToken ||
          refreshResponse.data?.data?.accessToken;

        setCookie("accessToken", accessToken, 1); // save for 1 day
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear auth cookies & redirect to login on browser client side
        deleteCookie("accessToken");
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
        throw refreshError;
      }
    }

    throw error;
  },
);
