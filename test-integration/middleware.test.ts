import { test, expect } from "bun:test";
import { createDeepAgent } from "@/agent.ts";
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModelMiddleware } from "ai";

const anthropic = createAnthropic({
  baseURL: 'https://api.anthropic.com/v1',
});

// Skip tests if no API key
const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

test.skipIf(!hasApiKey)("middleware - single middleware applied", async () => {
  let callCount = 0;

  const countingMiddleware: LanguageModelMiddleware = {
    specificationVersion: 'v3',
    wrapGenerate: async ({ doGenerate }) => {
      callCount++;
      return await doGenerate();
    },
  };

  const agent = createDeepAgent({
    model: anthropic("claude-sonnet-4-20250514"),
    middleware: countingMiddleware,
  });

  await agent.generate({ prompt: "Say hello" });
  expect(callCount).toBe(1);
});

test.skipIf(!hasApiKey)("middleware - multiple middlewares applied in order", async () => {
  const executionOrder: string[] = [];

  const firstMiddleware: LanguageModelMiddleware = {
    specificationVersion: 'v3',
    wrapGenerate: async ({ doGenerate }) => {
      executionOrder.push("first-before");
      const result = await doGenerate();
      executionOrder.push("first-after");
      return result;
    },
  };

  const secondMiddleware: LanguageModelMiddleware = {
    specificationVersion: 'v3',
    wrapGenerate: async ({ doGenerate }) => {
      executionOrder.push("second-before");
      const result = await doGenerate();
      executionOrder.push("second-after");
      return result;
    },
  };

  const agent = createDeepAgent({
    model: anthropic("claude-sonnet-4-20250514"),
    middleware: [firstMiddleware, secondMiddleware],
  });

  await agent.generate({ prompt: "Say hello" });

  // First middleware wraps second middleware
  expect(executionOrder).toEqual([
    "first-before",
    "second-before",
    "second-after",
    "first-after",
  ]);
});

test.skipIf(!hasApiKey)("middleware - factory with closure context", async () => {
  let contextValue = "";

  function createContextMiddleware(context: string): LanguageModelMiddleware {
    return {
      specificationVersion: 'v3',
      wrapGenerate: async ({ doGenerate }) => {
        contextValue = context;
        return await doGenerate();
      },
    };
  }

  const agent = createDeepAgent({
    model: anthropic("claude-sonnet-4-20250514"),
    middleware: createContextMiddleware("test-context"),
  });

  await agent.generate({ prompt: "Say hello" });
  expect(contextValue).toBe("test-context");
});

test.skipIf(!hasApiKey)("middleware - backwards compatible (no middleware)", async () => {
  const agent = createDeepAgent({
    model: anthropic("claude-sonnet-4-20250514"),
  });

  const result = await agent.generate({ prompt: "Say hello" });
  expect(result.text).toBeDefined();
});
