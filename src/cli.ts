#!/usr/bin/env node
import { createRequire } from "node:module";

import { Option, program } from "commander";

import { init } from "./commands/init.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

program
  .name("env-vault")
  .description("Encrypted .env management that travels with your git branches")
  .version(version);

program
  .command("init")
  .description("Initialize env-vault in the current project")
  .addOption(
    new Option("--key-mode <mode>", "key mode for encryption/decryption")
      .choices(["file", "passphrase"])
      .default("file"),
  )
  .action(async (opts) => {
    try {
      init({ keyMode: opts.keyMode });
    } catch (err) {
      console.error("✗", (err as Error).message);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
