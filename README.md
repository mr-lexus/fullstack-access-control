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

No database, Docker, external authentication, or mandatory environment variables are required.

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

Login creates a random opaque session ID in an HttpOnly, SameSite=Lax cookie. The server-side session map stores only the user ID. Every protected request resolves that ID to the current user record in the live store and checks active status again, so deactivation immediately invalidates the next request without requiring a new login.

Role capabilities and object-level decisions are centralized in `src/server/auth/permissions.ts` and the role definition in `src/domain/roles.ts`. User mutation invariants—including self-operation restrictions and the last-active-IT rule—are enforced synchronously in `src/server/users/user-service.ts`. API route handlers are HTTP adapters: they never accept the authenticated actor from request bodies, whitelist endpoint-specific target-user fields, and delegate authorization to server policies and services.

IT accounts can manage users but cannot view content pages. Managers can view content and only edit ordinary direct reports who are not themselves or other managers. Users can view content but cannot manage users. Client records are always sliced on the server; the complete 1,250-record dataset is never sent to the browser.

## Permission decision locations

- `src/domain/roles.ts` — defines roles and the role-to-capability mapping.
- `src/server/auth/session.ts` — authenticates credentials and resolves opaque server-side sessions.
- `src/server/auth/current-user.ts` — resolves the live user on each protected request and rejects missing or deactivated sessions.
- `src/server/auth/permissions.ts` — contains capability checks and object-level authorization policies.
- `src/server/users/user-service.ts` — authorizes protected user mutations and enforces account invariants.
- `src/server/clients/client-service.ts` — enforces content access through the centralized content policy before pagination or detail access.

`src/server/auth/landing.ts` applies capabilities only to choose an authenticated landing page; it does not grant access. API routes and pages invoke the policies above but do not define independent authorization rules.

## With another four hours

Sorting and filtering with URL state, audit history, broader integration and E2E coverage, richer loading/empty/error states where useful, persistent transactional storage, and Docker are intentionally deferred until after the core assignment.
