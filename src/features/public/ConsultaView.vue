<script setup lang="ts">
import { reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { parseApiError } from "@/api/errors";
import type { CitaConsulta } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import EstadoBadge from "@/features/citas/EstadoBadge.vue";
import { formatDateTime } from "@/lib/format";
import { getMisCitas, quitarMiCita, type MiCitaGuardada } from "@/lib/misCitas";
import { publicApi } from "./public.api";

// "Mi cita": dos formas de volver a ver una cita sin tener cuenta.
//  1) Las guardadas en este dispositivo (se guardó el enlace al reservar).
//  2) Código + CI, para quien perdió el enlace. Muestra el estado, pero NO permite cancelar.

const guardadas = ref<MiCitaGuardada[]>(getMisCitas());

function quitar(token: string) {
  quitarMiCita(token);
  guardadas.value = getMisCitas();
}

const form = reactive({ codigo: "", documento: "" });
const errors = ref<Record<string, string>>({});
const formError = ref("");
const cargando = ref(false);
const cita = ref<CitaConsulta | null>(null);

async function consultar() {
  errors.value = {};
  formError.value = "";
  cita.value = null;
  if (!form.codigo.trim()) errors.value.codigo = "Escribe el código (ej. R-K7M2Q)";
  if (!form.documento.trim()) errors.value.documento = "Escribe tu CI";
  if (Object.keys(errors.value).length > 0) return;

  cargando.value = true;
  try {
    cita.value = await publicApi.consultar(form.codigo, form.documento);
  } catch (e) {
    const info = parseApiError(e);
    errors.value = info.fieldErrors;
    formError.value = info.message;
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-xl space-y-8">
    <h1 class="text-2xl font-semibold tracking-tight">Mi cita</h1>

    <div v-if="guardadas.length > 0" class="space-y-3">
      <h2 class="font-medium">Guardadas en este dispositivo</h2>
      <ul class="tarjeta">
        <li
          v-for="c in guardadas"
          :key="c.token"
          class="flex items-center justify-between gap-3 px-4 py-3"
        >
          <RouterLink :to="{ name: 'cita', params: { token: c.token } }" class="min-w-0 flex-1">
            <p class="font-mono text-sm font-medium text-primary">{{ c.codigo }}</p>
            <p class="truncate text-sm text-base-content/80">
              {{ c.servicio }} · {{ formatDateTime(c.inicio) }}
            </p>
          </RouterLink>
          <AppButton
            variant="ghost"
            :aria-label="`Quitar ${c.codigo} de este dispositivo`"
            @click="quitar(c.token)"
          >
            Quitar
          </AppButton>
        </li>
      </ul>
    </div>

    <form class="space-y-4 tarjeta p-6" novalidate @submit.prevent="consultar">
      <div>
        <h2 class="font-medium">¿Perdiste tu enlace?</h2>
        <p class="mt-1 text-sm text-base-content/80">
          Escribe el código de tu cita y tu CI para ver su estado.
        </p>
      </div>
      <AppInput
        v-model="form.codigo"
        label="Código de la cita"
        placeholder="R-K7M2Q"
        autocomplete="off"
        :error="errors.codigo"
      />
      <AppInput v-model="form.documento" label="CI" autocomplete="off" :error="errors.documento" />

      <p v-if="formError" role="alert" class="alert alert-error alert-soft text-sm">
        {{ formError }}
      </p>
      <AppButton type="submit" :loading="cargando">Consultar</AppButton>
    </form>

    <div v-if="cita" class="space-y-3 tarjeta p-6">
      <p class="font-mono text-3xl font-semibold tracking-wider text-primary">
        {{ cita.codigo }}
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <EstadoBadge :estado="cita.estado" />
        <span class="text-sm text-base-content/80">
          {{ cita.servicio.nombre }} · {{ formatDateTime(cita.inicio) }}
        </span>
      </div>
      <div v-if="cita.motivoRechazo" class="alert alert-error alert-soft text-sm">
        <div>
          <p class="font-medium">Motivo del rechazo</p>
          <p>{{ cita.motivoRechazo }}</p>
          <RouterLink to="/reservar" class="link mt-2 inline-block font-medium">
            Reservar otro horario
          </RouterLink>
        </div>
      </div>
      <p class="text-xs text-base-content/70">
        Para cancelar la cita necesitas el enlace que recibiste al reservar.
      </p>
    </div>
  </section>
</template>
