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

## Browser verification

### Adversarial browser QA

The initial full adversarial browser QA was executed against a production Next.js build with external Playwright MCP / Chromium tooling at the pre-fix production baseline. Isolated browser contexts were used for multi-session checks, and browser, network, HTTP, and console state were inspected.

The pass verified:

- all six assignment scenarios;
- IT, manager, and user role matrices, including active login and generic 401 behavior for wrong-password and unknown-user attempts;
- deactivated-account login semantics: correct credentials returned `403 ACCOUNT_DEACTIVATED`, while wrong credentials returned generic 401;
- server-side client pagination returned 25 records from a total of 1,250, with no complete client dataset in the initial HTML or list responses;
- client detail access;
- real 403 responses for direct unauthorized pages;
- exactly four seeded direct reports for Anna, editable deactivated direct reports where permitted, read-only promoted direct reports, and a usable zero-report manager state;
- two-context live deactivation: an existing Olena session received 401 on its next protected client request after Ivan deactivated Olena and reached `/login`;
- no unexpected 5xx responses, hydration errors, or browser page errors.

### Findings and targeted fixes

The initial pass found two MEDIUM issues:

- stale authenticated navigation after live deactivation followed by protected server navigation;
- a profile row retaining the pre-normalized email after a successful server save.

It also found a LOW possibility of duplicate rapid profile PATCH requests, inconsistent row busy-state affordances, and a missing favicon / failed icon request.

These findings were addressed in the subsequent `fix: resolve final browser QA findings` commit:

- stale navigation → login-path navigation guard;
- stale profile draft → authoritative PATCH synchronization;
- duplicate mutation → synchronous request lock;
- busy-state inconsistency → row-wide pending state;
- missing favicon → App Router icon asset.

### Post-fix browser smoke

A dedicated full post-fix regression report was not available to this documentation pass. The targeted fix pass reported:

- live deactivation server navigation reaches `/login` with zero protected navigation before and after refresh — PASS;
- Ivan and Kateryna normalized emails match the PATCH response, reloaded users, and rendered input — PASS;
- rapid delayed double-save sends exactly one PATCH — PASS;
- all row mutation controls are disabled during delayed role mutation — PASS;
- rapid delayed Create User produces one POST and one account — PASS;
- the application icon request succeeds with no console error — PASS.

The existing “Olena clicks Next” path was not completed in that targeted smoke pass because the optional network matcher hung; the production HTTP immediate-deactivation acceptance scenario still passed.

The local browser/agent environment may have used Node `v24.18.0` because NVM was not available. The repository supports/requires Node 22+, and CI independently runs using the `.nvmrc` Node 22 line.

## Known limitations / deliberate scope

- The process-local store resets on restart.
- Persistent storage is intentionally outside the assignment.
- Seed passwords are intentionally plain text as required by the assignment.
- There is no persistent in-repository Playwright E2E suite; browser QA was performed externally against the production build.
- Sorting/filtering, audit history, and Docker remain outside this pass.
- Node single-process semantics are appropriate for this in-memory exercise; a distributed deployment would need shared persistence and session infrastructure.
