import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://192.168.100.106:4005",
        changeOrigin: true,
      },
      "/health": {
        target: "http://192.168.100.106:4005",
        changeOrigin: true,
      },
    },
  },
});
