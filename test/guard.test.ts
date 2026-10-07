import { describe, it, expect, vi } from "vitest";
import { x402Client } from "@x402/core/client";
import { paddockGuard, withPaddockGuard, checkPayee } from "../src/index";

const FULL = "https://paddock.finance/verify/example.com";

function ctx(over: Record<string, unknown> = {}, resourceUrl: string | null = "https://example.com/x") {
  return {
    paymentRequired: {
      x402Version: 2,
      resource: resourceUrl === null ? undefined : { url: resourceUrl },
      accepts: []
    },
    selectedRequirements: {
      scheme: "exact",
      network: "eip155:8453",
      asset: "0xasset",
      amount: "10000",
      payTo: "0xabc",
      maxTimeoutSeconds: 60,
      extra: {},
      ...over
    }
  } as any;
}

function reply(body: unknown, status = 200) {
  return vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status }));
}

const res = (verdict: string, block = false, extra: Record<string, unknown> = {}) => ({
  verdict,
  block_recommended: block,
  reasons: [{ code: "c", detail: "Wallet not seen for this seller yet." }],
  full_check: FULL,
  ...extra
});

describe("verdicts", () => {
  for (const v of ["pass", "warn", "unknown"]) {
    it(`${v} goes through`, async () => {
      const onResult = vi.fn();
      const out = await paddockGuard({ fetch: reply(res(v)), onResult })(ctx());
      expect(out).toBeUndefined();
      expect(onResult).toHaveBeenCalledTimes(1);
    });
  }

  it("fail aborts with the exact reason", async () => {
    const out = await paddockGuard({ fetch: reply(res("fail", true)) })(ctx());
    expect(out).toEqual({
      abort: true,
      reason: `Paddock check_payee: this wallet is recorded as settling for a different seller, so the payment was stopped before signing. Details: ${FULL}`
    });
  });

  it("fail with no full_check falls back to the verify page", async () => {
    const out: any = await paddockGuard({ fetch: reply(res("fail", true, { full_check: undefined })) })(ctx());
    expect(out.reason.endsWith("Details: https://paddock.finance/verify")).toBe(true);
  });

  it("blockOn warn aborts on warn with the exact reason", async () => {
    const out = await paddockGuard({ blockOn: "warn", fetch: reply(res("warn")) })(ctx());
    expect(out).toEqual({
      abort: true,
      reason: `Paddock check_payee: Wallet not seen for this seller yet. The payment was stopped before signing because blockOn is set to warn. Details: ${FULL}`
    });
  });

  it("blockOn warn still lets pass through", async () => {
    expect(await paddockGuard({ blockOn: "warn", fetch: reply(res("pass")) })(ctx())).toBeUndefined();
  });
});

describe("fails open", () => {
  const cases: Array<[string, () => typeof fetch]> = [
    ["timeout", () => vi.fn((_u: any, init: any) => new Promise((_r, rej) => {
      init.signal.addEventListener("abort", () => rej(new Error("aborted")));
    })) as any],
    ["network error", () => vi.fn(async () => { throw new Error("ECONNRESET"); }) as any],
    ["402", () => reply({ error: "pay" }, 402) as any],
    ["401", () => reply({ error: "key" }, 401) as any],
    ["400", () => reply({ error: "missing" }, 400) as any],
    ["500", () => reply("oops", 500) as any],
    ["malformed JSON", () => reply("not json{") as any],
    ["unknown verdict", () => reply({ verdict: "maybe", block_recommended: true }) as any]
  ];
  for (const [name, make] of cases) {
    it(`${name} goes through and calls onError`, async () => {
      const onError = vi.fn();
      const out = await paddockGuard({ fetch: make(), onError, timeoutMs: 20 })(ctx());
      expect(out).toBeUndefined();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  }

  it("checkPayee returns null on failure", async () => {
    const r = await checkPayee({ url: "https://e.com", pay_to: "0x1", network: "base" }, { fetch: reply("x", 500) as any });
    expect(r).toBeNull();
  });
});

describe("mapping and request", () => {
  it("missing url skips the call and goes through", async () => {
    const f = reply(res("fail", true));
    const onError = vi.fn();
    const out = await paddockGuard({ fetch: f as any, onError })(ctx({}, null));
    expect(out).toBeUndefined();
    expect(f).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("v1 maxAmountRequired fallback", async () => {
    const f = reply(res("pass"));
    await paddockGuard({ fetch: f as any })(ctx({ amount: undefined, maxAmountRequired: "777" }));
    const body = JSON.parse((f.mock.calls[0] as any)[1].body);
    expect(body.amount_atomic).toBe("777");
  });

  it("sends the documented body, headers and endpoint", async () => {
    const f = reply(res("pass"));
    await paddockGuard({ fetch: f as any })(ctx());
    const [url, init] = f.mock.calls[0] as any;
    expect(url).toBe("https://paddock.finance/api/mcp/check-payee");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Paddock-Integration"]).toBe("x402-guard");
    expect(JSON.parse(init.body)).toEqual({
      url: "https://example.com/x",
      pay_to: "0xabc",
      network: "eip155:8453",
      asset: "0xasset",
      amount_atomic: "10000"
    });
    expect(Object.keys(init.headers).some((h) => /payment/i.test(h))).toBe(false);
  });

  it("custom integration and endpoint", async () => {
    const f = reply(res("pass"));
    await paddockGuard({ fetch: f as any, integration: "mine", endpoint: "https://x.test/c" })(ctx());
    const [url, init] = f.mock.calls[0] as any;
    expect(url).toBe("https://x.test/c");
    expect(init.headers["X-Paddock-Integration"]).toBe("mine");
  });

  it("apiKey is sent as api_key", async () => {
    const f = reply(res("pass"));
    await paddockGuard({ fetch: f as any, apiKey: "k123" })(ctx());
    expect(JSON.parse((f.mock.calls[0] as any)[1].body).api_key).toBe("k123");
  });
});

describe("withPaddockGuard", () => {
  it("registers exactly one hook on a real x402Client and returns it", () => {
    const client = new x402Client();
    const spy = vi.spyOn(client, "onBeforePaymentCreation");
    const out = withPaddockGuard(client);
    expect(out).toBe(client);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(typeof spy.mock.calls[0][0]).toBe("function");
  });
});
