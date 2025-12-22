/**
 * Integration tests for checkpointer functionality.
 * 
 * These tests verify end-to-end checkpoint save/load behavior with a real agent.
 * Tests are skipped if ANTHROPIC_API_KEY is not set.
 */

import { test, expect, beforeEach } from "bun:test";
import { createDeepAgent, MemorySaver, FileSaver } from "@/index.ts";
import { createAnthropic } from '@ai-sdk/anthropic';
import { rmSync, existsSync } from "node:fs";

const anthropic = createAnthropic({
  baseURL: 'https://api.anthropic.com/v1',
});

// Skip tests if no API key
const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
const TEST_DIR = "./.test-integration-checkpoints";

// Helper to clean up test directory
function cleanupTestDir() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
}

beforeEach(() => {
  cleanupTestDir();
});

test.skipIf(!hasApiKey)("Checkpointer > saves and restores conversation state", async () => {
  const checkpointer = new MemorySaver();
  
  const agent = createDeepAgent({
    model: anthropic("claude-haiku-4-5-20251001"),
    checkpointer,
  });
  
  const threadId = "test-" + Date.now();
  let checkpointSaved = false;
  let checkpointLoaded = false;
  
  // First interaction
  for await (const event of agent.streamWithEvents({
    prompt: "Remember that my favorite color is blue",
    threadId,
  })) {
    if (event.type === 'checkpoint-saved') {
      checkpointSaved = true;
    }
  }
  
  expect(checkpointSaved).toBe(true);
  
  // Verify checkpoint exists
  const checkpoint = await checkpointer.load(threadId);
  expect(checkpoint).toBeDefined();
  expect(checkpoint?.messages.length).toBeGreaterThan(0);
  expect(checkpoint?.threadId).toBe(threadId);
  
  // Second interaction - verify context is maintained
  let foundBlue = false;
  for await (const event of agent.streamWithEvents({
    prompt: "What is my favorite color?",
    threadId,
  })) {
    if (event.type === 'checkpoint-loaded') {
      checkpointLoaded = true;
    }
    if (event.type === "text" && event.text.toLowerCase().includes("blue")) {
      foundBlue = true;
    }
  }
  
  expect(checkpointLoaded).toBe(true);
  expect(foundBlue).toBe(true);
}, 30000); // 30 second timeout for API calls

test.skipIf(!hasApiKey)("Checkpointer > preserves todos across invocations", async () => {
  const checkpointer = new MemorySaver();
  
  const agent = createDeepAgent({
    model: anthropic("claude-haiku-4-5-20251001"),
    checkpointer,
  });
  
  const threadId = "test-todos-" + Date.now();
  let todosCreated = false;
  
  // First interaction - create todos
  for await (const event of agent.streamWithEvents({
    prompt: "Create a todo list with 3 items for building a web app",
    threadId,
  })) {
    if (event.type === 'todos-changed' && event.todos.length > 0) {
      todosCreated = true;
    }
  }
  
  expect(todosCreated).toBe(true);
  
  // Verify todos in checkpoint
  const checkpoint1 = await checkpointer.load(threadId);
  expect(checkpoint1?.state.todos.length).toBeGreaterThan(0);
  const todoCount = checkpoint1?.state.todos.length || 0;
  
  // Second interaction - todos should still be there
  let todosStillPresent = false;
  for await (const event of agent.streamWithEvents({
    prompt: "How many todos do we have?",
    threadId,
  })) {
    if (event.type === 'done') {
      todosStillPresent = event.state.todos.length === todoCount;
    }
  }
  
  expect(todosStillPresent).toBe(true);
}, 30000);

