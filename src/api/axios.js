import axios from "axios";

export const api = axios.create({
  baseURL: "/api", // para TODO lo que vive en /api
  timeout: 15000,
});

export const rootApi = axios.create({
  baseURL: "", // para endpoints en root, ej: /health
  timeout: 15000,
});

// ---- Interceptors para api (con token) ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
