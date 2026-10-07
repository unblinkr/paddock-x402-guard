import type {
  BeforePaymentCreationHook,
  PaymentCreationContext
} from "@x402/core/client";

export type PaddockVerdict = "pass" | "warn" | "fail" | "unknown";

export interface CheckPayeeReason {
  code: string;
  detail: string;
}

export interface CheckPayeeResult {
  verdict: PaddockVerdict;
  block_recommended: boolean;
  reasons: CheckPayeeReason[];
  seller?: { host?: string; record_host?: string; paddock_url?: string };
  payee?: Record<string, unknown>;
  record?: { as_of?: string; measured_days?: number };
  door?: unknown;
  integration?: unknown;
  full_check?: string;
  [key: string]: unknown;
}

export interface CheckPayeeInput {
  url: string;
  pay_to: string;
  network: string;
  asset?: string;
  amount_atomic?: string;
}

export interface PaddockGuardOptions {
  apiKey?: string;
  timeoutMs?: number;
  blockOn?: "fail" | "warn";
  integration?: string;
  endpoint?: string;
  onResult?: (result: CheckPayeeResult, context: PaymentCreationContext) => void;
  onError?: (error: unknown) => void;
  fetch?: typeof fetch;
}

const DEFAULT_ENDPOINT = "https://paddock.finance/api/mcp/check-payee";
const DEFAULT_FULL_CHECK = "https://paddock.finance/verify";
const VERDICTS: readonly string[] = ["pass", "warn", "fail", "unknown"];

function safeCall<A extends unknown[]>(fn: ((...args: A) => void) | undefined, ...args: A): void {
  if (!fn) return;
  try {
    fn(...args);
  } catch {
    // A throwing callback must never affect the payment.
  }
}

/**
 * Raw call to Paddock check_payee. Returns null on any failure
 * (timeout, network error, non-200, non-JSON, unknown verdict).
 */
export async function checkPayee(
  input: CheckPayeeInput,
  options: PaddockGuardOptions = {}
): Promise<CheckPayeeResult | null> {
  const result = await request(input, options);
  return result.ok ? result.value : null;
}

type Outcome = { ok: true; value: CheckPayeeResult } | { ok: false; error: unknown };

async function request(input: CheckPayeeInput, options: PaddockGuardOptions): Promise<Outcome> {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const integration = options.integration ?? "x402-guard";
  const timeoutMs = options.timeoutMs ?? 1500;
  const doFetch = options.fetch ?? globalThis.fetch;

  const body: Record<string, string> = {
    url: input.url,
    pay_to: input.pay_to,
    network: input.network
  };
  if (input.asset) body.asset = input.asset;
  if (input.amount_atomic) body.amount_atomic = input.amount_atomic;
  if (options.apiKey) body.api_key = options.apiKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await doFetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Paddock-Integration": integration
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (res.status !== 200) {
      return { ok: false, error: new Error(`Paddock check_payee returned HTTP ${res.status}`) };
    }
    const json = (await res.json()) as CheckPayeeResult | null;
    if (!json || typeof json !== "object" || !VERDICTS.includes(json.verdict as string)) {
      return { ok: false, error: new Error("Paddock check_payee returned an unrecognised verdict") };
    }
    return { ok: true, value: json };
  } catch (error) {
    return { ok: false, error };
  } finally {
    clearTimeout(timer);
  }
}

export function paddockGuard(options: PaddockGuardOptions = {}): BeforePaymentCreationHook {
  const blockOn = options.blockOn ?? "fail";

  return async (context: PaymentCreationContext) => {
    try {
      const req = context.selectedRequirements as unknown as Record<string, unknown>;
      const url = context.paymentRequired?.resource?.url;
      const payTo = req?.payTo as string | undefined;
      const network = req?.network as string | undefined;
      if (!url || !payTo || !network) {
        safeCall(options.onError, new Error("Paddock guard skipped: url, pay_to or network missing"));
        return;
      }

      const amount = (req.amount ?? req.maxAmountRequired) as string | undefined;
      const outcome = await request(
        {
          url,
          pay_to: payTo,
          network,
          asset: req.asset as string | undefined,
          amount_atomic: amount === undefined ? undefined : String(amount)
        },
        options
      );
      if (!outcome.ok) {
        safeCall(options.onError, outcome.error);
        return;
      }

      const result = outcome.value;
      safeCall(options.onResult, result, context);

      const fullCheck = result.full_check || DEFAULT_FULL_CHECK;
      if (result.block_recommended === true) {
        return {
          abort: true as const,
          reason: `Paddock check_payee: this wallet is recorded as settling for a different seller, so the payment was stopped before signing. Details: ${fullCheck}`
        };
      }
      if (blockOn === "warn" && result.verdict === "warn") {
        const detail = result.reasons?.[0]?.detail ?? "";
        return {
          abort: true as const,
          reason: `Paddock check_payee: ${detail} The payment was stopped before signing because blockOn is set to warn. Details: ${fullCheck}`
        };
      }
    } catch (error) {
      safeCall(options.onError, error);
    }
  };
}

export function withPaddockGuard<
  T extends { onBeforePaymentCreation(h: BeforePaymentCreationHook): T }
>(client: T, options: PaddockGuardOptions = {}): T {
  client.onBeforePaymentCreation(paddockGuard(options));
  return client;
}
