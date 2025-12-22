import { test, expect, beforeEach, afterEach } from "bun:test";
import { FileSaver } from "@/checkpointer/file-saver.ts";
import { rmSync, existsSync } from "node:fs";
import type { Checkpoint } from "@/checkpointer/types.ts";

const TEST_DIR = "./.test-checkpoints";

const createTestCheckpoint = (threadId: string, step = 1): Checkpoint => ({
  threadId,
  step,
  messages: [{ role: "user", content: "test message" }],
  state: { todos: [], files: {} },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

let saver: FileSaver;

beforeEach(() => {
  saver = new FileSaver({ dir: TEST_DIR });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
});

test("FileSaver > creates directory if it doesn't exist", () => {
  expect(existsSync(TEST_DIR)).toBe(true);
});

test("FileSaver > save and load checkpoint", async () => {
  await saver.save(createTestCheckpoint("test-thread"));
  
  const loaded = await saver.load("test-thread");
  expect(loaded?.threadId).toBe("test-thread");
  expect(loaded?.messages).toHaveLength(1);
});

test("FileSaver > load returns undefined for non-existent thread", async () => {
  const loaded = await saver.load("non-existent");
  expect(loaded).toBeUndefined();
});

test("FileSaver > list returns saved threads", async () => {
  await saver.save(createTestCheckpoint("thread-a"));
  await saver.save(createTestCheckpoint("thread-b"));
  
  const threads = await saver.list();
  expect(threads).toHaveLength(2);
  expect(threads).toContain("thread-a");
  expect(threads).toContain("thread-b");
});

test("FileSaver > delete removes file", async () => {
  await saver.save(createTestCheckpoint("to-delete"));
  expect(await saver.exists("to-delete")).toBe(true);
  
  await saver.delete("to-delete");
  expect(await saver.exists("to-delete")).toBe(false);
});

test("FileSaver > exists returns correct value", async () => {
  expect(await saver.exists("test-thread")).toBe(false);
  
  await saver.save(createTestCheckpoint("test-thread"));
  expect(await saver.exists("test-thread")).toBe(true);
});

test("FileSaver > sanitizes unsafe thread IDs", async () => {
  const unsafeId = "thread/with:special*chars?";
  await saver.save(createTestCheckpoint(unsafeId));
  
  const loaded = await saver.load(unsafeId);
  expect(loaded?.threadId).toBe(unsafeId);
});

test("FileSaver > overwrites existing checkpoint", async () => {
  await saver.save(createTestCheckpoint("thread-1", 1));
  await saver.save(createTestCheckpoint("thread-1", 2));
  
  const loaded = await saver.load("thread-1");
  expect(loaded?.step).toBe(2);
  
  const threads = await saver.list();
  expect(threads).toHaveLength(1);
});

test("FileSaver > handles empty directory for list", async () => {
  // Delete the directory
  rmSync(TEST_DIR, { recursive: true });
  
  const threads = await saver.list();
  expect(threads).toEqual([]);
});

test("FileSaver > handles corrupted JSON file", async () => {
  const { writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  
  // Write invalid JSON
  writeFileSync(join(TEST_DIR, "corrupted.json"), "{ invalid json", "utf-8");
  
  const loaded = await saver.load("corrupted");
  expect(loaded).toBeUndefined();
});

test("FileSaver > updatedAt is set on save", async () => {
  const checkpoint = createTestCheckpoint("thread-1");
  const originalUpdatedAt = checkpoint.updatedAt;
  
  await new Promise(resolve => setTimeout(resolve, 10));
  
  await saver.save(checkpoint);
  const loaded = await saver.load("thread-1");
  
  expect(loaded?.updatedAt).toBeDefined();
  expect(loaded?.updatedAt).not.toBe(originalUpdatedAt);
});

