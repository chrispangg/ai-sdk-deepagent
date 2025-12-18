# Common Patterns

This document contains common usage patterns and code examples for ai-sdk-deep-agent.

## Creating an Agent with Custom Backend

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { createDeepAgent, FilesystemBackend } from 'ai-sdk-deep-agent';

const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  backend: new FilesystemBackend({ rootDir: './workspace' }),
});
```

## Using Different Providers

```typescript
import { openai } from '@ai-sdk/openai';
import { azure } from '@ai-sdk/azure';
import { createDeepAgent } from 'ai-sdk-deep-agent';

// OpenAI
const openaiAgent = createDeepAgent({
  model: openai('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
});

// Azure OpenAI
const azureAgent = createDeepAgent({
  model: azure('gpt-4', {
    apiKey: process.env.AZURE_API_KEY,
    resourceName: 'my-resource',
  }),
});
```

## Multi-Turn Conversation

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

## Adding Custom Subagents

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { createDeepAgent, type SubAgent } from 'ai-sdk-deep-agent';

const researchAgent: SubAgent = {
  name: 'research-agent',
  description: 'Specialized for deep research tasks',
  systemPrompt: 'You are a research specialist...',
  tools: { custom_tool: myTool },
  model: anthropic('claude-haiku-4-5-20251001'), // optional override with different model
};

const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  subagents: [researchAgent],
});
```

## Basic Usage Examples

### Simple Generation

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { createDeepAgent } from 'ai-sdk-deep-agent';

const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
});

const result = await agent.generate({
  prompt: "Create a plan for building a web app",
});

console.log(result.text);
```

### Streaming with Events

```typescript
for await (const event of agent.streamWithEvents({
  prompt: "Build a todo app",
})) {
  switch (event.type) {
    case 'text':
      process.stdout.write(event.text);
      break;
    case 'tool-call':
      console.log(`\nUsing tool: ${event.toolName}`);
      break;
    case 'file-written':
      console.log(`\nWrote file: ${event.path}`);
      break;
  }
}
```

### With Custom Tools

```typescript
import { z } from 'zod';
import { tool } from 'ai';

const weatherTool = tool({
  description: 'Get weather for a location',
  parameters: z.object({
    location: z.string(),
  }),
  execute: async ({ location }) => {
    // Fetch weather data
    return { temp: 72, condition: 'sunny' };
  },
});

const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    get_weather: weatherTool,
  },
});
```

## Advanced Patterns

### Backend Composition

```typescript
import { FilesystemBackend, CompositeBackend, StateBackend } from 'ai-sdk-deep-agent';

// Combine filesystem persistence with in-memory ephemeral storage
const backend = new CompositeBackend([
  new FilesystemBackend({ rootDir: './workspace' }),
  new StateBackend(), // For temporary files
]);

const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  backend,
});
```

### Conditional Tool Approval

```typescript
const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  interruptOn: {
    // Always require approval for execute
    execute: true,

    // Conditionally approve file writes
    write_file: {
      shouldApprove: (args) => {
        // Auto-approve writes to /tmp, require approval for others
        return !args.file_path.startsWith('/tmp/');
      },
    },
  },
});

for await (const event of agent.streamWithEvents({
  prompt: "Create some files",
  onApprovalRequest: async (request) => {
    console.log(`Approve ${request.toolName} for ${JSON.stringify(request.args)}?`);
    // Implement your approval logic
    return true;
  },
})) {
  // Handle events
}
```

### Performance Optimization

```typescript
const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),

  // Enable prompt caching (Anthropic only)
  enablePromptCaching: true,

  // Evict large tool results to filesystem
  toolResultEvictionLimit: 15000, // tokens

  // Auto-summarize long conversations
  autoSummarize: true,
  summarizationThreshold: 150000, // tokens
  messagesToKeepAfterSummarization: 8,
});
```

### Custom Summarization Model

```typescript
import { anthropic } from '@ai-sdk/anthropic';

const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  autoSummarize: true,
  summarizationModel: anthropic('claude-haiku-4-5-20251001'), // Use faster model for summaries
});
```

## Testing Patterns

When writing tests for code using ai-sdk-deep-agent:

```typescript
import { test, expect } from "bun:test";
import { createDeepAgent, StateBackend } from "ai-sdk-deep-agent";
import { anthropic } from "@ai-sdk/anthropic";

test("agent creates files", async () => {
  const backend = new StateBackend();
  const agent = createDeepAgent({
    model: anthropic('claude-sonnet-4-20250514'),
    backend,
  });

  await agent.generate({
    prompt: "Create a file called test.txt with 'hello'",
  });

  const files = await backend.ls('/');
  expect(files).toContain('test.txt');

  const content = await backend.read('/test.txt');
  expect(content).toContain('hello');
});
```

## Structured Output Pattern

### When to Use

Use structured output when you need:
- Type-safe agent responses
- Validated data format
- Consistent output structure
- Integration with typed systems

### Basic Pattern

```typescript
import { createDeepAgent } from 'ai-sdk-deep-agent';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const schema = z.object({
  field1: z.string(),
  field2: z.number(),
});

const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  output: { schema },
});

const result = await agent.generate({ prompt: "..." });
// result.output is typed as { field1: string, field2: number }
```

### Advanced Patterns

#### Complex Nested Schemas

```typescript
const schema = z.object({
  summary: z.string(),
  details: z.array(z.object({
    title: z.string(),
    data: z.record(z.string(), z.unknown()),
  })),
  metadata: z.object({
    confidence: z.number(),
    sources: z.array(z.string()).optional(),
  }),
});
```

#### With Discriminated Unions

```typescript
const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('success'), data: z.string() }),
  z.object({ type: z.literal('error'), message: z.string() }),
]);
```

#### Combining with Other Features

```typescript
const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  middleware: [loggingMiddleware],
  checkpointer: new MemorySaver(),
  output: { schema: mySchema },
});
```

### Subagent Structured Output

```typescript
const agent = createDeepAgent({
  model: anthropic('claude-sonnet-4-20250514'),
  subagents: [
    {
      name: 'researcher',
      description: 'Research specialist',
      systemPrompt: 'Conduct thorough research...',
      output: {
        schema: z.object({
          summary: z.string(),
          sources: z.array(z.string()),
          confidence: z.number(),
        }),
      },
    },
  ],
});

// Subagent results include formatted structured output:
// "Research complete. [Structured Output]\n{\"summary\": \"...\", \"sources\": [...], \"confidence\": 0.9}"
```

### Common Pitfalls

1. **Schema too strict**: LLMs may struggle with very specific constraints
2. **Missing descriptions**: Add `.describe()` to help LLM understand fields
3. **Optional vs Required**: Be explicit about what's optional

### Best Practices

1. **Start simple**: Use basic types, add complexity as needed
2. **Add descriptions**: Help the LLM understand the schema
3. **Test validation**: Verify schema handles edge cases
4. **Type inference**: Let TypeScript infer types from schema

## See Also

- [Architecture Documentation](./architecture.md) - Core components and systems
- [Checkpointer Documentation](./checkpointers.md) - Session persistence patterns
- [Publishing Guide](../.github/PUBLISHING.md) - Release and deployment
