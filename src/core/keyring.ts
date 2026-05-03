import fs from "node:fs";
import { hkdfSync } from "node:crypto";

import argon2 from "argon2";

import { parseKey } from "./crypto.js";
import type { VaultConfig } from "./vault.js";
import { promptPassphrase } from "../utils/prompt.js";

export function loadKeyFromFile(keyPath: string): Buffer {
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Key file does not exist ${keyPath}`);
  }

  const key = fs.readFileSync(keyPath, "utf-8").trim();

  return parseKey(key);
}

export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Buffer,
): Promise<Buffer> {
  if (typeof passphrase !== "string" || passphrase.trim().length === 0) {
    throw new Error("Passphrase must be a non-empty string");
  }

  if (!Buffer.isBuffer(salt) || salt.length !== 32) {
    throw new Error("Salt must be exactly 32 bytes");
  }

  const hash = await argon2.hash(passphrase, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
    raw: true,
    salt,
  });

  return hash as Buffer;
}

export function deriveEnvKey(master: Buffer, context: string): Buffer {
  if (!Buffer.isBuffer(master) || master.length !== 32) {
    throw new Error("Master key must be exactly 32 bytes");
  }

  if (!context || context.trim().length === 0) {
    throw new Error("Context must be a non-empty string");
  }

  const info = Buffer.from("env-vault-v1:" + context);
  const salt = Buffer.alloc(32); // zero salt — correct for strong IKM

  return Buffer.from(hkdfSync("sha256", master, salt, info, 32));
}

export async function loadKey(cfg: VaultConfig): Promise<Buffer> {
  if (cfg.keyMode !== "file" && cfg.keyMode !== "passphrase")
    throw new Error(
      `Unknown keyMode: "${cfg.keyMode}". Expected "file" or "passphrase".`,
    );

  if (cfg.keyMode === "file") {
    return loadKeyFromFile(cfg.keyPath);
  }

  const passphrase = await promptPassphrase("Passphrase: ");

  const salt = Buffer.from(cfg.argon2Salt, "hex");

  return deriveKeyFromPassphrase(passphrase, salt);
}
