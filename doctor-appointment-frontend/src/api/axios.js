import axios from "axios";

// Create axios instance with base URL from Vite env
// `VITE_API_BASE` is set in your frontend .env file
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000",
  withCredentials: true, // allow sending/receiving cookies (for auth)
  timeout: 15000,        // 15s request timeout
});

// Flags and queue to handle token refresh when multiple requests fail at once
let isRefreshing = false;
let queue = [];

// Response interceptor: catch errors globally
api.interceptors.response.use(
  (res) => res, // if successful, just return response
  async (error) => {
    const original = error.config;

    // Skip retry if:
    // - no server response
    // - status is not 401
    // - this request was already retried
    // - the failing request is the refresh endpoint itself
    if (
      !error.response ||
      error.response.status !== 401 ||
      original?._retry ||
      original?.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // If another refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject, original });
      });
    }

    // Mark this request as retried
    original._retry = true;
    isRefreshing = true;

    try {
      // Attempt to refresh auth cookie
      await api.post("/auth/refresh");

      // Replay queued requests
      queue.forEach(({ resolve, original: req }) => resolve(api(req)));
      queue = [];

      // Retry the original failed request
      return api(original);
    } catch (err) {
      // If refresh failed, reject all queued requests
      queue.forEach(({ reject }) => reject(err));
      queue = [];

      // Force user to login again
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(err);
    } finally {
      // Reset refresh flag
      isRefreshing = false;
    }
  }
);

export default api;
