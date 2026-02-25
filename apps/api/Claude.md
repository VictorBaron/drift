# Drift - Project Context

## Workflow Rules

### Test-First Development (MANDATORY)

When implementing any new use case or change (does not apply for queries):

1. **Write behavioral tests FIRST** — Before writing any production code, write tests that describe the expected behavior using BDD-style descriptions (`should ...`).
2. **Use the test-writer agent** — Always delegate test writing to `@.claude/agents/test-writer`.
3. **Then implement** — Write the production code to make the tests pass.

### Architecture (MANDATORY)

The back-end strictly follows **Hexagonal Architecture** and **Domain Driven Design**.
Refer to these skills for guidance:
- `.claude/skills/ddd/skill.md` — DDD patterns, aggregates, entities, value objects, repositories, mappers
- `.claude/hexagonal-architecture.md` — Module structure and port/adapter constraints

### Hexagonal Architecture & DDD Rules

These rules apply to ALL backend code. Follow them strictly.

**Domain Layer (innermost — no external dependencies):**

- Business logic lives inside domain entities and aggregates, NOT in services
- Aggregates are the consistency boundary — always fetch and save an aggregate as a whole
- Domain entities are plain TypeScript classes with behavior methods, NOT MikroORM entities
- Domain layer defines port interfaces (e.g., `UserRepository`, `SlackGateway`, `CalendarGateway`) — never imports infrastructure code

**Application Layer (use cases / command & query handlers):**

- Orchestrates domain objects — does NOT contain business logic itself
- Fetches aggregates via repository ports, calls domain methods, then saves via repository ports
- Uses dependency injection for all ports (repositories, external API gateways)

**Infrastructure Layer (outermost — implements ports):**

- Repository implementations (e.g., `MikroORMUserRepository implements UserRepository`) live here
- Each repository uses a **mapper** to convert between the persistence model (MikroORM) and the domain model
- Mappers are pure functions: `toDomain(persistenceModel): DomainEntity` and `toPersistence(domainEntity): PersistenceModel`
- External API adapters (Slack, Google Calendar, Claude API) implement gateway port interfaces
- All infrastructure dependencies are injected via NestJS DI — never instantiate manually

**Key Rules:**

- Every database read/write goes through a repository — never call the ORM directly from application or domain layer
- Every external API call goes through a gateway interface — never call Slack/Google/Claude APIs directly from application or domain layer
- Domain models and persistence models are separate classes — always use mappers to convert between them
- Aggregates enforce their own invariants — validation logic belongs on the aggregate, not in the service
- **Dependency injection is mandatory** for all services/repositories that access external systems (database, Slack API, Google Calendar API, Claude API, etc.) — define port interfaces in domain, inject implementations via NestJS DI

## Commands

```bash
# Install dependencies (at root)
pnpm install

# Start development (all apps in watch mode)
pnpm dev

# Build all apps
pnpm build

# API-specific commands (run from apps/api/)
pnpm dev              # Start NestJS in watch mode
pnpm build            # Compile TypeScript
pnpm start:prod       # Run compiled API
```

### API Module Organization

The API follows NestJS modular architecture with domain-based modules.

### Repository Structure

```
src/
  common/                        # Shared base classes and utilities
    domain/                      # Base aggregate, repository, value object classes
    application/                 # Shared application-level types
    dto/                         # Shared DTOs
    types/                       # Shared TypeScript types

  auth/                          # Google OAuth authentication
  health/                        # Health check endpoint

  core/                          # Domain modules (one per bounded context)
    <module>/                    # e.g. messages, accounts, users, channels, conversations, scoring, slack
      __tests__/
        factories/               # Test data factories for the module
      domain/
        aggregates/              # Domain aggregate(s) with business logic
        repositories/            # Repository port interfaces
        gateways/                # External API gateway port interfaces
        events/                  # Domain events
        value-objects/           # Value objects (if any)
      application/
        commands/                # Command handlers (write use cases) + tests co-located
        queries/                 # Query handlers (read use cases)
        services/                # Application services (if needed)
      infrastructure/
        persistence/
          <module>-persistence.module.ts   # Dynamic module switching ORM vs in-memory
          in-memory/             # In-memory repository implementation (for tests)
          mikro-orm/
            models/              # MikroORM entity files (*.mikroORM.ts)
            mappers/             # Mapper classes (domain ↔ persistence)
            *.repository.mikroORM.ts       # MikroORM repository implementation
            mikro-orm-*-persistence.module.ts
        gateways/                # External API adapter implementations
          fake-*.gateway.ts      # Fake/stub gateway for tests
        controllers/             # HTTP controllers (if the module exposes REST endpoints)
      <module>.module.ts         # NestJS module wiring
```

**Naming conventions:**
- MikroORM entity files: `<entity>.mikroORM.ts`
- MikroORM repository: `<entity>.repository.mikroORM.ts`
- In-memory repository: `<entity>.repository.in-memory.ts`
- Fake gateways (for tests): `fake-<gateway>.gateway.ts`
- Tests co-located with production code: `<file>.test.ts`

### Testing Rules (MANDATORY)

**What can be faked in tests:**
- **Gateways only** — only fake adapters to the external world (Slack API, Linear API, Claude API, etc.)
  - Example: `FakeSlackApiGateway`, placed in `infrastructure/gateways/`
- **In-memory repositories** — allowed because they implement the same port interface as the real repo

**What must NEVER be faked:**
- **Command handlers** — never write `FakeXxxHandler` classes; test the real handler
- **Domain services** — inject the real service class via NestJS DI, never mock or stub it
- **Application services** — inject the real class

**Test module setup:**
- Always use a shared `beforeEach` with `Test.createTestingModule` — never create ad-hoc modules inside individual `it` blocks
- Register real domain services directly: `SlackFilterService` (not `{ provide: SlackFilterService, useValue: ... }`)

**Test file scope:**
- Each test file covers exactly one unit (one handler, one service, one cron job)
- Never mix tests for different handlers or infrastructure classes in the same file

## Tech Stack

- **Runtime:** Node 20, TypeScript (ES2021, strict mode)
- **Backend:** NestJS 11, Express 5, Passport.js
- **Database:** PostgreSQL 16, MikroORM
- **Auth:** @nestjs/passport, @nestjs/jwt

## Code Style

### Function Size & Complexity

- **Keep functions small and single-purpose** — if a function does more than one thing, split it.
- **Max ~20 lines per function** — beyond that, extract named private methods.
- Each extracted method should have a name that reads like a sentence describing what it does (e.g., `resolveUserNames`, `collectMessagesWithReplies`).
- Prefer many small methods over one large method with comments dividing sections.

## Constraints

- Do not use parent repositories in import paths:
  - Use relative imports if files are colocated, absolute imports if the file is in a parent repository
  - For absolute imports, core modules (modules inside src/core/) should be accessed through alias path @/.
    Example: @/users/domain
