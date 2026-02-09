# ShoulderTap - Project Context

## Purpose

This project is named ShoulderTap. It's a SaaS to help companies make decisions, and see the decisions log.

## Technical details

ShoulderTap is a pnpm monorepo with a NestJS API backend and React frontend.
Authentication is via Google OAuth.
The back-end uses Ports and Adapters architecture, CQRS, and Domain Driven Design.
The front-end also uses Ports and Adapters Architecture: there should be a segregation between the fetched data, the business logic, and the presentational logic.

## Repository Structure

```
apps/api/                 # Back-end app folder
├── prisma/               # contains the database schema
├── src/                  # contains all Nestjs modules

```

## Commands

```bash
# Install dependencies (at root)
pnpm install

# Start development (all apps in watch mode)
pnpm dev

# Build all apps
pnpm build

# Start local PostgreSQL
docker-compose -f infra/docker-compose.yml up -d db

# API-specific commands (run from apps/api/)
pnpm dev              # Start NestJS in watch mode
pnpm build            # Compile TypeScript
pnpm start:prod       # Run compiled API

# Frontend commands (run from apps/web/)
pnpm dev              # Start Vite dev server (port 5173)
pnpm build            # Build for production

# Prisma commands (run from apps/api/)
pnpm prisma generate --config prisma/prisma.config.ts
pnpm prisma db push --config prisma/prisma.config.ts
```

## Architecture

### Monorepo Structure

- `apps/api/` - NestJS backend
- `apps/web/` - React + Vite frontend
- `infra/` - Docker compose for local development

### API Module Organization

The API follows NestJS modular architecture with domain-based modules:

- **Auth Module** - Google OAuth via Passport.js, JWT in HTTP-only cookies
- **Users Module** - User CRUD operations
- **Health Module** - Health check endpoint
- **Prisma Module** - Database connectivity wrapper

### API Configuration

- All routes prefixed with `/api/v1/`
- Rate limiting: 120 requests/minute per IP
- Validation: Global pipes with whitelist, transform, and forbidNonWhitelisted
- Static files served from `apps/api/public`

### Database

- PostgreSQL 16 with Prisma 7
- Schema location: `apps/api/prisma/schema.prisma`
- User model: id, email, password (optional), name, googleId

### Authentication Flow

1. User clicks "Sign in with Google" on frontend
2. `GET /api/v1/auth/google` redirects to Google consent
3. Google callback at `/api/v1/auth/google/callback` creates/links user
4. JWT set in `session` cookie, user redirected to frontend
5. Protected routes use `CookieAuthGuard` to verify JWT
6. `GET /api/v1/auth/me` returns current user info

### Frontend Structure

```
apps/web/src/
├── assets/             # All static assets
├── components/         # shared components, not business related
├── modules/            # contains all business modules
├── pages/              # Every different paged. No business code.

```

## Tech Stack

- **Runtime:** Node 20, TypeScript (ES2021, strict mode)
- **Backend:** NestJS 11, Express 5, Passport.js
- **Frontend:** React 18, Vite 7, react-router-dom
- **Database:** PostgreSQL 16, Typeorm
- **Auth:** @nestjs/passport, passport-google-oauth20, @nestjs/jwt
