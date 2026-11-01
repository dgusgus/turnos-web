<script setup lang="ts">
import { RouterView } from "vue-router";
import TemaSelector from "@/components/ui/TemaSelector.vue";
import { APP_NAME } from "@/lib/format";
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <div class="absolute top-4 right-4"><TemaSelector /></div>
    <div class="w-full max-w-sm">
      <h1 class="mb-6 text-center text-2xl font-semibold tracking-tight text-primary">
        {{ APP_NAME }}
      </h1>
      <div class="tarjeta p-6">
        <RouterView />
      </div>
    </div>
  </main>
</template>
