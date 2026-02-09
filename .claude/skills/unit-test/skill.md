---
name: unit-test
description: Generate comprehensive unit tests following BDD principles
model: sonnet
tools: Read, Write, Edit, Grep, Glob, Bash
context: inherit
agent: backend-architect
---

# Unit Test

## When to Apply

Use this skill when:

- Adding some tests on an existing command
- Writing a new command
- Changing business rules
- Tests are failing or missing

## Testing Philosophy

1. **Tests document behavior** - Tests are living documentation
2. **Test behavior, not implementation** - Focus on what, not how. Test the usecase, not the methods.
3. **One concept per test** - Each test should verify one thing
4. **Arrange-Act-Assert** - Clear test structure

## Test Generation Process

### 1. Analyze the Code

- Identify public interfaces
- Find edge cases and boundaries
- Detect error scenarios
- Understand dependencies

### 2. Create Test Plan

Before writing tests, outline:

```
## Test Plan for [Component]

### Happy Path
- [ ] Basic functionality works

### Edge Cases
- [ ] Empty input
- [ ] Maximum values
- [ ] Minimum values

### Error Handling
- [ ] Invalid input
- [ ] Network failures
- [ ] Timeout scenarios

### Integration Points
- [ ] Database interactions
- [ ] External API calls
```

### 3. Write Tests

Follow the project's testing framework conventions.

## Test Templates

### Unit Test (Jest/Vitest)

```typescript
describe("Use case", () => {
  (describe("specific scenario or condition", () => {
    it("should [expected behavior]", async () => {
      const input = createTestInput();

      const result = await usecase.exec(input);

      const savedResult = await repository.findById(input.id);

      expect(result).toEqual(expectedOutput);
      expect(savedResult).toEqual(expectedOutput);
    });
  }),
    describe("invalid condition", () => {
      it("should throw ExpectedError", () => {
        const invalidInput = createInvalidInput();

        expect(() => usecase.exec(invalidInput)).toThrow(ExpectedError);
      });
    }));
});
```

## Best Practices

- Use descriptive test names in describe (`when something specific happens`)
- Avoid test interdependence
- Mock the strict minimum; like async external dependencies
- Use factories for test data
- Keep tests fast (< 100ms for unit tests)
- Don't test methods, test the whole use case behavior
- Use InMemory repositories in the Arrange phase
- Always check if the result has been correctly saved in the in-memory repository
