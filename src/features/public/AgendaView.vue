<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { parseApiError } from "@/api/errors";
import type { Agenda, CitaAgendaItem, ServicioPublico } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import EstadoBadge from "@/features/citas/EstadoBadge.vue";
import { formatDay, formatTime, hoyISO } from "@/lib/format";
import { getMisCitas } from "@/lib/misCitas";
import { usePolling } from "@/lib/polling";
import { publicApi } from "./public.api";

// AGENDA PÚBLICA del día: cualquiera ve qué horarios están ocupados, el estado de las
// citas y las rechazadas. Solo código, hora, servicio, estado y "J. Mamani" (sin CI ni teléfono).

const hoy = hoyISO();
const fecha = ref(hoy);
const servicioId = ref("");
const tab = ref<"activas" | "rechazadas">("activas");
const buscar = ref("");

const servicios = ref<ServicioPublico[]>([]);
const agenda = ref<Agenda | null>(null);
const cargando = ref(true);
const error = ref("");
const sinConexion = ref(false);
const actualizadoA = ref<Date | null>(null);
let pedido = 0;

// Códigos de las citas guardadas en este dispositivo: se marcan como «Tu cita».
const misCodigos = new Set(getMisCitas().map((c) => c.codigo));

// `silencioso` = actualización automática: no parpadea ni borra la lista si falla.
async function cargar(silencioso = false) {
  const mio = ++pedido;
  if (!silencioso) cargando.value = true;
  try {
    const r = await publicApi.agenda({
      fecha: fecha.value || undefined,
      servicioId: servicioId.value || undefined,
    });
    if (mio !== pedido) return;
    agenda.value = r;
    actualizadoA.value = new Date();
    error.value = "";
    sinConexion.value = false;
  } catch (e) {
    if (mio !== pedido) return;
    if (silencioso) sinConexion.value = true;
    else error.value = parseApiError(e).message;
  } finally {
    if (mio === pedido && !silencioso) cargando.value = false;
  }
}

watch([fecha, servicioId], () => void cargar());
usePolling(() => cargar(true));

const normalizar = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();

const lista = computed<CitaAgendaItem[]>(() => {
  const base = agenda.value?.[tab.value] ?? [];
  const q = normalizar(buscar.value);
  if (!q) return base;
  return base.filter((c) => normalizar(c.codigo).includes(q) || normalizar(c.nombre).includes(q));
});

const horaActualizado = computed(() =>
  actualizadoA.value ? formatTime(actualizadoA.value.toISOString()) : "",
);

onMounted(async () => {
  void cargar();
  try {
    servicios.value = await publicApi.servicios();
  } catch {
    /* el filtro por servicio es opcional */
  }
});
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Agenda del día</h1>
        <p class="mt-1 text-sm text-slate-600">
          {{ agenda?.sede.nombre }}
          <template v-if="fecha"> · {{ formatDay(fecha) }}</template>
        </p>
      </div>
      <RouterLink to="/reservar"><AppButton>Reservar una cita</AppButton></RouterLink>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="fecha"
        type="date"
        aria-label="Día"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
      />
      <AppButton variant="secondary" :disabled="fecha === hoy" @click="fecha = hoy">Hoy</AppButton>
      <select
        v-model="servicioId"
        aria-label="Servicio"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
      >
        <option value="">Todos los servicios</option>
        <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>
      <input
        v-model="buscar"
        type="search"
        placeholder="Buscar mi código..."
        aria-label="Buscar por código o nombre"
        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:w-48"
      />
    </div>

    <div role="tablist" class="flex gap-1 border-b border-slate-200">
      <button
        v-for="t in [
          { id: 'activas', label: 'Citas del día', n: agenda?.activas.length ?? 0 },
          { id: 'rechazadas', label: 'Rechazadas', n: agenda?.rechazadas.length ?? 0 },
        ] as const"
        :key="t.id"
        role="tab"
        type="button"
        :aria-selected="tab === t.id"
        class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition"
        :class="
          tab === t.id
            ? 'border-indigo-600 text-indigo-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        "
        @click="tab = t.id"
      >
        {{ t.label }}
        <span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{
          t.n
        }}</span>
      </button>
    </div>

    <p v-if="error" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ error }}
    </p>

    <div class="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th class="px-4 py-3">Hora</th>
            <th class="px-4 py-3">Código</th>
            <th class="hidden px-4 py-3 sm:table-cell">Servicio</th>
            <th class="hidden px-4 py-3 sm:table-cell">Nombre</th>
            <th class="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="cargando && !agenda">
            <td colspan="5" class="px-4 py-8 text-center text-slate-500">Cargando...</td>
          </tr>
          <tr v-else-if="lista.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-slate-500">
              {{
                buscar
                  ? "Ninguna cita coincide con tu búsqueda."
                  : tab === "activas"
                    ? "No hay citas para este día."
                    : "No hay citas rechazadas este día."
              }}
            </td>
          </tr>
          <tr
            v-for="c in lista"
            :key="c.codigo"
            :class="misCodigos.has(c.codigo) ? 'bg-indigo-50/60' : 'hover:bg-slate-50'"
          >
            <td class="px-4 py-3 font-medium whitespace-nowrap">{{ formatTime(c.inicio) }}</td>
            <td class="px-4 py-3 font-mono whitespace-nowrap">
              {{ c.codigo }}
              <span v-if="misCodigos.has(c.codigo)" class="ml-1 text-xs font-sans text-indigo-700">
                Tu cita
              </span>
              <!-- En celular, servicio y nombre van debajo del código para que quepa el estado -->
              <span class="block font-sans text-xs whitespace-normal text-slate-500 sm:hidden">
                {{ c.servicio.nombre }} · {{ c.nombre }}
              </span>
            </td>
            <td class="hidden px-4 py-3 sm:table-cell">{{ c.servicio.nombre }}</td>
            <td class="hidden px-4 py-3 whitespace-nowrap text-slate-600 sm:table-cell">
              {{ c.nombre }}
            </td>
            <td class="px-4 py-3"><EstadoBadge :estado="c.estado" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-slate-500">
      Se actualiza sola.
      <template v-if="horaActualizado">Última actualización: {{ horaActualizado }}.</template>
      <span v-if="sinConexion" class="text-amber-700">
        Sin conexión: mostrando la última lista.</span
      >
      Para ver el motivo de un rechazo, entra a
      <RouterLink to="/mi-cita" class="font-medium text-indigo-600 hover:underline"
        >Mi cita</RouterLink
      >.
    </p>
  </section>
</template>