test.skipIf(!hasApiKey)("Checkpointer > thread isolation works correctly", async () => {
  const checkpointer = new MemorySaver();
  
  const agent = createDeepAgent({
    model: anthropic("claude-haiku-4-5-20251001"),
    checkpointer,
  });
  
  const threadA = "test-a-" + Date.now();
  const threadB = "test-b-" + Date.now();
  
  // Create separate contexts in two threads
  for await (const event of agent.streamWithEvents({
    prompt: "Remember: we're working on Project Alpha",
    threadId: threadA,
  })) {
    // Just consume events
  }
  
  for await (const event of agent.streamWithEvents({
    prompt: "Remember: we're working on Project Beta",
    threadId: threadB,
  })) {
    // Just consume events
  }
  
  // Verify threads are isolated
  let foundAlpha = false;
  let foundBeta = false;
  
  for await (const event of agent.streamWithEvents({
    prompt: "What project are we working on?",
    threadId: threadA,
  })) {
    if (event.type === "text" && event.text.toLowerCase().includes("alpha")) {
      foundAlpha = true;
    }
    if (event.type === "text" && event.text.toLowerCase().includes("beta")) {
      foundBeta = true;
    }
  }
  
  expect(foundAlpha).toBe(true);
  expect(foundBeta).toBe(false); // Thread A should NOT know about Beta
  
  // Verify list shows both threads
  const threads = await checkpointer.list();
  expect(threads).toContain(threadA);
  expect(threads).toContain(threadB);
}, 45000);

test.skipIf(!hasApiKey)("FileSaver > persists checkpoints to disk", async () => {
  const checkpointer = new FileSaver({ dir: TEST_DIR });
  
  const agent = createDeepAgent({
    model: anthropic("claude-haiku-4-5-20251001"),
    checkpointer,
  });
  
  const threadId = "test-file-" + Date.now();
  
  // Create a checkpoint
  for await (const event of agent.streamWithEvents({
    prompt: "Say hello",
    threadId,
  })) {
    // Just consume events
  }
  
  // Verify file was created
  expect(existsSync(TEST_DIR)).toBe(true);
  const threads = await checkpointer.list();
  expect(threads).toContain(threadId);
  
  // Load checkpoint
  const checkpoint = await checkpointer.load(threadId);
  expect(checkpoint).toBeDefined();
  expect(checkpoint?.threadId).toBe(threadId);
  
  // Cleanup
  cleanupTestDir();
}, 20000);

test.skipIf(!hasApiKey)("Checkpointer > step counter increments correctly", async () => {
  const checkpointer = new MemorySaver();
  
  const agent = createDeepAgent({
    model: anthropic("claude-haiku-4-5-20251001"),
    checkpointer,
  });
  
  const threadId = "test-steps-" + Date.now();
  let maxStep = 0;
  
  // First interaction
  for await (const event of agent.streamWithEvents({
    prompt: "Create 2 todos",
    threadId,
  })) {
    if (event.type === 'checkpoint-saved') {
      maxStep = Math.max(maxStep, event.step);
    }
  }
  
  const step1 = maxStep;
  expect(step1).toBeGreaterThan(0);
  
  // Second interaction - steps should continue from previous
  maxStep = 0;
  for await (const event of agent.streamWithEvents({
    prompt: "Add one more todo",
    threadId,
  })) {
    if (event.type === 'checkpoint-saved') {
      maxStep = Math.max(maxStep, event.step);
    }
  }
  
  const step2 = maxStep;
  expect(step2).toBeGreaterThan(step1); // Steps should increment
}, 30000);

test("Checkpointer > without threadId, no checkpoints are saved", async () => {
  const checkpointer = new MemorySaver();
  
  const agent = createDeepAgent({
    model: anthropic("claude-haiku-4-5-20251001"),
    checkpointer,
  });
  
  let checkpointSaved = false;
  
  // No threadId provided
  for await (const event of agent.streamWithEvents({
    prompt: "Say hello",
    // No threadId
  })) {
    if (event.type === 'checkpoint-saved') {
      checkpointSaved = true;
    }
  }
  
  expect(checkpointSaved).toBe(false);
  
  const threads = await checkpointer.list();
  expect(threads.length).toBe(0);
}, 20000);

