<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { parseApiError } from "@/api/errors";
import type { Servicio } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppModal from "@/components/ui/AppModal.vue";
import AppSelect from "@/components/ui/AppSelect.vue";
import AppTextarea from "@/components/ui/AppTextarea.vue";
import AppToggle from "@/components/ui/AppToggle.vue";
import { useToastStore } from "@/stores/toast";
import { serviciosApi } from "./servicios.api";

// Un solo formulario para CREAR y EDITAR: si llega `servicio` es edición, si es null es alta.
const props = defineProps<{ servicio: Servicio | null }>();
const emit = defineEmits<{ saved: [] }>();
const open = defineModel<boolean>({ required: true });

const toast = useToastStore();
const editando = computed(() => props.servicio !== null);

const form = reactive({
  nombre: "",
  prefijo: "",
  descripcion: "",
  duracionMin: 15,
  permiteCita: true,
  requiereAprobacion: false,
  activo: true,
});
const errors = ref<Record<string, string>>({});
const saving = ref(false);

// Duraciones habituales. Si el servicio tiene una rara (ej. 25), también aparece en la lista.
const DURACIONES = [5, 10, 15, 20, 30, 45, 60, 90, 120];
const duraciones = computed(() =>
  DURACIONES.includes(form.duracionMin)
    ? DURACIONES
    : [...DURACIONES, form.duracionMin].sort((a, b) => a - b),
);

// Cada vez que se abre, el formulario se llena con el servicio (o se vacía).
watch(open, (isOpen) => {
  if (!isOpen) return;
  errors.value = {};
  const s = props.servicio;
  Object.assign(form, {
    nombre: s?.nombre ?? "",
    prefijo: s?.prefijo ?? "",
    descripcion: s?.descripcion ?? "",
    duracionMin: s?.duracionMin ?? 15,
    permiteCita: s?.permiteCita ?? true,
    requiereAprobacion: s?.requiereAprobacion ?? false,
    activo: s?.activo ?? true,
  });
});

async function submit() {
  const found: Record<string, string> = {};
  if (form.nombre.trim().length < 2) found.nombre = "Mínimo 2 caracteres";
  if (!/^[A-Za-z]{1,2}$/.test(form.prefijo.trim())) found.prefijo = "1 o 2 letras (A-Z)";
  errors.value = found;
  if (Object.keys(found).length > 0) return;

  const input = {
    nombre: form.nombre.trim(),
    prefijo: form.prefijo.trim().toUpperCase(),
    descripcion: form.descripcion.trim() || null,
    duracionMin: form.duracionMin,
    permiteCita: form.permiteCita,
    requiereAprobacion: form.requiereAprobacion,
    activo: form.activo,
  };

  saving.value = true;
  try {
    if (props.servicio) {
      const { advertencias } = await serviciosApi.update(props.servicio.id, input);
      toast.success("Servicio actualizado");
      advertencias.forEach((a) => toast.info(a)); // ej. "hay 3 citas vigentes..."
    } else {
      await serviciosApi.create(input);
      toast.success("Servicio creado. Ahora define sus horarios.");
    }
    open.value = false;
    emit("saved");
  } catch (e) {
    const info = parseApiError(e);
    errors.value = info.fieldErrors; // ej. prefijo repetido: el backend dice cuál choca
    toast.error(info.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AppModal v-model="open" :title="editando ? 'Editar servicio' : 'Nuevo servicio'">
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <AppInput v-model="form.nombre" label="Nombre" maxlength="80" :error="errors.nombre" />
        <AppInput
          v-model="form.prefijo"
          label="Letra del turno"
          maxlength="2"
          placeholder="A"
          class="uppercase"
          :error="errors.prefijo"
        />
      </div>
      <AppTextarea
        v-model="form.descripcion"
        label="Descripción (la ve el público al reservar)"
        rows="2"
        maxlength="300"
        :error="errors.descripcion"
      />
      <AppSelect
        v-model="form.duracionMin"
        label="Duración de cada cita"
        :error="errors.duracionMin"
      >
        <option v-for="d in duraciones" :key="d" :value="d">{{ d }} minutos</option>
      </AppSelect>

      <div class="space-y-3 rounded-box bg-base-200 p-4">
        <AppToggle
          v-model="form.permiteCita"
          label="Se puede reservar cita por internet"
          hint="Si lo apagas, solo se atiende con turno en ventanilla."
        />
        <AppToggle
          v-model="form.requiereAprobacion"
          label="El personal debe aprobar cada cita"
          hint="La cita queda «pendiente» hasta que un operador la apruebe o rechace."
        />
        <AppToggle
          v-if="editando"
          v-model="form.activo"
          label="Servicio activo"
          hint="Si lo desactivas deja de ofrecerse, pero se conserva su historial."
        />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <AppButton variant="secondary" @click="open = false">Cancelar</AppButton>
        <AppButton type="submit" :loading="saving">{{ editando ? "Guardar" : "Crear" }}</AppButton>
      </div>
    </form>
  </AppModal>
</template>
