# RPI Framework: Research → Plan → Implement

This document provides instructions for AI agents implementing features in this repository using the RPI (Research, Plan, Implement) framework with specialized commands and sub-agents.

## Why RPI?

The RPI framework prevents "AI slop"—low-quality code that requires significant rework. It achieves this through **intentional context compaction**: keeping your context window clean, focused, and accurate at each phase.

**Key Principle**: Do not attempt implementation until you have completed Research and Planning. Each phase compresses information for the next:

- **Research** → Compresses **truth** (how the system actually works)
- **Plan** → Compresses **intent** (exactly what changes to make)
- **Implement** → Executes with **precision** (mechanical application of the plan)
- **Validate** → Verifies **correctness** (ensures implementation matches plan)

---

## When to Use RPI

| Task Complexity | Recommended Approach |
|-----------------|---------------------|
| Simple change (rename variable, fix typo) | Direct implementation |
| Small self-contained feature | Light plan, skip formal research |
| Medium feature (multiple files/services) | Full RPI with one research phase |
| Complex feature (core architecture changes) | Multiple RPI iterations |

**Rule of thumb**: If the feature is listed in `PROJECT-STATE.md` under "To Implement", use full RPI.

---

## Folder Structure

All RPI artifacts are stored in `thoughts/` with sequential numbering:

```
thoughts/
├── 001_feature-name/
│   ├── plan.md
│   └── research.md
├── 002_another-feature/
│   ├── plan.md
│   └── research.md
├── sessions/
│   ├── 001_feature-name.md
│   ├── 002_work-session.md
│   └── ...
├── cloud/
│   ├── 001_azure_production.md
│   └── ...
└── costs/
    └── ...
```

**File Naming Convention**: `NNN_descriptive-name.md` where NNN is a 3-digit sequential number (001, 002, etc.)

---

## Phase 1: Research — Compressing Truth

### Objective

Build an accurate understanding of how the system currently works. Identify all relevant files, functions, and code flows necessary for the feature.

### Command

Use `/1_research_codebase` command to conduct comprehensive research.

### Process

1. **Invoke research command**: `/1_research_codebase`

2. **Decompose research question**:
   - Break down into composable research areas
   - Identify specific components, patterns, or concepts
   - Create research plan using TodoWrite

3. **Spawn parallel sub-agent tasks**:
   - **codebase-locator**: Finds WHERE code lives (files, directories, components)
   - **codebase-analyzer**: Analyzes HOW code works (implementation details, data flow)
   - **codebase-pattern-finder**: Finds PATTERNS and EXAMPLES (similar implementations, conventions)

   Run multiple agents in parallel for different aspects of the research.

4. **Wait for all sub-agents to complete** before synthesizing findings.

5. **Synthesize findings**:
   - Compile all sub-agent results
   - Connect findings across components
   - Include specific file paths and line numbers
   - Highlight patterns and architectural decisions

6. **Generate research document** with YAML frontmatter:

```markdown
---
date: 2025-01-15T10:30:00Z
researcher: Claude
topic: "Feature Name"
tags: [research, codebase, relevant-component-names]
status: complete
---

# Research: Feature Name

## Research Question
[Original user query]

## Summary
[High-level findings answering the user's question]

## Detailed Findings

### Component/Area 1
- Finding with reference (file.ext:line)
- Connection to other components
- Implementation details

### Component/Area 2
...

## Code References
- `path/to/file.ts:123` - Description of what's there
- `another/file.ts:45-67` - Description of the code block

## Architecture Insights
[Patterns, conventions, and design decisions discovered]

## Open Questions
[Any areas that need further investigation]
```

7. **Save research document**: Create folder `thoughts/NNN_topic/` and save to `thoughts/NNN_topic/research.md` (where NNN is next sequential number)

### Research Quality Checklist

- [ ] Identified all files that need modification
- [ ] Understood existing patterns in the codebase
- [ ] Reviewed reference implementations (`.refs/deepagentsjs/`, `.refs/deepagents/`)
- [ ] Documented dependencies and interactions
- [ ] Used parallel sub-agents for comprehensive coverage
- [ ] No assumptions—all claims backed by code inspection

