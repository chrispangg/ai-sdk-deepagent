/**
 * Example: Using checkpointer for session persistence
 */

import { anthropic } from '@ai-sdk/anthropic';
import { createDeepAgent, MemorySaver } from '../src/index.ts';

async function main() {
  const checkpointer = new MemorySaver();
  
  const agent = createDeepAgent({
    model: anthropic('claude-sonnet-4-20250514'),
    checkpointer,
  });
  
  const threadId = 'demo-session';
  
  // First interaction
  console.log('=== First interaction ===');
  for await (const event of agent.streamWithEvents({
    prompt: "Create a todo list for building a web app",
    threadId,
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    } else if (event.type === 'checkpoint-saved') {
      console.log(`\n[Checkpoint saved at step ${event.step}]`);
    }
  }
  
  // Later: Resume the same thread
  console.log('\n\n=== Resuming session ===');
  for await (const event of agent.streamWithEvents({
    prompt: "What was the first item on our todo list?",
    threadId,
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    } else if (event.type === 'checkpoint-loaded') {
      console.log(`[Loaded checkpoint with ${event.messagesCount} messages]`);
    }
  }
}

main().catch(console.error);

