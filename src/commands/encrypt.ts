import fs from "node:fs";

import { PATHS } from "../paths.js";

import type { VaultConfig } from "../types.js";
import { encryptVault } from "../core/vault.js";
import { logger } from "../utils/logger.js";

export async function encrypt() {
  if (!fs.existsSync(PATHS.config)) {
    throw new Error('vault is not initialized. Run "vault init" to initialize');
  }

  if (!fs.existsSync(PATHS.env)) {
    throw new Error("No .env file found. Create .env to encrypt");
  }

  const config: VaultConfig = JSON.parse(
    fs.readFileSync(PATHS.config, "utf-8"),
  );

  if (config.keyMode === "file" && !fs.existsSync(PATHS.envKey)) {
    throw new Error(
      'No encryption key found. Use "vault gen-key" to generate one',
    );
  }

  await encryptVault(PATHS.env, PATHS.vault, config);

  logger.info(`${PATHS.vault} created successfully`);
  logger.info("Now you can share this file with your team");
}
