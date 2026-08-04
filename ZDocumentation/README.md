# ZDocumentation

Deep-dive working documents for myShopBoard. One line per doc.

These files **are committed to git** (unlike myStorage, whose docs claim the folder is ignored while
all its files are tracked — decided once, here, and the docs match reality).

| Doc | What it covers | Read it before |
|---|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, project layering, request flow, auth design, deployment topology, the decision log, and every deliberate deviation from myStorage | touching the solution layout, the deploy pipeline, or the auth flow |
| [SCHEMA_AND_DATA_MODEL.md](SCHEMA_AND_DATA_MODEL.md) | Entity map, table-by-table design, the QR token scheme, the KPI contract, and the federal records this schema must satisfy | adding a table, a column, or a status value |
| [FEATURES_AND_ROADMAP.md](FEATURES_AND_ROADMAP.md) | Competitive landscape, the full industry feature inventory tiered table-stakes / differentiator / advanced, and the build order | adding a feature or arguing about priority |
| [SECURITY_BASELINE.md](SECURITY_BASELINE.md) | OWASP Top 10 2025 mapped to this app, auth policy, GCP IAM, file uploads, supply chain, audit + retention | shipping anything touching auth, uploads, or IAM |

## Doc conventions

- Topic deep-dives are `SCREAMING_SNAKE_CASE.md`
- Each follows the same skeleton: purpose line → TL;DR → numbered sections with tables →
  "Invariants and gotchas (read before changing anything)" → "Notes and known gaps" →
  "Single source of truth"
- Scoped `TODO(<kebab-scope>)` tags — never a bare `TODO`
- XML doc comments in code carry design **rationale** (naming the rejected alternative), not a
  restatement of the signature

## Still to be written

| Doc | When |
|---|---|
| `NEW_INSTANCE_SETUP.md` | Step 7, when we first deploy to Google Cloud |
| `AUTHORIZATION_AND_ROLES.md` | Phase 8/14, when roles beyond `Admin` exist |
| `LOCAL_DEVELOPMENT.md` | Step 2, once `dev-up.sh` exists |
