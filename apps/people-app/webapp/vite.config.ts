import { defineConfig } from "vite";
// import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    // VitePWA({
    //   manifestFilename: "manifest.json",
    //   registerType: "autoUpdate",
    //   manifest: {},
    // }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // build: {
  //   outDir: "build",
  //   manifest: true,
  //   rollupOptions: {
  //     output: {
  //       entryFileNames: "static/js/[name]-[hash].js",
  //       chunkFileNames: "static/js/[name]-[hash].js",
  //       assetFileNames: (asset) => {
  //         const name = asset.names?.[0] ?? "[name]";
  //         const ext = name.slice(name.lastIndexOf(".")).toLowerCase();

  //         if (/\.(css)$/.test(ext)) {
  //           return "static/css/[name]-[hash][extname]";
  //         }
  //         if (/\.(js|mjs|cjs|jsx|tsx)$/i.test(ext)) {
  //           return "static/js/[name]-[hash][extname]";
  //         }
  //         return "static/media/[name]-[hash][extname]";
  //       },
  //     },
  //   },
  // },
});
