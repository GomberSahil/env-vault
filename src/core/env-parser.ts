export function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Regex to match:
  // 1. Optional export
  // 2. Key
  // 3. =
  // 4. Value (quoted or unquoted)
  // Handles multiline values inside quotes.
  const envRegex =
    /(?:^|\n)\s*(?:export\s+)?([a-zA-Z0-9_.-]+)\s*=\s*("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^#\n]*)/g;

  let match;
  while ((match = envRegex.exec(raw)) !== null) {
    const key = match[1];
    let value = match[2].trim();

    // Remove surrounding quotes and unescape special characters
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value
        .slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

export function serializeEnv(obj: Record<string, string>): string {
  let result = "";

  for (const [key, value] of Object.entries(obj)) {
    // Check for spaces, newlines, tabs, or special characters like quotes and hashes
    if (/[\s"'#\\]/.test(value) || value === "") {
      // Escape existing double quotes and newlines, and wrap in double quotes
      const escapedValue = value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
      result += `${key}="${escapedValue}"\n`;
    } else {
      result += `${key}=${value}\n`;
    }
  }

  return result;
}
