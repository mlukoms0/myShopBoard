# SECURITY BASELINE

This document is the working security checklist for myShopBoard — read it before shipping anything
that touches authentication, file uploads, or Google Cloud IAM.

Everything here is prioritised into **Day one**, **Before real data**, **Later**, and
**Deliberately skipped**. The goal is real security for a small company, not compliance theatre.

**Target standard: OWASP ASVS 5.0.0 Level 2.** L2 is the documented default for applications holding
sensitive data; L1 explicitly "does not prove compliance" and L3 is overkill for a 20–100 unit
internal fleet app. We self-assess against it once, in writing, and re-review annually.

> **Scope note:** the research behind this doc partly assumed a Next.js stack. Next.js-specific
> items — notably CVE-2025-29927 (the `x-middleware-subrequest` auth bypass) and Server Action
> hardening — **do not apply to us** and have been removed. The underlying principles are translated
> to ASP.NET Core below.

---

## The current OWASP Top 10 (2025), mapped to this app

| Rank | Category | Our exposure | Control |
|---|---|---|---|
| **A01** | Broken Access Control — *found in 100% of tested apps* | An endpoint that forgets its yard/role check | Enforce in the **Domain service layer**, never in the controller alone. `API` cannot reference `Data`, so it structurally cannot bypass it |
| **A02** | Security Misconfiguration — *jumped #5 → #2* | The default GCP compute service account has **Editor on the whole project** | Dedicated runtime service account, §3 |
| **A03** | **Software Supply Chain Failures** — *new category* | npm was hit three times in 9 months (Shai-Hulud Sept 2025; 2.0 Nov 2025 with 796 backdoored packages; Mini Shai-Hulud May 2026) — all ran via install-time lifecycle scripts and harvested cloud credentials | §5 |
| **A05** | Injection | QR route params, search/filter inputs | Validation attributes on every request record; EF Core parameterises queries |
| **A09** | **Security Logging & Alerting Failures** — *renamed to include "Alerting"* | Logs nobody reads | Alert on exactly four events, §6 |
| **A10** | **Mishandling of Exceptional Conditions** — *new category* | A `try/catch` that swallows an authorization failure and falls through to returning data | One `IExceptionHandler`, fail closed, §6 |

---

## 1. Day one — before the first line of feature code

| ✅ | Control | Detail |
|---|---|---|
| ☐ | **No secrets in source** | `appsettings.json` carries placeholders only. Real values from env vars / Secret Manager. myStorage committed live credentials — see its README warning |
| ☐ | **Startup refuses to boot on a placeholder JWT key** | `AddOptions<JwtOptions>().ValidateDataAnnotations().ValidateOnStart()`. Reject anything under 32 bytes or matching the placeholder |
| ☐ | **`Encoding.UTF8` for the signing key, `ValidAlgorithms` pinned** | myStorage uses `Encoding.ASCII` and pins nothing |
| ☐ | **All roles emitted as multiple `ClaimTypes.Role` claims** | Not `roles.FirstOrDefault()` — that's the myStorage escalation bug |
| ☐ | **`.gitignore` covers** `appsettings.Development.json`, `.env`, `.env.local`, `compose.override.yaml`, `.dev-logs/` | |
| ☐ | **Committed config points at LOCAL Postgres** | So the dangerous case requires opting in |
| ☐ | **Deny by default** | Every controller carries `[Authorize]`; anonymous endpoints are an explicit, reviewed exception |
| ☐ | **Class-level `[Authorize]` carries no roles** | ASP.NET Core *intersects* class and method role lists. This shipped as a real bug twice in myStorage |
| ☐ | **Validation attributes on every request record** | Without them `[ApiController]`'s automatic 400 never fires and a database length limit becomes the validator — surfacing as a 500 |
| ☐ | **One `IExceptionHandler` + `AddProblemDetails()`** | No stack traces or DB errors reach the browser. Generic message + correlation id; detail logged server-side only |
| ☐ | **Committed lockfiles**, `npm ci` in CI | Reproducible builds are the precondition for every supply-chain control |

---

## 2. Authentication

### Password and PIN policy — NIST SP 800-63B-4 (Aug 2025)

This is both **cheaper and more secure** than the 90-day-rotation habit most shops still run:

- **15-character minimum** when a password is the only authenticator; 8 when it's one factor of MFA
- **No composition rules.** The spec is explicit: verifiers "SHALL NOT impose other composition rules
  (e.g., requiring mixtures of different character types)"
- **No forced periodic rotation.** "SHALL NOT require subscribers to change passwords periodically"
- **DO** check against a breach blocklist — the Have I Been Pwned k-anonymity range API is free and
  never sees the password
