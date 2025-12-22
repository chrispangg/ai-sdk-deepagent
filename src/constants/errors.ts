/**
 * Centralized error message constants for backend operations
 * Reduces duplication across 6 backend implementations
 */

export const FILE_NOT_FOUND = (path: string) =>
  `Error: File '${path}' not found`;

export const FILE_ALREADY_EXISTS = (path: string) =>
  `Cannot write to ${path} because it already exists. Read and then make an edit, or write to a new path.`;

export const STRING_NOT_FOUND = (path: string, string: string) =>
  `Error: String not found in file: '${path}'\n\n${string}`;

export const INVALID_REGEX = (message: string) =>
  `Invalid regex pattern: ${message}`;

export const WEB_SEARCH_ERROR = (message: string) =>
  `Web search error: ${message}`;

export const REQUEST_TIMEOUT = (timeout: number) =>
  `Request timed out after ${timeout} seconds`;

export const SYSTEM_REMINDER_FILE_EMPTY =
  'System reminder: File exists but has empty contents';

// Generic errors
export const OPERATION_ERROR = (operation: string, message: string) =>
  `Operation error: ${operation} - ${message}`;
