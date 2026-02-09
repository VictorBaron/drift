---
name: front-end
description: Write front-end code in React
version: 1.0.0
---

# React Front-end skill

This document defines **non-negotiable rules** and a **folder structure** that keeps **data, logic, and presentation** separated, makes **pages layout-only**, and keeps **CSS colocated** with components.

## Skill Purpose

This skill assists with:

- Writing scalable front-end code in React
- Separation of concerns in front-end
- Files to create and their name patterns

---

## Goals

- Separation of concerns:
  - **Data**: API calls, DTOs, caching
  - **Logic**: business rules, domain model, transformations
  - **Presentation**: React components + CSS
- **Pages** are layout only (no fetching, no business logic).
- UI is built from **autonomous widgets** dropped into pages.
- CSS is **colocated** with the component it styles (using vanilla-extract).

---

## 1/ Hard Boundaries (Non-Negotiable)

### Rule 1 — Pages don’t fetch, don’t compute

- Pages may read route params and decide which widgets to render.
- Pages **must not**:
  - call `useQuery`, `useMutation`
  - call API clients directly
  - contain business logic (pricing, permissions, validation rules, etc.)
- Pages **may** pass:
  - IDs, filters, primitive config, feature flags, route params

### Rule 2 — Presentational components don’t know where data comes from

- “View” components are **pure**: props in → JSX out.
- View components **must not**:
  - import TanStack Query
  - import API clients
  - access storage (`localStorage`, cookies) or `window`
- View components **may**:
  - use UI-only hooks for rendering (e.g. `useMemo`), but avoid stateful orchestration.

### Rule 3 — Business logic never imports React

- Domain logic is plain TypeScript.
- `entities/**/model` and `features/**/model` must not import React.

### Rule 4 — Data layer is swappable

- All server calls go through a small API layer (repositories/services).
- UI never imports the HTTP client directly.

---

## 2/ Folder Structure That Enforces Separation

Recommended layout (feature-oriented + widgets):

```
src/
├─ app/ # app shell, router config, providers
├─ modules/ # Features and widgets, separated by domain
│ ├─ [module_name]/ # domain name
│ │ ├─ widgets/ # autonomous UI blocks used by pages
│ │ ├─ features/ # user-facing capabilities (invite, checkout, search)
│ │ └─ entities/ # core domain objects (user, invoice, project)
├─ pages/ # route-level layout only
└─ shared/ # generic UI, hooks, utils, styles, api client
```

### What belongs where

#### `shared/`

- Generic UI components (design system)
- Utilities, formatting, generic hooks
- Styling tokens (colors, spacing, typography)
- API client (fetch wrapper, axios instance, etc.)

#### `entities/`

- Domain types + domain rules for core business objects
- Example: `invoice.calculateTotal(items)`
- Optional: entity-specific API accessors

#### `features/`

- “Unit of user value” that composes entities + UI
- Has its own `api/`, `model/`, `ui/` when needed

#### `widgets/`

- Autonomous blocks that can be embedded in pages
- A widget owns:
  - data fetching (TanStack Query)
  - orchestration state
  - mapping server/domain data into view-model props

#### `pages/`

- Only layout and composition
- Reads route params and places widgets

---

## 3/ The Widget Pattern

Every widget is split into:

```
widgets/ProjectSummary/
├─ ProjectSummary.widget.tsx # data + orchestration (container)
├─ ProjectSummary.view.tsx # presentation (pure)
├─ ProjectSummary.css.ts # colocated styles
└─ index.ts # public export
```

### Widget rules

#### `*.widget.tsx` (container/orchestrator)

- Allowed:
  - `useQuery`, `useMutation`, `useQueryClient`
  - local UI state for orchestration
  - mapping DTO/domain → view-model
- Not allowed:
  - large presentational markup (keep it in `.view.tsx`)
  - styling beyond passing classNames or composing the view

#### `*.view.tsx` (presentation)

- Pure component:
  - accepts props only
  - no TanStack Query imports
  - no direct API calls
- Allowed:
  - CSS Modules
  - UI components from `shared/ui`
  - very small UI-only logic (formatting, simple conditional render)

---

## 4/ Import & Dependency Rules

### Allowed dependency flow

- `pages → widgets → features → entities → shared`
- `widgets → entities → shared`
- `features → entities → shared`
- `entities → shared`
- `shared → (nothing outside shared)`

### Prohibited imports

- `shared` must not import from `entities/features/widgets/pages`
- `entities` must not import from `features/widgets/pages`
- `features` must not import from `widgets/pages`
- `view` files must not import from `api` or TanStack Query

---

## 5/ TanStack Query Rules

