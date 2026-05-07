import fs from "node:fs";

import { PATHS } from "../paths.js";
import { decryptVault, writeEnvFile } from "../core/vault.js";
import { loadLocalEnv, mergeEnvs } from "../core/merger.js";
import { logger } from "../utils/logger.js";

import type { VaultConfig } from "../types.js";

export async function decrypt() {
  if (!fs.existsSync(PATHS.config)) {
    throw new Error('vault is not initialized. Run "vault init" to initialize');
  }

  if (!fs.existsSync(PATHS.vault)) {
    throw new Error("No vault found. Encrypt the vault first");
  }

  const config: VaultConfig = JSON.parse(
    fs.readFileSync(PATHS.config, "utf-8"),
  );

  if (config.keyMode === "file" && !fs.existsSync(PATHS.envKey)) {
    throw new Error("No encryption key found. Get it from the team");
  }

  const decryptedEnv = await decryptVault(PATHS.vault, PATHS.env, config);
  const localEnv = loadLocalEnv(PATHS.envLocal);

  logger.dim(
    Object.keys(decryptedEnv).length + " keys decrypted from .env.shared.vault",
  );
  logger.dim(Object.keys(localEnv).length + " keys included from .env.local");

  const env = mergeEnvs(decryptedEnv, localEnv);

  writeEnvFile(PATHS.env, env);
  logger.info("Env write successfully");
}
