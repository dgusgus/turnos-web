/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_LOCALE?: string;
  readonly VITE_TIMEZONE?: string;
  readonly VITE_POLL_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
