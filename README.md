# Fullstack Access Control

A small Next.js App Router application demonstrating server-enforced authorization with deterministic in-memory data.

## Requirements and commands

Node.js 20+ is supported. From a fresh clone:

```text
npm install
npm run dev
```

Quality checks:

```text
npm test
npm run lint
npm run typecheck
npm run build
npm run start
```

No database, Docker, external authentication, or mandatory environment variables are required. Users, clients, and sessions are process-local in-memory state and reset when the server process restarts. This is intentional because the assignment explicitly requires in-memory data. Seed/test passwords are intentionally stored as plain text because the assignment explicitly excludes password hashing. There is no public signup/registration flow; the initial accounts are seeded and IT can create additional users through the protected user-management API.

## Seeded accounts

Every account uses the password `password123`.

| Name | Email | Role | Status | Manager |
| --- | --- | --- | --- | --- |
| Ivan | ivan.it@example.com | IT | active | — |
| Kateryna | kateryna.it@example.com | IT | active | — |
| Anna | anna.manager@example.com | manager | active | — |
| Petro | petro.manager@example.com | manager | deactivated | — |
| Marta | marta.manager@example.com | manager | active | — |
| Olena | olena.user@example.com | user | active | Anna |
| Taras | taras.user@example.com | user | active | Anna |
| Nina | nina.user@example.com | user | deactivated | Anna |
| Bohdan | bohdan.user@example.com | user | active | Anna |
| Dmytro | dmytro.user@example.com | user | active | Petro |

## Authentication and authorization

I chose opaque server-side sessions instead of storing role/status authorization claims in a long-lived client token because role and account status are mutable authorization state. The browser cookie contains only a random session ID. Each protected request resolves sessionId → userId → current user record and checks the user’s current status again. This avoids stale authorization claims and makes deactivation effective on the very next protected request.

Role capabilities and object-level decisions are centralized in `src/server/auth/permissions.ts` and the role definition in `src/domain/roles.ts`. User mutation invariants—including self-operation restrictions and the last-active-IT rule—are enforced synchronously in `src/server/users/user-service.ts`. API route handlers are HTTP adapters: they never accept the authenticated actor from request bodies, whitelist endpoint-specific target-user fields, and delegate authorization to server policies and services.

IT accounts can manage users but cannot view content pages. Managers can view content and only edit ordinary direct reports who are not themselves or other managers. Users can view content but cannot manage users. Client records are always sliced on the server; the complete 1,250-record dataset is never sent to the browser.

## Architecture

Browser UI
  ↓
Next.js pages / API route handlers
  ↓
current-user.ts — authentication + active-user resolution
  ↓
permissions.ts — role and object-level policies
  ↓
user-service.ts / client-service.ts — operation enforcement
  ↓
in-memory store

Pages and route handlers are adapters; policies and services own authorization and operation rules. UI visibility is presentation only and is never security.

## HTTP API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | /api/auth/login | Create a session |
| POST | /api/auth/logout | End a session |
| GET | /api/auth/me | Read the current user |
| GET | /api/users | List visible users (IT → all users; manager → direct reports) |
| POST | /api/users | Create a user |
| PATCH | /api/users/:id/profile | Update full name/email |
| PATCH | /api/users/:id/role | Change a user role |
| PATCH | /api/users/:id/status | Change a user status |
| GET | /api/clients?page=&limit= | Get one server-paginated client page |
| GET | /api/clients/:id | Read one client |

## Permission decision locations

- `src/domain/roles.ts` — defines roles and the role-to-capability mapping.
- `src/server/auth/session.ts` — authenticates credentials and resolves opaque server-side sessions.
- `src/server/auth/current-user.ts` — resolves the live user on each protected request and rejects missing or deactivated sessions.
- `src/server/auth/permissions.ts` — contains capability checks and object-level authorization policies.
- `src/server/users/user-service.ts` — authorizes protected user mutations and enforces account invariants.
- `src/server/clients/client-service.ts` — enforces content access through the centralized content policy before pagination or detail access.

`src/server/auth/landing.ts` applies capabilities only to choose an authenticated landing page; it does not grant access. API routes and pages invoke the policies above but do not define independent authorization rules.

## With another four hours

1. Add HTTP-level integration tests for authentication and authorization boundaries.
2. Add client sorting/filtering with state reflected in the URL.
3. Add a small audit trail for user-management mutations.
4. Improve loading, empty, and error states where useful.
5. Add Docker as the final reproducibility improvement.

I would keep the in-memory store because persistence is intentionally outside the scope of this assignment.
