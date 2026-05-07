import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { logger } from "../utils/logger.js";

import type { InitOptions, VaultConfig } from "../types.js";
import { PATHS } from "../paths.js";
import { generateKey } from "../core/crypto.js";

export function init(initOptions: InitOptions) {
  if (fs.existsSync(PATHS.config)) {
    logger.warn(
      `Already initialized! Please delete .vault-config.json to re-initialize.`,
    );

    process.exit(1);
  }

  const argon2Salt = generateKey();

  if (initOptions.keyMode === "file") {
    const key = generateKey();

    fs.writeFileSync(PATHS.envKey, key, { encoding: "utf-8", mode: 0o600 });
    logger.success("Generated .env.key");
    logger.dim("Share this file once with teammates");
  } else {
    logger.info(
      "Passphrase mode: password will be required on encrypt/decrypt",
    );
  }

  const config: VaultConfig = {
    projectSlug: path.basename(process.cwd()),
    keyMode: initOptions.keyMode,
    keyPath: ".env.key",
    argon2Salt,
  };

  fs.writeFileSync(PATHS.config, JSON.stringify(config, null, 2), "utf-8");

  if (!fs.existsSync(PATHS.envExample)) {
    fs.writeFileSync(
      PATHS.envExample,
      [
        "# -- Env Example --",
        "# Env will be encrypted to .env.shared.vault and can be shared via git",
        "DB_HOST=",
        "DB_PORT=",
        "DB_NAME=",
        "APP_PORT=",
      ].join("\n"),
      "utf-8",
    );
    logger.success("Created .env.example");
  }

  logger.success("vault initialized");
  console.log("");
  logger.info("Next steps:");
  logger.dim("1. Add your secrets to .env file");
  logger.dim("2. vault encrypt");
  logger.dim("3. git add .env.shared.vault .vault-config.json .env.example");
  logger.dim('4. git commit -m "chore: init vault"');
}
