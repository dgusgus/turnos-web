import { http } from "@/api/http";
import type { ConAdvertencias, DiaNoLaborable, ListParams, ListResponse } from "@/api/types";

export const diasApi = {
  async list(params: ListParams) {
    const { data } = await http.get<ListResponse<DiaNoLaborable>>("/dias-no-laborables", {
      params,
    });
    return data;
  },

  async create(input: { fecha: string; motivo: string }) {
    const { data } = await http.post<ConAdvertencias<DiaNoLaborable>>("/dias-no-laborables", input);
    return data;
  },

  async remove(id: string) {
    await http.delete(`/dias-no-laborables/${id}`);
  },
};
