import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseApiError } from "../src/api/errors";
import { debounce } from "../src/lib/debounce";

// Pruebas de lógica pura (sin navegador).
describe("parseApiError", () => {
  const withResponse = (data: unknown, status = 400) =>
    new AxiosError("fail", "ERR_BAD_REQUEST", undefined, undefined, {
      status,
      statusText: "",
      headers: {},
      config: {} as never,
      data,
    });

  it("extrae mensaje y errores por campo de la respuesta del backend", () => {
    const info = parseApiError(
      withResponse({
        error: {
          code: "VALIDATION_ERROR",
          message: "Datos inválidos",
          details: [
            { path: "email", message: "Email inválido" },
            { path: "email", message: "otro mensaje (se ignora)" },
            { path: "password", message: "Mínimo 8 caracteres" },
          ],
        },
      }),
    );
    expect(info.code).toBe("VALIDATION_ERROR");
    expect(info.message).toBe("Datos inválidos");
    expect(info.fieldErrors).toEqual({
      email: "Email inválido",
      password: "Mínimo 8 caracteres",
    });
  });

  it("sin respuesta (servidor caído) → mensaje de conexión", () => {
    const info = parseApiError(new AxiosError("Network Error", "ERR_NETWORK"));
    expect(info.message).toBe("No se pudo conectar con el servidor");
  });

  it("error genérico → mensaje del error", () => {
    expect(parseApiError(new Error("boom")).message).toBe("boom");
    expect(parseApiError("raro").message).toBe("Ocurrió un error inesperado");
  });
});

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("ejecuta una sola vez, con el último valor, tras el retraso", () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d("a");
    d("b");
    d("c");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });
});
