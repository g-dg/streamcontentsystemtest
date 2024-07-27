import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __APP_NAME__: JSON.stringify("StreamSysTest"),
    __APP_NAME_FULL__: JSON.stringify(
      "Garnet DeGelder's Stream Content System Test"
    ),
    __APP_COPYRIGHT__: JSON.stringify("Copyright © 2024 Garnet DeGelder"),
  },
  build: {
    rollupOptions: {
      output: {
        compact: true,
        entryFileNames: "assets/[hash].js",
        chunkFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash].[ext]",
      },
    },
  },
  server: {
    port: 5173,
    hmr: {
      port: 5174,
      timeout: 1,
    },
  },
});
