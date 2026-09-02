# Browser QA playbook

This playbook defines adversarial black-box browser verification against the production build. It complements unit and policy tests and HTTP acceptance checks; it is a reusable methodology, not a permanent Playwright test suite.

## Operating mode

- Run discovery as review-only. Do not fix while discovering.
- Do not add Playwright to project dependencies merely to execute this review.
- Prefer external Playwright, MCP, or browser tooling.
- Test a production build rather than relying only on development mode.
- Restart the process-local server between scenarios requiring a clean seed.
- Use isolated browser contexts for concurrent-session tests.
- Treat the assignment and server rules as authoritative.
- UI visibility is not proof of authorization.
- Expected negative 400/401/403/404 responses are not findings when deliberately tested.

## Production setup

Run the application from a clean checkout or approved working tree:

```text
npm ci
npm run build
npm run start
```

An isolated port may be used when another local service is running. The process-local deterministic state resets on server restart. Use the README's seeded-account table as the canonical credential reference; do not duplicate passwords in this playbook.

Primary QA personas:

- Ivan — active IT
- Kateryna — active IT
- Anna — active manager with four reports
- Marta — active manager with zero reports
- Petro — deactivated manager
- Olena — active user / Anna report
- Nina — deactivated user / Anna report

### Scenario discipline

Keep each clean-seed scenario independently reproducible:

- record the server port and browser context used;
- restart the process-local server when earlier mutations could affect the seed;
- log in once per context and retain the resulting session state;
- capture the request and rendered state for both positive and negative cases;
- do not infer authorization from a hidden link or disabled button; and
- reset or close contexts after concurrent-session scenarios.

The README remains the single source for credentials and seed relationships. This playbook describes what to verify, not secret values or a copied one-off prompt.

### Authentication and protected access

For active accounts, verify that login succeeds, the landing page is correct, an HttpOnly session exists, and refresh preserves authentication. For unknown accounts and wrong passwords, verify a generic 401 with no account-status disclosure. For deactivated accounts, verify that correct credentials produce the explicit deactivated response while wrong credentials remain a generic unauthenticated response.

After a rejected deactivated login, verify that no session is created and protected access is unavailable. Back and refresh must not restore authorization. Unauthenticated protected pages redirect to `/login`; authenticated but unauthorized pages return real HTTP 403 behavior where the application requires it.

### Role surfaces and authorization

For each persona, verify both visible navigation and direct URL/API access. Exercise the Manage Users, Clients, and My Profile surfaces according to the role rules, including that IT has Manage Users but no content access, managers have content access and scoped user management, and ordinary users have content access but no Manage Users. Check that hidden controls are also rejected when addressed directly.

For profile operations, verify that allowed profile fields remain editable, own role is not mutable, own deactivation is not offered, and the direct API rejects prohibited self operations. Verify that an active IT account remains manageable when invariants permit and that IT is not incorrectly interpreted as a hierarchical role.

For Anna, verify that only direct reports are visible, managers cannot create users or change role/status, and only permitted direct-report profile fields can be edited. A deactivated direct report remains structurally visible to its manager. If a direct report becomes manager-like, manager profile editing becomes read-only or forbidden. Marta's zero-report state must remain usable.

### Mutation state and errors

For profile, role, status, and create operations inspect:

- pending state;
- duplicate submissions;
- authoritative state after success;
- row and form state after failure;
- error placement;
- normalized server values;
- stale local drafts; and
- unrelated controls during pending operations.

A successful response must not leave UI state disagreeing with the server. Inspect Network for the request and response that establish the authoritative result.

### Pagination and client data boundaries

Inspect the Clients request and response. Verify that the page size matches the requested server pagination, the total remains visible, page 2 differs from page 1, and Previous/Next behavior is correct. Verify client detail and invalid-client behavior.

Confirm that the initial document does not embed the complete client dataset and that a normal list request does not deliver all 1,250 clients to the browser. Record the largest observed list-response item count. Server pagination is the data-exposure and performance boundary, not merely a UI convention.

### Live-session invalidation

Use two independent browser contexts:

- Context A: Olena
- Context B: Ivan

1. Olena logs in and loads `/content`.
2. Ivan logs in separately.
3. Ivan deactivates Olena.
4. Return to the existing Olena context without refreshing.
5. Trigger a protected browser fetch, such as pagination Next.
6. Verify the next request receives 401 and the browser reaches `/login`.
7. Verify protected navigation disappears.
8. Repeat with protected server navigation such as My Profile.

This verifies that authorization depends on the live user record rather than only login-time session claims.

### Browser evidence and issue reports

Collect console errors, uncaught page errors, hydration warnings, unexpected failed assets, unexpected 5xx responses, unexpected 4xx responses outside deliberate negative cases, duplicate API requests, stale authenticated navigation, and stale mutation state.

Every real finding includes:

1. reproduction steps;
2. expected behavior;
3. actual behavior;
4. evidence; and
5. the likely affected area.

Evidence may include method, URL, HTTP status, relevant response JSON, browser role/context, and a screenshot when it materially proves the issue. Do not collect screenshots just for decoration.

Use these severity definitions:

- **BLOCKER** — Core application cannot reasonably be evaluated.
- **HIGH** — Authorization bypass or required invariant/scenario failure.
- **MEDIUM** — Real evaluator-visible functional or state inconsistency without an authorization bypass.
- **LOW** — Small robustness or edge-case issue.
- **UX/POLISH** — Presentation/usability issue without correctness impact.

Do not inflate severity. End the discovery pass with a report and stop before modifying code.

## After discovery

After findings are reviewed, run a separate targeted fix pass, rerun exact reproductions, and run a short role/auth/pagination smoke regression. If required scenarios pass, former findings no longer reproduce, no new meaningful browser findings exist, and automated gates remain green, stop changing the application. Avoid speculative final polishing that increases regression risk.