---

## Phase 2: Plan — Compressing Intent

### Objective

Transform research findings into a detailed, step-by-step implementation plan that can be executed mechanically. This is an **interactive, iterative process** with the user.

### Command

Use `/2_create_plan` command to create implementation plans.

### Process

1. **Invoke plan command**: `/2_create_plan`

2. **Context gathering & initial analysis**:
   - Read all mentioned files immediately and FULLY
   - Spawn initial research tasks using sub-agents:
     - codebase-locator: Find all related files
     - codebase-analyzer: Understand current implementation
     - codebase-pattern-finder: Find similar features to model after

3. **Present informed understanding** and ask focused questions requiring human judgment.

4. **Research & discovery**:
   - Create research todo list using TodoWrite
   - Spawn parallel sub-tasks for comprehensive research
   - Wait for ALL sub-tasks to complete
   - Present findings and design options with pros/cons

5. **Plan structure development**:
   - Propose implementation phases
   - Get user buy-in on phasing approach

6. **Write detailed plan** with YAML frontmatter:

```markdown
# Feature/Task Name Implementation Plan

## Overview
[Brief description of what we're implementing and why]

## Current State Analysis
[What exists now, what's missing, key constraints discovered]

## Desired End State
[Specification of the desired end state and how to verify it]

## What We're NOT Doing
[Explicitly list out-of-scope items]

## Implementation Approach
[High-level strategy and reasoning]

## Phase 1: Descriptive Name

### Overview
[What this phase accomplishes]

### Changes Required:

#### 1. Component/File Group
**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

```typescript
// Specific code to add/modify
```

### Success Criteria

#### Automated Verification

- [ ] Tests pass: `bun test`
- [ ] Type checking passes: `bun run typecheck`
- [ ] Linting passes: `bun run lint`

#### Manual Verification

- [ ] Feature works as expected
- [ ] Performance is acceptable
- [ ] No regressions in related features

---

## Phase 2: Descriptive Name

[Similar structure...]

## Testing Strategy

### Unit Tests

- [What to test]
- [Key edge cases]

### Integration Tests

- [End-to-end scenarios]

### Manual Testing Steps

1. [Specific verification step]
2. [Another verification step]

## Performance Considerations

[Any performance implications or optimizations needed]

## Migration Notes

[If applicable, how to handle existing data/systems]

```

7. **Save plan document**: Create folder `thoughts/NNN_descriptive-name/` if it doesn't exist, then save to `thoughts/NNN_descriptive-name/plan.md`

8. **Review and iterate** based on user feedback until satisfied.

### Plan Quality Checklist

- [ ] Every file to modify is explicitly named
- [ ] Actual code snippets included (not pseudocode)
- [ ] Steps are sequential and ordered correctly
- [ ] Each phase has measurable success criteria
- [ ] Testing strategy is explicit
- [ ] Human has reviewed and approved the plan
- [ ] All questions resolved before finalizing

---

## Phase 3: Implement — Executing with Precision

### Objective

Execute the plan mechanically. This phase should be straightforward if Research and Plan were done correctly.

### Command

Use `/3_implement_plan` command to implement approved plans.

### Process

1. **Invoke implement command**: `/3_implement_plan thoughts/NNN_plan-name/plan.md`

2. **Read plan completely**:
   - Check for any existing checkmarks (- [x])
   - Read all files mentioned in the plan
   - **Read files fully** - never use limit/offset parameters
   - Create todo list to track progress

3. **Execute phase by phase**:
   - Complete one phase entirely before moving to next
   - Follow the plan exactly
   - Update plan checkboxes as you go
   - If things don't match the plan, stop and ask:
     ```
     Issue in Phase [N]:
     Expected: [what the plan says]
     Found: [actual situation]
     Why this matters: [explanation]
     
     How should I proceed?
     ```

4. **Verify after each phase**:
   - Run all automated checks for that phase
   - Fix any issues before proceeding
   - Update progress in both plan and todos

