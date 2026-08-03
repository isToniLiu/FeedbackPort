import { describe, expect, it } from "vitest";
import { readConfig, WidgetConfigError } from "./config";

function makeScript(dataset: Record<string, string>): HTMLScriptElement {
  const script = document.createElement("script");
  for (const [key, value] of Object.entries(dataset)) {
    script.dataset[key] = value;
  }
  return script;
}

describe("readConfig", () => {
  it("解析必填的 productSlug 和 turnstileSiteKey", () => {
    const config = readConfig(makeScript({ product: "cardwhisper", turnstileSiteKey: "1x00000000000000000000AA" }));
    expect(config.productSlug).toBe("cardwhisper");
    expect(config.turnstileSiteKey).toBe("1x00000000000000000000AA");
    expect(config.userEmail).toBeUndefined();
  });

  it("解析可选的 userEmail 和 apiBase", () => {
    const config = readConfig(
      makeScript({
        product: "cardwhisper",
        turnstileSiteKey: "1x00000000000000000000AA",
        userEmail: "a@b.com",
        apiBase: "https://api.example.com",
      }),
    );
    expect(config.userEmail).toBe("a@b.com");
    expect(config.apiBase).toBe("https://api.example.com");
  });

  it("缺少 data-product 时抛出 WidgetConfigError", () => {
    expect(() => readConfig(makeScript({ turnstileSiteKey: "1x00000000000000000000AA" }))).toThrow(
      WidgetConfigError,
    );
  });

  it("缺少 data-turnstile-site-key 时抛出 WidgetConfigError", () => {
    expect(() => readConfig(makeScript({ product: "cardwhisper" }))).toThrow(WidgetConfigError);
  });

  it("script 为 null 时抛出 WidgetConfigError", () => {
    expect(() => readConfig(null)).toThrow(WidgetConfigError);
  });
});
