import { createPinia } from "pinia";
import { createApp } from "vue";
import { setUnauthorizedHandler } from "@/api/http";
import App from "./App.vue";
import { router } from "./router";
import { iniciarTema } from "./lib/tema";
import { useAuthStore } from "./stores/auth";
import "./style.css";

iniciarTema(); // aplica modo claro/oscuro y color de marca guardados

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Si el backend responde 401 (token vencido), se cierra la sesión y se va al login.
setUnauthorizedHandler(() => {
  useAuthStore().logout();
  void router.push({ name: "login" });
});

app.mount("#app");
