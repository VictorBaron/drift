---
name: unit-test
description: Generate comprehensive unit tests following BDD principles
model: sonnet
tools: Read, Write, Edit, Grep, Glob, Bash
context: inherit
agents: 
- backend-architect
- test-writer
---

# Unit Test

## When to Apply

Use this skill when:

- Adding some tests on an existing command handler or service
- Writing a new command or service
- Changing business rules
- Tests are failing or missing

## Testing Philosophy

1. **Tests document behavior** - Tests are living documentation
2. **Test behavior, not implementation** - Focus on what, not how. Test the usecase, not the methods.
3. **One concept per test** - Each test should verify one thing
4. **Arrange-Act-Assert** - Clear test structure

## File Naming & Structure Rules

- Test files MUST use `.test.ts` extension (NOT `.spec.ts`)
- Command handler files are named without the `command` suffix: `create-account.ts` → test is `create-account.test.ts`
- Domain services files are named with the `service` suffix: `create-account.service.ts` → test is `create-account.test.ts`
- Import the command/handler or the service from the source file (e.g., `import { CreateAccountCommand, CreateAccount } from './create-account'`)

## Test Writing Rules (MANDATORY)

1. **Don't duplicate assertions** — Never write separate tests to check the returned value AND the repository state. One test should check the persisted state (via repository lookup). The return value check can be combined in the same test if needed.
2. **Type `toMatchObject` calls** — Always use `toMatchObject<Partial<AggregateNameJSON>>({...})` for type safety.
3. **Check domain events** — If the use case should emit domain events, assert them on the aggregate: `expect(account.findEvents(AccountCreatedEvent)).toHaveLength(1)`.
4. **Create compilable stubs** — When writing tests for code that doesn't exist yet, also create minimal stub files (empty command class, empty handler class, empty types/interfaces) so the tests can at least be compiled and discovered by the test runner. The stubs should have the correct signatures but can throw `new Error('Not implemented')` in method bodies.
5. **Use `@nestjs/testing` Test module** — Always wire up dependencies via `Test.createTestingModule()` for consistency with NestJS DI.
6. **Test the behavior, not the implementation** Never test if a method has been called; through `toHaveBeenCalledTimes` for example.
7. **Never mock** Directly call external functions; only mock when calling external APIs
8. **Do not test directly aggregates** Aggregates should be tested from use cases, or commands.
9. **Write concise tests** Tests are code, code is a liability. Aim for short, concise, meaningful tests.
10. **Test mappers** Mappers are a hard failure point: test them. Do not test directly `Aggregate.reconstitute`.

- **Gateways only** — only write fake adapters to the external world (Slack API, Linear API, Claude API, etc.)
  - Example: `FakeSlackApiGateway`, placed in `infrastructure/gateways/`
- **In-memory repositories** — always use them, they implement the same port interface as the real repo

**What must NEVER be faked:**

- **Command handlers** — never write `FakeXxxHandler` classes; test the real handler
- **Domain services** — inject the real class via NestJS DI, never mock or stub it
- **Application services** — inject the real class

**Test module setup:**

- Always use a shared `beforeEach` with `Test.createTestingModule` — never create ad-hoc modules inside individual `it` blocks
- Register real domain services directly: `SlackFilterService` (not `{ provide: SlackFilterService, useValue: ... }`)

**Test file scope:**

- Each test file covers one use case; the "unit" is the behavior, not the service or the command handler

## Test Generation Process

### 1. Analyze the Code

- Identify public interfaces
- Find edge cases and boundaries
- Detect error scenarios
- Understand dependencies

### 2. Create Test Plan

Before writing tests, outline:

```markdown
## Test Plan for [Component]

### Happy Path
- [ ] Basic functionality works

### Edge Cases
- [ ] Out of bound values
- [ ] Business rules out of happy path

### Error Handling
- [ ] Invalid input
- [ ] Unauthorized scenarios

```

### 3. Write Tests

Follow the project's testing framework conventions.

## Test Templates

### Unit Test (Jest/Vitest)

```typescript
describe("Use case", () => {
  let handler: MyCommandHandler;
  let memberRepository: InMemoryMemberRepository;
  let member: Member;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));

    const module = await Test.createTestingModule({
      providers: [
        MyCommandHandler,
        { provide: MemberRepository, useClass: InMemoryMemberRepository },
      ],
    }).compile();

    handler = module.get<MyCommandHandler>(MyCommandHandler);
    memberRepository = module.get<InMemoryMemberRepository>(MemberRepository);

    member = MemberStubFactory.createAdmin({
      id: 'memberId',
      userId: 'userId',
    });

    memberRepository.clear();
    userRepository.clear();
    await memberRepository.save(inviter);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("specific scenario or condition", () => {
    it("should [expected behavior]", () => {
      const command = new MyCommand({});
      const result = usecase.exec(input);

      const savedMember = await memberRepository.findById(member.id)

      expect(savedMember?.toJSON()).toMatchObject<Partial<MemberJSON>>({
        accountId: 'accountId',
        invitedById: 'inviterId',
        role: MemberRoleLevel.USER,
        userId: savedUser?.id,
      });
      expect(savedMember?.findEvents(MemberInvitedEvent)).toHaveLength(1);
    });
  }),
    describe("invalid condition", () => {
      it("should throw ExpectedError", () => {
        const invalidInput = createInvalidInput();

        expect(() => usecase.exec(invalidInput)).toThrow(ExpectedError);
      });
    });
});
```

## Best Practices

- Use descriptive test names in describe (`when something specific happens`)
- Avoid test interdependence
- Mock only external dependencies
- Use factories for test data
- Keep tests fast (< 100ms for unit tests)
- Don't test methods, test the whole use case behavior
- Use InMemory repositories for unit tests.
- Always test the actually saved data in the repository
- Check events in the aggregate, if any should have been sent
- Call directly other services, do not mock functions

### Testing Rules (MANDATORY)

**What can be faked in tests:**
