import { describe, expect, it } from "vitest";
import { leerPreferencia, MARCAS, resolverTema } from "@/lib/tema";

describe("tema: resolverTema", () => {
  it("claro y oscuro mandan sobre el dispositivo", () => {
    expect(resolverTema("claro", true)).toBe("colegio");
    expect(resolverTema("oscuro", false)).toBe("colegio-oscuro");
  });

  it("en modo sistema sigue lo que prefiera el dispositivo", () => {
    expect(resolverTema("sistema", false)).toBe("colegio");
    expect(resolverTema("sistema", true)).toBe("colegio-oscuro");
  });
});

describe("tema: leerPreferencia", () => {
  it("sin nada guardado usa los valores por defecto", () => {
    expect(leerPreferencia(null)).toEqual({ modo: "sistema", marca: "indigo" });
  });

  it("lee una preferencia válida", () => {
    const raw = JSON.stringify({ modo: "oscuro", marca: "violeta" });
    expect(leerPreferencia(raw)).toEqual({ modo: "oscuro", marca: "violeta" });
  });

  it("ignora JSON corrupto y valores desconocidos (no se fía de lo guardado)", () => {
    expect(leerPreferencia("{no es json")).toEqual({ modo: "sistema", marca: "indigo" });
    expect(leerPreferencia(JSON.stringify({ modo: "neon", marca: "rojo" }))).toEqual({
      modo: "sistema",
      marca: "indigo",
    });
  });

  it("toda marca declarada se acepta", () => {
    for (const m of MARCAS) {
      expect(leerPreferencia(JSON.stringify({ marca: m.id })).marca).toBe(m.id);
    }
  });
});
