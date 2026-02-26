import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      "/pipelines": "http://localhost:8100",
      "/runs": "http://localhost:8100",
    },
  },
});