5. **Run final validation**:
   ```bash
   bun run typecheck
   bun test
   ```

6. **Update PROJECT-STATE.md**:
   - Move feature from "To Implement" to "Implemented"
   - Add any notes about deviations or limitations

### Implementation Quality Checklist

- [ ] All plan steps completed
- [ ] Plan checkboxes updated with [x]
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes
- [ ] `PROJECT-STATE.md` updated
- [ ] No improvised changes outside the plan

---

## Phase 4: Validate — Verifying Correctness

### Objective

Verify that the implementation was correctly executed, checking all success criteria and identifying any deviations or issues.

### Command

Use `/4_validate_plan` command to validate implementations.

### Process

1. **Invoke validate command**: `/4_validate_plan`

2. **Context discovery**:
   - Read the implementation plan completely
   - Identify what should have changed (files, success criteria)
   - Spawn parallel research tasks to discover implementation

3. **Systematic validation**:
   - For each phase: check completion status, run automated verification, assess manual criteria
   - Document pass/fail status
   - Investigate root causes of any failures

4. **Generate validation report**:

```markdown
## Validation Report: Plan Name

### Implementation Status
✓ Phase 1: Name - Fully implemented
✓ Phase 2: Name - Fully implemented
⚠️ Phase 3: Name - Partially implemented (see issues)

### Automated Verification Results
✓ Build passes
✓ Tests pass
✗ Linting issues (3 warnings)

### Code Review Findings

#### Matches Plan:
- [What was correctly implemented]

#### Deviations from Plan:
- [Any differences from plan]
- [Explanation of deviation]

#### Potential Issues:
- [Any problems discovered]

### Manual Testing Required:
1. UI functionality:
   - [ ] Verify feature appears correctly
   - [ ] Test error states

2. Integration:
   - [ ] Confirm works with existing components
   - [ ] Check performance

### Recommendations:
- [Action items before merge]
- [Improvements to consider]
```

### Validation Checklist

- [ ] All phases marked complete are actually done
- [ ] Automated tests pass
- [ ] Code follows existing patterns
- [ ] No regressions introduced
- [ ] Error handling is robust
- [ ] Documentation updated if needed

---

## Supporting Workflows

### Save Progress

Use `/5_save_progress` when pausing work mid-implementation:

- Commits meaningful work with WIP commits
- Updates plan document with progress checkpoint
- Creates session summary in `thoughts/sessions/NNN_feature.md`
- Documents current state, blockers, and next steps
- Provides commands to resume work

### Resume Work

Use `/6_resume_work` when returning to saved work:

- Loads session summary from `thoughts/sessions/`
- Restores full context (plan, research, recent commits)
- Rebuilds mental model of where work left off
- Continues from first unchecked item in plan
- Handles conflicts if codebase changed

### Define Test Cases

Use `/8_define_test_cases` to create test specifications:

- Uses comment-first DSL approach
- Follows existing test patterns discovered via codebase-pattern-finder
- Structures tests with implicit Given-When-Then (blank lines separate phases)
- Defines comprehensive scenarios: happy paths, edge cases, errors, boundaries, authorization

---

## Specialized Research Commands

### Cloud Infrastructure Research

Use `/7_research_cloud` for cloud deployments (READ-ONLY operations only):

- Analyzes Azure/AWS/GCP infrastructure
- Uses cloud CLI tools (az, aws, gcloud)
- Generates infrastructure analysis documents
- Saves to `thoughts/cloud/NNN_platform_environment.md`

**Safety**: Only executes READ-ONLY operations (list, show, describe, get). Never creates, modifies, or deletes resources.

---

## Sub-Agents Reference

### codebase-locator

**Purpose**: Finds WHERE code lives in the codebase.

**Responsibilities**:

- Find files by topic/feature
- Categorize findings (implementation, tests, config, docs)
- Return structured results with full paths

**Use when**: You need to locate files related to a feature or topic.

### codebase-analyzer

**Purpose**: Analyzes HOW code works.

