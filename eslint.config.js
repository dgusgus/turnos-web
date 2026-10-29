import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  // "essential" = solo reglas de corrección; el formato lo maneja Prettier
  pluginVue.configs["flat/essential"],
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  {
    rules: {
      // TypeScript ya detecta variables no definidas; así se aceptan globales del navegador
      "no-undef": "off",
      "vue/multi-word-component-names": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
