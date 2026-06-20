import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/review/",
  plugins: [react()],
  build: { outDir: "../review", emptyOutDir: true },
  server: { proxy: { "/api": "http://localhost:3000" } },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/setupTests.js"] },
});
