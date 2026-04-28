import { describe, it, expect } from "vitest";
import {
  generateKey,
  encrypt,
  decrypt,
  serializeVault,
  parseVault,
} from "../../src/core/crypto";

describe("crypto", () => {
  it("encrypt -> decrypt roundtrip recovers original string", () => {
    const key = generateKey();
    const original = "super secret string";
    const encrypted = encrypt(original, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(original);
  });

  it("every encrypt call produces a different IV", () => {
    const key = generateKey();
    const payload1 = encrypt("test", key);
    const payload2 = encrypt("test", key);
    expect(payload1.iv).not.toEqual(payload2.iv);
  });

  it("decrypt throws if ciphertext is tampered (flip one byte)", () => {
    const key = generateKey();
    const encrypted = encrypt("hello world", key);

    // Flip one byte in the cipherText
    const tamperedCipherText = Buffer.from(encrypted.cipherText);
    tamperedCipherText[0] ^= 1;

    const tamperedPayload = { ...encrypted, cipherText: tamperedCipherText };

    expect(() => decrypt(tamperedPayload, key)).toThrow(
      "Invalid Key or Corrupted Vault",
    );
  });

  it("decrypt throws if wrong key is used", () => {
    const key1 = generateKey();
    const key2 = generateKey();
    const encrypted = encrypt("hello world", key1);

    expect(() => decrypt(encrypted, key2)).toThrow(
      "Invalid Key or Corrupted Vault",
    );
  });

  it("parseVault throws on unknown version byte", () => {
    const key = generateKey();
    const encrypted = encrypt("test", key);

    // Valid vault format: [VERSION(1 byte), IV(12 bytes), AuthTag(16 bytes), CipherText]
    const validVaultBuf = Buffer.from(serializeVault(encrypted), "base64");

    // Change the version byte to something else (e.g. 0xff)
    validVaultBuf[0] = 0xff;

    const tamperedVaultString = validVaultBuf.toString("base64");

    expect(() => parseVault(tamperedVaultString)).toThrow(
      "Invalid vault format",
    );
  });

  it("serializeVault -> parseVault roundtrip is lossless", () => {
    const key = generateKey();
    const originalPayload = encrypt("serialization test", key);

    const serialized = serializeVault(originalPayload);
    const parsedPayload = parseVault(serialized);

    expect(parsedPayload.iv).toEqual(originalPayload.iv);
    expect(parsedPayload.authTag).toEqual(originalPayload.authTag);
    expect(parsedPayload.cipherText).toEqual(originalPayload.cipherText);

    // Verify it can still be decrypted
    const decrypted = decrypt(parsedPayload, key);
    expect(decrypted).toBe("serialization test");
  });
});
