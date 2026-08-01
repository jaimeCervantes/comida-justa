/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    test: {
      include: ["src/**/*.test.?(c|m)[jt]s?(x)"],
      globals: true,
      environment: "jsdom",
      setupFiles: "./vitest-setup.ts",
      // you might want to disable it, if you don't have tests that rely on CSS
      // since parsing CSS is slow
      css: false,
      alias: {
        "~": "/src",
      },
      server: {
        deps: {
          /**
           * next-intl se distribuye como ESM y hace `import ... from "next/navigation"` sin
           * extensión. Node lo resuelve desde el directorio anidado de next-intl en pnpm y falla;
           * pasándolo por Vite, el mapa de `exports` de Next sí se respeta.
           */
          inline: ["next-intl"],
        },
      },
    },
  };
});
