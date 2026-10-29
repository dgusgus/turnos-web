<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { parseApiError } from "@/api/errors";
import type { CitaCreada, Disponibilidad, Franja, ServicioPublico } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import EstadoBadge from "@/features/citas/EstadoBadge.vue";
import { formatDateTime, formatDay, hoyISO, sumarDias } from "@/lib/format";
import { guardarMiCita } from "@/lib/misCitas";
import { useToastStore } from "@/stores/toast";
import { publicApi } from "./public.api";

// Cuántos días adelante se puede reservar (igual que CITA_MAX_DIAS_ANTICIPACION de la API;
// si el colegio lo cambia allá y no aquí, la API responde con un mensaje claro).
const MAX_DIAS = 30;

const router = useRouter();
const toast = useToastStore();

const hoy = hoyISO();
const maxFecha = sumarDias(hoy, MAX_DIAS);

// --- 1) Servicio ---
const servicios = ref<ServicioPublico[]>([]);
const cargandoServicios = ref(true);
const errorServicios = ref("");
const servicioId = ref<string | null>(null);
const servicio = computed(() => servicios.value.find((s) => s.id === servicioId.value) ?? null);

// --- 2) Día y hora ---
const fecha = ref(hoy);
const disp = ref<Disponibilidad | null>(null);
const cargandoDisp = ref(false);
const errorDisp = ref("");
const franja = ref<Franja | null>(null);
let pedidoDisp = 0; // descarta respuestas viejas si el usuario cambia de día rápido

const libres = computed(() => disp.value?.franjas.filter((f) => f.libre).length ?? 0);

async function cargarDisp() {
  if (!servicioId.value || !fecha.value) return;
  const pedido = ++pedidoDisp;
  cargandoDisp.value = true;
  errorDisp.value = "";
  try {
    const r = await publicApi.disponibilidad(servicioId.value, fecha.value);
    if (pedido !== pedidoDisp) return;
    disp.value = r;
    // Si la franja elegida se ocupó mientras tanto, se descarta
    if (franja.value && !r.franjas.some((f) => f.inicio === franja.value?.inicio && f.libre)) {
      franja.value = null;
    }
  } catch (e) {
    if (pedido !== pedidoDisp) return;
    disp.value = null;
    errorDisp.value = parseApiError(e).message;
  } finally {
    if (pedido === pedidoDisp) cargandoDisp.value = false;
  }
}

watch([servicioId, fecha], () => {
  franja.value = null;
  void cargarDisp();
});

function moverDia(dias: number) {
  const nueva = sumarDias(fecha.value, dias);
  if (nueva >= hoy && nueva <= maxFecha) fecha.value = nueva;
}

// --- 3) Datos de quien reserva ---
const form = reactive({
  nombres: "",
  apellidos: "",
  documento: "",
  telefono: "",
  estudianteNombre: "",
  estudianteCurso: "",
  motivo: "",
});
const errors = ref<Record<string, string>>({});
const enviando = ref(false);
const resultado = ref<CitaCreada | null>(null);

function validar() {
  const e: Record<string, string> = {};
  if (form.nombres.trim().length < 2) e.nombres = "Escribe tu nombre";
  if (form.apellidos.trim().length < 2) e.apellidos = "Escribe tus apellidos";
  if (form.documento.replace(/[\s-]/g, "").length < 4) e.documento = "Escribe tu CI";
  if (form.telefono.replace(/[\s()-]/g, "").length < 7) e.telefono = "Escribe un teléfono válido";
  if (form.estudianteNombre.trim().length < 3)
    e.estudianteNombre = "Escribe el nombre del estudiante";
  if (!form.estudianteCurso.trim()) e.estudianteCurso = "Escribe el curso";
  if (form.motivo.trim().length < 3) e.motivo = "Cuéntanos brevemente el motivo";
  errors.value = e;
  return Object.keys(e).length === 0;
}

async function reservar() {
  if (!servicio.value || !franja.value || !validar()) return;
  enviando.value = true;
  try {
    const r = await publicApi.crearCita({
      servicioId: servicio.value.id,
      inicio: franja.value.inicio,
      nombres: form.nombres,
      apellidos: form.apellidos,
      documento: form.documento,
      telefono: form.telefono,
      estudianteNombre: form.estudianteNombre,
      estudianteCurso: form.estudianteCurso,
      motivo: form.motivo,
    });
    resultado.value = r;
    guardarMiCita({
      token: r.token,
      codigo: r.cita.codigo,
      inicio: r.cita.inicio,
      servicio: r.cita.servicio.nombre,
    });
    window.scrollTo({ top: 0 });
  } catch (e) {
    const info = parseApiError(e);
    errors.value = info.fieldErrors;
    toast.error(info.message);
    void cargarDisp(); // la hora pudo ocuparse: se actualiza la lista
  } finally {
    enviando.value = false;
  }
}

