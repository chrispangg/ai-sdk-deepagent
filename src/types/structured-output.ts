// Zod import removed - not needed for these utility functions

/**
 * Interface for agent results that include structured output
 */
export interface StructuredAgentResult<T = unknown> {
  text: string;
  output?: T;
  state?: any; // DeepAgentState from core types
  messages?: any[]; // ModelMessage array
}

/**
 * Type guard for checking if a result has structured output
 */
export function hasStructuredOutput<T>(
  result: any
): result is StructuredAgentResult<T> {
  return result && typeof result === "object" && "output" in result;
}

/**
 * Type guard for checking if an event has structured output
 */
export function eventHasStructuredOutput<T>(
  event: any
): event is { type: "done"; output: T } {
  return event && event.type === "done" && "output" in event;
}

/**
 * Extract structured output from agent result with type safety
 */
export function getStructuredOutput<T>(result: any): T | undefined {
  return hasStructuredOutput<T>(result) ? result.output : undefined;
}

/**
 * Extract structured output from event with type safety
 */
export function getEventOutput<T>(event: any): T | undefined {
  return eventHasStructuredOutput<T>(event) ? event.output : undefined;
}