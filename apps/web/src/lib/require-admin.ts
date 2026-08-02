import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "./supabase-server";

/**
 * 管理端 API Route 的登录态校验。没有角色系统——项目层面只有一个管理员账号
 * （在 Supabase 项目里手动创建，登录页 signInWithOtp 用 shouldCreateUser: false
 * 挡住自助注册），登录态存在即视为管理员。
 *
 * 用法：`const { user, response } = await requireAdmin(); if (!user) return response;`
 */
export async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  return { user, response: null };
}
