import { http } from "@/api/http";
import type {
  ConAdvertencias,
  ItemResponse,
  ListParams,
  ListResponse,
  Servicio,
  ServicioInput,
  VentanaInput,
} from "@/api/types";

export interface ServiciosListParams extends ListParams {
  activo?: boolean;
}

// Capa HTTP del módulo: las vistas nunca llaman a axios directo.
export const serviciosApi = {
  async list(params: ServiciosListParams) {
    const { data } = await http.get<ListResponse<Servicio>>("/servicios", { params });
    return data;
  },

  async create(input: ServicioInput) {
    const { data } = await http.post<ItemResponse<Servicio>>("/servicios", input);
    return data.data;
  },

  // Devuelve también `advertencias` (ej. "hay 3 citas vigentes que conservan su hora").
  async update(id: string, input: Partial<ServicioInput>) {
    const { data } = await http.patch<ConAdvertencias<Servicio>>(`/servicios/${id}`, input);
    return data;
  },

  async remove(id: string) {
    await http.delete(`/servicios/${id}`);
  },

  // Reemplaza TODO el horario semanal.
  async setHorarios(id: string, horarios: VentanaInput[]) {
    const { data } = await http.put<ConAdvertencias<Servicio>>(`/servicios/${id}/horarios`, {
      horarios,
    });
    return data;
  },
};
