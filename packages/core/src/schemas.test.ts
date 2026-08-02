import { describe, expect, it } from "vitest";
import { slugSchema, submitFeedbackSchema, voteFromWidgetSchema } from "./schemas.js";

describe("slugSchema", () => {
  it("接受小写字母数字连字符", () => {
    expect(slugSchema.safeParse("cardwhisper").success).toBe(true);
    expect(slugSchema.safeParse("card-whisper").success).toBe(true);
  });

  it("拒绝大写、空格、下划线", () => {
    expect(slugSchema.safeParse("CardWhisper").success).toBe(false);
    expect(slugSchema.safeParse("card whisper").success).toBe(false);
    expect(slugSchema.safeParse("card_whisper").success).toBe(false);
  });
});

describe("submitFeedbackSchema", () => {
  const base = {
    productSlug: "cardwhisper",
    title: "希望支持深色模式",
    submitterEmail: "user@example.com",
    turnstileToken: "token",
  };

  it("接受最小合法输入", () => {
    expect(submitFeedbackSchema.safeParse(base).success).toBe(true);
  });

  it("拒绝非法邮箱", () => {
    const result = submitFeedbackSchema.safeParse({ ...base, submitterEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("拒绝超长标题", () => {
    const result = submitFeedbackSchema.safeParse({ ...base, title: "a".repeat(121) });
    expect(result.success).toBe(false);
  });
});

describe("voteFromWidgetSchema", () => {
  it("要求带 productSlug", () => {
    const result = voteFromWidgetSchema.safeParse({
      voterEmail: "user@example.com",
      turnstileToken: "token",
    });
    expect(result.success).toBe(false);
  });
});