**Responsibilities**:

- Analyze implementation details
- Trace data flow and function calls
- Map component relationships
- Document technical details

**Use when**: You need to understand how existing code functions.

### codebase-pattern-finder

**Purpose**: Finds PATTERNS and EXAMPLES to model after.

**Responsibilities**:

- Find similar implementations
- Extract code examples
- Identify conventions (naming, organization, testing)

**Use when**: You need examples or patterns to follow for new code.

---

## Context Management Rules

### Do's

- ✅ Start each phase with clean context
- ✅ Use specialized sub-agents for parallel research
- ✅ Compress findings into Markdown before moving to next phase
- ✅ Include actual code snippets in plans
- ✅ Validate after each implementation phase
- ✅ Use sequential numbering for all artifacts
- ✅ Include YAML frontmatter in documents
- ✅ Save progress checkpoints when pausing work

### Don'ts

- ❌ Don't carry failed attempts into new context
- ❌ Don't skip research for complex features
- ❌ Don't improvise during implementation
- ❌ Don't let context window exceed ~40% with noise
- ❌ Don't assume—verify everything in the actual code
- ❌ Don't skip validation phase
- ❌ Don't forget to update plan checkboxes during implementation

---

## Quick Reference: Starting a New Feature

```bash
# 1. Check PROJECT-STATE.md for feature to implement

# 2. Research phase
/1_research_codebase
> [Research question about the feature]
# Output: thoughts/NNN_topic/research.md

# 3. Plan phase
/2_create_plan
> [Task description and requirements]
# Output: thoughts/NNN_feature-implementation/plan.md

# 4. Implement phase
/3_implement_plan thoughts/NNN_feature-implementation/plan.md
# Updates plan checkboxes, implements code

# 5. Validate phase
/4_validate_plan
# Generates validation report

# 6. Update PROJECT-STATE.md
# Move feature to "Implemented" section
```

---

## Example: Implementing a Feature

1. **Research**: `/1_research_codebase`
   - Spawns codebase-locator, codebase-analyzer, pattern-finder in parallel
   - Examines reference implementations in `.refs/`
   - Generates `thoughts/001_feature-name/research.md`

2. **Plan**: `/2_create_plan`
   - Uses research findings
   - Iterates with user on approach
   - Generates `thoughts/001_feature-implementation/plan.md`

3. **Implement**: `/3_implement_plan thoughts/001_feature-implementation/plan.md`
   - Follows plan step-by-step
   - Updates checkboxes as work completes
   - Runs validation after each phase

4. **Validate**: `/4_validate_plan`
   - Verifies all success criteria met
   - Generates validation report
   - Identifies any issues or deviations

5. **Update PROJECT-STATE.md**: Move feature to "Implemented"

---

## Updating PROJECT-STATE.md

After completing a feature:

```markdown
## ✅ Implemented
<!-- Move the completed feature here with checkbox checked -->
- [x] **Feature Name** - Brief description

## 🚧 To Implement
<!-- Remove from here when moved to Implemented -->
```

If a feature cannot be implemented due to AI SDK limitations:

```markdown
## ❌ Won't Support (AI SDK Limitations)
- **Feature Name** - Reason why it cannot be supported
```

---

## Integration with AGENTS.md

This RPI framework integrates with the project's agent architecture described in `AGENTS.md`:

- Uses DeepAgent's `task` tool to spawn sub-agents
- Leverages virtual filesystem for research artifacts
- Maintains todo lists via `write_todos` tool
- Supports multi-turn conversations for iterative planning

---

## File Organization Summary

```
thoughts/
├── 001_feature-name/  # Feature folders with plan.md and research.md
├── 002_another-feature/
├── sessions/          # Work session summaries (NNN_feature.md)
├── cloud/             # Cloud infrastructure analysis
└── costs/             # Cost analysis reports

.agent/
└── PROJECT-STATE.md   # Feature tracking (update after completion)
```

All artifacts use sequential numbering (001, 002, 003...) and include YAML frontmatter for metadata.
