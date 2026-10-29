// Guarda el token en localStorage (Nivel 1).
// Riesgo conocido: si hay una falla XSS, el token es legible. En Nivel 2 se
// cambia por cookie httpOnly + refresh token (requiere ajustes en el backend).
const KEY = "starter.token";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string) => {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* almacenamiento bloqueado: la sesión dura hasta recargar */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada que limpiar */
  }
};
