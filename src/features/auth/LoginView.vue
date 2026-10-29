<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { parseApiError } from "@/api/errors";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: "", password: "" });
const errors = ref<Record<string, string>>({});
const formError = ref("");
const loading = ref(false);

async function submit() {
  errors.value = {};
  formError.value = "";
  loading.value = true;
  try {
    await auth.login(form.email.trim(), form.password);
    // Vuelve a la página que quería visitar antes de ser enviado al login
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/panel";
    await router.push(redirect.startsWith("/") ? redirect : "/panel");
  } catch (e) {
    const info = parseApiError(e);
    errors.value = info.fieldErrors;
    formError.value = info.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <h2 class="text-lg font-semibold">Iniciar sesión</h2>

    <AppInput
      v-model="form.email"
      label="Email"
      type="email"
      autocomplete="username"
      :error="errors.email"
    />
    <AppInput
      v-model="form.password"
      label="Contraseña"
      type="password"
      autocomplete="current-password"
      :error="errors.password"
    />

    <p v-if="formError" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ formError }}
    </p>

    <AppButton type="submit" class="w-full" :loading="loading">Entrar</AppButton>
  </form>
</template>
