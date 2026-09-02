# Fullstack Access Control

A small Next.js App Router application demonstrating server-enforced authorization with deterministic in-memory data. It implements the assignment’s non-hierarchical IT, manager, and user access rules through real pages and HTTP APIs.

## What it does

- Defines non-hierarchical IT, manager, and user roles.
- Enforces authorization on the server, independently of UI visibility.
- Applies object-level manager permissions to direct reports.
- Makes deactivation effective on the next protected request for an existing session.
- Serves 1,250 clients through server-side pagination.
- Exposes real HTTP boundaries with distinct 401, 403, 400, and invariant error responses.
- Uses a deterministic process-local in-memory seed.

## Tech stack

| Technology      | Use                                        |
| --------------- | ------------------------------------------ |
| Next.js         | App Router pages and route handlers        |
| React           | Browser UI                                 |
| TypeScript      | Strict application types                   |
| Vitest          | Unit and policy tests                      |
| In-memory store | Deterministic users, sessions, and clients |
| Plain CSS       | Application styling                        |

## Requirements and commands

Node.js 22+ is supported. From a fresh clone:

```text
npm ci
npm run dev
```

Quality gates:

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run verify:acceptance
```

`verify:acceptance` runs against the built production server, so run `npm run build` first. It starts and controls an isolated server on port 3100, uses explicit HTTP cookies, and exits non-zero on any failed scenario. Each restart creates a clean deterministic in-memory seed.

No database, Docker, external authentication, or mandatory environment variables are required. Users, clients, and sessions are process-local state and reset when the server process restarts. This is intentional because the assignment requires in-memory data. Seed/test passwords are intentionally stored as plain text because password hashing is outside the assignment scope. There is no public signup/registration flow; initial accounts are seeded and IT can create additional users through the protected API.

## Seeded accounts

Every row explicitly lists the seeded password.

| Name     | Email                     | Password    | Role    | Status      | Manager |
| -------- | ------------------------- | ----------- | ------- | ----------- | ------- |
| Ivan     | ivan.it@example.com       | password123 | IT      | active      | —       |
| Kateryna | kateryna.it@example.com   | password123 | IT      | active      | —       |
| Anna     | anna.manager@example.com  | password123 | manager | active      | —       |
| Petro    | petro.manager@example.com | password123 | manager | deactivated | —       |
| Marta    | marta.manager@example.com | password123 | manager | active      | —       |
| Olena    | olena.user@example.com    | password123 | user    | active      | Anna    |
| Taras    | taras.user@example.com    | password123 | user    | active      | Anna    |
| Nina     | nina.user@example.com     | password123 | user    | deactivated | Anna    |
| Bohdan   | bohdan.user@example.com   | password123 | user    | active      | Anna    |
| Dmytro   | dmytro.user@example.com   | password123 | user    | active      | Petro   |

## Authentication and authorization

The application uses opaque server-side sessions. The browser cookie contains only a random session ID; each protected request resolves session ID → user ID → the current user record and checks current status. This keeps mutable role and account status out of a long-lived client token and makes deactivation effective on the next protected request.

Role capabilities and object-level decisions are centralized in `src/domain/roles.ts` and `src/server/auth/permissions.ts`. User mutation invariants—including self-operation restrictions and the last-active-IT rule—are enforced synchronously in `src/server/users/user-service.ts`. Route handlers are HTTP adapters: they never accept the authenticated actor from request bodies, whitelist endpoint-specific target fields, and delegate authorization to policies and services.

Next.js `authInterrupts` is enabled because protected pages use `forbidden()`; it makes authenticated-but-unauthorized requests return a genuine HTTP 403 instead of only rendering a 403-looking UI with HTTP 200.

IT accounts can manage users but cannot view content pages. Managers can view content and edit only ordinary direct reports, including deactivated reports, but not themselves, managers, or arbitrary users. Users can view content but cannot manage users. Client records are sliced on the server; the complete 1,250-record dataset is never sent to the browser.

## Architecture

```text
Browser UI
    |
    v
Next.js pages / route handlers
    |
    v
current-user.ts
    |
    v
permissions.ts
    |
    v
user-service.ts / client-service.ts
    |
    v
process-local in-memory store
```

Pages and route handlers are transport/view adapters. Reusable policy lives in auth, operation invariants live in services, and UI authorization visibility is never security.

## HTTP API

| Method | Endpoint                  | Purpose                                                       |
| ------ | ------------------------- | ------------------------------------------------------------- |
| POST   | /api/auth/login           | Create a session                                              |
| POST   | /api/auth/logout          | End a session                                                 |
| GET    | /api/auth/me              | Read the current user                                         |
| GET    | /api/users                | List visible users (IT → all users; manager → direct reports) |
| POST   | /api/users                | Create a user                                                 |
| PATCH  | /api/users/:id/profile    | Update full name/email                                        |
| PATCH  | /api/users/:id/role       | Change a user role                                            |
| PATCH  | /api/users/:id/status     | Change a user status                                          |
| GET    | /api/clients?page=&limit= | Get one server-paginated client page                          |
| GET    | /api/clients/:id          | Read one client                                               |

## Permission decision locations

- `src/domain/roles.ts` — role/capability definitions.
- `src/server/auth/session.ts` — credential and opaque-session resolution.
- `src/server/auth/current-user.ts` — live active-user resolution.
- `src/server/auth/permissions.ts` — reusable capability and object-level policies.
- `src/server/users/user-service.ts` — user-mutation authorization and invariants.
- `src/server/clients/client-service.ts` — client-content authorization and pagination.

`src/server/auth/landing.ts` is navigation policy only: it selects an authenticated landing page and does not grant access.

## Verification

The repository includes unit and policy tests, production build verification, HTTP acceptance verification mirroring the six evaluator scenarios, and CI from a clean `npm ci`.

Browser-level adversarial verification was performed against the production build with external Playwright/browser tooling. The reusable method is documented in [docs/BROWSER_QA.md](docs/BROWSER_QA.md); factual executed results are recorded separately in [docs/VERIFICATION.md](docs/VERIFICATION.md).

The AI-assisted engineering process behind implementation, independent review, finding triage, targeted fixes, and regression is documented in [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md).

## AI-assisted engineering

AI agents were used as engineering tools rather than as a substitute for verification.

```text
assignment + invariants
        ↓
focused implementation
        ↓
unit / policy / HTTP verification
        ↓
independent adversarial review
        ↓
browser + network QA
        ↓
human finding triage
        ↓
targeted fixes
        ↓
independent regression
        ↓
CI / submission verification
```

Key safeguards:

- `AGENTS.md` gives coding agents explicit architectural boundaries and counterintuitive authorization invariants.
- Discovery/review agents are separated from fix passes so a reviewer does not silently modify the behavior it is evaluating.
- Browser findings require reproducible DOM, network, and HTTP evidence before they become fix tasks.
- Previously passing behavior is re-verified after targeted changes.
- Raw model conversations and hidden reasoning are not treated as project documentation; reusable constraints, methods, and verification evidence are.

See [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md) for the complete workflow.

## With another four hours

1. Persistent in-repository Playwright E2E coverage for navigation and session-expiry regressions.
2. Client sorting/filtering with URL state.
3. A small user-management audit trail.
4. Richer loading, empty, and error states.
5. Docker for reproducibility.

Persistent storage remains intentionally outside the assignment scope.
