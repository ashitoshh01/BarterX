import axios from "axios";

/**
 * Pre-configured Axios instance for all backend API calls.
 *
 * Base URL is controlled by the REACT_APP_BACKEND_URL environment variable
 * (set in frontend/.env).  Falls back to the same origin so a reverse-proxy
 * setup (e.g. nginx, Docker Compose) works without changes.
 *
 * Usage:
 *   import api from "@/lib/api";
 *   const res = await api.get("/status");
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL
    ? `${process.env.REACT_APP_BACKEND_URL}/api`
    : "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Attach auth token if present (localStorage key: "barter_token")
    const token = localStorage.getItem("barter_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — auto-refresh expired tokens ───────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip interceptor logic for login endpoint so we can handle invalid credentials normally
      if (originalRequest.url && (originalRequest.url.includes("/login") || originalRequest.url.includes("/token"))) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("barter_refresh_token");

      // No refresh token — redirect to login
      if (!refreshToken) {
        localStorage.removeItem("barter_token");
        localStorage.removeItem("barter_refresh_token");
        window.location.href = "/auth";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const backendBase = process.env.REACT_APP_BACKEND_URL || "";
        const res = await fetch(`${backendBase}/api/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        localStorage.setItem("barter_token", data.access);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("barter_token");
        localStorage.removeItem("barter_refresh_token");
        window.location.href = "/auth";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

