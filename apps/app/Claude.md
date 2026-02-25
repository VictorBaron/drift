# Drift — Claude Project Guide

This file provides Claude with context about the Drift React application: its purpose, architecture, conventions, and guidelines for contributing code.

---

## Project Overview

**Drift** is a React web application. This guide helps Claude understand the codebase structure, preferred patterns, and conventions so it can assist effectively.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand (or Context API) |
| Routing | React Router v6 |
| Data Fetching | React Query (TanStack Query) |
| Forms | React Hook Form + Zod |
| Testing | Vitest + React Testing Library |
| Build Tool | Vite |
| Package Manager | npm |

---

## Repository Structure

```
app/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Images, fonts, icons
│   ├── components/          # Shared/reusable UI components
│   │   └── ui/              # Base primitives (Button, Input, Modal…)
│   ├── features/            # Feature-scoped modules
│   │   └── <feature>/
│   │       ├── components/  # Feature-specific components
│   │       ├── hooks/       # Feature-specific hooks
│   │       ├── store/       # Feature-specific state
│   │       └── types.ts     # Feature-specific types
│   ├── hooks/               # Global custom hooks
│   ├── lib/                 # Third-party wrappers and utilities
│   ├── pages/               # Route-level page components
│   ├── routes/              # React Router route definitions
│   ├── services/            # API clients and service layer
│   ├── store/               # Global state (Zustand stores)
│   ├── styles/              # Global CSS / Tailwind config overrides
│   ├── types/               # Shared TypeScript types and interfaces
│   ├── utils/               # Pure utility functions
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── biome
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Coding Conventions

### Components

- Use **functional components** exclusively — no class components.
- One component per file. File name matches the component name in PascalCase (e.g., `UserCard.tsx`).
- Export components as **named exports**, not default exports.
- Co-locate small sub-components in the same file if they are not reused elsewhere.
- Prefer **composition over prop-drilling**; use Context or Zustand when prop chains exceed 2 levels.

```tsx
// ✅ Preferred
export function UserCard({ name, avatarUrl }: UserCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-4">
      <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full" />
      <span className="text-sm font-medium text-gray-900">{name}</span>
    </div>
  );
}

// ❌ Avoid
export default function UserCard(props: any) { ... }
```

### TypeScript

- **No `any`** — use `unknown` and narrow, or define a proper type.
- Define component props as a named `interface` or `type` just above the component.
- Use `type` for unions/intersections; use `interface` for object shapes that may be extended.
- Always type the return value of non-trivial utility functions.

### State Management

- **Local state** → `useState` / `useReducer`.
- **Server/async state** → React Query (`useQuery`, `useMutation`).
- **Shared client state** → Zustand store in `src/store/` or the relevant `features/<name>/store/`.
- Avoid storing derived data in state; compute it from source truth.

### Styling

- Use **Tailwind CSS utility classes** as the primary styling approach.
- Avoid inline `style` props unless dynamically computed values are required.
- Use `clsx` or `cn` (a `clsx` + `tailwind-merge` wrapper) for conditional class names.
- Design tokens (colors, spacing, fonts) live in `tailwind.config.ts` — never hardcode hex values.

```tsx
import { cn } from '@/lib/utils';

<button className={cn('rounded-lg px-4 py-2 text-sm font-semibold', isActive && 'bg-indigo-600 text-white')} />
```

### Hooks

- Custom hooks are prefixed with `use` and live in `src/hooks/` (global) or `features/<name>/hooks/` (scoped).
- Each hook should have a single, clear responsibility.
- Hooks that encapsulate data-fetching return `{ data, isLoading, error }`.

### API / Services

- All API calls go through `src/services/`. Components never call `fetch` directly.
- Use React Query for caching, background refetch, and error boundaries.
- API base URL is read from `import.meta.env.VITE_API_BASE_URL`.

### File Naming

| Artifact | Convention | Example |
|---|---|---|
| Components | PascalCase | `UserCard.tsx` |
| Hooks | camelCase prefixed with `use` | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | camelCase or PascalCase | `types.ts`, `User.ts` |
| Stores | camelCase | `authStore.ts` |
| Test files | Same name + `.test` | `UserCard.test.tsx` |

---

## Testing Guidelines

- Write tests with **Jest** and **React Testing Library**.
- Test **behaviour**, not implementation details — query by role, label, or text.
- Aim for high coverage on utility functions and hooks; integration-level tests for complex features.
- Mock network requests with **MSW** (Mock Service Worker) where possible.

```tsx
// ✅ Good: test what the user sees
expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

// ❌ Avoid: testing internals
expect(component.state.isLoading).toBe(false);
```

---

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser bundle.

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_APP_ENV` | `development` / `staging` / `production` |

Copy `.env.example` to `.env.local` and fill in values before running locally.

---

## Path Aliases

The `@/` alias resolves to `src/`. Use it for all non-relative imports.

```ts
// ✅
import { Button } from '@/components/ui/Button';

// ❌
import { Button } from '../../../components/ui/Button';
```

---

## Error Handling

- Wrap route-level pages in React Router `<ErrorBoundary>` components.
- Use React Query's `onError` callbacks for mutation failures; surface errors via a toast system.
- Never silently swallow errors — log them or propagate them.

---

## Performance Notes

- Lazy-load page-level components with `React.lazy` + `Suspense`.
- Memoize expensive computations with `useMemo`; stabilize callbacks with `useCallback` only when profiling shows a benefit.
- Avoid anonymous functions/objects as props on frequently re-rendering components.

---

## Commit & PR Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
- Keep PRs focused — one concern per PR.
- All PRs require passing CI (lint, typecheck, tests) before merge.

---

## Key Contacts / Resources

- **Design system / Figma**: *(link here)*
- **API documentation**: *(link here)*
- **Deployment pipeline**: *(link here)*