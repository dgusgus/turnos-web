<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { parseApiError } from "@/api/errors";
import type { DiaNoLaborable, PageMeta } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppPagination from "@/components/ui/AppPagination.vue";
import { formatDay, hoyISO } from "@/lib/format";
import { useToastStore } from "@/stores/toast";
import { diasApi } from "./dias.api";

// ADMIN: feriados, vacaciones, suspensión de clases. Ese día NADIE puede reservar,
// aunque el servicio tenga horario.
const toast = useToastStore();

const items = ref<DiaNoLaborable[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(false);
const page = ref(1);

const form = reactive({ fecha: "", motivo: "" });
const errors = ref<Record<string, string>>({});
const saving = ref(false);

async function load() {
  loading.value = true;
  try {
    const res = await diasApi.list({ page: page.value });
    items.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    toast.error(parseApiError(e).message);
  } finally {
    loading.value = false;
  }
}

function goTo(p: number) {
  page.value = p;
  void load();
}

async function agregar() {
  const found: Record<string, string> = {};
  if (!form.fecha) found.fecha = "Elige la fecha";
  if (form.motivo.trim().length < 3) found.motivo = "Escribe el motivo (ej. Feriado nacional)";
  errors.value = found;
  if (Object.keys(found).length > 0) return;

  saving.value = true;
  try {
    const { advertencias } = await diasApi.create({
      fecha: form.fecha,
      motivo: form.motivo.trim(),
    });
    toast.success("Día marcado como no laborable");
    advertencias.forEach((a) => toast.info(a)); // ej. "ese día ya hay 4 citas vigentes"
    Object.assign(form, { fecha: "", motivo: "" });
    await load();
  } catch (e) {
    const info = parseApiError(e);
    errors.value = info.fieldErrors;
    toast.error(info.message);
  } finally {
    saving.value = false;
  }
}

async function quitar(d: DiaNoLaborable) {
  if (!window.confirm(`¿Volver a habilitar el ${formatDay(d.fecha)}?`)) return;
  try {
    await diasApi.remove(d.id);
    toast.success("Día habilitado");
    if (items.value.length === 1 && page.value > 1) page.value -= 1;
    await load();
  } catch (e) {
    toast.error(parseApiError(e).message);
  }
}

onMounted(load);
</script>

<template>
  <section class="space-y-4">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Días no laborables</h1>
      <p class="mt-1 text-sm text-base-content/70">
        Feriados, vacaciones o suspensión de actividades. Ese día no se podrán reservar citas.
      </p>
    </div>

    <form
      class="tarjeta grid gap-4 p-4 sm:grid-cols-[11rem_1fr_auto] sm:items-start"
      novalidate
      @submit.prevent="agregar"
    >
      <AppInput
        v-model="form.fecha"
        label="Fecha"
        type="date"
        :min="hoyISO()"
        :error="errors.fecha"
      />
      <AppInput
        v-model="form.motivo"
        label="Motivo"
        maxlength="120"
        placeholder="Feriado nacional"
        :error="errors.motivo"
      />
      <AppButton type="submit" class="sm:mt-6" :loading="saving">Agregar</AppButton>
    </form>

    <div class="tarjeta overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Motivo</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && items.length === 0">
            <td colspan="3" class="py-8 text-center text-base-content/70">Cargando...</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="3" class="py-8 text-center text-base-content/70">
              No hay días no laborables próximos.
            </td>
          </tr>
          <tr v-for="d in items" :key="d.id">
            <td class="font-medium whitespace-nowrap">{{ formatDay(d.fecha) }}</td>
            <td>{{ d.motivo }}</td>
            <td>
              <div class="flex justify-end">
                <AppButton size="sm" variant="danger-soft" @click="quitar(d)">Quitar</AppButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-if="meta" :meta="meta" @change="goTo" />
  </section>
</template>
