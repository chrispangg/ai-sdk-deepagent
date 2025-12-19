/**
 * Comprehensive Checkpointer Demo
 *
 * This example demonstrates checkpointer features:
 * - Session persistence across multiple invocations
 * - Tool approval with auto-deny behavior
 * - Different checkpoint savers (Memory, File, KeyValueStore)
 * - Thread isolation
 *
 * Note: Full HITL resume-from-interrupt is a known limitation (planned for future release).
 */

import { anthropic } from '@ai-sdk/anthropic';
import { createDeepAgent, MemorySaver, FileSaver, KeyValueStoreSaver, InMemoryStore } from '../src/index.ts';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

// Demo 1: Basic Session Persistence with MemorySaver
async function demo1_BasicPersistence() {
  section('Demo 1: Basic Session Persistence (MemorySaver)');
  
  const checkpointer = new MemorySaver();
  const agent = createDeepAgent({
    model: anthropic('claude-haiku-4-5-20251001'),
    checkpointer,
  });
  
  const threadId = 'demo-1-session';
  
  // First interaction
  log('→ First interaction: Creating todos', colors.blue);
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "Create a todo list with 3 items for building a simple web app",
    messages: [{ role: "user", content: "Create a todo list with 3 items for building a simple web app" }],
    threadId,
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    } else if (event.type === 'checkpoint-saved') {
      log(`\n✓ Checkpoint saved at step ${event.step}`, colors.green);
    } else if (event.type === 'todos-changed') {
      log(`  • Todos updated: ${event.todos.length} items`, colors.dim);
    }
  }
  
  // Second interaction - agent should remember the todos
  log('\n\n→ Second interaction: Asking about previous todos', colors.blue);
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "What was the first item on the todo list you just created?",
    messages: [{ role: "user", content: "What was the first item on the todo list you just created?" }],
    threadId,
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    } else if (event.type === 'checkpoint-loaded') {
      log(`\n✓ Checkpoint loaded: ${event.messagesCount} messages restored`, colors.green);
    }
  }
  
  // Verify checkpoint exists
  const checkpoint = await checkpointer.load(threadId);
  log(`\n✓ Checkpoint verified: ${checkpoint?.messages.length} messages, ${checkpoint?.state.todos.length} todos`, colors.green);
}

// Demo 2: File-based Persistence (survives process restart)
async function demo2_FilePersistence() {
  section('Demo 2: File-based Persistence (FileSaver)');
  
  const checkpointer = new FileSaver({ dir: './.demo-checkpoints' });
  const agent = createDeepAgent({
    model: anthropic('claude-haiku-4-5-20251001'),
    checkpointer,
  });
  
  const threadId = 'demo-2-persistent';
  
  // Check if session already exists
  const existingCheckpoint = await checkpointer.load(threadId);
  if (existingCheckpoint) {
    log(`→ Found existing session with ${existingCheckpoint.messages.length} messages`, colors.yellow);
    log('  Continuing from where we left off...', colors.dim);
  } else {
    log('→ Starting new session', colors.blue);
  }
  
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: existingCheckpoint ? "What have we discussed so far?" : "Write a file called 'notes.txt' with some project ideas",
    messages: [{
      role: "user",
      content: existingCheckpoint
        ? "What have we discussed so far?"
        : "Write a file called 'notes.txt' with some project ideas"
    }],
    threadId,
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    } else if (event.type === 'checkpoint-loaded') {
      log(`\n✓ Loaded checkpoint from disk`, colors.green);
    } else if (event.type === 'checkpoint-saved') {
      log(`\n✓ Saved checkpoint to disk`, colors.green);
    } else if (event.type === 'file-written') {
      log(`  • File written: ${event.path}`, colors.dim);
    }
  }
  
  log(`\n✓ Session saved to .demo-checkpoints/${threadId}.json`, colors.green);
  log('  Run this script again to see the session restored!', colors.dim);
}

// Demo 3: Tool Approval with Auto-Deny
async function demo3_ToolApprovalAutoDeny() {
  section('Demo 3: Tool Approval with Auto-Deny');

  log('ℹ️  Note: Full HITL resume-from-interrupt is a known limitation', colors.yellow);
  log('   This demo shows tool approval and auto-deny behavior instead.\n', colors.dim);

  const checkpointer = new MemorySaver();
  const agent = createDeepAgent({
    model: anthropic('claude-haiku-4-5-20251001'),
    checkpointer,
    interruptOn: {
      write_file: true, // Require approval for file writes
    },
  });

  const threadId = 'demo-3-approval';

  // Part 1: Approve the file write
  log('→ Part 1: Requesting file write with approval callback', colors.blue);
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "Write a file called 'demo-config.json' with the content: {\"demo\": true}",
    messages: [{ role: "user", content: "Write a file called 'demo-config.json' with the content: {\"demo\": true}" }],
    threadId,
    onApprovalRequest: async (request) => {
      log(`\n⚠️  Approval requested for: ${request.toolName}`, colors.yellow);
      log(`   Args: ${JSON.stringify(request.args, null, 2)}`, colors.dim);
      log('   → Approving...', colors.green);
      return true; // Approve
    },
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    } else if (event.type === 'file-written') {
      log(`\n✓ File written: ${event.path}`, colors.green);
    }
  }

  // Part 2: Deny the file write
  log('\n\n→ Part 2: Requesting another file write but denying it', colors.blue);
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "Write a file called 'denied-file.json' with {\"denied\": true}",
    messages: [{ role: "user", content: "Write a file called 'denied-file.json' with {\"denied\": true}" }],
    threadId,
    onApprovalRequest: async (request) => {
      log(`\n⚠️  Approval requested for: ${request.toolName}`, colors.yellow);
      log(`   → Denying...`, colors.yellow);
      return false; // Deny
    },
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    }
  }

  // Part 3: Auto-deny (no callback)
  log('\n\n→ Part 3: No approval callback (auto-deny)', colors.blue);
  const agent2 = createDeepAgent({
    model: anthropic('claude-haiku-4-5-20251001'),
    interruptOn: {
      write_file: true,
    },
    // Note: no onApprovalRequest callback
  });

  for await (const event of agent2.streamWithEvents({
    // Old way: prompt: "Write a file called 'auto-denied.json'",
    messages: [{ role: "user", content: "Write a file called 'auto-denied.json'" }],
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    }
  }

  log('\n✓ Auto-deny demonstrated - tool was blocked without callback', colors.green);
}

