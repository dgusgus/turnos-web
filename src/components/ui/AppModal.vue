<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

defineProps<{ title: string; wide?: boolean }>();

// v-model: <AppModal v-model="abierto" title="...">
const open = defineModel<boolean>({ required: true });

// Usa la etiqueta nativa <dialog>: el NAVEGADOR se encarga de poner el modal encima de todo,
// atrapar el foco dentro, bloquear lo de atrás y cerrar con Esc. Nosotros solo la abrimos/cerramos.
const dialog = ref<HTMLDialogElement | null>(null);

watch(
  open,
  async (abierto) => {
    await nextTick(); // espera a que el <dialog> exista en el DOM
    const d = dialog.value;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  },
  { immediate: true, flush: "post" },
);

onBeforeUnmount(() => dialog.value?.close());
</script>

<template>
  <!-- @close se dispara con Esc o con d.close(): así v-model siempre queda sincronizado -->
  <dialog ref="dialog" class="modal" @close="open = false">
    <div class="modal-box" :class="wide && 'max-w-2xl'">
      <form method="dialog">
        <button class="btn btn-circle btn-ghost btn-sm absolute top-3 right-3" aria-label="Cerrar">
          ✕
        </button>
      </form>
      <h2 class="mb-4 pr-8 text-base font-semibold">{{ title }}</h2>
      <slot v-if="open" />
    </div>
    <!-- Clic fuera del cuadro = cerrar -->
    <form method="dialog" class="modal-backdrop"><button aria-label="Cerrar">cerrar</button></form>
  </dialog>
</template>
