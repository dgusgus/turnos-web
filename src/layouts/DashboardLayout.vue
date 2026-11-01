<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import type { Rol } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import TemaSelector from "@/components/ui/TemaSelector.vue";
import { APP_NAME } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

// Para agregar una sección: una línea aquí + una ruta en router/index.ts.
const links: { to: string; label: string; roles?: Rol[]; exact?: boolean }[] = [
  { to: "/panel", label: "Inicio", exact: true },
  { to: "/panel/citas", label: "Citas" },
  { to: "/panel/servicios", label: "Servicios y horarios", roles: ["ADMIN"] },
  { to: "/panel/dias-no-laborables", label: "Días no laborables", roles: ["ADMIN"] },
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
      class="border-b border-base-300 bg-base-100 lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0"
    >
      <div class="flex items-center justify-between px-4 py-4">
        <span class="text-lg font-semibold tracking-tight text-primary">{{ APP_NAME }}</span>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square lg:hidden"
          aria-label="Abrir menú"
          @click="menuOpen = !menuOpen"
        >
          ☰
        </button>
      </div>
      <!-- `menu` de daisyUI; la ruta activa se marca con la clase menu-active -->
      <ul class="menu w-full px-2 pb-3 lg:block" :class="menuOpen ? 'block' : 'hidden'">
        <li v-for="link in visibleLinks" :key="link.to">
          <RouterLink
            :to="link.to"
            :active-class="link.exact ? '' : 'menu-active'"
            exact-active-class="menu-active"
            @click="menuOpen = false"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex items-center justify-end gap-3 border-b border-base-300 bg-base-100 px-4 py-3"
      >
        <TemaSelector />
        <div class="text-right text-sm leading-tight">
          <p class="font-medium">{{ auth.user?.nombre }}</p>
          <p class="text-xs text-base-content/70">{{ auth.user?.rol }}</p>
        </div>
        <AppButton size="sm" @click="logout">Salir</AppButton>
      </header>

      <main class="flex-1 p-4 sm:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
