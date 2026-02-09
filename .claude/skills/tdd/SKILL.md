---
name: tdd
description: Test-Driven Development methodology and patterns
allowed-tools: Read, Write, Bash
context: inherit
agent: specialist
---

# TDD (Test-Driven Development)

## The TDD Cycle

┌─────────────────────────────────────────────────────────┐
│ RED → GREEN → REFACTOR │
├─────────────────────────────────────────────────────────┤
│ │
│ 1. RED ──→ Write a failing test │
│ │ │
│ ▼ │
│ 2. GREEN ──→ Write minimal code to pass │
│ │ │
│ ▼ │
│ 3. REFACTOR ──→ Improve code, keep tests green │
│ │ │
│ └────────────→ Repeat │
│ │
└─────────────────────────────────────────────────────────┘

## Methodology

### Step 1: RED (Write Failing Test)

Write a test for the behavior you want BEFORE writing any code.

```typescript
// user.test.ts
describe("User", () => {
  it("should validate email format", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
  });
});
```

Run: pnpm test → Should FAIL (function doesn't exist)

### Step 2: GREEN (Minimal Implementation)

Write the MINIMUM code to make the test pass.

```typescript
// user.ts
export const isValidEmail = (email: string): boolean => {
  return email.includes("@");
};
```

Run: pnpm test → Should PASS

### Step 3: REFACTOR (Improve)

Now improve the implementation while keeping tests green.

```typescript
// user.ts (improved)
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

Run: pnpm test → Should still PASS

## Test Structure: AAA Pattern

```typescript
it("should calculate order total", () => {
  // Arrange - Set up test data
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 },
  ];

  // Act - Execute the code
  const total = calculateTotal(items);

  // Assert - Verify the result
  expect(total).toBe(35);
});
```
