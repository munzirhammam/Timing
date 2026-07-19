import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const requestedBase = process.env.GITHUB_PAGES_BASE || "/Timing/";
const base = requestedBase.endsWith("/") ? requestedBase : `${requestedBase}/`;

export default defineConfig({
  base,
  root: fileURLToPath(new URL("./github-pages", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [react()],
  css: {
    postcss: fileURLToPath(new URL("./postcss.config.mjs", import.meta.url)),
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-pages", import.meta.url)),
    emptyOutDir: true,
  },
});
