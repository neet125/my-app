import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);

export default defineConfig({
  envDir: resolve(currentDirectoryPath),
  server: {
    port: 5173
  }
});
