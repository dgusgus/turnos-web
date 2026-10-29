<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { parseApiError } from "@/api/errors";
import type { Rol } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppModal from "@/components/ui/AppModal.vue";
import { useToastStore } from "@/stores/toast";
import { usersApi } from "./users.api";

const emit = defineEmits<{ saved: [] }>();
const open = defineModel<boolean>({ required: true });

const toast = useToastStore();
const form = reactive({
  nombre: "",
  email: "",
  password: "",
  rol: "OPERADOR" as Rol,
});
const errors = ref<Record<string, string>>({});
const saving = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, { nombre: "", email: "", password: "", rol: "OPERADOR" });
  errors.value = {};
});

async function submit() {
  const found: Record<string, string> = {};
  if (form.nombre.trim().length < 2) found.nombre = "Mínimo 2 caracteres";
  if (!form.email.includes("@")) found.email = "Email inválido";
  if (form.password.length < 8) found.password = "Mínimo 8 caracteres";
  errors.value = found;
  if (Object.keys(found).length > 0) return;

  saving.value = true;
  try {
    await usersApi.create({
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      password: form.password,
      rol: form.rol,
    });
    toast.success("Usuario creado");
    open.value = false;
    emit("saved");
  } catch (e) {
    const info = parseApiError(e);
    errors.value = info.fieldErrors;
    toast.error(info.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AppModal v-model="open" title="Nuevo usuario del personal">
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <AppInput v-model="form.nombre" label="Nombre" :error="errors.nombre" />
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="off"
        :error="errors.email"
      />
      <AppInput
        v-model="form.password"
        label="Contraseña inicial"
        type="password"
        autocomplete="new-password"
        :error="errors.password"
      />
      <div>
        <label for="rol" class="block text-sm font-medium text-slate-700">Rol</label>
        <select
          id="rol"
          v-model="form.rol"
          class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="OPERADOR">Operador (atiende turnos)</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <AppButton variant="secondary" @click="open = false">Cancelar</AppButton>
        <AppButton type="submit" :loading="saving">Crear</AppButton>
      </div>
    </form>
  </AppModal>
</template>
