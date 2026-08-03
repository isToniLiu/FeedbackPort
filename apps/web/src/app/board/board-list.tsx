"use client";

import { FEEDBACK_STATUSES } from "@feedbackport/core";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getTurnstileToken } from "@/lib/turnstile-client";
import { VoteButton } from "./vote-button";

interface FeedbackListItem {
  id: string;
  title: string;
  body: string | null;
  status: string;
  submitter_email: string;
  created_at: string;
  votes: { count: number }[];
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
              <VoteButton productSlug={productSlug} feedbackId={item.id} onVoted={load} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function SubmitForm({ productSlug, onSubmitted }: { productSlug: string; onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!TURNSTILE_SITE_KEY || !turnstileContainerRef.current) {
      setError("Turnstile 未配置（NEXT_PUBLIC_TURNSTILE_SITE_KEY），无法提交");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const turnstileToken = await getTurnstileToken(turnstileContainerRef.current, TURNSTILE_SITE_KEY);
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

      if (!res.ok) throw new Error("submit failed");

      setTitle("");
      setBody("");
      onSubmitted();
    } catch {
      setError("提交失败，稍后再试");
    } finally {
      setSubmitting(false);
    }
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
      <div ref={turnstileContainerRef} />
      <button type="submit" disabled={submitting}>
        提交
      </button>
      {error && <p>{error}</p>}
    </form>
  );
}
