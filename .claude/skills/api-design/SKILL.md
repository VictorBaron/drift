---
name: api-design
description: Write comprehensive and scalable REST api
allowed-tools: Read, Write, Edit, Glob, Grep
context: inherit
agent: backend-architect
---

# API Design

## When to Apply

Use this skill whenever you design or review a public HTTP API. The goal is a **widely understood, Stripe-like REST surface**: resource collections, resource IDs in the path, **GET for queries**, **POST for creates/updates/commands**, and **explicit action routes** for real business state transitions.

---

## North Star

Design endpoints so an external developer can predict them without reading docs:

- **Collections** for “things that exist”: `/v1/<domain>/<resources>`
- **Items** addressed by ID in the URL: `/v1/<domain>/<resources>/{id}`
- **Queries** use `GET` (retrieve, list)
- **Commands** use `POST` (create, update, actions)
- Avoid “fake CRUD”: use **explicit action routes** instead of generic `PATCH` with a status field.

---

## Mandatory Rules

### 1/ URL structure

- Prefix: `/v{N}` (e.g., `/v1`)
- Optional domain segment: `/v1/billing/...`
- Resources are **plural nouns**: `credit_grants`, `invoices`, `subscriptions`
- IDs are in the URL path as `{id}`

✅ Good

- `GET /v1/billing/credit_grants/{id}`
- `POST /v1/orders/{id}/cancel`

❌ Bad

- `POST /v1/billing/expireCreditGrant` (RPC style)
- `POST /v1/billing/credit_grants` with `{ id }` used to “select” a record (ID belongs in the path)

---

### 2/ HTTP methods: strict mapping

**Queries (read-only)**

- `GET /.../{id}` → retrieve
- `GET /...` → list (filtering via query params)

**Commands (write / side effects)**

- `POST /...` → create
- `POST /.../{id}` → update (partial update; omitted fields unchanged)
- `POST /.../{id}/{action}` → explicit action (state transition / command)

✅ Good

- `POST /v1/billing/credit_grants` (create)
- `POST /v1/billing/credit_grants/{id}` (update)
- `POST /v1/billing/credit_grants/{id}/expire` (action)

❌ Bad

- `GET /.../expire` (GET must not mutate)
- `PUT /.../{id}` (avoid unless you truly support full replacement semantics)
- `PATCH /.../{id}` (avoid; prefer `POST /{id}` + explicit action routes)

---

### 3/ Action routes are for real business commands

Create action endpoints when:

- The intent is a **domain operation**, not “edit some fields”
- The change is **irreversible** or semantically meaningful (void, cancel, approve, capture, expire)
- You’d otherwise encode meaning in a generic status field

✅ Good

- `POST /v1/invoices/{id}/finalize`
- `POST /v1/payments/{id}/capture`
- `POST /v1/subscriptions/{id}/cancel`
- `POST /v1/credit_grants/{id}/void`

❌ Bad

- `POST /v1/subscriptions/{id}` with `{ "status": "canceled" }` (use `/cancel`)
- `POST /v1/payments/{id}` with `{ "status": "captured" }` (use `/capture`)

---

### 4/ List endpoints: filters are query params

- `GET /v1/<resource>?customer={id}&status=active&limit=10&starting_after=...`

Rules:

- Use `limit` + cursor pagination (`starting_after`, `ending_before`) or equivalent
- Avoid POST for listing unless absolutely necessary (rare)

---

### 5/ IDs and identity rules

- **Every durable object has an ID** returned on creation.
- Item endpoints always use the path ID:
  - `GET /.../{id}`
  - `POST /.../{id}`
  - `POST /.../{id}/{action}`
- Never overload body parameters to choose which object to operate on when an `{id}` is available.

---

## Reliability Requirements (must implement)

### Idempotency (commands)

For any command that can be retried safely but must not duplicate effects (create charge, place order, refund, etc.):

- Require `Idempotency-Key` header
- The server must return the same result for replays of the same key + endpoint

### Long-running commands

If the operation might take noticeable time:

- Return `202 Accepted` with an operation ID
- Provide a query endpoint to check status:
  - `GET /v1/operations/{id}`

---

## Response & Error Conventions (enforced)

### Success responses

- Create: `200` or `201` with created object (choose one convention and stick to it)
- Retrieve: `200` with object
- List: `200` with `{ data: [...], has_more: boolean }` (or your equivalent)
- Action: `200` with updated object, or `202` if async

### Errors

Return a consistent error shape across all endpoints. Minimum:

- `type` or `code` (stable programmatic identifier)
- `message` (human-readable)
- `param` (optional; which field is wrong)
- `request_id` / `trace_id` (for support)

---

## Naming & Taxonomy Rules

- Resource names: snake_case plural nouns (Stripe style)
  - `credit_grants`, `payment_intents`, `invoice_items`
- Actions: lowercase verbs, snake_case if multiword
  - `cancel`, `expire`, `mark_uncollectible`
- Do not bake internal aggregates or DB names into the API.
- Keep nesting shallow:
  - Prefer filters to deep nesting:
    - ✅ `GET /v1/invoice_items?invoice={id}`
    - ❌ `GET /v1/invoices/{id}/items` (allowed only when it’s much clearer)

---

## Decision Checklist (use this before shipping an endpoint)

For each new capability, answer:

1. Is this a **thing** (resource) or an **operation** (action)?
2. If it’s a thing:
   - Do we have `POST /resource` (create)?
   - Do we have `GET /resource/{id}` (retrieve)?
   - Do we have `GET /resource` (list)?
   - Do we have `POST /resource/{id}` (update)?
3. If it’s an operation:
   - Can it be modeled as updating a field without losing meaning?
     - If no → `POST /resource/{id}/{action}`
4. Does it need idempotency?
5. Could it be long-running?
6. Are errors consistent with the global format?

If any answer is “unclear”, redesign before implementation.

---

## Examples (gold standard)

### Resource: credit grants

- `POST /v1/billing/credit_grants`
- `POST /v1/billing/credit_grants/{id}`
- `GET /v1/billing/credit_grants/{id}`
- `GET /v1/billing/credit_grants`
- `POST /v1/billing/credit_grants/{id}/expire`
- `POST /v1/billing/credit_grants/{id}/void`

### Resource: subscriptions

- `POST /v1/subscriptions`
- `GET /v1/subscriptions/{id}`
- `GET /v1/subscriptions?customer={id}`
- `POST /v1/subscriptions/{id}` (non business critical changes, metadata, etc.)
- `POST /v1/subscriptions/{id}/cancel`
- `POST /v1/subscriptions/{id}/pause`
- `POST /v1/subscriptions/{id}/resume`

---

## Anti-patterns (reject in code review)

- No IDs in URL when operating on a durable object:
  - `POST /v1/subscriptions/cancel` with `{ subscriptionId }`
- Status-field commands masquerading as updates:
  - `POST /v1/payments/{id}` with `{ status: "refunded" }`
- GET endpoints with side effects
- Unstable naming (mixing camelCase, kebab-case, singular/plural inconsistently)

---

## What to do if you “don’t want resource-oriented APIs”

You can still keep the public API resource-shaped while making it use-case friendly by:

- using explicit action routes for meaningful business operations
- using strong docs and SDKs that expose “methods” (e.g., `creditGrants.expire(id)`) over resource URLs
- keeping the resource model minimal and stable, and pushing complex workflows into actions

This preserves familiarity and ergonomics without forcing consumers to think like your database.

---
