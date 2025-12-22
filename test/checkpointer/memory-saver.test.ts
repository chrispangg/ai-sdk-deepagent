import { test, expect, beforeEach } from "bun:test";
import { MemorySaver } from "@/checkpointer/memory-saver.ts";
import type { Checkpoint } from "@/checkpointer/types.ts";

const createTestCheckpoint = (threadId: string, step = 1): Checkpoint => ({
  threadId,
  step,
  messages: [{ role: "user", content: "test" }],
  state: { todos: [], files: {} },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

let saver: MemorySaver;

beforeEach(() => {
  saver = new MemorySaver();
});

test("MemorySaver > save and load checkpoint", async () => {
  const checkpoint = createTestCheckpoint("thread-1");
  await saver.save(checkpoint);
  
  const loaded = await saver.load("thread-1");
  expect(loaded).toBeDefined();
  expect(loaded?.threadId).toBe("thread-1");
  expect(loaded?.step).toBe(1);
});

test("MemorySaver > load returns undefined for non-existent thread", async () => {
  const loaded = await saver.load("non-existent");
  expect(loaded).toBeUndefined();
});

test("MemorySaver > list returns all thread IDs", async () => {
  await saver.save(createTestCheckpoint("thread-1"));
  await saver.save(createTestCheckpoint("thread-2"));
  
  const threads = await saver.list();
  expect(threads).toContain("thread-1");
  expect(threads).toContain("thread-2");
  expect(threads.length).toBe(2);
});

test("MemorySaver > delete removes checkpoint", async () => {
  await saver.save(createTestCheckpoint("thread-1"));
  await saver.delete("thread-1");
  
  const loaded = await saver.load("thread-1");
  expect(loaded).toBeUndefined();
});

test("MemorySaver > exists returns correct value", async () => {
  expect(await saver.exists("thread-1")).toBe(false);
  
  await saver.save(createTestCheckpoint("thread-1"));
  expect(await saver.exists("thread-1")).toBe(true);
  
  await saver.delete("thread-1");
  expect(await saver.exists("thread-1")).toBe(false);
});

test("MemorySaver > save overwrites existing checkpoint", async () => {
  await saver.save(createTestCheckpoint("thread-1", 1));
  await saver.save(createTestCheckpoint("thread-1", 2));
  
  const loaded = await saver.load("thread-1");
  expect(loaded?.step).toBe(2);
});

test("MemorySaver > namespace isolates checkpoints", async () => {
  const saver1 = new MemorySaver({ namespace: "ns1" });
  const saver2 = new MemorySaver({ namespace: "ns2" });
  
  await saver1.save(createTestCheckpoint("thread-1"));
  
  expect(await saver1.exists("thread-1")).toBe(true);
  expect(await saver2.exists("thread-1")).toBe(false);
  
  const list1 = await saver1.list();
  const list2 = await saver2.list();
  
  expect(list1).toContain("thread-1");
  expect(list2).not.toContain("thread-1");
});

test("MemorySaver > clear removes all checkpoints", async () => {
  await saver.save(createTestCheckpoint("thread-1"));
  await saver.save(createTestCheckpoint("thread-2"));
  
  expect(saver.size()).toBe(2);
  
  saver.clear();
  
  expect(saver.size()).toBe(0);
  expect(await saver.list()).toEqual([]);
});

test("MemorySaver > size returns correct count", async () => {
  expect(saver.size()).toBe(0);
  
  await saver.save(createTestCheckpoint("thread-1"));
  expect(saver.size()).toBe(1);
  
  await saver.save(createTestCheckpoint("thread-2"));
  expect(saver.size()).toBe(2);
  
  await saver.delete("thread-1");
  expect(saver.size()).toBe(1);
});

test("MemorySaver > updatedAt is set on save", async () => {
  const checkpoint = createTestCheckpoint("thread-1");
  const originalUpdatedAt = checkpoint.updatedAt;
  
  // Wait a bit to ensure timestamp changes
  await new Promise(resolve => setTimeout(resolve, 10));
  
  await saver.save(checkpoint);
  const loaded = await saver.load("thread-1");
  
  expect(loaded?.updatedAt).toBeDefined();
  expect(loaded?.updatedAt).not.toBe(originalUpdatedAt);
});

