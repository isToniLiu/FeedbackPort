import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

/**
 * 从子域名解析租户 slug，注入 x-tenant-slug 请求头供下游 API Routes / Server Components 使用。
 *
 * 这里只做字符串解析，不查库——product_id 的解析与缓存放在 API 层做
 * （TODO，见 docs/ARCHITECTURE.md「多租户路由设计」），避免每个请求（含静态资源）
 * 都触发一次数据库查询。
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const slug = extractTenantSlug(hostname) ?? process.env.DEFAULT_TENANT_SLUG ?? null;

  const requestHeaders = new Headers(request.headers);
  if (slug) {
    requestHeaders.set("x-tenant-slug", slug);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

/** 形如 cardwhisper.board.域名.com -> "cardwhisper"；本地开发用 DEFAULT_TENANT_SLUG 兜底 */
function extractTenantSlug(hostname: string): string | null {
  const [first, second] = hostname.split(".");
  if (!first || second !== "board") return null;
  if (first === "www") return null;
  return first;
}
