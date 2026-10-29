// "Mis citas" guardadas en ESTE dispositivo, para volver a abrirlas sin buscar el enlace.
//
// Se guarda el enlace secreto (token) en localStorage. Quien use este navegador podría
// verlas: por eso hay un botón "Quitar de este dispositivo" y, en computadoras compartidas
// o tótems, conviene no guardar. Si el navegador bloquea el almacenamiento, todo sigue
// funcionando; solo no se recuerdan.
const KEY = "turnos.misCitas";
const MAXIMO = 10;

export interface MiCitaGuardada {
  token: string;
  codigo: string;
  inicio: string; // ISO
  servicio: string;
}

const esValida = (x: unknown): x is MiCitaGuardada => {
  const c = x as Partial<MiCitaGuardada> | null;
  return (
    typeof c?.token === "string" &&
    typeof c.codigo === "string" &&
    typeof c.inicio === "string" &&
    typeof c.servicio === "string"
  );
};

export function getMisCitas(): MiCitaGuardada[] {
  try {
    const crudo = localStorage.getItem(KEY);
    const lista: unknown = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(lista) ? lista.filter(esValida) : [];
  } catch {
    return [];
  }
}

function guardar(lista: MiCitaGuardada[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lista.slice(0, MAXIMO)));
  } catch {
    /* almacenamiento bloqueado o lleno: no pasa nada */
  }
}

/** La más reciente primero; si ya estaba (mismo token), se actualiza sin duplicar. */
export function guardarMiCita(cita: MiCitaGuardada) {
  guardar([cita, ...getMisCitas().filter((c) => c.token !== cita.token)]);
}

export function quitarMiCita(token: string) {
  guardar(getMisCitas().filter((c) => c.token !== token));
}
