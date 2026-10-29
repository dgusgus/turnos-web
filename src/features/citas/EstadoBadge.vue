<script setup lang="ts">
import type { EstadoCita } from "@/api/types";
import { ESTADOS } from "./estados";

// `corto`: para tablas angostas ("Pendiente" en vez de "Pendiente de aprobación").
defineProps<{ estado: EstadoCita; corto?: boolean }>();
</script>

<template>
  <span
    class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset"
    :class="ESTADOS[estado].clase"
  >
    {{ corto && estado === "PENDIENTE" ? "Pendiente" : ESTADOS[estado].label }}
  </span>
</template>
