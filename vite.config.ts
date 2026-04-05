import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allows absolute imports: import { Button } from "@/components/ui/button"
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Development proxy: forwards /api requests to the local FastAPI server.
    // This prevents CORS errors during local development without needing VITE_API_URL.
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
