# Questions

1. Free key conflict. The text now matches the approved strings, but the Paddock app code says otherwise: `tool-access.ts` has `CHECK_PAYEE_FREE_KEY_PER_DAY = 1000`, and the check-payee route gives a `pk_free_` key its own 1000 per day counter for `check_payee`. Only paddock.finance/api-access (free key = five other tools at 10 a day) agrees with the founder's note. Either the site page is out of date or the code is not deployed. If the code is live, the README and skill now undersell the free key. Please confirm which is right.

2. skills.sh listing. There is no submission step. Listing happens through install telemetry when someone runs `npx skills add unblinkr/paddock-x402-guard`. Source: https://skills.sh/docs/faq. I did not run a real install, to avoid creating a ranking signal without your say-so. Steps if you want the first install:
   1. In a scratch folder run: npx skills add unblinkr/paddock-x402-guard --skill paddock-check-payee
   2. Wait for it to show on https://skills.sh (search for paddock-check-payee).

3. ClawHub is pending security scans. Check https://clawhub.ai/unblinkr/paddock-check-payee later, or run `npx clawhub inspect paddock-check-payee`.
