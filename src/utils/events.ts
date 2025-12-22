/**
 * Type-safe event creation helpers for Deep Agent.
 *
 * These factory functions provide type-safe ways to create DeepAgentEvent objects,
 * reducing duplication and ensuring event objects are correctly structured.
 *
 * @example
 * ```typescript
 * import { createFileReadEvent, createToolCallEvent } from './utils/events';
 *
 * // Create events with type inference
 * const fileEvent = createFileReadEvent('/path/to/file.ts', 100);
 * const toolEvent = createToolCallEvent('read_file', { path: '/file.txt' }, 'call-123');
 * ```
 */

import type {
  TextEvent,
  StepStartEvent,
  ToolCallEvent,
  ToolResultEvent,
  TodosChangedEvent,
  FileWriteStartEvent,
  FileWrittenEvent,
  FileEditedEvent,
  FileReadEvent,
  LsEvent,
  GlobEvent,
  GrepEvent,
  ExecuteStartEvent,
  ExecuteFinishEvent,
  WebSearchStartEvent,
  WebSearchFinishEvent,
  HttpRequestStartEvent,
  HttpRequestFinishEvent,
  FetchUrlStartEvent,
  FetchUrlFinishEvent,
  SubagentStartEvent,
  SubagentFinishEvent,
  SubagentStepEvent,
  TextSegmentEvent,
  UserMessageEvent,
  DoneEvent,
  ErrorEvent,
  ApprovalRequestedEvent,
  ApprovalResponseEvent,
  CheckpointSavedEvent,
  CheckpointLoadedEvent,
  DeepAgentEvent,
  DeepAgentState,
} from "../types";

// ============================================================================
// Basic Event Factories
// ============================================================================

/**
 * Create a text streaming event.
 */
export function createTextEvent(text: string): TextEvent {
  return { type: "text", text };
}

/**
 * Create a step-start event.
 */
export function createStepStartEvent(stepNumber: number): StepStartEvent {
  return { type: "step-start", stepNumber };
}

/**
 * Create a tool-call event.
 */
export function createToolCallEvent(
  toolName: string,
  args: unknown,
  toolCallId: string
): ToolCallEvent {
  return { type: "tool-call", toolName, toolCallId, args };
}

/**
 * Create a tool-result event.
 */
export function createToolResultEvent(
  toolName: string,
  toolCallId: string,
  result: unknown
): ToolResultEvent {
  return { type: "tool-result", toolName, toolCallId, result };
}

/**
 * Create a text-segment event (for CLI display).
 */
export function createTextSegmentEvent(text: string): TextSegmentEvent {
  return { type: "text-segment", text };
}

/**
 * Create a user-message event (for CLI history).
 */
export function createUserMessageEvent(content: string): UserMessageEvent {
  return { type: "user-message", content };
}

/**
 * Create a done event.
 */
export function createDoneEvent(
  state: DeepAgentState,
  options?: { text?: string; messages?: DoneEvent["messages"]; output?: DoneEvent["output"] }
): DoneEvent {
  const event: DoneEvent = { type: "done", state, ...options };
  return event;
}

/**
 * Create an error event.
 */
export function createErrorEvent(error: Error): ErrorEvent {
  return { type: "error", error };
}

// ============================================================================
// Todo Event Factories
// ============================================================================

/**
 * Create a todos-changed event.
 */
export function createTodosChangedEvent(todos: TodosChangedEvent["todos"]): TodosChangedEvent {
  return { type: "todos-changed", todos };
}

// ============================================================================
// File Event Factories
// ============================================================================

/**
 * Create a file-write-start event (preview before write).
 */
export function createFileWriteStartEvent(
  path: string,
  content: string
): FileWriteStartEvent {
  return { type: "file-write-start", path, content };
}

/**
 * Create a file-written event (after successful write).
 */
export function createFileWrittenEvent(
  path: string,
  content: string
): FileWrittenEvent {
  return { type: "file-written", path, content };
}

/**
 * Create a file-edited event.
 */
export function createFileEditedEvent(
  path: string,
  occurrences: number
): FileEditedEvent {
  return { type: "file-edited", path, occurrences };
}

/**
 * Create a file-read event.
 */
export function createFileReadEvent(path: string, lines: number): FileReadEvent {
  return { type: "file-read", path, lines };
}

// ============================================================================
// Filesystem Operation Event Factories
// ============================================================================

/**
 * Create an ls (list) event.
 */
export function createLsEvent(path: string, count: number): LsEvent {
  return { type: "ls", path, count };
}

/**
 * Create a glob (pattern search) event.
 */
export function createGlobEvent(pattern: string, count: number): GlobEvent {
  return { type: "glob", pattern, count };
}

/**
 * Create a grep (content search) event.
 */
export function createGrepEvent(pattern: string, count: number): GrepEvent {
  return { type: "grep", pattern, count };
}

