import { http } from "@/api/http";
import type { ItemResponse, Usuario } from "@/api/types";

interface LoginResult {
  token: string;
  usuario: Usuario;
}

// Capa "api" de la feature: solo habla HTTP y devuelve datos tipados.
export const authApi = {
  async login(email: string, password: string) {
    const { data } = await http.post<ItemResponse<LoginResult>>("/auth/login", { email, password });
    return data.data;
  },

  async me() {
    const { data } = await http.get<ItemResponse<Usuario>>("/auth/me");
    return data.data;
  },
};
