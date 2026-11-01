import type { EstadoCita } from "@/api/types";

// Cómo se muestra cada estado de una cita (texto y color). Un solo lugar para todas las pantallas.
// `clase` son clases de daisyUI: el color viene de la FUNCIÓN del estado (warning, success...),
// no de un tono fijo, y por eso se ve bien en modo claro y oscuro.
export const ESTADOS: Record<EstadoCita, { label: string; clase: string }> = {
  PENDIENTE: { label: "Pendiente de aprobación", clase: "badge-warning" },
  CONFIRMADA: { label: "Confirmada", clase: "badge-success" },
  EN_COLA: { label: "En cola", clase: "badge-info" },
  ATENDIDA: { label: "Atendida", clase: "badge-secondary" },
  RECHAZADA: { label: "Rechazada", clase: "badge-error" },
  CANCELADA: { label: "Cancelada", clase: "badge-ghost" },
  NO_ASISTIO: { label: "No asistió", clase: "badge-ghost" },
};
