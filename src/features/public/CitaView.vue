<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { parseApiError } from "@/api/errors";
import type { CitaSeguimiento } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import EstadoBadge from "@/features/citas/EstadoBadge.vue";
import { formatDateTime } from "@/lib/format";
import { getMisCitas, guardarMiCita, quitarMiCita } from "@/lib/misCitas";
import { usePolling } from "@/lib/polling";
import { useToastStore } from "@/stores/toast";
import { publicApi } from "./public.api";

// "Mi cita" con el ENLACE SECRETO (/cita/:token): estado, motivo de rechazo y cancelar.
const route = useRoute();
const toast = useToastStore();

const token = computed(() => String(route.params.token ?? ""));
const cita = ref<CitaSeguimiento | null>(null);
const cargando = ref(true);
const error = ref("");
const cancelando = ref(false);
const guardada = ref(getMisCitas().some((c) => c.token === token.value));

async function cargar() {
  try {
    cita.value = await publicApi.citaPorToken(token.value);
    error.value = "";
  } catch (e) {
    // En una actualización automática, un fallo de red no borra la cita que ya se mostraba
    if (!cita.value) error.value = parseApiError(e).message;
  } finally {
    cargando.value = false;
  }
}

// Mientras espera la aprobación, se revisa sola cada tanto.
usePolling(() => {
  if (cita.value?.estado === "PENDIENTE") void cargar();
}, 30);

async function cancelar() {
  if (!window.confirm("¿Cancelar esta cita? Tu horario quedará libre para otra persona.")) return;
  cancelando.value = true;
  try {
    cita.value = await publicApi.cancelar(token.value);
    toast.success("Cita cancelada");
  } catch (e) {
    toast.error(parseApiError(e).message);
    await cargar();
  } finally {
    cancelando.value = false;
  }
}

function alternarGuardada() {
  if (!cita.value) return;
  if (guardada.value) {
    quitarMiCita(token.value);
  } else {
    guardarMiCita({
      token: token.value,
      codigo: cita.value.codigo,
      inicio: cita.value.inicio,
      servicio: cita.value.servicio.nombre,
    });
  }
  guardada.value = getMisCitas().some((c) => c.token === token.value);
}

onMounted(cargar);
</script>

<template>
  <section class="mx-auto max-w-xl space-y-5">
    <p v-if="cargando" class="text-slate-500">Cargando tu cita...</p>

    <div
      v-else-if="error"
      class="space-y-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <h1 class="text-lg font-semibold">No pudimos abrir esta cita</h1>
      <p role="alert" class="text-sm text-slate-600">{{ error }}</p>
      <RouterLink to="/mi-cita" class="text-sm font-medium text-indigo-600 hover:underline">
        Buscarla con mi código y CI
      </RouterLink>
    </div>

    <template v-else-if="cita">
      <div class="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <p class="text-sm text-slate-500">Código de tu cita</p>
          <p class="font-mono text-4xl font-semibold tracking-wider text-indigo-700">
            {{ cita.codigo }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <EstadoBadge :estado="cita.estado" />
          <span class="text-sm text-slate-600">
            {{ cita.servicio.nombre }} · {{ formatDateTime(cita.inicio) }}
          </span>
        </div>

        <p
          v-if="cita.estado === 'PENDIENTE'"
          class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          El colegio todavía no responde. Esta página se actualiza sola; también puedes volver más
          tarde con tu enlace.
        </p>
        <p v-else-if="cita.estado === 'CONFIRMADA'" class="text-sm text-slate-600">
          Llega unos minutos antes y lleva tu carnet de identidad.
        </p>
        <div
          v-else-if="cita.estado === 'RECHAZADA'"
          class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <p class="font-medium">Motivo del rechazo</p>
          <p>{{ cita.motivoRechazo ?? "Sin motivo indicado." }}</p>
          <RouterLink to="/reservar" class="mt-2 inline-block font-medium text-red-900 underline">
            Reservar otro horario
          </RouterLink>
        </div>

        <dl class="grid gap-x-6 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-slate-500">A nombre de</dt>
            <dd class="font-medium">{{ cita.nombres }} {{ cita.apellidos }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Estudiante</dt>
            <dd class="font-medium">{{ cita.estudianteNombre }} · {{ cita.estudianteCurso }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-slate-500">Motivo</dt>
            <dd>{{ cita.motivo }}</dd>
          </div>
        </dl>
      </div>

      <div class="flex flex-wrap gap-2">
        <AppButton
          v-if="cita.puedeCancelar"
          variant="danger"
          :loading="cancelando"
          @click="cancelar"
        >
          Cancelar cita
        </AppButton>
        <AppButton variant="secondary" @click="alternarGuardada">
          {{ guardada ? "Quitar de este dispositivo" : "Guardar en este dispositivo" }}
        </AppButton>
        <RouterLink to="/agenda"
          ><AppButton variant="ghost">Ver agenda del día</AppButton></RouterLink
        >
      </div>
    </template>
  </section>
</template>
