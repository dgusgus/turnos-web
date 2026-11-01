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
        <p class="mt-1 text-sm text-base-content/80">
          {{ agenda?.sede.nombre }}
          <template v-if="fecha"> · {{ formatDay(fecha) }}</template>
        </p>
      </div>
      <RouterLink to="/reservar"><AppButton>Reservar una cita</AppButton></RouterLink>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <input v-model="fecha" type="date" aria-label="Día" class="input w-44" />
      <AppButton variant="secondary" :disabled="fecha === hoy" @click="fecha = hoy">Hoy</AppButton>
      <select v-model="servicioId" aria-label="Servicio" class="select w-auto">
        <option value="">Todos los servicios</option>
        <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>
      <input
        v-model="buscar"
        type="search"
        placeholder="Buscar mi código..."
        aria-label="Buscar por código o nombre"
        class="input w-full sm:w-48"
      />
    </div>

    <div role="tablist" class="tabs tabs-border">
      <button
        v-for="t in [
          { id: 'activas', label: 'Citas del día', n: agenda?.activas.length ?? 0 },
          { id: 'rechazadas', label: 'Rechazadas', n: agenda?.rechazadas.length ?? 0 },
        ] as const"
        :key="t.id"
        role="tab"
        type="button"
        :aria-selected="tab === t.id"
        class="tab gap-2"
        :class="{ 'tab-active font-medium': tab === t.id }"
        @click="tab = t.id"
      >
        {{ t.label }}
        <span class="badge badge-sm">{{ t.n }}</span>
      </button>
    </div>

    <p v-if="error" role="alert" class="alert alert-error alert-soft text-sm">
      {{ error }}
    </p>

    <div class="overflow-x-auto tarjeta">
      <table class="table">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Código</th>
            <th class="hidden sm:table-cell">Servicio</th>
            <th class="hidden sm:table-cell">Nombre</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando && !agenda">
            <td colspan="5" class="px-4 py-8 text-center text-base-content/70">Cargando...</td>
          </tr>
          <tr v-else-if="lista.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-base-content/70">
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
            :class="misCodigos.has(c.codigo) ? 'bg-primary/10' : 'hover:bg-base-200/60'"
          >
            <td class="font-medium whitespace-nowrap">{{ formatTime(c.inicio) }}</td>
            <td class="font-mono whitespace-nowrap">
              {{ c.codigo }}
              <span
                v-if="misCodigos.has(c.codigo)"
                class="badge badge-primary badge-soft badge-sm ml-1 font-sans"
              >
                Tu cita
              </span>
              <!-- En celular, servicio y nombre van debajo del código para que quepa el estado -->
              <span
                class="block font-sans text-xs whitespace-normal text-base-content/70 sm:hidden"
              >
                {{ c.servicio.nombre }} · {{ c.nombre }}
              </span>
            </td>
            <td class="hidden sm:table-cell">{{ c.servicio.nombre }}</td>
            <td class="hidden whitespace-nowrap text-base-content/80 sm:table-cell">
              {{ c.nombre }}
            </td>
            <td><EstadoBadge :estado="c.estado" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-base-content/70">
      Se actualiza sola.
      <template v-if="horaActualizado">Última actualización: {{ horaActualizado }}.</template>
      <span
        v-if="sinConexion"
        class="font-medium text-warning-content badge badge-warning badge-soft"
      >
        Sin conexión: mostrando la última lista.</span
      >
      Para ver el motivo de un rechazo, entra a
      <RouterLink to="/mi-cita" class="link link-primary font-medium">Mi cita</RouterLink>.
    </p>
  </section>
</template>
