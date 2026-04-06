import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);

config({
  path: resolve(currentDirectoryPath, "../.env")
});

console.log(`[env-check] DATABASE_URL loaded: ${Boolean(process.env.DATABASE_URL)}`);
