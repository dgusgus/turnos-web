<script setup lang="ts">
import { useId } from "vue";

// Atributos extra (placeholder, autocomplete, min, step...) pasan directo al <input>.
defineOptions({ inheritAttrs: false });

defineProps<{ label: string; type?: string; error?: string }>();

const model = defineModel<string>({ required: true });
const id = useId();
</script>

<template>
  <div>
    <label :for="id" class="mb-1 block text-sm font-medium">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :aria-invalid="error ? 'true' : undefined"
      v-bind="$attrs"
      class="input w-full"
      :class="{ 'input-error': error }"
    />
    <p v-if="error" class="mt-1 text-xs text-error">{{ error }}</p>
  </div>
</template>
