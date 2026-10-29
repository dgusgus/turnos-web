import axios from "axios";
import { getToken } from "@/lib/session";

// Único punto de salida hacia la API: aquí se pega el token y se maneja el 401.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
  timeout: 15_000,
});

let onUnauthorized: (() => void) | null = null;

// main.ts registra qué hacer cuando el servidor responde 401 (sesión vencida).
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Un 401 en el login significa "credenciales malas", no "sesión vencida".
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
