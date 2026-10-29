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
    <label :for="id" class="block text-sm font-medium text-slate-700">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :aria-invalid="error ? 'true' : undefined"
      v-bind="$attrs"
      class="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2"
      :class="
        error
          ? 'border-red-400 focus:ring-red-200'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
      "
    />
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </div>
</template>
