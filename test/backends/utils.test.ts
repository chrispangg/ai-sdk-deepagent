/**
 * Tests for src/backends/utils.ts utility functions
 */

import { test, describe, expect } from "bun:test";
import type { FileData } from "@/types";
import {
  formatContentWithLineNumbers,
  checkEmptyContent,
  fileDataToString,
  createFileData,
  updateFileData,
  formatReadResponse,
  performStringReplacement,
  validatePath,
  globSearchFiles,
  grepMatchesFromFiles,
} from "@/backends/utils";

describe("backends/utils", () => {
  describe("formatContentWithLineNumbers", () => {
    test("should format single line with line number", () => {
      const result = formatContentWithLineNumbers("hello world");
      expect(result).toBe("     1\thello world");
    });

    test("should format multiple lines with line numbers", () => {
      const result = formatContentWithLineNumbers("line1\nline2\nline3");
      expect(result).toBe("     1\tline1\n     2\tline2\n     3\tline3");
    });

    test("should handle string array input", () => {
      const result = formatContentWithLineNumbers(["line1", "line2"]);
      expect(result).toBe("     1\tline1\n     2\tline2");
    });

    test("should handle empty string", () => {
      const result = formatContentWithLineNumbers("");
      expect(result).toBe("");
    });

    test("should handle single newline", () => {
      const result = formatContentWithLineNumbers("\n");
      // A single newline produces one empty line with line number
      expect(result).toBe("     1\t");
    });

    test("should start from custom line number", () => {
      const result = formatContentWithLineNumbers("line1\nline2", 10);
      expect(result).toBe("    10\tline1\n    11\tline2");
    });

    test("should split long lines into chunks", () => {
      const longLine = "a".repeat(12000);
      const result = formatContentWithLineNumbers(longLine);
      const lines = result.split("\n");
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0]).toMatch(/^\s+1\t/);
      expect(lines[1]).toMatch(/^\s+1\.1\t/);
    });

    test("should handle empty lines in content", () => {
      const result = formatContentWithLineNumbers("line1\n\nline3");
      expect(result).toBe("     1\tline1\n     2\t\n     3\tline3");
    });
  });

  describe("checkEmptyContent", () => {
    test("should return warning for empty string", () => {
      const result = checkEmptyContent("");
      expect(result).toBe("System reminder: File exists but has empty contents");
    });

    test("should return warning for whitespace-only string", () => {
      const result = checkEmptyContent("   \n\t  ");
      expect(result).toBe("System reminder: File exists but has empty contents");
    });

    test("should return null for non-empty content", () => {
      const result = checkEmptyContent("hello world");
      expect(result).toBeNull();
    });

    test("should return null for content with leading/trailing whitespace", () => {
      const result = checkEmptyContent("  hello  ");
      expect(result).toBeNull();
    });
  });

  describe("fileDataToString", () => {
    test("should join content array with newlines", () => {
      const fileData: FileData = {
        content: ["line1", "line2", "line3"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-01T00:00:00.000Z",
      };
      const result = fileDataToString(fileData);
      expect(result).toBe("line1\nline2\nline3");
    });

    test("should handle single line", () => {
      const fileData: FileData = {
        content: ["single line"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-01T00:00:00.000Z",
      };
      const result = fileDataToString(fileData);
      expect(result).toBe("single line");
    });

    test("should handle empty content", () => {
      const fileData: FileData = {
        content: [],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-01T00:00:00.000Z",
      };
      const result = fileDataToString(fileData);
      expect(result).toBe("");
    });
  });

  describe("createFileData", () => {
    test("should create FileData from string content", () => {
      const result = createFileData("line1\nline2");
      expect(result.content).toEqual(["line1", "line2"]);
      expect(result.created_at).toBeTruthy();
      expect(result.modified_at).toBeTruthy();
    });

    test("should use provided createdAt timestamp", () => {
      const customTime = "2023-01-01T00:00:00.000Z";
      const result = createFileData("content", customTime);
      expect(result.created_at).toBe(customTime);
      expect(result.modified_at).not.toBe(customTime); // Should be now
    });

    test("should handle single line content", () => {
      const result = createFileData("single line");
      expect(result.content).toEqual(["single line"]);
    });

    test("should handle empty string", () => {
      const result = createFileData("");
      expect(result.content).toEqual([""]);
    });
  });

  describe("updateFileData", () => {
    test("should update content and preserve created_at", async () => {
      const original = createFileData("original", "2023-01-01T00:00:00.000Z");
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
      const updated = updateFileData(original, "new content");
      expect(updated.content).toEqual(["new content"]);
      expect(updated.created_at).toBe("2023-01-01T00:00:00.000Z");
      expect(updated.modified_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test("should update content from string", () => {
      const original = createFileData("old");
      const updated = updateFileData(original, "line1\nline2");
      expect(updated.content).toEqual(["line1", "line2"]);
    });
  });

  describe("formatReadResponse", () => {
    test("should return empty warning for empty file", () => {
      const fileData: FileData = {
        content: [],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-01T00:00:00.000Z",
      };
      const result = formatReadResponse(fileData, 0, 100);
      expect(result).toBe("System reminder: File exists but has empty contents");
    });

    test("should format content with line numbers", () => {
      const fileData: FileData = {
        content: ["line1", "line2", "line3"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-01T00:00:00.000Z",
      };
      const result = formatReadResponse(fileData, 0, 10);
      expect(result).toContain("     1\tline1");
      expect(result).toContain("     2\tline2");
      expect(result).toContain("     3\tline3");
    });

    test("should apply offset", () => {
      const fileData: FileData = {
        content: ["a", "b", "c", "d", "e"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-01T00:00:00.000Z",
      };
      const result = formatReadResponse(fileData, 2, 2);
      expect(result).toBe("     3\tc\n     4\td");
    });

    test("should apply limit", () => {
      const fileData: FileData = {
        content: ["a", "b", "c", "d", "e"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-01T00:00:00.000Z",
      };
      const result = formatReadResponse(fileData, 0, 3);
      expect(result).toBe("     1\ta\n     2\tb\n     3\tc");
    });

    test("should return error for offset exceeding file length", () => {
      const fileData: FileData = {
        content: ["a", "b", "c"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-01T00:00:00.000Z",
      };
      const result = formatReadResponse(fileData, 10, 10);
      expect(result).toContain("Error: Line offset 10 exceeds file length");
    });
  });

  describe("performStringReplacement", () => {
    test("should replace single occurrence", () => {
      const result = performStringReplacement("hello world", "world", "there", false);
      expect(result).toEqual(["hello there", 1]);
    });

    test("should replace all occurrences when replaceAll is true", () => {
      const result = performStringReplacement("a b a b a", "a", "x", true);
      expect(result).toEqual(["x b x b x", 3]);
    });

    test("should return error for single occurrence without replaceAll flag", () => {
      const result = performStringReplacement("a b a b", "a", "x", false);
      expect(typeof result).toBe("string");
      if (typeof result === "string") {
        expect(result).toContain("appears 2 times");
      }
    });

    test("should return error when string not found", () => {
      const result = performStringReplacement("hello world", "goodbye", "hi", false);
      expect(result).toBe("Error: String not found in file: 'goodbye'");
    });

    test("should handle empty string replacement", () => {
      const result = performStringReplacement("hello world", "world", "", false);
      expect(result).toEqual(["hello ", 1]);
    });

    test("should handle special regex characters", () => {
      const result = performStringReplacement("price: $100", "$100", "$200", false);
      expect(result).toEqual(["price: $200", 1]);
    });
  });

  describe("validatePath", () => {
    test("should normalize path without leading slash", () => {
      const result = validatePath("home/user");
      expect(result).toBe("/home/user/");
    });

    test("should add trailing slash if missing", () => {
      const result = validatePath("/home/user");
      expect(result).toBe("/home/user/");
    });

    test("should keep existing trailing slash", () => {
      const result = validatePath("/home/user/");
      expect(result).toBe("/home/user/");
    });

    test("should default to root for empty string", () => {
      const result = validatePath("");
      expect(result).toBe("/");
    });

    test("should default to root for null", () => {
      const result = validatePath(null);
      expect(result).toBe("/");
    });

    test("should default to root for undefined", () => {
      const result = validatePath(undefined);
      expect(result).toBe("/");
    });

    test("should throw error for whitespace-only path", () => {
      expect(() => validatePath("   ")).toThrow("Path cannot be empty");
    });
  });

  describe("globSearchFiles", () => {
    const files: Record<string, FileData> = {
      "/src/index.ts": {
        content: ["// index"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-02T00:00:00.000Z",
      },
      "/src/utils.ts": {
        content: ["// utils"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-02T00:00:00.000Z",
      },
      "/test/index.test.ts": {
        content: ["// test"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-02T00:00:00.000Z",
      },
    };

    test("should find files matching pattern", () => {
      const result = globSearchFiles(files, "*.ts", "/src");
      expect(result).toContain("/src/index.ts");
      expect(result).toContain("/src/utils.ts");
      expect(result).not.toContain("/test/index.test.ts");
    });

    test("should find files recursively with **", () => {
      const result = globSearchFiles(files, "**/*.ts");
      expect(result).toContain("/src/index.ts");
      expect(result).toContain("/src/utils.ts");
      expect(result).toContain("/test/index.test.ts");
    });

    test("should return 'No files found' for no matches", () => {
      const result = globSearchFiles(files, "*.js", "/src");
      expect(result).toBe("No files found");
    });

    test("should handle dot files with dot:true", () => {
      const filesWithDot: Record<string, FileData> = {
        "/src/.env": {
          content: ["SECRET=xxx"],
          created_at: "2024-01-01T00:00:00.000Z",
          modified_at: "2024-01-02T00:00:00.000Z",
        },
      };
      const result = globSearchFiles(filesWithDot, ".*", "/src");
      expect(result).toContain("/src/.env");
    });
  });

  describe("grepMatchesFromFiles", () => {
    const files: Record<string, FileData> = {
      "/src/index.ts": {
        content: ["export function foo() {}", "export function bar() {}"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-02T00:00:00.000Z",
      },
      "/src/utils.ts": {
        content: ["import { foo } from './index'", "export const baz = 1"],
        created_at: "2024-01-01T00:00:00.000Z",
        modified_at: "2024-01-02T00:00:00.000Z",
      },
    };

    test("should find pattern matches across files", () => {
      const result = grepMatchesFromFiles(files, "function");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty("path");
        expect(result[0]).toHaveProperty("line");
        expect(result[0]).toHaveProperty("text");
      }
    });

    test("should filter by path prefix", () => {
      const result = grepMatchesFromFiles(files, "function", "/src");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(2); // Both files match
      }
    });

    test("should filter by glob pattern", () => {
      const result = grepMatchesFromFiles(files, "export", null, "*.ts");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
      }
    });

    test("should return error for invalid regex", () => {
      const result = grepMatchesFromFiles(files, "[invalid");
      expect(typeof result).toBe("string");
      if (typeof result === "string") {
        expect(result).toContain("Invalid regex pattern");
      }
    });

    test("should return empty array for no matches", () => {
      const result = grepMatchesFromFiles(files, "nonexistent");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(0);
      }
    });

    test("should handle special regex characters", () => {
      const result = grepMatchesFromFiles(files, "export\\s+function");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });
});