### Rule 1 — Server state lives in TanStack Query

- Do not duplicate server data into local/global state.
- Use query cache as the source of truth.

### Rule 2 — Local state is for ephemeral UI only

- modal open/close, local input drafts, tab selection, disclosure state

### Rule 3 — Global client state is rare and explicit

Examples:

- auth session (token/user)
- theme
- feature flags
  Keep it small and separated from server state.

### Rule 4 — Query keys are standardized

- Use a central key factory per entity/feature.
- Keys must be stable and serializable.

### Rule 5 — Mutations must invalidate/update queries intentionally

- Always decide which queries to invalidate or update.
- Never “invalidate everything”.

---

## 6/ React Router Rules

### Rule 1 — Route components are pages (layout only)

- `src/pages/**` are the components mounted by React Router.
- Pages:
  - read `useParams`, `useSearchParams`
  - decide layout (grid/sections)
  - place widgets

### Rule 2 — Loaders (if used) are not business logic

If you use React Router data APIs:

- loaders should not contain domain logic
- keep loaders small and delegate to `api/` or `model/` boundaries

(If you do not use loaders, ignore this.)

---

## 7/ DTOs Are Not Domain Models

### Rule — Map at the boundary

- API returns DTOs
- `model` transforms DTO → domain
- widgets transform domain → view-model props

Where mappings live:

- `**/api/*.ts`: request/response DTO types, transport concerns
- `**/model/*.ts`: domain types & transformations
- `**/*.mapper.ts`: explicit mapping functions (recommended)

This prevents API changes from rippling through UI.

---

## 8/ CSS Colocation Rules

Preferred: **Vanilla Extract**.

### Rules

- Each component has its own `Component.css.ts` written with vanilla-extract
- No styling across component boundaries:
  - don’t target children from outside with `.parent :global(.child)`
- Global CSS is minimal:
  - reset/base typography only
- Design tokens go in `shared/styles/`:
  - spacing scale, colors, typography variables

---

## 9/ Public API per Folder

### Rule — Every folder exports a small surface via `index.ts`

- Consumers should import from the folder root only.

✅ Good:

- `import { ProjectSummaryWidget } from "@/widgets/project-summary"`
- `import { inviteMember } from "@/features/invite-member"`

❌ Bad:

- `import { X } from "@/features/invite-member/ui/Form"`
- `import { Y } from "@/widgets/project-summary/ProjectSummary.view"`

### Enforcement

- Ban deep imports via ESLint rules (see “Enforcement” section).

---

## 10/ File Naming Conventions

- `*.widget.tsx` — container/orchestrator (TanStack Query allowed)
- `*.view.tsx` — pure presentational UI
- `*.model.ts` — domain/business rules (no React)
- `*.api.ts` — API calls (transport layer)
- `*.mapper.ts` — DTO ↔ domain ↔ view-model mapping
- `*.css.ts` — colocated component styles

---

## 11/ Translations

### Rule: no text should be left untranslated

- All displayed texts should be translated, in both french and english
- Default text in components should be english
- It should use `@lingui/react`

---

## 12/ Testing Strategy Aligned to the Architecture

### Domain/model

- Many fast unit tests for:
  - calculations
  - validation
  - mapping functions
  - business rules

### Widgets

- Integration tests (mock API boundary / MSW if used)
- Test that:
  - correct query keys are used
  - mutation invalidations happen
  - mapping to view props is correct

### Views

- Minimal tests
- Prefer interaction tests only where meaningful
- Avoid snapshot spam

---

## 13/ Enforcement (Recommended)

### ESLint boundary rules (must-have)

Enforce:

- no deep imports
- no forbidden cross-layer imports
- no TanStack Query imports in `*.view.tsx`
- no React imports in `**/model/**`

### TypeScript path aliases

Use `@/` for `src/` to make imports consistent and readable.

---

## 14/ Quick Examples (Contract Summary)

### Page: layout only

- reads route params
- places widgets
- passes IDs/filters

### Widget: autonomous

- uses TanStack Query
- orchestration + mapping
- renders view

### View: pure UI

- receives props only
- renders with colocated CSS

---

## “Definition of Done” Checklist

- [ ] No `useQuery/useMutation` in `pages/**`
- [ ] No API calls in `*.view.tsx`
- [ ] No React imports in `**/model/**`
- [ ] Widget split exists (`.widget` + `.view` + `.css.ts`)
- [ ] Imports respect dependency graph
- [ ] Folder has `index.ts` and consumers don’t deep-import
- [ ] Query keys follow the standard key factory
- [ ] Mutations invalidate/update the right queries (not all)
- [ ] Text is always translated in french and english

---
