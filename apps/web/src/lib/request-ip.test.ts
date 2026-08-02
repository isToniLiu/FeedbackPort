import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { getClientIp, hashIp } from "./request-ip";

function makeRequest(headers: Record<string, string>): NextRequest {
  return new NextRequest("https://example.com/api/feedback", { headers });
}

describe("getClientIp", () => {
  it("取 x-forwarded-for 的第一个地址", () => {
    const ip = getClientIp(makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }));
    expect(ip).toBe("1.2.3.4");
  });

  it("没有 x-forwarded-for 时退回 x-real-ip", () => {
    const ip = getClientIp(makeRequest({ "x-real-ip": "9.8.7.6" }));
    expect(ip).toBe("9.8.7.6");
  });

  it("两者都没有时返回 unknown", () => {
    const ip = getClientIp(makeRequest({}));
    expect(ip).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("相同输入产生相同哈希", async () => {
    const a = await hashIp("1.2.3.4");
    const b = await hashIp("1.2.3.4");
    expect(a).toBe(b);
  });

  it("不同输入产生不同哈希，且不直接包含原始 IP", async () => {
    const a = await hashIp("1.2.3.4");
    const b = await hashIp("4.3.2.1");
    expect(a).not.toBe(b);
    expect(a).not.toContain("1.2.3.4");
  });
});
