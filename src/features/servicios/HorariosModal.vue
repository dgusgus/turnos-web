<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { parseApiError } from "@/api/errors";
import type { Servicio, VentanaInput } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppModal from "@/components/ui/AppModal.vue";
import { citasEnVentana, DIAS, validarVentanas } from "@/lib/horarios";
import { useToastStore } from "@/stores/toast";
import { serviciosApi } from "./servicios.api";

// Editor del horario SEMANAL de un servicio. Se edita una copia local; solo al pulsar
// «Guardar» se manda todo junto al backend (PUT reemplaza la semana completa).
const props = defineProps<{ servicio: Servicio | null }>();
const emit = defineEmits<{ saved: [] }>();
const open = defineModel<boolean>({ required: true });

const toast = useToastStore();
const ventanas = ref<VentanaInput[]>([]);
const error = ref("");
const saving = ref(false);

watch(open, (isOpen) => {
  if (!isOpen || !props.servicio) return;
  error.value = "";
  // Copia: así «Cancelar» descarta los cambios sin tocar el servicio original.
  ventanas.value = props.servicio.horarios.map(({ diaSemana, desde, hasta }) => ({
    diaSemana,
    desde,
    hasta,
  }));
});

const duracion = computed(() => props.servicio?.duracionMin ?? 15);

// La semana agrupada por día, para dibujarla. Los tramos son los MISMOS objetos de `ventanas`,
// por eso editar un <input> los modifica directamente.
const semana = computed(() =>
  DIAS.map((d) => ({
    ...d,
    tramos: ventanas.value
      .filter((v) => v.diaSemana === d.n)
      .sort((a, b) => a.desde.localeCompare(b.desde)),
  })),
);

const totalPorDia = (n: number) =>
  ventanas.value
    .filter((v) => v.diaSemana === n)
    .reduce((suma, v) => suma + citasEnVentana(v, duracion.value), 0);

function agregar(dia: number) {
  const ultimo = ventanas.value.filter((v) => v.diaSemana === dia).at(-1);
  // Sugerencia: si ya hay un tramo, el nuevo empieza donde termina el último.
  ventanas.value.push(
    ultimo
      ? { diaSemana: dia, desde: ultimo.hasta, hasta: "18:00" }
      : { diaSemana: dia, desde: "08:00", hasta: "12:00" },
  );
}

function quitar(v: VentanaInput) {
  ventanas.value.splice(ventanas.value.indexOf(v), 1);
}

// Atajo: copia los tramos del lunes a martes-viernes (lo más común en un colegio).
function copiarLunesADiasHabiles() {
  const lunes = ventanas.value.filter((v) => v.diaSemana === 1);
  ventanas.value = [
    ...lunes,
    ...[2, 3, 4, 5].flatMap((d) => lunes.map((v) => ({ ...v, diaSemana: d }))),
    ...ventanas.value.filter((v) => v.diaSemana >= 6),
  ];
}

async function submit() {
  if (!props.servicio) return;
  const problema = validarVentanas(ventanas.value, duracion.value);
  if (problema) {
    error.value = problema;
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    const { advertencias } = await serviciosApi.setHorarios(props.servicio.id, ventanas.value);
    toast.success("Horarios guardados");
    advertencias.forEach((a) => toast.info(a));
    open.value = false;
    emit("saved");
  } catch (e) {
    error.value = parseApiError(e).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AppModal v-model="open" :title="`Horarios · ${servicio?.nombre ?? ''}`" wide>
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <p class="text-sm text-base-content/70">
        Cada tramo se divide en citas de {{ duracion }} min. Un día sin tramos queda cerrado. Puedes
        poner varios tramos el mismo día (mañana y tarde).
      </p>

      <ul class="divide-y divide-base-300 rounded-box border border-base-300">
        <li v-for="d in semana" :key="d.n" class="flex flex-col gap-2 p-3 sm:flex-row sm:gap-4">
          <div class="w-24 shrink-0 pt-1">
            <p class="text-sm font-medium">{{ d.largo }}</p>
            <p class="text-xs text-base-content/70">
              {{ d.tramos.length ? `${totalPorDia(d.n)} citas` : "Cerrado" }}
            </p>
          </div>

          <div class="flex-1 space-y-2">
            <div v-for="(t, i) in d.tramos" :key="i" class="flex flex-wrap items-center gap-2">
              <input
                v-model="t.desde"
                type="time"
                step="300"
                class="input input-sm w-28"
                :aria-label="`${d.largo}: desde`"
              />
              <span class="text-base-content/60">a</span>
              <input
                v-model="t.hasta"
                type="time"
                step="300"
                class="input input-sm w-28"
                :aria-label="`${d.largo}: hasta`"
              />
              <AppButton
                size="sm"
                variant="ghost"
                :aria-label="`Quitar tramo del ${d.largo}`"
                @click="quitar(t)"
              >
                ✕
              </AppButton>
            </div>
            <AppButton size="sm" variant="ghost" @click="agregar(d.n)">+ Agregar tramo</AppButton>
          </div>
        </li>
      </ul>

      <div class="flex flex-wrap gap-2">
        <AppButton size="sm" variant="secondary" @click="copiarLunesADiasHabiles">
          Copiar el lunes a martes–viernes
        </AppButton>
        <AppButton size="sm" variant="ghost" @click="ventanas = []">Vaciar todo</AppButton>
      </div>

      <p v-if="error" role="alert" class="alert alert-error alert-soft text-sm">{{ error }}</p>

      <div class="flex justify-end gap-2 pt-2">
        <AppButton variant="secondary" @click="open = false">Cancelar</AppButton>
        <AppButton type="submit" :loading="saving">Guardar horarios</AppButton>
      </div>
    </form>
  </AppModal>
</template>
