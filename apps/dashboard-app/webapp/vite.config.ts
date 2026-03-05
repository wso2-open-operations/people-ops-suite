import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Change this to your desired port number
  },
  resolve: {
    alias: {
      "@root": fileURLToPath(new URL(".", import.meta.url)),
      "@src": fileURLToPath(new URL("./src", import.meta.url)),
      "@app": fileURLToPath(new URL("./src/app", import.meta.url)),
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
      "@component": fileURLToPath(new URL("./src/component", import.meta.url)),
      "@config": fileURLToPath(new URL("./src/config", import.meta.url)),
      "@context": fileURLToPath(new URL("./src/context", import.meta.url)),
      "@layout": fileURLToPath(new URL("./src/layout", import.meta.url)),
      "@slices": fileURLToPath(new URL("./src/slices", import.meta.url)),
      "@view": fileURLToPath(new URL("./src/view", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      "@hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "@/types": fileURLToPath(new URL("./src/types", import.meta.url)),
    },
  },
});
