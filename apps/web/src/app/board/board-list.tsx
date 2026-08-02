"use client";

import { FEEDBACK_STATUSES } from "@feedbackport/core";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

interface FeedbackListItem {
  id: string;
  title: string;
  body: string | null;
  status: string;
  submitter_email: string;
  created_at: string;
  votes: { count: number }[];
}

// TODO（见 docs/ROADMAP.md Phase 0，跟 packages/widget/src/main.ts 的同名 TODO 一致）：
// 接入真实 Cloudflare Turnstile 脚本获取 token，上线前必须替换。
function getTurnstileToken(): Promise<string> {
  return Promise.resolve("__TODO_TURNSTILE_TOKEN__");
}

export function BoardList({ productSlug }: { productSlug: string }) {
  const [items, setItems] = useState<FeedbackListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/feedback?${params.toString()}`);
    const data = await res.json();
    setItems(res.ok ? (data.items ?? []) : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function vote(feedbackId: string) {
    const email = window.prompt("你的邮箱（用于投票去重，不会公开展示）：");
    if (!email) return;

    const turnstileToken = await getTurnstileToken();
    await fetch(`/api/feedback/${feedbackId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug, voterEmail: email, turnstileToken }),
    });
    void load();
  }

  return (
    <main>
      <h1>反馈面板</h1>

      <SubmitForm productSlug={productSlug} onSubmitted={load} />

      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
        <option value="">全部状态</option>
        {FEEDBACK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>还没有反馈，来提第一条吧。</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/board/${item.id}`}>{item.title}</Link>
              {" — "}
              {item.votes?.[0]?.count ?? 0} 票 · {item.status}
              <button type="button" onClick={() => void vote(item.id)}>
                投票
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function SubmitForm({ productSlug, onSubmitted }: { productSlug: string; onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const turnstileToken = await getTurnstileToken();
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug,
        title,
        body: body || undefined,
        submitterEmail: email,
        turnstileToken,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("提交失败，稍后再试");
      return;
    }

    setTitle("");
    setBody("");
    onSubmitted();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>有想法？说给我们听</h2>
      <input
        required
        maxLength={120}
        placeholder="一句话描述你的想法"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        maxLength={2000}
        placeholder="更多细节（选填）"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <input
        required
        type="email"
        placeholder="你的邮箱"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button type="submit" disabled={submitting}>
        提交
      </button>
      {error && <p>{error}</p>}
    </form>
  );
}
