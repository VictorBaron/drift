# Claude.md — Drift

## Project Overview

Drift is an app that aggregates data from different sources — Linear, Notion, Slack; and generates reports about feature delivery. 

- **Ongoing projects** and their completion
- **Decisions made** an important discussions on the project
- **Drift from initial scope** to catch early on mis-alignment
- **Other subjects** that takes time & can defocus

## Tech Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Backend (`apps/api/`):** Node.js with NestJS framework, Bolt.js (Slack integration)
- **Web app (`apps/app/`):** React
- **Database:** PostgreSQL with MikroORM
- **LLM:** Claude API 
- **Deployment:** Railway or Render

## Key Conventions

### Project Structure

```
apps/
  api/                  # NestJS backend
    src/
      auth/               # Slack OAuth + Google OAuth flows
      core/
        accounts/           # Account & Member entities, customer accounts information
        ai/                 # AI integration
        projects/           # Project information + status report
        integrations/       # Slack, Notion, Linear integrations
        users/              # User entity, preferences, activity tracking
      app.module.ts
      main.ts
      common/             # Shared utilities, decorators, guards
  app/                  # React Web app
    main.js             # Electron main process entry point
    index.html          # Renderer entry point
```

### Database / MikroORM

- Entities live in their respective module folders (e.g., `src/core/messages/domain/aggregates/message.aggregate.ts`)
- Use MikroORM migrations — never modify the schema by hand
- Entity naming: singular PascalCase (`User`, `Message`, `CalendarEvent`)
- Always use transactions for multi-entity writes

### Slack / Bolt.js

- Bolt app instance is created in the `SlackIntegrationModule` and injected via NestJS DI
- All event listeners and command handlers live in `src/core/integrations/slack/`
- User tokens (not bot tokens) are stored per-installation for reading messages
- Bot token is used for sending DMs
- Respect Slack rate limits — use queuing for bulk DM sends

### LLM Scoring

- The urgency scoring prompt lives in `src/core/scoring/` — treat it as a first-class artifact; changes should be deliberate
- Urgency scale: 1 (FYI) → 5 (critical, needs response now)
- Always store the raw score AND the LLM's reasoning with each scored message
- Pre-filter before calling the LLM — only ~30% of messages should reach scoring
- Use structured output (JSON) from the Claude API for reliable parsing

### Environment Variables

```
# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_STATE_SECRET=

# Database
DATABASE_URL=

# Claude API
ANTHROPIC_API_KEY=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# App
PORT=3000
NODE_ENV=development
```

### Pre-filter Heuristics (Phase 2)

Messages should be skipped (not scored) if:

- The user is currently active in that channel (sent a message recently)
- The message is in a muted channel (user preference)
- The message is a bot/integration post (unless from a VIP integration)
- The message has no mention, thread reply, or keyword relevance to the user
- The message is a reaction-only event

### Notification Delivery Rules

| Urgency | Delivery     | Timing                         |
| ------- | ------------ | ------------------------------ |
| 5       | Immediate DM | As soon as scored              |
| 3–4     | Batched DM   | Flushed at next calendar break |
| 1–2     | Daily digest | End of working hours           |

### Hexagonal Architecture & DDD

Every module follows this layered structure:

```
src/<module>/
  domain/
    <entity>.ts              # Domain entity/aggregate with business logic methods
    <port>.repository.ts     # Repository port interface (abstract class or interface)
    <port>.gateway.ts        # External API gateway port interface (if needed)
  application/
    commands/                # Command handlers (write operations)
    queries/                 # Query handlers (read operations)
  infrastructure/
    persistence/
      <entity>.mapper.ts     # Maps persistence model ↔ domain model
      <entity>.repository.ts # Implements repository port using Prisma/ORM
    gateways/                # Implements gateway ports (Slack, Google, Claude APIs)
  <module>.module.ts         # NestJS module wiring — binds ports to adapters via DI
```

**Rules:**

