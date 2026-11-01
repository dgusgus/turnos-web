<script setup lang="ts">
import type { EstadoCita } from "@/api/types";
import { ESTADOS } from "./estados";

// `corto`: para tablas angostas ("Pendiente" en vez de "Pendiente de aprobación").
defineProps<{ estado: EstadoCita; corto?: boolean }>();
</script>

<template>
  <span class="badge badge-soft whitespace-nowrap" :class="ESTADOS[estado].clase">
    {{ corto && estado === "PENDIENTE" ? "Pendiente" : ESTADOS[estado].label }}
  </span>
</template>
