import { onMounted, onUnmounted } from "vue";

// Cada cuántos segundos se actualizan solas las pantallas "en vivo" (agenda, bandeja).
// Nivel 2: reemplazar por tiempo real (SSE/WebSocket) y evitar preguntar en vano.
export const POLL_SECONDS = Math.max(5, Number(import.meta.env.VITE_POLL_SECONDS) || 15);

/**
 * Llama a `fn` cada `segundos` mientras la pantalla está montada Y la pestaña visible
 * (una pestaña en segundo plano no gasta peticiones). Se limpia sola al salir.
 */
export function usePolling(fn: () => void | Promise<void>, segundos = POLL_SECONDS) {
  let timer: ReturnType<typeof setInterval> | undefined;

  onMounted(() => {
    timer = setInterval(() => {
      if (document.visibilityState === "visible") void fn();
    }, segundos * 1000);
  });

  onUnmounted(() => clearInterval(timer));
}
