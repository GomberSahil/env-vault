import { describe, it, expect } from "vitest";
import { parseEnv, serializeEnv } from "../../src/core/env-parser.js";

describe("env-parser", () => {
  describe("parseEnv", () => {
    it("handles DB_URL=postgres://x:y@host/db (value contains =)", () => {
      const raw = "DB_URL=postgres://x:y@host/db?param=value=123";
      const result = parseEnv(raw);
      expect(result).toEqual({
        DB_URL: "postgres://x:y@host/db?param=value=123",
      });
    });

    it("strips export prefix from 'export KEY=val'", () => {
      const raw = "export KEY=val\nexport OTHER=123";
      const result = parseEnv(raw);
      expect(result).toEqual({ KEY: "val", OTHER: "123" });
    });

    it("ignores comment lines and blank lines", () => {
      const raw = `
# This is a comment
KEY1=val1

# Another comment
KEY2=val2
`;
      const result = parseEnv(raw);
      expect(result).toEqual({ KEY1: "val1", KEY2: "val2" });
    });

    it("handles single and double quoted values", () => {
      const raw = `
DOUBLE="value1"
SINGLE='value2'
DOUBLE_WITH_SPACE="value 3"
SINGLE_WITH_SPACE='value 4'
`;
      const result = parseEnv(raw);
      expect(result).toEqual({
        DOUBLE: "value1",
        SINGLE: "value2",
        DOUBLE_WITH_SPACE: "value 3",
        SINGLE_WITH_SPACE: "value 4",
      });
    });

    it("handles multiline value in double quotes", () => {
      const raw = `MULTILINE_SINGLE="line1\nline2\nline3"
      MULTILINE_DOUBLE='line1\nline2\nline3'`;
      const result = parseEnv(raw);
      expect(result).toEqual({
        MULTILINE_SINGLE: "line1\nline2\nline3",
        MULTILINE_DOUBLE: "line1\nline2\nline3",
      });
    });
  });

  describe("serializeEnv", () => {
    it("wraps multiline values in quotes", () => {
      const obj = { MULTILINE: "line1\nline2\nline3" };
      const result = serializeEnv(obj);
      // It should replace literal newlines with \n and wrap in quotes
      expect(result).toBe('MULTILINE="line1\\nline2\\nline3"\n');
    });
  });

  describe("roundtrip", () => {
    it("parseEnv → serializeEnv → parseEnv roundtrip equals original", () => {
      const originalObj = {
        SIMPLE: "value",
        WITH_SPACE: "value 2",
        WITH_NEWLINE: "line1\nline2",
        WITH_EQUALS: "a=b=c",
        WITH_QUOTES: "some \"quotes\" and 'single'",
      };

      const serialized = serializeEnv(originalObj);
      const parsed = parseEnv(serialized);

      expect(parsed).toEqual(originalObj);
    });
  });
});
