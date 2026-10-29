<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
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
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3"
      >
        <RouterLink to="/" class="text-lg font-semibold tracking-tight text-indigo-700">
          {{ APP_NAME }}
        </RouterLink>
        <nav class="flex flex-wrap items-center gap-1 text-sm font-medium">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
            active-class="!bg-indigo-50 !text-indigo-700"
          >
            {{ link.label }}
          </RouterLink>
          <RouterLink
            :to="auth.isAuthenticated ? '/panel' : '/login'"
            class="rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {{ auth.isAuthenticated ? "Panel" : "Personal" }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-8">
      <RouterView />
    </main>

    <footer class="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
      Sin cuenta ni contraseña: reserva con tu CI y teléfono.
    </footer>
  </div>
</template>
