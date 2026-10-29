<script setup lang="ts">
import { RouterLink } from "vue-router";

const opciones = [
  {
    to: "/reservar",
    titulo: "Reservar una cita",
    texto: "Elige el trámite, el día y la hora. No necesitas cuenta.",
  },
  {
    to: "/agenda",
    titulo: "Agenda del día",
    texto: "Mira qué horarios están ocupados y el estado de las citas de hoy.",
  },
  {
    to: "/mi-cita",
    titulo: "Mi cita",
    texto: "Revisa si te aprobaron o rechazaron la cita, o cancélala.",
  },
];
</script>

<template>
  <section class="space-y-8">
    <div class="space-y-3">
      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Evita las filas</h1>
      <p class="max-w-xl text-slate-600">
        Reserva tu cita desde el celular y llega a la hora indicada. Si vienes al colegio sin cita,
        pide tu turno en ventanilla: el personal te lo genera en el momento.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <RouterLink
        v-for="o in opciones"
        :key="o.to"
        :to="o.to"
        class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300"
      >
        <h2 class="font-medium">{{ o.titulo }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ o.texto }}</p>
      </RouterLink>
    </div>
  </section>
</template>
