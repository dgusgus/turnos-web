<script setup lang="ts">
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

// Tipo de aviso → clase de daisyUI (alert-success, alert-error, alert-info).
const styles = { success: "alert-success", error: "alert-error", info: "alert-info" };
</script>

<template>
  <div class="toast toast-end toast-bottom z-50 w-80 max-w-[calc(100vw-2rem)]">
    <div v-for="t in toast.toasts" :key="t.id" role="status" class="alert" :class="styles[t.type]">
      <span class="text-sm">{{ t.message }}</span>
      <button
        type="button"
        aria-label="Cerrar aviso"
        class="btn btn-ghost btn-xs btn-circle"
        @click="toast.remove(t.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>
