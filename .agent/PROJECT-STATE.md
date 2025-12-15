# PROJECT-STATE.md

Tracks feature parity with LangChain's DeepAgents framework. Reference implementations in `.refs/`.

---

## ✅ Implemented

- [x] **DeepAgent Core** - Main agent class with generate/stream/streamWithEvents
- [x] **Todo Planning Tool** - `write_todos` with merge/replace strategies
- [x] **Filesystem Tools** - `ls`, `read_file`, `write_file`, `edit_file`, `glob`, `grep`
- [x] **Subagent Spawning** - `task` tool for delegating to specialized agents
- [x] **StateBackend** - In-memory ephemeral file storage
- [x] **FilesystemBackend** - Persist files to actual disk
- [x] **PersistentBackend** - Cross-conversation memory via key-value store
- [x] **CompositeBackend** - Route files to different backends by path prefix
- [x] **Prompt Caching** - Anthropic cache control support
- [x] **Tool Result Eviction** - Large results saved to filesystem to prevent overflow
- [x] **Auto-Summarization** - Compress old messages when approaching token limits
- [x] **Event Streaming** - Granular events for tool calls, file ops, subagents
- [x] **CLI Interface** - Interactive terminal with Ink (React)
- [x] **SandboxBackendProtocol** - Execute shell commands in isolated environments (`BaseSandbox`, `LocalSandbox`)
- [x] **Execute Tool** - Run commands via sandbox backend (auto-added for sandbox backends)
- [x] **Human-in-the-Loop (HITL)** - Interrupt agent for tool approval/rejection via `interruptOn` config; CLI supports Safe/Auto-approve modes
- [x] **Checkpointer Support** - Persist agent state between invocations (pause/resume); includes `MemorySaver`, `FileSaver`, `KeyValueStoreSaver`; CLI session management via `--session` flag
- [x] **Web Tools** - `web_search` (Tavily API), `http_request`, `fetch_url` with HTML → Markdown conversion; follows LangChain approval pattern (approval required for `web_search` and `fetch_url` only)

---

## 🚧 To Implement

### Critical

_No critical features pending_

### High Priority

- [ ] **Middleware Architecture** 🎯 **[TOP PRIORITY]** - Composable `wrapModel`/`wrapToolCall`/`transformMessages` hooks
  - **Why**: Foundational for production use (logging, monitoring, retry logic, custom behaviors)
  - **Impact**: Unlocks Agent Memory, Skills System, and custom tool behaviors
  - **Effort**: 2-3 days (non-breaking, add `middleware: AgentMiddleware[]` param)
  - **Reference**: See `.refs/deepagentsjs/src/middleware/` for LangChain's pattern

- [ ] **Async Backend Methods** ⚠️ **[BREAKING]** - Full async variants of all backend operations
  - **Why**: Current sync methods block event loop, limits scalability
  - **Impact**: Better performance for I/O-heavy operations
  - **Effort**: 2-3 days, requires refactoring all backends + tests
  - **Note**: Schedule for next major version (v0.2.0 or v1.0.0)

### Medium Priority

- [ ] **Skills System** - Load pluggable capabilities from SKILL.md files
  - **Depends on**: Middleware Architecture (for custom tool injection)
  - **Impact**: Enables modular agents, community contributions, agent marketplaces

- [ ] **Agent Memory Middleware** - Long-term memory from agent.md files
  - **Depends on**: Middleware Architecture
  - **Impact**: Persistent agent personalities and context

- [ ] **StoreBackend** - LangGraph BaseStore adapter for cross-thread persistence
  - **Note**: Lower priority since PersistentBackend already handles similar use cases

- [ ] **Cloud Sandbox Integrations** - Modal, Runloop, Daytona providers
  - **Note**: Wait for user demand before implementing

### Lower Priority

- [ ] **Structured Output** - `responseFormat` for typed agent outputs
- [ ] **Context Schema** - Custom state types beyond default
- [ ] **Compiled Subagents** - Pre-built runnable subagent instances
- [x] **readRaw Backend Method** - Raw FileData without line formatting (implemented in all backends)
- [ ] **Custom Tool Descriptions** - Override default tool descriptions
- [x] **Per-Subagent Interrupt Config** - Different HITL rules per subagent (via `SubAgent.interruptOn`)
- [ ] **Cache Support** - Response caching via BaseCache

---

## ❌ Won't Support (AI SDK Limitations)

- **LangGraph State Reducers** - AI SDK doesn't have annotated state schemas with custom reducers
- **LangGraph Command Pattern** - No direct equivalent for `Command({ update: {...} })`
- **Native Graph Compilation** - AI SDK uses ToolLoopAgent, not compiled state graphs
- **Thread-level Store Namespacing** - Would require custom implementation

---

## Notes

- Reference JS implementation: `.refs/deepagentsjs/`
- Reference Python implementation: `.refs/deepagents/`
- AI SDK v6 primitive: `ToolLoopAgent` from `ai` package

## Priority Rationale (Updated 2025-12-15)

**Why Middleware Architecture First?**

1. **Force Multiplier**: Unlocks Skills System and Agent Memory as middleware plugins
2. **Production-Ready**: Essential for logging, monitoring, retry logic in enterprise deployments
3. **Non-Breaking**: Can be added alongside existing API without disrupting users
4. **Reference Alignment**: Matches LangChain's DeepAgents architecture pattern

**Implementation Sequence:**

1. Middleware Architecture (2-3 days) → Foundation for extensibility
2. Web Tools (1-2 days) → Quick user value win
3. Skills System (2-3 days) → Builds on middleware, enables community contributions
4. Async Backend Methods (2-3 days, breaking) → Save for v0.2.0/v1.0.0

**Deferred Features:**

- **StoreBackend**: PersistentBackend already handles cross-conversation memory adequately
- **Cloud Sandboxes**: Low demand, implement when users request specific providers
- **Structured Output**: Nice-to-have, can be middleware later
