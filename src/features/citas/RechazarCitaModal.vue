<script setup lang="ts">
import { ref, watch } from "vue";
import { parseApiError } from "@/api/errors";
import type { CitaStaff } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppModal from "@/components/ui/AppModal.vue";
import { useToastStore } from "@/stores/toast";
import { citasApi } from "./citas.api";

const props = defineProps<{ cita: CitaStaff | null }>();
const emit = defineEmits<{ saved: [] }>();
const open = defineModel<boolean>({ required: true });

const toast = useToastStore();
const motivo = ref("");
const error = ref("");
const saving = ref(false);

// Motivos frecuentes: un clic y el operador solo ajusta el texto.
const SUGERENCIAS = [
  "El horario ya no está disponible. Por favor reserva otro.",
  "La autoridad no atiende ese día.",
  "Faltan datos o son incorrectos. Reserva de nuevo.",
];

watch(open, (isOpen) => {
  if (!isOpen) return;
  motivo.value = "";
  error.value = "";
});

async function submit() {
  if (!props.cita) return;
  if (motivo.value.trim().length < 3) {
    error.value = "Escribe el motivo: lo leerá quien reservó";
    return;
  }
  saving.value = true;
  try {
    await citasApi.rechazar(props.cita.id, motivo.value.trim());
    toast.success("Cita rechazada");
    open.value = false;
    emit("saved");
  } catch (e) {
    const info = parseApiError(e);
    error.value = info.fieldErrors.motivo ?? info.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AppModal v-model="open" title="Rechazar cita">
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <p v-if="cita" class="text-sm text-slate-600">
        <span class="font-mono font-medium">{{ cita.codigo }}</span> · {{ cita.nombres }}
        {{ cita.apellidos }}. La persona verá este motivo al consultar su cita.
      </p>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="s in SUGERENCIAS"
          :key="s"
          type="button"
          class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
          @click="motivo = s"
        >
          {{ s }}
        </button>
      </div>

      <div>
        <label for="motivo-rechazo" class="block text-sm font-medium text-slate-700">Motivo</label>
        <textarea
          id="motivo-rechazo"
          v-model="motivo"
          rows="3"
          maxlength="300"
          class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <p v-if="error" role="alert" class="mt-1 text-xs text-red-600">{{ error }}</p>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <AppButton variant="secondary" @click="open = false">Cancelar</AppButton>
        <AppButton type="submit" variant="danger" :loading="saving">Rechazar cita</AppButton>
      </div>
    </form>
  </AppModal>
</template>
