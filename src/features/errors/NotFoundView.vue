<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="flex min-h-screen flex-col items-center justify-center text-center">
    <p class="text-5xl font-semibold text-slate-300">404</p>
    <h1 class="mt-3 text-xl font-semibold">Página no encontrada</h1>
    <RouterLink to="/" class="mt-4 text-sm font-medium text-indigo-600 hover:underline">
      Volver al inicio
    </RouterLink>
  </section>
</template>
