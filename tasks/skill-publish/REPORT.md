# Report: skill-publish

## 1. Variant decision
Variant A. Source files in `unblinkr/openclaw-news` at commit d9cec2d:
- `src/lib/paddock/tool-access.ts` lines 62-82: `check_payee` is in `KEYLESS_METERED_TOOLS`, keyless limit `CHECK_PAYEE_KEYLESS_PER_IP_PER_DAY = 25`. This file alone does not say what a paid key does.
- `src/app/api/paddock/mcp/check-payee/route.ts` (the `else if (apiKey)` branch, `paid_key` door): Builder and Pro Agent keys never reach the keyless 25 per IP counter. Builder is capped by `BUILDER_LIMIT_PER_DAY`, Pro Agent has no cap. So a paid key raises or removes the limit, hence variant A.

## 2. Grep
`grep -rn "1,000\|free key" --include=*.md . | grep -v tasks/` returned nothing.

## 3. Tests, typecheck, build
- `npm test`: 22 passed, 1 skipped (live test, needs PADDOCK_LIVE=1).
- `npm run typecheck`: clean.
- `npm run build`: success (ESM, CJS, d.ts, d.cts).
- GitHub CI on PR 2 (unblinkr/paddock-x402-guard#2): success.

## 4. npm
`npm view @paddock-finance/x402-guard version` -> `0.1.1`. Published by `.github/workflows/publish.yml` on the merge to main, with `--provenance`; the registry shows an attestation for 0.1.1.
`package-lock.json` still says 0.1.0 for the package itself (brief said no other change to package.json); it does not affect `npm ci`.

## 5. clawhub whoami
```
unblinkr
```
The first login attempt died on a connection reset to clawhub.ai (no token received); a second device login succeeded.

## 6. ClawHub
Slug `paddock-check-payee`, version 1.0.0, owner unblinkr, dry run passed first. Real publish output: "Update submitted for paddock-check-payee@1.0.0; pending security scans before it becomes public."
`clawhub inspect`: hidden by moderation (pending.publication), moderation result CLEAN, "No suspicious patterns detected."
Status: IN REVIEW (pending scans). Expected URL: https://clawhub.ai/unblinkr/paddock-check-payee (not yet publicly visible; the exact URL format was not confirmed from the docs).
No SKILL.md field was added; the file already had `name` matching the folder and a `description`.

## 7. skills.sh install check
`npx skills add unblinkr/paddock-x402-guard --list`:
```
Found 1 skill
Available Skills
  paddock-check-payee
    Before an AI agent pays an x402 endpoint, check that the payee wallet belongs to that seller using Paddock's free check_payee. Stops payments to a wallet recorded for a different seller.
```

## 8. skills.sh outcome
Automatic. There is no submission form or command. Source: https://skills.sh/docs/faq ("Skills appear on the leaderboard automatically through anonymous telemetry when users run npx skills add <owner/repo>"). Nothing was submitted. `--list` does not install, so the skill appears once someone runs a real install. See QUESTIONS.md.

## 9. Em dash and banned terms
Checked README.md, package.json, skills/paddock-check-payee/SKILL.md, this report, QUESTIONS.md and the commit messages for U+2014 and the section 5 terms: 0 hits each. TASK.md names the banned terms by design (em dash written as "U+2014"), as in the earlier x402-guard task.

## Deviations
- Worked on the assigned branch `claude/charming-carson-55witj` instead of `task/skill-publish`.
- Added `unblinkr/openclaw-news` to the session read-only to read `tool-access.ts`.
- `docs/STATUS.md` in openclaw-news not updated: the repo was attached read-only. Row needed for the founder or a later session.

## QUESTIONS.md
Two items: the free-key conflict and the skills.sh install count.
