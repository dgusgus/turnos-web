<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import type { Rol } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import { APP_NAME } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

// Para agregar una sección: una línea aquí + una ruta en router/index.ts.
const links: { to: string; label: string; roles?: Rol[] }[] = [
  { to: "/panel", label: "Inicio" },
  { to: "/panel/citas", label: "Citas" },
  { to: "/panel/users", label: "Usuarios", roles: ["ADMIN"] },
  { to: "/agenda", label: "Agenda pública ↗" },
];

const visibleLinks = computed(() => links.filter((l) => !l.roles || auth.hasRole(...l.roles)));

function logout() {
  auth.logout();
  void router.push({ name: "login" });
}
</script>

<template>
  <div class="min-h-screen lg:flex">
    <!-- Barra lateral (en móvil se despliega con el botón) -->
    <aside
      class="border-b border-slate-200 bg-white lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0"
    >
      <div class="flex items-center justify-between px-4 py-4">
        <span class="text-lg font-semibold tracking-tight text-indigo-700">{{ APP_NAME }}</span>
        <button
          type="button"
          class="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menú"
          @click="menuOpen = !menuOpen"
        >
          ☰
        </button>
      </div>
      <nav class="px-2 pb-3 lg:block" :class="menuOpen ? 'block' : 'hidden'">
        <RouterLink
          v-for="link in visibleLinks"
          :key="link.to"
          :to="link.to"
          class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          active-class="!bg-indigo-50 !text-indigo-700"
          exact-active-class="!bg-indigo-50 !text-indigo-700"
          @click="menuOpen = false"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-4 py-3"
      >
        <div class="text-right text-sm leading-tight">
          <p class="font-medium">{{ auth.user?.nombre }}</p>
          <p class="text-xs text-slate-500">{{ auth.user?.rol }}</p>
        </div>
        <AppButton variant="secondary" @click="logout">Salir</AppButton>
      </header>

      <main class="flex-1 p-4 sm:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
