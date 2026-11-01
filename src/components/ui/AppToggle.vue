<script setup lang="ts">
import { useId } from "vue";

// Interruptor sí/no con título y una línea de ayuda opcional.
defineProps<{ label: string; hint?: string }>();

const model = defineModel<boolean>({ required: true });
const id = useId();
</script>

<template>
  <div class="flex items-start gap-3">
    <input :id="id" v-model="model" type="checkbox" class="toggle toggle-primary mt-0.5" />
    <label :for="id" class="cursor-pointer">
      <span class="block text-sm font-medium">{{ label }}</span>
      <span v-if="hint" class="block text-xs text-base-content/70">{{ hint }}</span>
    </label>
  </div>
</template>
