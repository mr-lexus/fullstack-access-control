# Project instructions

## Commands

- Install: `npm ci`
- Development: `npm run dev`
- Formatting: `npm run format` / `npm run format:check`
- Tests: `npm test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Production: `npm run build` then `npm run start`
- HTTP acceptance: `npm run build` then `npm run verify:acceptance`

## Architecture boundaries

- `src/domain` owns shared types, role definitions, pure domain helpers, and error codes.
- `src/server/data` owns the process-local deterministic store and seeds.
- `src/server/auth` owns authentication and reusable authorization policies.
- `src/server/users` owns user operation enforcement and account invariants.
- `src/server/clients` owns client content access enforcement and server-side pagination.
- `src/app/api` contains HTTP adapters only.
- `src/components` contains presentation and UX only.

## Dependency direction

- `src/domain` must not import `src/server`, `src/app`, or `src/components`.
- `src/server` may depend on `src/domain` but never on UI/components.
- Pages and route handlers may call server policies/services but must not mutate the store directly.
- Client components may import pure domain types/constants/helpers but never `src/server`, session/store code, or `UserRecord`.
- User mutations go through `user-service.ts`.
- Client data access goes through `client-service.ts`.

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
- A role that can access Manage Users must also define its user visibility scope, typically through `VIEW_ALL_USERS` or `VIEW_DIRECT_REPORTS`.

## Protected request behavior

- Unauthenticated protected pages redirect to `/login`; authenticated but unauthorized protected pages return a real HTTP 403.
- Protected API handlers resolve the current active user before parsing protected operation input where applicable. Authorization remains centralized in policies/services; no protected mutation or data access executes without authorization.
- Malformed unauthenticated protected requests return 401 rather than validation details; authenticated malformed requests return the appropriate application validation error.
- Protected browser fetches hard-navigate to `/login` on 401; 403 remains a forbidden/error state and does not log out.
- Protected auth-dependent pages and APIs keep dynamic/no-store semantics where required; stale caching must not break immediate deactivation.
- A deactivated direct report is still a direct report, so managers must not filter reports by status.
- A user may report to a deactivated manager; that relationship remains valid and is not repaired automatically.
- Preserve error precedence: `LAST_ACTIVE_IT` wins when it overlaps self-deactivation or self-demotion.

## Browser QA

- Follow `docs/BROWSER_QA.md` for adversarial browser verification.
- Run browser QA against a production build and restart the deterministic process-local server between independent clean-seed scenarios.
- Use isolated browser contexts for multi-session authorization tests.
- Inspect Network, HTTP status, console errors, and rendered state; DOM visibility alone is not authorization evidence.
- Browser discovery passes are review-only: report reproducible findings before modifying code.
- Do not add Playwright as a project dependency solely to execute the external QA playbook.

## Adding a fourth role

- Add the role and its complete capability set in `src/domain/roles.ts`; the typed role map remains exhaustive.
- Role selectors derive their options from the central role set.
- Navigation and user-management control visibility derive from capabilities.
- Object-level target behavior derives from centralized role/domain semantics.
- Routes do not add independent literal role-name branching.
- A role with access to Manage Users must also define its user visibility scope, typically through `VIEW_ALL_USERS` or `VIEW_DIRECT_REPORTS`.
