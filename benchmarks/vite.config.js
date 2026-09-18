import { defineConfig } from "vite";
export default defineConfig({
  build: {
    outDir: ".benchmark-build",
    rollupOptions: { input: "benchmarks/index.html" },
  },
  worker: { format: "es" },
});
