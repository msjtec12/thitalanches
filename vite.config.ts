import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("recharts")) return "charts-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("@tanstack/react-query") ||
            /node_modules\/react\//.test(id)
          ) {
            return "react-vendor";
          }
          return undefined;
        },
      },
    },
  },
  preview: {
    port: 8080,
  },
});
