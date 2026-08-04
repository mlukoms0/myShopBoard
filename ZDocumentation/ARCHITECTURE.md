# ARCHITECTURE

This document is the working map of myShopBoard — read it before touching the solution layout, the
deployment pipeline, or the auth flow.

**Audience note:** this is written for someone learning full-stack development. Terms are explained
the first time they appear. Nothing here assumes prior .NET, React, Docker, or Google Cloud knowledge.

---

## TL;DR

myShopBoard is a **fleet maintenance shop board** for a dump-truck / highway-tractor trucking company.
Mechanics scan a QR sticker on a truck to open that unit's page — spec, service history, who worked on
it, open issues, and what service is coming due. An admin dashboard shows the whole fleet with
availability KPIs.

It is built as a deliberate sibling to **myStorage** (the existing 3PL warehouse app), reusing its
conventions so the two can eventually become one ecosystem. It runs today as a fully standalone app.

- **Backend:** ASP.NET Core on .NET 10 (LTS), PostgreSQL 16 via Entity Framework Core
- **Frontend:** React + Vite single-page app, Tailwind + shadcn/ui
- **Hosting:** two Google Cloud Run services (API + UI) in their own GCP project
- **Auth:** ASP.NET Core Identity + JWT bearer, claim shape kept byte-compatible with myStorage

---

## 1. Decision log

Every non-obvious choice, why it was made, and when. Add a row rather than editing history.

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Backend language/framework | **C# / ASP.NET Core**, with a **separate React frontend** | Owner already runs myStorage on this stack. An ecosystem needs a standalone API that several frontends and future integrations (telematics, accounting, a driver app) can consume — a framework that couples the API to one frontend would force building a second API later. |
| 2 | .NET version | **net10.0** | .NET 9 loses support **2026-11-10**, ~3 months out. .NET 10 is LTS through **2028-11-14** and is already installed (SDK 10.0.302, runtime 10.0.10). This is a deliberate break from myStorage's net9.0 — see §10. |
| 3 | Database | **PostgreSQL 16** | Matches myStorage exactly. Relational is correct for this domain (units, work orders, service history are all strongly related). |
| 4 | Database hosting, phase 1 | **Free serverless Postgres** (Neon), migrate to Cloud SQL later | Owner's choice. $0 while proving the app out; Cloud SQL's smallest tier is ~$10–25/mo. Connects fine from Cloud Run. One migration step later, which is cheap because EF Core migrations are portable. |
| 5 | Identity topology | **Fully separate from myStorage now**, but same JWT conventions | Owner's choice: both apps will change before they connect. Keeping the claim shape, Identity schema, and signing-key convention identical means they can be unified later **without a user migration or password-hash remapping**. |
| 6 | Tenancy | **Single company, multiple yards/shops** | Owner's choice. Units and work orders carry a `YardId`. No `OrganizationId` — this is not multi-company software. Yard scope is cheap now and gives per-yard availability KPIs for free. |
| 7 | Google Cloud layout | **Separate GCP project** from myStorage | Owner's choice. Cleaner blast-radius isolation: a mistake in one app cannot touch the other's data or billing. Costs duplicated IAM setup and a second deploy runbook. |
| 8 | QR sticker access | **Login required**, redirect back to the scanned unit | Owner's choice. No anonymous surface at all. Sticker codes are still random and non-guessable as defence in depth. The shop tablet stays signed in, so mechanics rarely see a login screen. |
| 9 | Web API style | **MVC controllers** (`[ApiController] : ControllerBase`) | Matches all 30 myStorage controllers. Minimal APIs would make shared middleware and filters awkward across the two apps. |
| 10 | Layering | Keep myStorage's shape, **but drop the `API → Data` reference** | myStorage's API project references Data directly, and 10 of its 30 controllers inject repositories or the DbContext outright — bypassing the tenant scoping that lives in Domain. Removing the reference makes that structurally impossible here. |
| 11 | No `.Shared` project | Omitted | myStorage's `myStorage.Shared` contains exactly one file — its own `.csproj` — and nothing references it. |
| 12 | Postgres identifier casing | **PascalCase** (`"Units"`, `"UnitNumber"`) | Matches myStorage. snake_case would be marginally nicer but forks the convention permanently. |
| 13 | Primary keys | **`long` identity everywhere** | myStorage mixes `long` and client-generated `Guid` across 9 tables, so one table can hold `OrderId Guid?` next to `CustomerInventoryId long?`. Pick one. |
| 14 | Background jobs | **Hangfire, but not until Phase 7** | Needed eventually for PM-due recalculation and nightly availability snapshots. Adds a Postgres schema and a dashboard to secure, so it stays out of Program.cs until there is a job to run. |
| 15 | `ZDocumentation/` | **Committed to git** | myStorage's docs claim the folder is git-ignored while all 21 files are tracked. Decide once, make the docs match. |

