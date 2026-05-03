import fs from "node:fs";

import { decrypt, encrypt, parseVault, serializeVault } from "./crypto.js";
import { parseEnv, serializeEnv } from "./env-parser.js";
import { deriveEnvKey, loadKey } from "./keyring.js";
import { loadLocalEnv, mergeEnvs } from "./merger.js";

export interface VaultConfig {
  projectSlug: string;
  keyMode: "file" | "passphrase";
  keyPath: string;
  argon2Salt: string;
}

export async function encryptVault(
  envPath: string,
  vaultPath: string,
  cfg: VaultConfig,
): Promise<void> {
  // Load the ENV file
  const env = loadLocalEnv(envPath);
  const envJson = JSON.stringify(env);

  // Load the key from file or derive from passphrase
  const masterKey = await loadKey(cfg);

  // Derive the final/child key (based on project slug i.e. development/production/staging etc.)
  const key = deriveEnvKey(masterKey, cfg.projectSlug);

  // encrypt the env json with key
  const encrypted = encrypt(envJson, key.toString("hex"));

  // serialize the encrypted payload to base64 string
  const serialVault = serializeVault(encrypted);

  // write base64 strin gto vault file and make it non executable
  fs.writeFileSync(vaultPath, serialVault, { encoding: "utf-8" });
  fs.chmodSync(vaultPath, 0o644);
}

export async function decryptVault(
  vaultPath: string,
  localPath: string,
  cfg: VaultConfig,
): Promise<Record<string, string>> {
  // Read encrypted vault file
  const serialVault = fs.readFileSync(vaultPath, { encoding: "utf-8" });

  // Load the key from file or derive from passphrase
  const masterKey = await loadKey(cfg);

  // Derive the final/child key (based on project slug i.e. development/production/staging etc.)
  const key = deriveEnvKey(masterKey, cfg.projectSlug);

  // Parse the vault file
  const encrypted = parseVault(serialVault);

  // decrypted vault to get env json
  const envJson = decrypt(encrypted, key.toString("hex"));

  // Parse the env json
  const env: Record<string, string> = JSON.parse(envJson);

  // Load the local .env.local file and merge with env json
  const local = loadLocalEnv(localPath);

  return mergeEnvs(env, local);
}

export function writeEnvFile(
  envPath: string,
  env: Record<string, string>,
): void {
  // if .env exists show warning
  if (fs.existsSync(envPath)) {
    console.warn(`Overwriting existing ${envPath}`);
  }

  const rawEnvText = serializeEnv(env);

  // write env file
  fs.writeFileSync(envPath, rawEnvText, "utf-8");
  fs.chmodSync(envPath, 0o600);
}