- Rotate only on evidence of compromise

### Session lifetimes

| Device class | Idle timeout | Absolute cap |
|---|---|---|
| Shared shop tablet | **10–15 min** + an explicit "End shift" button on every screen | one shift (8–12 h) |
| Personal admin device | 1 h | 12 h |

Store the device class on the session row so one code path enforces both. On a shared tablet the
real risk is *the previous mechanic's session*, not a remote attacker.

### The technician login problem (Phase 8+)

Passkeys are the **wrong tool** on a shared tablet — a synced passkey lives in one person's iCloud
Keychain and cannot be handed to the next shift. The correct construction:

1. Admins/managers → **Google Workspace OIDC** (accounts already exist; free central offboarding and MFA)
2. The tablet itself → a **registered long-lived device credential** = the possession factor
3. Each mechanic → a **6-digit PIN** = the knowledge factor

PIN alone would be a weak single factor. PIN **+ enrolled-device binding** is a legitimate
two-factor construction, and it's glove-friendly.

> A 6-digit PIN has 1,000,000 combinations — trivially brute-forced without throttling. NIST caps at
> 100 consecutive failures; for a PIN use **5–10 attempts, then lock and require a manager unlock**.

### If we move the refresh token to a cookie

`SameSite=**Lax**`, not `Strict`. A mechanic scanning a QR sticker performs a **cross-site top-level
GET navigation**; `Strict` suppresses the cookie on that first navigation and lands them on a login
screen *every single scan*. `Lax` sends it on top-level GETs while still blocking cross-site POST.

The trade-off: `Lax` leaves state-changing **GET** routes exposed. So — never expose a state-changing
GET route, and verify `Origin`/`Host` on mutations.

---

## 3. Google Cloud — before the first deploy

| ✅ | Control | Detail |
|---|---|---|
| ☐ | **Dedicated Cloud Run runtime service account** | The default compute SA has **Editor on the entire project**. If a compromised dependency or an SSRF grabs a metadata token, that's the whole project. Grant only: `secretmanager.secretAccessor` on *named* secrets, Cloud SQL Client, and object admin on *one* bucket |
| ☐ | **Secret-level IAM bindings**, not project-wide | |
| ☐ | **Reference secrets by version number, not `latest`** | So a bad rotation rolls back through your normal deploy process. myStorage uses `:latest` everywhere |
| ☐ | **Workload Identity Federation for CI** | Keyless OIDC from GitHub. Never a long-lived JSON key file |
| ☐ | **Cloud Run resource + scaling flags set explicitly** | `--memory --cpu --min-instances --max-instances --timeout --service-account`. myStorage sets none of these |
| ☐ | **`storage.publicAccessPrevention` org policy + uniform bucket-level access** | So an object ACL can never quietly make a defect photo public |
| ☐ | **Budget alert** | Cheapest possible protection against a runaway loop or an attack |

**Secret Manager cost at our scale is negligible:** $0.06 per active version per month, $0.03 per
10,000 access operations, with 6 versions and 10,000 accesses free monthly.

---

## 4. File uploads (Phase 10, when defect photos land)

The pipeline, in order. Each step matters:

```
extension allow-list  →  magic-byte check  →  RE-ENCODE  →  random filename  →  private bucket
```

