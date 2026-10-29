// Tipos de la API (espejo de los DTOs de turnos-api).
// Si cambias un DTO allá, actualiza el tipo aquí. (Nivel 2: generarlos desde OpenAPI.)

// Solo el PERSONAL inicia sesión. El público (padres, tutores) no tiene cuenta.
export type Rol = "ADMIN" | "OPERADOR";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  sedeId: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ItemResponse<T> {
  data: T;
}

export interface ListResponse<T> {
  data: T[];
  meta: PageMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ---------------------------------------------------------------------------
// Citas
// ---------------------------------------------------------------------------

export type EstadoCita =
  "PENDIENTE" | "CONFIRMADA" | "EN_COLA" | "ATENDIDA" | "RECHAZADA" | "CANCELADA" | "NO_ASISTIO";

export interface ServicioResumen {
  nombre: string;
  prefijo: string;
}

// ---- API pública (sin login) ----

export interface ServicioPublico {
  id: string;
  nombre: string;
  descripcion: string | null;
  prefijo: string;
  duracionMin: number;
  permiteCita: boolean;
  requiereAprobacion: boolean;
  sede: { id: string; nombre: string };
}

export interface Franja {
  hora: string; // "08:00" (hora local de la sede)
  inicio: string; // ISO UTC: se envía tal cual al reservar
  fin: string;
  libre: boolean;
}

export interface Disponibilidad {
  servicio: { id: string; nombre: string; duracionMin: number; requiereAprobacion: boolean };
  fecha: string; // "2030-01-08"
  cerrado: string | null; // motivo si ese día no hay atención
  franjas: Franja[];
}

// Lo que ve CUALQUIERA en la agenda: sin CI, teléfono ni datos del estudiante.
export interface CitaAgendaItem {
  codigo: string; // "R-K7M2Q"
  servicio: ServicioResumen;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  nombre: string; // "J. Mamani"
}

export interface Agenda {
  fecha: string;
  sede: { id: string; nombre: string };
  activas: CitaAgendaItem[];
  rechazadas: CitaAgendaItem[];
}

// Quien conoce código + CI.
export interface CitaConsulta {
  codigo: string;
  servicio: ServicioResumen;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  motivoRechazo: string | null;
}

// Quien tiene el enlace secreto.
export interface CitaSeguimiento extends CitaConsulta {
  nombres: string;
  apellidos: string;
  estudianteNombre: string;
  estudianteCurso: string;
  motivo: string;
  puedeCancelar: boolean;
}

export interface CrearCitaInput {
  servicioId: string;
  inicio: string;
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  estudianteNombre: string;
  estudianteCurso: string;
  motivo: string;
}

export interface CitaCreada {
  token: string; // el enlace secreto: se entrega UNA sola vez
  cita: CitaSeguimiento;
}

// ---- Bandeja del personal ----

export interface CitaStaff {
  id: string;
  codigo: string;
  servicio: { id: string; nombre: string; prefijo: string };
  inicio: string;
  fin: string;
  estado: EstadoCita;
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  estudianteNombre: string;
  estudianteCurso: string;
  motivo: string;
  motivoRechazo: string | null;
  decididaEn: string | null;
  creadoEn: string;
}
