# Project instructions

## Commands

- Install: `npm install`
- Development: `npm run dev`
- Tests: `npm test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Production: `npm run build` then `npm run start`

## Architecture boundaries

- `src/domain` owns shared types, role definitions, capabilities, and error codes.
- `src/server/data` owns the deterministic in-memory users, clients, and sessions.
- `src/server/auth` owns session resolution and all authorization decisions.
- `src/server/users` owns user mutation invariants.
- `src/server/clients` owns server-side client pagination and access.
- API handlers are HTTP adapters, not policy owners.
- Client components never import the store or internal user records.

## Non-negotiable invariants

- Authorization is enforced on the server; UI visibility is never security.
- Never trust client input to identify the actor or determine the actor's permissions.
- `role`, `status`, `managerId`, and password may only be accepted by endpoints that explicitly allow those target-user fields, and they must be validated or whitelisted on the server.
- Profile mutation accepts only `fullName` and `email`.
- The current user is reloaded from the live store on every protected request.
- Client data is always server-paginated; never send the complete dataset.
- Role strings belong in the central role definition (seed/test fixtures may use exported constants).
- Roles are non-hierarchical.
- Manager profile editing requires a direct report who is not the actor and is not another manager.
- At least one active IT account must always remain.
- If both last-active-IT and self-deactivation/self-demotion apply, `LAST_ACTIVE_IT` wins.
- IT cannot view content pages.

## Adding a fourth role

- Define the role and its complete capability set in `src/domain/roles.ts`; the typed role map must remain exhaustive.
- Role selectors must derive their options from the centralized role definition.
- Navigation and user-management control visibility must derive from capabilities.
- Route handlers must call shared capability or policy helpers rather than adding independent role comparisons.
- Server object-level policies remain authoritative for target-specific decisions and account invariants.
- Adding a role must not require searching React components or API routes for scattered literal role checks.
