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

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired / unauthorized — clear local storage
      localStorage.removeItem("barter_token");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;