- Business logic belongs in domain entities/aggregates — NOT in services or handlers
- Aggregates are fetched and saved as a whole unit via repositories
- Domain entities are plain TS classes — never ORM/Prisma models
- Repositories use mappers to convert between persistence and domain models
- Mappers expose `toDomain()` and `toPersistence()` — pure functions, no side effects
- All external I/O (DB, Slack API, Google Calendar API, Claude API) is behind a port interface
- Port interfaces are defined in the domain layer; implementations live in infrastructure
- Use NestJS DI to bind port interfaces to their infrastructure implementations
- Application handlers orchestrate domain objects — they do not contain business logic
- DTOs are for API input/output; domain models are for business logic; persistence models are for the DB

### Code Style

- TypeScript strict mode
- Use NestJS decorators and DI idiomatically — no manual instantiation
- Prefer `async/await` over raw promises
- Keep modules small and focused; one domain concept per module
- Controllers/listeners handle I/O boundaries only — delegate to command/query handlers
- Use DTOs for API inputs; domain entities for business logic; persistence models for storage

### Testing

**Strategy: 90% unit tests (Chicago school)**

- Test the end result, not the interactions
- Test aggregate properties and domain events inside aggregates
- Every command use case MUST have tests
- Run relevant tests after every change — a failing test that was passing before triggers extra caution

**Unit Testing Approach:**

- Use InMemory repositories for DB interactions
  - InMemory implementations live in `src/<module>/infrastructure/persistence/in-memory-<entity>.repository.ts`
  - They implement the same repository port interface as the real repository
- Mock only when the dependency is:
  - Non-deterministic (random, UUID generation)
  - Slow (external HTTP calls, file I/O)
  - External (Slack API, Google Calendar API, Claude API, queues, clock)
- Focus on testing domain logic and command handlers, not infrastructure plumbing

**Test Structure:**

```typescript
// Example: testing a command handler with InMemory repository
describe('Send message', () => {
  let handler: SendMessage;
  let messageRepository: InMemoryMessageRepository;
  let slackGateway: FakeSlackGateway;

  beforeEach(() => {
    const module = await Test.createTestingModule({
      providers: [
        MyCommandHandler,
        { provide: MessageRepository, useClass: InMemoryMessageRepository },
        { provide: SLACK_GATEWAY, useClass: FakeSlackGateway },
      ],
    }).compile();

    handler = module.get<MyCommandHandler>(MyCommandHandler);
    messageRepository = module.get<InMemoryMessageRepository>(MessageRepository);
    slackGateway = module.get<FakeSlackGateway>(SLACK_GATEWAY);
    messageRepository.clear();
  });

  it('should mark message as urgent when score is 5', async () => {
    // Test end result on the aggregate, not mock interactions
    const result = await handler.execute(command);

    const message = await messageRepository.findById(result.messageId);
    expect(message?.isUrgent()).toBe(true);
    expect(message?.findEvents(MemberInvitedEvent)).toHaveLength(1);
  });
});
```

**Coverage Targets:**

- All command handlers: 100%
- Domain entities/aggregates: 100%
- Pre-filter logic, scoring rules, batch/digest logic: 100%
- Integration tests for OAuth flows and full message pipeline: critical paths only
- Use a test Slack workspace — never test against production workspaces

### Error Handling

- Wrap all Slack event handlers in try/catch — a thrown error kills the event ack
- Retry failed LLM calls with exponential backoff (max 3 attempts)
- Log all errors with context (user ID, channel ID, message timestamp)
- Use Sentry (Phase 7) for production error tracking

## Important Notes

- **User tokens vs Bot tokens:** Drift needs user token OAuth (not just bot) to read message content the user would see. Bot token is used for sending DMs.
- **Privacy:** Messages are processed for scoring but should not be stored longer than necessary. Respect workspace data policies.
- **Rate limits:** Both Slack and Claude APIs have rate limits. Always queue and throttle outbound requests.
- **Calendar sensitivity:** Never expose calendar event details in Slack DMs — only use calendar data internally for timing decisions.
