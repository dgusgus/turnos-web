import { ref, watch } from "vue";

// TEMA = dos ejes independientes:
//   modo  → claro / oscuro / sistema (lo que diga el dispositivo)
//   marca → el color del colegio
// Se guardan en localStorage y se aplican como atributos de <html>, que es lo que
// leen los selectores de style.css:  <html data-theme="colegio-oscuro" data-marca="violeta">

export type Modo = "sistema" | "claro" | "oscuro";

export const MARCAS = [
  { id: "indigo", nombre: "Índigo", color: "oklch(51% 0.22 277)" },
  { id: "violeta", nombre: "Violeta", color: "oklch(50% 0.22 320)" },
  { id: "turquesa", nombre: "Turquesa", color: "oklch(48% 0.1 205)" },
  { id: "pizarra", nombre: "Pizarra", color: "oklch(40% 0.03 255)" },
] as const;

export type Marca = (typeof MARCAS)[number]["id"];

export interface Preferencia {
  modo: Modo;
  marca: Marca;
}

const KEY = "tema";
const POR_DEFECTO: Preferencia = { modo: "sistema", marca: "indigo" };

/** Lee lo guardado SIN fiarse de él: si está corrupto o es de otra versión, usa los valores por defecto. */
export function leerPreferencia(raw: string | null): Preferencia {
  try {
    const p = JSON.parse(raw ?? "{}") as Partial<Preferencia>;
    const modo = (["sistema", "claro", "oscuro"] as const).find((m) => m === p.modo);
    const marca = MARCAS.find((m) => m.id === p.marca)?.id;
    return { modo: modo ?? POR_DEFECTO.modo, marca: marca ?? POR_DEFECTO.marca };
  } catch {
    return { ...POR_DEFECTO };
  }
}

/** Qué tema de daisyUI corresponde a un modo. `sistemaOscuro` = el dispositivo prefiere oscuro. */
export function resolverTema(modo: Modo, sistemaOscuro: boolean) {
  const oscuro = modo === "oscuro" || (modo === "sistema" && sistemaOscuro);
  return oscuro ? "colegio-oscuro" : "colegio";
}

// Estado compartido por toda la app (un solo objeto, no uno por componente).
const modo = ref<Modo>(POR_DEFECTO.modo);
const marca = ref<Marca>(POR_DEFECTO.marca);
const sistemaOscuro = ref(false);

function aplicar() {
  const html = document.documentElement;
  html.dataset.theme = resolverTema(modo.value, sistemaOscuro.value);
  html.dataset.marca = marca.value;
  try {
    localStorage.setItem(KEY, JSON.stringify({ modo: modo.value, marca: marca.value }));
  } catch {
    // modo privado o almacenamiento bloqueado: el tema funciona igual, solo no se recuerda
  }
}

/** Llamar UNA vez en main.ts, antes de montar la app. */
export function iniciarTema() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // ver arriba
  }
  const guardada = leerPreferencia(raw);
  modo.value = guardada.modo;
  marca.value = guardada.marca;

  // Si el modo es "sistema", seguir al dispositivo en vivo (ej. oscuro automático de noche).
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  sistemaOscuro.value = mq.matches;
  mq.addEventListener("change", (e) => (sistemaOscuro.value = e.matches));

  watch([modo, marca, sistemaOscuro], aplicar, { immediate: true });
}

export function useTema() {
  return { modo, marca };
}
