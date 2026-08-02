import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * service-role 客户端，只能在服务端（API Routes）使用，绕过 RLS。
 * 见 docs/ARCHITECTURE.md「安全边界」——改状态、写管理员回复只能走这个客户端，
 * 匿名读写走的是各自的 RLS policy，不经过这里。
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
