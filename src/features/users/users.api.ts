import { http } from "@/api/http";
import type { ItemResponse, ListParams, ListResponse, Rol, Usuario } from "@/api/types";

export interface UsuarioCreateInput {
  email: string;
  password: string;
  nombre: string;
  rol: Rol; // el ADMIN crea personal; el público no tiene cuenta
}

export const usersApi = {
  async list(params: ListParams) {
    const { data } = await http.get<ListResponse<Usuario>>("/users", { params });
    return data;
  },

  async create(input: UsuarioCreateInput) {
    const { data } = await http.post<ItemResponse<Usuario>>("/users", input);
    return data.data;
  },

  async update(id: string, input: Partial<Pick<Usuario, "nombre" | "rol" | "activo">>) {
    const { data } = await http.patch<ItemResponse<Usuario>>(`/users/${id}`, input);
    return data.data;
  },

  async remove(id: string) {
    await http.delete(`/users/${id}`);
  },
};
