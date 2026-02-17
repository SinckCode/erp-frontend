import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "apierp.angelonesto.com",
        changeOrigin: true,
      },
      "/health": {
        target: "apierp.angelonesto.com",
        changeOrigin: true,
      },
    },
  },
});
