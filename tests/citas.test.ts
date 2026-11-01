import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ESTADOS } from "../src/features/citas/estados";
import { formatDay, formatTime, hoyISO, sumarDias } from "../src/lib/format";
import { getMisCitas, guardarMiCita, quitarMiCita } from "../src/lib/misCitas";

describe("fechas en la zona horaria del colegio (La Paz, UTC-4)", () => {
  it("formatTime: 12:00 UTC son las 08:00 en La Paz", () => {
    expect(formatTime("2030-01-08T12:00:00.000Z")).toBe("08:00");
    expect(formatTime("2030-01-08T18:30:00.000Z")).toBe("14:30");
  });

  it("hoyISO usa la fecha de La Paz, no la de UTC", () => {
    // 02:00 UTC del día 8 todavía es el día 7 a las 22:00 en La Paz
    expect(hoyISO(new Date("2030-01-08T02:00:00Z"))).toBe("2030-01-07");
  });

  it("sumarDias cruza meses y años", () => {
    expect(sumarDias("2030-01-31", 1)).toBe("2030-02-01");
    expect(sumarDias("2030-12-31", 1)).toBe("2031-01-01");
    expect(sumarDias("2030-03-01", -1)).toBe("2030-02-28");
  });

  it("formatDay no se corre un día por la zona horaria", () => {
    expect(formatDay("2030-01-08")).toMatch(/^Martes,? 8 de enero$/);
  });
});

describe("estados de una cita", () => {
  it("todos los estados tienen texto y color", () => {
    for (const estado of [
      "PENDIENTE",
      "CONFIRMADA",
      "EN_COLA",
      "ATENDIDA",
      "RECHAZADA",
      "CANCELADA",
      "NO_ASISTIO",
    ] as const) {
      expect(ESTADOS[estado].label.length).toBeGreaterThan(0);
      expect(ESTADOS[estado].clase).toContain("badge-");
    }
  });
});

describe("citas guardadas en el dispositivo", () => {
  const cita = (n: number) => ({
    token: `token-${n}`,
    codigo: `R-AAAA${n}`,
    inicio: "2030-01-08T12:00:00.000Z",
    servicio: "Certificados",
  });

  // localStorage falso en memoria (los tests corren en Node, sin navegador)
  beforeEach(() => {
    const datos = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => datos.get(k) ?? null,
      setItem: (k: string, v: string) => void datos.set(k, v),
      removeItem: (k: string) => void datos.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("guarda la más reciente primero y no duplica", () => {
    guardarMiCita(cita(1));
    guardarMiCita(cita(2));
    guardarMiCita(cita(1));
    expect(getMisCitas().map((c) => c.token)).toEqual(["token-1", "token-2"]);
  });

  it("quita una cita", () => {
    guardarMiCita(cita(1));
    guardarMiCita(cita(2));
    quitarMiCita("token-1");
    expect(getMisCitas().map((c) => c.token)).toEqual(["token-2"]);
  });

  it("guarda como máximo 10", () => {
    for (let i = 0; i < 15; i++) guardarMiCita(cita(i));
    expect(getMisCitas()).toHaveLength(10);
    expect(getMisCitas()[0]?.token).toBe("token-14");
  });

  it("ignora datos corruptos en el almacenamiento", () => {
    localStorage.setItem("turnos.misCitas", "{no es json");
    expect(getMisCitas()).toEqual([]);
    localStorage.setItem("turnos.misCitas", JSON.stringify([{ token: 1 }, cita(3)]));
    expect(getMisCitas().map((c) => c.token)).toEqual(["token-3"]);
  });

  it("si el almacenamiento está bloqueado, no revienta", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    });
    expect(getMisCitas()).toEqual([]);
    expect(() => guardarMiCita(cita(1))).not.toThrow();
  });
});
