# @paddock-finance/x402-guard

Agent payments have no chargeback. Paddock is pre-payment verification for AI agents.

This package adds one check to the x402 client: before your agent signs a payment, it asks Paddock whether the wallet it is about to pay has settled for that seller before. If the wallet is recorded as belonging to a different seller, the payment is stopped before anything is signed. Everything else goes through.

## Install

```bash
npm install @paddock-finance/x402-guard
```

## Use

```ts
import { x402Client } from "@x402/core";
import { wrapFetchWithPayment } from "@x402/fetch";
import { withPaddockGuard } from "@paddock-finance/x402-guard";

const client = withPaddockGuard(new x402Client());
// register your schemes and signer on `client` as usual
const fetchWithPayment = wrapFetchWithPayment(fetch, client);
```

Or register the hook yourself:

```ts
import { paddockGuard } from "@paddock-finance/x402-guard";

client.onBeforePaymentCreation(paddockGuard());
```

## What it does

The hook sends the resource URL and the payment terms (payee wallet, network, asset, amount) to Paddock's `check_payee` endpoint. Paddock answers from its daily record of who actually got paid on x402. There is no live probe, so the check is fast.

| Verdict | Meaning | What the guard does |
|---|---|---|
| `pass` | This wallet has settled for this seller on this network | Lets the payment through |
| `warn` | Something is unusual, such as a wallet not seen for this seller yet | Lets the payment through |
| `unknown` | Paddock has no record for this seller yet | Lets the payment through |
| `fail` | This wallet is recorded as settling for a different seller | Stops the payment before signing |

To also stop on `warn`, pass `paddockGuard({ blockOn: "warn" })`.

## It fails open

If Paddock is slow, unreachable, or you are past the free limit, the payment goes through and `onError` is called. The guard never blocks a payment because of a problem on Paddock's side, and it never pays Paddock.

## Limits

Free without a key: 25 checks a day per IP. Free key: 1,000 checks a day. Get one at https://paddock.finance/api-access and pass it as `paddockGuard({ apiKey })`.

## Options

| Option | Default | |
|---|---|---|
| `apiKey` | none | Your Paddock key |
| `timeoutMs` | `1500` | After this, the payment goes through |
| `blockOn` | `"fail"` | `"warn"` also stops warned payments |
| `integration` | `"x402-guard"` | A tag for your integration |
| `onResult` | none | Called with every verdict |
| `onError` | none | Called whenever the check was skipped |

## Full check

`check_payee` reads the record. For a full check against the seller's live payment terms, use Paddock's `verify_before_pay`: https://paddock.finance/verify

## License

MIT. Built by Paddock, paddock.finance.
