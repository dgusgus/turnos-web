<script setup lang="ts">
import { RouterView } from "vue-router";
import { APP_NAME } from "@/lib/format";
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <h1 class="mb-6 text-center text-2xl font-semibold tracking-tight text-indigo-700">
        {{ APP_NAME }}
      </h1>
      <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <RouterView />
      </div>
    </div>
  </main>
</template>
