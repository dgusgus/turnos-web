# turnos-web

**Sistema de Gestión de Turnos y Citas (SGTC)** para unidades educativas. Este repo es el **frontend**; el backend es [`turnos-api`](../turnos-api).

Nació de [`starter-web`](../starter-web) (Nivel 1). Stack: Node 22 · pnpm 10 · Vue 3 · Vite · TypeScript · Pinia · Vue Router · Tailwind CSS 4 · Axios · Vitest.

## Dos zonas

| Zona        | Rutas                                                       | Quién                              | Login         |
| ----------- | ----------------------------------------------------------- | ---------------------------------- | ------------- |
| **Pública** | `/` · `/reservar` · `/agenda` · `/mi-cita` · `/cita/:token` | Padres, tutores, cualquier persona | **No**        |
| **Panel**   | `/panel` · `/panel/citas` · `/panel/users`                  | Personal (`ADMIN`, `OPERADOR`)     | Sí (`/login`) |

El público **no tiene cuenta**: reserva con CI y teléfono, y vuelve a su cita con un enlace secreto o con código + CI. Los turnos de mostrador los genera el operador (Paso 4).

## Estado actual

- [x] **Reservar cita** (`/reservar`): trámite → día → hora libre → datos. Avisa si el servicio requiere aprobación
- [x] **Agenda del día** (`/agenda`): citas del día y pestaña de **rechazadas**, con búsqueda por código, filtro por servicio, actualización automática y marca «Tu cita»
- [x] **Mi cita**: por enlace secreto (estado, motivo del rechazo, cancelar) o por código + CI; citas guardadas en el dispositivo
- [x] **Bandeja del operador** (`/panel/citas`): pendientes por aprobar, aprobar con un clic, rechazar con motivo (con motivos rápidos), búsqueda por código/nombre/CI/teléfono
- [x] Login, sesión, guards por rol y gestión de usuarios (solo ADMIN)
- [ ] Paso 2: servicios y horarios (ADMIN) · Paso 4: turnos y cola (operador) · Paso 5: pantalla pública de turnos en tiempo real

## Primer arranque

```bash
pnpm install
cp .env.example .env      # VITE_API_URL debe apuntar a turnos-api
pnpm dev                  # http://localhost:5173
```

Con `turnos-api` corriendo y su seed aplicado:

- Público: abre `http://localhost:5173` y reserva una cita (no necesitas login).
- Panel: `/login` con `operador@example.com` / `Operador12345!` o `admin@example.com` / `Admin12345!`.
- Prueba el flujo completo: reserva en «Atención de Dirección» (requiere aprobación) → entra como operador a `/panel/citas` → aprueba o rechaza → vuelve al enlace de la cita y mira el estado.

## Estructura

```
src/
├── api/             http.ts · errors.ts · types.ts   (todo lo que habla con el backend)
├── features/        una carpeta por funcionalidad:
│   ├── public/      public.api.ts · ReservarView · AgendaView · ConsultaView · CitaView · PublicHomeView
│   ├── citas/       citas.api.ts · CitasView (bandeja) · RechazarCitaModal · EstadoBadge · estados.ts
│   ├── auth/ · users/ · home/ · errors/
├── components/ui/   componentes reutilizables sin lógica de negocio
├── layouts/         PublicLayout · AuthLayout · DashboardLayout
├── router/          rutas + guard global (meta.requiresAuth, meta.roles)
├── stores/          auth (sesión) · toast (avisos)
├── lib/             session · format (fechas en la zona del colegio) · misCitas · polling · debounce
└── main.ts · App.vue · style.css
```

Regla de oro: cada **feature** tiene su capa `*.api.ts` (HTTP) y sus vistas/componentes. Las vistas nunca llaman a `axios` directo.

## Cosas que conviene entender

- **Horas en la zona del colegio.** El backend manda instantes en UTC; `lib/format.ts` los muestra siempre en `VITE_TIMEZONE` (por defecto `America/La_Paz`), sin importar la zona del navegador.
- **`inicio` de una franja se manda tal cual** al reservar: lo calculó el backend y es lo que valida. El frontend no arma horas.
- **El enlace secreto** (`/cita/:token`) se muestra una sola vez al reservar. Se guarda en este dispositivo (`localStorage`) para volver a abrirlo; en una computadora compartida o un tótem usa «Quitar de este dispositivo».
- **Actualización automática** (`lib/polling.ts`): la agenda y la bandeja se refrescan cada `VITE_POLL_SECONDS` mientras la pestaña está visible. Nivel 2: tiempo real (SSE).
- **`MAX_DIAS` en `ReservarView.vue`** (30) debe coincidir con `CITA_MAX_DIAS_ANTICIPACION` de la API; si no, la API responde con un mensaje claro.

## Cómo agregar una funcionalidad nueva (ej. `services`, Paso 2)

1. Agrega el tipo en `src/api/types.ts` (espejo del DTO de turnos-api).
2. Crea `src/features/services/` con `services.api.ts`, `ServicesView.vue` y `ServiceFormModal.vue`. Usa como modelo `src/features/users/` (lista con búsqueda y paginación + modal de formulario).
3. Registra la ruta **dentro de `/panel`** en `src/router/index.ts` con `meta.roles` si es restringida.
4. Agrega el enlace en `layouts/DashboardLayout.vue` (con `roles` si aplica).

## Scripts

| Comando                   | Qué hace                                               |
| ------------------------- | ------------------------------------------------------ |
| `pnpm dev`                | Servidor de desarrollo                                 |
| `pnpm build`              | Typecheck (`vue-tsc`) + build de producción en `dist/` |
| `pnpm lint` · `pnpm test` | Lo mismo que corre el CI                               |
| `pnpm format`             | Prettier                                               |

## Despliegue

```bash
docker build -t turnos-web --build-arg VITE_API_URL=https://api.midominio.com/api/v1 .
docker run -p 8080:80 turnos-web
```

Las variables `VITE_*` se incrustan **al compilar** y son públicas: no pongas secretos. En la API, agrega el dominio del frontend a `CORS_ORIGIN`.

## Límites conocidos

- El token del personal se guarda en `localStorage` (vulnerable si hay una falla XSS). Nivel 2: cookie httpOnly + refresh token.
- Los roles solo ocultan la interfaz; **la seguridad real la aplica el backend**.
- Los tipos de la API se mantienen a mano. Nivel 2: generarlos desde OpenAPI.
- No hay tests de componentes ni e2e todavía: los tests cubren la lógica pura (fechas, errores, citas guardadas). Nivel 2: Playwright con el flujo reservar → aprobar → consultar.

## Más información

El roadmap de **Nivel 2 y 3** (TanStack Query, tabla reutilizable, VeeValidate + Zod, tests e2e, PWA, tiempo real, modo kiosco, escáner de QR, marca blanca...) y el checklist de entrega están en el README de `starter-web`. Para este sistema, lo más relevante: **tiempo real** y **modo kiosco** para la pantalla pública, **PWA** para el celular y **escáner de QR** para el check-in.
