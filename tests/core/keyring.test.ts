import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { loadKeyFromFile, deriveEnvKey } from "../../src/core/keyring";
import { generateKey } from "../../src/core/crypto";

describe("keyring", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadKeyFromFile", () => {
    it("throws if file missing", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      
      expect(() => loadKeyFromFile("nonexistent.key")).toThrow("Key file does not exist nonexistent.key");
    });

    it("throws if key is not 32 bytes", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      // Return a string that is not 64-char hex
      vi.spyOn(fs, "readFileSync").mockReturnValue("invalid-key-not-64-hex");
      
      expect(() => loadKeyFromFile("some.key")).toThrow("Key must be 64-char hex (32 bytes)");
    });
  });

  describe("deriveEnvKey", () => {
    it("with same master+context always returns same key", () => {
      const master = Buffer.from(generateKey(), "hex");
      const context = "production";
      
      const key1 = deriveEnvKey(master, context);
      const key2 = deriveEnvKey(master, context);
      
      expect(key1).toEqual(key2);
    });

    it("with same master+different context returns different key", () => {
      const master = Buffer.from(generateKey(), "hex");
      
      const key1 = deriveEnvKey(master, "production");
      const key2 = deriveEnvKey(master, "staging");
      
      expect(key1).not.toEqual(key2);
    });

    it("with different master+same context returns different key", () => {
      const master1 = Buffer.from(generateKey(), "hex");
      const master2 = Buffer.from(generateKey(), "hex");
      const context = "production";
      
      const key1 = deriveEnvKey(master1, context);
      const key2 = deriveEnvKey(master2, context);
      
      expect(key1).not.toEqual(key2);
    });
  });
});
