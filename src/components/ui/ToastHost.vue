<script setup lang="ts">
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

const styles = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-slate-800",
};
</script>

<template>
  <div class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
    <div
      v-for="t in toast.toasts"
      :key="t.id"
      role="status"
      class="pointer-events-auto flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg"
      :class="styles[t.type]"
    >
      <span>{{ t.message }}</span>
      <button
        type="button"
        aria-label="Cerrar aviso"
        class="opacity-70 hover:opacity-100"
        @click="toast.remove(t.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>
