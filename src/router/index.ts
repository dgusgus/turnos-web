import { createRouter, createWebHistory } from "vue-router";
import type { Rol } from "@/api/types";
import { APP_NAME } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";

// Metadatos que cada ruta puede declarar y que el guard lee abajo.
declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: Rol[];
  }
}

// Dos "zonas":
//   PÚBLICA  (/, /reservar, /agenda, /mi-cita, /cita/:token) → sin login, para padres/tutores.
//   PANEL    (/panel/...) → con login de personal (ADMIN / OPERADOR).
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/layouts/PublicLayout.vue"),
      children: [
        {
          path: "",
          name: "public-home",
          component: () => import("@/features/public/PublicHomeView.vue"),
          meta: { title: "Inicio" },
        },
        {
          path: "reservar",
          name: "reservar",
          component: () => import("@/features/public/ReservarView.vue"),
          meta: { title: "Reservar cita" },
        },
        {
          path: "agenda",
          name: "agenda",
          component: () => import("@/features/public/AgendaView.vue"),
          meta: { title: "Agenda del día" },
        },
        {
          path: "mi-cita",
          name: "mi-cita",
          component: () => import("@/features/public/ConsultaView.vue"),
          meta: { title: "Mi cita" },
        },
        {
          path: "cita/:token",
          name: "cita",
          component: () => import("@/features/public/CitaView.vue"),
          meta: { title: "Mi cita" },
        },
      ],
    },
    {
      path: "/login",
      component: () => import("@/layouts/AuthLayout.vue"),
      meta: { guestOnly: true },
      children: [
        {
          path: "",
          name: "login",
          component: () => import("@/features/auth/LoginView.vue"),
          meta: { title: "Iniciar sesión" },
        },
      ],
    },
    {
      path: "/panel",
      component: () => import("@/layouts/DashboardLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/features/home/HomeView.vue"),
          meta: { title: "Panel" },
        },
        {
          path: "citas",
          name: "citas",
          component: () => import("@/features/citas/CitasView.vue"),
          meta: { title: "Citas", roles: ["ADMIN", "OPERADOR"] },
        },
        {
          path: "users",
          name: "users",
          component: () => import("@/features/users/UsersView.vue"),
          meta: { title: "Usuarios", roles: ["ADMIN"] },
        },
        // Próximas secciones: servicios, turnos (cola del operador).
        {
          path: "forbidden",
          name: "forbidden",
          component: () => import("@/features/errors/ForbiddenView.vue"),
          meta: { title: "Sin permiso" },
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/features/errors/NotFoundView.vue"),
      meta: { title: "No encontrado" },
    },
  ],
});

// Guard global: protege el panel por sesión y por rol.
// (La seguridad real la aplica el backend; esto solo mejora la experiencia.)
router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) {
      return { name: "login", query: { redirect: to.fullPath } };
    }
    await auth.loadUser();
    if (!auth.isAuthenticated) return { name: "login" }; // el token ya no servía
    if (to.meta.roles && !auth.hasRole(...to.meta.roles)) return { name: "forbidden" };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) return { name: "home" };
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${APP_NAME}` : APP_NAME;
});
