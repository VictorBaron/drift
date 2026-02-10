# ShoulderTap - Project Context

## Purpose

This project is named ShoulderTap.
It's a SaaS to have better Slack notifications that fits your schedule.
It notifies you if it's urgent; or at the end of your focus time-blockers or meetings.

## Technical details

ShoulderTap is a pnpm monorepo with a NestJS API backend and React frontend.
Authentication is via Google OAuth.
The back-end uses Ports and Adapters (Hexagonal) architecture, CQRS, and Domain Driven Design.

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

## Tech Stack

- **Runtime:** Node 20, TypeScript (ES2021, strict mode)
- **Backend:** NestJS 11, Express 5, Passport.js
- **Database:** PostgreSQL 16, MikroORM
- **Auth:** @nestjs/passport, passport-google-oauth20, @nestjs/jwt

## Constraints

- Do not use parent repositories in import paths:
  - Use relative imports if files are colocated, absolute imports if the file is in a parent repository
  - For absolute imports, core modules (modules inside src/core/) should be accessed through alias path @/.
    Example: @/users/domain
