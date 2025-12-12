# Validate Plan

You are tasked with validating that an implementation plan was correctly executed, verifying all success criteria and identifying any deviations or issues.

## Initial Setup

When invoked:

1. **Determine context** - Review what was implemented
2. **Locate the plan** - Find the implementation plan document
3. **Gather implementation evidence** through git and testing

## Validation Process

### Step 1: Context Discovery

1. **Read the implementation plan** completely
2. **Identify what should have changed**:
   - List all files that should be modified
   - Note all success criteria (automated and manual)
   - Identify key functionality to verify

3. **Spawn parallel research tasks** to discover implementation:
   - Verify code changes match plan specifications
   - Check if tests were added/modified as specified
   - Validate that success criteria are met

### Step 2: Systematic Validation

For each phase in the plan:

1. **Check completion status**:
   - Look for checkmarks in the plan (- [x])
   - Verify actual code matches claimed completion

2. **Run automated verification**:
   - Execute each command from "Automated Verification"
   - Document pass/fail status
   - If failures, investigate root cause

3. **Assess manual criteria**:
   - List what needs manual testing
   - Provide clear steps for user verification

### Step 3: Generate Validation Report

Create comprehensive validation summary:

```markdown
## Validation Report: [Plan Name]

### Implementation Status
✓ Phase 1: [Name] - Fully implemented
✓ Phase 2: [Name] - Fully implemented
⚠️ Phase 3: [Name] - Partially implemented (see issues)

### Automated Verification Results
✓ Build passes
✓ Tests pass
✗ Linting issues (3 warnings)

### Code Review Findings

#### Matches Plan:
- [What was correctly implemented]
- [Another correct implementation]

#### Deviations from Plan:
- [Any differences from plan]
- [Explanation of deviation]

#### Potential Issues:
- [Any problems discovered]
- [Risk or concern]

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

## Important Guidelines

1. **Be thorough but practical** - Focus on what matters
2. **Run all automated checks** - Don't skip verification
3. **Document everything** - Both successes and issues
4. **Think critically** - Question if implementation solves the problem
5. **Consider maintenance** - Will this be maintainable?

## Validation Checklist

Always verify:

- [ ] All phases marked complete are actually done
- [ ] Automated tests pass
- [ ] Code follows existing patterns
- [ ] No regressions introduced
- [ ] Error handling is robust
- [ ] Documentation updated if needed
