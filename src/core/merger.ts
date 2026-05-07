import fs from "node:fs";

import { parseEnv } from "./env-parser.js";

export function mergeEnvs(
  shared: Record<string, string>,
  local: Record<string, string>,
): Record<string, string> {
  return { ...shared, ...local };
}

export function loadLocalEnv(localPath: string): Record<string, string> {
  if (!fs.existsSync(localPath)) {
    return {};
  }

  const raw = fs.readFileSync(localPath, "utf-8");

  if (!raw.trim()) {
    return {};
  }

  return parseEnv(raw);
}
