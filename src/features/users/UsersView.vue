<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { parseApiError } from "@/api/errors";
import type { PageMeta, Rol, Usuario } from "@/api/types";
import AppButton from "@/components/ui/AppButton.vue";
import AppPagination from "@/components/ui/AppPagination.vue";
import { debounce } from "@/lib/debounce";
import { formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import UserFormModal from "./UserFormModal.vue";
import { usersApi } from "./users.api";

const auth = useAuthStore();
const toast = useToastStore();

const items = ref<Usuario[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(false);
const page = ref(1);
const search = ref("");
const modalOpen = ref(false);

async function load() {
  loading.value = true;
  try {
    const res = await usersApi.list({ page: page.value, search: search.value.trim() || undefined });
    items.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    toast.error(parseApiError(e).message);
  } finally {
    loading.value = false;
  }
}

watch(
  search,
  debounce(() => {
    page.value = 1;
    void load();
  }, 300),
);

function goTo(p: number) {
  page.value = p;
  void load();
}

const isSelf = (u: Usuario) => u.id === auth.user?.id;

async function changeRole(u: Usuario, rol: Rol) {
  try {
    await usersApi.update(u.id, { rol });
    toast.success("Rol actualizado");
  } catch (e) {
    toast.error(parseApiError(e).message);
  }
  await load(); // refresca para mostrar el valor real del servidor
}

async function toggleActive(u: Usuario) {
  try {
    await usersApi.update(u.id, { activo: !u.activo });
    toast.success(u.activo ? "Usuario desactivado" : "Usuario activado");
  } catch (e) {
    toast.error(parseApiError(e).message);
  }
  await load();
}

async function remove(u: Usuario) {
  if (!window.confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return;
  try {
    await usersApi.remove(u.id);
    toast.success("Usuario eliminado");
    if (items.value.length === 1 && page.value > 1) page.value -= 1;
    await load();
  } catch (e) {
    toast.error(parseApiError(e).message);
  }
}

onMounted(load);
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold tracking-tight">Usuarios</h1>
      <AppButton @click="modalOpen = true">Nuevo usuario</AppButton>
    </div>

    <input
      v-model="search"
      type="search"
      placeholder="Buscar por nombre o email..."
      aria-label="Buscar usuarios"
      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:w-72"
    />

    <div class="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th class="px-4 py-3">Usuario</th>
            <th class="px-4 py-3">Rol</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Creado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading && items.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-slate-500">Cargando...</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-slate-500">No hay usuarios.</td>
          </tr>
          <tr v-for="u in items" :key="u.id" class="hover:bg-slate-50">
            <td class="px-4 py-3">
              <p class="font-medium">{{ u.nombre }}</p>
              <p class="text-xs text-slate-500">{{ u.email }}</p>
            </td>
            <td class="px-4 py-3">
              <select
                :value="u.rol"
                :disabled="isSelf(u)"
                :aria-label="`Rol de ${u.nombre}`"
                class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
                @change="changeRole(u, ($event.target as HTMLSelectElement).value as Rol)"
              >
                <option value="OPERADOR">Operador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="u.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ u.activo ? "Activo" : "Inactivo" }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ formatDate(u.creadoEn) }}</td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <AppButton variant="ghost" :disabled="isSelf(u)" @click="toggleActive(u)">
                  {{ u.activo ? "Desactivar" : "Activar" }}
                </AppButton>
                <AppButton
                  variant="ghost"
                  class="!text-red-600"
                  :disabled="isSelf(u)"
                  @click="remove(u)"
                >
                  Eliminar
                </AppButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-if="meta" :meta="meta" @change="goTo" />

    <UserFormModal v-model="modalOpen" @saved="load" />
  </section>
</template>
