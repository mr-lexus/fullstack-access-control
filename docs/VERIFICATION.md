# Verification

This records the final pre-submission verification performed against the repository.

## Automated quality gates

| Check                       | Result                                         |
| --------------------------- | ---------------------------------------------- |
| `npm ci`                    | PASS                                           |
| `npm run format:check`      | PASS                                           |
| `npm run lint`              | PASS                                           |
| `npm run typecheck`         | PASS                                           |
| `npm test`                  | PASS — 9 files, 27 tests                       |
| `npm run build`             | PASS                                           |
| `npm run verify:acceptance` | PASS — six scenarios and ten additional checks |
| `npm audit`                 | PASS — 0 vulnerabilities                       |
| `npm audit --omit=dev`      | PASS — 0 vulnerabilities                       |

The Next.js 15 dependency graph is kept in place. A scoped npm override resolves the Next PostCSS dependency to patched `postcss@8.5.23`; both audit modes are clean after reinstalling from the lockfile.

## Evaluator scenarios

1. **Scenario 1 — PASS.** Anna receives exactly `olena`, `taras`, `nina`, and `bohdan`; Dmytro profile editing returns `403 FORBIDDEN`; ordinary and deactivated direct-report edits succeed.
2. **Scenario 2 — PASS.** Anna’s self-role request returns `403 FORBIDDEN` under the current non-hierarchical policy and her role remains `manager`.
3. **Scenario 3 — PASS.** Client pages return 25 items from a total of 1,250, page two differs, detail lookup returns the requested ID, and malformed pagination returns `400 INVALID_INPUT`.
4. **Scenario 4 — PASS.** Ivan logs in to `/manage-users`; that page succeeds, while `/content` and the client API return real 403 responses.
5. **Scenario 5 — PASS.** Ivan first receives `CANNOT_DEACTIVATE_SELF` / `CANNOT_CHANGE_OWN_ROLE`; after Kateryna is deactivated, the corresponding requests receive `LAST_ACTIVE_IT`.
6. **Scenario 6 — PASS.** An Olena session created before deactivation receives `200` first, then `401 UNAUTHENTICATED` on the next client request and a protected-page redirect to `/login` using the same cookie.

## Additional authorization verification

The production verifier also passed:

- literal page authorization matrix for manager, regular user, IT, and unauthenticated requests; the initial `/content` HTML excludes `client-1250`.
- auth-before-validation for an unauthenticated malformed protected request;
- authenticated malformed request returns `400 INVALID_INPUT`;
- mass-assignment rejection without changing the target role;
- password omission from login, current-user, list, create, profile, role, and status responses;
- promoted direct-report regression;
- invalid pagination;
- IT client API denial;
- deactivated login semantics: valid credentials return 403 ACCOUNT_DEACTIVATED without a session, while a wrong password returns 401 UNAUTHENTICATED;
- immediate invalidation of an existing session after deactivation.

## Manual browser verification

No live browser session was manually driven during this pass. Navigation, two-session UI checks, and browser network inspection remain human verification items. The production HTTP verifier covers the corresponding server behavior.

The local machine did not have NVM available; automated verification used the preinstalled Node.js `v24.18.0` runtime. The repository and CI now require/use Node.js 22+ via `.nvmrc`.

## Known limitations / deliberate scope

- The process-local store resets on restart.
- Persistent storage is intentionally outside the assignment.
- Seed passwords are intentionally plain text as required by the assignment.
- There is no browser E2E framework.
- Sorting/filtering, audit history, and Docker remain outside this pass.
- Node single-process semantics are appropriate for this in-memory exercise; a distributed deployment would need shared persistence and session infrastructure.
