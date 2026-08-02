"use client";

import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * 管理后台登录页，故意放在 /login 而不是 /admin/login——如果放进 app/admin/ 目录，
 * 会被 admin/layout.tsx 的登录态检查连带保护，导致未登录时重定向到自己，死循环。
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");

    const supabase = getSupabaseBrowserClient();
    // shouldCreateUser: false —— 只有 Supabase 项目里已存在的管理员账号能登录，
    // 防止任意邮箱靠 magic link 自助注册，见 docs/ARCHITECTURE.md「安全边界」
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return <p>登录链接已经发到 {email}，去邮箱里点一下。</p>;
  }

  return (
    <main>
      <h1>管理后台登录</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" disabled={status === "sending"}>
          发送登录链接
        </button>
      </form>
      {status === "error" && <p>发送失败——确认这个邮箱已经在 Supabase 项目里建好管理员账号。</p>}
    </main>
  );
}
