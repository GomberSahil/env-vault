import fs from "node:fs";
import { PATHS } from "../paths.js";
import { logger } from "./logger.js";

export function ensureGitignore() {
  const filesToIgnore = [".env", ".env.key", ".env.local"];
  let gitignoreContent = "";

  if (fs.existsSync(PATHS.gitignore)) {
    gitignoreContent = fs.readFileSync(PATHS.gitignore, "utf-8");
  }

  const linesToAdd = filesToIgnore.filter((file) => {
    // Check if the file is already ignored (handling both exact match and variations)
    const regex = new RegExp(`(^|\\n)${file.replace(".", "\\.")}\\s*($|\\n)`);

    return !regex.test(gitignoreContent);
  });

  if (linesToAdd.length > 0) {
    const header = "\n# env-vault secrets";
    const newContent =
      (gitignoreContent.endsWith("\n") || gitignoreContent === ""
        ? ""
        : "\n") +
      header +
      "\n" +
      linesToAdd.join("\n") +
      "\n";

    fs.appendFileSync(PATHS.gitignore, newContent, "utf-8");
    logger.success(`Updated .gitignore with: ${linesToAdd.join(", ")}`);
  }
}
