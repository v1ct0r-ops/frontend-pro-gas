import axios from "axios";

/**
 * Axios instance configured with the backend base URL.
 *
 * VITE_API_URL must be defined in .env (development) or as a Vercel
 * environment variable (production).
 *
 * In development with the Vite proxy configured in vite.config.ts,
 * you can leave VITE_API_URL empty — requests to /api will be forwarded
 * automatically to http://localhost:8000.
 *
 * In production, set VITE_API_URL to your full Render service URL:
 *   https://pro-gas-erp-backend.onrender.com
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach auth headers in the future
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    // Future: attach JWT token from localStorage or auth context
    // const token = localStorage.getItem("access_token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — centralised error handling
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Future: handle 401 Unauthorized -> redirect to login
    // Future: handle 503 -> show maintenance banner
    console.error("[API Error]", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default apiClient;

// ---------------------------------------------------------------------------
// Typed response shape for the health endpoint
// ---------------------------------------------------------------------------
export interface HealthCheckResponse {
  status: string;
  db_connection: string;
}
