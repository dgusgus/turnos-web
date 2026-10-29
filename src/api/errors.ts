import axios from "axios";

export interface ApiErrorInfo {
  message: string;
  code?: string;
  /** Errores por campo, ej. { email: "Email inválido" } */
  fieldErrors: Record<string, string>;
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

// Convierte CUALQUIER error en algo mostrable. Un solo lugar para manejarlos todos.
export function parseApiError(err: unknown): ApiErrorInfo {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    if (!err.response) {
      return { message: "No se pudo conectar con el servidor", fieldErrors: {} };
    }
    const body = err.response.data?.error;
    const fieldErrors: Record<string, string> = {};

    if (Array.isArray(body?.details)) {
      for (const item of body.details as unknown[]) {
        const d = item as { path?: unknown; message?: unknown };
        if (
          typeof d.path === "string" &&
          typeof d.message === "string" &&
          !(d.path in fieldErrors)
        ) {
          fieldErrors[d.path] = d.message;
        }
      }
    }
    return {
      message: body?.message ?? "Ocurrió un error inesperado",
      code: body?.code,
      fieldErrors,
    };
  }
  return {
    message: err instanceof Error ? err.message : "Ocurrió un error inesperado",
    fieldErrors: {},
  };
}
