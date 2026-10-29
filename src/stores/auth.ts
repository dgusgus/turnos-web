import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Rol, Usuario } from "@/api/types";
import { authApi } from "@/features/auth/auth.api";
import { clearToken, getToken, setToken } from "@/lib/session";

// Estado de sesión: token + usuario actual + helpers de roles.
export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(getToken());
  const user = ref<Usuario | null>(null);

  const isAuthenticated = computed(() => token.value !== null);
  const isAdmin = computed(() => user.value?.rol === "ADMIN");

  const hasRole = (...roles: Rol[]) => user.value !== null && roles.includes(user.value.rol);

  async function login(email: string, password: string) {
    const result = await authApi.login(email, password);
    token.value = result.token;
    user.value = result.usuario;
    setToken(result.token);
  }

  // Al recargar la página hay token pero no usuario: se pide al backend.
  async function loadUser() {
    if (!token.value || user.value) return;
    try {
      user.value = await authApi.me();
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    clearToken();
  }

  return { token, user, isAuthenticated, isAdmin, hasRole, login, loadUser, logout };
});
