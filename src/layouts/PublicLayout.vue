<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import TemaSelector from "@/components/ui/TemaSelector.vue";
import { APP_NAME } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";

// Diseño de las páginas PÚBLICAS (sin login): barra superior simple + contenido centrado.
const auth = useAuthStore();

const links = [
  { to: "/reservar", label: "Reservar cita" },
  { to: "/agenda", label: "Agenda del día" },
  { to: "/mi-cita", label: "Mi cita" },
];
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-base-300 bg-base-100">
      <div
        class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3"
      >
        <RouterLink to="/" class="text-lg font-semibold tracking-tight text-primary">
          {{ APP_NAME }}
        </RouterLink>
        <nav class="flex flex-wrap items-center gap-1 text-sm font-medium">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="btn btn-ghost btn-sm"
            active-class="btn-active"
          >
            {{ link.label }}
          </RouterLink>
          <RouterLink
            :to="auth.isAuthenticated ? '/panel' : '/login'"
            class="btn btn-ghost btn-sm text-base-content/70"
          >
            {{ auth.isAuthenticated ? "Panel" : "Personal" }}
          </RouterLink>
          <TemaSelector />
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-8">
      <RouterView />
    </main>

    <footer
      class="border-t border-base-300 bg-base-100 py-4 text-center text-xs text-base-content/70"
    >
      Sin cuenta ni contraseña: reserva con tu CI y teléfono.
    </footer>
  </div>
</template>
