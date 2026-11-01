<script setup lang="ts">
import type { PageMeta } from "@/api/types";
import AppButton from "./AppButton.vue";

defineProps<{ meta: PageMeta }>();
defineEmits<{ change: [page: number] }>();
</script>

<template>
  <div class="flex items-center justify-between gap-3 text-sm text-base-content/80">
    <span>Página {{ meta.page }} de {{ meta.totalPages }} · {{ meta.total }} resultados</span>
    <div class="flex gap-2">
      <AppButton size="sm" :disabled="meta.page <= 1" @click="$emit('change', meta.page - 1)">
        Anterior
      </AppButton>
      <AppButton
        size="sm"
        :disabled="meta.page >= meta.totalPages"
        @click="$emit('change', meta.page + 1)"
      >
        Siguiente
      </AppButton>
    </div>
  </div>
</template>
