import { defineStore } from "pinia";
import { ref } from "vue";

export interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

// Avisos flotantes ("Cita aprobada", errores de red, etc.)
export const useToastStore = defineStore("toast", () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 1;

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function push(type: Toast["type"], message: string, ms = 4000) {
    const id = nextId++;
    toasts.value.push({ id, type, message });
    setTimeout(() => remove(id), ms);
  }

  return {
    toasts,
    remove,
    success: (message: string) => push("success", message),
    error: (message: string) => push("error", message, 6000),
    info: (message: string) => push("info", message),
  };
});
