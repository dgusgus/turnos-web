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
      class="input w-full sm:w-72"
    />

    <div class="overflow-x-auto tarjeta">
      <table class="table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Creado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && items.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-base-content/70">Cargando...</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-base-content/70">No hay usuarios.</td>
          </tr>
          <tr v-for="u in items" :key="u.id" class="hover:bg-base-200/60">
            <td>
              <p class="font-medium">{{ u.nombre }}</p>
              <p class="text-xs text-base-content/70">{{ u.email }}</p>
            </td>
            <td>
              <select
                :value="u.rol"
                :disabled="isSelf(u)"
                :aria-label="`Rol de ${u.nombre}`"
                class="select select-sm w-auto"
                @change="changeRole(u, ($event.target as HTMLSelectElement).value as Rol)"
              >
                <option value="OPERADOR">Operador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </td>
            <td>
              <span class="badge badge-soft" :class="u.activo ? 'badge-success' : 'badge-ghost'">
                {{ u.activo ? "Activo" : "Inactivo" }}
              </span>
            </td>
            <td class="text-base-content/70">{{ formatDate(u.creadoEn) }}</td>
            <td>
              <div class="flex justify-end gap-2">
                <AppButton variant="ghost" size="sm" :disabled="isSelf(u)" @click="toggleActive(u)">
                  {{ u.activo ? "Desactivar" : "Activar" }}
                </AppButton>
                <AppButton variant="danger-soft" size="sm" :disabled="isSelf(u)" @click="remove(u)">
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
