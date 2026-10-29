<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="py-16 text-center">
    <p class="text-5xl font-semibold text-slate-300">403</p>
    <h1 class="mt-3 text-xl font-semibold">No tienes permiso para ver esta página</h1>
    <RouterLink
      to="/panel"
      class="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
    >
      Volver al inicio
    </RouterLink>
  </section>
</template>
