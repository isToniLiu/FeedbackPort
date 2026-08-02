import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 绑定当前请求 cookies 的 Supabase 客户端，用于 Server Component / Route Handler
 * 读取管理员登录态。跟 supabase-admin.ts 的 service-role 客户端是两回事——
 * 这个客户端受 RLS 约束，只代表"当前登录用户"这一个身份，不能绕过权限。
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component 里 cookies() 是只读的，写入会抛错——没关系，
          // session 刷新已经在 middleware.ts 里做了，这里静默忽略即可
        }
      },
    },
  });
}
