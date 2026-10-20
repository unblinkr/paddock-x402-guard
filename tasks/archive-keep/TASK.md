# Keep what cannot be rebuilt later (archive mirror, raw catalog, raw 402s, raw seller list, PayCheck pull)

Branch: `task/archive-keep` (this session was assigned `claude/compassionate-knuth-0aipat`)
Date issued: 2026-10-19, revised 2026-10-20 (x402 Domain Discovery call, Oct 19)
todoist_task: none | closes: none | mockup: none
PR mode: merge on green. Every change is a new, separate job writing only to a new private R2 prefix. Nothing touches the nightly writer, KV, retention, any public page, API route or MCP handler. If a change would require that, stop, write `QUESTIONS.md`, open a draft PR.

## 1. Goal
From tonight on, Paddock keeps a private raw copy of everything it sees that cannot be rebuilt from the blockchain later, and stops losing full-fidelity nights to the 90-day slimming. Must run unattended and alert only when a job misses a night.

## 2. Context
Paddock (paddock.finance, repo `unblinkr/openclaw-news`) writes one snapshot per night. Snapshots older than 90 days are slimmed: `servers[]` and `total_amount` dropped. Settlements are on-chain and rebuildable. Not rebuildable: the catalog, the 402 each endpoint actually served, raw seller list pages, delivery evidence, attribution as it stood that night. The gap worth keeping is the dated record of what a listing advertised next to what the live 402 returned (Job 3). Founder decision 2026-10-19: Paddock goes dark. Only cheap, non-backfillable capture. No paid delivery probes.

## 3. Decisions already made
- New jobs only. No change to the nightly writer, recipient walk, retention/slimming, KV contents or any public surface.
- Storage: R2 private prefix `archive-raw/`, gzip JSON, `archive-raw/<job>/<YYYY-MM-DD>.json.gz`. If the repo has no R2 binding usable from a workflow, write `QUESTIONS.md` and stop.
- KV read with a read-only token (R11). Writes only to `archive-raw/`.
- Each object: `captured_at`, `source_url`, `job_version`, `http_status` per request, `complete: true|false` with reason.
- Partial failure still writes, with `complete: false`.
- Alerts use the existing "open or update alert issue" pattern. Every workflow runs its script with pipefail.
- Full wallet addresses fine inside `archive-raw/`; never in logs, issues or REPORT.md (hosts only).
- Never pay. No second probe shape. No secrets in repo or output. No em dashes.

## 4. Build scope
1. Snapshot mirror: daily copy of the night's snapshot from KV; first run also copies every full-fidelity stored night (back to about 2026-07-21), skipping dates already in R2.
2. Raw catalog: daily, full CDP Bazaar discovery catalog and MPP service registry, unfiltered.
3. Raw 402s: daily; hosts that settled in the last 30 days plus one seventh of other endpoints by URL hash. One unpaid request per endpoint, store raw 402 (status, headers, body), advertised terms from Job 2, and comparison (`match`, `PRICE_MISMATCH`, `PAYTO_MISMATCH`, `NETWORK_MISMATCH`, `ASSET_MISMATCH`, `SCHEME_MISMATCH`, `NOT_402`, `UNREACHABLE`). 10 s timeout, max 2 requests per host per second, shard by host if needed.
4. Raw seller list: daily, 30 minutes after the nightly snapshot; x402scan seller list, one request, `page_size` above `total_count`, assert `hasNextPage` false, store raw plus `stats.overall`.
5. Lumiere PayCheck pull: daily, free public routes only, at most 50 requests per minute, User-Agent naming Paddock and hello@paddock.finance; stats, operators, leaderboard, traffic, per-endpoint score, wallet-changes, failures; weekly usage. No paid routes, no POST.
6. Watchdog: daily, check each of the five objects for the previous UTC date and its `complete` flag; open or update one alert issue; weekly R2 size and Job 3 mismatch counts.

## 5. Out of scope
Any change to nightly writer, recipient walk, retention, slimming, KV, verify logic, public pages, API, MCP, pricing, corrections log, reliance log. Any paid call. Domain-to-routes history. Contact with Lumiere, nohumans or any seller. Any public mention.

## 6. Verification (for REPORT.md)
Job 1 first-run list; one real run of Jobs 2 to 5; Job 3 counts and example rows; Job 6 forced-missing test; projected R2 growth; `git diff --stat` clean of protected areas; pipefail and em dash checks; tsc, build, tests.

## 7. Handback
`tasks/archive-keep/REPORT.md`, update `docs/STATUS.md`, merge on green, end with a BOARD SYNC block.
