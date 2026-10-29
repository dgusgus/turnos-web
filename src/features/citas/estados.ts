import type { EstadoCita } from "@/api/types";

// Cómo se muestra cada estado de una cita (texto y color). Un solo lugar para todas las pantallas.
export const ESTADOS: Record<EstadoCita, { label: string; clase: string }> = {
  PENDIENTE: {
    label: "Pendiente de aprobación",
    clase: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  CONFIRMADA: { label: "Confirmada", clase: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  EN_COLA: { label: "En cola", clase: "bg-sky-50 text-sky-700 ring-sky-200" },
  ATENDIDA: { label: "Atendida", clase: "bg-slate-100 text-slate-600 ring-slate-200" },
  RECHAZADA: { label: "Rechazada", clase: "bg-red-50 text-red-700 ring-red-200" },
  CANCELADA: { label: "Cancelada", clase: "bg-slate-100 text-slate-500 ring-slate-200" },
  NO_ASISTIO: { label: "No asistió", clase: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export const estadoLabel = (estado: EstadoCita) => ESTADOS[estado].label;
