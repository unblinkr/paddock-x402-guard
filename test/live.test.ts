import { describe, it, expect } from "vitest";
import { checkPayee } from "../src/index";

describe.skipIf(process.env.PADDOCK_LIVE !== "1")("live check_payee", () => {
  it("returns unknown for an unseen seller", async () => {
    const r = await checkPayee(
      { url: "https://example.com/x", pay_to: "0xabc", network: "base" },
      { timeoutMs: 10000 }
    );
    console.log(JSON.stringify(r));
    expect(r?.verdict).toBe("unknown");
    expect(r?.block_recommended).toBe(false);
  });
});
