import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 8890,

    ///bind 0.0.0.0 fior phone
    host: true,

    
    proxy: {
      "/api": {
        target: "http://localhost:5280",
        changeOrigin: true,
      },
    },
  },

  build: {
    // Content-hashed filenames. The hash changes when the file changes, so browsers
    // cache aggressively but never serve a stale bundle after a deploy.
    // myStorage flattens these to [name].js while serving them as immutable for a year -
    // which means users can get a stale app until they hard-refresh.
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },

  resolve: {
    // Lets us write "@/components/..." instead of "../../../components/..."
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  plugins: [react()],
});