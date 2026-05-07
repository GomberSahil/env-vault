import path from "node:path";

const root = process.cwd();

export const PATHS = {
  config: path.join(root, ".vault-config.json"),
  vault: path.join(root, ".env.shared.vault"),
  env: path.join(root, ".env"),
  envLocal: path.join(root, ".env.local"),
  envKey: path.join(root, ".env.key"),
  envExample: path.join(root, ".env.example"),
};
