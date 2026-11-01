<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { parseApiError } from "@/api/errors";
import type { PageMeta, Servicio } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppPagination from "@/components/ui/AppPagination.vue";
import { debounce } from "@/lib/debounce";
import { resumirHorarios } from "@/lib/horarios";
import { useToastStore } from "@/stores/toast";
import HorariosModal from "./HorariosModal.vue";
import ServicioFormModal from "./ServicioFormModal.vue";
import { serviciosApi } from "./servicios.api";

// ADMIN: qué trámites ofrece el colegio y en qué horarios. Es la pantalla gemela de Usuarios:
// lista con búsqueda y paginación + modales para crear/editar.
const toast = useToastStore();

const items = ref<Servicio[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(false);
const page = ref(1);
const search = ref("");
const filtro = ref<"todos" | "activos" | "inactivos">("todos");

const formOpen = ref(false);
const horariosOpen = ref(false);
const seleccionado = ref<Servicio | null>(null); // el servicio que se edita (null = nuevo)

async function load() {
  loading.value = true;
  try {
    const res = await serviciosApi.list({
      page: page.value,
      search: search.value.trim() || undefined,
      activo: filtro.value === "todos" ? undefined : filtro.value === "activos",
    });
    items.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    toast.error(parseApiError(e).message);
  } finally {
    loading.value = false;
  }
}

watch(filtro, () => {
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

function goTo(p: number) {
  page.value = p;
  void load();
}

function nuevo() {
  seleccionado.value = null;
  formOpen.value = true;
}
function editar(s: Servicio) {
  seleccionado.value = s;
  formOpen.value = true;
}
function horarios(s: Servicio) {
  seleccionado.value = s;
  horariosOpen.value = true;
}

async function remove(s: Servicio) {
  if (
    !window.confirm(
      `¿Eliminar «${s.nombre}»? Si ya tiene citas o turnos, no se podrá: desactívalo.`,
    )
  )
    return;
  try {
    await serviciosApi.remove(s.id);
    toast.success("Servicio eliminado");
    if (items.value.length === 1 && page.value > 1) page.value -= 1;
    await load();
  } catch (e) {
    toast.error(parseApiError(e).message); // ej. "tiene 5 citas en el historial"
  }
}

onMounted(load);
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold tracking-tight">Servicios y horarios</h1>
      <AppButton @click="nuevo">Nuevo servicio</AppButton>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <select v-model="filtro" aria-label="Estado" class="select w-auto">
        <option value="todos">Todos</option>
        <option value="activos">Activos</option>
        <option value="inactivos">Inactivos</option>
      </select>
      <input
        v-model="search"
        type="search"
        placeholder="Buscar por nombre o letra..."
        aria-label="Buscar servicios"
        class="input w-full sm:w-72"
      />
    </div>

    <div class="tarjeta overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Reserva</th>
            <th>Horario de atención</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && items.length === 0">
            <td colspan="4" class="py-8 text-center text-base-content/70">Cargando...</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="4" class="py-8 text-center text-base-content/70">
              No hay servicios. Crea el primero con «Nuevo servicio».
            </td>
          </tr>
          <tr v-for="s in items" :key="s.id" class="align-top" :class="{ 'opacity-60': !s.activo }">
            <td>
              <p class="flex items-center gap-2 font-medium">
                <span class="badge badge-primary badge-soft font-mono">{{ s.prefijo }}</span>
                {{ s.nombre }}
                <span v-if="!s.activo" class="badge badge-ghost badge-sm">Inactivo</span>
              </p>
              <p v-if="s.descripcion" class="mt-1 max-w-64 text-xs text-base-content/70">
                {{ s.descripcion }}
              </p>
              <p class="mt-1 text-xs text-base-content/70">{{ s.duracionMin }} min por cita</p>
            </td>
            <td>
              <div class="flex flex-col items-start gap-1">
                <span v-if="!s.permiteCita" class="badge badge-ghost badge-sm whitespace-nowrap">
                  Solo ventanilla
                </span>
                <template v-else>
                  <span class="badge badge-success badge-soft badge-sm whitespace-nowrap">
                    Se reserva por internet
                  </span>
                  <span
                    v-if="s.requiereAprobacion"
                    class="badge badge-warning badge-soft badge-sm whitespace-nowrap"
                  >
                    Requiere aprobación
                  </span>
                </template>
              </div>
            </td>
            <td class="text-sm">
              <p v-for="linea in resumirHorarios(s.horarios)" :key="linea">{{ linea }}</p>
              <span
                v-if="s.horarios.length === 0"
                class="badge badge-warning badge-soft whitespace-nowrap"
                title="Sin horarios nadie puede reservar este servicio"
              >
                Sin horarios
              </span>
            </td>
            <td>
              <div class="flex justify-end gap-1 whitespace-nowrap">
                <AppButton size="sm" variant="secondary" @click="horarios(s)">Horarios</AppButton>
                <AppButton size="sm" variant="ghost" @click="editar(s)">Editar</AppButton>
                <AppButton size="sm" variant="danger-soft" @click="remove(s)">Eliminar</AppButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-if="meta" :meta="meta" @change="goTo" />

    <ServicioFormModal v-model="formOpen" :servicio="seleccionado" @saved="load" />
    <HorariosModal v-model="horariosOpen" :servicio="seleccionado" @saved="load" />
  </section>
</template>