---

## 2. Stack

Versions marked **(pin at install)** should be set to the current stable release when the project is
created, then locked in `Directory.Packages.props` / `package.json`. Do not leave them floating.

### Backend

| Concern | Choice | Version |
|---|---|---|
| Runtime | .NET | `net10.0` |
| Web framework | ASP.NET Core MVC controllers | 10.0.x |
| ORM ("object-relational mapper" — maps C# classes to database tables) | Entity Framework Core | 10.0.x |
| Postgres driver | `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.x (pin at install) |
| User accounts | `Microsoft.AspNetCore.Identity.EntityFrameworkCore` | 10.0.x |
| Tokens | `Microsoft.AspNetCore.Authentication.JwtBearer` | 10.0.x |
| API documentation | `Microsoft.AspNetCore.OpenApi` + Scalar UI | pin at install |
| Testing | xUnit + FluentAssertions **7.0.0** + NSubstitute or Moq | see §11 |
| Integration test DB | `Testcontainers.PostgreSql` | 4.x |

> **FluentAssertions must stay at 7.0.0.** Version 8 and later are commercially licensed. A routine
> "update all packages" creates a payment obligation. myStorage pins 7.0.0 for this reason.

### Frontend

| Concern | Choice | Notes |
|---|---|---|
| Framework | React | 19 (myStorage is on 18; see §10) |
| Build tool | Vite | pin at install |
| Language | TypeScript | 5.x (myStorage is on 4.9.5 — not worth matching) |
| Styling | Tailwind CSS + shadcn/ui over Radix | design tokens ported from myStorage's `src/index.css` |
| Icons | lucide-react | |
| Routing | react-router-dom | v6+ |
| Server state | **@tanstack/react-query** | Deliberate addition — myStorage has none; see §10 |
| Tables | @tanstack/react-table | v8 |
| Forms | react-hook-form + zod | |
| Charts | recharts | |
| Toasts | sonner | |
| Testing | Vitest + Testing Library | |

### Infrastructure

| Concern | Choice |
|---|---|
| Local database | `postgres:16-alpine` in Docker Compose |
| API container | `mcr.microsoft.com/dotnet/aspnet:10.0`, non-root |
| UI container | `nginx:alpine` serving the built static files |
| Registry | Google Artifact Registry |
| Runtime | Google Cloud Run × 2 services |
| Build | Google Cloud Build |
| Secrets | Google Secret Manager |

---

## 3. Repository layout

```
myShopBoard/                        <- repo root, git repo, .sln lives here
├── myShopBoard.sln                 <- "solution": a list of projects that build together
├── myShopBoard.API/                <- the web server. Controllers, Program.cs, Dockerfile
│   ├── Controllers/
│   ├── Authorization/ApiRoles.cs   <- role-name constants
│   ├── Auth/CurrentUserScope.cs    <- resolves the caller's yard scope per request
│   └── Program.cs                  <- startup: what services exist, what middleware runs
├── myShopBoard.Domain/             <- business logic. Services, DTOs, mappers, exceptions
│   ├── Services/                   <- IUnitService + UnitService, etc.
│   ├── Records/                    <- request/response shapes
│   ├── Mappers/                    <- entity -> DTO projection, written by hand
│   └── Exceptions/
├── myShopBoard.Data/               <- database. EF entities, DbContext, repositories, migrations
│   ├── Entities/
│   ├── Configurations/             <- one IEntityTypeConfiguration class per entity
│   ├── Repositories/
│   ├── Migrations/                 <- auto-generated schema change scripts
│   └── ShopBoardDbContext.cs
├── myShopBoard.Tests/              <- xUnit test project
├── myShopBoard.UI/                 <- React app. Deliberately NOT in the .sln
│   ├── src/{components,pages,services,hooks,lib,contexts,config}
│   ├── Dockerfile                  <- checked in, unlike myStorage's
│   └── nginx.conf                  <- checked in, unlike myStorage's
├── ZDocumentation/                 <- these docs
├── compose.yaml                    <- local Postgres
├── dev-up.sh                       <- one command to start everything locally
├── prod-cloudbuild.yaml            <- API build+deploy pipeline
├── ui-cloudbuild.yaml              <- UI build+deploy pipeline
├── CLAUDE.md / AGENTS.md           <- AI agent instructions, at the ROOT (see §11)
├── Directory.Build.props           <- shared build settings for all projects
└── Directory.Packages.props        <- ONE place where every package version is set
```

**What "project" and "solution" mean:** a *project* (`.csproj`) compiles to one output — a library or
an executable. A *solution* (`.sln`) is just a grouping so `dotnet build` can build them all at once
and so an IDE shows them together. Splitting into four projects is how we enforce that, for example,
the web layer physically cannot reach into the database directly.

---

## 4. Layering rules

Dependencies point **one way only**. A project may only use code from projects it references.

```
myShopBoard.API   ──references──>  myShopBoard.Domain  ──references──>  myShopBoard.Data
   (controllers)                     (business logic)                    (EF Core + Postgres)
```

| Rule | Why |
|---|---|
| `API` references **Domain only** — never `Data` | Controllers physically cannot inject a repository or the DbContext, so they cannot bypass the yard-scoping and business rules that live in Domain. This is the single fix to myStorage's biggest structural leak. |
| `Domain` references `Data` | EF entities are the domain model. There is no separate hand-mapped model. Simpler and legible; the trade-off is accepted knowingly. |
| Controllers are thin | Parse the request, call one Domain service, map the result to an HTTP status. No business logic, no LINQ queries. |
| Domain services take and return **records**, never EF entities | Keeps database shapes from leaking out through the API. Projection is manual via static `*Mapper` classes — no AutoMapper. |
| Repositories are auth-unaware | They run queries. Deciding *who may see what* is the service layer's job. |

This will be enforced mechanically by an architecture test (NetArchTest) in the test project, so a
future accidental reference fails the build rather than shipping.

---

## 5. Request flow

What happens when the fleet dashboard loads, end to end:

1. The browser loads the React app from the **UI** Cloud Run service (static files served by nginx).
2. React calls `GET /api/units?page=1&size=50` on the **API** Cloud Run service, attaching a JWT
   bearer token in the `Authorization` header.
3. `Program.cs` middleware runs in a fixed order (see §11) — forwarded headers, exception handling,
   CORS, authentication, authorization, rate limiting.
4. `UnitsController` checks `[Authorize(Roles = ApiRoles.X)]`, then resolves the caller's yard scope
   via `ICurrentUserScope`.
5. The controller calls `IUnitService`, which applies business rules and calls `IUnitRepository`.
6. The repository runs an EF Core query against PostgreSQL and returns entities.
7. The service maps entities to `UnitResponse` records and returns a `PagedResult<UnitResponse>`.
8. The controller returns `Ok(result)`; React renders the table.

---

## 6. Authentication and authorization

### Token design — kept byte-compatible with myStorage

Even though the two apps are separate today (decision #5), the token shape is identical so they can
be unified later without touching user rows.

| Element | Value |
|---|---|
| Access token | JWT, HS256, **15 minute** lifetime |
| Refresh token | 32 CSPRNG bytes, base64; **7 day sliding** lifetime |
| Refresh storage | Only a `SHA256` hash is stored, in a `RefreshTokens` table |
| Rotation | Every use issues a new refresh token and revokes the old one |
| Reuse detection | Replaying a rotated token revokes the whole chain |
| Binding | Snapshot of Identity's `SecurityStamp`, so a password change kills all sessions |
| Config keys | `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` |

**JWT claims — this list is the contract. Do not deviate.**

`ClaimTypes.NameIdentifier` (Identity user id, a `string`), `ClaimTypes.Email`,
`ClaimTypes.GivenName`, `ClaimTypes.Surname`, a custom `"department"` claim, and `ClaimTypes.Role`.

> **Fixed here, broken in myStorage:** myStorage emits `roles.FirstOrDefault()` — exactly one role
> claim, chosen from an unordered list. myShopBoard emits **all** roles as multiple `ClaimTypes.Role`
> claims. It also uses `Encoding.UTF8` (not `ASCII`) for the signing key and pins `ValidAlgorithms`.

### Three enforcement layers — only one is real security

1. **Menu filtering** (`config/menu.ts`) — decides which links render. Cosmetic.
2. **Route guards** (`ProtectedRoute`) — client-side redirect. Bypassable by anyone with dev tools.
3. **Backend `[Authorize]` + service-layer scoping** — **the actual wall.**

Role names live in `myShopBoard.API/Authorization/ApiRoles.cs` and are mirrored in
`myShopBoard.UI/src/lib/roles.ts`. They must stay 1:1; a guard test pins both sides.

**Attribute rule:** class-level `[Authorize]` carries **no roles**; every method declares its own
`[Authorize(Roles = ApiRoles.X)]`. ASP.NET Core *intersects* class and method role lists rather than
overriding — this shipped as a real bug twice in myStorage.

### Phase 1 scope

One admin account. Roles beyond `Admin` are scaffolded but not populated. The role vocabulary
(Technician, Shop Foreman, Fleet Manager, Parts Clerk) is designed now so it does not collide with
myStorage's nine roles if the tokens are ever merged.

---

## 7. Yard scope model

`ICurrentUserScope` is a small interface with **load-bearing semantics** copied verbatim from
myStorage:

- returning `null` from a scope method means **unscoped** — internal staff or a background job
- returning a **non-null but empty** list means **match nothing**
- services are the enforcement seam; repositories stay auth-unaware

Since myShopBoard is single-company (decision #6), the scope axis is `YardId`. An admin sees all
yards. This ships in Phase 1 with a trivially-unscoped implementation so the seam exists before it
is needed, rather than being retrofitted across every query later.

Unlike myStorage, yard filtering will be applied with an **EF Core global query filter**, not by
remembering a `.Where()` in each repository method. myStorage's own audit found ~8 endpoints that
forgot the tenant check and leaked cross-tenant data.

---

## 8. Local development

Ports are chosen so **both stacks can run at the same time**.

| Service | myStorage | myShopBoard |
|---|---|---|
| API | 5279 | **5280** |
| UI (Vite dev server) | 8888 | **8890** |
| PostgreSQL (host port) | 5434 | **5435** |

`dev-up.sh` starts Postgres in Docker, the API, and the UI with one command, streaming logs to
`.dev-logs/`. It detects your machine's LAN IP and prints it — necessary for scanning a QR sticker
with your phone against your dev machine.

**Config safety rule:** committed `appsettings.*.json` files point at **local** Postgres and contain
only placeholders for secrets. Real values arrive from environment variables. myStorage's committed
config historically pointed at a production database, which its own README flags as a footgun.

---

## 9. Deployment topology

```
                     ┌─────────────────────── Google Cloud project: myshopboard-prod ──┐
                     │                                                                  │
  Browser ──HTTPS──> │  Cloud Run: myshopboard-ui   (nginx serving the built React app) │
      │              │                                                                  │
      └────HTTPS────>│  Cloud Run: myshopboard-api  (ASP.NET Core)                      │
                     │        │                                                          │
                     │        └──> Secret Manager (Jwt__Key, ConnectionStrings__...)     │
                     │                                                                  │
                     └────────────────────────────────┼─────────────────────────────────┘
                                                      │
                                       Neon serverless Postgres (phase 1)
                                       → Cloud SQL Postgres 16 (later)
```

- Images are tagged with the git commit SHA and pushed to one Artifact Registry repo.
- **Database migrations run as a Cloud Build step *before* deploy**, not at application startup.
  myStorage runs `Database.Migrate()` in `Program.Main` in every environment; two Cloud Run instances
  starting at once race the same schema change and the loser fails its cold start. Its own code
  carries a `TODO(deploy)` admitting this.
- Cloud Run flags that myStorage omits entirely and that we set explicitly: `--memory`, `--cpu`,
  `--min-instances`, `--max-instances`, `--timeout`, `--ingress`, and a **dedicated service account**
  (myStorage runs as the over-privileged default compute account).

---

## 10. Deliberate deviations from myStorage

Consistency is the default. Each row below is a considered exception with its justification.

| Deviation | Reason |
|---|---|
| **net10.0** instead of net9.0 | .NET 9 loses support 2026-11-10. myStorage needs this upgrade too. |
| Packages match the runtime version | myStorage targets net9.0 but pins every ASP.NET/EF package at **8.0.2** — a Feb-2024 patch level, missing ~2 years of security fixes. EF 8 also lacks the distributed migration lock that its cold-start race needs. |
| `Directory.Build.props` + `Directory.Packages.props` | myStorage has neither, which is exactly how the version skew survived across five projects unnoticed. |
| Migrations in a pre-deploy step | See §9. |
| `AddProblemDetails()` + one `IExceptionHandler` | myStorage copy-pastes the same 4-arm exception→status mapping into ~150 actions across 25 controllers, producing five different error shapes. The `{ error, field, value }` response body is preserved so the React client still works. |
| Validation attributes on request records | myStorage's 41 request-record files contain zero validation, so `[ApiController]`'s automatic 400 never fires and a database `StringLength` becomes the de-facto validator — surfacing as a 500. |
| **Testcontainers**, not EF InMemory | The biggest one. myStorage's InMemory provider forced `IsInMemoryProvider` branches into *production* code whose own comment says the fallback is "NOT safe under concurrency" — so the concurrency-critical path that runs in production is never executed by any test. |
| `IEntityTypeConfiguration<T>` classes | myStorage's single `OnModelCreating` is **1,564 lines** — unreviewable and a merge-conflict magnet. |
| One audit-field shape, set by an interceptor | myStorage has three competing families (`CreatedAt`/`UpdatedAt`, `CreatedDate`/`LastModifiedDate`, `CreatedDate`/`CreatedBy`) all stamped by hand in each repository. |
| EF global query filters | myStorage has zero `HasQueryFilter` calls despite 7 entities carrying `IsActive`, so every read path must remember the filter by hand — and several don't. |
| **TanStack Query** on the frontend | myStorage has no server-state library and copy-pastes a ~20-line `useEffect`/`useState`/`try-catch` block into ~39 pages, with no caching, request dedup, or unmount cancellation. |
| React 19, TypeScript 5 | myStorage is on React 18.2 / TS 4.9.5. Two majors behind on TS is not worth matching. |
| Content-hashed asset filenames | myStorage flattens Vite output to `[name].js` (a Scandit workaround we don't need) while serving `/assets/` as `immutable` for one year — unhashed + immutable means stale bundles after every deploy. |
| UI `Dockerfile` and `nginx.conf` checked in | myStorage generates both inside `ui-cloudbuild.yaml` via heredocs and de-indents with a brittle `sed -i`, so the UI image cannot be built or tested locally and the nginx config never appears in a code review. |
| `CLAUDE.md` at the **repo root** | myStorage's lives in `ZDocumentation/`, which is not an ancestor of any source file, so Claude Code loads no project instructions at all when opening that repo. |
| ESLint + Prettier + `.editorconfig` | myStorage has none; the result is visibly mixed 2/4-space indentation and mixed quote style across files. |
| `ShopBoardDbContext`, not `myShopBoardContext` | Leading-lowercase type names violate .NET convention and read badly in every DI registration and generic argument. |

---

## 11. Invariants and gotchas (read before changing anything)

1. **Middleware order in `Program.cs` is not arbitrary.**
   `UseForwardedHeaders` → `UseExceptionHandler` → *(dev)* OpenAPI → `UseCors` → `UseAuthentication`
   → `UseAuthorization` → `UseRateLimiter` → `MapControllers` → `MapHealthChecks("/health")`.
   The exception handler must sit **before** `UseCors` and re-apply the CORS header itself, because
   Kestrel's error path strips it — otherwise a 500 reaches the browser as an opaque CORS failure.

2. **Configure ForwardedHeaders correctly.** myStorage calls `KnownNetworks.Clear()` and
   `KnownProxies.Clear()`, which means *no* proxy is trusted, `X-Forwarded-For` is never applied, and
   every client on earth shares one rate-limit bucket — its login brute-force guard does nothing.
   Trust the Cloud Run front end explicitly.

3. **Startup must refuse to boot on a placeholder JWT key.** Use
   `AddOptions<JwtOptions>().ValidateDataAnnotations().ValidateOnStart()`. myStorage has no startup
   config validation at all, and its deploy config leaves `Jwt__Key` inside a YAML comment — an
   instance deployed exactly as documented signs tokens with a publicly-known key.

4. **`[Authorize]` on a class must not carry roles.** ASP.NET Core intersects class and method role
   lists. Put roles only on methods.

5. **The error body contract is `{ error, field, value }`.** The React `ApiService` base class only
   reads `body.error`; returning a bare string degrades to the useless `"HTTP error! status: 400"`.

6. **The refresh flow needs a single-flight guard on the client.** The server rotates refresh tokens
   and treats a replay as an attack, so N concurrent 401s triggering N refreshes will trip the app's
   own reuse detection and log the user out.

7. **Never use bare relative `fetch('/api/...')` in the frontend.** In production the UI is its own
   nginx host with no `/api` route, so the SPA fallback returns `index.html` with HTTP 200 and
   `res.json()` throws. Everything must go through the `ApiService` base URL. This is a live,
   production-only bug in myStorage's `auth.ts` today.

8. **Dockerfile restore layer:** copy the `.sln` and **all** `.csproj` files before `dotnet restore`,
   then `COPY . .`. myStorage copies only the API's csproj, so restore silently skips every package
   in Data and Domain and re-downloads them on every source change.

9. **`FluentAssertions` stays at 7.0.0.** Version 8+ is commercially licensed.

10. **Ports 5280 / 8890 / 5435** — chosen to not collide with myStorage. Changing them means you can
    no longer run both apps at once.

---

## 12. Notes and known gaps

- **No infrastructure-as-code yet.** Cloud Build triggers, Secret Manager entries, IAM bindings and
  domain mappings will exist only as runbook prose in `NEW_INSTANCE_SETUP.md`, the same as myStorage.
  Terraform is the eventual answer; it is out of scope for the first phases.
- **`VITE_API_URL` is baked in at build time.** This forces a circular bootstrap (deploy API → build
  UI with its URL → redeploy API with the UI's origin for CORS). myStorage's runbook calls this its
  "#1 it deployed but nothing works" cause. Fetching a `/config.json` at boot is the fix; deferred.
- **Shared packages are deliberately not built yet.** The auth token lifecycle, the `ApiService` base
  class, the role vocabulary, the UI kit, and the deploy templates are all obvious extraction
  candidates once both apps stabilise. Extracting now would couple two moving targets.
- **Phase 1 has one admin account.** Real role assignment, technician PINs, and per-endpoint
  permissions are Phase 5+.

---

## Single source of truth

| Concern | Lives in |
|---|---|
| Role names (backend) | `myShopBoard.API/Authorization/ApiRoles.cs` |
| Role names (frontend) | `myShopBoard.UI/src/lib/roles.ts` |
| Package versions | `Directory.Packages.props` |
| Database schema | `myShopBoard.Data/Migrations/` |
| Entity shapes | `myShopBoard.Data/Entities/` + `Configurations/` |
| API request/response shapes | `myShopBoard.Domain/Records/` |
| Deploy configuration | `prod-cloudbuild.yaml`, `ui-cloudbuild.yaml` |
