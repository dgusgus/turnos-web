const locale = import.meta.env.VITE_LOCALE ?? "es-BO";

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Turnos y Citas";

// Zona horaria del colegio: todas las horas se muestran en ella, sin importar
// en qué zona esté el navegador de quien mira.
export const TIMEZONE = import.meta.env.VITE_TIMEZONE ?? "America/La_Paz";

const hora = new Intl.DateTimeFormat(locale, {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const fechaHora = new Intl.DateTimeFormat(locale, {
  timeZone: TIMEZONE,
  dateStyle: "medium",
  timeStyle: "short",
});
const fechaCorta = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
const diaLargo = new Intl.DateTimeFormat(locale, {
  timeZone: "UTC", // la fecha "AAAA-MM-DD" se interpreta como UTC para que no se corra un día
  weekday: "long",
  day: "numeric",
  month: "long",
});
const iso = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }); // da "AAAA-MM-DD"

/** "2030-01-08T12:00:00Z" → "08:00" (hora del colegio) */
export const formatTime = (isoDate: string) => hora.format(new Date(isoDate));

/** "2030-01-08T12:00:00Z" → "8 ene 2030, 08:00" */
export const formatDateTime = (isoDate: string) => fechaHora.format(new Date(isoDate));

export const formatDate = (isoDate: string) => fechaCorta.format(new Date(isoDate));

/** "2030-01-08" → "Martes, 8 de enero" */
export function formatDay(fecha: string) {
  const texto = diaLargo.format(new Date(`${fecha}T00:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Fecha de hoy ("AAAA-MM-DD") en la zona horaria del colegio. */
export const hoyISO = (ahora = new Date()) => iso.format(ahora);

export function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
