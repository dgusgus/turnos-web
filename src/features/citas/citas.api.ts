import { http } from "@/api/http";
import type { CitaStaff, EstadoCita, ItemResponse, ListParams, ListResponse } from "@/api/types";

export interface CitasListParams extends ListParams {
  fecha?: string; // "AAAA-MM-DD"; sin fecha = de hoy en adelante
  estado?: EstadoCita;
}

// Bandeja del PERSONAL (requiere sesión de ADMIN u OPERADOR).
export const citasApi = {
  async list(params: CitasListParams) {
    const { data } = await http.get<ListResponse<CitaStaff>>("/citas", { params });
    return data;
  },

  async aprobar(id: string) {
    const { data } = await http.post<ItemResponse<CitaStaff>>(`/citas/${id}/aprobar`);
    return data.data;
  },

  async rechazar(id: string, motivo: string) {
    const { data } = await http.post<ItemResponse<CitaStaff>>(`/citas/${id}/rechazar`, { motivo });
    return data.data;
  },
};
