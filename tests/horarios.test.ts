import { describe, expect, it } from "vitest";
import { citasEnVentana, resumirHorarios, validarVentanas } from "../src/lib/horarios";

const v = (diaSemana: number, desde: string, hasta: string) => ({ diaSemana, desde, hasta });

describe("citasEnVentana", () => {
  it("cuenta cuántas citas caben", () => {
    expect(citasEnVentana(v(1, "08:00", "12:00"), 15)).toBe(16);
    expect(citasEnVentana(v(1, "08:00", "09:00"), 20)).toBe(3);
  });
  it("una franja que no cabe completa no cuenta", () => {
    expect(citasEnVentana(v(1, "08:00", "08:50"), 20)).toBe(2);
    expect(citasEnVentana(v(1, "08:00", "08:10"), 15)).toBe(0);
  });
  it("horas vacías o invertidas dan 0", () => {
    expect(citasEnVentana(v(1, "", "12:00"), 15)).toBe(0);
    expect(citasEnVentana(v(1, "12:00", "08:00"), 15)).toBe(0);
  });
});

describe("validarVentanas (espejo del backend)", () => {
  it("acepta turno partido y ventanas pegadas", () => {
    expect(validarVentanas([v(1, "08:00", "12:00"), v(1, "14:30", "18:00")], 15)).toBeNull();
    expect(validarVentanas([v(1, "08:00", "12:00"), v(1, "12:00", "14:00")], 15)).toBeNull();
  });
  it("rechaza inicio >= fin, ventana corta, solape y horas vacías", () => {
    expect(validarVentanas([v(1, "12:00", "08:00")], 15)).toMatch(/anterior/);
    expect(validarVentanas([v(1, "08:00", "08:10")], 15)).toMatch(/más corto/);
    expect(validarVentanas([v(1, "08:00", "12:00"), v(1, "11:00", "13:00")], 15)).toMatch(/solapa/);
    expect(validarVentanas([v(1, "", "12:00")], 15)).toMatch(/completa/);
  });
  it("el mismo tramo en días distintos no es solape", () => {
    expect(validarVentanas([v(1, "08:00", "12:00"), v(2, "08:00", "12:00")], 15)).toBeNull();
  });
});

describe("resumirHorarios", () => {
  const semana = [1, 2, 3, 4, 5].flatMap((d) => [v(d, "08:00", "12:00"), v(d, "14:30", "18:00")]);

  it("agrupa los días iguales", () => {
    expect(resumirHorarios(semana)).toEqual(["Lun–Vie · 08:00–12:00, 14:30–18:00"]);
  });
  it("separa los días distintos y omite los cerrados", () => {
    expect(resumirHorarios([...semana, v(6, "08:00", "12:00")])).toEqual([
      "Lun–Vie · 08:00–12:00, 14:30–18:00",
      "Sáb · 08:00–12:00",
    ]);
  });
  it("días salteados se listan uno por uno", () => {
    expect(resumirHorarios([v(1, "08:00", "12:00"), v(3, "08:00", "12:00")])).toEqual([
      "Lun, Mié · 08:00–12:00",
    ]);
  });
  it("sin horarios → lista vacía", () => {
    expect(resumirHorarios([])).toEqual([]);
  });
  it("ordena las ventanas aunque lleguen desordenadas", () => {
    expect(resumirHorarios([v(1, "14:30", "18:00"), v(1, "08:00", "12:00")])).toEqual([
      "Lun · 08:00–12:00, 14:30–18:00",
    ]);
  });
});