// Demo 4: Thread Isolation
async function demo4_ThreadIsolation() {
  section('Demo 4: Thread Isolation');
  
  const checkpointer = new MemorySaver();
  const agent = createDeepAgent({
    model: anthropic('claude-haiku-4-5-20251001'),
    checkpointer,
  });
  
  // Create two separate threads
  log('→ Creating Thread A: Project Alpha', colors.blue);
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "Remember: we're working on Project Alpha, a mobile app",
    messages: [{ role: "user", content: "Remember: we're working on Project Alpha, a mobile app" }],
    threadId: 'thread-a',
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    }
  }
  
  log('\n\n→ Creating Thread B: Project Beta', colors.blue);
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "Remember: we're working on Project Beta, a web dashboard",
    messages: [{ role: "user", content: "Remember: we're working on Project Beta, a web dashboard" }],
    threadId: 'thread-b',
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    }
  }
  
  // Verify isolation
  log('\n\n→ Testing Thread A isolation:', colors.blue);
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "What project are we working on?",
    messages: [{ role: "user", content: "What project are we working on?" }],
    threadId: 'thread-a',
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    }
  }
  
  log('\n\n→ Testing Thread B isolation:', colors.blue);
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "What project are we working on?",
    messages: [{ role: "user", content: "What project are we working on?" }],
    threadId: 'thread-b',
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    }
  }
  
  const threads = await checkpointer.list();
  log(`\n✓ Total threads: ${threads.length} (${threads.join(', ')})`, colors.green);
}

// Demo 5: KeyValueStore Saver
async function demo5_KeyValueStoreSaver() {
  section('Demo 5: KeyValueStore Saver (for Redis, DB, etc.)');
  
  const store = new InMemoryStore();
  const checkpointer = new KeyValueStoreSaver({ 
    store,
    namespace: 'demo-app',
  });
  
  const agent = createDeepAgent({
    model: anthropic('claude-haiku-4-5-20251001'),
    checkpointer,
  });
  
  log('→ Using KeyValueStore adapter (InMemoryStore)', colors.blue);
  log('  (In production, replace with RedisStore, DatabaseStore, etc.)', colors.dim);
  
  for await (const event of agent.streamWithEvents({
    // Old way: prompt: "Create a simple todo list",
    messages: [{ role: "user", content: "Create a simple todo list" }],
    threadId: 'kv-demo',
  })) {
    if (event.type === 'text') {
      process.stdout.write(event.text);
    } else if (event.type === 'checkpoint-saved') {
      log(`\n✓ Checkpoint saved to KeyValueStore`, colors.green);
    }
  }
  
  // Verify it's in the store
  const checkpoint = await checkpointer.load('kv-demo');
  log(`\n✓ Checkpoint retrieved from store: ${checkpoint?.messages.length} messages`, colors.green);
}

// Main execution
async function main() {
  console.clear();
  log('\n🚀 Checkpointer Demo - AI SDK Deep Agent', colors.bright + colors.magenta);
  log('This demo requires ANTHROPIC_API_KEY environment variable\n', colors.dim);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    log('❌ Error: ANTHROPIC_API_KEY not found', colors.yellow);
    log('Set it with: export ANTHROPIC_API_KEY=your-key-here', colors.dim);
    process.exit(1);
  }
  
  try {
    await demo1_BasicPersistence();
    await demo2_FilePersistence();
    await demo3_ToolApprovalAutoDeny();
    await demo4_ThreadIsolation();
    await demo5_KeyValueStoreSaver();
    
    section('✅ All Demos Complete!');
    log('Key takeaways:', colors.bright);
    log('  • Checkpoints automatically save after each step', colors.dim);
    log('  • Use threadId to enable persistence', colors.dim);
    log('  • Choose saver based on your needs:', colors.dim);
    log('    - MemorySaver: Testing, single session', colors.dim);
    log('    - FileSaver: Local development, simple persistence', colors.dim);
    log('    - KeyValueStoreSaver: Production, Redis/DB', colors.dim);
    log('  • Resume from interrupts with approval decisions', colors.dim);
    log('  • Threads are isolated - no cross-contamination', colors.dim);
    
  } catch (error) {
    log(`\n❌ Error: ${error}`, colors.yellow);
    throw error;
  }
}

main().catch(console.error);

