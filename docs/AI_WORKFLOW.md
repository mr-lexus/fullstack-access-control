# AI-assisted engineering workflow

AI agents were used for implementation, adversarial review, and browser QA. Executable tests, server authorization, browser evidence, and human review remained the sources of confidence. AI output was not treated as proof of correctness: the assignment and repository invariants were authoritative, and findings were validated before fixes were made.

## Operating principles

### Specification before generation

Before implementation, important requirements and counterintuitive invariants are written into `AGENTS.md`. Examples include:

- server authorization is authoritative;
- roles are non-hierarchical;
- live status is checked on every protected request;
- last-active-IT precedence is preserved;
- client data remains server-paginated; and
- UI visibility is not security.

### Separate implementation from review

Implementation and adversarial review are separate passes. The reviewer is instructed not to modify code while discovering defects. This prevents the reviewing agent from silently changing the system it is supposed to evaluate.

### Evidence before fixes

A reported issue includes reproducible evidence where applicable: request method and URL, HTTP status, response body, rendered state, browser context, and a screenshot when useful. Only validated findings receive targeted fix passes.

### Targeted fixes instead of broad rewrites

Fix agents receive explicit finding scopes and must preserve already verified behavior. Opportunistic refactoring is avoided during final hardening.

### Multiple verification layers

Confidence comes from independent layers:

1. TypeScript, lint, and formatting;
2. unit and policy tests;
3. production HTTP acceptance verification;
4. adversarial browser QA;
5. post-fix browser regression; and
6. CI from a clean install.

### Human decision point

AI severity labels and recommendations are inputs, not final authority. A human reviews whether a finding is real, whether it violates the assignment, whether it is worth fixing, and whether further change creates more regression risk than value.

## Workflow

| Stage                   | Agent mode                     | Primary evidence                            | Guardrail                                          |
| ----------------------- | ------------------------------ | ------------------------------------------- | -------------------------------------------------- |
| Constraint extraction   | Analysis / planning            | Assignment + `AGENTS.md`                    | No implementation before invariants are understood |
| Implementation          | Focused coding pass            | Tests + build                               | Work only inside defined scope                     |
| Static/API review       | Independent review             | Source + HTTP behavior                      | Review-only; do not fix                            |
| Browser QA              | Independent adversarial review | DOM + Network + console + isolated sessions | Review-only; collect evidence                      |
| Finding triage          | Human decision                 | Reproduction evidence                       | Reject false positives / unnecessary scope         |
| Targeted fix            | Focused coding pass            | Validated findings                          | Preserve previously passing behavior               |
| Regression              | Independent browser review     | Exact former reproductions + smoke matrix   | No fixes during verification                       |
| Submission verification | Automated gates + human review | CI + verification record                    | Stop changing working code without evidence        |

## Repository artifacts

- `AGENTS.md` contains project constraints, boundaries, and invariants for coding agents.
- `scripts/verify-acceptance.mjs` performs executable production HTTP verification of evaluator scenarios and security regressions.
- `docs/BROWSER_QA.md` defines reusable black-box browser QA methodology.
- `docs/VERIFICATION.md` is the factual record of checks that were actually executed.
- `.github/workflows/ci.yml` provides clean-install automated quality verification.

## Why the browser review is external

Playwright/browser automation is intentionally used as external QA tooling instead of being added as a mandatory runtime or project dependency solely for one review pass. This keeps the assignment dependency surface small while still permitting real browser-level verification.

A persistent in-repository Playwright E2E suite would be a reasonable next step for a longer-lived production project.

## What is intentionally not stored

The repository does not store:

- raw chat transcripts;
- hidden model reasoning or chain-of-thought;
- large one-off prompts;
- screenshots without verification value; or
- model-specific marketing claims.

It stores reusable engineering constraints, methodology, and verification evidence rather than conversational history.
