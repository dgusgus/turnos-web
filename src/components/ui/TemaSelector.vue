<script setup lang="ts">
import { MARCAS, useTema, type Modo } from "@/lib/tema";

// Menú de apariencia: modo (claro/oscuro/sistema) y color de marca.
// Se abre con el foco (patrón "dropdown" de daisyUI): sin JavaScript propio.
const { modo, marca } = useTema();

const modos: { id: Modo; label: string }[] = [
  { id: "sistema", label: "Auto" },
  { id: "claro", label: "Claro" },
  { id: "oscuro", label: "Oscuro" },
];
</script>

<template>
  <div class="dropdown dropdown-end">
    <div
      tabindex="0"
      role="button"
      class="btn btn-ghost btn-sm btn-square"
      aria-label="Apariencia"
      title="Apariencia"
    >
      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
      </svg>
    </div>
    <div
      tabindex="0"
      class="dropdown-content z-30 mt-2 w-64 space-y-4 rounded-box border border-base-300 bg-base-100 p-4 shadow-lg"
    >
      <div>
        <p class="mb-2 text-xs font-medium text-base-content/70">Modo</p>
        <div class="join w-full">
          <button
            v-for="m in modos"
            :key="m.id"
            type="button"
            class="btn btn-sm join-item flex-1"
            :class="{ 'btn-active btn-primary': modo === m.id }"
            :aria-pressed="modo === m.id"
            @click="modo = m.id"
          >
            {{ m.label }}
          </button>
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs font-medium text-base-content/70">Color</p>
        <div class="flex gap-3">
          <button
            v-for="m in MARCAS"
            :key="m.id"
            type="button"
            :title="m.nombre"
            :aria-label="m.nombre"
            :aria-pressed="marca === m.id"
            class="size-8 rounded-full ring-offset-2 ring-offset-base-100 transition"
            :class="marca === m.id ? 'ring-2 ring-base-content' : 'hover:scale-110'"
            :style="{ background: m.color }"
            @click="marca = m.id"
          />
        </div>
      </div>
    </div>
  </div>
</template>
