#!/usr/bin/env node
import { createRequire } from "node:module";

import { Option, program } from "commander";

import { init } from "./commands/init.js";
import { logger } from "./utils/logger.js";
import { encrypt } from "./commands/encrypt.js";
import { decrypt } from "./commands/decrypt.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

program
  .name("vault")
  .description("Encrypted .env management that travels with your git branches")
  .version(version);

program
  .command("init")
  .description("Initialize env-vault in the current project")
  .addOption(
    new Option("-k, --key-mode <mode>", "key mode for encryption/decryption")
      .choices(["file", "passphrase"])
      .default("file"),
  )
  .action(async (opts) => {
    try {
      init({ keyMode: opts.keyMode });
    } catch (err) {
      logger.error((err as Error).message);
      process.exit(1);
    }
  });

program
  .command("encrypt")
  .description("Encrypt the env file")
  .action(async () => {
    try {
      await encrypt();
    } catch (err) {
      logger.error((err as Error).message);
      process.exit(1);
    }
  });

program
  .command("decrypt")
  .description("Decrypt the encrypted vault file")
  .action(async () => {
    try {
      await decrypt();
    } catch (err) {
      logger.error((err as Error).message);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
