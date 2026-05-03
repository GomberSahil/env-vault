import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { encryptVault, decryptVault, writeEnvFile, VaultConfig } from "../../src/core/vault.js";
import { generateKey } from "../../src/core/crypto.js";
import { parseEnv } from "../../src/core/env-parser.js";

describe("vault", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vault-tests-"));
  const envPath = path.join(tempDir, ".env");
  const localEnvPath = path.join(tempDir, ".env.local");
  const vaultPath = path.join(tempDir, ".vault");
  const keyPath = path.join(tempDir, ".key");
  const outEnvPath = path.join(tempDir, ".out.env");

  const cfg: VaultConfig = {
    projectSlug: "test-project",
    keyMode: "file",
    keyPath: keyPath,
    argon2Salt: "",
  };

  beforeAll(() => {
    // create a mock key file
    const masterKey = generateKey();
    fs.writeFileSync(keyPath, masterKey, "utf-8");
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("encryptVault → decryptVault roundtrip recovers all keys", async () => {
    // Setup initial .env and .env.local
    const initialEnv = "SECRET=supersecret\nPORT=3000\n";
    const localEnv = "PORT=8080\nLOCAL_ONLY=yes\n";
    
    fs.writeFileSync(envPath, initialEnv, "utf-8");
    fs.writeFileSync(localEnvPath, localEnv, "utf-8");

    // Encrypt
    await encryptVault(envPath, vaultPath, cfg);
    expect(fs.existsSync(vaultPath)).toBe(true);

    // Decrypt
    const result = await decryptVault(vaultPath, localEnvPath, cfg);

    // Merged results expected: 
    // .env has SECRET=supersecret, PORT=3000
    // .env.local has PORT=8080, LOCAL_ONLY=yes
    // So final result should have PORT=8080 (local overrides), SECRET=supersecret, LOCAL_ONLY=yes
    expect(result).toEqual({
      SECRET: "supersecret",
      PORT: "8080",
      LOCAL_ONLY: "yes",
    });
  });

  it("decryptVault with missing .env.local still succeeds", async () => {
    const missingLocalPath = path.join(tempDir, ".env.missing.local");
    // Ensure it doesn't exist
    if (fs.existsSync(missingLocalPath)) fs.rmSync(missingLocalPath);

    // We can reuse the vault file from the previous test
    // since the encrypted vault contains SECRET=supersecret, PORT=3000
    
    const result = await decryptVault(vaultPath, missingLocalPath, cfg);

    expect(result).toEqual({
      SECRET: "supersecret",
      PORT: "3000",
    });
  });

  it("writeEnvFile produces parseable output", () => {
    const envData = {
      APP_NAME: "my-app",
      DB_PASS: "complex\"pass'word",
      EMPTY: "",
    };

    writeEnvFile(outEnvPath, envData);
    expect(fs.existsSync(outEnvPath)).toBe(true);

    const raw = fs.readFileSync(outEnvPath, "utf-8");
    const parsed = parseEnv(raw);

    expect(parsed).toEqual(envData);
  });
});
