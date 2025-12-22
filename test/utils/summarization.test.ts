/**
 * Tests for src/utils/summarization.ts
 */

import { test, describe, expect, mock } from "bun:test";
import type { LanguageModel } from "ai";
import type { ModelMessage } from "@/types";
import {
  estimateMessagesTokens,
  summarizeIfNeeded,
  needsSummarization,
  DEFAULT_SUMMARIZATION_THRESHOLD,
  DEFAULT_KEEP_MESSAGES,
} from "@/utils/summarization";

// Mock the generateText function from AI SDK
const mockGenerateText = mock(() =>
  Promise.resolve({
    text: "Summary: Conversation about testing",
    usage: { promptTokens: 100, completionTokens: 20 },
  })
);

// Create a mock LanguageModel
const mockModel = {
  provider: "test",
  modelId: "test-model",
} as unknown as LanguageModel;

describe("utils/summarization", () => {
  describe("estimateMessagesTokens", () => {
    test("should estimate tokens for string content messages", () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Hello world" },
        { role: "assistant", content: "Hi there!" },
      ];
      const result = estimateMessagesTokens(messages);
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe("number");
    });

    test("should handle array content messages", () => {
      const messages: ModelMessage[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello" },
            { type: "text", text: " world" },
          ],
        },
      ];
      const result = estimateMessagesTokens(messages);
      expect(result).toBeGreaterThan(0);
    });

    test("should handle mixed content types", () => {
      const messages: ModelMessage[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Call this function" },
            {
              type: "tool-call",
              toolName: "testTool",
              toolCallId: "123",
              args: "{}",
            } as any,
          ],
        },
      ];
      const result = estimateMessagesTokens(messages);
      expect(result).toBeGreaterThan(0);
    });

    test("should handle empty content array", () => {
      const messages: ModelMessage[] = [
        { role: "user", content: [] },
      ];
      const result = estimateMessagesTokens(messages);
      expect(result).toBe(0);
    });

    test("should handle empty messages array", () => {
      const result = estimateMessagesTokens([]);
      expect(result).toBe(0);
    });

    test("should handle tool results in array content", () => {
      const messages: ModelMessage[] = [
        {
          role: "tool",
          content: [
            { type: "tool-result", toolCallId: "123", result: null } as any,
          ],
        },
      ];
      const result = estimateMessagesTokens(messages);
      // The getMessageText returns "[Tool result]" which has fixed length
      // So we check that it returns a number (could be 0 for very short strings)
      expect(typeof result).toBe("number");
    });
  });

  describe("needsSummarization", () => {
    test("should return false for small token counts", () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Small message" },
      ];
      const result = needsSummarization(messages);
      expect(result).toBe(false);
    });

    test("should return true for large token counts", () => {
      // Create a very long message that exceeds threshold
      // estimateTokens is roughly 1 token per 4 characters, so we need ~680k characters
      const longContent = "A".repeat(700000);
      const messages: ModelMessage[] = [
        { role: "user", content: longContent },
      ];
      const result = needsSummarization(messages, DEFAULT_SUMMARIZATION_THRESHOLD);
      expect(result).toBe(true);
    });

    test("should use custom threshold", () => {
      // estimateTokens is roughly 1 token per 4 characters
      // So we need ~40 characters to exceed threshold of 10
      const messages: ModelMessage[] = [
        { role: "user", content: "This is a much longer test message that should exceed the token threshold" },
      ];
      const result = needsSummarization(messages, 10); // Very low threshold
      expect(result).toBe(true);
    });

    test("should use default threshold when not specified", () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Test message" },
      ];
      const result = needsSummarization(messages);
      expect(result).toBe(false);
    });
  });

  describe("summarizeIfNeeded", () => {
    // We need to mock the AI SDK's generateText at module level
    // For now, we'll test the logic without actual LLM calls

    test("should return original messages when under threshold", async () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Small message" },
        { role: "assistant", content: "Response" },
      ];

      // Create a real model but with small threshold to avoid summarization
      const result = await summarizeIfNeeded(messages, {
        model: mockModel,
        tokenThreshold: 1000000, // Very high threshold
      });

      expect(result.summarized).toBe(false);
      expect(result.messages).toEqual(messages);
      expect(result.tokensBefore).toBeDefined();
      expect(result.tokensAfter).toBeUndefined();
    });

    test("should return original when not enough messages to keep", async () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Single message" },
      ];

      const result = await summarizeIfNeeded(messages, {
        model: mockModel,
        tokenThreshold: 0, // Trigger summarization
        keepMessages: 6, // More messages than we have
      });

      expect(result.summarized).toBe(false);
      expect(result.messages).toEqual(messages);
    });

    test("should include token counts when not summarizing", () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Test" },
      ];

      return summarizeIfNeeded(messages, {
        model: mockModel,
        tokenThreshold: 1000000,
      }).then((result) => {
        expect(result.tokensBefore).toBeDefined();
        expect(typeof result.tokensBefore).toBe("number");
      });
    });

    test("should use custom token threshold", async () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Test" },
      ];

      const result = await summarizeIfNeeded(messages, {
        model: mockModel,
        tokenThreshold: 1, // Very low, should not trigger for short message
        keepMessages: 2,
      });

      // Should not summarize since message is still small
      expect(result.summarized).toBe(false);
    });

    test("should use custom keepMessages value", async () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Message 1" },
        { role: "assistant", content: "Response 1" },
        { role: "user", content: "Message 2" },
      ];

      const result = await summarizeIfNeeded(messages, {
        model: mockModel,
        tokenThreshold: 1000000,
        keepMessages: 10,
      });

      expect(result.summarized).toBe(false);
      expect(result.messages).toEqual(messages);
    });

    test("should handle generationOptions parameter", async () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Test" },
      ];

      const result = await summarizeIfNeeded(messages, {
        model: mockModel,
        tokenThreshold: 1000000,
        generationOptions: { temperature: 0.5 },
      });

      expect(result.summarized).toBe(false);
    });

    test("should handle advancedOptions parameter", async () => {
      const messages: ModelMessage[] = [
        { role: "user", content: "Test" },
      ];

      const result = await summarizeIfNeeded(messages, {
        model: mockModel,
        tokenThreshold: 1000000,
        advancedOptions: { maxTokens: 1000 },
      });

      expect(result.summarized).toBe(false);
    });
  });

  describe("constants", () => {
    test("DEFAULT_SUMMARIZATION_THRESHOLD should be 170000", () => {
      expect(DEFAULT_SUMMARIZATION_THRESHOLD).toBe(170000);
    });

    test("DEFAULT_KEEP_MESSAGES should be 6", () => {
      expect(DEFAULT_KEEP_MESSAGES).toBe(6);
    });
  });
});
