# Architecture

This document provides detailed architectural information about ai-sdk-deep-agent.

## Core Components

### 1. DeepAgent (`src/agent.ts`)

Main agent class that wraps `ToolLoopAgent` with state management.

**Key features:**

- **Requires** a `LanguageModel` instance (from AI SDK providers like `anthropic()`, `openai()`, etc.)
- Creates tools dynamically for each invocation with shared state
- Supports three generation modes: `generate()`, `stream()`, `streamWithEvents()`
- Handles conversation history via `messages` array for multi-turn conversations
- Implements prompt caching (Anthropic), tool result eviction, and auto-summarization

### 2. State Management (`src/types.ts`)

```typescript
interface DeepAgentState {
  todos: TodoItem[];  // Task planning/tracking
  files: Record<string, FileData>;  // Virtual filesystem
}
```

### 3. Backends (`src/backends/`)

All backends implement `BackendProtocol` interface with methods: `read()`, `write()`, `edit()`, `ls()`, `lsInfo()`, `glob()`, `grep()`

- **`StateBackend`**: In-memory storage (default, ephemeral)
- **`FilesystemBackend`**: Persists files to actual disk
- **`PersistentBackend`**: Cross-conversation memory with key-value store
- **`CompositeBackend`**: Combines multiple backends (e.g., filesystem + cloud storage)

### 4. Tools (`src/tools/`)

- **Planning**: `write_todos` - Manages task lists with merge/replace strategies
- **Filesystem**: `ls`, `read_file`, `write_file`, `edit_file`, `glob`, `grep`
- **Subagents**: `task` - Spawns isolated subagents that share filesystem with parent

### 5. CLI (`src/cli/index.tsx`)

- Built with Ink (React for CLI) - interactive terminal interface
- Real-time streaming with event visualization
- Slash commands: `/help`, `/todos`, `/files`, `/read <path>`, `/clear`, `/model <name>`, `/exit`
- Feature toggles: `/cache`, `/eviction`, `/summarize`, `/approve`, `/features`
- Tool approval: Safe mode (default) requires approval for write/edit/execute operations

## Event System

The `streamWithEvents()` method emits granular events during generation:

- `text`: Streamed text chunks
- `step-start`, `step-finish`: Agent reasoning steps
- `tool-call`, `tool-result`: Tool invocations
- `todos-changed`: Todo list modifications
- `file-write-start`, `file-written`, `file-edited`: Filesystem changes
- `subagent-start`, `subagent-finish`: Subagent delegation
- `approval-requested`, `approval-response`: Tool approval flow (HITL)
- `done`: Final state with conversation messages
- `error`: Error occurred

## Message Handling

**Important**: The agent uses AI SDK's `messages` array for conversation history. When streaming with events:

1. The `done` event includes `event.messages` - the updated conversation history
2. Pass this back to the next `streamWithEvents()` call to maintain context
3. The library automatically patches "dangling tool calls" (calls without results) via `patchToolCalls()`

**Example:**

```typescript
let messages: ModelMessage[] = [];

for await (const event of agent.streamWithEvents({ prompt: "First message", messages })) {
  if (event.type === 'done') {
    messages = event.messages || [];
  }
}

// Next turn with context
for await (const event of agent.streamWithEvents({ prompt: "Follow up", messages })) {
  // Agent remembers previous context
}
```

## Performance Features

### 1. Prompt Caching (Anthropic only)

- Caches system prompt for faster subsequent calls
- Enabled via `enablePromptCaching: true`

### 2. Tool Result Eviction

- Large tool results (>20k tokens default) are evicted to virtual filesystem
- Prevents context overflow in long agent loops
- Controlled via `toolResultEvictionLimit` parameter

### 3. Auto-Summarization

- When conversation exceeds token threshold (170k default), older messages are summarized
- Keeps recent messages (6 default) intact for context
- Uses fast model (Haiku) for summarization by default

## Human-in-the-Loop (HITL)

The agent supports tool approval before execution, useful for destructive operations like file writes or command execution.

**Library API:**

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { createDeepAgent } from 'ai-sdk-deep-agent';

const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  interruptOn: {
    execute: true,        // Always require approval
    write_file: true,     // Always require approval
    edit_file: {          // Dynamic approval based on arguments
      shouldApprove: (args) => !args.file_path.startsWith('/tmp/')
    },
  },
});

// Handle approvals via callback
for await (const event of agent.streamWithEvents({
  prompt: "Create a config file",
  onApprovalRequest: async (request) => {
    console.log(`Approve ${request.toolName}?`, request.args);
    return true; // or false to deny
  },
})) {
  // Handle events
}
```

**CLI Approval Modes:**

The CLI operates in two modes for tool execution:

- **Safe Mode (default)**: Prompts for approval before `execute`, `write_file`, `edit_file`
  - Status bar shows: 🔴 Safe mode
  - At approval prompt: `[Y]` approve, `[N]` deny, `[A]` approve all

- **Auto-Approve Mode**: All tool executions proceed without prompts
  - Status bar shows: 🟢 Auto-approve
  - Toggle with `/approve` command

## Model Specification

**Important**: The library now requires AI SDK `LanguageModel` instances instead of string-based model IDs.

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { azure } from '@ai-sdk/azure';
import { createDeepAgent } from 'ai-sdk-deep-agent';

// Anthropic (recommended)
const agent1 = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
});

// OpenAI
const agent2 = createDeepAgent({
  model: openai('gpt-4o'),
});

// Azure OpenAI
const agent3 = createDeepAgent({
  model: azure('gpt-4', {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    resourceName: 'my-resource',
  }),
});

// Custom configuration
const agent4 = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514', {
    apiKey: process.env.CUSTOM_API_KEY,
    baseURL: 'https://custom-endpoint.com',
  }),
});
```

**CLI Backward Compatibility**: The CLI internally uses `parseModelString()` from `src/utils/model-parser.ts` to convert string formats like `"anthropic/claude-sonnet-4-20250514"` into `LanguageModel` instances. This is only for the CLI - when using the library programmatically, always pass provider instances.

## Structured Output

### Implementation

DeepAgent supports structured output via AI SDK v6's ToolLoopAgent native `output` parameter:

**Architecture**:

- Optional `output: { schema, description? }` in `CreateDeepAgentParams`
- Pass-through to ToolLoopAgent constructor
- Output exposed in `generate()`, `stream()`, and `streamWithEvents()` results
- Subagents can have their own output schemas

**Type Safety**:

- `result.output` typed based on Zod schema
- TypeScript infers types automatically
- Validation by Zod at runtime

**Reference**: [ToolLoopAgent Output Parsing](https://v6.ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent#agent-with-output-parsing)

### Subagent Structured Output

Subagents can return structured output to parent agents:

1. **SubAgent interface**: Optional `output` field with Zod schema
2. **Registry storage**: Output config stored with subagent registration
3. **Result formatting**: Structured output appended as JSON to text response
4. **Parent consumption**: Parent agent receives formatted text with JSON

**Example Format**:

```
Research completed successfully.

[Structured Output]
{
  "summary": "AI agents use tools to interact with external systems",
  "findings": ["Tool calling", "State management", "Error handling"],
  "confidence": 0.9
}
```
