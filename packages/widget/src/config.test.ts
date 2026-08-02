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
  it("解析必填的 productSlug", () => {
    const config = readConfig(makeScript({ product: "cardwhisper" }));
    expect(config.productSlug).toBe("cardwhisper");
    expect(config.userEmail).toBeUndefined();
  });

  it("解析可选的 userEmail 和 apiBase", () => {
    const config = readConfig(
      makeScript({ product: "cardwhisper", userEmail: "a@b.com", apiBase: "https://api.example.com" }),
    );
    expect(config.userEmail).toBe("a@b.com");
    expect(config.apiBase).toBe("https://api.example.com");
  });

  it("缺少 data-product 时抛出 WidgetConfigError", () => {
    expect(() => readConfig(makeScript({}))).toThrow(WidgetConfigError);
  });

  it("script 为 null 时抛出 WidgetConfigError", () => {
    expect(() => readConfig(null)).toThrow(WidgetConfigError);
  });
});
