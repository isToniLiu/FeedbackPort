"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Reply {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
}

interface FeedbackDetail {
  id: string;
  title: string;
  body: string | null;
  status: string;
  submitter_email: string;
  created_at: string;
  replies: Reply[];
}

// TODO：跟 board-list.tsx / packages/widget/src/main.ts 的同名 TODO 一致，
// 接入真实 Cloudflare Turnstile 前先用占位 token 跑通端到端流程。
function getTurnstileToken(): Promise<string> {
  return Promise.resolve("__TODO_TURNSTILE_TOKEN__");
}

export function BoardDetail({ feedbackId, productSlug }: { feedbackId: string; productSlug: string }) {
  const [item, setItem] = useState<FeedbackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/feedback/${feedbackId}`);
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setItem(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId]);

  async function vote() {
    const email = window.prompt("你的邮箱（用于投票去重，不会公开展示）：");
    if (!email) return;

    const turnstileToken = await getTurnstileToken();
    await fetch(`/api/feedback/${feedbackId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug, voterEmail: email, turnstileToken }),
    });
  }

  if (loading) return <p>Loading…</p>;
  if (notFound || !item) return <p>没找到这条反馈。</p>;

  return (
    <main>
      <p>
        <Link href="/board">← 返回列表</Link>
      </p>
      <h1>{item.title}</h1>
      <p>
        状态：{item.status} · 提交者：{item.submitter_email}
      </p>
      {item.body && <p>{item.body}</p>}
      <button type="button" onClick={() => void vote()}>
        投票
      </button>

      <h2>回复</h2>
      {item.replies.length === 0 ? (
        <p>还没有回复。</p>
      ) : (
        <ul>
          {item.replies.map((reply) => (
            <li key={reply.id}>
              {reply.is_admin && <strong>[官方回复] </strong>}
              {reply.body}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
