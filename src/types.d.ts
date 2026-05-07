export type KeyMode = "file" | "passphrase";

export type EncryptedPayload = {
  iv: Buffer<ArrayBuffer>;
  authTag: Buffer<ArrayBuffer>;
  cipherText: Buffer<ArrayBuffer>;
};

export type VaultConfig = {
  projectSlug: string;
  keyMode: KeyMode;
  keyPath: string;
  argon2Salt: string;
};

export type InitOptions = {
  keyMode: KeyMode;
};
