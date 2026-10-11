# TASK: Fix the free-limit line, then publish the check_payee skill to ClawHub and skills.sh

Repo: `unblinkr/paddock-x402-guard` (not openclaw-news). Branch: `task/skill-publish` (this session worked on the assigned `claude/charming-carson-55witj`). Executor model: sonnet. Date issued: 2026-10-11.
todoist_task: 6hgrWRXr9jvHQ33W (step 6 only; the card stays open for step 9). closes: none. mockup: none.
PR mode: merge to `main` when tests, typecheck and build are green. The text changes are founder-approved strings from section 6.

Note on this copy: the banned-term list in section 5 is stored with the em dash written as "U+2014", so this file itself carries no em dash.

## 1. Goal
1. The skill file and the package README state the check_payee limits correctly, and npm shows the corrected README.
2. The skill `paddock-check-payee` is published on ClawHub.
3. The skill installs with `npx skills add unblinkr/paddock-x402-guard` and is submitted to skills.sh, or the exact submission steps are written down for the founder.

## 2. Context
Repo holds `@paddock-finance/x402-guard` (0.1.0 on npm since 2026-10-07) and the skill at `skills/paddock-check-payee/SKILL.md`. Both call Paddock's `check_payee` (`https://paddock.finance/api/mcp/check-payee`).
Both files carried a wrong line: a free key gives 1,000 checks a day. Founder confirmed on 2026-10-11 that paddock.finance is right: a free key covers five other tools at 10 calls a day, and `check_payee` is not one of them. `check_payee` allows 25 calls a day per IP with no key, then costs $0.01 per call through x402.
Whether a paid key (Builder `pk_builder_`, Pro Agent `pk_proagent_`) lifts the `check_payee` limit is set in `src/lib/paddock/tool-access.ts` in `unblinkr/openclaw-news`. Read it to pick the text variant. Do not change it.
Outside PRs `x402-foundation/x402#3760` and `coinbase/agentic-wallet-skills#63` point here. Do not touch them.

## 3. Decisions already made
- The site is the source of truth for limits. Fix the package to match it.
- Skill name and slug stay `paddock-check-payee`.
- Publish ClawHub under the founder's own account, not an org.
- No code changes to the guard. Text only, plus the version bump.
- The founder does one click for any login (device code). Hand her the URL and code; do not ask her to run commands.

## 4. Hard rules
- No em dashes anywhere you write: files, commit messages, PR text, CLI fields.
- Use the section 6 strings exactly. No other copy changes.
- No tokens, keys or one-time codes in any file, commit, REPORT.md or QUESTIONS.md. Device codes go to chat only.
- Do not change `src/`, tests, or `tool-access.ts`.
- If `tool-access.ts` cannot be read from this session, write it to `QUESTIONS.md` and stop before any edit.
- If an npm publish would need the founder's password or a one-time password typed into a terminal, stop and write it to `QUESTIONS.md`.
- Nothing is submitted to a directory unless the ClawHub validation or skills.sh check passes first.

## 5. Banned terms
U+2014 (em dash), neutral, corrections log, guaranteed, data layer

## 6. Build scope
### Change A: fix the limit text
Read `src/lib/paddock/tool-access.ts` in `unblinkr/openclaw-news`; record path and line in REPORT.md. Does a Builder or Pro Agent key raise or remove the `check_payee` daily limit? Variant A if yes, B if no.

`skills/paddock-check-payee/SKILL.md`, body under `## Free`:
- A: `25 checks a day without a key. Past that, Paddock answers 402 and you pay as normal. A Builder or Pro Agent key from https://paddock.finance/api-access lifts the limit.`
- B: `25 checks a day without a key. Past that, Paddock answers 402 and you pay as normal.`

`README.md`, body under `## Limits`:
- A: ``Free without a key: 25 checks a day per IP. Past that, the guard fails open and the payment goes through. A Builder or Pro Agent key from <https://paddock.finance/api-access> lifts the limit; pass it as `paddockGuard({ apiKey })`.``
- B: `Free without a key: 25 checks a day per IP. Past that, the guard fails open and the payment goes through.`

Variant B only: README options table `apiKey` row changes from `Your Paddock key` to `Not needed for check_payee today`.

Grep the whole repo for `1,000` and `free key`. If either remains outside `tasks/`, write it to `QUESTIONS.md` and stop.

### Change B: release 0.1.1
1. Bump `package.json` version to `0.1.1`. No other change.
2. Commit A and B together: `docs: correct check_payee limits in README and skill`
3. Publish 0.1.1 the same way 0.1.0 was published (see `tasks/x402-guard/REPORT.md`, `.github/workflows/`). Keep provenance on. If the only way is a manual `npm publish` needing the founder's credentials, stop per section 4.

### Change C: ClawHub
1. Read https://docs.openclaw.ai/clawhub/publishing and https://docs.openclaw.ai/clawhub/skill-format. If SKILL.md lacks a required field, add only that field and note it in REPORT.md.
2. `npx clawhub login` uses a device code. Post to chat in one line, exactly: `CLAWHUB LOGIN: open <url>, enter <code>, sign in with GitHub as unblinkr, click Authorize.` then wait.
3. `clawhub whoami` must show the founder's account.
4. Dry run, then publish:
   - `clawhub skill publish ./skills/paddock-check-payee --slug paddock-check-payee --name "Paddock Check Payee" --dry-run`
   - `clawhub skill publish ./skills/paddock-check-payee --slug paddock-check-payee --name "Paddock Check Payee"`
5. Record the ClawHub URL. If held for security review, say so in REPORT.md; that still counts as done.

### Change D: skills.sh
1. `npx skills add unblinkr/paddock-x402-guard --list` (or current equivalent); paste output showing `paddock-check-payee`.
2. Find the current skills.sh submission method (https://skills.sh, vercel-labs/skills docs). CLI command: run it. Web form or browser sign-in: do not attempt; write numbered steps with every value to `QUESTIONS.md`. Automatic listing: say so with the source link.

## 7. Out of scope
Wrappers for Cloudflare, the x402 MCP client, mppx or Python. Any change to paddock.finance or openclaw-news. Any change to either outside PR. New skills, new categories beyond what ClawHub requires, or a new skill name.

## 8. Verification checks (paste results into REPORT.md)
1. The `tool-access.ts` path and line that decided the variant, and which variant was used.
2. `grep -rn "1,000\|free key" --include=*.md . | grep -v tasks/` returns nothing.
3. `npm test`, typecheck and build pass.
4. `npm view @paddock-finance/x402-guard version` returns `0.1.1`.
5. `clawhub whoami` output, no token shown.
6. ClawHub skill URL and status (live or in review).
7. `npx skills add ... --list` output showing the skill.
8. skills.sh outcome: submitted (link), automatic (source), or steps in QUESTIONS.md.
9. Em dash and banned-term counts are 0 across everything changed.

## 9. Handback
Write `tasks/skill-publish/REPORT.md` with every check from section 8 and anything written to `QUESTIONS.md`. Commit the task folder to `main`. If this session can reach `unblinkr/openclaw-news`, add a row to its `docs/STATUS.md` per the session protocol; if not, say so in REPORT.md.
End the session with:

```
BOARD SYNC
todoist_task: 6hgrWRXr9jvHQ33W : keep open (step 9 wrappers remain) | step 6 done
closes: none
new issues opened: none
needs_mancy: <one line> | none
live: <ClawHub URL> , <skills.sh link or "steps in QUESTIONS.md"> , npm 0.1.1
```
