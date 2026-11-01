<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { parseApiError } from "@/api/errors";
import type { CitaStaff, EstadoCita, PageMeta } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppPagination from "@/components/ui/AppPagination.vue";
import { debounce } from "@/lib/debounce";
import { formatDateTime } from "@/lib/format";
import { usePolling } from "@/lib/polling";
import { useToastStore } from "@/stores/toast";
import { citasApi } from "./citas.api";
import EstadoBadge from "./EstadoBadge.vue";
import RechazarCitaModal from "./RechazarCitaModal.vue";

// BANDEJA DE CITAS del personal: aprobar o rechazar las pendientes y ver todas las demás.
const toast = useToastStore();

const items = ref<CitaStaff[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(false);
const page = ref(1);
const estado = ref<EstadoCita | "">("PENDIENTE"); // lo primero que necesita ver el operador
const fecha = ref(""); // vacío = de hoy en adelante
const search = ref("");
const procesando = ref<string | null>(null); // id de la cita que se está aprobando

const rechazando = ref<CitaStaff | null>(null);
const modalOpen = ref(false);

async function load(silencioso = false) {
  if (!silencioso) loading.value = true;
  try {
    const res = await citasApi.list({
      page: page.value,
      search: search.value.trim() || undefined,
      estado: estado.value || undefined,
      fecha: fecha.value || undefined,
    });
    items.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    if (!silencioso) toast.error(parseApiError(e).message);
  } finally {
    loading.value = false;
  }
}

watch([estado, fecha], () => {
  page.value = 1;
  void load();
});
watch(
  search,
  debounce(() => {
    page.value = 1;
    void load();
  }, 300),
);

// Una cita nueva puede llegar en cualquier momento: la bandeja se refresca sola.
usePolling(() => load(true), 30);

function goTo(p: number) {
  page.value = p;
  void load();
}

async function aprobar(c: CitaStaff) {
  procesando.value = c.id;
  try {
    await citasApi.aprobar(c.id);
    toast.success(`Cita ${c.codigo} aprobada`);
  } catch (e) {
    toast.error(parseApiError(e).message);
  } finally {
    procesando.value = null;
  }
  await load();
}

function rechazar(c: CitaStaff) {
  rechazando.value = c;
  modalOpen.value = true;
}

onMounted(() => load());
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold tracking-tight">Citas</h1>
      <AppButton variant="secondary" :loading="loading" @click="load()">Actualizar</AppButton>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <select v-model="estado" aria-label="Estado" class="select w-auto">
        <option value="PENDIENTE">Pendientes de aprobar</option>
        <option value="CONFIRMADA">Confirmadas</option>
        <option value="RECHAZADA">Rechazadas</option>
        <option value="CANCELADA">Canceladas</option>
        <option value="">Todas</option>
      </select>
      <input v-model="fecha" type="date" aria-label="Día" class="input w-44" />
      <AppButton v-if="fecha" variant="ghost" @click="fecha = ''">Desde hoy</AppButton>
      <input
        v-model="search"
        type="search"
        placeholder="Buscar por código, nombre, CI o teléfono..."
        aria-label="Buscar citas"
        class="input w-full sm:w-80"
      />
    </div>

    <div class="overflow-x-auto tarjeta">
      <table class="table">
        <thead>
          <tr>
            <th>Cita</th>
            <th>Persona</th>
            <th>Estudiante y motivo</th>
            <th>Estado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && items.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-base-content/70">Cargando...</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-base-content/70">
              {{
                estado === "PENDIENTE" ? "No hay citas pendientes. ¡Todo al día!" : "No hay citas."
              }}
            </td>
          </tr>
          <tr v-for="c in items" :key="c.id" class="align-top hover:bg-base-200/60">
            <td>
              <p class="font-mono font-medium">{{ c.codigo }}</p>
              <p class="text-xs whitespace-nowrap text-base-content/70">
                {{ formatDateTime(c.inicio) }}
              </p>
              <p class="text-xs text-base-content/70">{{ c.servicio.nombre }}</p>
            </td>
            <td>
              <p class="font-medium">{{ c.nombres }} {{ c.apellidos }}</p>
              <p class="text-xs text-base-content/70">CI {{ c.documento }}</p>
              <a :href="`tel:${c.telefono}`" class="text-xs text-primary hover:underline">
                {{ c.telefono }}
              </a>
            </td>
            <td class="max-w-64">
              <p>
                {{ c.estudianteNombre }}
                <span class="text-base-content/70">· {{ c.estudianteCurso }}</span>
              </p>
              <p class="text-xs text-base-content/70" :title="c.motivo">{{ c.motivo }}</p>
            </td>
            <td>
              <EstadoBadge :estado="c.estado" corto />
              <p v-if="c.motivoRechazo" class="mt-1 max-w-48 text-xs text-base-content/70">
                {{ c.motivoRechazo }}
              </p>
            </td>
            <td>
              <div class="flex justify-end gap-1 whitespace-nowrap">
                <AppButton
                  v-if="c.estado === 'PENDIENTE'"
                  size="sm"
                  :loading="procesando === c.id"
                  @click="aprobar(c)"
                >
                  Aprobar
                </AppButton>
                <AppButton
                  v-if="c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA'"
                  variant="danger-soft"
                  @click="rechazar(c)"
                >
                  Rechazar
                </AppButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-if="meta" :meta="meta" @change="goTo" />

    <RechazarCitaModal v-model="modalOpen" :cita="rechazando" @saved="load()" />
  </section>
</template>
