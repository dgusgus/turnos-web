import type { VentanaInput } from "@/api/types";

// Lógica pura de horarios (sin Vue, sin red): por eso se prueba fácil en tests/horarios.test.ts.
// ¡OJO! `validarVentanas` es un ESPEJO de la regla del backend (turnos-api →
// servicios/horarios.validacion.ts). Sirve para avisar rápido sin ir al servidor; la
// autoridad siempre es el backend, que vuelve a validar.

export const DIAS = [
  { n: 1, corto: "Lun", largo: "Lunes" },
  { n: 2, corto: "Mar", largo: "Martes" },
  { n: 3, corto: "Mié", largo: "Miércoles" },
  { n: 4, corto: "Jue", largo: "Jueves" },
  { n: 5, corto: "Vie", largo: "Viernes" },
  { n: 6, corto: "Sáb", largo: "Sábado" },
  { n: 7, corto: "Dom", largo: "Domingo" },
] as const;

const nombreDia = (n: number) => DIAS.find((d) => d.n === n)?.largo.toLowerCase() ?? `día ${n}`;

/** "08:30" → 510 */
export const horaAMin = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Cuántas citas caben en una ventana: 08:00-12:00 con 15 min → 16. */
export function citasEnVentana(v: Pick<VentanaInput, "desde" | "hasta">, duracionMin: number) {
  if (!v.desde || !v.hasta || duracionMin <= 0) return 0;
  return Math.max(0, Math.floor((horaAMin(v.hasta) - horaAMin(v.desde)) / duracionMin));
}

/** Primer problema que encuentra, o null si todo está bien. */
export function validarVentanas(ventanas: VentanaInput[], duracionMin: number): string | null {
  for (const v of ventanas) {
    if (!v.desde || !v.hasta) return `El ${nombreDia(v.diaSemana)}: completa las dos horas`;
    if (horaAMin(v.desde) >= horaAMin(v.hasta)) {
      return `El ${nombreDia(v.diaSemana)}: la hora de inicio (${v.desde}) debe ser anterior a la de fin (${v.hasta})`;
    }
    if (citasEnVentana(v, duracionMin) === 0) {
      return `El ${nombreDia(v.diaSemana)}: ${v.desde}-${v.hasta} es más corto que la duración del servicio (${duracionMin} min)`;
    }
  }
  for (const { n } of DIAS) {
    const delDia = ventanas
      .filter((v) => v.diaSemana === n)
      .sort((a, b) => horaAMin(a.desde) - horaAMin(b.desde));
    for (let i = 1; i < delDia.length; i++) {
      const a = delDia[i - 1]!;
      const b = delDia[i]!;
      if (horaAMin(b.desde) < horaAMin(a.hasta)) {
        return `El ${nombreDia(n)}: ${a.desde}-${a.hasta} se solapa con ${b.desde}-${b.hasta}`;
      }
    }
  }
  return null;
}

// [1,2,3,4,5] → "Lun–Vie"; [1,3] → "Lun, Mié"; [6] → "Sáb"
function nombrarDias(dias: number[]) {
  const corto = (n: number) => DIAS.find((d) => d.n === n)?.corto ?? String(n);
  const partes: string[] = [];
  let i = 0;
  while (i < dias.length) {
    let j = i;
    while (j + 1 < dias.length && dias[j + 1] === dias[j]! + 1) j++;
    if (j - i >= 2) partes.push(`${corto(dias[i]!)}–${corto(dias[j]!)}`);
    else for (let k = i; k <= j; k++) partes.push(corto(dias[k]!));
    i = j + 1;
  }
  return partes.join(", ");
}

/**
 * Resume el horario semanal en pocas líneas legibles, agrupando los días que tienen
 * exactamente las mismas ventanas:
 *   ["Lun–Vie · 08:00–12:00, 14:30–18:00", "Sáb · 08:00–12:00"]
 */
export function resumirHorarios(ventanas: VentanaInput[]): string[] {
  const porFirma = new Map<string, number[]>();
  for (const { n } of DIAS) {
    const firma = ventanas
      .filter((v) => v.diaSemana === n)
      .sort((a, b) => horaAMin(a.desde) - horaAMin(b.desde))
      .map((v) => `${v.desde}–${v.hasta}`)
      .join(", ");
    if (!firma) continue; // día cerrado
    porFirma.set(firma, [...(porFirma.get(firma) ?? []), n]);
  }
  return [...porFirma.entries()].map(([firma, dias]) => `${nombrarDias(dias)} · ${firma}`);
}
