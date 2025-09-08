// src/api/axios.js
import axios from "axios";

// Normalize base URL so δεν καταλήγει σε "/"
function normalizeBase(url) {
  const u = (url || "http://localhost:5000").trim();
  return u.replace(/\/+$/, "");
}

const baseURL = normalizeBase(import.meta.env.VITE_API_BASE);

// Δημιουργία axios instance
const api = axios.create({
  baseURL,
  withCredentials: true, // cookies για auth
  timeout: 15000,
  headers: { "Content-Type": "application/json" }
});

// ----------------------------------------------------
// Global 401 handling με refresh-cookie queue
// ----------------------------------------------------
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;

    // Αν δεν υπάρχει response ή δεν είναι 401 ή έχει ήδη γίνει retry ή είναι το ίδιο το refresh
    if (
      !error?.response ||
      error.response.status !== 401 ||
      original?._retry ||
      (original?.url && original.url.includes("/auth/refresh"))
    ) {
      return Promise.reject(error);
    }

    // Αν υπάρχει άλλο refresh σε εξέλιξη, βάλε την κλήση σε queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject, original });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Προσπάθεια ανανέωσης session cookie
      await api.post("/auth/refresh");

      // Επανεκτέλεση κλήσεων στην ουρά
      queue.forEach(({ resolve, original: req }) => resolve(api(req)));
      queue = [];

      // Retry της αρχικής κλήσης
      return api(original);
    } catch (err) {
      // Αποτυχία refresh: απόρριψη όλων
      queue.forEach(({ reject }) => reject(err));
      queue = [];

      // Redirect σε login αν δεν είμαστε ήδη εκεί
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
