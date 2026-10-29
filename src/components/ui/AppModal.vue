<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

defineProps<{ title: string }>();

// v-model: <AppModal v-model="abierto" title="...">
const open = defineModel<boolean>({ required: true });

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") open.value = false;
};
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="open = false"
    >
      <div role="dialog" aria-modal="true" class="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <header class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 class="text-base font-semibold">{{ title }}</h2>
          <button
            type="button"
            class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
            @click="open = false"
          >
            ✕
          </button>
        </header>
        <div class="p-5">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
