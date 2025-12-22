/**
 * Centralized token, size, and timeout limits.
 *
 * These constants prevent magic number scattering across the codebase and provide
 * a single source of truth for configuration values. When updating these values,
 * consider the impact on performance, user experience, and API limits.
 *
 * @module constants/limits
 */

// ============================================================================
// Token Limits
// ============================================================================

/**
 * Default token limit for tool result eviction.
 *
 * When a tool result exceeds this limit, it is automatically evicted to a file
 * to prevent context overflow. The evicted content is stored in the backend and
 * a summary is kept in the conversation history.
 *
 * @default 20000
 * @see {@link ../utils/eviction | evictToolResult}
 */
export const DEFAULT_EVICTION_TOKEN_LIMIT = 20000;

/**
 * Default threshold for message summarization.
 *
 * When the estimated token count of messages exceeds this threshold, the system
 * automatically summarizes older messages to stay within context limits. This
 * helps maintain conversation continuity while reducing token usage.
 *
 * @default 170000
 * @see {@link ../utils/summarization | summarizeIfNeeded}
 */
export const DEFAULT_SUMMARIZATION_THRESHOLD = 170000;

/**
 * Maximum context window size for Claude models.
 *
 * This represents the maximum number of tokens that can be processed in a single
 * conversation. Used for calculating token usage percentages and determining when
 * summarization is needed.
 *
 * @default 200000
 * @see {@link ../utils/summarization | estimateMessagesTokens}
 */
export const CONTEXT_WINDOW = 200000;

// ============================================================================
// Message Limits
// ============================================================================

/**
 * Default number of recent messages to keep during summarization.
 *
 * When summarization is triggered, this many of the most recent messages are
 * preserved verbatim while older messages are summarized. This ensures recent
 * context is immediately available to the agent.
 *
 * @default 6
 */
export const DEFAULT_KEEP_MESSAGES = 6;

/**
 * Default maximum number of reasoning steps for the main agent.
 *
 * The agent will stop after reaching this many steps to prevent infinite loops
 * or excessive token usage. Each step represents one tool invocation cycle.
 *
 * @default 100
 */
export const DEFAULT_MAX_STEPS = 100;

/**
 * Default maximum number of reasoning steps for subagents.
 *
 * Subagents are given a lower step limit than the main agent to prevent them
 * from consuming too many resources. This ensures the parent agent maintains
 * control over the overall task.
 *
 * @default 50
 * @see {@link ../tools/subagent | createTaskTool}
 */
export const DEFAULT_SUBAGENT_MAX_STEPS = 50;

/**
 * Default maximum number of messages to keep in CLI history.
 *
 * The CLI maintains a history of conversation messages for display purposes.
 * This limit prevents memory issues in long-running sessions.
 *
 * @default 100
 */
export const DEFAULT_MAX_HISTORY = 100;

// ============================================================================
// File Size Limits
// ============================================================================

/**
 * Default maximum number of lines to read from a file.
 *
 * The read_file tool defaults to reading this many lines to prevent loading
 * extremely large files into context. Can be overridden per-read operation.
 *
 * @default 2000
 * @see {@link ../tools/filesystem | createReadFileTool}
 */
export const DEFAULT_READ_LIMIT = 2000;

/**
 * Maximum line length before content is considered invalid.
 *
 * Lines exceeding this length may indicate minified code, binary content, or
 * other data that should not be processed as text. Used for validation.
 *
 * @default 10000
 */
export const MAX_LINE_LENGTH = 10000;

/**
 * Maximum file size in megabytes for file operations.
 *
 * Files larger than this size will be rejected to prevent memory issues and
 * excessive token usage. This is a soft limit that can be adjusted for specific
 * use cases.
 *
 * @default 10
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Maximum output size in bytes before truncation.
 *
 * Tool results larger than this size will be truncated or evicted to prevent
 * context overflow. This helps maintain stable performance even with large
 * outputs.
 *
 * @default 1048576 (1 MB)
 */
export const MAX_OUTPUT_SIZE_BYTES = 1048576; // 1MB

// ============================================================================
// Timeouts
// ============================================================================

/**
 * Default timeout for network requests in seconds.
 *
 * Used by web tools (http_request, fetch_url) to prevent hanging indefinitely
 * on slow or unresponsive servers. Can be overridden per-request.
 *
 * @default 30
 * @see {@link ../tools/web | createHttpRequestTool}
 */
export const DEFAULT_TIMEOUT_SECONDS = 30;

/**
 * Default timeout in milliseconds (derived from DEFAULT_TIMEOUT_SECONDS).
 *
 * Provided for convenience when working with APIs that expect milliseconds
 * instead of seconds.
 *
 * @default 30000 (30 seconds)
 */
export const DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_SECONDS * 1000;

/**
 * Timeout for filesystem operations in milliseconds.
 *
 * Used by sandboxed filesystem operations to prevent blocking indefinitely on
 * slow I/O operations.
 *
 * @default 30000 (30 seconds)
 * @see {@link ../backends/sandbox | SandboxBackend}
 */
export const FILESYSTEM_TIMEOUT_MS = 30000;

// ============================================================================
// Formatting
// ============================================================================

/**
 * Width for line number formatting in file read operations.
 *
 * When displaying file content with line numbers, this specifies the minimum
 * width for the line number column. Ensures consistent alignment across
 * different file sizes.
 *
 * @default 6
 * @see {@link ../backends/utils | formatFileContent}
 */
export const LINE_NUMBER_WIDTH = 6;
