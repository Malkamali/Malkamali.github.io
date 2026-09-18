import { defineConfig } from "vite";
export default defineConfig({
  build: { outDir: "build", sourcemap: false },
  worker: { format: "es" },
});
