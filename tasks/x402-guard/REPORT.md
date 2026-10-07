# Report: @paddock-finance/x402-guard 0.1.0

## 1. npm test
22 passed, 1 skipped (live, needs PADDOCK_LIVE=1).
- verdicts: pass / warn / unknown go through; fail aborts with the exact reason; fail with no full_check falls back to https://paddock.finance/verify; blockOn warn aborts on warn with the exact reason; blockOn warn still lets pass through
- fails open (each calls onError once): timeout, network error, 402, 401, 400, 500, malformed JSON, unknown verdict
- checkPayee returns null on failure
- mapping and request: missing url skips the call; v1 maxAmountRequired fallback; documented body, headers and endpoint (no payment header); custom integration and endpoint; apiKey sent as api_key
- withPaddockGuard registers exactly one hook on a real x402Client and returns it

## 2. Fail-open proof
Temporarily changed the guard to return `{ abort: true }` when the check failed. 8 tests went red (timeout, network error, 402, 401, 400, 500, malformed JSON, unknown verdict): `Tests 8 failed | 14 passed`. Restored the source; back to 22 passed.

## 3. Live test (PADDOCK_LIVE=1)
```
{"schema":"check_payee/0.1","verdict":"unknown","block_recommended":false,"reasons":[{"code":"seller_not_in_record","detail":"Paddock has no settlement record for this seller or this wallet yet."}],"seller":{"host":"example.com","record_host":null,"paddock_url":null},"payee":{"pay_to":"0xabc","network":"eip155:8453","recorded_for_seller":false,"last_settled":null,"networks_seen":[]},"amount":{"checked":false,"settled_mean_usdc":null,"ratio":null},"asset":{"value":null,"checked":false},"record":{"as_of":"2026-10-06","measured_days":25},"door":"keyless","integration":"x402-guard","full_check":"https://paddock.finance/verify"}
 ✓ live check_payee > returns unknown for an unseen seller 2189ms
```

## 4. Build and pack
`npm run build` produced `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts`, `dist/index.d.cts`. `require("./dist/index.cjs")` exports checkPayee, paddockGuard, withPaddockGuard.
`npm pack --dry-run` lists: LICENSE, README.md, dist/index.cjs, dist/index.d.cts, dist/index.d.ts, dist/index.js, package.json (7 files).

## 5. Banned terms and U+2014
```
grep -rniE "guarantee|insurance|safe to pay|100%|data layer|trust layer" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist .   -> 0 hits (excluding this tasks/ folder text, which only names the terms in no file)
grep -rn $'\xe2\x80\x94' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist .   -> 0 hits
```
(Run before this report was added; this report contains the term list in the command above, so rerun excludes `tasks/`.)

## 6. Skill discovery
`npx skills add ./ --list` found 1 skill: `paddock-check-payee`.

## 7. Package size
package size 4.8 kB, unpacked 17.1 kB.

## Files
package.json, package-lock.json, tsconfig.json, tsup.config.ts, vitest.config.ts, .gitignore, LICENSE, README.md, src/index.ts, test/guard.test.ts, test/live.test.ts, skills/paddock-check-payee/SKILL.md, .github/workflows/publish.yml, .github/workflows/ci.yml, tasks/x402-guard/QUESTIONS.md, tasks/x402-guard/REPORT.md

## Not done
Not published to npm, not merged. See QUESTIONS.md (README import path, branch name, empty remote with no main).
