<script setup lang="ts">
import { useId } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{ label: string; error?: string }>();

const model = defineModel<string>({ required: true });
const id = useId();
</script>

<template>
  <div>
    <label :for="id" class="mb-1 block text-sm font-medium">{{ label }}</label>
    <textarea
      :id="id"
      v-model="model"
      :aria-invalid="error ? 'true' : undefined"
      v-bind="$attrs"
      class="textarea w-full"
      :class="{ 'textarea-error': error }"
    />
    <p v-if="error" class="mt-1 text-xs text-error">{{ error }}</p>
  </div>
</template>
