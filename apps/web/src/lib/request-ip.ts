import type { NextRequest } from "next/server";

/** Vercel/大多数反向代理会写 x-forwarded-for，取第一个（最靠近客户端的）地址 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** 频率限制不存明文 IP，落库/落 Redis 前先做单向哈希，见 docs/ARCHITECTURE.md */
export async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
