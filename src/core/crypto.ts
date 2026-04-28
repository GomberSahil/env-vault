import crypto from "node:crypto";

const VERSION = 0x01;

export function generateKey(): string {
  const result = crypto.randomBytes(32).toString("hex");

  return result;
}

function parseKey(key: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error("Key must be 64-char hex (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

type EncryptedPayload = {
  iv: Buffer<ArrayBuffer>;
  authTag: Buffer<ArrayBuffer>;
  cipherText: Buffer<ArrayBuffer>;
};

export function encrypt(plainText: string, key: string): EncryptedPayload {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", parseKey(key), iv);

  const cipherText = Buffer.concat([
    cipher.update(Buffer.from(plainText, "utf-8")),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return { iv, authTag, cipherText };
}

export function decrypt(payload: EncryptedPayload, key: string): string {
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      parseKey(key),
      payload.iv,
    );

    decipher.setAuthTag(payload.authTag);

    const result = Buffer.concat([
      decipher.update(payload.cipherText),
      decipher.final(),
    ]);

    return result.toString("utf-8");
  } catch (error) {
    if (
      (error as Error).message ===
      "Unsupported state or unable to authenticate data"
    ) {
      throw new Error("Invalid Key or Corrupted Vault");
    }

    throw new Error("Decryption failed");
  }
}

export function serializeVault(payload: EncryptedPayload): string {
  if (!Buffer.isBuffer(payload.iv) || payload.iv.length !== 12) {
    throw new Error("IV must be 12 bytes");
  }

  if (!Buffer.isBuffer(payload.authTag) || payload.authTag.length !== 16) {
    throw new Error("authTag must be 16 bytes");
  }

  if (!Buffer.isBuffer(payload.cipherText)) {
    throw new Error("cipherText must be Buffer");
  }

  const versionBuf = Buffer.from([VERSION]);

  return Buffer.concat([
    versionBuf,
    payload.iv,
    payload.authTag,
    payload.cipherText,
  ]).toString("base64");
}

export function parseVault(encoded: string): EncryptedPayload {
  const buf = Buffer.from(encoded, "base64");

  if (buf.length < 1 + 12 + 16) {
    throw new Error("Invalid vault payload length");
  }

  if (buf.readUInt8(0) !== VERSION) {
    throw new Error("Invalid vault format");
  }

  const iv = buf.subarray(1, 13);
  const authTag = buf.subarray(13, 29);
  const cipherText = buf.subarray(29);

  return { iv, authTag, cipherText };
}
