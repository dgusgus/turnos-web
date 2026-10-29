import { http } from "@/api/http";
import type {
  Agenda,
  CitaCreada,
  CitaConsulta,
  CitaSeguimiento,
  CrearCitaInput,
  Disponibilidad,
  ItemResponse,
  ServicioPublico,
} from "@/api/types";

// API PÚBLICA: no necesita sesión. Es lo que usa la gente que viene a pedir una cita.
export const publicApi = {
  async servicios() {
    const { data } = await http.get<ItemResponse<ServicioPublico[]>>("/public/servicios");
    return data.data;
  },

  async disponibilidad(servicioId: string, fecha: string) {
    const { data } = await http.get<ItemResponse<Disponibilidad>>("/public/disponibilidad", {
      params: { servicioId, fecha },
    });
    return data.data;
  },

  async agenda(params: { fecha?: string; servicioId?: string }) {
    const { data } = await http.get<ItemResponse<Agenda>>("/public/agenda", { params });
    return data.data;
  },

  async crearCita(input: CrearCitaInput) {
    const { data } = await http.post<ItemResponse<CitaCreada>>("/public/citas", input);
    return data.data;
  },

  async consultar(codigo: string, documento: string) {
    const { data } = await http.post<ItemResponse<CitaConsulta>>("/public/citas/consulta", {
      codigo,
      documento,
    });
    return data.data;
  },

  async citaPorToken(token: string) {
    const { data } = await http.get<ItemResponse<CitaSeguimiento>>(`/public/citas/${token}`);
    return data.data;
  },

  async cancelar(token: string) {
    const { data } = await http.post<ItemResponse<CitaSeguimiento>>(
      `/public/citas/${token}/cancelar`,
    );
    return data.data;
  },
};