// --- Pantalla de éxito ---
const enlace = computed(() => {
  if (!resultado.value) return "";
  const { href } = router.resolve({ name: "cita", params: { token: resultado.value.token } });
  return `${window.location.origin}${href}`;
});

async function copiarEnlace() {
  try {
    await navigator.clipboard.writeText(enlace.value);
    toast.success("Enlace copiado");
  } catch {
    toast.info("Selecciona el enlace y cópialo manualmente");
  }
}

function otra() {
  resultado.value = null;
  franja.value = null;
  Object.assign(form, { motivo: "" });
  void cargarDisp();
}

onMounted(async () => {
  try {
    servicios.value = await publicApi.servicios();
  } catch (e) {
    errorServicios.value = parseApiError(e).message;
  } finally {
    cargandoServicios.value = false;
  }
});
</script>

<template>
  <!-- ÉXITO -->
  <section v-if="resultado" class="mx-auto max-w-xl space-y-5">
    <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p class="text-sm font-medium text-slate-500">
        {{ resultado.cita.estado === "PENDIENTE" ? "Solicitud enviada" : "¡Cita confirmada!" }}
      </p>
      <p class="mt-2 font-mono text-4xl font-semibold tracking-wider text-indigo-700">
        {{ resultado.cita.codigo }}
      </p>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <EstadoBadge :estado="resultado.cita.estado" />
        <span class="text-sm text-slate-600">
          {{ resultado.cita.servicio.nombre }} · {{ formatDateTime(resultado.cita.inicio) }}
        </span>
      </div>

      <p
        v-if="resultado.cita.estado === 'PENDIENTE'"
        class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
      >
        El colegio debe aprobar esta cita. Vuelve a tu enlace o a «Mi cita» para ver si fue aprobada
        o rechazada (y el motivo).
      </p>
      <p v-else class="mt-4 text-sm text-slate-600">
        Llega unos minutos antes y lleva tu carnet de identidad.
      </p>
    </div>

    <div class="space-y-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 class="font-medium">Guarda tu enlace</h2>
      <p class="text-sm text-slate-600">
        Con este enlace ves el estado de tu cita y puedes cancelarla. No lo compartas: quien lo
        tenga puede cancelar tu cita. Si lo pierdes, usa «Mi cita» con tu código y tu CI.
      </p>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input
          :value="enlace"
          readonly
          aria-label="Enlace de tu cita"
          class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
          @focus="($event.target as HTMLInputElement).select()"
        />
        <AppButton variant="secondary" @click="copiarEnlace">Copiar</AppButton>
      </div>
      <div class="flex flex-wrap gap-2 pt-1">
        <RouterLink :to="{ name: 'cita', params: { token: resultado.token } }">
          <AppButton>Ver mi cita</AppButton>
        </RouterLink>
        <AppButton variant="ghost" @click="otra">Reservar otra</AppButton>
      </div>
    </div>
  </section>

  <!-- RESERVAR -->
  <section v-else class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Reservar una cita</h1>
      <p class="mt-1 text-sm text-slate-600">
        Sin cuenta ni contraseña. Máximo 2 citas vigentes por persona.
      </p>
    </div>

    <!-- 1 -->
    <div class="space-y-3">
      <h2 class="font-medium"><span class="text-indigo-600">1.</span> ¿Qué trámite necesitas?</h2>
      <p v-if="cargandoServicios" class="text-sm text-slate-500">Cargando...</p>
      <p
        v-else-if="errorServicios"
        role="alert"
        class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ errorServicios }}
      </p>
      <p v-else-if="servicios.length === 0" class="text-sm text-slate-500">
        Por ahora no hay servicios disponibles para reservar.
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="s in servicios"
          :key="s.id"
          type="button"
          class="rounded-xl bg-white p-4 text-left shadow-sm ring-1 transition"
          :class="
            s.id === servicioId ? 'ring-2 ring-indigo-500' : 'ring-slate-200 hover:ring-indigo-300'
          "
          :aria-pressed="s.id === servicioId"
          @click="servicioId = s.id"
        >
          <span class="font-medium">{{ s.nombre }}</span>
          <span class="mt-0.5 block text-xs text-slate-500">
            {{ s.duracionMin }} min
            <template v-if="s.requiereAprobacion"> · requiere aprobación del colegio</template>
          </span>
          <span v-if="s.descripcion" class="mt-1 block text-sm text-slate-600">
            {{ s.descripcion }}
          </span>
        </button>
      </div>
    </div>

    <!-- 2 -->
    <div v-if="servicio" class="space-y-3">
      <h2 class="font-medium"><span class="text-indigo-600">2.</span> Elige día y hora</h2>

      <div class="flex flex-wrap items-center gap-2">
        <AppButton variant="secondary" :disabled="fecha <= hoy" @click="moverDia(-1)">←</AppButton>
        <input
          v-model="fecha"
          type="date"
          :min="hoy"
          :max="maxFecha"
          aria-label="Día de la cita"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        />
        <AppButton variant="secondary" :disabled="fecha >= maxFecha" @click="moverDia(1)"
          >→</AppButton
        >
        <span v-if="fecha" class="text-sm text-slate-600">{{ formatDay(fecha) }}</span>
      </div>

      <p v-if="cargandoDisp && !disp" class="text-sm text-slate-500">Buscando horarios...</p>
      <p
        v-else-if="errorDisp"
        role="alert"
        class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ errorDisp }}
      </p>
      <template v-else-if="disp">
        <p v-if="disp.cerrado" class="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          {{ disp.cerrado }}. Prueba con otro día.
        </p>
        <template v-else>
          <p class="text-sm text-slate-600">
            {{ libres }} {{ libres === 1 ? "horario libre" : "horarios libres" }}
          </p>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
            <button
              v-for="f in disp.franjas"
              :key="f.inicio"
              type="button"
              :disabled="!f.libre"
              :aria-pressed="franja?.inicio === f.inicio"
              class="rounded-lg px-2 py-2 text-sm font-medium ring-1 transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:line-through"
              :class="
                franja?.inicio === f.inicio
                  ? 'bg-indigo-600 text-white ring-indigo-600'
                  : 'bg-white text-slate-700 ring-slate-300 hover:ring-indigo-400'
              "
              @click="franja = f"
            >
              {{ f.hora }}
            </button>
          </div>
          <p v-if="disp.servicio.requiereAprobacion" class="text-sm text-amber-700">
            Este servicio requiere aprobación: tu cita quedará «pendiente» hasta que el colegio la
            confirme.
          </p>
        </template>
      </template>
    </div>

    <!-- 3 -->
    <form v-if="servicio && franja" class="space-y-4" novalidate @submit.prevent="reservar">
      <h2 class="font-medium"><span class="text-indigo-600">3.</span> Tus datos</h2>

      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput
          v-model="form.nombres"
          label="Nombres"
          autocomplete="given-name"
          :error="errors.nombres"
        />
        <AppInput
          v-model="form.apellidos"
          label="Apellidos"
          autocomplete="family-name"
          :error="errors.apellidos"
        />
        <AppInput
          v-model="form.documento"
          label="CI (con complemento si tiene)"
          placeholder="1234567 1A"
          autocomplete="off"
          :error="errors.documento"
        />
        <AppInput
          v-model="form.telefono"
          label="Teléfono / WhatsApp"
          type="tel"
          inputmode="tel"
          placeholder="71234567"
          autocomplete="tel"
          :error="errors.telefono"
        />
        <AppInput
          v-model="form.estudianteNombre"
          label="Nombre del estudiante"
          :error="errors.estudianteNombre"
        />
        <AppInput
          v-model="form.estudianteCurso"
          label="Curso del estudiante"
          placeholder="3ro B"
          :error="errors.estudianteCurso"
        />
      </div>

      <div>
        <label for="motivo" class="block text-sm font-medium text-slate-700">Motivo</label>
        <textarea
          id="motivo"
          v-model="form.motivo"
          rows="3"
          maxlength="300"
          class="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2"
          :class="
            errors.motivo
              ? 'border-red-400 focus:ring-red-200'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
          "
        />
        <p v-if="errors.motivo" class="mt-1 text-xs text-red-600">{{ errors.motivo }}</p>
      </div>

      <div class="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
        {{ servicio.nombre }} · {{ formatDateTime(franja.inicio) }}
      </div>

      <AppButton type="submit" class="w-full sm:w-auto" :loading="enviando">
        Reservar cita
      </AppButton>
    </form>
  </section>
</template>
