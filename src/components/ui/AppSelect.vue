<script setup lang="ts">
import { useId } from "vue";

// Las <option> van en el slot:  <AppSelect v-model="x" label="Día"><option value="1">Lunes</option></AppSelect>
defineOptions({ inheritAttrs: false });

defineProps<{ label?: string; error?: string }>();

const model = defineModel<string | number>({ required: true });
const id = useId();
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-sm font-medium">{{ label }}</label>
    <select
      :id="id"
      v-model="model"
      :aria-invalid="error ? 'true' : undefined"
      :aria-label="label ? undefined : ($attrs['aria-label'] as string | undefined)"
      v-bind="$attrs"
      class="select w-full"
      :class="{ 'select-error': error }"
    >
      <slot />
    </select>
    <p v-if="error" class="mt-1 text-xs text-error">{{ error }}</p>
  </div>
</template>
