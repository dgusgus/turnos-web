<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "danger" | "danger-soft" | "ghost";
    size?: "sm" | "md";
    type?: "button" | "submit";
    loading?: boolean;
    disabled?: boolean;
  }>(),
  { variant: "primary", size: "md", type: "button", loading: false, disabled: false },
);

// Cada variante = clases de daisyUI. El secundario lleva borde y fondo propios: el "btn" de fábrica
// se confunde con el fondo de la página.
const styles = {
  primary: "btn btn-primary",
  secondary: "btn border-base-300 bg-base-100 hover:bg-base-200",
  danger: "btn btn-error",
  "danger-soft": "btn btn-error btn-soft",
  ghost: "btn btn-ghost",
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[styles[variant], size === 'sm' && 'btn-sm']"
  >
    <span v-if="loading" class="loading loading-spinner loading-xs" aria-hidden="true" />
    <slot />
  </button>
</template>
