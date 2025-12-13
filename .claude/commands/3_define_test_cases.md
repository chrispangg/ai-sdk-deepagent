---
description: Define automated acceptance test cases using Domain Specific Language (DSL) approach
model: claude-haiku-4-5-20251001
allowed-tools: AskUserQuestion, Edit, Task, TodoWrite, Write, Bash(git:*), Bash(gh:*), Bash(basename:*), Bash(date:*)
argument-hint: [feature-to-test]
---

# Define Test Cases Command

You are helping define automated acceptance test cases using a Domain Specific Language (DSL) approach.

## Core Principles

1. **Comment-First Approach**: Always start by writing test cases as structured comments before any implementation.

2. **DSL at Every Layer**: All test code - setup, actions, assertions - must be written as readable DSL functions. No direct framework calls in test files.

3. **Implicit Given-When-Then**: Structure tests with blank lines separating setup, action, and assertion phases. Never use the words "Given", "When", or "Then" explicitly.

4. **Clear, Concise Language**: Function names should read like natural language and clearly convey intent.

5. **Follow Existing Patterns**: Study and follow existing test patterns, DSL conventions, and naming standards in the codebase.

## Test Case Structure

```javascript
// 1. Test Case Name Here

// setupFunction
// anotherSetupFunction
//
// actionThatTriggersLogic
//
// expectationFunction
// anotherExpectationFunction
```

### Structure Rules

- **First line**: Test case name with number
- **Setup phase**: Functions that arrange test state (no blank line between them)
- **Blank line**: Separates setup from action
- **Action phase**: Function(s) that trigger the behavior under test
- **Blank line**: Separates action from assertions
- **Assertion phase**: Functions that verify expected outcomes (no blank line between them)

## Naming Conventions

### Setup Functions (Arrange)

- Describe state being created: `userIsLoggedIn`, `cartHasThreeItems`, `databaseIsEmpty`
- Use present tense verbs: `createUser`, `seedDatabase`, `mockExternalAPI`

### Action Functions (Act)

- Describe the event/action: `userClicksCheckout`, `orderIsSubmitted`, `apiReceivesRequest`
- Use active voice: `submitForm`, `sendRequest`, `processPayment`

### Assertion Functions (Assert)

- Start with `expect`: `expectOrderProcessed`, `expectUserRedirected`, `expectEmailSent`
- Be specific: `expectOrderInSage`, `expectCustomerBecamePartnerInExigo`
- Include negative cases: `expectNoEmailSent`, `expectOrderNotCreated`

## Test Coverage Requirements

When defining test cases, ensure you cover:

### 1. Happy Paths

```javascript
// 1. Successful Standard Order Flow

// userIsAuthenticated
// cartContainsValidProduct
//
// userSubmitsOrder
//
// expectOrderCreated
// expectPaymentProcessed
// expectConfirmationEmailSent
```

### 2. Edge Cases

```javascript
// 2. Order Submission With Expired Payment Method

// userIsAuthenticated
// cartContainsValidProduct
// paymentMethodIsExpired
//
// userSubmitsOrder
//
// expectOrderNotCreated
// expectPaymentDeclined
// expectErrorMessageDisplayed
```

### 3. Error Scenarios

```javascript
// 3. Order Submission When External Service Unavailable

// userIsAuthenticated
// cartContainsValidProduct
// externalPaymentServiceIsDown
//
// userSubmitsOrder
//
// expectOrderPending
// expectRetryScheduled
// expectUserNotifiedOfDelay
```

### 4. Boundary Conditions

```javascript
// 4. Order With Maximum Allowed Items

// userIsAuthenticated
// cartContainsMaximumItems
//
// userSubmitsOrder
//
// expectOrderCreated
// expectAllItemsProcessed
```

### 5. Permission/Authorization Scenarios

```javascript
// 5. Unauthorized User Attempts Order

// userIsNotAuthenticated
//
// userAttemptsToSubmitOrder
//
// expectOrderNotCreated
// expectUserRedirectedToLogin
```

## Example Test Case

Here's how a complete test case should look:

```javascript
test('1. Partner Kit Order with Custom Rank', async () => {
  // shopifyOrderPlaced
  //
  // expectOrderProcessed
  //
  // expectOrderInSage
  // expectPartnerInAbsorb
  // expectOrderInExigo
  // expectCustomerBecamePartnerInExigo

  await shopifyOrderPlaced();

  await expectOrderProcessed();

  await expectOrderInSage();
  await expectPartnerInAbsorb();
  await expectOrderInExigo();
  await expectCustomerBecamePartnerInExigo();
});
```

Notice:

- Test case defined first in comments
- Blank lines separate setup, action, and assertion phases in comments
- Implementation mirrors the comment structure exactly
- Each DSL function reads like natural language

## Workflow

When the user asks you to define test cases:

### 1. Understand the Feature

Ask clarifying questions about:

- What functionality is being tested
- Which systems/services are involved
- Expected behaviors and outcomes
- Edge cases and error conditions

### 2. Research Existing Test Patterns

**IMPORTANT**: Before writing any test cases, use the Task tool to launch a codebase-pattern-finder agent to:

- Find existing acceptance/integration test files
- Identify current DSL function naming conventions
- Understand test structure patterns used in the project
- Discover existing DSL functions that can be reused
- Learn how tests are organized and grouped

Example agent invocation:

```
Use the Task tool with subagent_type="codebase-pattern-finder" to find:
- Existing acceptance test files and their structure
- DSL function patterns and naming conventions
- Test organization patterns (describe blocks, test grouping)
- Existing DSL functions for setup, actions, and assertions
```

### 3. Define Test Cases in Comments

Create comprehensive test scenarios covering:

- **Happy paths**: Standard successful flows
- **Edge cases**: Boundary conditions, unusual but valid inputs
- **Error scenarios**: Invalid inputs, service failures, timeout conditions
- **Boundary conditions**: Maximum/minimum values, empty states
- **Authorization**: Permission-based access scenarios

Write each test case in the structured comment format first.

### 4. Identify Required DSL Functions

List all DSL functions needed for the test cases:

- **Setup functions**: Functions that arrange test state
- **Action functions**: Functions that trigger the behavior under test
- **Assertion functions**: Functions that verify expected outcomes

Group them logically (e.g., by domain: orders, users, partners).

Identify which functions already exist (from step 2) and which need to be created.

## Deliverables

When you complete this command, provide:

1. **Test case definitions in comments** - All test scenarios written in the structured comment format
2. **List of required DSL functions** - Organized by category (setup/action/assertion), noting which exist and which need creation
3. **Pattern alignment notes** - How the test cases follow existing patterns discovered in step 2

Remember: The goal is to make tests read like specifications. Focus on clearly defining WHAT needs to be tested, following existing project patterns.
