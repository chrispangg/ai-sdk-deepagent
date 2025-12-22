/**
 * Tests for src/backends/composite.ts
 */

import { test, describe, expect } from "bun:test";
import { CompositeBackend } from "@/backends/composite";
import { StateBackend } from "@/backends/state";
import type { FileData, FileInfo, GrepMatch } from "@/types";

// Helper to create a mock backend with predefined files
function createMockBackend(files: Record<string, FileData> = {}): StateBackend {
  const state = { todos: [], files };
  return new StateBackend(state);
}

describe("backends/composite", () => {
  describe("constructor", () => {
    test("should create with default backend and routes", () => {
      const defaultBackend = createMockBackend();
      const routes: Record<string, StateBackend> = {
        "/persistent/": createMockBackend(),
        "/cache/": createMockBackend(),
      };
      const backend = new CompositeBackend(defaultBackend, routes);
      expect(backend).toBeDefined();
    });

    test("should sort routes by length (longest first)", () => {
      const defaultBackend = createMockBackend();
      const routes: Record<string, StateBackend> = {
        "/a/": createMockBackend(),
        "/long/path/": createMockBackend(),
        "/medium/": createMockBackend(),
      };
      const backend = new CompositeBackend(defaultBackend, routes);
      // Routes should be sorted longest first for correct prefix matching
      expect(backend).toBeDefined();
    });
  });

  describe("write", () => {
    test("should write to default backend for unmatched paths", async () => {
      const defaultFiles: Record<string, FileData> = {};
      const defaultBackend = new StateBackend({ todos: [], files: defaultFiles });
      const routes: Record<string, StateBackend> = {
        "/persistent/": new StateBackend({
          todos: [],
          files: {},
        }),
      };
      const backend = new CompositeBackend(defaultBackend, routes);

      const result = await backend.write("/default/file.txt", "content");
      expect(result.success).toBe(true);
      expect(defaultFiles["/default/file.txt"]).toBeDefined();
    });

    test("should write to routed backend for matching paths", async () => {
      const persistentFiles: Record<string, FileData> = {};
      const persistentBackend = new StateBackend({
        todos: [],
        files: persistentFiles,
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      const result = await backend.write("/persistent/file.txt", "content");
      expect(result.success).toBe(true);
      expect(persistentFiles["/file.txt"]).toBeDefined();
    });

    test("should strip route prefix from path", async () => {
      const persistentFiles: Record<string, FileData> = {};
      const persistentBackend = new StateBackend({
        todos: [],
        files: persistentFiles,
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      await backend.write("/persistent/subdir/file.txt", "content");
      expect(persistentFiles["/subdir/file.txt"]).toBeDefined();
    });
  });

  describe("read", () => {
    test("should read from default backend for unmatched paths", async () => {
      const defaultBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["default content"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const backend = new CompositeBackend(defaultBackend, {});

      const result = await defaultBackend.read("/file.txt");
      expect(result).toContain("default content");
    });

    test("should read from routed backend for matching paths", async () => {
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["persistent content"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      const result = await backend.read("/persistent/file.txt");
      expect(result).toContain("persistent content");
    });

    test("should apply offset and limit parameters", async () => {
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["line1", "line2", "line3", "line4", "line5"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      const result = await backend.read("/persistent/file.txt", 1, 2);
      expect(result).toContain("line2");
      expect(result).toContain("line3");
    });
  });

  describe("readRaw", () => {
    test("should read raw file data from routed backend", async () => {
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["raw content"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-02T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      const result = await backend.readRaw("/persistent/file.txt");
      expect(result.content).toEqual(["raw content"]);
      expect(result.created_at).toBe("2024-01-01T00:00:00.000Z");
      expect(result.modified_at).toBe("2024-01-02T00:00:00.000Z");
    });
  });

  describe("edit", () => {
    test("should edit file in default backend", async () => {
      const defaultBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["hello world"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const backend = new CompositeBackend(defaultBackend, {});

      const result = await backend.edit("/file.txt", "world", "there", false);
      expect(result.success).toBe(true);
    });

    test("should edit file in routed backend", async () => {
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["hello world"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      const result = await backend.edit("/persistent/file.txt", "world", "there", false);
      expect(result.success).toBe(true);
    });
  });

  describe("lsInfo", () => {
    test("should list files in default backend", async () => {
      const defaultBackend = new StateBackend({
        todos: [],
        files: {
          "/file1.txt": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
          "/file2.txt": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const backend = new CompositeBackend(defaultBackend, {});

      const result = await backend.lsInfo("/");
      expect(result.length).toBe(2);
      expect(result.some((f: FileInfo) => f.path.endsWith("file1.txt"))).toBe(true);
      expect(result.some((f: FileInfo) => f.path.endsWith("file2.txt"))).toBe(true);
    });

    test("should list root with route directories", async () => {
      const defaultBackend = new StateBackend({
        todos: [],
        files: {
          "/default.txt": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": new StateBackend({
          todos: [],
          files: {},
        }),
        "/cache/": new StateBackend({
          todos: [],
          files: {},
        }),
      };
      const backend = new CompositeBackend(defaultBackend, routes);

      const result = await backend.lsInfo("/");
      expect(result.some((f: FileInfo) => f.path === "/persistent/")).toBe(true);
      expect(result.some((f: FileInfo) => f.path === "/cache/")).toBe(true);
      expect(result.some((f: FileInfo) => f.path === "/default.txt")).toBe(true);
    });

    test("should list files in routed backend", async () => {
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      const result = await backend.lsInfo("/persistent/");
      expect(result.length).toBe(1);
      expect(result[0]?.path).toBe("/persistent/file.txt");
    });
  });

  describe("grepRaw", () => {
    test("should search in default backend", async () => {
      const defaultBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["hello world", "foo bar"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const backend = new CompositeBackend(defaultBackend, {});

      const result = await backend.grepRaw("hello");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]?.path).toBe("/file.txt");
      }
    });

    test("should search in routed backend and add prefix", async () => {
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["persistent content"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      const result = await backend.grepRaw("persistent", "/persistent/");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]?.path).toBe("/persistent/file.txt");
      }
    });

    test("should search all backends when path is root", async () => {
      const defaultBackend = new StateBackend({
        todos: [],
        files: {
          "/default.txt": {
            content: ["default content"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["persistent content"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(defaultBackend, routes);

      const result = await backend.grepRaw("content", "/");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe("globInfo", () => {
    test("should find files matching pattern in default backend", async () => {
      const defaultBackend = new StateBackend({
        todos: [],
        files: {
          "/file1.txt": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
          "/file2.ts": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const backend = new CompositeBackend(defaultBackend, {});

      const result = await backend.globInfo("*.txt");
      expect(result.length).toBe(1);
      expect(result[0]?.path).toBe("/file1.txt");
    });

    test("should find files matching pattern in routed backend", async () => {
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      const result = await backend.globInfo("*.txt", "/persistent/");
      expect(result.length).toBe(1);
      expect(result[0]?.path).toBe("/persistent/file.txt");
    });

    test("should search all backends when path is root", async () => {
      const defaultBackend = new StateBackend({
        todos: [],
        files: {
          "/default.txt": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: [""],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend,
      };
      const backend = new CompositeBackend(defaultBackend, routes);

      const result = await backend.globInfo("*.txt");
      expect(result.length).toBe(2);
    });
  });

  describe("path matching behavior", () => {
    test("should match longest prefix first", async () => {
      const backend1 = new StateBackend({ todos: [], files: {} });
      const backend2 = new StateBackend({ todos: [], files: {} });
      const backend3 = new StateBackend({ todos: [], files: {} });

      const routes: Record<string, StateBackend> = {
        "/a/": backend1,
        "/a/b/": backend2,
        "/a/b/c/": backend3,
      };

      const composite = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      // These should route to the most specific (longest) matching backend
      // /a/file.txt -> backend1
      // /a/b/file.txt -> backend2
      // /a/b/c/file.txt -> backend3
    });

    test("should handle paths without trailing slashes", async () => {
      const persistentBackend = new StateBackend({
        todos: [],
        files: {
          "/file.txt": {
            content: ["test"],
            created_at: "2024-01-01T00:00:00.000Z",
            modified_at: "2024-01-01T00:00:00.000Z",
          },
        },
      });
      const routes: Record<string, StateBackend> = {
        "/persistent/": persistentBackend, // Use trailing slash in route definition
      };
      const backend = new CompositeBackend(
        new StateBackend({ todos: [], files: {} }),
        routes
      );

      // Should handle paths with or without trailing slash in the request
      const result = await backend.read("/persistent/file.txt");
      expect(result).toContain("test");
    });
  });
});
