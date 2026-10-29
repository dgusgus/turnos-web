<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { citasApi } from "@/features/citas/citas.api";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const pendientes = ref<number | null>(null);

// Cuántas citas esperan aprobación (si falla, simplemente no se muestra el número).
onMounted(async () => {
  try {
    pendientes.value = (await citasApi.list({ estado: "PENDIENTE", limit: 1 })).meta.total;
  } catch {
    pendientes.value = null;
  }
});
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold tracking-tight">Hola, {{ auth.user?.nombre }}</h1>
    <p class="text-slate-600">
      Sistema de gestión de turnos y citas. La cola de turnos se agrega en los siguientes pasos.
    </p>

    <div class="grid gap-4 sm:grid-cols-2">
      <RouterLink
        to="/panel/citas"
        class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300"
      >
        <h2 class="font-medium">Citas</h2>
        <p class="mt-1 text-sm text-slate-500">
          Aprueba o rechaza las citas pendientes y revisa las del día.
        </p>
        <p v-if="pendientes !== null" class="mt-3 text-sm font-medium">
          <span :class="pendientes > 0 ? 'text-amber-700' : 'text-emerald-700'">
            {{
              pendientes === 0
                ? "Sin pendientes"
                : `${pendientes} ${pendientes === 1 ? "pendiente" : "pendientes"} por aprobar`
            }}
          </span>
        </p>
      </RouterLink>

      <RouterLink
        v-if="auth.isAdmin"
        to="/panel/users"
        class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300"
      >
        <h2 class="font-medium">Usuarios</h2>
        <p class="mt-1 text-sm text-slate-500">
          Solo ADMIN: ver usuarios, crear personal y asignar roles.
        </p>
      </RouterLink>
    </div>
  </section>
</template>