- **Allow only** jpeg / png / heic / webp. **Never SVG** (it's executable markup).
- The `Content-Type` header is user-supplied and trivially spoofed. Magic-byte checking alone is
  also "pretty common and easy" to bypass.
- **Re-encoding is the durable control** — rewriting the image destroys any injected payload *and*
  strips EXIF/GPS metadata in one step. (ImageSharp or SkiaSharp on .NET; strip metadata explicitly.)
- **Cap at ~15 MB/file, ~5 files per note**, rejected *before* buffering — a mechanic with a cracked
  screen will retry twenty times, and this also protects the Cloud Run memory budget.
- **Serve via short-lived V4 signed URLs**, minted per request *after* the authorization check.
  **5–15 minutes, not the 7-day maximum.** Google's own doc: "Anyone in possession of the signed URL
  can use it while it's active, regardless of whether they have a valid account" — the signed URL
  **is** a bearer token.

---

## 5. Supply chain (A03 — new in 2025)

Three npm compromises in nine months, all executing via **install-time lifecycle scripts** and
harvesting cloud credentials with TruffleHog. Concrete controls:

- Commit lockfiles; `npm ci` / `--frozen-lockfile` in CI, never a bare `install`
- **Delay adoption of brand-new versions.** Most of these campaigns were detected within 24–72 hours;
  a 7-day minimum release age would have blocked all three
- Keep the dependency count deliberately small — every added UI library is **install-time code
  execution on a machine that can reach your database**
- Enable Artifact Registry vulnerability scanning
- Dependabot/Renovate weekly, with a human reviewer

---

## 6. Logging and alerting (A09)

The 2025 rename to "…and **Alerting** Failures" is the whole point: logs nobody reads are theatre.
For a small team, alert on exactly **four** things:

1. More than N failed PIN/login attempts on one account within 10 minutes
2. Any role change or user creation
3. Any `DELETE` attempt against the audit or service-history tables
4. Admin login from a new device or network

Route to email + SMS. **Log a salted hash of the session id, never the raw id.**

Also fix what myStorage got wrong here: it has ~246 catch blocks recording nothing, only 1 of 30
controllers injects an `ILogger`, and `CancellationToken` is threaded through 1 of ~200 endpoints.

### Rate limiting — two layers, because Cloud Run autoscales

An in-process counter resets per instance and hands an attacker N× the budget. So:

- **Authoritative per-account counter in Postgres** (`FailedAttempts`, `LockedUntilUtc` on the user row)
- **Cloud Armor rate-based ban at the edge** as abuse mitigation — its own docs note limits are
  "approximate" and enforced **independently per region**, so a multi-region deploy multiplies the
  effective global limit

Also required: configure `ForwardedHeaders` correctly, or `X-Forwarded-For` is never applied and
every client shares one bucket — which is exactly why myStorage's login rate limiter does nothing today.

---

## 7. Audit and retention — where security meets federal law

- **Append-only history.** `REVOKE UPDATE, DELETE ON "ServiceEntries", "AuditLog" FROM app_user;`
  Grant only INSERT and SELECT. Corrections are new reversal rows, never edits.
- A service history that can be silently edited is worthless in a **DOT audit or a post-accident
  deposition**.
- Audit rows carry: actor user id, actor role, target unit id, action, before/after JSON diff,
  request id, source IP, device id, server timestamp.
- **Retention is set by 49 CFR 396.3(c):** 1 year while in service **+ 6 months** after the vehicle
  leaves your control. So "delete unit" must soft-delete, and **database backup retention must exceed
  18 months** for records tied to sold trucks. Consider a GCS retention (WORM) policy on the photo
  bucket.
- **Test the restore.** Automated backups are a checkbox; a documented, actually-executed
  restore-to-a-scratch-instance drill once a quarter is what makes it a recovery capability. This is
  the cheapest item on this page and the most often skipped.

---

## 8. Security headers

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` — **mandatory** given user-uploaded photos |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | deny everything except `camera=(self)` |
| `Content-Security-Policy` | `default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests` |

`frame-ancestors 'none'` kills clickjacking of the admin dashboard.

Set these on the **nginx UI service** (it serves the HTML) and add HSTS on the API too. A grep across
myStorage for `UseHsts`, `UseHttpsRedirection`, `X-Frame-Options`, or `nosniff` returns **zero hits**.

---

## 9. Deliberately skipped

| Thing | Why |
|---|---|
| **SOC 2** | $12k–$20k in audit fees alone, $25k–$80k+ all-in first year for a 10–50 person org. For an internal app with no external customers it buys a report nobody will ask for. Revisit only when a customer contractually demands it |
| **Postgres Row-Level Security as the primary control** | Worth adding later as a *backstop* on audit tables. But it can't express workflow-state or time-based rules, and it's bypassed by table owners unless you use `FORCE ROW LEVEL SECURITY` and run as a non-owner role. Never skip the service-layer check because "RLS has it" |
| **VPC Service Controls** | Overkill at this scale |
| **Phishing-resistant MFA for everyone** | Scope hardware keys/passkeys to the 3–6 **admin** accounts — they're the ones worth phishing. Google Workspace enforces this per-OU at no cost. Don't push it to the shop floor |

**The defensible alternative to SOC 2:** a written ASVS 5.0 L2 self-assessment, this checklist
implemented, one annual external pen test (~$5–15k), and documented backup/restore and offboarding
procedures. That's real security. SOC 2 without those is the theatre.

---

## Single source of truth

| Concern | Lives in |
|---|---|
| Role names | `myShopBoard.API/Authorization/ApiRoles.cs` ↔ `myShopBoard.UI/src/lib/roles.ts` |
| Auth pipeline | `myShopBoard.API/Program.cs` |
| Secret names | `prod-cloudbuild.yaml` `--set-secrets` |
| Retention rules | this document, §7 |