// ============================================================================
// Execute Event Factories
// ============================================================================

/**
 * Create an execute-start event.
 */
export function createExecuteStartEvent(
  command: string,
  sandboxId: string
): ExecuteStartEvent {
  return { type: "execute-start", command, sandboxId };
}

/**
 * Create an execute-finish event.
 */
export function createExecuteFinishEvent(
  command: string,
  sandboxId: string,
  exitCode: number | null,
  truncated: boolean
): ExecuteFinishEvent {
  return { type: "execute-finish", command, sandboxId, exitCode, truncated };
}

// ============================================================================
// Web Event Factories
// ============================================================================

/**
 * Create a web-search-start event.
 */
export function createWebSearchStartEvent(query: string): WebSearchStartEvent {
  return { type: "web-search-start", query };
}

/**
 * Create a web-search-finish event.
 */
export function createWebSearchFinishEvent(
  query: string,
  resultCount: number
): WebSearchFinishEvent {
  return { type: "web-search-finish", query, resultCount };
}

/**
 * Create an http-request-start event.
 */
export function createHttpRequestStartEvent(
  url: string,
  method: string
): HttpRequestStartEvent {
  return { type: "http-request-start", url, method };
}

/**
 * Create an http-request-finish event.
 */
export function createHttpRequestFinishEvent(
  url: string,
  statusCode: number
): HttpRequestFinishEvent {
  return { type: "http-request-finish", url, statusCode };
}

/**
 * Create a fetch-url-start event.
 */
export function createFetchUrlStartEvent(url: string): FetchUrlStartEvent {
  return { type: "fetch-url-start", url };
}

/**
 * Create a fetch-url-finish event.
 */
export function createFetchUrlFinishEvent(
  url: string,
  success: boolean
): FetchUrlFinishEvent {
  return { type: "fetch-url-finish", url, success };
}

// ============================================================================
// Subagent Event Factories
// ============================================================================

/**
 * Create a subagent-start event.
 */
export function createSubagentStartEvent(
  name: string,
  task: string
): SubagentStartEvent {
  return { type: "subagent-start", name, task };
}

/**
 * Create a subagent-finish event.
 */
export function createSubagentFinishEvent(
  name: string,
  result: string
): SubagentFinishEvent {
  return { type: "subagent-finish", name, result };
}

/**
 * Create a subagent-step event.
 */
export function createSubagentStepEvent(
  stepIndex: number,
  toolCalls: SubagentStepEvent["toolCalls"]
): SubagentStepEvent {
  return { type: "subagent-step", stepIndex, toolCalls };
}

// ============================================================================
// Approval Event Factories
// ============================================================================

/**
 * Create an approval-requested event.
 */
export function createApprovalRequestedEvent(
  approvalId: string,
  toolCallId: string,
  toolName: string,
  args: unknown
): ApprovalRequestedEvent {
  return { type: "approval-requested", approvalId, toolCallId, toolName, args };
}

/**
 * Create an approval-response event.
 */
export function createApprovalResponseEvent(
  approvalId: string,
  approved: boolean
): ApprovalResponseEvent {
  return { type: "approval-response", approvalId, approved };
}

// ============================================================================
// Checkpoint Event Factories
// ============================================================================

/**
 * Create a checkpoint-saved event.
 */
export function createCheckpointSavedEvent(
  threadId: string,
  step: number
): CheckpointSavedEvent {
  return { type: "checkpoint-saved", threadId, step };
}

/**
 * Create a checkpoint-loaded event.
 */
export function createCheckpointLoadedEvent(
  threadId: string,
  step: number,
  messagesCount: number
): CheckpointLoadedEvent {
  return { type: "checkpoint-loaded", threadId, step, messagesCount };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Type guard to check if an event is a specific type.
 * Useful for filtering or discriminating union types.
 *
 * @example
 * ```typescript
 * if (isEventType(event, "file-read")) {
 *   // TypeScript knows event is FileReadEvent here
 *   console.log(event.lines);
 * }
 * ```
 */
export function isEventType<T extends DeepAgentEvent["type"]>(
  event: DeepAgentEvent,
  type: T
): event is Extract<DeepAgentEvent, { type: T }> {
  return event.type === type;
}

/**
 * Get the event type as a string.
 * Utility function for logging or debugging.
 */
export function getEventType(event: DeepAgentEvent): string {
  return event.type;
}

/**
 * Create a generic event object from a type and data.
 * This is a more flexible but less type-safe alternative to the specific factories.
 *
 * @example
 * ```typescript
 * const event = createEvent("file-read", { path: "/file.txt", lines: 100 });
 * ```
 */
export function createEvent<T extends DeepAgentEvent>(
  type: T["type"],
  data: Omit<T, "type">
): T {
  return { type, ...data } as T;
}
